import {describe,test,expect,beforeAll,afterAll,beforeEach} from 'bun:test';
import {initializeTestEnvironment,assertFails,type RulesTestEnvironment} from '@firebase/rules-unit-testing';
import {readFileSync} from 'node:fs';
import {type Firestore,getDoc,getDocs,doc,collection,query,orderBy,updateDoc,deleteDoc,setDoc,serverTimestamp} from 'firebase/firestore';
import {createGame,joinGame,append} from '../../src/lib/backend/repository';
import {replay} from '../../src/lib/engine/engine';
import type {Event,State} from '../../src/lib/engine/types';
const suite=process.env.FIRESTORE_EMULATOR_HOST?describe:describe.skip;
suite('Firestore append-only rooms',()=>{
 let env:RulesTestEnvironment;
 beforeAll(async()=>{env=await initializeTestEnvironment({projectId:'demo-hellsbells',firestore:{host:'127.0.0.1',port:18297,rules:readFileSync('firestore.rules','utf8')}});});
 afterAll(async()=>{await env?.cleanup();});beforeEach(async()=>{await env.clearFirestore();});
 // Rules testing returns a compat wrapper; modular SDK unwraps it internally.
 const db=(uid:string)=>env.authenticatedContext(uid).firestore() as unknown as Firestore;
 async function state(uid:string,id:string){const events=await getDocs(query(collection(db(uid),'games',id,'events'),orderBy('sequence')));return replay(events.docs.map(d=>d.data() as Event))!;}
 test('anonymous identities create, join, append and reconstruct the same game',async()=>{const id=await createGame(db('a'),'a','A',3);await joinGame(db('b'),'b',id,'B');await joinGame(db('c'),'c',id,'C');const s=await state('a',id);expect(s.players.map(p=>p.id)).toEqual(['a','b','c']);await append(db('a'),'a',id,s,'a',{type:'start'});expect((await state('b',id)).phase).toBe('draft');expect(await state('a',id)).toEqual(await state('c',id));});
 test('events cannot be updated or deleted and revisions cannot skip',async()=>{const id=await createGame(db('a'),'a','A');await assertFails(updateDoc(doc(db('a'),'games',id,'events','1'),{id:'rewritten'}));await assertFails(deleteDoc(doc(db('a'),'games',id,'events','1')));await assertFails(updateDoc(doc(db('a'),'games',id),{revision:99}));});
 test('outsiders and unauthenticated clients cannot read logs',async()=>{const id=await createGame(db('a'),'a','A');await assertFails(getDocs(collection(db('outsider'),'games',id,'events')));await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'games',id)));await assertFails(getDocs(collection(db('a'),'games')));});
 test('concurrent joins serialize without losing seats and full table rejects a fourth',async()=>{const id=await createGame(db('a'),'a','A',3);await Promise.all([joinGame(db('b'),'b',id,'B'),joinGame(db('c'),'c',id,'C')]);expect((await state('a',id)).players).toHaveLength(3);await expect(joinGame(db('d'),'d',id,'D')).rejects.toThrow();});
 test('stale commands cannot overwrite newer moves',async()=>{const id=await createGame(db('a'),'a','A');const s=await state('a',id);await append(db('a'),'a',id,s,'a',{type:'capacity',value:5});await expect(append(db('a'),'a',id,s,'a',{type:'capacity',value:3})).rejects.toThrow('changed');expect((await state('a',id)).capacity).toBe(5);});
 test('actors cannot impersonate another seat or rewrite room membership',async()=>{const id=await createGame(db('a'),'a','A');await joinGame(db('b'),'b',id,'B');const s=await state('a',id);await expect(append(db('b'),'b',id,s,'a',{type:'capacity',value:5})).rejects.toThrow();await assertFails(updateDoc(doc(db('b'),'games',id),{members:['b'],owner:'b'}));await assertFails(setDoc(doc(db('b'),'games',id,'events','3'),{version:1,sequence:3,actor:'a',id:'forged',command:{type:'capacity',value:5},createdAt:serverTimestamp()}));});
 test('only owner controls registered bots',async()=>{const id=await createGame(db('a'),'a','A');let s=await state('a',id);await append(db('a'),'a',id,s,'a',{type:'bot',target:'bot-x',name:'X'});s=await state('a',id);expect(s.players[1].bot).toBe(true);await joinGame(db('b'),'b',id,'B');s=await state('a',id);await append(db('a'),'a',id,s,'a',{type:'start'});s=await state('a',id);await expect(append(db('b'),'b',id,s,'bot-x',{type:'choose',value:s.players[1].options[0]})).rejects.toThrow();await append(db('a'),'a',id,s,'bot-x',{type:'choose',value:s.players[1].options[0]});});
});
