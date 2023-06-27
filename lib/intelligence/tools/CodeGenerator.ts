import { GuardChain } from "@/lib/intelligence/chains/GuardChain";
import { LLMChain } from "langchain";
import { BaseLanguageModel } from "langchain/base_language";
import { PromptTemplate } from "langchain/prompts";
import { StructuredTool, ToolParams } from "langchain/tools";
import { z } from "zod";

export const NAME = "code-generator";
export const DESCRIPTION = `used to generate code. 
Results are returned as code blocks. Never use this to respond with code to the user.
Input should include all useful context from previous functions and results.`;

const SPECIFICATION_INPUT = "specification";

export const GUIDANCE = `You are an AI assistant receiving a detailed code specification. 
Your task is to translate respond with Javascript code.

This is the code specification:
{${SPECIFICATION_INPUT}}

Now, based on the natural language description, 
your task is to write JavaScript wrapped in a code block with the language specified.`;

export interface CodeGeneratorParams extends ToolParams {
    model: BaseLanguageModel;
}

export class CodeGenerator extends StructuredTool {
    public readonly name = NAME;
    public readonly description = DESCRIPTION;
    public readonly returnDirect = true;
    public schema = z.
    object({
        input: z.string().describe("code specification")
    }).transform((obj) => obj.input);

    private readonly llmChain: LLMChain;

    constructor({model, verbose, callbacks}: CodeGeneratorParams) {
        super({verbose, callbacks});

        const prompt = PromptTemplate.fromTemplate(GUIDANCE);

        this.llmChain = new GuardChain({
            llm: model,
            callbacks: callbacks,
            prompt
        });
    }

    async _call(specification: string): Promise<string> {
        // Generate JavaScript code from the natural language description.
        return await this.llmChain.predict({
            [SPECIFICATION_INPUT]: specification
        });
    }
}
