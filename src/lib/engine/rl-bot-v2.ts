import bidCheckpoint from '../../../models/rl-v2-bid.json';
import discardCheckpoint from '../../../models/rl-v2-discard.json';
import weights from '../../../models/rl-v2-tactics.json';
import previousBidCheckpoint from '../../../models/rl-bid.json';
import previousDiscardCheckpoint from '../../../models/rl-discard.json';
import {Network,type Checkpoint} from './rl/network';
import {learnedCommand} from './rl/policy';
import {tacticalCommand} from './rl/tactics';
import {searchBid,type SearchPolicy} from './rl/search';
import type {State,Command} from './types';
let policy:SearchPolicy|undefined;
/** Frozen league policy plus public-information planning. Version one remains unchanged. */
export function rlBotV2Command(state:State,id:string):Command{
 policy??={bid:Network.load(bidCheckpoint as Checkpoint),discard:Network.load(discardCheckpoint as Checkpoint),previousBid:Network.load(previousBidCheckpoint as Checkpoint),previousDiscard:Network.load(previousDiscardCheckpoint as Checkpoint),weights};
 if(state.players.length!==3)throw Error('Trained imps require three players');
 if(state.phase==='bid')return searchBid(state,id,policy,64);
 if(state.phase==='discard')return learnedCommand(state,id,policy.bid,undefined,policy.discard).command;
 return tacticalCommand(state,id,weights);
}
