import { TiktokenModel } from "js-tiktoken/lite";
import { BaseLanguageModel } from "langchain/base_language";
import { encodingForModel } from "js-tiktoken";

export const getModelName = (model: BaseLanguageModel): string => {
    return model._identifyingParams()["model_name"];
}

export const getModelNameForTiktoken = (model: BaseLanguageModel): TiktokenModel => {
    const modelName = getModelName(model);

    if (modelName.startsWith("gpt-3.5-turbo-16k")) {
        return "gpt-3.5-turbo-16k";
    }

    if (modelName.startsWith("gpt-3.5-turbo")) {
        return "gpt-3.5-turbo";
    }

    if (modelName.startsWith("gpt-4-32k")) {
        return "gpt-4-32k";
    }

    if (modelName.startsWith("gpt-4")) {
        return "gpt-4";
    }

    return modelName as TiktokenModel;
};

interface CalculateMaxTokenProps {
    prompt: string;
    model: BaseLanguageModel;
}

const calculateMaxTokens = async ({
    prompt,
    model,
}: CalculateMaxTokenProps) => {
    const tiktokenName = getModelNameForTiktoken(model);

    // fallback to approximate calculation if tiktoken is not available
    let numTokens = Math.ceil(prompt.length / 4);
    try {
        numTokens = (await encodingForModel(tiktokenName)).encode(prompt).length;
    } catch (error) {
        console.warn(
            "Failed to calculate number of tokens, falling back to approximate count"
        );
    }

    const maxTokens = getModelContextSize(model);
    return maxTokens - numTokens;
};

export const calculateRemainingTokens = async ({prompt, model}: { prompt: string, model: BaseLanguageModel }): Promise<number> => {
    return await calculateMaxTokens({
        prompt,
        model
    });
}

export const getEmbeddingContextSize = (modelName?: string): number => {
    switch (modelName) {
        case "text-embedding-ada-002":
            return 8191;
        default:
            return 2046;
    }
};

export const getModelContextSize = (model: BaseLanguageModel): number => {
    switch (getModelNameForTiktoken(model)) {
        case "gpt-3.5-turbo-16k":
            return 16384;
        case "gpt-3.5-turbo":
            return 4096;
        case "gpt-4-32k":
            return 32768;
        case "gpt-4":
            return 8192;
        case "text-davinci-003":
            return 4097;
        case "text-curie-001":
            return 2048;
        case "text-babbage-001":
            return 2048;
        case "text-ada-001":
            return 2048;
        case "code-davinci-002":
            return 8000;
        case "code-cushman-001":
            return 2048;
        default:
            return 4097;
    }
};