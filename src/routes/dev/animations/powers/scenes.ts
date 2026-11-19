import {apply,eventFor,legalCards,replay} from '$lib/engine/engine';
import {nextActor,botCommand} from '$lib/engine/bot';
import {imps} from '$lib/data/game';
import type {State,Command,Event} from '$lib/engine/types';
export const powerOptions=imps.map((imp,index)=>({id:`bell-${index}`,name:imp.name,hint:'Actual game events, rendered by the production table. Scrubbing is silent.'}));
export type PowerScene={before:State;history:Event[];events:Event[];actor:string;target:string};
const cache=new Map<string,PowerScene>();
export function makePowerScene(imp:number,count:number):PowerScene{
 const key=`${imp}:${count}`,cached=cache.get(key);if(cached)return cached;
 for(let seed=1;seed<300;seed++){
  let s:State|undefined;const history:Event[]=[];
  function step(actor:string,command:Command){const e=s?eventFor(s,actor,command,`fixture-${history.length+1}`):{version:1 as const,sequence:1,actor,id:'fixture-1',command};s=apply(s,e);history.push(e);}
  step('you',{type:'create',seed:`power-review-${seed}`,capacity:count,name:'Alex'});
  for(let i=1;i<count;i++)step(`seat-${i}`,{type:'join',name:['Belial','Paimon','Vassago','Orobas'][i-1]});
  step('you',{type:'start'});if(!s!.players[0].options.includes(imp))continue;
  for(const p of [...s!.players])step(p.id,{type:'choose',value:p.id==='you'?imp:p.options[0]});
  for(let move=0;move<350&&s!.round===1;move++){
   const state=s!,actor='you',p=state.players[0],target=state.players.find(q=>q.id!==actor&&q.hand.length)?.id;
   let command:Command|undefined;
   if(target&&!p.used){
    if(imp===7&&state.phase==='prebid'&&state.turn===actor)command={type:'prebid',target};
    if(state.phase==='play'&&state.turn===actor&&!state.pending){
     if([0,2,3].includes(imp)&&(imp!==3||state.trick.length===0))command={type:'play',card:legalCards(state,actor)[0],power:true};
     if(imp===5&&state.trick.some(q=>legalCards(state,q.player,q.card).length))command={type:'recall',card:state.trick.find(q=>legalCards(state,q.player,q.card).length)!.card};
     if(imp===6){const victim=state.players.find(q=>q.id!==actor&&!state.trick.some(t=>t.player===q.id));if(victim)command={type:'shax',target:victim.id};}
    }
    if(state.phase==='after'&&state.winner===actor&&p.hand.length&&[1,4,8,9].includes(imp))command={type:'power',target,...(imp===1?{card:p.hand[0]}:{})};
   }
   if(command){
    const before=replay(history)!,prefix=[...history];try{step(actor,command);}catch{break;}
    if(imp===3){while(s!.phase==='play'){const who=nextActor(s!)!;step(who,botCommand(s!,who));}}
    if(imp===5&&s!.pending){const who=s!.turn;step(who,botCommand(s!,who));}
    if(imp===6){let n=0;while(s!.phase==='play'&&s!.forced.length&&n++<count+1){const who=nextActor(s!)!;step(who,botCommand(s!,who));}}
    const result={before,history:prefix,events:history.slice(prefix.length),actor,target:command.target??before.trick.find(t=>t.card===command.card)?.player??target!};cache.set(key,result);return result;
   }
   const who=nextActor(state);if(!who)break;try{step(who,botCommand(state,who));}catch{break;}
  }
 }
 throw Error(`No legal fixture found for imp ${imp}, ${count} players`);
}
