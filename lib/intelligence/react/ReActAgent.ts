import { FunctionChain } from "@/lib/intelligence/chains/FunctionChain";
import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";
import { CachedPlaceholder } from "@/lib/intelligence/react/CachedPlaceholder";
import { ChatHistoryPlaceholder } from "@/lib/intelligence/react/ChatHistoryPlaceholder";
import { MemoryCondenser } from "@/lib/intelligence/react/MemoryCondenser";
import { ReActAgentOutputParser } from "@/lib/intelligence/react/ReActAgentOutputParser";
import { BaseSingleActionAgent } from "langchain/agents";
import { CallbackManager } from "langchain/callbacks";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { Callbacks } from "langchain/dist/callbacks/manager";
import { ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder, SystemMessagePromptTemplate } from "langchain/prompts";
import {
    AgentAction,
    AgentFinish,
    AgentStep,
    AIChatMessage,
    BaseChatMessage,
    ChainValues,
    FunctionChatMessage,
    HumanChatMessage
} from "langchain/schema";
import { StructuredTool, Tool } from "langchain/tools";

export const CONTEXT_INPUT = "context";
export const MEMORY = "memory";
export const OBJECTIVE_INPUT = "objective";
export const SCRATCHPAD = "scratchpad";

export const FINAL_RESPONSE_PREFIX = "Final Response";

export const SYSTEM = `You are a helpful AI Assistant.
The current date and time is: ${new Date().toLocaleString()}.
Access to the internet and real-time data is available using functions.
`;

export const INSTRUCTIONS = `Instructions:
* Always respond to the user starting with \`${FINAL_RESPONSE_PREFIX}:\`.
* Use CommonMark to format the response (plus markdown tables).
* The response should include inline sources from functions, but you should never make up a url or link.
* Examples of code should always be formatted as a code block with the language specified.`;

interface ReActAgentInput {
    callbacks?: Callbacks;
    llmChain: FunctionChain;
    store: MemoryStore;
    verbose?: boolean;
}

export class ReActAgent extends BaseSingleActionAgent {

    public lc_namespace = ["langchain", "agents", "react"];

    private readonly llmChain: FunctionChain;
    private readonly store: MemoryStore;
    private readonly parser = new ReActAgentOutputParser();

    constructor({callbacks, llmChain, store, verbose}: ReActAgentInput) {
        super({callbacks, verbose});

        this.llmChain = llmChain;
        this.store = store;
    }

    public get inputKeys(): string[] {
        return [OBJECTIVE_INPUT, CONTEXT_INPUT];
    }

    public static createPrompt(): ChatPromptTemplate {
        return ChatPromptTemplate.fromPromptMessages([
            SystemMessagePromptTemplate.fromTemplate(SYSTEM),
            new ChatHistoryPlaceholder(CONTEXT_INPUT),
            HumanMessagePromptTemplate.fromTemplate(INSTRUCTIONS),
            new CachedPlaceholder(MEMORY),
            HumanMessagePromptTemplate.fromTemplate(`{${OBJECTIVE_INPUT}}`),
            new MessagesPlaceholder(SCRATCHPAD),
        ]);
    }

    public static fromLLMAndTools = ({callbacks, function_call, model, store, tools, verbose}: {
        callbacks?: Callbacks,
        function_call?: Tool,
        model: ChatOpenAI,
        store: MemoryStore,
        tools: StructuredTool[],
        verbose?: boolean,
    }) => {
        this.validateTools(tools);
        if (model._modelType() !== "base_chat_model" || model._llmType() !== "openai") {
            throw new Error("OpenAIAgent requires an OpenAI chat model");
        }

        const prompt = this.createPrompt();
        const chain = new FunctionChain({
            callbacks,
            function_call,
            llm: model,
            prompt,
            tools
        });

        return new ReActAgent({
            callbacks,
            llmChain: chain,
            store,
            verbose
        });
    }

    public static validateTools(_tools: StructuredTool[]): void {
    }

    public _agentType() {
        return "openai-functions" as const;
    }

    public _stop(): string[] {
        return [];
    }

    public async constructMemories(
        inputs: ChainValues,
        steps: AgentStep[]
    ): Promise<BaseChatMessage[]> {
        if (steps && steps.length > 0) return []; // The prompt is cached (see createPrompt); no need to generate new memories

        let memories = await this.store.retrieveSnippets(
            inputs[OBJECTIVE_INPUT],
            0.75
        );

        if (memories && memories.length > 0) {
            return [new HumanChatMessage(
                `The following memory can be used as a guide:\n\"\"\"\n${memories[0].pageContent}\n\"\"\"\n` +
                `which was formed on: \`${memories[0].metadata?.created_at}\``
            )];
        } else {
            return [];
        }
    }

    public async constructScratchPad(
        steps: AgentStep[]
    ): Promise<BaseChatMessage[]> {
        return steps.flatMap(({action, observation}) => [
            new AIChatMessage("", {
                function_call: {
                    name: action.tool,
                    arguments: JSON.stringify(action.toolInput),
                },
            }),
            new FunctionChatMessage(observation, action.tool),
        ]);
    }

    public async plan(steps: AgentStep[], inputs: ChainValues, callbackManager?: CallbackManager): Promise<AgentAction | AgentFinish> {
        const memories = await this.constructMemories(inputs, steps);
        const thoughts = await this.constructScratchPad(steps);
        const newInputs = {
            ...inputs,
            [MEMORY]: memories,
            [SCRATCHPAD]: thoughts,
        }

        if (this._stop().length !== 0) {
            newInputs["stop"] = this._stop();
        }

        const message = await this.llmChain.predict(newInputs, callbackManager);
        let plan = await this.parser.parse(message);

        if ("tool" in plan) {
            const tool = plan.tool;
            const toolInput = plan.toolInput;

            steps.forEach(step => {
                if (step.action.tool === tool && JSON.stringify(step.action.toolInput) === JSON.stringify(toolInput)) {
                    plan = {
                        returnValues: {
                            output: `The AI is calling a tool with the same input as a previous step. This is likely an infinite loop.`
                        },
                        log: JSON.stringify(plan)
                    };
                }
            })
        }

        return plan;
    }

    public async prepareForOutput(_returnValues: AgentFinish["returnValues"], _steps: AgentStep[]): Promise<AgentFinish["returnValues"]> {
        if (_steps.length > 0) {
            const formattedPlan = _returnValues.output;
            const formattedSteps = _steps.map(step => `{"action": "${step.action.tool}", "action_input": "${JSON.stringify(step.action.toolInput)}"}`).join(",\n");

            const condenser = MemoryCondenser.makeChain({model: this.llmChain.llm});

            await condenser.predict({
                actions: formattedSteps,
                response: formattedPlan
            }).then(async (condensedMemory) => {
                await this.store.storeTexts([condensedMemory]);
            });
        }

        return super.prepareForOutput(_returnValues, _steps);
    }
}