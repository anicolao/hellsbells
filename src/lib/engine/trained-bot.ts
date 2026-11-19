import {botCommand} from './bot';
import {player} from './engine';
import {rlBotCommand} from './rl-bot';
import {rlBotV2Command} from './rl-bot-v2';
import {rlBotV3Command} from './rl-bot-v3';
import type {State,Command} from './types';
/** Preserve legacy three-seat behavior; all larger trained tables use count-trained models. */
export function trainedBotCommand(state:State,id:string):Command{
 const policy=player(state,id).botPolicy;if(!policy||policy==='easy')return botCommand(state,id);
 if(state.players.length===3&&policy==='rl-v1')return rlBotCommand(state,id);
 if(state.players.length===3&&policy==='rl-v2')return rlBotV2Command(state,id);
 return rlBotV3Command(state,id);
}
