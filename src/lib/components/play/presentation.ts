import {apply,eventFor,legalCards,bidMax,player} from '$lib/engine/engine';
import type {State,Command} from '$lib/engine/types';
export function adjustments(s:State,id:string):number[]{const p=player(s,id);if(s.phase!=='after'||s.winner!==id||p.adjusted)return [];if(s.arcana===3&&s.firstWin[id]&&p.bid!<bidMax(s))return [p.bid!+1];if(s.arcana===14)return [p.bid!-1,p.bid!+1].filter(n=>n>=0&&n<=bidMax(s));return [];}
export function afterPower(s:State,id:string){const p=player(s,id);return s.phase==='after'&&s.winner===id&&(!p.used&&((p.imp===4||p.imp===8&&s.trickNumber<s.physical)||p.imp===1&&p.hand.length>0&&s.players.some(q=>q.id!==id&&q.hand.length>0))||p.imp===9&&!s.afterRevealed&&s.players.some(q=>q.id!==id&&q.hand.length>0));}
export function automaticCommand(s:State,id:string):Command|null{
 if(s.phase==='round-end')return s.players.every(p=>p.done)?{type:'continue'}:null;
 if(s.turn!==id)return null;
 const p=player(s,id);
 if(s.phase==='prebid'&&(p.imp!==7||p.used||!s.players.some(q=>q.id!==id&&q.hand.length)))return {type:'prebid'};
 if(s.phase==='arcana'&&s.arcana===15&&s.standing[id]!==Math.max(...Object.values(s.standing)))return {type:'arcana'};
 if(s.phase==='after'&&!adjustments(s,id).length&&!afterPower(s,id))return {type:'continue'};
 return null;
}
export const transitionDuration=(phase:string)=>phase==='round-end'?650:phase==='after'?1600:650;
export function collectionPose(progress:number,index:number,count:number,towardSelf:boolean,spacing=100){const gather=Math.max(0,Math.min(1,(progress-.25)/.35));const depart=Math.max(0,Math.min(1,(progress-.6)/.4));const ease=(n:number)=>n*n*(3-2*n);return {x:(index-(count-1)/2)*-spacing*ease(gather),y:(towardSelf?180:-180)*ease(depart),rotate:(index-(count-1)/2)*-4*(1-ease(gather)),scale:1-.6*ease(depart),opacity:1-ease(depart)};}

export function remainingBalance(s:State){
 const needed=s.players.reduce((n,p)=>n+Math.max(0,(s.phase==='adjust'?s.initialBids[p.id]:p.bid??0)-p.won),0);
 const tricks=Math.max(0,bidMax(s)-s.players.reduce((n,p)=>n+p.won,0));
 const difference=needed-tricks;
 return {needed,tricks,label:difference>0?`OVER ${difference}`:difference<0?`UNDER ${-difference}`:'EVEN'};
}

export const cardPlayDuration=1000;
export const flightEnd=.68;
export const smooth=(value:number)=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
export function playStages(progress:number){return {flight:smooth(progress/flightEnd),reflow:smooth((progress-flightEnd)/(1-flightEnd))};}
export function fanPose(index:number,count:number,width:number,cardWidth:number){const fraction=count<=1?0:index/(count-1)-.5;const span=Math.min(width-cardWidth-60,Math.max(0,count-1)*cardWidth*.43);return {x:fraction*span,angle:fraction*Math.min(22,count*1.7),dip:fraction*fraction*32};}
export type CardBox={x:number;y:number;width:number;height:number;angle:number};
export function flightPose(from:CardBox,to:CardBox,progress:number):CardBox{const t=playStages(progress).flight;const lerp=(a:number,b:number)=>a+(b-a)*t;return {x:lerp(from.x,to.x),y:lerp(from.y,to.y)-Math.sin(t*Math.PI)*Math.min(45,Math.abs(to.y-from.y)*.15),width:lerp(from.width,to.width),height:lerp(from.height,to.height),angle:lerp(from.angle,to.angle)};}

export const collectionLanding=.94;
export function displayedWon(s:State,id:string,progress:number,collecting:boolean){const p=player(s,id);if(s.phase!=='after'||s.winner!==id||collecting&&progress>=collectionLanding)return p.won;return Math.max(0,p.won-(s.arcana===13&&s.trickNumber===s.physical?2:1));}
export function collectFlightPose(from:CardBox,centre:CardBox,target:CardBox,index:number,progress:number){
 const gather=smooth((progress-.18)/.25),travel=smooth((progress-.5)/.4);
 const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
 const gathered={x:lerp(from.x,centre.x+index*2,gather),y:lerp(from.y,centre.y+index*2,gather),angle:lerp(from.angle,index*2,gather)};
 const flip=Math.max(0,Math.min(1,(progress-.4)/.12));
 return {x:lerp(gathered.x,target.x,travel),y:lerp(gathered.y,target.y,travel),width:lerp(from.width,target.width,travel),height:lerp(from.height,target.height,travel),angle:lerp(gathered.angle,target.angle,travel),flip:flip<.5?flip*180:(flip-1)*180,back:flip>=.5};
}

export const decisionDuration=1100;
export function decisionStages(progress:number){return {shrink:smooth((progress-.23)/.45),reveal:smooth((progress-.68)/.32),ready:progress>=1};}

export const readyDuration=450;
export function readyPose(progress:number){const t=Math.max(0,Math.min(1,progress)),c=1.70158;return {opacity:Math.min(1,t*3),scale:1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2),angle:(1-t)*-28};}

export function seereCanLead(s:State,id:string){const p=player(s,id);return s.phase==='after'&&s.winner===id&&p.imp===8&&!p.used&&s.trickNumber<s.physical&&!s.nextLeader;}
export function seereLeadCards(s:State,id:string){if(!seereCanLead(s,id))return [];return legalCards(apply(s,eventFor(s,id,{type:'continue'})),id);}

/** Only offer hand controls when a click has a defined action. */
export function handAcceptsInput(s:State,id:string,armed=false):boolean{
 const p=player(s,id);
 if(s.phase==='discard')return !p.done;
 if(s.phase==='magician'||s.phase==='arcana')return s.turn===id&&[0,1,9].includes(s.arcana);
 if(s.phase==='play')return s.turn===id;
 return seereCanLead(s,id)||s.phase==='after'&&s.winner===id&&armed&&p.imp===1&&!p.used;
}

/** Preserve work across unrelated events; clear it when this player's decision changes. */
export function handDecisionKey(s:State,id:string):string{
 const p=player(s,id);
 return JSON.stringify([id,s.round,s.phase,s.arcana,s.phase==='discard'?null:s.turn,s.trickNumber,s.winner,p.hand,p.reserved,p.done,p.used,p.adjusted,p.bid,s.pending,s.afterRevealed]);
}
