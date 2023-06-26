import { MultistepExecutor, OBJECTIVE_INPUT, STEPS_INPUT } from "@/lib/intelligence/multistep/MultistepExecutor";
import { CallbackManagerForToolRun } from "langchain/callbacks";
import { StructuredTool, ToolParams } from "langchain/tools";
import { z } from "zod";

export const NAME = "plan-and-solve";
export const DESCRIPTION = `useful for objectives that require multiple steps.
Note that steps are expensive, so prefer fewer steps.`;

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
        steps: z.array(z.string()).describe("an array of steps to achieve the objective"),
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