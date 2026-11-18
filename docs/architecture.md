# Game persistence

Every table uses `games/{id}` for coordination metadata and `games/{id}/events/{sequence}` for its append-only transcript. Both production and all PR previews use the same Firebase project, anonymous-auth identity namespace, paths, and version-1 event schema. Build prefixes never enter database paths. Keep an invitation’s game code when switching builds.

The room document contains only owner, members, computer seats, capacity, phase, revision, and schema version. The game state is reconstructed by the pure TypeScript reducer from ordered events. Each transaction checks the expected revision, creates the next numbered event, and updates room metadata together. Rules prohibit event updates/deletes, sequence gaps, outsider transcript reads, and acting for another player. Joins and independent simultaneous choices retry revision races. Drafts, discards, secret bids, and simultaneous bid adjustments revalidate against the refreshed transcript within the same round and phase; card plays reject stale moves for the player to retry.

Randomness is seeded and replayable. The engine validates every command before writing and again during replay. Unknown schemas and invalid transcripts fail visibly without clearing or rewriting history. Future changes must preserve old event interpretation or introduce explicit version migration.

## Trust boundary

This initial release follows the peer-replayed model used by the reference project. Seated participants can read the complete event log, including the shuffle seed and private choices. The interface hides opponents’ cards, secret bids, and inspections, but the transcript is not cryptographically private. Firestore enforces membership and append-only coordination, not the entire game reducer; a modified participant client could append a well-formed but illegal move and make honest clients reject the transcript. This is a trusted-table release, not a server-authoritative anti-cheat service.

Computer imps are driven by the owner’s connected browser. They choose only from engine-legal moves and do not use opponents’ cards to plan. The owner must remain connected for computer turns to advance. Human-only tables do not depend on a designated browser for gameplay.

## Verification

`bun test tests/engine` covers all ten imps and 22 Arcana, including complete hands at each player count, five-round replay, card restrictions, scoring, recoveries, ties, and replacement interactions. `firebase emulators:exec --project demo-hellsbells --only auth,firestore "bun test"` also exercises Firestore permissions, immutable logs, concurrency, membership, and stale revisions.

`bun run test:play` plays all five rounds through the actual card and token controls, reloads the completed table, and checks mobile rendering. It requires a running development server and the local emulators. `VITE_BOT_DELAY_MS` shortens presentation delays for browser testing; it does not change rules or event interpretation.

## Local motion review

Run `bun run dev -- --port 5202`, then open `/dev/animations`. The lab uses the same table, card, fan, transition decisions, and motion calculations as live play, with deterministic local fixtures and no Firebase connection. Select an outcome and player count, play/pause at different speeds, or scrub the timeline forward and backward. Real decision scenarios remain paused until a card, contract token, or imp is chosen. Reset restores the fixture.

`bun run test:animations` checks scrubbing, decision pauses, both Empress choices, and fan bounds for 3–5 players at desktop, phone, and landscape sizes. Set `LAB_URL` to use another local server. Live no-choice stages append the existing continuation events after their animation; the event schema and existing games remain compatible.

At round end, `continue` with `value: 1` records one seat’s readiness in `done`. These independent signals retry revision races. Once everyone is ready, a brief presentation delay lets the final seal land before an unvalued `continue` deals the next round. Existing unvalued continuation events retain their original interpretation during replay. Readiness resets when the new round starts.

Round results retain each player’s final bid, tricks won, original penalty, recovery, and total at scoring. These snapshots are derived during replay of the existing event transcript, so older games acquire the complete round ledger without rewriting events or changing Firestore paths. The scoring view highlights the latest round and keeps earlier rounds and readiness seals visible.

## Trained three-player bot

`src/lib/engine/rl-bot.ts` exports `rlBotCommand(state, playerId)` with the same command interface as the easy bot. It uses frozen Monte Carlo action-value networks for bidding and selecting among six legal discard patterns. Other decisions use the existing easy policy, as do games with more than three players. The easy bot remains the unchanged benchmark. The entry screen offers Easy Imps and Trained Imps practice decks; trained practice always creates a three-player table. Bot registration events use `value: 1` for the frozen `rl-v1` policy and omit the value (or use zero) for easy bots. Replay preserves the choice, and the host lazily loads the trained policy to drive those seats. Existing bot events remain easy.

The networks read the player's own cards, public scores, public bids, dealer position, and round power. Moon bids remain hidden. They never read the game RNG, reserve, opponent hands/discards, or secret opponent choices. Training can simulate counterfactual actions through the real engine to obtain rewards; runtime inference uses only the observation vector and learned weights, with no simulations or hidden-card access.

Frozen checkpoint hashes, training namespaces, and the acceptance criterion are in `models/rl-manifest.json`. In 6,000 held-out complete five-round games against two easy bots, rotating through all three seats, the learned bot won outright 4,137 times (68.95%; 95% Wilson interval 67.77–70.11%). Shared wins are excluded from that rate and reported separately. The easy baseline won 31.65% on the same seeds. Reports are in `reports/rl/`; the held-out namespace was not used for training or checkpoint selection.

Run `bun run rl:verify` to replay the 6,000-game acceptance benchmark. It fails if the 95% confidence lower bound falls below 60%. `bun run rl:baseline` runs the paired all-easy benchmark. Frozen weights are not overwritten by training; candidate checkpoints go to `tmp/rl/`.

To reproduce the selected training stages, run `FEATURES=81 EPISODES=2750 OUTPUT=tmp/rl/reproduced-bid.json bun run rl:train:bids`, then `BID_MODEL=tmp/rl/reproduced-bid.json EPISODES=750 OUTPUT=tmp/rl/reproduced-discard.json bun run rl:train:discards`. Both scripts default to the recorded training seeds, use replay to fit action values from observed round rewards, and select checkpoints only on the 600-game development set. Use `bun scripts/rl/evaluate.ts tmp/rl/reproduced-bid.json tmp/rl/reproduced-discard.json` for a fresh evaluation. Training and evaluation use TypeScript and Bun on CPU; the original runs used Bun 1.3.10. `reports/rl/training.json` retains the development curves, including unsuccessful bidding-only experiments.
