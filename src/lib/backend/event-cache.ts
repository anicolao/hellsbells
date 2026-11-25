import type {Event,State} from '$lib/engine/types';
import {EventProjection} from './event-projection';

// Shared across preview paths, but never across Firebase projects or games.
export const eventCacheName='hellsbells-events-v1';
// Bump when engine fixes change how existing events reduce. The local log
// rebuilds this disposable projection without downloading history again.
const projectionVersion=1;
export type Checkpoint={key:string;projectionVersion:number;sequence:number;state:State};
let opening:Promise<IDBDatabase|undefined>|undefined;
function database(){
 let factory:IDBFactory;
 try{if(typeof indexedDB==='undefined')return Promise.resolve(undefined);factory=indexedDB;}catch{return Promise.resolve(undefined);}
 return opening??=new Promise<IDBDatabase|undefined>(resolve=>{
  try{
   const request=factory.open(eventCacheName,1);
   request.onupgradeneeded=()=>{
    const db=request.result;
    db.createObjectStore('heads',{keyPath:'key'});
    db.createObjectStore('events',{keyPath:['key','sequence']});
   };
   request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();opening=undefined;};resolve(db);};
   request.onerror=request.onblocked=()=>resolve(undefined);
  }catch{resolve(undefined);}
 });
}
/** Storage denial is a supported memory-only mode, never a reason to break play. */
export async function cachedCheckpoint(key:string):Promise<Checkpoint|undefined>{
 const db=await database();if(!db)return;
 const head=await new Promise<Checkpoint|undefined>(resolve=>{
  try{
   const request=db.transaction('heads').objectStore('heads').get(key);
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>resolve(undefined);
  }catch{resolve(undefined);}
 });
 if(head?.state&&head.projectionVersion===projectionVersion&&head.sequence===head.state.revision&&head.state.version===1)return head;
 // Checkpoints are disposable projections. A changed projection version or
 // missing head can be rebuilt once from the durable local event archive.
 const events=await new Promise<Event[]>(resolve=>{
  try{
   const request=db.transaction('events').objectStore('events').getAll(IDBKeyRange.bound([key,1],[key,Number.MAX_SAFE_INTEGER]));
   request.onsuccess=()=>resolve(request.result.map((row:{event:Event})=>row.event));
   request.onerror=()=>resolve([]);
  }catch{resolve([]);}
 });
 if(!events.length)return;
 try{
  const projection=new EventProjection();projection.accept(events);
  if(projection.state){await cacheCommitted(key,[],projection.state);return {key,projectionVersion,sequence:projection.revision,state:projection.state};}
 }catch{/* An incomplete local archive requires a fresh initial download. */}
}
/** Append only the new events and atomically checkpoint their committed state. */
export async function cacheCommitted(key:string,events:readonly Event[],state:State):Promise<void>{
 const db=await database();if(!db)return;
 return new Promise(resolve=>{
  try{
   const tx=db.transaction(['heads','events'],'readwrite'),heads=tx.objectStore('heads');
   for(const event of events)tx.objectStore('events').put({key,sequence:event.sequence,event});
   const request=heads.get(key);
   request.onsuccess=()=>{
    // A lagging tab must never overwrite a newer tab's checkpoint.
    if(!request.result||request.result.sequence<state.revision||request.result.sequence===state.revision&&(request.result.projectionVersion!==projectionVersion||request.result.state?.revision!==state.revision))heads.put({key,projectionVersion,sequence:state.revision,state} satisfies Checkpoint);
   };
   tx.oncomplete=()=>resolve();tx.onerror=tx.onabort=()=>resolve();
  }catch{resolve();}
 });
}
