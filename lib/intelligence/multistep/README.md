# Multistep
This is an Agent that is designed to take multiple steps to accomplish a task or goal.

Note, this agent is called by a ReAct agent that returns two or more actions during its plan step.

It's comprised of three parts:

* Planner - which takes a provided set of steps and (optionally) an objective
  and combines and removes steps that are redundant or unnecessary.
* ReAct Agent - each step returned by the Planner is then passed to a ReAct Agent for execution.
* Editor - the combined output of all steps is then formatted and editted to return markdown.

A couple of notes of import:

* If a durable memory store is provided, then an action from a previous step helps provide guidance.
  This isn't the same as passing the result of a previous step, but is effective all the same.
* In practice, this could cause an agent to spin out of control, since ReAct Agents can in turn call Multistep agents.
  And this can continue recursively without depth control. In practice, the agents tend to complete their objectives and
  stop.