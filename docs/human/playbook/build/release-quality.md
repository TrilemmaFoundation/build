---
title: "Release Quality"
description: "Decide whether a release candidate will have all of, and only, the expected impacts."
slug: /playbook/build/release-quality
tags: [playbook, build]
last_reviewed: 2026-10-18
authors: [rowan-lindsay]
---

A release candidate is a snapshot of source, static configuration, and deployment scripts being evaluated for release. Release quality asks one question about that snapshot: will it have all of the expected impacts, and only those impacts?

The [Release Guide](/docs/playbook/build/release) covers timing, environment fit, and the decision to ship. This page covers the evidence that decision depends on. The case for specifications and for keeping a project understandable lives in [Quality-First Development](/docs/playbook/frame/quality-first). What follows is the Build practice: what to check, where the checks run, and how much evidence a given risk deserves.

## Expected Impacts

An impact is any result of releasing the candidate. Updating code on a server, changing configuration, mutating cloud resources, and running scripts that change data are all impacts. Adding, changing, or removing a feature is an impact. Making a site exist on a domain that did not exist before is an impact. Fixing a bug is an impact.

"Expected" is the load-bearing word. Write the impact list down before you treat a check as evidence. A candidate that does the new thing and also drops an old one still has an unnamed impact. A candidate that is green in a test environment and then changes production in a way nobody named has one too.

## New Behavior and Existing Behavior

Split the impact list into two kinds of behavior.

**New behavior** is what this candidate adds. The check here connects what stakeholders asked for with what was actually built. A developer can make that comparison when they are also the stakeholder. The point is the comparison.

**Existing behavior** is what the last stable release already did, including behavior users rely on even when it was never intended. [Design](/docs/playbook/frame/design) is how unintended behavior gets kept out of the specification in the first place. Once a behavior is in production, the candidate still has to show that it left that behavior alone, unless the impact list says otherwise.

Checks on new behavior answer whether you shipped the thing you named. Regression checks answer whether existing behavior still does what the last stable release did.

## Specifications and Tests

A check is only as good as the statement it is checking.

A complete specification captures what stakeholders expect now, and the expectations you already know are coming. A readable specification is organized so everyone on the team can follow it. That requires a shared model of the software's shape: what the parts are and how information moves, even when the model stops short of every internal detail. Design is where that model and those specifications are made. Quality-First is why they remain the source of truth after the first prompt.

Use the language of the domain in specifications, tests, and names. The person who asked for the feature and the person who builds it should be able to use the same words. When the words match, a failing test names the behavior that broke.

Prefer expressive tests. The test source, or the data that drives it, should say what the software does and why the test exists. An expressive test is an executable specification: a stakeholder can read it, and a pipeline can run it.

Automation has to be strong enough to stand in for sitting with the product yourself. The strongest form exercises a fully integrated flow. That form is expensive, so it is one tool among others. The reliable version separates business rules from wiring, so a test of the rule does not depend on a lucky environment.

Feature organization makes this concrete. A vertical slice can be tested, and turned on or off, on its own. The suite then has a unit that matches the impact list. A suite organized only by technical layer tends to check the layers and miss the behavior.

## Where Checks Run

Run checks at several points in the life of a change:

- The agent loop, on each message or code change, so a bad increment is caught while the context is still small.
- Human review on the feature branch, for judgments a script cannot make.
- Pre-commit and pre-push hooks, for the checks that are cheap enough to run on every local publish.
- The pull request, where the branch is compared with the line it will join.
- The CI pipeline, where the same checks run on a clean machine.
- The release, where the candidate is judged against the impact list, the risk tier, and the readiness checklist below.

Choose the points on purpose. The right set depends on the team and the product, and choosing it is part of leaving a prototype behind. Static analysis, tests, and automated review keep the project from drifting. An agent that can respond to a failing check turns that loop into the way the work proceeds.

Use the checks to drive the next edit. A signal that arrives while the change is still small tells you what to do next. A signal that arrives only at the end tells you that you are late.

## Risk Tiers

Match the depth of the check to the risk of the impact.

- **Low risk.** The functional path works, and a basic regression check still passes.
- **Medium risk.** Add the error path, an integration check, and an accessibility spot check.
- **High risk.** Validate the full critical path, confirm rollback is ready, and confirm monitoring covers the new path.

## Release Readiness

Before the release decision, the candidate should have this evidence:

- The critical user path passes in representative conditions.
- Known high-impact defects are fixed or explicitly mitigated.
- Observability is in place for new high-risk paths.
- A person is named who owns rollback and the first response if the release goes wrong.

[Microproduct Deployment](/docs/playbook/operate/microproduct-deployment) is where that rollback becomes a repeatable production action. This checklist is the reason you trust the action.

## Agent-Assisted Testing

Agents can write a large share of the suite. Point them at the right work.

- Tests for the highest-value workflow and its failure modes come first.
- Known sample data should make the expected result deterministic.
- Ambiguous or high-risk agent-generated changes still need a human review.

A few repository habits keep the suite meaningful as it grows. Keep architecture and names consistent. Require the checks, and name a reviewer who is accountable for the merge. Watch for defects that come back, and for areas that stay unstable, before those areas become the only places the product can change.

## From Evidence to a Decision

When the impact list, the checks, and the readiness evidence agree, the candidate is ready for the release decision. Timing, environment fit, and the deployment plan stay in the [Release Guide](/docs/playbook/build/release).
