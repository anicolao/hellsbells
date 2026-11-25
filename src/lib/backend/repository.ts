import {getDoc,doc,collection,query,where,orderBy,limit,onSnapshot,runTransaction,serverTimestamp,type Firestore} from 'firebase/firestore';
import {apply,eventFor} from '$lib/engine/engine';
import type {State,Event,Command} from '$lib/engine/types';
import {EventStream} from './event-stream';
import {TableConflict,isQuotaError} from './errors';
export {TableConflict,isQuotaError} from './errors';
export type Room={owner:string;members:string[];bots:string[];capacity:number;revision:number;phase:string;version:1};
export const gamePath=(id:string)=>`games/${id}`;
function metadata(s:State):Room{return {owner:s.owner,members:s.players.map(p=>p.id),bots:s.players.filter(p=>p.bot).map(p=>p.id),capacity:s.capacity,revision:s.revision,phase:s.phase,version:1};}
const streams=new WeakMap<Firestore,Map<string,EventStream>>();
function stream(db:Firestore,id:string){
 let games=streams.get(db);if(!games){games=new Map();streams.set(db,games);}
 let entry=games.get(id);
 if(!entry){
  entry=new EventStream(`${db.app.options.projectId}/(default)/${id}`,(after,receive,error)=>{
   const tailWindow=128,buffered=new Map<number,Event>();let delivered=after;
   return onSnapshot(query(collection(db,gamePath(id),'events'),where('sequence','>',after),orderBy('sequence'),limit(tailWindow)),{includeMetadataChanges:true},snapshot=>{
    for(const change of snapshot.docChanges({includeMetadataChanges:true})){
     const e=change.doc.data() as Event;
     if(change.type==='removed'){buffered.delete(e.sequence);continue;}
     if(e.sequence>delivered&&!change.doc.metadata.hasPendingWrites)buffered.set(e.sequence,e);
    }
    if(snapshot.metadata.fromCache){receive([],false,false);return;}
    if(snapshot.metadata.hasPendingWrites)return;
    // Retain peer changes while a local transaction is pending. Its metadata
    // acknowledgement alone must not hide those already delivered changes.
    const events:Event[]=[];
    while(buffered.has(delivered+1)){events.push(buffered.get(delivered+1)!);buffered.delete(++delivered);}
    if(buffered.size){error(Error(`Missing game event ${delivered+1}.`));return;}
    receive(events,true,snapshot.size>=tailWindow);
   },error);
  });
  games.set(id,entry);
 }
 return entry;
}
export async function createGame(db:Firestore,uid:string,name:string,capacity=4,id=crypto.randomUUID().slice(0,8).toUpperCase()){
 if(!/^[A-F0-9]{8}$/.test(id))throw Error('Invalid table code');
 const event=eventFor(undefined,uid,{type:'create',seed:crypto.randomUUID(),capacity,name},crypto.randomUUID()),state=apply(undefined,event);let created=false;
 for(let attempt=0;attempt<5;attempt++){
  created=false;
  try{await runTransaction(db,async tx=>{
   const room=doc(db,gamePath(id)),existing=await tx.get(room);
   if(existing.exists()){if(existing.data().owner===uid)return;throw Error('This table already belongs to someone else. Launch a new table.');}
   tx.set(room,metadata(state));tx.set(doc(room,'events','1'),{...event,createdAt:serverTimestamp()});created=true;
  },{maxAttempts:1});break;}
  catch(error){
   const code=(error as {code?:string}).code;
   if(isQuotaError(error)||!['permission-denied','aborted'].includes(code??'')||attempt===4)throw error;
   const existing=await getDoc(doc(db,gamePath(id)));
   if(existing.exists()){if(existing.data().owner===uid)return id;throw Error('This table already belongs to someone else. Launch a new table.');}
  }
 }
 if(created)await stream(db,id).checkpoint([event]);
 return id;
}
export async function joinGame(db:Firestore,uid:string,id:string,name:string){
 const room=doc(db,gamePath(id));
 for(let attempt=0;attempt<5;attempt++){
  let revision=0;
  try{await runTransaction(db,async tx=>{
   const snapshot=await tx.get(room);if(!snapshot.exists())throw Error('That table was not found');const old=snapshot.data() as Room;revision=old.revision;
   if(old.members.includes(uid))return;if(old.phase!=='lobby'||old.members.length>=old.capacity)throw Error('That table has already filled');
   const event:Event={version:1,sequence:old.revision+1,actor:uid,id:crypto.randomUUID(),command:{type:'join',name}};
   tx.update(room,{members:[...old.members,uid],revision:event.sequence});tx.set(doc(room,'events',String(event.sequence)),{...event,createdAt:serverTimestamp()});
  },{maxAttempts:1});return;}
  catch(error){
   const code=(error as {code?:string}).code;
   if(isQuotaError(error)||!['permission-denied','aborted'].includes(code??'')||attempt===4)throw error;
   // A join can lose a membership-rule race before the SDK reports ABORTED.
   // Verify only the room revision; do not fetch the event history.
   const latest=await getDoc(room);if(!latest.exists()||latest.data().revision===revision)throw error;
  }
 }
}
/** Catch up through the existing tail listener; no extra history query. */
export function refreshGame(db:Firestore,id:string,from=0,minimum=0){return stream(db,id).waitForRevision(minimum,from);}
export function isTableConflict(error:unknown){return error instanceof TableConflict||error instanceof Error&&(error.message.includes('The table changed')||['permission-denied','aborted'].includes((error as Error&{code?:string}).code??''));}
export function watchGame(db:Firestore,id:string,update:(state:State,events:Event[],synced?:boolean)=>void,error:(error:Error)=>void){
 return stream(db,id).subscribe((state,events,synced)=>{update(state,events,synced);},error);
}
export async function append(db:Firestore,uid:string,id:string,state:State,actor:string,command:Command){
 if(actor!==uid&&!(state.owner===uid&&state.players.some(p=>p.id===actor&&p.bot)))throw Error('This is another player’s seat');
 const room=doc(db,gamePath(id)),commandId=crypto.randomUUID();
 const independent=command.type==='choose'||command.type==='discard'||command.type==='bid'&&state.arcana===18||command.type==='adjust'&&state.phase==='adjust'||command.type==='continue'&&command.value===1&&state.phase==='round-end';
 let current=state;
 for(let attempt=0;attempt<8;attempt++){
  const event=eventFor(current,actor,command,commandId),next=apply(current,event);
  try{await runTransaction(db,async tx=>{
   const snapshot=await tx.get(room);if(!snapshot.exists())throw Error('That table was not found');
   if(snapshot.data().revision!==current.revision)throw new TableConflict(snapshot.data().revision);
   tx.set(doc(room,'events',String(event.sequence)),{...event,createdAt:serverTimestamp()});tx.update(room,metadata(next));
  },{maxAttempts:1});return event.sequence;}
  catch(error){
   if(isQuotaError(error)||!independent||!isTableConflict(error)||attempt===7)throw error;
   const entry=stream(db,id),minimum=error instanceof TableConflict?error.revision:current.revision;
   const fresh=await entry.waitForRevision(minimum,current.revision);
   const committed=entry.committed(commandId);if(committed)return committed.sequence;
   if(fresh.state.round!==state.round||fresh.state.phase!==state.phase)throw error;
   current=fresh.state;
  }
 }
}
/** A guest arriving before the host waits without creating or claiming the table. */
export function waitForGame(db:Firestore,id:string,ready:()=>void,error:(error:Error)=>void){return onSnapshot(doc(db,gamePath(id)),snapshot=>{if(snapshot.exists())ready();},error);}
export async function hasSeat(db:Firestore,uid:string,id:string){
 const cached=await stream(db,id).cachedState();if(cached?.players.some(p=>p.id===uid))return true;
 const room=await getDoc(doc(db,gamePath(id)));return room.exists()&&(room.data() as Room).members.includes(uid);
}
