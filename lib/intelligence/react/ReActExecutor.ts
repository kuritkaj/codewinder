// Modified from: https://github.com/hwchase17/langchainjs/blob/main/langchain/src/agents/executor.ts

import { ReActAgent } from "@/lib/intelligence/react/ReActAgent";
import { StoppingMethod } from "langchain/agents";
import { CallbackManagerForChainRun } from "langchain/callbacks";
import { BaseChain, SerializedLLMChain } from "langchain/chains";
import { Callbacks } from "langchain/dist/callbacks/manager";
import { AgentAction, AgentFinish, AgentStep, ChainValues } from "langchain/schema";
import { StructuredTool } from "langchain/tools";

const MAX_ITERATIONS = 10; // Minimum should be two, once to try an action, and the second to assert a final response.

export interface ReActExecutorInput {
    agent: ReActAgent;
    callbacks?: Callbacks;
    earlyStoppingMethod?: StoppingMethod;
    maxIterations?: number;
    returnIntermediateSteps?: boolean;
    tools: StructuredTool[];
    verbose: boolean;
}

/**
 * A chain managing an agent using tools.
 * @augments BaseChain
 */
export class ReActExecutor extends BaseChain {
    private readonly agent: ReActAgent;
    private readonly earlyStoppingMethod: StoppingMethod = "force";
    private readonly maxIterations?: number = MAX_ITERATIONS;
    private readonly returnIntermediateSteps: boolean = false;
    private readonly tools: StructuredTool[];

    constructor({
        agent,
        callbacks,
        earlyStoppingMethod,
        maxIterations,
        returnIntermediateSteps,
        tools,
        verbose
    }: ReActExecutorInput) {
        super({verbose, callbacks});

        this.agent = agent;
        this.tools = tools;

        this.returnIntermediateSteps = returnIntermediateSteps ?? this.returnIntermediateSteps;
        this.maxIterations = maxIterations ?? this.maxIterations;
        this.earlyStoppingMethod = earlyStoppingMethod ?? this.earlyStoppingMethod;
    }

    get inputKeys() {
        return this.agent.inputKeys;
    }

    get outputKeys() {
        return this.agent.returnValues;
    }

    /** Create from agent and a list of tools. */
    public static fromAgentAndTools({
        agent,
        callbacks,
        maxIterations,
        tools,
        verbose
    }: ReActExecutorInput): ReActExecutor {
        return new ReActExecutor({
            agent,
            callbacks,
            maxIterations,
            tools,
            verbose
        });
    }

    public async _call(
        inputs: ChainValues,
        runManager?: CallbackManagerForChainRun
    ): Promise<ChainValues> {
        const toolsByName = Object.fromEntries(
            this.tools.map((t) => [t.name.toLowerCase(), t])
        );
        let steps: AgentStep[] = [];
        let iterations = 0;

        const evaluateAction = async (action: AgentAction): Promise<AgentStep> => {
            await runManager?.handleAgentAction(action);

            const tool = toolsByName[action.tool?.toLowerCase()];
            const observation = tool
                ? await tool.call(action.toolInput, runManager?.getChild())
                : `${action.tool} is not a valid tool, try another one.`;

            return {action, observation};
        }

        const getOutput = async (finishStep: AgentFinish): Promise<ChainValues> => {
            const {returnValues} = finishStep;
            const additional = await this.agent.prepareForOutput(returnValues, steps);

            if (this.returnIntermediateSteps) {
                return {...returnValues, intermediateSteps: steps, ...additional};
            }
            await runManager?.handleAgentEnd(finishStep);
            return {...returnValues, ...additional};
        };

        // Loop until the number of iterations are met, or the plan returns with AgentFinish.
        while (this.shouldContinue(iterations)) {

            // Execute the plan with the new inputs
            const plan = await this.agent.plan(
                steps,
                inputs,
                runManager?.getChild()
            );

            // Check if the agent has finished.
            if ("returnValues" in plan) return getOutput(plan);

            // Here, we execute the actions and gather the observations.
            const step = await evaluateAction(plan);

            // This prior action observations are added to the previous steps.
            steps.push(step);

            const tool = toolsByName[step.action.tool?.toLowerCase()];

            // If the tool returns directly, we return that observation.
            if (tool?.returnDirect) {
                return getOutput({
                    returnValues: {[this.agent.returnValues[0]]: step.observation},
                    log: "",
                });
            }

            iterations += 1;
        }

        const finish = await this.agent.returnStoppedResponse(
            this.earlyStoppingMethod,
            steps,
            inputs
        );

        return getOutput(finish);
    }

    public _chainType() {
        return "react_executor" as const;
    }

    public async predict(values: ChainValues, callbacks?: Callbacks): Promise<string> {
        const completion = await this.call(values, callbacks);
        return completion[this.agent.returnValues[0]];
    }

    public serialize(): SerializedLLMChain {
        throw new Error("Cannot serialize a ReActExecutor");
    }

    public shouldContinue(iterations: number): boolean {
        return this.maxIterations === undefined || iterations < this.maxIterations;
    }
}