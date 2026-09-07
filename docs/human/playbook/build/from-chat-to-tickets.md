---
title: "Software Engineering With Agents: From Chat to Tickets"
sidebar_label: From Chat to Tickets
description: "Chat is an interface; a ticket is a unit of work. As agentic development matures, software engineering should move from chat-first development toward ticket-based development."
slug: /playbook/build/from-chat-to-tickets
tags: [playbook, build]
last_reviewed: 2026-09-07
authors: [matt-faltyn]
---

AI coding agents have changed the amount of software a single person can build.

They have not eliminated the need for software engineering.

If anything, the opposite is happening.

When an agent can implement a feature, refactor a module, investigate a bug, write tests, update documentation, and modify infrastructure in a single session, the bottleneck increasingly moves away from writing code. The harder problem becomes deciding what should happen, preserving that intent, dividing work into sensible units, and knowing what has already been done.

The natural way most people begin working with coding agents is through chat.

You open Cursor, Claude Code, Codex, or another agent and say:

> Add authentication.

Then:

> Fix the mobile layout.

Then:

> Actually, make the navigation persistent.

Then:

> There is still a bug on the settings page.

This works remarkably well.

Until it does not.

The mistake is assuming that because chat is a good interface for an agent, it is also a good system for managing software development.

It is not.

The distinction is simple:

**Chat is an interface. A ticket is a unit of work.**

As agentic development matures, we think software engineering should increasingly move from chat-first development toward ticket-based development.

## The Chat-First Development Loop

A typical agentic development loop looks something like this:

```text
Idea
  ↓
Prompt
  ↓
Agent
  ↓
Code
  ↓
Another Prompt
  ↓
More Code
```

For small changes, this is difficult to beat.

There is almost no overhead. The developer describes what they want in natural language and the agent begins working immediately.

This low activation energy is one of the biggest reasons agentic coding is so productive.

It is also what makes chat-first development dangerous.

The conversation quietly becomes the project management system.

Requirements are buried several thousand tokens above the current message. Decisions exist only as dialogue. Bugs discovered along the way become follow-up prompts. Work that should happen later remains somewhere in the conversation history. Changes in scope are implicit.

Eventually you close the session.

The project survives.

Much of the reasoning around it does not.

This is another form of the entropy problem we described in [Quality-First](/docs/playbook/frame/quality-first). Code persists by default. Intent does not.

## The Context Window Is Not a Backlog

LLM context windows have become extremely large.

That does not make them good project databases.

Suppose you ask an agent to implement a feature. During implementation it discovers:

- an unrelated bug;
- a missing test;
- some duplicated logic worth refactoring;
- documentation that is now incorrect;
- a larger architectural improvement that should happen later.

In a chat-first workflow, there are several common outcomes.

The agent fixes everything immediately and expands the scope of the original task.

Or it mentions the problems in its final response and you forget about them.

Or you tell it to remember them for later and hope that the relevant conversation survives long enough for "later" to happen.

All three are weak forms of project management.

A better model is:

```text
Discovery
    ↓
Ticket
    ↓
Backlog
    ↓
Priority
    ↓
Execution
```

The important change is not adding bureaucracy.

It is turning discovered work into durable state.

A backlog is external memory for the development process.

## Tickets Are Interfaces for Agents

Traditional issue trackers were largely built around human coordination.

A product manager writes a Jira ticket. An engineer reads it. A sprint board records its status. Meetings exist partly to synchronize everyone around that state.

Agents change this workflow, but they do not remove the need for the underlying abstraction.

In fact, tickets become more useful when implementation becomes cheaper.

A good ticket gives an agent a bounded problem:

```text
WORK-42

Add keyboard navigation to the search results.

Requirements:
- Up/down arrows move the active result
- Enter opens the selected result
- Escape closes the result panel
- Mouse interaction must continue working

Done when:
- behaviour works on desktop
- existing tests pass
- new keyboard behaviour is tested
```

The agent does not need the entire history of the project embedded in a prompt.

It needs the relevant unit of intent, the current codebase, and the project's engineering rules.

That makes the ticket something close to an API between the person directing development and the agent performing it.

The human decides **what** should change.

The ticket records that decision.

The agent determines **how** to implement it within the constraints of the system.

## Ticketing Is Not About Teams

It is tempting to associate tickets with large engineering organizations.

For agentic development, the opposite may be true.

A solo developer can benefit enormously from a structured backlog because the number of things they can plausibly work on has increased.

This is especially true when maintaining several projects.

You might work linearly within each project:

```text
Project A → WORK-14 → WORK-15 → WORK-16

Project B → WORK-31 → WORK-32

Project C → WORK-8 (bug) → WORK-9
```

There is no project manager.

There may not even be another human contributor.

Tickets are still useful.

When you return to Project B three weeks later, you should not need to reconstruct its state from Git history, old agent conversations, and your own memory.

The project should be able to tell you:

- what is finished;
- what is in progress;
- what should happen next;
- what bugs have been discovered;
- what decisions have already been made;
- what larger plans those work items belong to.

**Ticketing is not primarily about concurrency. It is about state.**

## From Spec-Driven to Ticket-Driven

Specifications and tickets solve different problems.

A specification describes what the system must do.

A ticket describes a change that should move the system toward that state.

The relationship should look something like:

```text
User Need
    ↓
Specification
    ↓
Plan
    ↓
Tickets
    ↓
Implementation
    ↓
Tests
    ↓
Working Product
```

This is why ticket-based development fits naturally beside spec-driven development.

A spec might say:

> Users must be able to search all indexed datasets by title, description, and organization.

That requirement may produce a plan and several Work items:

```text
PLAN-4   Search indexed datasets

WORK-21  Add full-text dataset index
WORK-22  Implement search API
WORK-23  Build search interface
WORK-24  Add keyboard navigation
WORK-25  Add search regression tests
```

The specification preserves product intent.

The plan holds the multi-ticket objective.

The Work items turn that intent into executable slices.

The implementation fulfills the tickets.

The tests verify the expected behaviour.

The layers reinforce each other rather than asking a single chat session to hold the entire system together.

## A Practical Implementation: Pad

There are many ways to implement ticket-based development.

For our current workflow, we use [Pad](https://www.getpad.dev/), an open-source project management system designed around developers and coding agents.

The important property is not that Pad has a task board.

Almost every project management system has a task board.

The useful property is that the project state is accessible to both the human and the agent.

Our current setup is deliberately local:

```text
Pad
├── local server
├── localhost web UI
├── SQLite state
├── CLI
├── agent skills
└── MCP integration
```

Pad runs locally, with its web interface on `127.0.0.1:7777` and project data stored locally in SQLite. Agents reach that same state through the CLI, installed skills, and MCP rather than through a separate prompt-side tracker. See the [Pad getting started guide](https://www.getpad.dev/docs) for installation.

A repository is linked to a Pad workspace. The same workspace can then be accessed through the browser, CLI, or supported coding agents.

Pad holds intent, status, decisions, and handoffs. Git holds the code. CI holds independent verification.

This matters because the agent does not need a separate imitation of the project management system inside its prompt.

The project state already exists.

## More Than Tasks

A useful agentic project contains several different kinds of state.

Our Pad workspace uses two collections for executable work:

```text
Work
Plans
```

The distinction matters.

A Work item is one executable objective: a feature, a bug, a refactor, an investigation, or maintenance.

A plan is not a substitute for that ticket. It is a container for a genuinely multi-ticket objective.

Documentation stays in the repository. It should not masquerade as a ticket.

Discovered work is not an "idea" collection either. If an agent notices something that should happen later, it opens a new Work item — or a Plan, if the discovery is genuinely several tickets — and then finishes the ticket it was asked to do.

Consider an agent discovering that a site's search architecture should eventually move from simple SQL filtering to a dedicated index.

That does not mean the current ticket should suddenly become:

> Redesign the entire search architecture.

The agent can instead open a new Work item for that later change — or a Plan, if it is genuinely several tickets — and finish the work it was originally asked to do.

This creates a powerful discipline:

**Discovery does not have to become scope.**

Agents can notice more without immediately changing more.

## Conventions Are Persistent Instructions

Ticketing solves one part of agent context.

Engineering rules solve another.

Every mature project accumulates instructions such as:

- run tests before completing work;
- do not introduce a dependency without justification;
- use existing components before creating new ones;
- keep data transformations deterministic;
- update documentation when public behaviour changes;
- preserve backwards compatibility for specified interfaces.

In chat-first development, these rules often end up in prompts.

That creates repetition:

```text
Remember to run the tests.
Remember not to modify this directory.
Remember how we structure API routes.
Remember to update the docs.
```

Or they end up in increasingly large agent instruction files that every task must ingest.

Pad provides **conventions** and **playbooks** for encoding project-specific practices that agents can use during work.

Conceptually, the architecture becomes:

```text
Ticket       → What should change?
Specification → What must remain true?
Convention   → Which rules always apply?
Playbook     → How do we perform this kind of work?
Codebase     → What exists now?
```

That is a much richer execution environment than a prompt.

More importantly, each type of information has somewhere appropriate to live.

## One Ticket, One Objective

Agentic development makes scope control unusually important.

Agents are very good at continuing.

Ask an agent to fix one problem and it may identify three related improvements. Ask it to implement those and it may discover five more.

Without a stopping condition, useful initiative turns into uncontrolled scope.

Tickets create boundaries.

A useful default is:

**One ticket should represent one independently understandable objective.**

Not necessarily one file.

Not necessarily one commit.

Not necessarily one agent invocation.

One objective.

For example:

```text
Good:
Add CSV export to the results table.

Too small:
Create export button component.

Too broad:
Improve data export and reporting.
```

The exact granularity varies with the project, but the test is straightforward:

Can an agent understand what success means?

Can the result be reviewed independently?

Can the ticket be completed without silently redefining the product?

If not, the work probably needs to be reframed.

## The Agent Execution Loop

Once tickets become first-class, the development loop changes.

Instead of:

```text
Prompt → Code → Prompt → Code → Prompt → Code
```

we get:

```text
Backlog
   ↓
Specify until Ready
   ↓
Select one Ready ticket
   ↓
Implement
   ↓
Verify
   ↓
Review
   ↓
Record evidence
   ↓
Next ticket
```

A practical agent run should roughly follow this sequence:

1. Do not start material implementation until the ticket is specified: intended behaviour, invariants, acceptance criteria, and how it will be verified.
2. Select one Ready Work item.
3. Read it, then load the relevant project conventions or playbooks.
4. Inspect the existing implementation.
5. Make the smallest coherent change that satisfies the ticket. Put unrelated discoveries in a new Work item — or a Plan, if they are genuinely several tickets.
6. Run the project's verification before calling the work done.
7. Review the resulting diff. Consequential work should be reviewed independently.
8. Record evidence, then mark the ticket complete only when its acceptance criteria and verification hold.
9. If the work is incomplete, leave a handoff another agent can resume without the chat.

The agent is still doing software engineering through natural language.

The conversation has simply stopped being the source of truth.

## Humans Move Up the Stack

The most interesting consequence of agentic development may not be that agents write more code.

It is that humans increasingly operate one level above individual code changes.

The scarce tasks become:

- choosing which problems are worth solving;
- defining product behaviour;
- decomposing large problems;
- deciding architecture;
- prioritizing work;
- specifying constraints;
- reviewing important changes;
- deciding when something is good enough to ship.

These are precisely the activities that benefit from durable project state.

An agent can implement ten tickets faster than a human could have implemented one.

That makes choosing the wrong ten tickets ten times more expensive.

Velocity without direction is not leverage.

It is automated waste.

## Chat Is Still the Interface

None of this means abandoning chat.

Natural language is arguably the best interface we have ever had for software tools.

You should still be able to tell an agent:

> The mobile menu is broken. Investigate it.

Or:

> I want to add downloadable CSV results. Figure out what we need.

Or:

> What should I work on next?

The difference is what happens afterward.

Useful work discovered through conversation should become project state.

```text
Conversation
     ↓
Decision
     ↓
Work / Plan
     ↓
Execution
```

Chat becomes the control surface.

It stops being the database.

## What Build Now Requires

The Build phase is where specifications turn into working software.

With capable coding agents, simply having an agent available is not much of a development process.

A stronger default is:

```text
Spec
 ↓
Plan
 ↓
Work items
 ↓
Agent Execution
 ↓
Verify
 ↓
Review
 ↓
Evidence
 ↓
Ship
```

A Plan exists only when the objective is genuinely several tickets. Otherwise the spec produces Work items directly.

Before substantial implementation begins:

- specify each ticket until it is Ready: intended behaviour, invariants, acceptance criteria, and verification;
- do not start material implementation before that Ready gate;
- keep product requirements outside ephemeral conversations;
- make project conventions available to agents;
- capture newly discovered work as a new Work item or Plan instead of silently expanding scope;
- preserve project state between agent sessions;
- verify and review before calling the work done;
- record evidence, and leave a handoff if the work is incomplete.

The exact tooling is secondary.

Pad currently provides a particularly clean implementation because humans and agents share Work, Plans, conventions, and playbooks in one local system.

But the underlying principle is more important than the product:

**Do not make the conversation your software development process.**

Agents make implementation cheaper.

That makes structure more valuable, not less.

The prompt is where work begins.

The ticket is what survives.
