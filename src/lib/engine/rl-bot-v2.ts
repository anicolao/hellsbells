import bidCheckpoint from '../../../models/rl-v2-bid.json';
import discardCheckpoint from '../../../models/rl-v2-discard.json';
import strategy from '../../../models/rl-v2-tactics.json';
import previousBidCheckpoint from '../../../models/rl-bid.json';
import previousDiscardCheckpoint from '../../../models/rl-discard.json';
import {Network,type Checkpoint} from './rl/network';
import {tacticalCommand} from './rl/tactics';
import {weightedDiscard} from './rl/discard';
import {RL_V2_BID_SAMPLES,RL_V2_PLAY_SAMPLES} from './rl/config';
import {searchBid,searchPlay,type SearchPolicy} from './rl/search';
import type {State,Command} from './types';
let policy:SearchPolicy|undefined;
/** Frozen league policy plus public-information planning. Version one remains unchanged. */
export function rlBotV2Command(state:State,id:string):Command{
 policy??={bid:Network.load(bidCheckpoint as Checkpoint),discard:Network.load(discardCheckpoint as Checkpoint),previousBid:Network.load(previousBidCheckpoint as Checkpoint),previousDiscard:Network.load(previousDiscardCheckpoint as Checkpoint),weights:strategy.tactics,discardBias:strategy.discardBias};
 if(state.players.length!==3)throw Error('Trained imps require three players');
 if(state.phase==='bid')return searchBid(state,id,policy,RL_V2_BID_SAMPLES);
 if(state.phase==='discard')return weightedDiscard(state,id,policy.discard,policy.discardBias);
 if(state.phase==='play')return searchPlay(state,id,policy,RL_V2_PLAY_SAMPLES);
 return tacticalCommand(state,id,policy.weights);
}
