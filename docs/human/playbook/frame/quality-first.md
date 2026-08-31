---
title: "Quality-First Development"
description: "How a modern approach to QA helps ship quickly and confidently"
useDescriptionAsSubtitle: true
slug: /playbook/frame/quality-first
tags: [playbook, frame]
last_reviewed: 2026-09-06
authors: [rowan-lindsay]
---

Conventional wisdom and evidence from traditionally-built agile teams suggest an inherent tradeoff between software quality and delivery speed. Test more, ship slower - or deliver at a rapid pace but risk bugs slipping through or shipping the wrong thing entirely. Indeed, a poorly-thought-out approach to software quality assurance will add friction and slow down the development cycle. On the other hand, a thoughtfully crafted quality strategy improves all parts of the development process and actually improves velocity at the same time. Here, we discuss some battle-tested and emerging best-practices that will improve your development process, reduce entropy and help ship great (micro) products.

## The Death of the One-shot App

Most projects, especially those built with AI tools, fail on day 2. Anyone who's worked on a project for some length of time will relate to this in some way.

With today's tools, it is easier than ever to conjure a new app or program into existence. Prompt-to-app tools, cutting-edge LLMs and viral techniques in "vibe-coding" are seemingly optimized for the initial deliverable, while subsequent changes are much harder for agents to produce, are prone to bugs and introduce technical debt into the project.

This is not unique to the AI age. The same issues arise in disciplined pre-LLM software development projects, just on a longer time-scale. By no fault of their own - rather due simply to the limitations of organic brains - human engineers and even product owners lose track of product scope, particulars of older features and detailed knowledge of their codebase. Moreover, teams may be completely replaced over time and after a while it becomes nearly impossible to change or add things without introducing regressions.

## Entropy, the Enemy

A term with many meanings, whose specific use in the context of agentic engineering has become increasingly popular, "entropy" roughly equates to the disorder in a project and/or codebase. All of the following are symptoms of a higher-entropy system:

- Increasingly disorganized code / module structure

- Decreased human understanding of the system

- More bugs in delivered features

- Frequent regressions in previous functionality

- Agents having difficulty making progress or slowing down / using more tokens

The entropy model is a simplified view of the complexities of software development, but a useful one. By tracking entropy, we identify future problem areas. By reducing it, we improve the quality of both our building systems and their output.

## A Solution: Spec-Driven Development

The intrinsic knowledge of a team is only as good as its process and shared documentation. Good docs take many forms: user-studies, briefings, guides/manuals, technical architecture diagrams. Perhaps the simplest but most important is a product specification. Sometimes taking the form of a product requirements document (PRD), the spec says everything that a piece of software must do. Be it a data source, transformation pipeline, web app or even a shared library, every product has a set of requirements that must remain until explicitly changed or removed.

One of the biggest reasons projects start degrading in quality after the first iteration is that intent gets lost. While LLMs are great at taking written intent and turning it into working code, they do not by default preserve that intent in its original form. Without that intent recorded, you or future contributors to the project can quickly lose sight of original user requirements, and agents do not even know when something is truly a regression in functionality.

Software specs improve quality by capturing intent. By using plain, declarative language over code, they serve as an immutable record of requirements put into the system.

Spec-driven development (SDD) makes specs first class.

Software development methodologies in general orient the development lifecycle around a single unifying philosophy. Spec-driven development, which has gained popularity since the rise of AI coding, is all about treating specifications as sources of truth and/or first-class citizens in the project.

Typically, that means generating a plaintext spec as the first step before feeding that to an implementer (or planning) LLM to write code. However, specs are not just useful as a seeding tool but as a living documentation or even an executable test suite. Engineers, business teams and domain-experts alike can all read and benefit from a well-written spec. In true SDD, specs are not just a point-in-time description of intent but an evolving blueprint for the entire project.

## Optimizing for Value Delivery

Spec-driven development is user-driven development.

When we translate user requests or studies into requirements and those requirements become specs, nothing is lost and every bit of code is traceable back to some original motivation.

Contrast this to development where developers or agents start coding from vague or nonexistent requirements. In the best case, iteration occurs until some kind of agreed-upon set of features and behaviours is reached (see Agile). In the worst case, products that ship are either incorrect or have little value to anyone. Both paths have a cost. On the other hand, when user requirement derived specs are involved and clearly mappable, everything has a reason and little time is wasted. SDD is therefore a great methodology for prioritizing value delivered to users.

## The QA Process Reduces Entropy

In the "shift-left" philosophy, aspects of the QA process are implemented across every phase of the SDLC. QA engineers, or anyone playing that role, are stewards of the process, and promote human-centric methodologies like SDD.

Here are some examples of how QA and related practices are involved in each phase:

Framing/Planning

- Written specifications and test plans clarify intent, aid in understanding and improve collaboration between stakeholders, domain-experts, engineers and agents.

- Structured issue management makes feature and bug-fix dependencies apparent while supporting a purposeful approach to change rollout.

Formulation

- Feedback-rich design sessions result in high-quality models and other artifacts, which ultimately turn into well-organized code.

Build

- Fast iteration during feature testing improves cohesion within and between components.

- Automating tests and other verification systems improves iteration speed, reduces manual overhead and empowers agents.

- Frequent regression testing ensures that only expected changes are shipped.

Operation

- Bug reports and other feedback from users is properly reproduced, filed, and triaged

- Analysis of user behaviour and change requests on the backlog close the loop and turn the development cycle into a value-delivery machine.

Quality is not an afterthought. Nor is it a single phase of the build pipeline. QA best practices and tools depend upon and are injected into the process and can be executed by anyone, including bots. By embracing this and investing in the process early on, teams and solo developers alike can iterate at rapid speeds while maintaining high standards of quality and constantly moving forward.

## What’s Next?

As you proceed on your microproduct development journey, I hope you come away with an appreciation for the interplay between quality and process. Spec-driven development and the patterns outlined above are just a subset of already large and rapidly expanding literature around development and human-agent interaction.

[From Chat to Tickets](/docs/playbook/build/from-chat-to-tickets) continues this discussion in Build: how ticket-based development turns specifications into bounded work that agents can execute without treating chat as the project database. As always, we welcome feedback on pieces like these and hope this serves as merely the start of a long dialogue.
