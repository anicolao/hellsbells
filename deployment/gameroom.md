# Gameroom

Gameroom uses its existing Applications catalogue and generic integrated launch
protocol. No Gameroom source changes or Firebase rule changes are required.

WebURL is the Hell’s Bells `/play/` route. Icon is the box-cover WebP at
`/art/launcher/hellsbells.webp`. GameroomEnabled is `integrated`; Hidden is true
because this is a browser game, not a tabletop-launcher executable.

The launcher adds `table=XXXXXXXX`, `launch=create|join`, and `name=...`.
The host creates that exact table with room for five; guests wait for creation.
The host can resize the lobby or deal with three to five actual players.
Firebase Auth determines identities; names never claim existing seats.
A supplied `returnTo` is harmless and requires no back link.

Register the single requested catalogue entry after deploying its assets:

```sh
nix develop --command bun scripts/register-gameroom.ts
nix develop --command bun scripts/register-gameroom.ts --apply
```

For PR review, supply `--play-url=https://anicolao.github.io/hellsbells/prN/play/`
to both commands. After merging and deploying main, run the default command with
`--apply` to point the launcher at production. Registration reads the existing
catalogue, rejects duplicate Hell’s Bells entries, preserves unrelated fields
and documents, uses an update-time precondition and saves a backup before writing.
