import {apply,eventFor} from '../../src/lib/engine/engine';
import {botCommand,nextActor} from '../../src/lib/engine/bot';
import {Network} from '../../src/lib/engine/rl/network';
import {learnedCommand} from '../../src/lib/engine/rl/policy';
import {tacticalCommand,initialTactics} from '../../src/lib/engine/rl/tactics';
import type {State,Command} from '../../src/lib/engine/types';
export type Agent=((s:State,id:string)=>Command)&{policy?:'easy'|'rl-v1'|'rl-v2'};
export const easy:Agent=Object.assign(botCommand,{policy:'easy' as const});
export const bid=Network.load(await Bun.file('models/rl-bid.json').json()),discard=Network.load(await Bun.file('models/rl-discard.json').json());
export const previous:Agent=Object.assign((s:State,id:string)=>learnedCommand(s,id,bid,undefined,discard).command,{policy:'rl-v1' as const});
export function tactical(bidding=bid,discarding=discard,weights=initialTactics):Agent{return (s,id)=>['bid','discard'].includes(s.phase)?learnedCommand(s,id,bidding,undefined,discarding).command:tacticalCommand(s,id,weights);}
export function match(seed:string,agents:Agent[]){let s:State|undefined;const ids=['a','b','c'];const step=(id:string,c:Command)=>s=apply(s,eventFor(s,id,c));step('a',{type:'create',seed,capacity:3});step('b',{type:'join'});step('c',{type:'join'});for(const [i,agent] of agents.entries())if(agent.policy){s!.players[i].bot=true;s!.players[i].botPolicy=agent.policy;}step('a',{type:'start'});for(let i=0;i<1800&&s!.phase!=='ended';i++){const id=nextActor(s!)!;step(id,agents[ids.indexOf(id)](s!,id));}if(s!.phase!=='ended')throw Error('Unfinished league game');return s!;}
export function assess(agent:Agent,opponents:Agent[],namespace:string,count:number,start=0){let wins=0,ties=0,points=0;const seats=Array.from({length:3},()=>({games:0,wins:0,ties:0}));for(let game=0;game<count;game++){const i=game+start,seat=i%3,agents=[opponents[0],opponents[1]];agents.splice(seat,0,agent);const s=match(`${namespace}-${i}`,agents),scores=s.players.map(p=>p.score),best=Math.min(...scores),winners=scores.filter(v=>v===best).length,win=scores[seat]===best&&winners===1,tie=scores[seat]===best&&winners>1;wins+=+win;ties+=+tie;points+=scores[seat];seats[seat].games++;seats[seat].wins+=+win;seats[seat].ties+=+tie;}
 const p=wins/count,z=1.96,den=1+z*z/count,centre=(p+z*z/(2*count))/den,margin=z*Math.sqrt(p*(1-p)/count+z*z/(4*count*count))/den;return {namespace,games:count,wins,ties,uniqueWinRate:p,meanPoints:points/count,wilson95:[centre-margin,centre+margin],seats};}
if(import.meta.main&&import.meta.path.endsWith('/league.ts')){const n=Number(process.env.EVAL_GAMES??120);for(const [name,opponents] of [['easy',[easy,easy]],['previous',[previous,previous]]] as const){console.time(name);console.log(name,assess(tactical(),[...opponents],'hellsbells-v2-development',n));console.timeEnd(name);}}
