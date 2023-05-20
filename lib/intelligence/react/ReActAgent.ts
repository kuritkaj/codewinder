import {
    FINAL_RESPONSE,
    FORMAT_INSTRUCTIONS,
    GUIDANCE,
    MEMORY,
    OBJECTIVE,
    OBSERVATION,
    SYSTEM,
    THOUGHT,
    TOOLING
} from "@/lib/intelligence/react/prompts";
import { Agent, ChatCreatePromptArgs, OutputParserArgs } from "langchain/agents";
import { Tool } from "langchain/tools";
import {
    ChatPromptTemplate,
    HumanMessagePromptTemplate, PromptTemplate,
    SystemMessagePromptTemplate
} from "langchain/prompts";
import { AgentAction, AgentFinish, AgentStep, ChainValues } from "langchain/schema";
import { LLMChain } from "langchain";
import { CallbackManager, Callbacks } from "langchain/callbacks";
import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";
import { ReActAgentActionOutputParser } from "@/lib/intelligence/react/ReActAgentOutputParser";
import { BaseLanguageModel } from "langchain/base_language";

export const CONTEXT_INPUT = "context";
export const OBJECTIVE_INPUT = "objective";
export const SCRATCHPAD_INPUT = "scratchpad";
export const TOOL_INPUT = "tools";

interface ReActChatArgs extends ChatCreatePromptArgs {
    chat: boolean;
}

interface ReActAgentInput {
    creativeChain: LLMChain;
    llmChain: LLMChain;
    maxIterations?: number;
    memory: MemoryStore;
    tools: Tool[];
}

export class ReActAgent extends Agent {
    readonly creativeChain: LLMChain;
    readonly maxIterations: number;
    readonly memory: MemoryStore;
    readonly tools: Tool[];

    constructor({ creativeChain, llmChain, memory, tools, maxIterations }: ReActAgentInput) {
        const outputParser = ReActAgent.getDefaultOutputParser();
        super({
            llmChain,
            outputParser,
            allowedTools: tools.map((t) => t.name)
        });

        this.creativeChain = creativeChain;
        this.maxIterations = maxIterations;
        this.memory = memory;
        this.tools = tools;
    }

    _agentType() {
        return "react-agent-description" as const;
    }

    finalPrefix() {
        return `${ FINAL_RESPONSE }:`;
    }

    llmPrefix() {
        return `${ THOUGHT }:`;
    }

    memoryPrefix() {
        return `${ MEMORY }:`;
    }

    observationPrefix() {
        return `${ OBSERVATION }:`;
    }

    _stop(): string[] {
        return [ `${ OBSERVATION }:`, `${ FINAL_RESPONSE }:` ];
    }

    async constructScratchPad(steps: AgentStep[]): Promise<string> {
        return steps.reduce((thoughts, { action, observation }, index, array) => {
            const isLastElement = index === array.length - 1;
            const separator = isLastElement ? "" : "\n";
            return (
                thoughts +
                [
                    this.llmPrefix(),
                    action.log,
                    `${ this.observationPrefix() } ${ observation }`
                ].join(separator)
            );
        }, "");
    }

    static createPrompt(tools: Tool[], args?: ReActChatArgs) {
        const { prefix = SYSTEM, suffix = GUIDANCE } = args ?? {};

        const system = [
            prefix,
            TOOLING,
            `Allowed tools:\n{${ TOOL_INPUT }}`,
            FORMAT_INSTRUCTIONS,
            suffix
        ].join("\n");
        const human = [
            `${ OBJECTIVE }: {${ OBJECTIVE_INPUT }}`,
            `{${ SCRATCHPAD_INPUT }}`
        ].join("\n");
        const messages = [
            SystemMessagePromptTemplate.fromTemplate(system),
            HumanMessagePromptTemplate.fromTemplate(human)
        ];

        if (args?.chat) return ChatPromptTemplate.fromPromptMessages(messages);
        else return new PromptTemplate({ template: [system, human].join("\n"), inputVariables: [TOOL_INPUT, OBJECTIVE_INPUT, SCRATCHPAD_INPUT] });
    }

    static getDefaultOutputParser(_fields?: OutputParserArgs) {
        return new ReActAgentActionOutputParser(_fields);
    }

    /**
     *  Decide what to do provided some input.
     *
     *  @param steps - Steps the LLM has taken so far, along with observations from each.
     *  @param inputs - User inputs.
     *  @param callbackManager - Callback manager to use for this call.
     *
     *  @returns Action specifying what tool to use of if the plan is complete.
     */
    async plan(
        steps: AgentStep[],
        inputs: ChainValues,
        callbackManager?: CallbackManager
    ): Promise<AgentAction | AgentFinish> {
        const newInputs = await this.prepareInputs(inputs, steps);

        try {
            // Use the base chain for evaluating the right tool to use.
            const output = await this.llmChain.predict(newInputs, callbackManager);
            const action = await this.outputParser.parse(output);

            // If we're calling to use a tool, then parse the output normally.
            // Otherwise, switch from the baseChain to the creativeChain for the final output.
            if ("tool" in action) {
                // This is an action
                return this.outputParser.parse(output);
            } else {
                // Ensure we include the output the previous execution for this final response.
                newInputs[SCRATCHPAD_INPUT] = [ newInputs[SCRATCHPAD_INPUT], output ].join("\n");
                // Only stop on Observations in case this is a fall through from the base chain.
                newInputs.stop = this._stop().pop();
                // Here we use the creative chain to generate a final response.
                const finalOutput = await this.creativeChain.predict(newInputs, callbackManager);
                return this.outputParser.parse(finalOutput);
            }
        } catch (e) {
            console.error("Error in LLMChain.predict:", e);
            return this.outputParser.parse("Error in LLMChain.predict: " + e.message);
        }
    }

    /**
     * Create a new agent based on the provided parameters.
     */
    static makeAgent({
                         model,
                         creative,
                         memory,
                         tools,
                         callbacks,
                         maxIterations = undefined
                     }: { model: BaseLanguageModel, creative: BaseLanguageModel, memory: MemoryStore, tools: Tool[], callbacks: Callbacks, maxIterations?: number }): ReActAgent {
        ReActAgent.validateTools(tools);

        const llmChain = new LLMChain({
            prompt: ReActAgent.createPrompt(tools, { chat: false }),
            llm: model,
            callbacks
        });
        const creativeChain = new LLMChain({
            prompt: ReActAgent.createPrompt(tools, { chat: true }),
            llm: creative,
            callbacks
        });

        return new ReActAgent({
            llmChain,
            creativeChain,
            memory,
            tools,
            maxIterations
        });
    }

    /**
     *  Prepare the agent for output, if needed
     */
    async prepareForOutput(
        _returnValues: AgentFinish["returnValues"],
        _steps: AgentStep[]
    ): Promise<AgentFinish["returnValues"]> {
        return {};
    }

    /**
     *  Prepare the inputs for the next step.
     *
     *  @param steps - Steps the LLM has taken so far, along with observations from each.
     *  @param inputs - User inputs.
     */
    async prepareInputs(inputs: ChainValues, steps: AgentStep[]): Promise<ChainValues> {
        // Define the new inputs, as we'll update/replace some values
        const newInputs: ChainValues = {
            ...inputs
        };

        // Provide the tools and descriptions
        newInputs[TOOL_INPUT] = this.tools.map((tool) => `${ tool.name }: ${ tool.description }`).join("\n");

        // Construct the scratchpad and add it to the inputs
        const thoughts = await this.constructScratchPad(steps);
        const memories = await this.memory.retrieveSnippet(
            steps.length > 0 ? steps.pop().observation : inputs[OBJECTIVE_INPUT],
            0.85
        );
        // If memories were found, then retrieve the page content of the first one (which is the highest scoring).
        let memory = memories && memories.length > 0 ? memories.pop().pageContent : "";

        newInputs[SCRATCHPAD_INPUT] = [
            thoughts,
            `${ this.memoryPrefix() } ${ memory ? memory : "No memories." }`,
            (steps.length + 1 <= (this.maxIterations || Number.MAX_SAFE_INTEGER) ? this.llmPrefix() : this.finalPrefix())
        ].join("\n");

        // Add the appropriate stop phrases for the llm
        if (this._stop().length !== 0) {
            newInputs.stop = this._stop();
        }

        return newInputs;
    }

    static validateTools(tools: Tool[]) {
        const invalidTool = tools.find((tool) => !tool.description);
        if (invalidTool) {
            const msg = `Got a tool ${ invalidTool.name } without a description.` +
                "This agent requires descriptions for all tools.";
            throw new Error(msg);
        }
    }
}