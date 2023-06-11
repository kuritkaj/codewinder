import { TiktokenModel } from "js-tiktoken/lite";
import { BaseLanguageModel, calculateMaxTokens } from "langchain/base_language";

export const getModelNameForTiktoken = (modelName: string): TiktokenModel => {
    if (modelName.startsWith("gpt-3.5-turbo-")) {
        return "gpt-3.5-turbo";
    }

    if (modelName.startsWith("gpt-4-32k-")) {
        return "gpt-4-32k";
    }

    if (modelName.startsWith("gpt-4-")) {
        return "gpt-4";
    }

    return modelName as TiktokenModel;
};

export const calculateRemainingTokens = async ({prompt, model}: { prompt: string, model: BaseLanguageModel }): Promise<number> => {
    const modelName = model._identifyingParams()["model_name"];
    const tiktokenName = getModelNameForTiktoken(modelName);
    return await calculateMaxTokens({
        prompt,
        modelName: tiktokenName
    });
}