for(const players of [3,4,5])for(const opponent of players===3?['easy','legacy','mixed']:['easy','transfer','mixed']){
 const child=Bun.spawn([process.execPath,'scripts/rl/evaluate-multi.ts'],{env:{...process.env,PLAYERS:String(players),BID_MODEL:`models/rl-v3-${players}-bid.json`,DISCARD_MODEL:`models/rl-v3-${players}-discard.json`,TACTICS:`models/rl-v3-${players}-strategy.json`,OPPONENT:opponent,EVAL_GAMES:process.env.EVAL_GAMES??'900',SAMPLES:'128',EVAL_NAMESPACE:`hellsbells-multi-heldout-v1-${players}-${opponent}`,MIN_WIN_RATE:process.env.MIN_WIN_RATE??(opponent==='easy'?'.90':String(1/players))},stdout:'inherit',stderr:'inherit'});
 if(await child.exited)throw Error(`${players}-player ${opponent} benchmark failed`);
}
