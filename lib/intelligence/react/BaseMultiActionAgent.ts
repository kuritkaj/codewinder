// Modified from: https://github.com/hwchase17/langchainjs/blob/main/langchain/src/agents/agent.ts

import { AgentAction, AgentFinish, AgentStep, ChainValues } from "langchain/schema";
import { CallbackManager } from "langchain/callbacks";
import { BaseAgent } from "@/lib/intelligence/react/BaseAgent";

export abstract class BaseMultiActionAgent extends BaseAgent {

    /**
     * Decide what to do, given some input.
     *
     * @param steps - Steps the LLM has taken so far, along with observations from each.
     * @param inputs - User inputs.
     * @param callbackManager - Callback manager.
     *
     * @returns Actions specifying what tools to use.
     */
    abstract plan(
        steps: AgentStep[],
        inputs: ChainValues,
        callbackManager?: CallbackManager
    ): Promise<AgentAction[] | AgentFinish>;
}