import {describe,test,expect,beforeAll,afterAll,beforeEach} from 'bun:test';
import {initializeTestEnvironment,assertFails,type RulesTestEnvironment} from '@firebase/rules-unit-testing';
import {readFileSync} from 'node:fs';
import {type Firestore,getDoc,getDocs,doc,collection,query,orderBy,updateDoc,deleteDoc,setDoc,serverTimestamp} from 'firebase/firestore';
import {createGame,joinGame,append,refreshGame,watchGame} from '../../src/lib/backend/repository';
import {apply,eventFor,replay} from '../../src/lib/engine/engine';
import type {Event,State} from '../../src/lib/engine/types';
import {nextActor,botCommand} from '../../src/lib/engine/bot';
const suite=process.env.FIRESTORE_EMULATOR_HOST?describe:describe.skip;
suite('Firestore append-only rooms',()=>{
 let env:RulesTestEnvironment;
 beforeAll(async()=>{env=await initializeTestEnvironment({projectId:'demo-hellsbells-rules',firestore:{host:'127.0.0.1',port:18297,rules:readFileSync('firestore.rules','utf8')}});});
 afterAll(async()=>{await env?.cleanup();});beforeEach(async()=>{await env.clearFirestore();});
 // Rules testing returns a compat wrapper; modular SDK unwraps it internally.
 const db=(uid:string)=>env.authenticatedContext(uid).firestore() as unknown as Firestore;
 async function state(uid:string,id:string){const events=await getDocs(query(collection(db(uid),'games',id,'events'),orderBy('sequence')));return replay(events.docs.map(d=>d.data() as Event))!;}
 test('anonymous identities create, join, append and reconstruct the same game',async()=>{const id=await createGame(db('a'),'a','A',3);await joinGame(db('b'),'b',id,'B');await joinGame(db('c'),'c',id,'C');const s=await state('a',id);expect(s.players.map(p=>p.id)).toEqual(['a','b','c']);await append(db('a'),'a',id,s,'a',{type:'start'});expect((await state('b',id)).phase).toBe('draft');expect(await state('a',id)).toEqual(await state('c',id));});
 test('events cannot be updated or deleted and revisions cannot skip',async()=>{const id=await createGame(db('a'),'a','A');await assertFails(updateDoc(doc(db('a'),'games',id,'events','1'),{id:'rewritten'}));await assertFails(deleteDoc(doc(db('a'),'games',id,'events','1')));await assertFails(updateDoc(doc(db('a'),'games',id),{revision:99}));});
 test('launcher creation is idempotent for the authenticated host and cannot steal a table',async()=>{
  const id='AABB0011';await createGame(db('a'),'a','Alex',5,id);await createGame(db('a'),'a','Alex',5,id);
  expect((await state('a',id)).revision).toBe(1);
  await expect(createGame(db('b'),'b','Alex',5,id)).rejects.toThrow('belongs to someone else');
  await joinGame(db('b'),'b',id,'Alex');await joinGame(db('b'),'b',id,'Ignored retry');
  const s=await state('a',id);expect(s.players.map(p=>p.name)).toEqual(['Alex','Alex']);expect(s.revision).toBe(2);expect(s.capacity).toBe(5);
 });
 test('outsiders and unauthenticated clients cannot read logs',async()=>{const id=await createGame(db('a'),'a','A');await assertFails(getDocs(collection(db('outsider'),'games',id,'events')));await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'games',id)));await assertFails(getDocs(collection(db('a'),'games')));});
 test('concurrent joins serialize without losing seats and full table rejects a fourth',async()=>{const id=await createGame(db('a'),'a','A',3);await Promise.all([joinGame(db('b'),'b',id,'B'),joinGame(db('c'),'c',id,'C')]);expect((await state('a',id)).players).toHaveLength(3);await expect(joinGame(db('d'),'d',id,'D')).rejects.toThrow();});
 test('successful writes return their committed revision and conflicts can refresh the canonical log',async()=>{
  const database=db('a'),id=await createGame(database,'a','A',3),old=await state('a',id);
  expect(await append(database,'a',id,old,'a',{type:'capacity',value:4})).toBe(old.revision+1);
  await expect(append(database,'a',id,old,'a',{type:'capacity',value:5})).rejects.toThrow('changed');
  const fresh=await refreshGame(database,id);
  expect(fresh.state.revision).toBe(old.revision+1);expect(fresh.state.capacity).toBe(4);
  expect(replay(fresh.events)).toEqual(fresh.state);
  expect(await append(database,'a',id,fresh.state,'a',{type:'capacity',value:5})).toBe(old.revision+2);
 });
 test('committed watcher revisions never regress through concurrent writes',async()=>{
  const database=db('a'),id=await createGame(database,'a','A',3),revisions:number[]=[];
  let resolveLatest:()=>void=()=>{};const latest=new Promise<void>(resolve=>resolveLatest=resolve);
  let failure:Error|undefined;
  const stop=watchGame(database,id,(s)=>{revisions.push(s.revision);if(s.revision===3)resolveLatest();},e=>{failure=e;resolveLatest();});
  try{await Promise.all([joinGame(db('b'),'b',id,'B'),joinGame(db('c'),'c',id,'C')]);await latest;
   expect(failure).toBeUndefined();expect(revisions.at(-1)).toBe(3);
   expect(revisions).toEqual([...revisions].sort((a,b)=>a-b));
  }finally{stop();}
 });
 test('stale commands cannot overwrite newer moves',async()=>{const id=await createGame(db('a'),'a','A');const s=await state('a',id);await append(db('a'),'a',id,s,'a',{type:'capacity',value:5});await expect(append(db('a'),'a',id,s,'a',{type:'capacity',value:3})).rejects.toThrow('changed');expect((await state('a',id)).capacity).toBe(5);});
 test('simultaneous independent drafts and discards rebase without lost choices',async()=>{
  const id=await createGame(db('a'),'a','A',3);await joinGame(db('b'),'b',id,'B');await joinGame(db('c'),'c',id,'C');let s=await state('a',id);await append(db('a'),'a',id,s,'a',{type:'start'});s=await state('a',id);
  await Promise.all(s.players.map(p=>append(db(p.id),p.id,id,s,p.id,{type:'choose',value:p.options[0]})));
  s=await state('a',id);expect(s.players.every(p=>p.imp>=0)).toBe(true);
  while(s.phase==='magician'){const actor=nextActor(s)!;await append(db(actor),actor,id,s,actor,botCommand(s,actor));s=await state('a',id);}
  const dealt=s.players[0].hand.length;await Promise.all(s.players.map(p=>append(db(p.id),p.id,id,s,p.id,{type:'discard',cards:[p.hand[0]]})));
  s=await state('a',id);expect(s.phase).not.toBe('discard');expect(s.players.every(p=>p.hand.length===dealt-1&&p.discard.length===1)).toBe(true);
 });
 test('simultaneous round readiness persists every seat before the automatic next deal',async()=>{
  const id=await createGame(db('a'),'a','A',3);await joinGame(db('b'),'b',id,'B');await joinGame(db('c'),'c',id,'C');let s=await state('a',id);
  const start={type:'start'} as const;await append(db('a'),'a',id,s,'a',start);s=apply(s,eventFor(s,'a',start));
  for(let n=0;n<300&&s.phase!=='round-end';n++){const actor=nextActor(s)!,command=botCommand(s,actor);await append(db(actor),actor,id,s,actor,command);s=apply(s,eventFor(s,actor,command));}
  expect(s.phase).toBe('round-end');const previous=s.revision;
  await Promise.all(s.players.map(p=>append(db(p.id),p.id,id,s,p.id,{type:'continue',value:1})));
  s=await state('a',id);expect(s.phase).toBe('round-end');expect(s.revision).toBe(previous+3);expect(s.players.every(p=>p.done)).toBe(true);
  await append(db('a'),'a',id,s,'a',{type:'continue'});s=await state('a',id);expect(s.round).toBe(2);expect(s.players.every(p=>!p.done)).toBe(true);
 });
 test('actors cannot impersonate another seat or rewrite room membership',async()=>{const id=await createGame(db('a'),'a','A');await joinGame(db('b'),'b',id,'B');const s=await state('a',id);await expect(append(db('b'),'b',id,s,'a',{type:'capacity',value:5})).rejects.toThrow();await assertFails(updateDoc(doc(db('b'),'games',id),{members:['b'],owner:'b'}));await assertFails(setDoc(doc(db('b'),'games',id,'events','3'),{version:1,sequence:3,actor:'a',id:'forged',command:{type:'capacity',value:5},createdAt:serverTimestamp()}));});
 test('count-trained registrations persist at all supported table sizes',async()=>{for(const count of [3,4,5]){const id=await createGame(db('a'),'a','A',count);let s=await state('a',id);for(let i=1;i<count;i++){await append(db('a'),'a',id,s,'a',{type:'bot',target:`multi-${count}-${i}`,value:3});s=await state('a',id);}expect(s.players.slice(1).every(p=>p.botPolicy==='rl-v3')).toBe(true);await append(db('a'),'a',id,s,'a',{type:'start'});const restored=await state(`multi-${count}-1`,id);expect(restored.capacity).toBe(count);expect(restored.players).toHaveLength(count);}});
 test('league policy version persists alongside the original trained policy',async()=>{const id=await createGame(db('a'),'a','A',3);let s=await state('a',id);await append(db('a'),'a',id,s,'a',{type:'bot',target:'league',name:'League',value:2});s=await state('a',id);await append(db('a'),'a',id,s,'a',{type:'bot',target:'prior',name:'Prior',value:1});s=await state('a',id);expect(s.players.map(p=>p.botPolicy)).toEqual([undefined,'rl-v2','rl-v1']);expect((await state('league',id)).players[1].botPolicy).toBe('rl-v2');await append(db('a'),'a',id,s,'a',{type:'capacity',value:5});expect((await state('a',id)).capacity).toBe(5);});
 test('trained bot choices persist while the lobby size changes',async()=>{const id=await createGame(db('a'),'a','A',3);let s=await state('a',id);await append(db('a'),'a',id,s,'a',{type:'bot',target:'trained',name:'Trained',value:1});s=await state('a',id);expect(s.players[1].botPolicy).toBe('rl-v1');await append(db('a'),'a',id,s,'a',{type:'capacity',value:4});s=await state('a',id);expect(s.capacity).toBe(4);await append(db('a'),'a',id,s,'a',{type:'bot',target:'easy',name:'Easy'});s=await state('a',id);expect(s.players[2].botPolicy).toBe('easy');expect((await state('trained',id)).players[1].botPolicy).toBe('rl-v1');});
 test('only owner controls registered bots',async()=>{const id=await createGame(db('a'),'a','A');let s=await state('a',id);await append(db('a'),'a',id,s,'a',{type:'bot',target:'bot-x',name:'X'});s=await state('a',id);expect(s.players[1].bot).toBe(true);await joinGame(db('b'),'b',id,'B');s=await state('a',id);await append(db('a'),'a',id,s,'a',{type:'start'});s=await state('a',id);await expect(append(db('b'),'b',id,s,'bot-x',{type:'choose',value:s.players[1].options[0]})).rejects.toThrow();await append(db('a'),'a',id,s,'bot-x',{type:'choose',value:s.players[1].options[0]});});
});
