import type {State,Command} from './types';
import {available,legalCards,allowedBids,player,cards,bidMax} from './engine';
export function nextActor(s:State):string|null{
 if(s.phase==='lobby'||s.phase==='ended')return null;
 if(s.phase==='draft')return s.players.find(p=>p.imp<0)?.id??null;
 if(s.phase==='discard')return s.players.find(p=>!p.done)?.id??null;
 if(s.phase==='bid'&&s.arcana===18)return s.players.find(p=>p.bid===null)?.id??null;
 if(s.phase==='adjust'){const max=Math.max(...Object.values(s.standing));return s.players.find(p=>s.standing[p.id]===max&&!p.done)?.id??null;}
 if(s.phase==='round-end')return (s.players.find(p=>p.bot&&!p.done)??s.players.find(p=>!p.done))?.id??s.owner;
 return s.turn;
}
export function botCommand(s:State,id:string):Command{
 const p=player(s,id);if(s.phase==='round-end')return s.players.every(p=>p.done)?{type:'continue'}:{type:'continue',value:1};if(s.phase==='draft')return {type:'choose',value:p.options[0]};
 if(s.phase==='discard')return {type:'discard',cards:[...p.hand].sort((a,b)=>cards[a].rank-cards[b].rank).slice(0,s.round)};
 if(s.phase==='magician')return {type:'arcana'};
 if(s.phase==='arcana')return {type:'arcana',...((s.arcana===6||s.arcana===15&&s.standing[id]===Math.max(...Object.values(s.standing)))?{target:s.players.find(q=>q.id!==id)!.id}:{})};
 if(s.phase==='prebid')return {type:'prebid'};
 if(s.phase==='bid'){const tr=['Wands','Cups','Swords','Pentacles'][s.arcana%4];const estimate=Math.round(p.hand.reduce((n,c)=>n+(cards[c].rank>=12?.65:cards[c].rank>=9?.3:.04)+(cards[c].suit===tr?.25:0),0));const bids=allowedBids(s,id);return {type:'bid',value:bids.reduce((a,b)=>Math.abs(b-estimate)<Math.abs(a-estimate)?b:a)};}
 if(s.phase==='adjust')return {type:'adjust',value:Math.max(0,Math.min(bidMax(s),p.bid??0))};
 if(s.phase==='play'){const options=legalCards(s,id,s.pending?.original);const seek=p.won<(p.bid??0);return {type:'play',card:[...options].sort((a,b)=>seek?cards[b].rank-cards[a].rank:cards[a].rank-cards[b].rank)[0],royal:true};}
 if(s.phase==='after'){if(s.arcana===14&&!p.adjusted&&Math.abs(p.won-(p.bid??0))===1&&s.trickNumber===s.physical)return {type:'adjust',value:p.won};return {type:'continue'};}
 return {type:'continue'};
}
