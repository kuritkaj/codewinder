import {
    CONTEXT,
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
import { BaseLanguageModel } from "langchain/base_language";
import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";

export const CONTEXT_INPUT = "context";
export const MEMORIES_INPUT = "memories";
export const OBJECTIVE_INPUT = "objective";
export const SCRATCHPAD_INPUT = "scratchpad";

interface ReActAgentInput extends ChatAgentInput {
    memory: MemoryStore;
}

export class ReActAgent extends Agent {
    readonly memory: MemoryStore;

    get returnValues(): string[] {
        return ["output"];
    }

    constructor(input: ReActAgentInput) {
        const outputParser = input.outputParser;
        super({
            ...input,
            outputParser
        });

        this.memory = input.memory;
    }

    _agentType() {
        return "react-agent-description" as const;
    }

    observationPrefix() {
        return `${OBSERVATION}:`;
    }

    llmPrefix() {
        return `${THOUGHT}:`;
    }

    _stop(): string[] {
        return [ `${OBSERVATION}:` ];
    }

    async constructScratchPad(steps: AgentStep[]): Promise<string> {
        return steps.reduce(
            (thoughts, { action, observation }) =>
                thoughts +
                [
                    action.log,
                    `${ this.observationPrefix() } ${ observation }`,
                    this.llmPrefix()
                ].join("\n"),
            ""
        );
    }

    static createPrompt(tools: Tool[], args?: ChatCreatePromptArgs) {
        const { prefix = PREFIX, suffix = SUFFIX } = args ?? {};
        const toolDetails = tools
            .map((tool) => `${ tool.name }: ${ tool.description }`)
            .join("\n");
        const tooling = `
You have access to the following tools: ${ tools.map((t) => t.name).join(", ") }.
You may not use any other tools - never make up a tool that isn't on this list.
Here are the details on how to use these tools:
${ toolDetails }
${ TOOLING }
        `;
        const system = [ prefix, tooling, FORMAT_INSTRUCTIONS, suffix ].join("\n");
        const assistant = [`This is the ${CONTEXT}:\n{${CONTEXT_INPUT}}`, `Which reminds you of this:\n{${MEMORIES_INPUT}}`].join("\n\n");
        const human = [ `${ OBJECTIVE }: {${OBJECTIVE_INPUT}}`, `{${SCRATCHPAD_INPUT}}` ].join("\n");
        const messages = [
            SystemMessagePromptTemplate.fromTemplate(system),
            AIMessagePromptTemplate.fromTemplate(assistant),
            HumanMessagePromptTemplate.fromTemplate(human)
        ];
        return ChatPromptTemplate.fromPromptMessages(messages);
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
        const memories = await this.memory.retrieve(inputs[OBJECTIVE_INPUT]);

        const newInputs: ChainValues = {
            ...inputs
        };
        newInputs[MEMORIES_INPUT] = memories.map((m) => m.pageContent).join("\n");
        newInputs[SCRATCHPAD_INPUT] = thoughts;

        if (this._stop().length !== 0) {
            newInputs.stop = this._stop();
        }

        try {
            const output = await this.llmChain.predict(newInputs, callbackManager);
            return this.outputParser.parse(output);
        } catch (e) {
            console.error("Error in LLMChain.predict:", e);
            return this.outputParser.parse("");
        }
    }

    static makeAgent(model: BaseLanguageModel, memory: MemoryStore, tools: Tool[], callbacks: Callbacks): ReActAgent {
        ReActAgent.validateTools(tools);
        const prompt = ReActAgent.createPrompt(tools);
        const chain = new LLMChain({
            prompt,
            llm: model,
            callbacks,
        });

        return new ReActAgent({
            llmChain: chain,
            memory,
            outputParser: ReActAgentActionOutputParser.makeParser(memory),
            allowedTools: tools.map((t) => t.name),
        });
    }

    static validateTools(tools: Tool[]) {
        const invalidTool = tools.find((tool) => !tool.description);
        if (invalidTool) {
            const msg = `
                Got a tool ${ invalidTool.name } without a description.
                This agent requires descriptions for all tools.
            `;
            throw new Error(msg);
        }
    }
}

interface ReActAgentInput extends OutputParserArgs {
    finishToolName?: string;
    memory: MemoryStore;
}

export class ReActAgentActionOutputParser extends AgentActionOutputParser {
    readonly finishToolName: string;
    readonly memory: MemoryStore;

    constructor(input: ReActAgentInput) {
        super();

        this.finishToolName = input.finishToolName || FINAL_RESPONSE;
        this.memory = input.memory;
    }

    async parse(text: string) {
        const responder = async (response: string) => {
            await this.memory.storeText(response);
            return { returnValues: { output: `${ response }` }, log: response };
        }

        if (text.includes(`${ FINAL_RESPONSE }:`)) {
            const parts = text.split(`${ FINAL_RESPONSE }:`);
            const output = parts[parts.length - 1].trim();
            return await responder(output);
        }

        const [ _, action, __ ] = text.split(/```(?:json)?/g);
        if (!action) {
            return await responder(text);
        }

        try {
            const correct = (jsonStr) => { return jsonStr.trim().replace(/(, *[\]}])|(}+|]+)[^}\]]*$/g, '$1$2');}
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

    static makeParser(memory: MemoryStore, finishToolName?: string) {
        // Why does this require the llmChain?
        return new ReActAgentActionOutputParser({ llmChain: undefined, memory, finishToolName });
    }
}