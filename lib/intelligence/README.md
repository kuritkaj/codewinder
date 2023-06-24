# Autonomous Agents

This repository aims to provide a working implementation of a fully autonomous agent:
an agent that can take a series of tasks without any human intervention to accomplish an objective or goal.

Provided an objective, such as a request or a question to answer, two agents work together to accomplish the goal:
* ReAct Agent - which loops iteratively until the request is fulfilled or the question is answered.
* PlanAndSolve Agent - which takes a series of steps to accomplish a goal.

The way these interact, is that the ReAct agent is guided to prefer single actions, but is not forced to do so.
If the ReAct agent returns two or more actions, then the PlanAndSolve agent is called.

One way to think about this, is that objectives are accomplished along two axes:
1. Horizontal - the "looping" action of the ReAct agent can be considered a horizontal axis or breadth-based approach.
2. Vertical - invoking the PlanAndSolve agent can be considered a vertical axis or depth-based approach.

This approach to combining both breadth- and depth-based agents produces superior results to either approach alone.