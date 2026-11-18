import bidCheckpoint from '../../../models/rl-bid.json';
import discardCheckpoint from '../../../models/rl-discard.json';
import type {State,Command} from './types';
import {Network,type Checkpoint} from './rl/network';
import {learnedCommand} from './rl/policy';
let bid:Network|undefined,discard:Network|undefined;
/** Learned bidding and discard choices for three-player games. Other actions retain the easy policy. */
export function rlBotCommand(state:State,id:string):Command{bid??=Network.load(bidCheckpoint as Checkpoint);discard??=Network.load(discardCheckpoint as Checkpoint);return learnedCommand(state,id,bid,undefined,discard).command;}
