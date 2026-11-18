import {apply,eventFor,cards,player,allowedBids,hash} from '../engine';
import {nextActor,botCommand} from '../bot';
import type {State,Command} from '../types';
import {weightedDiscard} from './discard';
import {Network,Random} from './network';
import {learnedCommand} from './policy';
import {tacticalCommand,playOptions} from './tactics';
export type SearchPolicy={bid:Network;discard:Network;previousBid:Network;previousDiscard:Network;weights:number[];discardBias?:number[]};
type Rival='easy'|'previous'|'self';
function rivalCommand(s:State,id:string,policy:SearchPolicy,mode:Rival):Command{return mode==='easy'?botCommand(s,id):mode==='previous'?learnedCommand(s,id,policy.previousBid,undefined,policy.previousDiscard).command:s.phase==='discard'?weightedDiscard(s,id,policy.discard,policy.discardBias):s.phase==='bid'?learnedCommand(s,id,policy.bid).command:tacticalCommand(s,id,policy.weights);}
function shuffled<T>(a:T[],rng:Random){a=[...a];for(let i=a.length-1;i>0;i--){const j=rng.pick(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
/** Sample deals, never the actual hidden cards or engine RNG. Public bids condition the samples. */
function sample(s:State,id:string,rng:Random,policy:SearchPolicy,modes:Rival[]){
 const copy=structuredClone(s),p=player(s,id),known=new Set([...p.hand,...p.discard]);let deck=shuffled(Object.keys(cards).filter(c=>!known.has(c)),rng);copy.rng=rng.state;
 for(const q of copy.players)if(q.id!==id){const mode=modes[copy.players.filter(p=>p.id!==id).findIndex(p=>p.id===q.id)];q.hand=deck.splice(0,s.physical+s.round);q.discard=[];q.reserved=null;if(s.arcana!==6&&s.arcana!==15)q.choice=null;const fake={...copy,phase:'discard' as const,players:copy.players.map(p=>({...p,bid:null}))};const command=rivalCommand(fake,q.id,policy,mode);q.discard=command.cards!;q.hand=q.hand.filter(c=>!q.discard.includes(c));}
 copy.reserve=deck;copy.inspections=[];if(s.arcana===18)for(const q of copy.players)if(q.id!==id&&q.bid!==null){const mode=modes[copy.players.filter(p=>p.id!==id).findIndex(p=>p.id===q.id)];q.bid=rivalCommand(copy,q.id,policy,mode).value!;}return copy;
}
export function searchBid(s:State,id:string,policy:SearchPolicy,samples=12):Command{
 const actions=allowedBids(s,id),totals=actions.map(()=>0),mass=actions.map(()=>0),active=new Set(actions.map((_,i)=>i)),rng=new Random(hash(`v2-search-${s.round}-${s.arcana}-${id}-${player(s,id).hand.join(',')}-${s.players.map(p=>s.arcana===18&&p.id!==id?null:p.bid).join(',')}`));
 const agent=(s:State,id:string)=>['bid','discard'].includes(s.phase)?learnedCommand(s,id,policy.bid,undefined,policy.discard).command:tacticalCommand(s,id,policy.weights);
 for(let iteration=0;iteration<samples;iteration++){
  const rivals=s.players.filter(p=>p.id!==id),modes:Rival[]=rivals.map((p,i)=>p.botPolicy==='easy'?'easy':p.botPolicy==='rl-v1'?'previous':p.botPolicy==='rl-v2'?'self':(iteration>>i)&1?'previous':'easy');let sampled=sample(s,id,rng,policy,modes),quality=1;
  // Importance weights use public bids only; keep surprising deals possible.
  for(const q of sampled.players)if(s.arcana!==18&&q.id!==id&&q.bid!==null){const mode=modes[rivals.findIndex(p=>p.id===q.id)],dealer=sampled.players.findIndex(p=>p.id===sampled.dealer),order=Array.from({length:3},(_,i)=>sampled.players[(dealer+i+1)%3].id),position=order.indexOf(q.id),beforeBid={...sampled,players:sampled.players.map(p=>({...p,bid:order.indexOf(p.id)<position?p.bid:null}))},estimate=rivalCommand(beforeBid,q.id,policy,mode).value!;quality*=Math.exp(-Math.abs(estimate-q.bid));}
  for(let a=0;a<actions.length;a++){if(!active.has(a))continue;let next=apply(sampled,eventFor(sampled,id,{type:'bid',value:actions[a]}));const history=s.history.length;
   for(let step=0;step<350&&next.history.length===history;step++){const actor=nextActor(next)!;const mode=modes[rivals.findIndex(p=>p.id===actor)];const command=actor===id?agent(next,actor):rivalCommand(next,actor,policy,mode);next=apply(next,eventFor(next,actor,command));}
   if(next.history.length===history)throw Error('Search rollout failed');const mine=player(next,id).score-player(s,id).score,others=next.players.filter(p=>p.id!==id).map(p=>p.score-player(s,p.id).score);const mineFinal=player(next,id).score,bestOther=Math.min(...next.players.filter(p=>p.id!==id).map(p=>p.score));const utility=s.round===5?(mineFinal<bestOther?40:mineFinal===bestOther?8:0)+.1*(bestOther-mineFinal):-mine+.15*(bestOther-Math.min(...s.players.filter(p=>p.id!==id).map(p=>p.score)));totals[a]+=quality*utility;mass[a]+=quality;
  }
  if(iteration===15||iteration===47){const ranked=[...active].sort((a,b)=>totals[b]/mass[b]-totals[a]/mass[a]);active.clear();for(const a of ranked.slice(0,iteration===15?6:4))active.add(a);}
 }
 let best=[...active][0];for(const a of active)if(totals[a]/mass[a]>totals[best]/mass[best])best=a;return {type:'bid',value:actions[best]};
}


/** Plan a short endgame using only sampled hands consistent with public suit voids. */
export function searchPlay(s:State,id:string,policy:SearchPolicy,samples=20):Command{
 const fallback=tacticalCommand(s,id,policy.weights),me=player(s,id);
 if(s.phase!=='play'||me.hand.length>5||s.pending||s.forced.includes(id)||s.trick.some(p=>p.concealed))return fallback;
 const commands=[fallback,...playOptions(s,id).filter(c=>JSON.stringify(c)!==JSON.stringify(fallback))];
 if(commands.length<2)return fallback;
 const known=new Set([...me.hand,...me.discard,...(s.completedTricks??[]).flatMap(t=>t.map(p=>p.card)),...s.lastTrick.map(p=>p.card),...s.trick.map(p=>p.card)]);
 const unseen=Object.keys(cards).filter(c=>!known.has(c)),rivals=s.players.filter(p=>p.id!==id),rng=new Random(hash(`v2-play-${s.round}-${s.trickNumber}-${id}-${me.hand.join(',')}-${s.trick.map(p=>p.card).join(',')}`)),totals=commands.map(()=>0);let completed=0;
 for(let iteration=0;iteration<samples;iteration++){
  let sampled:State|undefined;
  for(let attempt=0;attempt<40&&!sampled;attempt++){
   const copy=structuredClone(s);let deck=shuffled(unseen,rng),valid=true;
   for(const q of shuffled(copy.players.filter(p=>p.id!==id),rng)){
    const size=s.physical-s.trickNumber+1-(s.trick.some(p=>p.player===q.id)?1:0),voids=s.voids?.[q.id]??[],eligible=deck.filter(c=>!voids.includes(cards[c].suit));
    if(eligible.length<size){valid=false;break;}
    q.hand=eligible.slice(0,size);const held=new Set(q.hand);deck=deck.filter(c=>!held.has(c));q.reserved=null;if(s.arcana!==6&&s.arcana!==15)q.choice=null;
   }
   if(!valid)continue;
   for(const q of copy.players)if(q.id!==id)q.discard=deck.splice(0,s.round);
   copy.reserve=deck;copy.inspections=[];copy.rng=rng.state;sampled=copy;
  }
  if(!sampled)continue;
  const modes:Rival[]=rivals.map((p,i)=>p.botPolicy==='easy'?'easy':p.botPolicy==='rl-v1'?'previous':p.botPolicy==='rl-v2'?'self':(iteration>>i)&1?'previous':'easy');
  for(let a=0;a<commands.length;a++){
   let next=apply(sampled,eventFor(sampled,id,commands[a]));
   for(let step=0;step<150&&next.history.length===s.history.length;step++){
    const actor=nextActor(next)!,command=actor===id?tacticalCommand(next,actor,policy.weights):rivalCommand(next,actor,policy,modes[rivals.findIndex(p=>p.id===actor)]);
    next=apply(next,eventFor(next,actor,command));
   }
   if(next.history.length===s.history.length)throw Error('Endgame search did not finish');
   const mine=player(next,id).score,bestOther=Math.min(...next.players.filter(p=>p.id!==id).map(p=>p.score));
   totals[a]+=s.round===5?(mine<bestOther?40:mine===bestOther?8:0)+.1*(bestOther-mine):-(mine-me.score)+.15*(bestOther-Math.min(...rivals.map(p=>p.score)));
  }
  completed++;
 }
 if(!completed)return fallback;
 let best=0;for(let a=1;a<commands.length;a++)if(totals[a]>totals[best]+1e-9)best=a;
 return commands[best];
}
