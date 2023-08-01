// Copied from langchain/src/chains/openai_functions/index.ts.

import { calculateRemainingTokens } from "@/lib/util/tokens";
import { CallbackManagerForChainRun } from "langchain/callbacks";
import { LLMChain, LLMChainInput } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { AIMessage, BaseMessage, ChainValues } from "langchain/schema";
import { StructuredTool, Tool } from "langchain/tools";

export interface FunctionChainInput extends LLMChainInput<BaseMessage, ChatOpenAI> {
    function_call?: Tool;
    tools: StructuredTool[];
}

export class FunctionChain extends LLMChain<BaseMessage, ChatOpenAI> {

    private readonly function_call: Tool | undefined;
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
        const functionCall = this.function_call;
        if (functionCall) messages.forEach(message => message.additional_kwargs.function_call = {
            name: functionCall.name,
            arguments: "",
        });

        const prompt = await this.prompt.format(values);

        const remainingTokens = await calculateRemainingTokens({
            prompt,
            model: this.llm
        });

        if (remainingTokens < 0) {
            return {[this.outputKey]: new AIMessage(`Your input exceeds the maximum number of tokens for this model by ${remainingTokens * -1}.`)}
        } else {
            const message = await this.llm.predictMessages(
                messages,
                valuesForLLM,
                runManager?.getChild()
            );

            return {[this.outputKey]: message};
        }
    }
}