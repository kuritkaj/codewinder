// Copied from langchain/src/chains/openai_functions/index.ts.

import { CallbackManagerForChainRun } from "langchain/callbacks";
import { LLMChain, LLMChainInput } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { BaseMessage, ChainValues } from "langchain/schema";
import { StructuredTool, Tool } from "langchain/tools";

export interface FunctionChainInput extends LLMChainInput<BaseMessage, ChatOpenAI> {
    function_call?: Tool;
    tools: StructuredTool[];
}

export class FunctionChain extends LLMChain<BaseMessage, ChatOpenAI> {

    private readonly function_call: Tool;
    private readonly tools: StructuredTool[];

    constructor(input: FunctionChainInput) {
        super(input);

        this.function_call = input.function_call;
        this.tools = input.tools;
    }

    public async _call(
        values: ChainValues,
        runManager?: CallbackManagerForChainRun
    ): Promise<ChainValues> {
        const valuesForPrompt = {...values};
        const valuesForLLM = {
            tools: this.tools
        };
        for (const key of this.llm.callKeys) {
            if (key in values) {
                valuesForLLM[key] = values[key];
                delete valuesForPrompt[key];
            }
        }

        const promptValue = await this.prompt.formatPromptValue(valuesForPrompt);
        const messages = promptValue.toChatMessages();
        if (this.function_call) messages.forEach(message => message.additional_kwargs.function_call = {
            name: this.function_call.name,
            arguments: "",
        });

        const message = await this.llm.predictMessages(
            messages,
            valuesForLLM,
            runManager?.getChild()
        );

        return {[this.outputKey]: message};
    }
}