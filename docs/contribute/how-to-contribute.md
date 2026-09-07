---
title: How to Contribute
description: Exact process for proposing and publishing new hub content.
content_kind: reference
slug: /
last_reviewed: 2026-08-28
authors: [trilemma-foundation]
---

## Contribution Workflow

Use Node.js 22 for repository work. Run `nvm use` to select the Node.js 22.18.0
version pinned in `.nvmrc`, then install the locked dependency tree with
`npm ci`.

1. Playbook modules: copy `templates/playbook-module.md`. Showcase entries: edit
   the table in `docs/showcase/microproducts.md`. Other islands (agents,
   archetypes, standards, contribute, templates): edit or add a page in that
   section rather than copying a playbook template.
2. Add required YAML frontmatter and content. `last_reviewed` must be a real
   calendar date in `YYYY-MM-DD` form. Module pages (the default
   `content_kind`) also require `authors` with registered IDs from
   `src/data/authors.json`.
3. Run `npm run check` and `npm run test:coverage` locally. `check` already includes typecheck, validators, tests, and the production build.
4. Open a PR and complete the checklist. GitHub processes pull requests, issues,
   and profile data under GitHub’s policies; you leave Trilemma Foundation
   websites when you open GitHub.
5. Committee members review, request changes if needed, and merge.

Frontmatter is parsed as full YAML, so quoted and multiline values, lists,
mappings, numbers, and booleans use normal YAML syntax. Malformed YAML and
duplicate keys fail validation.

Registry link fields (`repo`, `site`, `docs`, and `agent_entrypoint`) must use
public HTTPS domains. Localhost, local or internal domains, credentials, and
IP-address destinations are rejected by registry validation. URLs on
`build.trilemma.foundation` must also resolve to an existing file under
`static/` (directory paths, missing files, paths that escape `static/`,
and invalid percent-encoding fail validation).

Optional profile URLs in `src/data/authors.json` use the same public HTTPS
rules. Unsafe schemes (including `javascript:` and `http:`) fail frontmatter
validation and are stripped at render time.

Each registered author receives a native `/authors/<id>` page. Add an optional
plain-text `bio` to the author record when approved profile copy is available;
the page lists every public canonical doc that explicitly names that author,
ordered by `last_reviewed`.

Starter `product.yaml` files are validated against the public product schema
and must select an archetype documented in the catalog. Every registry product
archetype must also exist as a page under `docs/archetypes/`.

`npm run test:coverage` runs Jest for React code and Node's built-in test
runner for scripts. The critical validation, read-time, and LLM transformation
modules must retain 100% line, branch, and function coverage.

## Review Expectations

- Clear structure
- Actionable information
- Correct metadata
