import {Network} from '../../src/lib/engine/rl/network';
import {transferToMulti} from '../../src/lib/engine/rl/transfer';
import {learnedCommand} from '../../src/lib/engine/rl/policy';
import {tacticalCommand} from '../../src/lib/engine/rl/tactics';
import {searchBid,searchPlay,type MultiSearchPolicy} from '../../src/lib/engine/rl/search-v3';
import {weightedDiscard} from '../../src/lib/engine/rl/discard';
import {easy,previous,bid as legacyBid,discard as legacyDiscard,match,assess,type Agent} from './league';
export {easy,previous,match,assess,type Agent};
export async function initialModels(){const bid=transferToMulti(Network.load(await Bun.file('models/rl-v2-bid.json').json())),discard=transferToMulti(Network.load(await Bun.file('models/rl-v2-discard.json').json())),strategy=await Bun.file('models/rl-v2-tactics.json').json();return {bid,discard,strategy};}
export function agent(bid:Network,discard:Network,weights:number[],planning=0,bias:number[]=[]):Agent{
 const policy:MultiSearchPolicy={bid,discard,weights,discardBias:bias,previousBid:legacyBid,previousDiscard:legacyDiscard};
 // Prior registered v1 seats retain their actual legacy model inside the planner.
 return Object.assign((s:Parameters<Agent>[0],id:string)=>s.phase==='bid'?(planning?searchBid(s,id,policy,planning):learnedCommand(s,id,bid).command):s.phase==='discard'?weightedDiscard(s,id,discard,bias):s.phase==='play'&&planning?searchPlay(s,id,policy,20):tacticalCommand(s,id,weights),{policy:'rl-v3' as const});
}
