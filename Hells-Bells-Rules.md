# Hell’s Bells

## A game of exact bids, infernal interference, and increasingly deliberate hands

**Four-player rules • Five rounds • Consolidated playtest edition • 17 November 2026**

You are an ambitious little imp trying to ring exactly the right number of bells. Before each round, shape your hand by discarding cards, then bid how many tricks you will win. Hit your bid and take no penalty. Miss it and pay for every trick of error. As the game progresses, you discard more cards—and every mistake costs more.

Each player keeps the same imp throughout the game. A different Major Arcana card governs each round, setting both its special rule and its trump suit. Four regular rounds lead to a final catch-up round.

> **Edition status.** This file preserves the latest explicit revisions in the design conversation and the requirements accompanying this edition. The conversation did not settle every interaction. Rules marked **Playtest ruling** are editorial resolutions that make this edition playable; they are not claims that those choices were previously agreed. The trump table is a **new practical assignment**, requested for this edition. Significant open design questions appear at the end.

## Contents

- [Object and components](#object-and-components)
- [Setup](#setup)
- [The five rounds](#the-five-rounds)
- [Playing a round](#playing-a-round)
- [Scoring and winning](#scoring-and-winning)
- [The ten persistent imps](#the-ten-persistent-imps)
- [Trump assignments](#trump-assignments)
- [The fifteen regular Arcana](#the-fifteen-regular-arcana)
- [The seven catch-up Arcana](#the-seven-catch-up-arcana)
- [Power timing and interactions](#power-timing-and-interactions)
- [Rulings and remaining design questions](#rulings-and-remaining-design-questions)
- [Quick reference](#quick-reference)

## Object and components

Finish five rounds with the **fewest accumulated penalty points**. **Zero is best.**

You need:

- **56 Minor Arcana playing cards:** Wands, Cups, Swords, and Pentacles, with 14 cards in each suit.
- **22 Major Arcana round cards**, separated into two decks:
  - **15 regular cards:** 0–XIV, The Fool through Temperance.
  - **7 catch-up cards:** XV–XXI, The Devil through The World.
- **10 imp character cards**, one for each character in this rulebook.
- A score sheet recording each player’s bid, counted tricks, round penalty, cumulative penalties, and any recovery of earlier penalties.
- A way to mark used imp powers, the Emperor’s command, and one-use bid adjustments.
- Paper or other concealed markers for secret bids and secret player choices.

Major Arcana are never dealt into players’ hands or played to tricks. Imp characters are separate from both tarot decks.

### Card rank

**Playtest ruling:** Within each suit, rank cards from low to high:

**Ace (1), 2, 3, 4, 5, 6, 7, 8, 9, 10, Page (11), Knight (12), Queen (13), King (14).**

All four suits have the same ranks. Suits have no permanent hierarchy: a suit outranks another only through trump or a stated power. The conversation specified 14 cards per suit but did not settle rank order; this edition uses Ace low.

## Setup

1. Separate the Minor Arcana, regular Major Arcana, catch-up Major Arcana, and imp characters.
2. Shuffle the regular and catch-up decks separately and keep them face down.
3. Give each player one imp. Keep that character face up for all five rounds.
4. Choose the first dealer. Play, dealing, and ordinary bidding proceed clockwise. The dealer changes one seat clockwise after each round.
5. Start every player at **0 penalty points**.

**Playtest ruling:** Randomly deal distinct imp characters and choose the first dealer randomly. Character drafting and deliberate selection were not settled. Unused characters have no effect.

This edition fully specifies **four players**. See the design questions for other player counts.

## The five rounds

The initial deal stays the same every round. The number of discards increases.

| Round | Round-card deck | Dealt per player | Undealt reserve | Discard per player | Cards played per player | Physical tricks | Penalty per trick of error |
|---|---|---:|---:|---:|---:|---:|---:|
| 1 | Regular | 13 | 4 | 1 | 12 | 12 | 1 |
| 2 | Regular | 13 | 4 | 2 | 11 | 11 | 2 |
| 3 | Regular | 13 | 4 | 3 | 10 | 10 | 3 |
| 4 | Regular | 13 | 4 | 4 | 9 | 9 | 4 |
| 5 | Catch-up | 13 | 4 | 5 | 8 | 8 | 5 |

The **four undealt cards represent one reserved card per player**. They form a shared face-down reserve, not four individually owned cards.

**Death exception:** Death adds one *counted* trick to its round without adding another physical trick or another card play. See Death for bidding and scoring.

## Playing a round

### 1. Reveal the round card and trump

For rounds 1–4, draw one regular Arcana without replacement. For round 5, draw one catch-up Arcana. Place it face up and read its effect aloud.

The card’s printed or annotated trump assignment determines trump for the round. Use the [trump table](#trump-assignments).

**Never reveal a Minor Arcana card to determine trump.** Trump is known before discarding and bidding, and its designated suit remains fixed throughout the round. Furfur and Strength can temporarily suppress trump’s winning advantage without changing which suit is designated trump.

At the start of round 5, record standings before applying that round’s effects. Catch-up eligibility uses these standings throughout the round.

### 2. Deal and reserve

Gather and shuffle all 56 Minor Arcana at the start of every round, including cards previously played, discarded, reserved, or exchanged out.

Set four random cards aside face down as the **undealt reserve**. Deal the remaining 52 cards equally: **13 to each player**. Do not inspect the reserve unless a power permits it.

### 3. Discard

Each player privately chooses and discards exactly as many cards as the round number: **1, 2, 3, 4, then 5**. Place these cards face down outside the hand.

Discards are not tricks, do not count toward anyone’s bid, and cannot be played later that round. Keep them separate from the undealt reserve. They are unavailable to exchange powers.

**Playtest ruling:** Everyone completes discarding before any pre-bid information or exchange power resolves. Keep discards concealed until the round ends.

### 4. Resolve pre-bid powers

Resolve the current Arcana’s pre-bid effect and any permitted imp effect, including Balam’s Foretelling. The Fool and Magician act **after the normal discard and before any bids**. The Hermit’s reserved card is chosen here.

**Playtest ruling:** Resolve the Arcana’s pre-bid procedure first, then pre-bid imp powers. Where several players act, start to the dealer’s left and proceed clockwise. Balam acts in this shared window before anyone bids, avoiding a seat-dependent information advantage.

### 5. Bid

Starting with the player to the dealer’s left, each player publicly announces an integer bid: the exact number of counted tricks they expect to win. The dealer bids last. Record all bids visibly.

Normally, a bid may range from **0 to the number of physical tricks** in the round, inclusive. A zero bid is allowed and means the player intends to win no tricks.

#### The dealer’s hook

The dealer must choose a bid that makes the **sum of all initial bids different from the total counted tricks available**.

For example, round 1 has 12 tricks. If the first three bids total 9, the dealer may not bid 3. Any other bid in the legal range is allowed.

The hook prevents all players from making their initial contracts simultaneously. Later powers that change bids can remove that guarantee. The Moon explicitly suspends the hook.

For Death, apply the hook to **physical tricks + 1**. If Death governs round 3, there are 10 physical tricks but 11 counted tricks, so initial bids must not total 11.

### 6. Complete any post-bid instructions

Resolve effects explicitly assigned to this window: The Lovers’ secret choices and Judgement’s optional adjustment, for example. The Magician does **not** act here.

### 7. Play tricks

**Playtest ruling:** The player to the dealer’s left leads the first trick. Normally, the winner of a trick leads the next. Seere can change the next leader.

Each trick consists of one card played by each player:

1. The leader plays a card, establishing the **led suit**.
2. Each other player, clockwise, plays one card.
3. A player who holds an available card of the led suit **must follow suit**.
4. A player unable to follow suit may play any available card, including trump. There is no ordinary requirement to trump, overtrump, or beat the current winning card. The Hierophant changes the requirement to trump.
5. After all cards and permitted reactions resolve, determine the winner.

Normally, the **highest trump** wins if any trump was played. Otherwise, the **highest card of the led suit** wins. Off-suit, non-trump cards cannot win.

Keep each player’s won tricks countable and public. A completed trick stays completed; a power cannot retroactively change its winner.

Use the current led suit when deciding what later players must follow. If a power legally changes the lead, earlier legal plays are not retrospectively invalidated. See Amdusias and Agares for this edition’s timing resolution.

### 8. Score and reset

After the final trick, calculate penalties and resolve scoring effects. Return all Minor Arcana to the deck. Reset once-per-round character powers and pass the deal clockwise.

## Scoring and winning

For each player, calculate:

**Round penalty = round number × |counted tricks won − final bid|**

Use the player’s final bid after any permitted adjustments. Making a contract exactly scores **0** for the round.

| Example | Calculation | Penalty |
|---|---|---:|
| Round 1: bid 4, win 4 | 1 × \|4 − 4\| | 0 |
| Round 3: bid 4, win 2 | 3 × \|2 − 4\| | 6 |
| Round 5: bid 0, win 2 | 5 × \|2 − 0\| | 10 |

This rulebook records penalties as **positive amounts to minimize**. The conversation sometimes expressed the same losses as −1 through −5 per trick of error. Use one notation consistently: here a penalty of 10 is worse than a penalty of 5.

Round-card effects can double or forgive a penalty, or remove existing penalty points. Recoveries cannot reduce a cumulative total below **0**.

**Playtest ruling — scoring order:** Calculate this round’s penalties, including any modifier, and add them to cumulative totals. Then resolve recoveries. For The Devil, first establish the chosen opponent’s actual round penalty, then calculate the recovery. For The World, apply its erasure after round 5 has otherwise been scored.

After round 5, the player with the **lowest cumulative penalty total** wins. **Playtest ruling:** Tied lowest totals share the victory; no tie-breaker was agreed.

### Standings for catch-up effects

“First place” means the lowest cumulative penalty total at the start of round 5. “Last place” means the highest. These labels remain fixed for that round.

**Playtest ruling — ties:** Every player tied for first or last receives the corresponding effect. Each tied-last player makes their own private choice or optional bid adjustment where relevant. On The Star, “bottom half” means players whose competition rank is greater than half the player count: rank equals one plus the number of players with strictly fewer penalties. With four players, ranks 3 and 4 qualify. Thus a boundary tie can produce fewer than two eligible players; a four-way tie produces none. This tie policy is provisional.

## The ten persistent imps

Each player keeps one imp for all five rounds. **Every imp power is optional and usable once per round**, unless its description says otherwise. It refreshes at the next round, even if unused. Mark a power when spent.

For random selections, conceal and mix eligible cards, then select without viewing their faces. Private information remains private. If fewer cards remain than an inspection requests, inspect only those remaining.

### 1. Amdusias — The Musician

**Discordant Chime:** Force the player leading a trick to lead a **different suit**, if they have one. Trump does not change.

**Timing:** Before the lead is committed.

**Playtest ruling:** The leader shows a proposed lead without committing it. Amdusias may then require a different suit. If the leader has another available suit, they return the proposed card and choose a legal lead in a different suit; otherwise the proposed lead stands. Only then do other players play. The power is spent even if no alternative exists. This procedure supplies the reference suit missing from “before the lead.”

### 2. Valefor — The Thief

**Sticky Fingers:** Exchange **one randomly selected card from your hand** with **one randomly selected card from another player’s hand**.

**Timing:** After bidding, before a trick begins.

Each hand keeps the same size. Neither player chooses the card exchanged. **Playtest ruling:** The Hermit’s reserved card is ineligible; available cards otherwise remain eligible even if publicly revealed by Andromalius. A revealed card stays revealed if it changes owner.

### 3. Furfur — The Stormcaller

**Thunderclap:** Cancel trump’s advantage for one trick. The highest card of the led suit wins.

**Timing:** Before the trick begins.

The designated trump suit stays fixed. Players still follow suit normally. Under The Hierophant, a player void in the led suit must still play designated trump if available, even though it has no winning advantage in this trick.

**Playtest ruling:** Under The Hanged Man, Furfur suppresses trump eligibility but preserves the leader’s high-or-low choice: the chosen extreme of the led suit wins. This interaction was not settled in the conversation.

### 4. Bael — The Invisible

**Now You See Me:** Play one card face down on your turn. Reveal it after all players have played, before determining the winner.

You must obey every applicable legality rule, including follow suit and a Royal Command. **Playtest ruling:** When Bael leads face down, announce the led suit truthfully. A card already publicly revealed by Andromalius cannot be concealed by this power. These clarifications prevent hidden information from obstructing legal play.

### 5. Dantalion — The Mind Reader

**Mind Probe:** After winning a trick, secretly inspect **two randomly selected cards** from one opponent’s remaining hand.

**Timing:** Immediately after winning that trick, once per round. This is the revised timing; Dantalion does not inspect before bidding.

Return the cards to their owner. If the opponent has only one available card, inspect one. If no cards remain, there is nothing to inspect.

### 6. Agares — The Wanderer

**Come Back Here:** Force a player to take back the card they just played and play **another legal card**, if available.

**Timing:** Immediately after that player plays, before the next player acts; for the final card of a trick, before the trick is awarded.

The replacement must differ from the returned card and meet all current restrictions. If no alternative legal card exists, the original stands. **Playtest ruling:** The power is spent either way. Agares may target themself. If the returned card was the lead, the replacement establishes the led suit. A face-down card can be returned without revealing it.

### 7. Shax — The Trickster

**Blind Luck:** Force an opponent to play a **randomly selected legal card** instead of choosing one.

**Timing:** Immediately before that opponent plays.

The opponent identifies all legal cards, conceals and mixes them, and plays a randomly selected one. Apply follow-suit rules and any other restrictions before selecting. A forced choice of one legal card still consumes the power if activated.

### 8. Balam — The Seer

**Foretelling:** Before bidding, secretly inspect **three randomly selected cards** from one opponent’s hand.

Return those cards to their owner. This remains distinct from Dantalion’s two-card inspection after winning a trick. In this edition, Balam acts after discards and the Arcana’s pre-bid effect, before the first bid.

### 9. Seere — The Swift

**Jump the Queue:** After a trick is completed, choose which player leads the next trick instead of the winner.

**Timing:** Between tricks. The chosen player may be anyone, including Seere or the previous winner. Subsequent play proceeds clockwise from that player. The completed trick’s winner and trick count do not change. There must be another trick to lead.

### 10. Andromalius — The Investigator

**Caught Red-Handed:** Publicly reveal **one randomly selected card** from an opponent’s hand. It remains revealed until played.

**Timing:** After bidding, before a trick begins.

Place the revealed card face up as part of its owner’s hand. It remains subject to all normal play restrictions.

## Trump assignments

**New practical assignment for this edition:** Give every Major Arcana a fixed suit, shown below. Write a small suit symbol on a sleeve or place this reference beside the round card. A round card always produces the same trump suit, regardless of dealer, round number, hands, or reserve.

The assignment cycles **Wands → Cups → Swords → Pentacles**, beginning with The Fool. This is a convenient game convention, not a claim about traditional tarot correspondences. Across all 22 cards, Wands and Cups appear six times each; Swords and Pentacles appear five times each. No card creates a no-trump round by assignment.

| Arcana | Deck | Trump |
|---|---|---|
| 0 — The Fool | Regular | Wands |
| I — The Magician | Regular | Cups |
| II — The High Priestess | Regular | Swords |
| III — The Empress | Regular | Pentacles |
| IV — The Emperor | Regular | Wands |
| V — The Hierophant | Regular | Cups |
| VI — The Lovers | Regular | Swords |
| VII — The Chariot | Regular | Pentacles |
| VIII — Strength | Regular | Wands |
| IX — The Hermit | Regular | Cups |
| X — Wheel of Fortune | Regular | Swords |
| XI — Justice | Regular | Pentacles |
| XII — The Hanged Man | Regular | Wands |
| XIII — Death | Regular | Cups |
| XIV — Temperance | Regular | Swords |
| XV — The Devil | Catch-up | Pentacles |
| XVI — The Tower | Catch-up | Wands |
| XVII — The Star | Catch-up | Cups |
| XVIII — The Moon | Catch-up | Swords |
| XIX — The Sun | Catch-up | Pentacles |
| XX — Judgement | Catch-up | Wands |
| XXI — The World | Catch-up | Cups |

Strength suppresses trump only in the first trick. Every later trick uses its assigned Wands trump normally unless Furfur acts.

## The fifteen regular Arcana

Draw four of these cards without replacement, one for each of rounds 1–4. Each card affects only its own round unless its effect explicitly removes earlier penalties. Its printed trump is established before discarding.

### 0 — The Fool · Fool’s Luck

**Trump: Wands.** Before bidding, each player may discard one additional card face down and draw one random replacement from the undealt reserve. The additional discard is not revealed and does not reduce the final hand size.

**Playtest ruling:** Starting to the dealer’s left, each player decides whether to participate and selects their discard before seeing a replacement. Put surrendered cards in the discard pile, not the reserve. At four players, the four-card reserve is sufficient even if everyone participates. This keeps The Fool distinct from The Magician’s exchange procedure below.

### I — The Magician · Sleight of Hand

**Trump: Cups.** After the normal discard and **before bidding**, each player may exchange one chosen card from their hand with a randomly selected card from the undealt reserve. Decide whether to exchange and choose the outgoing card before seeing the replacement.

**Playtest ruling:** Resolve clockwise from the dealer’s left. Draw the random replacement first, then add the outgoing card face down to the reserve and mix it. The reserve stays at four cards, and a later player may receive an earlier player’s exchanged card. This procedure was not specified by the word “exchange”; it is provisional.

### II — The High Priestess · Hidden Knowledge

**Trump: Swords.** Before bidding, each player may privately inspect **two randomly selected cards** from one other player’s hand. Return the cards afterward. Resolve in the standard pre-bid order.

### III — The Empress · Abundance

**Trump: Pentacles.** Immediately after winning their **first trick of the round**, each player may increase their bid by **1**, provided the revised bid is legal. If they decline at that moment, they lose the opportunity.

**Playtest ruling:** “Legal” means within the round’s bid range. The dealer’s hook applies only to initial bidding; do not reapply it to this adjustment. Consequently, revised bids may total the counted tricks available.

### IV — The Emperor · Royal Command

**Trump: Wands.** Once during the round, a player leading a trick may declare **Royal Command**. Every other player must play the **highest card in whichever suit they legally play**.

If they must follow suit, they must play their highest card of that suit. If void, they may choose a suit but must play their highest card in it. The leader may choose any otherwise legal lead.

**Playtest ruling:** There is **one command total for the whole round**, available to whichever leader first uses it—not one per player. Declare it before the lead is committed. This resolves ambiguous wording in the source; test whether one use per player would be preferable.

### V — The Hierophant · Sacred Order

**Trump: Cups.** Follow suit as usual. If unable to follow suit, a player **must play a trump card if they have one**. If they have neither led suit nor trump, they may play any available card. There is no requirement to overtrump.

### VI — The Lovers · Bound by Fate

**Trump: Swords.** After bidding, each player secretly chooses one other player. If two players choose each other and **both make their contracts exactly**, each removes **2 existing penalty points**.

**Playtest ruling:** Record choices simultaneously and reveal them at scoring. Only mutual choices form a pair; unreciprocated choices do nothing. A player cannot choose themself. Recoveries cannot take a score below zero.

The source explicitly retains this post-bid choice. It does not change a hand or bid; see the unresolved scope of the objection to “after bidding” powers at the end.

### VII — The Chariot · Full Speed Ahead

**Trump: Pentacles.** The winner of each trick must lead their **highest remaining card of any suit** on the next trick.

**Playtest ruling:** Compare ranks across all available cards. If several suits tie for highest rank, choose among those cards. The first lead is unrestricted by this card. If Seere makes a different player lead, that substitute leader is unrestricted by The Chariot; the previous winner’s obligation does not carry to a later trick.

### VIII — Strength · Might Makes Right

**Trump: Wands.** In the **first trick only**, the **highest card of the final led suit** wins, regardless of trump cards played. Players must still play legally and follow the led suit as it applies when they act.

This is the latest revision. The first card played does not automatically win, and high cards in unrelated suits do not compete. Use the led suit that remains after any legal change to the lead. After the first trick, normal trump advantage resumes.

### IX — The Hermit · Solitude

**Trump: Cups.** Before bidding, each player may secretly set aside one card from their retained hand for the **final trick**. It cannot be played earlier. It still counts toward their cards for the round.

On the final trick it is their only remaining card and must be played. No special final-trick follow-suit exception is needed.

**Playtest ruling:** Earlier in the round, the set-aside card is unavailable when determining legal plays, random play choices, exchanges, or information targets. Otherwise a reserved sole card of the led suit could make legal play impossible. Its owner may inspect it. This availability ruling is consequential and requires playtesting.

### X — Wheel of Fortune · Fortune’s Favor

**Trump: Swords.** Each player who makes their contract exactly removes **1 existing penalty point**, in addition to taking no round penalty. Scores cannot fall below zero.

### XI — Justice · The Scales

**Trump: Pentacles.** Players who win more counted tricks than they bid take the normal penalty. Players who win **fewer** than they bid take **double** the normal penalty. Exact contracts still score zero.

For example, in round 3, bidding 4 and winning 2 costs **12**: 2 × 3 × 2. Bidding 2 and winning 4 costs **6**.

### XII — The Hanged Man · Upside Down

**Trump: Wands.** At the start of **each trick**, its leader chooses whether the **highest or lowest eligible card** wins that trick. Announce the choice before cards are committed.

Trump still outranks the led suit. If any trump is played, compare only trumps and use the leader’s chosen rank direction. Otherwise compare only cards of the led suit. Off-suit, non-trump cards remain ineligible.

The choice belongs to that trick’s actual leader, including a leader appointed by Seere. It is not one high-or-low choice for the whole round.

### XIII — Death · Sudden Ending

**Trump: Cups.** The **final physical trick counts as two tricks** for its winner. All other tricks count once.

If the round has T physical tricks, it has **T + 1 counted tricks**. Each player may bid from **0 through T + 1**. Apply the dealer’s hook to **T + 1**, so the sum of initial contracts cannot equal the counted tricks available.

For example, Death in round 2 means 11 cards played per player, 11 physical tricks, and 12 counted tricks. A player who wins three earlier tricks and the final trick finishes with **5 counted tricks**.

The conversation’s wording about contracts adding up was ambiguous in isolation; the subsequent revision explicitly applied the hook to the extra counted trick. This edition follows that clarification and the requested dealer’s hook.

### XIV — Temperance · Perfect Balance

**Trump: Swords.** Once during the round, each player may adjust their bid by **1 up or down**, immediately after winning a trick.

**Playtest ruling:** The revised bid must stay within the round’s bid range. The hook applies only to initial bids and is not rechecked. The player may use this after the final trick, before scoring; the source set no earlier deadline. This can turn a one-trick miss into an exact contract.

## The seven catch-up Arcana

Draw one of these for round 5. Use standings recorded at the beginning of that round. All normal dealing, five-card discards, eight physical tricks, and the ×5 error penalty remain in force unless the card says otherwise.

### XV — The Devil · A Deal with the Devil

**Trump: Pentacles.** Before bidding, the player in last place secretly chooses one opponent. If that opponent misses their contract, the trailing player removes existing penalty points equal to **half that opponent’s round penalty, rounded down**.

Record the choice before bidding and reveal it at scoring. The trailing player still takes their own normal penalty if they miss. For example, a target’s round penalty of 15 allows a recovery of **7**, subject to the zero floor. Tied-last players each choose independently under this edition’s tie ruling.

### XVI — The Tower · The Fall

**Trump: Wands.** The player who began the round in first place takes **double the normal penalty** if they miss their contract. Everyone else scores normally. Under the tie ruling, all tied leaders are affected.

### XVII — The Star · A Glimmer of Hope

**Trump: Cups.** Players who began the round in the **bottom half of the standings** may miss their contract by **one trick in either direction without penalty**.

An error of two or more is penalized in full: it is not reduced by one. At ×5, an eligible player’s two-trick error still costs **10**. A forgiven miss remains a miss, not an exact contract. Use the eligibility tie rule in the scoring section.

### XVIII — The Moon · Veil of Uncertainty

**Trump: Swords.** All players write bids secretly and reveal them **simultaneously**. The dealer’s hook is **suspended**.

After seeing all bids, the player who began in last place may revise their bid by **1 up or down**, within 0–8. The revised totals may equal the available tricks; everyone can potentially make their contract.

**Playtest ruling:** If several players tied for last, they record their optional revisions secretly and reveal them simultaneously, so one does not benefit from seeing another’s adjustment first.

### XIX — The Sun · Second Sunrise

**Trump: Pentacles.** Each player who makes their contract exactly removes **5 existing penalty points**. A player who began the round in last place removes **10 instead**. These recoveries are not multiplied by five and cannot reduce scores below zero.

### XX — Judgement · The Last Judgement

**Trump: Wands.** After all initial bids are made, the player who began the round in last place may revise their bid by **1 up or down**, within 0–8.

The dealer’s hook applies **only to the initial bids**. Do not reapply it after the adjustment. Revised bids may total eight. For tied-last players, use the simultaneous-revision procedure given for The Moon.

### XXI — The World · The Final Reckoning

**Trump: Cups.** After the final round, each player who made their round-5 contract exactly may erase the penalty from their **worst previous round**.

Round 5 itself is ineligible. Choose only one of rounds 1–4; if several tie for worst, erase any one.

**Playtest ruling — recovery accounting:** Keep each round’s penalty as a separate outstanding balance. Whenever points are removed by any recovery, reduce the oldest outstanding round balance first. The World erases the largest balance still outstanding from rounds 1–4. This prevents points already recovered from being erased a second time. This bookkeeping choice was not settled in the conversation.

## Power timing and interactions

The following are **playtest rulings** for cases not explicitly settled in the source. Use them consistently for this edition.

### Priority and simultaneous activations

1. A specific power overrides a general rule only to the extent its text requires.
2. At a shared optional-power window, offer opportunities clockwise, beginning with the upcoming leader for a between-tricks window, or to the dealer’s left before bidding. Resolve one effect fully before the next. Continue until all players pass without a new effect.
3. Between tricks, first resolve immediate effects of the completed trick, including bid adjustments and Dantalion. Then resolve Seere’s leadership choice. Establish the next leader before pre-trick effects and lead restrictions.
4. Resolve Valefor, Andromalius, Furfur, and Royal Command before committing the lead. Under The Hanged Man, announce high or low after pre-trick effects and before a proposed lead. Amdusias reacts to that proposed lead. Agares reacts to a played card before the next player acts.
5. Never reopen an awarded trick. Agares must act before it is awarded, including when targeting the fourth card.

### Restrictions remain in force

An effect that selects or replaces a card must satisfy all applicable restrictions. Shax randomizes among legal choices; Agares requires a different legal card. The Emperor restricts every follower to the highest card of the suit they play, even when that follower is void in the led suit.

If a forced alternate lead conflicts with The Chariot, enforce both when possible: lead a highest-ranked available card in a different suit. If none exists, **The Chariot’s restriction prevails**, the proposed lead stands, and Amdusias’s use is spent. This precedence is provisional.

### Hidden and reserved cards

- The Hermit’s reserved card is unavailable until the final trick and is excluded from selections and inspections before then.
- Bael must announce a truthful suit when leading face down. Following players use that suit normally.
- Agares can return Bael’s face-down card without revealing it. Bael’s concealment may apply to the replacement during that same play; the power is still spent.
- A card exposed by Andromalius remains public until played, including if Valefor transfers it. Bael cannot conceal it.
- If Shax has already forced a random play and Agares requires a replacement, choose randomly among the remaining legal alternatives. This preserves both effects.

### What stays fixed

- The round card’s **designated trump suit** never changes.
- Furfur suppresses trump advantage for one trick; Strength does so for the first trick only.
- The first trick’s winner under Strength is determined by the **final led suit**, not by the first physical card or by the highest rank across all suits.
- Only Death adds a counted trick. Seere changes leadership, not ownership of a completed trick.
- Normal trick play after bidding is unaffected by the request to move The Magician before bidding. Valefor, Dantalion, and other imp powers retain their explicitly specified tactical timing.

## Rulings and remaining design questions

This edition is playable using the marked rulings, but these choices deserve confirmation or playtesting before the rules are called final.

| Topic | What the source settled | Resolution or question in this edition |
|---|---|---|
| Trump source | The round card determines trump; no revealed playing card. | A fixed four-suit cycle assigns all 22 cards. The individual assignments are newly proposed. |
| Player count | Four-player arithmetic is explicit; other supported counts were left open. | Four players are fully specified. No claim of balance at other counts. |
| Other-player deal | Reserve one card per player. | A possible extension is H = floor((56 − P) / P) cards per player, leaving at least P undealt and all division remainders undealt; discard 1–5 and play H−1 through H−5. This may reserve more than P cards and needs approval. Do not silently treat it as the exact-reserve rule. |
| Rank order | Four suits of 14. | Ace low through King high is provisional. |
| Amdusias | Force another lead suit; timing described as before the lead. Later Strength discussion mentions a changed final led suit. | A visible proposed lead precedes commitment. This edition does not grant Amdusias an unspoken mid-trick activation. Mid-trick changes would require new timing and legality rules. |
| The Hermit | Reserve a card for the final trick; no final-trick exception needed. | Treat it as unavailable earlier, including for follow suit, exchanges, and inspections. Other treatment can make the reservation impossible to honor. |
| The Fool / Magician | Both now act before bidding and use the undealt reserve. | They overlap. This edition distinguishes permanent Fool discards from Magician cards returned to the reserve. That procedural distinction is editorial and may instead be replaced by accepting duplicate effects. |
| Emperor frequency | “Once during the round, a player leading…” | One use shared by the table is provisional; one per player would be substantially stronger. |
| “After bidding” objection | The explicit requested change moved The Magician before bidding. Later powers still expressly use other timing windows. | Preserve Lovers’ post-bid secret choice, Empress/Temperance’s in-play adjustments, catch-up adjustments, and imp timing. If the objection was meant to ban every post-bid non-play power, the affected cards need redesign rather than silent retiming. |
| Bid adjustments | Empress says revised bids must be legal; Temperance gives ±1. Moon/Judgement expressly relax the hook. | All adjustments obey range; the hook is checked only on initial bidding. Temperance may act after the final trick. |
| Catch-up ties | Effects refer to first, last, and bottom half without a tie policy. | All tied extremes qualify; The Star uses competition ranks. Review boundary ties and all-player ties. |
| Recovery and The World | Several cards remove earlier penalties; World erases a worst prior round. | Use outstanding round balances, oldest-first recovery, and a zero floor. This prevents double recovery but changes which prior round remains worst. |
| Furfur / Hanged Man | Furfur says highest led-suit card; Hanged Man lets the leader choose high or low. | Furfur removes trump eligibility while preserving the chosen direction. |
| First dealer, lead, and final ties | Not fully specified. | Random first dealer, clockwise rotation, dealer’s left leads first, shared victory on tied totals. |

### Revisions this edition deliberately preserves

- **56 Minor Arcana**, not a standard 52-card deck.
- **22 Major Arcana**, split **15 regular / 7 catch-up**.
- **Five rounds:** four regular, then one catch-up.
- **13 cards dealt per player every round**, with four undealt in a four-player game.
- **Discard 1/2/3/4/5 before bidding**, producing **12/11/10/9/8 physical tricks**.
- **Round number × absolute bid error**, with zero best.
- The **dealer’s hook**, including the additional counted trick under Death; The Moon expressly suspends it.
- **Persistent characters**, with once-per-round powers and Dantalion acting after winning a trick.
- **Magician before bidding**; **Emperor applies to every follower’s chosen suit**; **Hanged Man’s leader chooses each trick**; **Hermit’s last card must be played**; **Strength uses the highest card of the final led suit in the first trick**.
- **Trump determined by the round card**, known before discards, never by turning over a playing card.

## Quick reference

### Round sequence

1. Reveal the Arcana and its assigned trump; record round-5 standings.
2. Shuffle all 56 Minor Arcana; reserve four and deal 13 each.
3. Discard the round number of cards: 1, 2, 3, 4, or 5.
4. Resolve pre-bid Arcana effects, then pre-bid imp powers.
5. Bid clockwise, dealer last; initial totals must differ from counted tricks, except under The Moon.
6. Resolve specified post-bid effects.
7. Play 12, 11, 10, 9, or 8 physical tricks, with imp and Arcana powers.
8. Score round number × absolute error; apply modifiers and recoveries.
9. Reset powers, gather all playing cards, and pass the deal clockwise.

### Trick resolution

| Situation | Winner |
|---|---|
| Ordinary trick with trump played | Highest trump |
| Ordinary trick without trump | Highest card of final led suit |
| Strength, first trick | Highest card of final led suit; ignore trump advantage |
| Furfur’s selected trick | Highest card of final led suit, except Hanged Man’s low choice |
| Hanged Man, trump played | Highest or lowest trump, as chosen by leader |
| Hanged Man, no effective trump | Highest or lowest card of final led suit, as chosen by leader |

### End of game

After round 5 and all recoveries, **fewest penalties wins; zero is best**. Tied lowest totals share the victory in this edition.

---

**Source:** [Game Title Ideas](https://chatgpt.com/c/6afceddc-d79c-83ea-bf7b-b43b14983849), consolidated with the explicit requirements for this rules file. The latest explicit user corrections take precedence over superseded drafts. Historical tarot or demonology claims are not needed to apply these game rules.
