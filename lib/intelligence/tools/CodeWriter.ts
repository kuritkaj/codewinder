import { CodeSandboxDependencies } from "@/components/ui/ReactiveBlock/plugins/CodeSandboxPlugin/CodeSandboxDependencies";
import { GuardChain } from "@/lib/intelligence/chains/GuardChain";
import { LLMChain } from "langchain";
import { BaseLanguageModel } from "langchain/base_language";
import { PromptTemplate } from "langchain/prompts";
import { StructuredTool, ToolParams } from "langchain/tools";
import { z } from "zod";

export const NAME = "code-writer";
export const DESCRIPTION = `used to write and respond with code and visualizations.
Results are executed by the user in a web-based JavaScript environment.
Input should be a detailed, natural language description of the software requirements
including all useful context from previous interactions.`;

const SPECIFICATION_INPUT = "specification";

export const GUIDANCE = `You are an AI assistant receiving detailed software requirements. 
Your task is to respond with code that can be executed in a web-based JavaScript environment.

This is the code specification (use natural language to describe the requirements):
{${SPECIFICATION_INPUT}}

You have access to the following libraries (which must be imported as modules):
${ CodeSandboxDependencies.map((dep) => {
        return `- ${dep[0]}`;
    }).join("\n") }

Notes:
* If a dependency needs additional elements, such as canvas, you'll need to create those in your code.
* Chart.js uses tree-shaking, so to use it, you'll need to import from: 'chart.js/auto'.

This is the html file that will be used to display the results (running in Parcel):
\`\`\`
<body>
    <div id="app"></div>
</body>
\`\`\`

For displaying content to the user, use a template like this:
\`\`\`javascript
import module from "module";
document.getElementById("app").innerHTML = "<h1>Hello world</h1>";
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
