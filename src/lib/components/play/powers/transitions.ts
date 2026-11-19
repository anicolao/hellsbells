import {apply} from '$lib/engine/engine';
import type {State,Event} from '$lib/engine/types';
export type MotionKind='activation'|'play'|'draw'|'replacement'|'reveal';
export type PowerMotion={kind:MotionKind;imp:number;actor:string;target?:string;given?:string;received?:string;played?:string;returned?:string;inspected:string[];revealed:string[];concealed:boolean;bell:boolean};
export type PresentationFrame={key:string;event:Event;before:State;after:State;motion:PowerMotion;start:number;duration:number;mask:string[]};
export function motionDuration(m:PowerMotion){return m.bell?m.imp===1||m.imp===4||m.imp===7?2800:2200:m.kind==='reveal'?700:1000;}
export const bellTime=160;
export const bellDuration=900;
export function effectProgress(frame:PresentationFrame,elapsed:number){const start=frame.motion.bell?bellDuration:0;return Math.max(0,Math.min(1,(elapsed-start)/(frame.duration-start)));}
/** Describe only what this event actually changed. No later move or random outcome is invented. */
export function describeEvent(before:State,event:Event){
 const after=apply(before,event),c=event.command,p=before.players.find(p=>p.id===event.actor),motions:PowerMotion[]=[];
 if(!p)return {after,motions};
 const activation=c.type==='play'&&c.power&&[0,2,3].includes(p.imp)||c.type==='power'&&[1,4,8,9].includes(p.imp)||c.type==='prebid'&&c.target&&p.imp===7||c.type==='recall'&&p.imp===5||c.type==='shax'&&p.imp===6;
 const play=(after.phase==='after'?after.lastTrick:after.trick).find(q=>q.player===event.actor);
 const base:PowerMotion={kind:'activation',imp:p.imp,actor:p.id,target:c.target,inspected:[],revealed:[],concealed:false,bell:!!activation};
 if(activation){
  const m={...base};
  if(c.type==='play'){m.played=play?.card;m.concealed=p.imp===3;}
  if(p.imp===1){m.given=c.card;m.received=after.players.find(q=>q.id===p.id)!.hand.find(card=>!p.hand.includes(card));}
  if(p.imp===4||p.imp===7)m.inspected=after.inspections.slice(before.inspections.length).filter(i=>i.viewer===p.id).flatMap(i=>i.cards);
  if(p.imp===5){const original=before.trick.find(q=>q.card===c.card);m.returned=after.pending?c.card:undefined;m.target=original?.player;m.concealed=!!original?.concealed;}
  if(p.imp===9)m.revealed=after.exposed.filter(card=>!before.exposed.includes(card));
  motions.push(m);
 }else if(c.type==='play'||c.type==='continue'&&c.card){
  if(before.pending&&c.type==='play')motions.push({...base,kind:'replacement',imp:5,actor:before.pending.returnTo,target:p.id,played:after.trick[before.pending.index]?.card,concealed:before.pending.concealed});
  else if(c.type==='play'&&before.forced.includes(p.id)){const shax=before.players.find(q=>q.imp===6&&q.used);motions.push({...base,kind:'draw',imp:6,actor:shax?.id??p.id,target:p.id,played:play?.card,concealed:!!after.trick.find(q=>q.player===p.id)?.concealed});}
  else if(play)motions.push({...base,kind:'play',played:play.card,concealed:!!after.trick.find(q=>q.player===p.id)?.concealed});
 }
 const turned=after.phase==='after'&&before.phase==='play'?after.trick.filter(q=>q.concealed).map(q=>q.card):[];
 if(turned.length){const bael=after.trick.find(q=>q.concealed)!;motions.push({...base,kind:'reveal',imp:3,actor:bael.player,played:bael.card,revealed:turned,bell:false});}
 return {after,motions};
}
export type PresentationSample={game:State;frame:PresentationFrame|null;elapsed:number;progress:number;effect:number;busy:boolean};
/** Both live delivery and the lab's controllable clock feed this same append-only presentation timeline. */
export class PresentationTimeline{
 latest:State;seed:State;frames:PresentationFrame[]=[];end=0;
 constructor(seed:State){this.latest=seed;this.seed=seed;}
 append(events:Event[],now=0){
  for(const event of events){if(event.sequence<=this.latest.revision)continue;const before=this.latest,{after,motions}=describeEvent(before,event);this.latest=after;
   const hidden=motions.find(m=>m.kind==='reveal')?.revealed??[];
   if(!motions.length){this.frames.push({key:`${event.id}:state`,event,before,after,motion:{kind:'play',imp:-1,actor:event.actor,inspected:[],revealed:[],concealed:false,bell:false},start:Math.max(this.end,now),duration:0,mask:[]});this.end=Math.max(this.end,now);continue;}
   for(const [index,motion] of motions.entries()){const duration=motionDuration(motion),start=Math.max(this.end,now);this.frames.push({key:`${event.id}:${index}`,event,before,after,motion,start,duration,mask:hidden});this.end=start+duration;}
  }
 }
 sample(time:number):PresentationSample{
  let game=this.seed;
  for(const frame of this.frames){if(time<frame.start)return {game,frame:null,elapsed:0,progress:0,effect:0,busy:true};
   if(frame.duration&&time<frame.start+frame.duration){const elapsed=Math.max(0,time-frame.start),effect=effectProgress(frame,elapsed),bell=frame.motion.bell&&elapsed<bellDuration;return {game:bell?frame.before:frame.after,frame,elapsed,progress:elapsed/frame.duration,effect,busy:true};}
   game=frame.after;
  }
  return {game,frame:null,elapsed:0,progress:1,effect:1,busy:false};
 }
 prune(time:number){let count=0;for(const frame of this.frames){if(frame.start+frame.duration>time)break;this.seed=frame.after;count++;}if(count)this.frames.splice(0,count);}
 skip(){this.seed=this.latest;this.frames=[];this.end=0;}
}
