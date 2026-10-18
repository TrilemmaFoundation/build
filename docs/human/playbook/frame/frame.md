---
title: Frame
description: "Phase 1 of the playbook: validate opportunity and architecture before building."
slug: /playbook/frame
tags: [playbook, frame]
last_reviewed: 2026-10-18
authors: [trilemma-foundation]
---

## Phase Goal

Establish whether a microproduct is worth building and feasible to deliver before you enter execution.

## What Must Be True Before You Build

- A repeated workflow pain exists for a specific user segment.
- You can access enough data to create clear utility, and every material external source has documented usage rights. See [Data Licensing](/docs/playbook/frame/data-licensing).
- The value proposition is concrete enough to test quickly.
- A baseline architecture is feasible within team and budget constraints, and every material data product has a justified data architecture: sources, freshness, storage, serving, and complexity. See [Modern Data Stack](/docs/playbook/frame/modern-data-stack).
- Requirements are translated into specifications and module boundaries before implementation. See [Design](/docs/playbook/frame/design).

## Required Outputs

- Problem brief with target user, problem, data inputs, output utility, and success metric.
- Usage rights for each material external data input: license, terms reviewed, and whether commercial use, redistribution, attribution, and share-alike apply.
- Go/no-go criteria for moving into implementation.
- `architecture.md` `data_architecture` record for every material data product: sources, volume, freshness, ingestion, storage, transformation, orchestration, serving, reliability, quality, cost, and complexity justification.

[Propose an improvement](https://github.com/TrilemmaFoundation/build/pulls)
