# Game persistence

Every table uses `games/{id}` for coordination metadata and `games/{id}/events/{sequence}` for its append-only transcript. Both production and all PR previews use the same Firebase project, anonymous-auth identity namespace, paths, and version-1 event schema. Build prefixes never enter database paths. Keep an invitation’s game code when switching builds.

The room document contains only owner, members, computer seats, capacity, phase, revision, and schema version. The game state is reconstructed by the pure TypeScript reducer from ordered events. Each transaction checks the expected revision, creates the next numbered event, and updates room metadata together. Rules prohibit event updates/deletes, sequence gaps, outsider transcript reads, and acting for another player. Joins retry a legitimate revision race; gameplay rejects stale moves for the player to retry against the new state.

Randomness is seeded and replayable. The engine validates every command before writing and again during replay. Unknown schemas and invalid transcripts fail visibly without clearing or rewriting history. Future changes must preserve old event interpretation or introduce explicit version migration.

## Trust boundary

This initial release follows the peer-replayed model used by the reference project. Seated participants can read the complete event log, including the shuffle seed and private choices. The interface hides opponents’ cards, secret bids, and inspections, but the transcript is not cryptographically private. Firestore enforces membership and append-only coordination, not the entire game reducer; a modified participant client could append a well-formed but illegal move and make honest clients reject the transcript. This is a trusted-table release, not a server-authoritative anti-cheat service.

Computer imps are driven by the owner’s connected browser. They choose only from engine-legal moves and do not use opponents’ cards to plan. The owner must remain connected for computer turns to advance. Human-only tables do not depend on a designated browser for gameplay.

## Verification

`bun test tests/engine` covers all ten imps and 22 Arcana, including complete hands at each player count, five-round replay, card restrictions, scoring, recoveries, ties, and replacement interactions. `firebase emulators:exec --project demo-hellsbells --only auth,firestore "bun test"` also exercises Firestore permissions, immutable logs, concurrency, membership, and stale revisions.

`bun run test:play` plays all five rounds through the actual card and token controls, reloads the completed table, and checks mobile rendering. It requires a running development server and the local emulators. `VITE_BOT_DELAY_MS` shortens presentation delays for browser testing; it does not change rules or event interpretation.
