---
title: Design
description: "Turn a Frame brief into specifications, prototypes, and module boundaries before implementation."
slug: /playbook/frame/design
tags: [playbook, frame]
last_reviewed: 2026-10-18
authors: [rowan-lindsay]
---

Design is how a microproduct becomes something you can build on purpose.

A problem brief names the user, the pain, the data, and the utility you owe. Design turns that brief into specifications, a picture of the behavior, and boundaries between the parts. It happens before the first build sprint, and again when an enhancement or a fix arrives. The artifacts are as valuable as the code. With them, a later change can tell a correction from a contradiction. [Quality-First Development](/docs/playbook/frame/quality-first) is why those specifications stay the record of intent after the first prompt.

## Specifications Over Guesswork

Requirements, feature requests, bug reports, and analytics all feed the same pipeline. The job is to turn those inputs into specifications a builder can implement without guessing.

A specification says what the software must do, in language a domain expert can check. Mockups and diagrams belong in that specification when the behavior is easier to see than to describe. Write them down before implementation starts. The first prompt is a conversation. The specification is the decision.

## Prototyping

A working prototype is one of the fastest ways to find a gap. Coding agents make throwaway prototypes cheap: a screen, a query, or a small flow that shows the intent and exposes what the brief left out.

Use prototypes to learn. Then write down what you learned and build the canonical implementation from that learning. A prototype that ships becomes the architecture, including every shortcut that was only there to make the demo move.

## Code Organization

How you split the system is a design decision. Decide it while the specifications are still open, while the cut can still follow the product.

Two patterns cover most microproducts:

1. **Layered.** Modules are grouped by technical role: interface, API, database. A single user task crosses every folder, and business rules sit next to storage and presentation.
2. **Vertical slices.** Modules follow a use case from the outside in. The behavior, its rules, and the tests that express them live together.

Prefer vertical slices. A microproduct is driven by user value, and a slice is a unit of that value. It is also a unit an agent can extend without wandering through unrelated layers. A deep module with a small surface fits this shape: one capability, one place to look, one increment you can verify.

Mix patterns when a domain needs it. Vertical slices stay the default. Reach for another arrangement when a single use-case cut would hide the real boundary. [A Builder's Guide to the Modern Data Stack](/docs/playbook/frame/modern-data-stack) decides sources, storage, and serving. Design decides how the product behavior is cut once that architecture is feasible.

Name things in the language of the domain. A slice called `checkout` tells a reviewer more than a slice called `services`. The same names should appear in the specification, the tests, and the conversation with the person who asked for the feature.

## What Goes Wrong

Three shortcuts undo the work above.

- Coding straight from a problem brief, so the first implementation silently chooses the specification.
- Shipping a throwaway prototype because it already runs.
- Organizing only by technical layer when a user-facing slice would be clearer and easier to test.

## Where This Goes Next

Take the specifications into [From Chat to Tickets](/docs/playbook/build/from-chat-to-tickets), where each slice becomes bounded work. Return to [Frame](/docs/playbook/frame) when the brief itself is still unsettled.
