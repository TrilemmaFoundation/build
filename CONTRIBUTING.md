# Contributing

Thank you for helping improve the Build Trilemma knowledge hub. The full contribution workflow lives in the site guide at `/contribute` and in [`docs/contribute/how-to-contribute.md`](docs/contribute/how-to-contribute.md), which is the canonical source of truth.

## Quickstart

- Add or update playbook modules from `templates/playbook-module.md`. Showcase entries first belong in [Trilemma Data Apps](https://data.trilemma.foundation/apps), then update the table in `docs/showcase/microproducts.md` using the [manual alignment workflow](docs/contribute/how-to-contribute.md#showcase-alignment). Other doc islands follow that section’s existing page.
- Ensure each markdown file includes `title`, `description`, `last_reviewed` (`YYYY-MM-DD`), and `authors` (registered IDs from `src/data/authors.json`). Default `content_kind` is `module`, which requires `authors`. Author registry records may include an optional plain-text `bio` for their native `/authors/<id>` profile page.
- Run the completion check locally; it includes validation, coverage tests, and the production build:

```bash
npm run check
```

- Use `npm run check:fast` for quicker validation and tests without coverage or a build. CI additionally checks lockfile stability and Chromium routes and accessibility.
- Test behavior and failure cases rather than editorial wording or source syntax. Critical data, URL, analytics, author-page, and script logic retain 100% coverage; remaining covered UI code requires 90% aggregate coverage.
- Open a pull request and complete the checklist.

For contribution details, review expectations, and section-specific guidance, use [`docs/contribute/how-to-contribute.md`](docs/contribute/how-to-contribute.md).
