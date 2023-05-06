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
import {
    Agent,
    AgentActionOutputParser,
    ChatAgentInput,
    ChatCreatePromptArgs,
    OutputParserArgs
} from "langchain/agents";
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
import { BaseChatModel } from "langchain/dist/chat_models/base";

export const CONTEXT_INPUT = "context";
export const MEMORIES_INPUT = "memories";
export const OBJECTIVE_INPUT = "objective";
export const SCRATCHPAD_INPUT = "scratchpad";

interface ReActAgentInput extends ChatAgentInput {
    creativeChain: LLMChain
    memory: MemoryStore;
}

export class ReActAgent extends Agent {
    creativeChain: LLMChain;
    memory: MemoryStore;

    constructor(input: ReActAgentInput) {
        const outputParser =
            input?.outputParser ?? ReActAgent.getDefaultOutputParser();
        super({
            ...input,
            outputParser
        });

        this.creativeChain = input.creativeChain;
        this.memory = input.memory;
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
        return [ `${ OBSERVATION }:`, `${ FINAL_RESPONSE }` ];
    }

    async constructScratchPad(steps: AgentStep[]): Promise<string> {
        return steps.reduce((thoughts, { action, observation }, index, array) => {
            const isLastElement = index === array.length - 1;
            const separator = isLastElement ? "" : "\n";
            return (
                thoughts +
                [
                    action.log,
                    `${ this.observationPrefix() } ${ observation }`,
                    isLastElement ? "" : this.llmPrefix()
                ].join(separator)
            );
        }, "");
    }

    static createPrompt(tools: Tool[], args?: ChatCreatePromptArgs) {
        const { prefix = PREFIX, suffix = SUFFIX } = args ?? {};
        const toolDetails = tools
            .map((tool) => `${ tool.name }: ${ tool.description }`)
            .join("\n");
        const tooling = [ `Allowed tools: ${ tools.map((t) => t.name).join(", ") }`,
            "Tool instructions:", `${ toolDetails }`, `${ TOOLING }` ].join("\n");

        const system = [ prefix, tooling, FORMAT_INSTRUCTIONS, suffix ].join("\n");
        const assistant = [ `Here's the previous conversation: {${ CONTEXT_INPUT }}`, `Which triggered this memory: {${ MEMORIES_INPUT }}` ].join("\n\n");
        const human = [ `Begin!`, `${ OBJECTIVE }: {${ OBJECTIVE_INPUT }}`, `{${ SCRATCHPAD_INPUT }}` ].join("\n\n");
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

        const newInputs: ChainValues = {
            ...inputs
        };
        newInputs[MEMORIES_INPUT] = memories.map((m) => m.pageContent).join("\n");
        // append the prefix to the scratchpad
        newInputs[SCRATCHPAD_INPUT] = [ thoughts, this.llmPrefix() ].join("\n");

        if (this._stop().length !== 0) {
            newInputs.stop = this._stop();
        }

        try {
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
                    ...inputs
                };
                finalInputs[MEMORIES_INPUT] = memories.map((m) => m.pageContent).join("\n");
                // append the prefix to the scratchpad
                finalInputs[SCRATCHPAD_INPUT] = [ thoughts, this.finalPrefix() ].join("\n");

                // Here we use the creative chain to generate a response.
                const finalOutput = await this.creativeChain.predict(finalInputs, callbackManager);
                return this.outputParser.parse(finalOutput);
            }
        } catch (e) {
            console.error("Error in LLMChain.predict:", e);
            return this.outputParser.parse("Error in LLMChain.predict");
        }
    }

    static makeAgent(model: BaseChatModel, creative: BaseChatModel, memory: MemoryStore, tools: Tool[], callbacks: Callbacks): ReActAgent {
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
            outputParser: ReActAgent.getDefaultOutputParser(),
            allowedTools: tools.map((t) => t.name),
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

export class ReActAgentActionOutputParser extends AgentActionOutputParser {
    finishToolName: string;

    constructor(fields?: OutputParserArgs) {
        super();
        this.finishToolName = fields?.finishToolName || FINAL_RESPONSE;
    }

    responsePrefix() {
        return `${ FINAL_RESPONSE }:`;
    }

    async parse(text: string): Promise<AgentAction | AgentFinish> {
        const responder = async (response: string) => {
            return { returnValues: { output: `${ response }` }, log: response };
        }

        if (text.includes(`${ this.responsePrefix() }`)) {
            const parts = text.split(`${ this.responsePrefix() }`);
            const output = parts[parts.length - 1].trim();
            return await responder(output);
        }

        const [ _, action, __ ] = text.split(/```(?:json)?/g);
        if (!action) {
            return await responder(text);
        }

        try {
            const correct = (jsonStr) => {
                return jsonStr.trim().replace(/(, *[\]}])|(}+|]+)[^}\]]*$/g, '$1$2');
            }
            const response = JSON.parse(correct(action));
            if (!response || !response.action || !response.action_input) return await responder(text);
            return {
                tool: response.action,
                toolInput: typeof response.action_input === 'string' ? response.action_input : JSON.stringify(response.action_input),
                log: text,
            };
        } catch {
            return await responder(text);
        }
    }

    getFormatInstructions(): string {
        return FORMAT_INSTRUCTIONS;
    }
}