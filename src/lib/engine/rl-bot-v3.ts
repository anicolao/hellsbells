import bid3 from '../../../models/rl-v3-3-bid.json';
import discard3 from '../../../models/rl-v3-3-discard.json';
import strategy3 from '../../../models/rl-v3-3-strategy.json';
import bid4 from '../../../models/rl-v3-4-bid.json';
import discard4 from '../../../models/rl-v3-4-discard.json';
import strategy4 from '../../../models/rl-v3-4-strategy.json';
import bid5 from '../../../models/rl-v3-5-bid.json';
import discard5 from '../../../models/rl-v3-5-discard.json';
import strategy5 from '../../../models/rl-v3-5-strategy.json';
import legacyBid from '../../../models/rl-bid.json';
import legacyDiscard from '../../../models/rl-discard.json';
import {Network,type Checkpoint} from './rl/network';
import {MULTI_INPUTS} from './rl/policy';
import {weightedDiscard} from './rl/discard';
import {tacticalCommand} from './rl/tactics';
import {searchBid,searchPlay,type MultiSearchPolicy} from './rl/search-v3';
import type {State,Command} from './types';
type CountCheckpoint=Checkpoint&{training:{players:number}};
const checkpoints:Record<number,{bid:CountCheckpoint;discard:CountCheckpoint;strategy:{tactics:number[];discardBias:number[];training:{players:number}}}>={3:{bid:bid3 as CountCheckpoint,discard:discard3 as CountCheckpoint,strategy:strategy3},4:{bid:bid4 as CountCheckpoint,discard:discard4 as CountCheckpoint,strategy:strategy4},5:{bid:bid5 as CountCheckpoint,discard:discard5 as CountCheckpoint,strategy:strategy5}};
const loaded=new Map<number,MultiSearchPolicy>();
export function rlBotV3Command(state:State,id:string):Command{
 const count=state.players.length,checkpoint=checkpoints[count];if(!checkpoint)throw Error('Trained imps support three to five players');
 let policy=loaded.get(count);if(!policy){if(checkpoint.bid.training.players!==count||checkpoint.discard.training.players!==count||checkpoint.strategy.training.players!==count||checkpoint.bid.inputs!==MULTI_INPUTS||checkpoint.discard.inputs!==MULTI_INPUTS)throw Error('Incorrect player-count model');policy={bid:Network.load(checkpoint.bid),discard:Network.load(checkpoint.discard),previousBid:Network.load(legacyBid as Checkpoint),previousDiscard:Network.load(legacyDiscard as Checkpoint),weights:checkpoint.strategy.tactics,discardBias:checkpoint.strategy.discardBias};loaded.set(count,policy);}
 if(state.phase==='bid')return searchBid(state,id,policy,128);
 if(state.phase==='discard')return weightedDiscard(state,id,policy.discard,policy.discardBias);
 if(state.phase==='play')return searchPlay(state,id,policy,20);
 return tacticalCommand(state,id,policy.weights);
}
