import { CodeSandboxDependencies } from "@/components/ui/ReactiveBlock/plugins/CodeSandboxPlugin/CodeSandboxDependencies";
import { GuardChain } from "@/lib/intelligence/chains/GuardChain";
import { LLMChain } from "langchain";
import { BaseLanguageModel } from "langchain/base_language";
import { PromptTemplate } from "langchain/prompts";
import { StructuredTool, ToolParams } from "langchain/tools";
import { z } from "zod";

export const NAME = "code-writer";
export const DESCRIPTION = `used to write and respond with code.
Results are executed by the user in a web-based JavaScript environment.
Input should include all useful context from previous functions and results.`;

const SPECIFICATION_INPUT = "specification";

export const GUIDANCE = `You are an AI assistant receiving a detailed code specification. 
Your task is to respond with code that can be executed in a web-based JavaScript environment.

This is the code specification:
{${SPECIFICATION_INPUT}}

You have access to the following libraries (which must be imported as modules):
${
    CodeSandboxDependencies.map((dep) => {
        return `- ${dep}`;
    }).join("\n")
}

For web content, use a template like this:
\`\`\`html
<!DOCTYPE html>
<html lang="en">

<head>
  <title>Parcel Sandbox</title>
  <meta charset="UTF-8" />
</head>

<body>
  <div id="app"></div>

  <script src="index.js">
  </script>
</body>

</html>
\`\`\`

Now, based on the natural language description, 
your task is to reply with a code block with one of the following languages:
- css
- html or xml or svg or mathml or ssml or atom or rss
- javascript or js
- markdown
- react or jsx or tsx
- typescript or ts
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
