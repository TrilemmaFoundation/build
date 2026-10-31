# Repository agent notes

This file is for people and coding agents working in this repository. The published site agent entrypoint is [`static/AGENTS.md`](static/AGENTS.md) (served at `/AGENTS.md`). Edit that file when changing the public agent contract.

Before finishing work, run `npm run check`. Fix lint, type, and test failures yourself unless a human decision is required.

## Local header

Every route renders one Build-local header with a centered 44px Trilemma Foundation symbol link. From 997px, Humans and Agents sit on the symbol's left and Templates and Showcase on its right. Narrower widths keep those four routes in one scrolling row under the symbol. Keep the page drawer and search available; do not add the Foundation global navigation to this subdomain.
