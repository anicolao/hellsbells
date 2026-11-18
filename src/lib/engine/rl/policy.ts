import {cards,player,trump,allowedBids} from '../engine';
import {botCommand} from '../bot';
import type {State,Command} from '../types';
import {Network,Random} from './network';
const suits=['Wands','Cups','Swords','Pentacles'];
// Deliberately enumerate permitted observations; never encode RNG, reserve, or opponent hands.
export function observeBid(s:State,id:string,dimensions=INPUTS):Float64Array{const p=player(s,id),tr=trump(s),features:number[]=[1,s.round/5,s.physical/17,p.score/50,(p.score-Math.min(...s.players.map(q=>q.score)))/30,s.players.findIndex(q=>q.id===id)/2,s.dealer===id?1:0];
 for(const suit of [tr,...suits.filter(x=>x!==tr)]){const hand=p.hand.map(c=>cards[c]).filter(c=>c.suit===suit);features.push(hand.length/17,hand.reduce((a,c)=>a+c.rank,0)/140,...[5,9,11,12,13,14].map(rank=>hand.filter(c=>c.rank>=rank).length/8),hand.some(c=>c.rank===14)?1:0);}
 for(let a=0;a<22;a++)features.push(s.arcana===a?1:0);for(let i=0;i<10;i++)features.push(p.imp===i?1:0);
 for(let offset=1;offset<3;offset++){const q=s.players[(s.players.indexOf(p)+offset)%3];features.push(s.arcana===18||q.bid===null?-1:q.bid/17,q.score/50,(q.score-p.score)/30);}
 if(dimensions===81)return Float64Array.from(features);
 for(const suit of [tr,...suits.filter(x=>x!==tr)])for(let rank=1;rank<=14;rank++)features.push(p.hand.some(c=>cards[c].suit===suit&&cards[c].rank===rank)?1:0);
 features.push(Math.max(0,...p.penalties)/25,p.reserved?1:0,s.history.filter(r=>r.bids[id]===r.won[id]).length/5,new Set(p.hand.map(c=>cards[c].suit)).size/4);
 if(dimensions!==features.length)throw Error('Unknown feature schema');return Float64Array.from(features);
}
export const INPUTS=141;
export type Decision={x:Float64Array;actions:number[];base:number;action:number;round:number;};
export function distribution(network:Network,x:Float64Array,actions:number[],base:number){const f=network.forward(x);const z=actions.map(a=>f.logits[a]-(a-base)*(a-base)/8),max=Math.max(...z),exp=z.map(a=>Math.exp(a-max)),total=exp.reduce((a,b)=>a+b,0);return {f,probabilities:exp.map(a=>a/total)};}
export function learnedCommand(s:State,id:string,network:Network,rng?:Random,discardNetwork?:Network):{command:Command;decision?:Decision}{const fallback=botCommand(s,id);if(s.phase==='discard'&&s.players.length===3&&discardNetwork)return {command:learnedDiscard(s,id,discardNetwork,rng)};if(s.phase!=='bid'||s.players.length!==3)return {command:fallback};const x=observeBid(s,id,network.inputs);if(x.length!==network.inputs)throw Error(`Feature size ${x.length} != ${network.inputs}`);const actions=allowedBids(s,id),base=fallback.value!;if(network.mode==='q'){const f=network.forward(x);let best=actions[0];for(const a of actions)if(f.logits[a]>f.logits[best])best=a;const action=rng&&rng.next()<.15?actions[rng.pick(actions.length)]:best;return {command:{type:'bid',value:action},decision:{x,actions,base,action,round:s.round}};}const {probabilities}=distribution(network,x,actions,base);let index=0;if(rng){let sample=rng.next();for(let i=0;i<probabilities.length;i++){sample-=probabilities[i];if(sample<=0){index=i;break;}}}else for(let i=1;i<probabilities.length;i++)if(probabilities[i]>probabilities[index])index=i;return {command:{type:'bid',value:actions[index]},decision:{x,actions,base,action:actions[index],round:s.round}};}

export function discardOptions(s:State,id:string):string[][]{const p=player(s,id),tr=trump(s),hand=p.hand;const count=(suit:string)=>hand.filter(c=>cards[c].suit===suit).length;const rank=(id:string)=>cards[id].rank;const orders=[
 [...hand].sort((a,b)=>rank(a)-rank(b)),
 [...hand].sort((a,b)=>rank(b)-rank(a)),
 [...hand].sort((a,b)=>Number(cards[a].suit!==tr)-Number(cards[b].suit!==tr)||rank(a)-rank(b)),
 [...hand].sort((a,b)=>Number(cards[a].suit!==tr)-Number(cards[b].suit!==tr)||rank(b)-rank(a)),
 [...hand].sort((a,b)=>Number(cards[a].suit===tr)-Number(cards[b].suit===tr)||count(cards[a].suit)-count(cards[b].suit)||rank(a)-rank(b)),
 [...hand].sort((a,b)=>Number(cards[a].suit===tr)-Number(cards[b].suit===tr)||count(cards[a].suit)-count(cards[b].suit)||rank(b)-rank(a)),
 ];return orders.map(a=>a.slice(0,s.round));}
export function learnedDiscard(s:State,id:string,network:Network,rng?:Random):Command{const options=discardOptions(s,id),f=network.forward(observeBid(s,id,network.inputs));let best=0;for(let i=1;i<options.length;i++)if(f.logits[i]>f.logits[best])best=i;if(rng&&rng.next()<.15)best=rng.pick(options.length);return {type:'discard',cards:options[best]};}
