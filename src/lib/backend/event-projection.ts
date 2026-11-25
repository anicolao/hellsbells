import {apply} from '$lib/engine/engine';
import type {Event,State} from '$lib/engine/types';

/** Each committed sequence is reduced once. Old history is kept on disk, not replayed. */
export class EventProjection{
 state:State|undefined;
 private recent:Event[]=[];
 constructor(state?:State,private reduce=apply){this.state=state;}
 get revision(){return this.state?.revision??0;}
 accept(events:readonly Event[]){
  const added:Event[]=[];
  for(const event of events){
   if(event.sequence<=this.revision)continue;
   if(event.sequence!==this.revision+1)throw Error(`Missing game event ${this.revision+1}; received ${event.sequence}.`);
   this.state=this.reduce(this.state,event);added.push(event);this.recent.push(event);
   if(this.recent.length>128)this.recent.shift();
  }
  return added;
 }
 since(revision:number){return this.recent.filter(e=>e.sequence>revision);}
 committed(id:string){return this.recent.find(e=>e.id===id);}
}
