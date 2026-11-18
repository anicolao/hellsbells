# Trained opponents

The easy bot and `rl-v1` are frozen benchmarks. New trained tables use `rl-v2`; old registration events retain their original policy. All versions use the same append-only Firestore paths. Registration values are zero/omitted for easy, one for v1, and two for v2. Trained tables require three players.

## Policy

Version two combines a learned discard network, learned tactical scoring weights, and bidding search. The bidding network supports self-play training and predicts the bids of sampled v2 peers. The final bidding policy simulates up to 128 possible unseen deals, focuses further simulations on the strongest legal bids, and selects the best expected return. In the final round it prioritizes an outright game win. With five or fewer cards, it also compares legal plays across 20 sampled endgames. Search runs in a browser worker; the host checks the game revision again before appending its result.

Training uses counterfactual Monte Carlo action values with replay for bids/discards and cross-entropy policy search with complete-game rewards for tactical weights. The league rotates through two easy opponents, two frozen v1 opponents, mixed opponents, and two copies of the current policy. Action-value training uses the learned bidding network for self-play. A later experimental stage enabled bidding search on both sides; its proposals were not retained because they did not improve development results. Public card counts, contract progress, legal plays, and power availability provide the tactical features.

The policy reads its own hand/discards and permitted public information. Actual opponent hands, their discards, the reserve, and engine RNG are excluded. Committed Moon bids are masked. Counterfactual training targets may use complete simulator states; deployed decisions sample hidden cards independently. Completed tricks are retained as derived public state during replay; no events are rewritten.

## Validation

`models/rl-v2-manifest.json` records checkpoint hashes and acceptance results. Each predeclared opponent cohort must have an observed outright win rate of at least 90%; 95% Wilson confidence intervals are reported separately. Shared wins do not count. Held-out deals are used only after freezing the candidate; all three seats are represented equally.

The acceptance run contains 2,001 games against two v1 bots, 2,001 against two easy bots, and 2,001 against one of each. Reports and training development curves are in `reports/rl/`. Each report records its evaluation source revision and source hashes. Registered opponent policies are public inputs to the planner; unidentified players use independent policy hypotheses.

Run the frozen benchmark with `bun run rl:verify:v2`. It is CPU intensive and parallelizes across eight workers by default. Set `WORKERS` to change concurrency. This benchmark is separate from normal CI; CI checks the manifest, hidden-information boundaries, complete legal games, Firestore persistence, browser workers, reloads, and responsive layouts.

## Further training

Candidates go to ignored `tmp/rl/`, leaving frozen models unchanged. For example:

```sh
EPISODES=2000 bun run rl:train:league
MODE=discard EPISODES=1500 BID_MODEL=tmp/rl/league-bid.json \
  TRAIN_NAMESPACE=hellsbells-league-discard-train-v3 \
  OUTPUT=tmp/rl/league-discard.json bun run rl:train:league
BID_MODEL=tmp/rl/league-bid.json DISCARD_MODEL=tmp/rl/league-discard.json \
  GENERATIONS=20 bun run rl:train:tactics
```

The scripts support resuming policies, fixed training seeds, custom namespaces, and development evaluation intervals. Training namespaces cannot contain held-out/development/evaluation markers. Development selection and acceptance evaluation are separate. Use a fresh held-out namespace after changing a candidate based on evaluation results. Evaluation snapshots model bytes before launching workers so concurrent training cannot change an in-progress run.

The original v1 60% confidence-bound benchmark remains available as `bun run rl:verify`; its models and historical report are unchanged.
