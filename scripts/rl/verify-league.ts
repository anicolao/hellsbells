const paths={BID_MODEL:'models/rl-v2-bid.json',DISCARD_MODEL:'models/rl-v2-discard.json',TACTICS:'models/rl-v2-tactics.json'};
for(const [opponent,games] of [['easy',2001],['previous',2001],['mixed',2001]] as const){
 const child=Bun.spawn([process.execPath,'scripts/rl/evaluate-league.ts'],{env:{...process.env,...paths,OPPONENT:opponent,EVAL_GAMES:String(games),SAMPLES:'128',EVAL_NAMESPACE:`hellsbells-league-heldout-v3-${opponent}`,MIN_WIN_RATE:'.90'},stdout:'inherit',stderr:'inherit'});
 if(await child.exited)throw Error(`${opponent} acceptance benchmark failed`);
}
