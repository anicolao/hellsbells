import {apply,eventFor,cards,player,allowedBids,hash} from '../engine';
import {nextActor,botCommand} from '../bot';
import type {State,Command} from '../types';
import {Network,Random} from './network';
import {learnedCommand,discardOptions} from './policy';
import {tacticalCommand,initialTactics} from './tactics';
export type SearchPolicy={bid:Network;discard:Network;previousBid:Network;previousDiscard:Network;weights:number[]};
function shuffled<T>(a:T[],rng:Random){a=[...a];for(let i=a.length-1;i>0;i--){const j=rng.pick(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
/** Sample deals, never the actual hidden cards or engine RNG. Public bids condition the samples. */
function sample(s:State,id:string,rng:Random,policy:SearchPolicy,mode:'easy'|'previous'){
 const copy=structuredClone(s),p=player(s,id),known=new Set([...p.hand,...p.discard]);let deck=shuffled(Object.keys(cards).filter(c=>!known.has(c)),rng);copy.rng=rng.state;
 for(const q of copy.players)if(q.id!==id){q.hand=deck.splice(0,s.physical+s.round);q.discard=[];q.reserved=null;q.choice=null;const fake={...copy,phase:'discard' as const};const command=mode==='easy'?botCommand(fake,q.id):learnedCommand(fake,q.id,policy.previousBid,undefined,policy.previousDiscard).command;q.discard=command.cards!;q.hand=q.hand.filter(c=>!q.discard.includes(c));}
 copy.reserve=deck;copy.inspections=[];if(s.arcana===18)for(const q of copy.players)if(q.id!==id&&q.bid!==null)q.bid=(mode==='easy'?botCommand(copy,q.id):learnedCommand(copy,q.id,policy.previousBid).command).value!;return copy;
}
export function searchBid(s:State,id:string,policy:SearchPolicy,samples=12):Command{
 const actions=allowedBids(s,id),totals=actions.map(()=>0),rng=new Random(hash(`v2-search-${s.round}-${s.arcana}-${id}-${player(s,id).hand.join(',')}-${s.players.map(p=>s.arcana===18&&p.id!==id?null:p.bid).join(',')}`));
 const agent=(s:State,id:string)=>['bid','discard'].includes(s.phase)?learnedCommand(s,id,policy.bid,undefined,policy.discard).command:tacticalCommand(s,id,policy.weights);
 for(let iteration=0;iteration<samples;iteration++){
  const mode=iteration%2===0?'easy':'previous';let sampled=sample(s,id,rng,policy,mode),quality=1;
  // Importance weights use public bids only; keep surprising deals possible.
  for(const q of sampled.players)if(s.arcana!==18&&q.id!==id&&q.bid!==null){const estimate=(mode==='easy'?botCommand(sampled,q.id):learnedCommand(sampled,q.id,policy.previousBid).command).value!;quality*=Math.exp(-Math.abs(estimate-q.bid)*.5);}
  for(let a=0;a<actions.length;a++){let next=apply(sampled,eventFor(sampled,id,{type:'bid',value:actions[a]}));const history=s.history.length;
   for(let step=0;step<350&&next.history.length===history;step++){const actor=nextActor(next)!;const command=actor===id?agent(next,actor):mode==='easy'?botCommand(next,actor):learnedCommand(next,actor,policy.previousBid,undefined,policy.previousDiscard).command;next=apply(next,eventFor(next,actor,command));}
   if(next.history.length===history)throw Error('Search rollout failed');const mine=player(next,id).score-player(s,id).score,others=next.players.filter(p=>p.id!==id).map(p=>p.score-player(s,p.id).score);const mineFinal=player(next,id).score,bestOther=Math.min(...next.players.filter(p=>p.id!==id).map(p=>p.score));const utility=s.round===5?(mineFinal<bestOther?40:mineFinal===bestOther?8:0)+.1*(bestOther-mineFinal):-mine+.15*(others[0]+others[1])/2;totals[a]+=quality*utility;
  }
 }
 let best=0;for(let a=1;a<actions.length;a++)if(totals[a]>totals[best])best=a;return {type:'bid',value:actions[best]};
}
