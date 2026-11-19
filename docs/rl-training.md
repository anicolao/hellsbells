# Trained opponents

New trained seats use `rl-v3`, with separate bid networks, discard networks, and tactical weights for three, four, and five players. Both practice and friends tables support all three counts. The model is selected from the current table size, so hosts can resize a lobby containing bots.

All versions use the same append-only Firestore paths. Registration values are zero/omitted for easy, one for v1, two for v2, and three for v3. Existing three-player v1/v2 seats retain their original decisions. If a lobby containing an older trained seat grows to four or five players, that seat uses the corresponding v3 model. Historical models and validation reports remain unchanged.

## Decisions and information

The policy combines a learned discard network, learned tactical scoring weights, and bidding search. Bidding simulates up to 128 unseen deals, focusing further simulations on the strongest legal bids. In the final round it prioritizes an outright game win. With five or fewer cards, it compares legal plays across 20 sampled endgames. The learned bidding network supports training and predicts sampled peers' bids. Search runs in a browser worker; the host checks the room and event revision again before appending its result.

The 152-input observation includes four clockwise opponent slots with presence masks, public scores, and visible bids. It reads the bot's own hand/discards and permitted public information. Actual opponent hands, their discards, the reserve, and engine RNG are excluded. Committed Moon bids are masked. Counterfactual training targets use simulator states; deployed decisions sample hidden cards independently. Completed tricks remain derived public state during replay; no events are rewritten.

## Training

Each count starts from the frozen v2 networks, expanded to the new observation schema while preserving their three-player predictions. Bid/discard training uses counterfactual Monte Carlo action values, replay, and a rotating league of easy, prior, mixed, and current self-play opponents. Tactical weights are trained separately by cross-entropy policy search using complete-game rewards. Development deals select checkpoints; held-out deals are separate.

The bootstrap ran 1,600 bid and 1,200 discard episodes per count, followed by 1,400 episodes of each refinement and eight tactical generations. The bootstrap's comparison policy accidentally shared the learner's weights: those comparisons measure current self-play, not a frozen baseline. Refinement uses independently copied frozen weights. Model provenance and training curves record this distinction. Warm-start training resets optimizer moments; the selected run retained the prior step counter, so its logs describe the experiment rather than a guarantee of bit-for-bit reproduction.

Candidates are written under ignored `tmp/rl/`. Examples:

```sh
PLAYERS=4 EPISODES=2000 bun run rl:train:multi
PLAYERS=4 MODE=discard EPISODES=1500 \
  BID_MODEL=tmp/rl/multi/4/bid.json bun run rl:train:multi
PLAYERS=4 GENERATIONS=8 bun run rl:train:multi-tactics
```

Use distinct namespaces for new experiments. Training namespaces reject held-out, development, and evaluation markers. The scripts support warm starts, seeds, development intervals, and output paths.

## Validation

`models/rl-v3-manifest.json` links model hashes, per-count results, and training metadata. Held-out reports in `reports/rl/heldout-v3-*.json` record source hashes, model hashes, seeds/namespaces, seat counts, outright wins, shared wins, and 95% Wilson intervals. Each cohort has 900 complete games, equally divided across every seat. Shared wins are excluded from win rates. The easy-bot target is 90% outright wins at each count. Stronger lineups are diagnostic comparisons and do not carry a 90% guarantee.

Three-player opponents are easy, frozen v1, or one of each. Four- and five-player opponents are easy, unretuned v2 neural policies transferred to the wider schema, or alternating easy/transfer policies. The transfer baseline has no sampled planner and is not a previously shipped four/five-player bot. These results compare specific bot lineups; they do not predict a win rate against humans or equally strong trained bots.

Measured outright wins in 900 held-out games per lineup:

- 3 players: easy 877/900 (97.44%), frozen v1 837/900 (93.00%), mixed 814/900 (90.44%).
- 4 players: easy 853/900 (94.78%), all transfer 399/900 (44.33%), mixed 764/900 (84.89%).
- 5 players: easy 882/900 (98.00%), all transfer 518/900 (57.56%), mixed 729/900 (81.00%).

Run `bun run rl:verify:v3` to repeat the frozen benchmarks, or `PLAYERS=5 OPPONENT=easy BID_MODEL=models/rl-v3-5-bid.json DISCARD_MODEL=models/rl-v3-5-discard.json TACTICS=models/rl-v3-5-strategy.json bun run rl:evaluate:multi` for one cohort. This is CPU intensive; `WORKERS` controls concurrency. Evaluation snapshots model bytes before launching workers. Use a fresh held-out namespace after changing a candidate based on evaluation results.

CI checks observation masking, hidden-information boundaries, legal complete games, frozen legacy decisions, model/report integrity, Firestore persistence, workers, reloads, and responsive layouts. Browser checks exercise trained practice at every count and mixed friends lobbies through five seats.

The frozen v2 benchmark remains `bun run rl:verify:v2` (94.25% outright wins across 6,003 three-player games). The original v1 benchmark remains `bun run rl:verify` (60% confidence-bound target). Their historical models and reports are unchanged.
