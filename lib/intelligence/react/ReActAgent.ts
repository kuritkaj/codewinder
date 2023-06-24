import { FunctionChain } from "@/lib/intelligence/chains/FunctionChain";
import { MemoryStore } from "@/lib/intelligence/memory/MemoryStore";
import { ChatHistoryPlaceholder } from "@/lib/intelligence/react/ChatHistoryPlaceholder";
import { MemoryCondenser } from "@/lib/intelligence/react/MemoryCondenser";
import { ReActAgentOutputParser } from "@/lib/intelligence/react/ReActAgentOutputParser";
import { BaseSingleActionAgent } from "langchain/agents";
import { CallbackManager } from "langchain/callbacks";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { Callbacks } from "langchain/dist/callbacks/manager";
import { ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder, SystemMessagePromptTemplate } from "langchain/prompts";
import { AgentAction, AgentFinish, AgentStep, AIChatMessage, BaseChatMessage, ChainValues, FunctionChatMessage } from "langchain/schema";
import { StructuredTool } from "langchain/tools";

export const AGENT_SCRATCHPAD = "agent_scratchpad";
export const CONTEXT_INPUT = "context";
export const OBJECTIVE_INPUT = "objective";

export const FINAL_RESPONSE_PREFIX = "Final Response";

export const SYSTEM = `You are a helpful AI Assistant. The current date and time is: ${new Date().toLocaleString()}.`;

export const INSTRUCTIONS = `Instructions:
* Prefer the plan-and-solve function for complex objectives that require multiple steps to resolve.
* Always respond to the user starting with \`${FINAL_RESPONSE_PREFIX}:\`.
* Use Github Flavored Markdown (GFM) to format the response (but never footnotes - only inline links).
* The response should include sources from functions, but you should never make up a url or link.`;

interface ReActAgentInput {
    callbacks?: Callbacks;
    llmChain: FunctionChain;
    store: MemoryStore;
    verbose?: boolean;
}

interface ReActAgentCreatePromptArgs {
    prefix?: string;
    suffix?: string;
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

    public _agentType() {
        return "openai-functions" as const;
    }

    public _stop(): string[] {
        return [];
    }

    public static createPrompt(
        fields?: ReActAgentCreatePromptArgs
    ): ChatPromptTemplate {
        const {prefix = SYSTEM} = fields || {};
        return ChatPromptTemplate.fromPromptMessages([
            SystemMessagePromptTemplate.fromTemplate(prefix),
            new ChatHistoryPlaceholder(CONTEXT_INPUT),
            HumanMessagePromptTemplate.fromTemplate(INSTRUCTIONS),
            HumanMessagePromptTemplate.fromTemplate(`{${OBJECTIVE_INPUT}}`),
            new MessagesPlaceholder(AGENT_SCRATCHPAD),
        ]);
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

    public static fromLLMAndTools = ({args, callbacks, model, store, tools, verbose}: {
        args?: ReActAgentCreatePromptArgs,
        callbacks?: Callbacks,
        store: MemoryStore,
        model: ChatOpenAI,
        tools: StructuredTool[],
        verbose?: boolean,
    }) => {
        this.validateTools(tools);
        if (model._modelType() !== "base_chat_model" || model._llmType() !== "openai") {
            throw new Error("OpenAIAgent requires an OpenAI chat model");
        }

        const prompt = this.createPrompt({...args});
        const chain = new FunctionChain({
            prompt,
            llm: model,
            callbacks,
            tools
        });

        return new ReActAgent({
            callbacks,
            llmChain: chain,
            store,
            verbose
        });
    }

    public async plan(steps: Array<AgentStep>, inputs: ChainValues, callbackManager?: CallbackManager): Promise<AgentAction | AgentFinish> {
        const thoughts = await this.constructScratchPad(steps);
        const newInputs = {
            ...inputs,
            [AGENT_SCRATCHPAD]: thoughts,
        }

        if (this._stop().length !== 0) {
            newInputs["stop"] = this._stop();
        }

        const message = await this.llmChain.predict(newInputs, callbackManager);
        return await this.parser.parse(message);
    }

    public async prepareForOutput(_returnValues: AgentFinish["returnValues"], _steps: AgentStep[]): Promise<AgentFinish["returnValues"]> {
        if (_steps.length > 0) {
            const formattedPlan = _returnValues.output;
            const formattedSteps = _steps.map(step => `{"action": "${step.action.tool}", "action_input": "${JSON.stringify(step.action.toolInput)}"}`).join(",\n");

            const condenser = MemoryCondenser.makeChain({model: this.llmChain.llm});

            condenser.predict({
                actions: formattedSteps,
                response: formattedPlan
            }).then(async (condensedMemory) => {
                await this.store.storeTexts([condensedMemory]);
            });
        }

        return super.prepareForOutput(_returnValues, _steps);
    }

    public static validateTools(_tools: StructuredTool[]): void {
    }
}