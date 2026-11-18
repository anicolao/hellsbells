import {cards,player,trump,legalCards,bidMax,trickWinner} from '../engine';
import {botCommand} from '../bot';
import type {State,Command} from '../types';

// These weights are a policy, not game rules. League training may replace them.
export const initialTactics=[1,.2,.3,.3,.1,.1,.25,.2,1,0,.15];
export function knownCards(s:State,id:string){const p=player(s,id);return new Set([...p.hand,...p.discard,...(s.completedTricks??[]).flatMap(t=>t.map(p=>p.card)),...s.trick.filter(p=>!p.concealed||p.player===id).map(p=>p.card),...s.lastTrick.map(p=>p.card),...s.exposed,...s.inspections.filter(i=>i.viewer===id).flatMap(i=>i.cards)]);}
type Observation={unknown:number;counts:Record<string,number[]>;totals:Record<string,number>};
function observation(s:State,id:string):Observation{const known=knownCards(s,id),counts:Record<string,number[]>={},totals:Record<string,number>={};let unknown=0;for(const c of Object.values(cards))if(!known.has(c.id)){(counts[c.suit]??=Array(15).fill(0))[c.rank]++;totals[c.suit]=(totals[c.suit]??0)+1;unknown++;}for(const suit of ['Wands','Cups','Swords','Pentacles']){counts[suit]??=Array(15).fill(0);totals[suit]??=0;for(let i=1;i<=14;i++)counts[suit][i]+=counts[suit][i-1];}return {unknown,counts,totals};}
function none(total:number,marked:number,draw:number){let p=1;for(let i=0;i<draw;i++)p*=Math.max(0,total-marked-i)/Math.max(1,total-i);return p;}
/** Probability estimate from public cards and this player's hand only. */
export function winChance(s:State,id:string,card:string,low=false,noTrump=s.noTrump,view=observation(s,id)){const suit=cards[card].suit,led=s.changedSuit?s.led:s.led??suit,tr=trump(s);const plays=[...s.trick.filter(p=>p.player!==id&&!p.concealed),{player:id,card,concealed:false}];const state={...s,led,low:s.trick.length?s.low:low,noTrump};const winningSuit=!noTrump&&plays.some(p=>cards[p.card].suit===tr)?tr:led;if(!plays.some(p=>cards[p.card].suit===winningSuit)||trickWinner(state,plays)!==id)return 0;
 const unknown=view.unknown,remaining=s.players.length-plays.length;let probability=1;
 for(let i=0;i<remaining;i++){const draw=s.physical-s.trickNumber+1,opponent=s.players[(s.players.findIndex(p=>p.id===id)+i+1)%s.players.length];const seeks=(opponent.bid??0)>opponent.won,playsStrong=seeks!==state.low;
 const better=state.low?view.counts[suit][cards[card].rank-1]:view.totals[suit]-view.counts[suit][cards[card].rank];
 const worse=view.totals[suit]-better;
 let beaten=playsStrong?1-none(unknown,better,draw):none(unknown,worse,draw)-none(unknown,worse+better,draw);
 if(suit===tr&&led!==tr)beaten*=none(unknown,view.totals[led!],draw);
 probability*=1-beaten;
 if(suit!==tr&&!noTrump){const trumps=view.totals[tr],followers=view.totals[led!];probability*=1-none(unknown,followers,draw)*(playsStrong?1-none(unknown-followers,trumps,draw):trumps/Math.max(1,unknown-followers));}
 }
 return Math.max(0,Math.min(1,probability));
}
export function handStrength(s:State,id:string,view=observation(s,id)){const p=player(s,id),tr=trump(s);return p.hand.reduce((sum,c)=>{const suit=cards[c].suit,above=view.totals[suit]-view.counts[suit][cards[c].rank],ownAbove=p.hand.filter(x=>cards[x].suit===suit&&cards[x].rank>cards[c].rank).length;return sum+(suit===tr&&!s.noTrump?Math.pow(.67,above)*Math.pow(.9,ownAbove):Math.pow(.48,above)*Math.pow(.8,ownAbove)*.65);},0);}
export function tacticalCommand(s:State,id:string,weights=initialTactics):Command{
 const p=player(s,id);if(s.phase==='after'){
  if(!p.adjusted&&s.arcana===3&&s.firstWin[id]&&p.bid!<bidMax(s)&&p.won>p.bid!)return {type:'adjust',value:p.bid!+1};
  if(!p.adjusted&&s.arcana===14){if(p.won>p.bid!&&p.bid!<bidMax(s))return {type:'adjust',value:p.bid!+1};if(p.won+s.physical-s.trickNumber<p.bid!)return {type:'adjust',value:p.bid!-1};}
  if(p.imp===8&&!p.used&&!s.afterRevealed&&s.trickNumber<s.physical&&p.won>=p.bid!)return {type:'power',target:s.players.filter(q=>q.id!==id).sort((a,b)=>(b.bid!-b.won)-(a.bid!-a.won))[0].id};
  return botCommand(s,id);
 }
 if(s.phase==='adjust'){const max=s.arcana===20?2:1,prediction=Math.round(handStrength(s,id));return {type:'adjust',value:Math.max(0,Math.min(bidMax(s),Math.max(p.bid!-max,Math.min(p.bid!+max,prediction))))};}
 if(s.phase!=='play')return botCommand(s,id);
 const options:Command[]=legalCards(s,id,s.pending?.original).flatMap<Command>(card=>s.arcana===12&&!s.trick.length?[{type:'play' as const,card,low:false},{type:'play' as const,card,low:true}]:[{type:'play' as const,card,royal:s.arcana===4}]);
 if(!s.pending&&!p.used&&p.imp===0)for(const card of legalCards(s,id,undefined,true))options.push({type:'play',card,power:true,royal:true});
 if(!s.pending&&!p.used&&p.imp===2&&s.trick.length)for(const card of legalCards(s,id))options.push({type:'play',card,power:true});
 const view=observation(s,id),remaining=s.physical-s.trickNumber+1,need=p.bid!-p.won,desired=Math.max(0,Math.min(1,need/remaining)),strength=handStrength(s,id,view),tr=trump(s);
 let best=options[0],score=-Infinity;
 for(const command of options){const card=command.card!,c=cards[card],modified=command.power&&p.imp===0?{...s,led:c.suit,changedSuit:true}:s;
 const chance=winChance(modified,id,card,!!command.low,command.power&&p.imp===2?true:s.noTrump,view);
 // Exact contracts take priority; preserve high cards when ducking and low cards when winning.
 const urgency=need<=0?-1:need>=remaining?1:need>=strength*(weights[8]??1)+(weights[9]??0)?1:-1;
 const visible=s.trick.filter(p=>!p.concealed),currentWinner=visible.some(p=>cards[p.card].suit===s.led||!s.noTrump&&cards[p.card].suit===tr)?trickWinner({...s,trick:visible}):null,opponent=currentWinner&&currentWinner!==id?player(s,currentWinner):null;
 const sabotage=opponent?(1-chance)*(opponent.won>=opponent.bid!?1:-1):0;
 const value=(weights[10]??0)*sabotage+weights[0]*urgency*chance+weights[1]*(desired-.5)*chance+weights[2]*(urgency>0?-1:1)*c.rank/14+weights[3]*(c.suit===tr?-1:0)*Math.min(1,Math.max(0,need)/remaining)+weights[4]*(1-chance)*c.rank/14+weights[5]*(s.players.length===s.trick.length+1&&chance===1?1:0)+weights[6]*(need<=0?-chance*2:0)-weights[7]*(command.power?1:0);
 if(value>score){score=value;best=command;}
 }
 return best;
}
