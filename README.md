# Hell’s Bells

Illustrated, print-ready SvelteKit rulebook and reusable game components, written in TypeScript and built with Bun.

## Run

```sh
nix develop
bun install
bun run dev
```

- Rulebook: http://127.0.0.1:5197/rules.html
- Component gallery: http://127.0.0.1:5197/gallery

`bun run check`, `bun test`, and `bun run build` verify types, game data, and compilation.

## Components and content

`src/lib/components/GameCard.svelte` renders every playing card, imp, Arcana, and card back. The rulebook examples and gallery import the same component. `SuitIcon.svelte` and `ScoreSheet.svelte` provide shared suit graphics and score ledgers. Components accept typed props; gallery selection and filtering remain outside the card renderer.

`HELLS_BELLS_RULES.md` is authoritative. `scripts/catalog.ts` extracts its card text into `src/lib/data/catalog.json`; the app uses that catalog for all card faces. The full reference is rendered from the Markdown on the server. Generated artwork and its exact prompts are in `static/art/`.

The gallery includes all 88 cards, reversible faces, full-size inspection, search, suit and category filters, a printable blank score ledger, and examples of power markers and concealed choices.

## Artwork and printing

`static/art/v2/` contains individual generated source illustrations, two card frames with real alpha windows, the card back, suit emblems, court cards, and the power token. Exact imagegen prompts are recorded alongside them. `bun run art:prepare` converts the source assets to WebP while preserving aspect ratios. All artwork uses `object-fit: contain`; card frames and live text are separate layers.

The rulebook includes A4 print styles and a checked thirteen-page PDF at `/downloads/hells-bells-rulebook.pdf`. To refresh that PDF and run browser layout checks locally, use `bun run review`. The review script uses a locally cached Chromium installation and writes screenshots and reports under ignored `tmp/qa/`.

The rulebook teaches through static illustrated examples shared by web and print. Its learning chapters lead into the full authoritative reference; no interactive lessons or controls are embedded in the book.

## License

Copyright (c) 2026 Hell’s Bells contributors. Distributed under GPL-3.0-only; see LICENSE. Bundled fonts retain their own licenses.

## GitHub Pages

Production is served at https://anicolao.github.io/hellsbells/ after changes merge into main. Each same-repository PR is retained at `/hellsbells/pr<number>/`. Builds use `PUBLIC_BASE_PATH` and adapter-static. Verification stages the build on gh-pages without removing other previews, then dispatches the main-branch publishing workflow. Only that trusted main workflow deploys the combined site to the github-pages environment.
