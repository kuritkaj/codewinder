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
import { PromptTemplate } from "langchain/prompts";
import { AgentAction, AgentFinish, AgentStep, ChainValues } from "langchain/schema";
import { LLMChain } from "langchain/chains";
import { CallbackManager, Callbacks } from "langchain/callbacks";
import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";
import { ReActAgentActionOutputParser } from "@/lib/intelligence/react/ReActAgentOutputParser";
import { BaseLanguageModel } from "langchain/base_language";
import { ActionEvaluator } from "@/lib/intelligence/react/ActionEvaluator";
import { MemoryCondenser } from "@/lib/intelligence/react/MemoryCondenser";

export const CONTEXT_INPUT = "context";
export const OBJECTIVE_INPUT = "objective";
export const SCRATCHPAD_INPUT = "scratchpad";
export const TOOLING_INPUT = "tools";

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
    private readonly creativeChain: LLMChain;
    private readonly maxIterations: number;
    private readonly memory: MemoryStore;
    private readonly maxTokens: number;
    private readonly tools: Tool[];

    constructor({ creativeChain, llmChain, memory, tools, maxIterations }: ReActAgentInput) {
        const outputParser = ReActAgent.getDefaultOutputParser();
        super({
            llmChain,
            outputParser,
            allowedTools: tools.map((t) => t.name)
        });

        this.creativeChain = creativeChain;
        this.maxIterations = maxIterations;
        this.maxTokens = 4096 - 1000; // Rough estimate for GPT-3 with room for prompt - https://platform.openai.com/tokenizer
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
                    `${ this.observationPrefix() } \"\"\"${ observation }\"\"\"`
                ].join(separator)
            );
        }, "");
    }

    static createPrompt(tools: Tool[], args?: ReActChatArgs) {
        const { prefix = SYSTEM, suffix = GUIDANCE } = args ?? {};

        const system = [
            prefix,
            TOOLING,
            `Allowed tools:\n{${ TOOLING_INPUT }}`,
            FORMAT_INSTRUCTIONS,
            suffix
        ].join("\n");
        const human = [
            `${ OBJECTIVE }: {${ OBJECTIVE_INPUT }}`,
            `{${ SCRATCHPAD_INPUT }}`
        ].join("\n");

        return new PromptTemplate({
            template: [system, human].join("\n"),
            inputVariables: [CONTEXT_INPUT, OBJECTIVE_INPUT, SCRATCHPAD_INPUT, TOOLING_INPUT]
        });
    }

    async evaluateOutputs(
        action: AgentAction,
        steps: AgentStep[],
        inputs: ChainValues,
        callbackManager?: CallbackManager
    ): Promise<AgentAction | AgentFinish> {
        const critic = ActionEvaluator.makeChain({ model: this.llmChain.llm, callbacks: callbackManager });
        const scratchpad = await this.constructScratchPad(steps);
        const evaluation = await critic.evaluate({
            objective: inputs[OBJECTIVE_INPUT],
            response: action.log,
            scratchpad,
            tools: inputs[TOOLING_INPUT],
        });
        const parsed = await this.outputParser.parse(evaluation);
        // If a new action is provided, then return that. Otherwise, return the original.
        if ("tool" in parsed) {
            return parsed;
        } else {
            return action;
        }
    }

    static getDefaultOutputParser(_fields?: OutputParserArgs) {
        return new ReActAgentActionOutputParser(_fields);
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
            prompt: ReActAgent.createPrompt(tools),
            llm: model,
            callbacks
        });
        const creativeChain = new LLMChain({
            prompt: ReActAgent.createPrompt(tools),
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
        try {
            // Use the base chain for evaluating the right tool to use.
            const output = await this.llmChain.predict(inputs, callbackManager);
            const action = await this.outputParser.parse(output);

            // If we're calling to use a tool, then parse the output normally.
            // Otherwise, switch from the baseChain to the creativeChain for the final output.
            if ("tool" in action) {
                // This is an action
                return action;
            } else {
                // Ensure we include the output the previous execution for this final response.
                inputs[SCRATCHPAD_INPUT] = [ inputs[SCRATCHPAD_INPUT], output ].join("\n");
                // Only stop on Observations in case this is a fall through from the base chain.
                inputs.stop = this._stop().slice(0, 1);
                // Here we use the creative chain to generate a final response.
                const finalOutput = await this.creativeChain.predict(inputs, callbackManager);
                return this.outputParser.parse(finalOutput);
            }
        } catch (e) {
            console.error("Error in LLMChain.predict:", e);
            return this.outputParser.parse("Error in LLMChain.predict: " + e.message);
        }
    }

    async prepareForOutput(_returnValues: AgentFinish["returnValues"], _steps: AgentStep[]): Promise<AgentFinish["returnValues"]> {
        // If there are no steps, then this is a simple greeting or similar.
        // Or, the response was derived from a previous memory and we should not store again.
        if (_steps && _steps.length > 0) {
            const condenser = MemoryCondenser.makeChain({ model: this.llmChain.llm });
            const scratchpad = await this.constructScratchPad(_steps);
            const memory = await condenser.evaluate({
                response: _returnValues.output,
                scratchpad,
            });
            await this.memory.storeTexts([ memory ]);
        }

        return []; // No additional return values, this is just to store the above memory.
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
        newInputs[TOOLING_INPUT] = this.tools.map((tool) => `${ tool.name }: ${ tool.description }`).join("\n");

        // Construct the scratchpad and add it to the inputs
        const thoughts = await this.constructScratchPad(steps);
        const lastStep = steps.length > 0 ? steps[steps.length - 1] : undefined;
        const memories = await this.memory.retrieveSnippet(
            lastStep?.action.toolInput ? lastStep?.action.toolInput : inputs[OBJECTIVE_INPUT],
            0.75
        );
        // If memories were found, then retrieve the page content of the first one (which is the highest scoring).
        const recent = memories && memories.length > 0 ? memories.pop() : undefined;
        const content = recent ? recent.pageContent + " " + JSON.stringify(recent.metadata) : "";
        const memory = `${ this.memoryPrefix() } \"\"\"${ content ? content : "No relevant memories recalled." }\"\"\"`
        const suggestion = (steps.length + 1 <= (this.maxIterations || Number.MAX_SAFE_INTEGER) ? this.llmPrefix() : this.finalPrefix())

        newInputs[SCRATCHPAD_INPUT] = [
            thoughts,
            memory,
            suggestion
        ].join("\n");

        // Add the appropriate stop phrases for the llm
        if (this._stop().length !== 0) {
            newInputs.stop = this._stop();
        }

        const tokenCount = await this.llmChain.llm.getNumTokens([thoughts, memory, suggestion].join("\n"));
        if (tokenCount > this.maxTokens && steps.length > 0) {
            // Remove the first step and try again, recursive call to keep length down.
            return this.prepareInputs(inputs, steps.slice(1));
        } else {
            return newInputs;
        }
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