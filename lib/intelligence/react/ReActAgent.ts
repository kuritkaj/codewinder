import {
    FINAL_RESPONSE,
    FORMAT_INSTRUCTIONS,
    OBJECTIVE,
    OBSERVATION,
    PREFIX,
    SUFFIX,
    THOUGHT,
    TOOLING
} from "@/lib/intelligence/react/prompts";
import { Agent, ChatCreatePromptArgs, OutputParserArgs } from "langchain/agents";
import { Tool } from "langchain/tools";
import {
    AIMessagePromptTemplate,
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate
} from "langchain/prompts";
import { AgentAction, AgentFinish, AgentStep, ChainValues } from "langchain/schema";
import { LLMChain } from "langchain";
import { CallbackManager, Callbacks } from "langchain/callbacks";
import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";
import { ReActAgentActionOutputParser } from "@/lib/intelligence/react/ReActAgentOutputParser";
import { BaseLanguageModel } from "langchain/base_language";
import { Reviser } from "@/lib/intelligence/chains/Reviser";

export const CONTEXT_INPUT = "context";
export const MEMORIES_INPUT = "memories";
export const OBJECTIVE_INPUT = "objective";
export const SCRATCHPAD_INPUT = "scratchpad";
export const TOOL_INPUT = "tools";

interface ReActAgentInput {
    creativeChain: LLMChain;
    llmChain: LLMChain;
    memory: MemoryStore;
    tools: Tool[];
}

export class ReActAgent extends Agent {
    readonly creativeChain: LLMChain;
    readonly memory: MemoryStore;
    readonly tools: Tool[];

    constructor({ creativeChain, llmChain, memory, tools }: ReActAgentInput) {
        const outputParser = ReActAgent.getDefaultOutputParser();
        super({
            llmChain,
            outputParser,
            allowedTools: tools.map((t) => t.name)
        });

        this.creativeChain = creativeChain;
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

    static createPrompt(tools: Tool[], args?: ChatCreatePromptArgs) {
        const { prefix = PREFIX, suffix = SUFFIX } = args ?? {};

        const system = [
            prefix,
            TOOLING,
            `Allowed tools:\n{${ TOOL_INPUT }}`,
            FORMAT_INSTRUCTIONS,
            suffix
        ].join("\n");
        const assistant = [
            `This is the previous conversation: {${ CONTEXT_INPUT }}`,
            `Which triggered this memory: {${ MEMORIES_INPUT }}`
        ].join("\n\n");
        const human = [
            `Begin!`,
            `${ OBJECTIVE }: {${ OBJECTIVE_INPUT }}`,
            `{${ SCRATCHPAD_INPUT }}`
        ].join("\n\n");
        const messages = [
            SystemMessagePromptTemplate.fromTemplate(system),
            AIMessagePromptTemplate.fromTemplate(assistant),
            HumanMessagePromptTemplate.fromTemplate(human)
        ];
        return ChatPromptTemplate.fromPromptMessages(messages);
    }

    static getDefaultOutputParser(_fields?: OutputParserArgs) {
        return new ReActAgentActionOutputParser(_fields);
    }

    /**
     * Decide what to do provided some input.
     *
     * @param steps - Steps the LLM has taken so far, along with observations from each.
     * @param inputs - User inputs.
     * @param callbackManager - Callback manager to use for this call.
     *
     * @returns Action specifying what tool to use.
     */
    async plan(
        steps: AgentStep[],
        inputs: ChainValues,
        callbackManager?: CallbackManager
    ): Promise<AgentAction | AgentFinish> {
        const thoughts = await this.constructScratchPad(steps);
        const memories = await this.memory.retrieveSnippet(inputs[OBJECTIVE_INPUT], 0.85);
        const tooling = this.tools
            .map((tool) => `${ tool.name }: ${ tool.description }`)
            .join("\n");

        const newInputs: ChainValues = {
            ...inputs
        };

        newInputs[MEMORIES_INPUT] = memories.map((m) => m.pageContent).join("\n");
        newInputs[SCRATCHPAD_INPUT] = [ thoughts, this.llmPrefix() ].join("\n");
        newInputs[TOOL_INPUT] = tooling;

        if (this._stop().length !== 0) {
            newInputs.stop = this._stop();
        }

        try {
            // On the first call to plan, update the objective.
            // This directly modifies the initial inputs, not newInputs as below.
            if (steps.length === 0) {
                // Revise the provided objective to be more specific
                inputs[OBJECTIVE_INPUT] = await Reviser.makeChain({
                    model: this.creativeChain.llm,
                    callbacks: callbackManager
                }).evaluate({ objective: inputs[OBJECTIVE_INPUT] });
            }

            // Use the base chain for evaluating the right tool to use.
            const output = await this.llmChain.predict(newInputs, callbackManager);
            const action = await this.outputParser.parse(output);

            // If we're calling to use a tool, then parse the output normally.
            // Otherwise, switch from the baseChain to the creativeChain for the final output.
            if ("tool" in action) {
                // This is an action
                return this.outputParser.parse(output);
            } else {
                // This is a final response.
                const finalInputs: ChainValues = {
                    ...newInputs
                };
                finalInputs[MEMORIES_INPUT] = memories.map((m) => m.pageContent).join("\n");
                // append the prefix to the scratchpad
                finalInputs[SCRATCHPAD_INPUT] = [ thoughts, this.finalPrefix() ].join("\n");

                // Here we use the creative chain to generate a final response.
                const finalOutput = await this.creativeChain.predict(finalInputs, callbackManager);
                return this.outputParser.parse(finalOutput);
            }
        } catch (e) {
            console.error("Error in LLMChain.predict:", e);
            return this.outputParser.parse("Error in LLMChain.predict");
        }
    }

    static makeAgent({
                         model,
                         creative,
                         memory,
                         tools,
                         callbacks
                     }: { model: BaseLanguageModel, creative: BaseLanguageModel, memory: MemoryStore, tools: Tool[], callbacks: Callbacks }): ReActAgent {
        ReActAgent.validateTools(tools);
        const prompt = ReActAgent.createPrompt(tools);
        const llmChain = new LLMChain({
            prompt,
            llm: model,
            callbacks,
        });
        const creativeChain = new LLMChain({
            prompt,
            llm: creative,
            callbacks
        });

        return new ReActAgent({
            llmChain,
            creativeChain,
            memory,
            tools,
        });
    }

    /**
     * Prepare the agent for output, if needed
     */
    async prepareForOutput(
        _returnValues: AgentFinish["returnValues"],
        _steps: AgentStep[]
    ): Promise<AgentFinish["returnValues"]> {
        return {};
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