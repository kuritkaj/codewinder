/**
 Guards against prompt inputs that exceed the maximum tokens for the model.
 */
import { calculateRemainingTokens } from "@/lib/util/tokens";
import { LLMChain, LLMChainInput } from "langchain/chains";
import { Callbacks } from "langchain/dist/callbacks/manager";
import { ChainValues } from "langchain/schema";

export interface GuardChainInput extends LLMChainInput {
}

export class GuardChain extends LLMChain {

    constructor(input: GuardChainInput) {
        super(input);
    }

    public async call(values: ChainValues & this["llm"]["CallOptions"], callbacks?: Callbacks | undefined): Promise<ChainValues> {
        const prompt = await this.prompt.format(values);

        const remainingTokens = await calculateRemainingTokens({
            prompt,
            model: this.llm
        });

        if (remainingTokens < 0) {
            return {[this.outputKey]: `Your input exceeds the maximum number of tokens for this model by ${remainingTokens * -1}.`}
        } else {
            return super.call(values, callbacks);
        }
    }
}