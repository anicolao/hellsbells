import type {Event,State} from '$lib/engine/types';
import {cachedCheckpoint,cacheCommitted} from './event-cache';
import {EventProjection} from './event-projection';

export type Feed=(after:number,receive:(events:Event[],confirmed:boolean,full?:boolean)=>void,error:(error:Error)=>void)=>()=>void;
type Observer={ready:boolean;update:(state:State,events:Event[],synced:boolean)=>void;error:(error:Error)=>void};
type Waiter={revision:number;from:number;resolve:(value:{state:State;events:Event[]})=>void;reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>};

/** One cursor-based listener per game and Firestore client, shared by writes and UI. */
export class EventStream{
 private projection=new EventProjection();
 private observers=new Set<Observer>();
 private waiters=new Set<Waiter>();
 private stopFeed:(()=>void)|undefined;
 private generation=0;
 private starting=false;
 private synced=false;
 private failure:Error|undefined;
 private ready:Promise<void>;
 private delivery:Event[]=[];
 constructor(private key:string,private feed:Feed){
  this.ready=cachedCheckpoint(key).then(head=>{if(head)this.projection=new EventProjection(head.state);});
 }
 private get needed(){return this.observers.size>0||this.waiters.size>0;}
 async cachedState(){await this.ready;return this.projection.state;}
 committed(id:string){return this.projection.committed(id);}
 subscribe(update:Observer['update'],error:Observer['error']){
  const observer={update,error,ready:false};this.observers.add(observer);
  if(this.failure)error(this.failure);
  else if(this.stopFeed&&this.projection.state){observer.ready=this.synced;update(this.projection.state,[],this.synced);}
  else this.start();
  return()=>{this.observers.delete(observer);this.release();};
 }
 async checkpoint(events:Event[]){
  await this.ready;
  const added=this.projection.accept(events);
  if(added.length&&this.projection.state)await cacheCommitted(this.key,added,this.projection.state);
 }
 waitForRevision(revision=0,from=0,timeout=15000):Promise<{state:State;events:Event[]}>{
  if(this.failure)return Promise.reject(this.failure);
  if(this.synced&&this.projection.state&&this.projection.revision>=revision)return Promise.resolve({state:this.projection.state,events:this.projection.since(from)});
  return new Promise((resolve,reject)=>{
   const waiter:Waiter={revision,from,resolve,reject,timer:setTimeout(()=>{
    this.waiters.delete(waiter);this.release();reject(Error('Unable to synchronize the table. Please reconnect.'));
   },timeout)};
   this.waiters.add(waiter);this.start();
  });
 }
 private start(){
  if(this.starting||this.stopFeed||this.failure)return;
  this.starting=true;
  void this.ready.then(()=>{
   this.starting=false;if(!this.needed||this.failure)return;
   this.synced=false;this.notify([]);this.listen();
  }).catch(e=>this.fail(e as Error));
 }
 private listen(){
  this.stopFeed?.();const generation=++this.generation,after=this.projection.revision;
  const rotate=()=>queueMicrotask(()=>{if(this.needed&&generation===this.generation&&!this.failure)this.listen();});
  const stop=this.feed(after,(events,confirmed,full=false)=>{
   if(generation!==this.generation||this.failure)return;
   if(!confirmed){if(this.synced){this.synced=false;this.notify([]);if(this.projection.revision>after)rotate();}return;}
   try{
    const added=this.projection.accept(events),wasSynced=this.synced;
    this.synced=!full;this.delivery.push(...added);
    if(!this.projection.state)throw Error('That table was not found');
    if(added.length)void cacheCommitted(this.key,added,this.projection.state);
    // A full page may have a successor. Do not act on that partial prefix.
    if(full){rotate();return;}
    if(this.delivery.length||!wasSynced){const delivered=this.delivery;this.delivery=[];this.notify(delivered);}
    this.resolveWaiters();
   }catch(e){this.fail(e as Error);}
  },error=>{if(generation===this.generation)this.fail(error);});
  if(generation===this.generation&&this.needed&&!this.failure)this.stopFeed=stop;else stop();
 }
 private notify(events:Event[]){
  const state=this.projection.state;if(!state)return;
  for(const observer of this.observers){
   // Long offline catch-up should jump to the committed tip, not queue a replay.
   observer.update(state,observer.ready&&events.length<=128?events:[],this.synced);
   if(this.synced)observer.ready=true;
  }
 }
 private resolveWaiters(){
  const state=this.projection.state;if(!state||!this.synced)return;
  for(const waiter of this.waiters)if(state.revision>=waiter.revision){
   clearTimeout(waiter.timer);this.waiters.delete(waiter);
   waiter.resolve({state,events:this.projection.since(waiter.from)});
  }
  this.release();
 }
 private release(){if(!this.needed){this.stopFeed?.();this.stopFeed=undefined;this.generation++;this.synced=false;}}
 private fail(error:Error){
  this.failure=error;this.synced=false;this.stopFeed?.();this.stopFeed=undefined;this.generation++;
  for(const waiter of this.waiters){clearTimeout(waiter.timer);waiter.reject(error);}this.waiters.clear();
  for(const observer of this.observers)observer.error(error);
 }
}
