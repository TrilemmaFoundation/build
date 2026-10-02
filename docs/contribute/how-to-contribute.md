---
title: How to Contribute
description: Exact process for proposing and publishing new hub content.
content_kind: reference
slug: /
last_reviewed: 2026-10-02
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
3. Run `npm run check` locally. It runs typecheck, validators, coverage tests,
   and the production build once each. Use `npm run check:fast` for development
   feedback without coverage or a build.
4. Open a PR and complete the checklist. GitHub processes pull requests, issues,
   and profile data under GitHub’s policies; you leave Trilemma Foundation
   websites when you open GitHub.
5. Committee members review, request changes if needed, and merge.

Frontmatter is parsed as full YAML, so quoted and multiline values, lists,
mappings, numbers, and booleans use normal YAML syntax. Malformed YAML and
duplicate keys fail validation.

For playbook documents, the source frontmatter `title` is the canonical page
heading. A document's duplicate `title` in `src/data/humanPlaybook.data.json` is
optional; category `title` fields remain required and control category headings.
Use source frontmatter `sidebar_label` to shorten a navigation label. JSON
`sidebarLabel` supplies a fallback when the source has no `sidebar_label`.
Human navigation, generated mirror metadata, and mirror overview links use the
source label, then JSON label, then canonical document title. LLM bundle headings
use a nonempty source title, then the legacy JSON title, then the node ID.

Keep the tree's `to` field aligned with the human page's canonical URL. Generated
mirror URLs follow that route even when frontmatter uses a relative `slug`.
Titles and navigation labels remain plain text in generated links, including
literal brackets, backslashes, and formatting punctuation.

Mirrors retain literal inline code and code blocks, including blocks inside
lists and block quotes. Code blocks retain their original line endings.
Reading-time estimates exclude code blocks, whether
they use backticks or tildes. Indented prose remains readable text under MDX.

Set `useDescriptionAsSubtitle: true` as a YAML boolean to show the document's
trimmed description beneath its generated title. The default and `false` hide
it; string and null values fail validation. Missing, empty, or whitespace-only
descriptions produce no subtitle. A hidden title (`hide_title: true`), an
explicit Markdown H1, or a generated agent mirror also suppresses the
subtitle.

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
Profile website links announce that they open in a new tab.

Starter `product.yaml` files are validated against the public product schema
and must select an archetype documented in the catalog. Every registry product
archetype must also exist as a page under `docs/archetypes/`.

`npm run test:coverage` runs Jest and Node's built-in test runner and is included
in `npm run check`. Jest requires 100% statements, branches, functions, and lines
for data, URL and navigation utilities, analytics client logic, and the
author-page plugin. The remaining collected UI code requires an aggregate 90%
for each metric. Substantive scripts retain 100% line, branch, and function
coverage; thin adapters and browser-tested framework chrome are excluded.

Test observable behavior, invalid inputs, and recovery. Retain publication,
registry, navigation, and accessibility contracts. Avoid tests that only repeat
editorial wording or require a specific source syntax. Coverage identifies
missing cases and does not replace meaningful assertions.

CI also checks lockfile stability and runs the complete Chromium route and
accessibility suite. Run the browser checks after a successful build:

```bash
npx playwright install chromium
npm run test:e2e -- --project=chromium
```

## Review Expectations

- Clear structure
- Actionable information
- Correct metadata
