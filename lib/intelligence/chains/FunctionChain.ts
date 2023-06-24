// Copied from langchain/src/chains/openai_functions/index.ts.

import { CallbackManagerForChainRun } from "langchain/callbacks";
import { LLMChain, LLMChainInput } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { BaseChatMessage, ChainValues } from "langchain/schema";
import { StructuredTool } from "langchain/tools";

export interface FunctionChainInput extends LLMChainInput<BaseChatMessage, ChatOpenAI> {
    tools: StructuredTool[];
}

export class FunctionChain extends LLMChain<BaseChatMessage, ChatOpenAI> {

    private readonly tools: StructuredTool[];

    constructor(input: FunctionChainInput) {
        super(input);

        this.tools = input.tools;
    }

    public async _call(
        values: ChainValues,
        runManager?: CallbackManagerForChainRun
    ): Promise<ChainValues> {
        const valuesForPrompt = {...values};
        const valuesForLLM = {
            tools: this.tools,
        };
        for (const key of this.llm.callKeys) {
            if (key in values) {
                valuesForLLM[key] = values[key];
                delete valuesForPrompt[key];
            }
        }

        const promptValue = await this.prompt.formatPromptValue(valuesForPrompt);

        const message = await this.llm.predictMessages(
            promptValue.toChatMessages(),
            valuesForLLM,
            runManager?.getChild()
        );

        return {[this.outputKey]: message};
    }
}