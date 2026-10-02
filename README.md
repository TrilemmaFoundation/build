# Build Trilemma

This repository is the **Build Trilemma** site—patterns, templates, standards, registry, and playbooks for humans and AI agents—served from `https://build.trilemma.foundation`. Microproducts remain focused apps that turn data into usable tools and real utility.

This repository is an open knowledge hub to help builders learn, contribute, and ship microproducts through community-reviewed playbooks and examples.

## Start Here

- **Site routing:** On the deployed site, `/` is an audience chooser. Use `/docs/request-for-microproducts` as the human entry point and `/agents` as the agent web hub (paths match this repo’s Docusaurus routes). Navbar search (Cmd/Ctrl+K) covers the documentation except archetype pages and generated agent-mirror playbook pages; use the [archetype catalog](docs/archetypes/index.md) to browse archetypes, while mirrored playbook hits resolve to `/docs/...`. Stable machine-readable URLs such as `/registry.json` and `/schemas/product.schema.json` are summarized on the agents hub.
- Learn the process: [Playbook](docs/human/playbook/frame/frame.md)
- Explore examples: [Showcase](docs/showcase/microproducts.md)
- Contribute: [How to contribute](docs/contribute/how-to-contribute.md)
- Agent-facing files: repo working-copy [`AGENTS.md`](AGENTS.md); published site copies in `static/AGENTS.md`, `static/llms.txt`, and generated `static/llms-full.txt` (created on `npm run dev` and `npm run build`)

## Local Development

Requires Node.js 22. With `nvm`, run `nvm use` to select the repository's
reproducible development and CI version, Node.js 22.18.0, from `.nvmrc`.

```bash
nvm use
npm ci
npm run dev
```

Use `npm ci` so the locked tree is installed without rewriting `package-lock.json`. `npm install` on npm 11+ can drop `"dev": true` metadata and add `"peer": true` entries; do not commit those diffs. Add or update dependencies only with Node.js 22.18.0 from `.nvmrc`.

`npm run dev` runs a short pre-step that removes `.docusaurus` and `node_modules/.cache`, regenerates the agent mirror under `docs/agents/human/` from `docs/human/`, and writes `static/llms-full.txt`. Do not edit generated mirror files or `llms-full.txt` directly. Use `npm run clear` to clear the Docusaurus cache, or `npm run clean` to also remove `build/` and `coverage/`.

Mirrors preserve `draft` and `unlisted` publication flags. Both kinds are omitted
from the generated mirror overview and full LLM context bundle; draft mirrors
are excluded from production, while unlisted mirrors retain direct-link access.

## Validation

```bash
npm run check
```

This runs:

- TypeScript checking (`tsc --noEmit`)
- spelling check (`cspell` on `docs/`, `product-templates/`, `templates/`)
- full YAML frontmatter validation, including real `YYYY-MM-DD` review dates and mirror-specific rules for generated agent docs when present
- registry JSON and starter `product.yaml` validation against
  `static/schemas/product.schema.json`; product and starter archetypes must match the catalog
- playbook tree sync check (`humanPlaybook.data.json` must match every file under `docs/human/`)
- markdown lint for `docs/**/*.md` and `docs/**/*.mdx`, plus `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, `templates/**/*.md`, `product-templates/**/*.md`, and `products/**/*.md` (generated `docs/agents/human/**` is excluded)
- unit and script tests with coverage (`npm run test:coverage`)
- `generate-agent-docs`, `generate-llms-full`, production Docusaurus build, and build-artifact validation (static output + link checks)

`npm run check:fast` runs validation and tests without coverage or the production
build. Husky runs that faster feedback loop on `git push`. Use `npm run check`
before opening a PR; it enforces the same coverage policy as CI.

## Tests

`npm run check` runs validation, coverage tests, and the production build once
each. Run only the coverage tests with `npm run test:coverage`, or use `npm test`
for faster tests without coverage.

Jest requires 100% statements, branches, functions, and lines for `src/data/`,
`src/utils/`, `src/client/`, and the author-page plugin. The remaining collected
UI code has an aggregate 90% threshold for each metric. Substantive Node scripts
retain 100% line, branch, and function coverage. Thin command-line adapters and
framework chrome exercised in browsers remain outside percentage gates.

Test observable behavior and failure cases. Keep validation, publication,
security, navigation, accessibility, and recovery contracts; avoid assertions
that merely repeat editorial wording or require a particular source syntax.
Coverage helps find missing cases and does not replace meaningful assertions.

CI separately confirms `package-lock.json` stays unchanged after
`npm install --package-lock-only`, runs `npm run check:ci` and
`npm run test:coverage`, and runs the complete Chromium route and accessibility
suite. To run the browser checks locally after building:

```bash
npx playwright install chromium
npm run test:e2e -- --project=chromium
```

## Spelling Check

We use `cspell` to automatically check for spelling mistakes in the docs, which
helps prevent noisy review comments. This tool is integrated into IDEs, which
highlight spelling errors similarly to other linting or quality issues. If
you find that a word is not recognized, you have the option to add it to our
dictionary which is included in version control. Examples of domain-specific but
legitimate words that might be added include the term "Microproduct" itself.

Example: `echo "microproduct" >> project-words.txt`

Many IDEs support auto-fixing the issue. Here's what it looks like in VSCode:
![cspell auto-fix screenshot](static/tooling/cspell/cspell_auto_fix.png)

Make sure to add to dictionary file and not just editor settings so that the
change is picked up in the checker script and can be used by others.

## Shared Foundation design

See the [versioned design contract](src/design/README.md).
