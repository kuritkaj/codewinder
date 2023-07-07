import { GuardChain } from "@/lib/intelligence/chains/GuardChain";
import { LLMChain } from "langchain";
import { BaseLanguageModel } from "langchain/base_language";
import { PromptTemplate } from "langchain/prompts";
import { StructuredTool, ToolParams } from "langchain/tools";
import { z } from "zod";

export const NAME = "code-writer";
export const DESCRIPTION = `used to write code. 
Results are returned as code blocks to the user.
Input should include all useful context from previous functions and results.`;

const SPECIFICATION_INPUT = "specification";

export const GUIDANCE = `You are an AI assistant receiving a detailed code specification. 
Your task is to respond with code that can be executed in a code sandbox.
This sandbox includes a code editor, code sandbox, and a preview window.

This is the code specification:
{${SPECIFICATION_INPUT}}

Now, based on the natural language description, 
your task is to reply with a code block with one of the following languages:
- javascript and jsx
- typescript and tsx
- python
- markdown
- marpit
- static
- html
- css
`;

export interface CodeWriterParams extends ToolParams {
    model: BaseLanguageModel;
}

export class CodeWriter extends StructuredTool {
    public readonly name = NAME;
    public readonly description = DESCRIPTION;
    public readonly returnDirect = true;
    public schema = z.
    object({
        input: z.string().describe("code specification")
    }).transform((obj) => obj.input);

    private readonly llmChain: LLMChain;

    constructor({model, verbose, callbacks}: CodeWriterParams) {
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
