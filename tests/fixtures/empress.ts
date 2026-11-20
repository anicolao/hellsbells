import {apply,eventFor} from '../../src/lib/engine/engine';
import {nextActor,botCommand} from '../../src/lib/engine/bot';
import type {State,Command,Event} from '../../src/lib/engine/types';
/** A legal recorded first win: Empress and an unused Andromalius power. */
export function empressHistory(){
 for(let seed=0;seed<500;seed++){
  let state:State|undefined;const events:Event[]=[];
  const step=(actor:string,command:Command)=>{const event=eventFor(state,actor,command,`empress-${events.length+1}`);state=apply(state,event);events.push(event);};
  step('you',{type:'create',seed:`empress-regression-${seed}`,capacity:3,name:'Alex'});
  step('other-1',{type:'join',name:'Belial'});step('other-2',{type:'join',name:'Paimon'});step('you',{type:'start'});
  if(!state!.players[0].options.includes(9))continue;
  for(const p of [...state!.players])step(p.id,{type:'choose',value:p.id==='you'?9:p.options[0]});
  if(state!.arcana!==3)continue;
  for(let n=0;n<180&&state!.round===1;n++){
   if(state!.phase==='after'&&state!.winner==='you')return events;
   const actor=nextActor(state!);if(!actor)break;step(actor,botCommand(state!,actor));
  }
 }
 throw Error('Could not generate the Empress first-win fixture');
}
