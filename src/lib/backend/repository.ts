import {getDoc,getDocs,doc,collection,query,orderBy,onSnapshot,runTransaction,serverTimestamp,type Firestore} from 'firebase/firestore';
import {apply,eventFor,replay} from '$lib/engine/engine';
import type {State,Event,Command} from '$lib/engine/types';
export type Room={owner:string;members:string[];bots:string[];capacity:number;revision:number;phase:string;version:1};
export const gamePath=(id:string)=>`games/${id}`;
function metadata(s:State):Room{return {owner:s.owner,members:s.players.map(p=>p.id),bots:s.players.filter(p=>p.bot).map(p=>p.id),capacity:s.capacity,revision:s.revision,phase:s.phase,version:1};}
export async function createGame(db:Firestore,uid:string,name:string,capacity=4,id=crypto.randomUUID().slice(0,8).toUpperCase()){if(!/^[A-F0-9]{8}$/.test(id))throw Error('Invalid table code');const event=eventFor(undefined,uid,{type:'create',seed:crypto.randomUUID(),capacity,name},crypto.randomUUID());const state=apply(undefined,event);await runTransaction(db,async tx=>{const room=doc(db,gamePath(id));const existing=await tx.get(room);if(existing.exists()){if(existing.data().owner===uid)return;throw Error('This table already belongs to someone else. Launch a new table.');}tx.set(room,metadata(state));tx.set(doc(room,'events','1'),{...event,createdAt:serverTimestamp()});});return id;}
export async function joinGame(db:Firestore,uid:string,id:string,name:string){
 const room=doc(db,gamePath(id));
 for(let attempt=0;attempt<5;attempt++){
  let revision=0;
  try{await runTransaction(db,async tx=>{const snapshot=await tx.get(room);if(!snapshot.exists())throw Error('That table was not found');const old=snapshot.data() as Room;revision=old.revision;if(old.members.includes(uid))return;if(old.phase!=='lobby'||old.members.length>=old.capacity)throw Error('That table has already filled');const event:Event={version:1,sequence:old.revision+1,actor:uid,id:crypto.randomUUID(),command:{type:'join',name}};tx.update(room,{members:[...old.members,uid],revision:event.sequence});tx.set(doc(room,'events',String(event.sequence)),{...event,createdAt:serverTimestamp()});});return;}
  catch(error){const code=(error as {code?:string}).code;if(!['permission-denied','aborted'].includes(code??'')||attempt===4)throw error;const latest=await getDoc(room);if(!latest.exists()||latest.data().revision===revision)throw error;}
 }
}
export function watchGame(db:Firestore,id:string,update:(state:State)=>void,error:(error:Error)=>void){return onSnapshot(query(collection(db,gamePath(id),'events'),orderBy('sequence')),{includeMetadataChanges:true},snapshot=>{try{const events=snapshot.docs.map(d=>d.data() as Event);const state=replay(events);if(state)update(state);}catch(e){error(e as Error);}},error);}
export async function append(db:Firestore,uid:string,id:string,state:State,actor:string,command:Command){
 if(actor!==uid&&!(state.owner===uid&&state.players.some(p=>p.id===actor&&p.bot)))throw Error('This is another player’s seat');
 const room=doc(db,gamePath(id)),commandId=crypto.randomUUID();
 const independent=command.type==='choose'||command.type==='discard'||command.type==='bid'&&state.arcana===18||command.type==='adjust'&&state.phase==='adjust'||command.type==='continue'&&command.value===1&&state.phase==='round-end';
 let current=state;
 for(let attempt=0;attempt<8;attempt++){
  const event=eventFor(current,actor,command,commandId),next=apply(current,event);
  try{await runTransaction(db,async tx=>{const snapshot=await tx.get(room);if(!snapshot.exists()||snapshot.data().revision!==current.revision)throw Error('The table changed. Try your move again.');tx.set(doc(room,'events',String(event.sequence)),{...event,createdAt:serverTimestamp()});tx.update(room,metadata(next));});return;}
  catch(error){
   const code=(error as {code?:string}).code;
   const race=(error as Error).message.includes('The table changed')||['permission-denied','aborted'].includes(code??'');
   if(!independent||!race||attempt===7)throw error;
   const latest=await getDoc(room);if(!latest.exists()||latest.data().revision===current.revision)throw error;
   const snapshot=await getDocs(query(collection(room,'events'),orderBy('sequence')));
   const events=snapshot.docs.map(d=>d.data() as Event);
   if(events.some(e=>e.id===commandId))return;
   const fresh=replay(events);
   if(!fresh||fresh.round!==state.round||fresh.phase!==state.phase)throw error;
   current=fresh;
  }
 }
}

/** A guest arriving before the host waits without creating or claiming the table. */
export function waitForGame(db:Firestore,id:string,ready:()=>void,error:(error:Error)=>void){
 return onSnapshot(doc(db,gamePath(id)),snapshot=>{if(snapshot.exists())ready();},error);
}
export async function hasSeat(db:Firestore,uid:string,id:string){const room=await getDoc(doc(db,gamePath(id)));return room.exists()&&(room.data() as Room).members.includes(uid);}
