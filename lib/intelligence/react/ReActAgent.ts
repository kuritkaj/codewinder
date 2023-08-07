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
import { AgentAction, AgentFinish, AgentStep, AIMessage, BaseMessage, ChainValues, FunctionMessage, HumanMessage } from "langchain/schema";
import { StructuredTool, Tool } from "langchain/tools";

export const CONTEXT_INPUT = "context";
export const MEMORY = "memory";
export const OBJECTIVE_INPUT = "objective";
export const SCRATCHPAD = "scratchpad";

export const FINAL_RESPONSE_PREFIX = "Final Response";

export const SYSTEM = `You are a helpful AI Assistant.
The current date and time is: ${new Date().toLocaleString()}.
You have access to the internet and real-time data.
`;

export const INSTRUCTIONS = `Instructions:
* Always respond to the user starting with \`${FINAL_RESPONSE_PREFIX}:\`.
* Use CommonMark to format the response (plus markdown tables).
* Always search for a relevent and current answer instead of using your own knowledge.
* Be brief in your responses.
* Try more tools if the prior ones are not working.
* The response should include inline sources that can be used to prove the validity of the information, but you should never make up a url or link.
* Examples of code should always be formatted as a code block with javascript specified.`;

interface ReActAgentInput {
    callbacks?: Callbacks;
    creative: ChatOpenAI;
    llmChain: FunctionChain;
    store: MemoryStore;
    verbose?: boolean;
}

export class ReActAgent extends BaseSingleActionAgent {

    public lc_namespace = ["langchain", "agents", "react"];

    private readonly creative: ChatOpenAI;
    private readonly llmChain: FunctionChain;
    private readonly store: MemoryStore;
    private readonly parser = new ReActAgentOutputParser();

    constructor({callbacks, creative, llmChain, store, verbose}: ReActAgentInput) {
        super({callbacks, verbose});

        this.creative = creative;
        this.llmChain = llmChain;
        this.store = store;
    }

    public get inputKeys(): string[] {
        return [OBJECTIVE_INPUT, CONTEXT_INPUT];
    }

    public static createPrompt(): ChatPromptTemplate {
        return ChatPromptTemplate.fromPromptMessages([
            SystemMessagePromptTemplate.fromTemplate(SYSTEM),
            HumanMessagePromptTemplate.fromTemplate(INSTRUCTIONS),
            new ChatHistoryPlaceholder(CONTEXT_INPUT, 3000),
            new CachedPlaceholder(MEMORY),
            HumanMessagePromptTemplate.fromTemplate(`{${OBJECTIVE_INPUT}}`),
            new MessagesPlaceholder(SCRATCHPAD),
        ]);
    }

    public static fromLLMAndTools = ({callbacks, creative, function_call, predictable, store, tools, verbose}: {
        callbacks?: Callbacks,
        creative: ChatOpenAI,
        function_call?: Tool,
        predictable: ChatOpenAI,
        store: MemoryStore,
        tools: StructuredTool[],
        verbose?: boolean,
    }) => {
        this.validateTools(tools);
        if (predictable._modelType() !== "base_chat_model" || predictable._llmType() !== "openai") {
            throw new Error("OpenAIAgent requires an OpenAI chat model");
        }

        const prompt = this.createPrompt();
        const chain = new FunctionChain({
            callbacks,
            function_call,
            llm: predictable,
            prompt,
            tools
        });

        return new ReActAgent({
            callbacks,
            creative,
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
    ): Promise<BaseMessage[]> {
        if (steps && steps.length > 0) return []; // The prompt is cached (see createPrompt); no need to generate new memories

        let memories = await this.store.retrieveSnippets(
            inputs[OBJECTIVE_INPUT],
            0.90
        );

        if (memories && memories.length > 0) {
            return [new HumanMessage(
                `The following memory can be used as a guide:\n\"\"\"\n${memories[0].pageContent}\n\"\"\"\n` +
                `which was formed on: \`${memories[0].metadata?.created_at}\``
            )];
        } else {
            return [];
        }
    }

    public async constructScratchPad(
        steps: AgentStep[]
    ): Promise<BaseMessage[]> {
        return steps.flatMap(({action, observation}) => [
            new AIMessage("", {
                function_call: {
                    name: action.tool,
                    arguments: JSON.stringify(action.toolInput),
                },
            }),
            new FunctionMessage(observation, action.tool),
        ]);
    }

    public async plan(steps: AgentStep[], inputs: ChainValues, callbackManager?: CallbackManager): Promise<AgentAction | AgentFinish> {
        const memories = this.store.isDurable() ? await this.constructMemories(inputs, steps) : [];
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

            if (this.store.isDurable()) {
                const condenser = MemoryCondenser.makeChain({model: this.creative});
                await condenser.predict({
                    actions: formattedSteps,
                    response: formattedPlan
                }).then(async (condensedMemory) => {
                    await this.store.storeTexts([condensedMemory]);
                });
            }
        }

        return super.prepareForOutput(_returnValues, _steps);
    }
}