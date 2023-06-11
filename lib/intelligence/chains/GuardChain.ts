/**
 Guards against prompt inputs that exceed the maximum tokens for the model.
 */
import { LLMChain, LLMChainInput } from "langchain/chains";
import { ChainValues } from "langchain/schema";
import { Callbacks } from "langchain/dist/callbacks/manager";
import { calculateRemainingTokens } from "@/lib/util/tokens";

export class GuardChain extends LLMChain {

    public outputKey: string = "output";

    get outputKeys() {
        return [this.outputKey];
    }

    constructor(inputs: LLMChainInput) {
        super(inputs);
    }

    async call(values: ChainValues & this["llm"]["CallOptions"], callbacks?: Callbacks | undefined): Promise<ChainValues> {
        const prompt = await this.prompt.format(values);

        const remainingTokens = await calculateRemainingTokens({
            prompt,
            model: this.llm
        });

        if (remainingTokens < 0) {
            return {[this.outputKey]: "Your input exceeds the maximum number of tokens for this model."}
        } else {
            return super.call(values, callbacks);
        }
    }
}