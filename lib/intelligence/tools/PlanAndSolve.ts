import { MultistepExecutor, OBJECTIVE_INPUT, STEPS_INPUT } from "@/lib/intelligence/multistep/MultistepExecutor";
import { CallbackManagerForToolRun } from "langchain/callbacks";
import { StructuredTool, ToolParams } from "langchain/tools";
import { z } from "zod";

export const NAME = "plan-and-solve";
export const DESCRIPTION = `should always be used for objectives requiring multiple steps to solve.
Steps are expensive, so use as few steps as necessary to achieve the objective.
When possible, combine and remove steps that are redundant or unnecessary.`;

interface MultistepInput extends ToolParams {
    multistepExecutor: MultistepExecutor;
}

export class PlanAndSolve extends StructuredTool {
    public readonly name = NAME;
    public readonly description = DESCRIPTION;
    public readonly returnDirect = true;
    public readonly schema = z.
    object({
        objective: z.string().describe("the objective to achieve"),
        steps: z.array(z.object({
            id: z.number().describe("the id of the step"),
            plan: z.string().describe("a detailed plan on how this step meets the objective"),
            dependency: z.number().optional().describe("an optional id of a step that must be completed before this step"),
        }).describe("as few steps as possible to achieve the objective")),
    });

    private readonly multistepExecutor: MultistepExecutor;

    constructor({multistepExecutor, verbose, callbacks}: MultistepInput) {
        super({verbose, callbacks});

        this.multistepExecutor = multistepExecutor;
    }

    protected _call(plan: z.output<this["schema"]>, runManager?: CallbackManagerForToolRun): Promise<string> {
        const inputs = {
            [OBJECTIVE_INPUT]: plan.objective,
            [STEPS_INPUT]: plan.steps,
        }
        return this.multistepExecutor.predict(inputs, runManager?.getChild());
    }
}