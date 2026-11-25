import {chromium,expect,type Page} from '@playwright/test';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {readFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE??'/Users/anicolao/Library/Caches/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
const play=process.env.PLAY_URL??'http://127.0.0.1:5201/play/';
const rules=await initializeTestEnvironment({projectId:'demo-hellsbells',firestore:{host:'127.0.0.1',port:18297,rules:await readFile('firestore.rules','utf8')}});
const errors:string[]=[];
async function instrument(page:Page){
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/lib/backend/repository.ts*',async route=>{
  const response=await route.fetch();let source=await response.text();
  const feed='(after, receive, error) => {';
  if(!source.includes(feed)||!source.includes('receive(events, true,'))throw Error('Event-stream instrumentation point changed');
  source=source.replace(feed,'(after, receive, error) => { (window.__streamCursors ??= []).push(after);')
   .replace('receive(events, true,','window.__eventReads = (window.__eventReads ?? 0) + events.length; receive(events, true,');
  const append='export async function append(db, uid, id, state, actor, command) {';
  if(!source.includes(append))throw Error('Append instrumentation point changed');
  source=source.replace(append,append+' if(window.__delayCapacity && command.type === "capacity"){ window.__delayCapacity = false; await new Promise(resolve => setTimeout(resolve, 650)); }');
  await route.fulfill({response,body:source});
 });
}
async function connect(page:Page){await page.goto(play);await expect(page.getByRole('button',{name:'Create a table for friends',exact:true})).toBeEnabled();}
try{
 const ownerContext=await browser.newContext(),owner=await ownerContext.newPage();
 await owner.addInitScript(()=>{const raf=requestAnimationFrame;(window as any).__rafCalls=0;window.requestAnimationFrame=callback=>{(window as any).__rafCalls++;return raf(callback);};});
 await instrument(owner);await connect(owner);
 const game=await owner.evaluate(async()=>{
  const repository=performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname==='/src/lib/backend/repository.ts')?.name??'/src/lib/backend/repository.ts',firebase='/src/lib/backend/firebase.ts';
  const r=await import(repository),{db,uid}=await(await import(firebase)).connectFirebase();
  if(db.app.options.projectId!=='demo-hellsbells')throw Error('Cache tests require emulators');
  const id=await r.createGame(db,uid,'Cache owner',3);
  (window as any).__stopCacheWatch=r.watchGame(db,id,()=>{},(e:Error)=>{throw e;});
  let fresh=await r.refreshGame(db,id,0,1);
  for(let i=0;i<160;i++){const sequence=await r.append(db,uid,id,fresh.state,uid,{type:'capacity',value:i%2?3:4});fresh=await r.refreshGame(db,id,fresh.state.revision,sequence);}
  return {id,revision:fresh.state.revision};
 });
 const key=`demo-hellsbells/(default)/${game.id}`;
 await expect.poll(()=>owner.evaluate(async key=>{const path='/src/lib/backend/event-cache.ts';return(await(await import(path)).cachedCheckpoint(key))?.sequence;},key)).toBe(game.revision);
 expect(await owner.evaluate(()=>(window as any).__eventReads)).toBeLessThanOrEqual(160);
 expect(await owner.evaluate(async key=>{const path='/src/lib/backend/event-cache.ts',{eventCacheName}=await import(path);return new Promise<boolean>((resolve,reject)=>{const request=indexedDB.open(eventCacheName);request.onsuccess=()=>{const db=request.result,read=db.transaction('events').objectStore('events').get([key,2]);read.onsuccess=()=>{resolve(typeof read.result.event.createdAt.seconds==='number');db.close();};read.onerror=()=>reject(read.error);};request.onerror=()=>reject(request.error);});},key)).toBe(true);
 // Simulate a projection upgrade: the archive should repair the head locally.
 await owner.evaluate(async key=>{
  const path='/src/lib/backend/event-cache.ts',{eventCacheName}=await import(path);
  await new Promise<void>((resolve,reject)=>{const request=indexedDB.open(eventCacheName);request.onsuccess=()=>{const db=request.result,tx=db.transaction('heads','readwrite'),store=tx.objectStore('heads'),read=store.get(key);read.onsuccess=()=>store.put({...read.result,projectionVersion:0});tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};request.onerror=()=>reject(request.error);});
 },key);
 await owner.goto(`${play}?game=${game.id}`);await owner.locator('.game-table').waitFor();
 await owner.evaluate(async id=>{const repository=performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname==='/src/lib/backend/repository.ts')?.name??'/src/lib/backend/repository.ts',firebase='/src/lib/backend/firebase.ts';const {db}=await(await import(firebase)).connectFirebase();await(await import(repository)).refreshGame(db,id);},game.id);
 expect(await owner.evaluate(()=>(window as any).__streamCursors)).toEqual([game.revision]);
 expect(await owner.evaluate(()=>(window as any).__eventReads??0)).toBe(0);
 await owner.evaluate(()=>document.fonts.ready);await owner.waitForTimeout(350);const idleFrames=await owner.evaluate(()=>(window as any).__rafCalls);await owner.waitForTimeout(350);
 expect((await owner.evaluate(()=>(window as any).__rafCalls))-idleFrames).toBeLessThanOrEqual(2);
 console.log('Owner reload rebuilt its checkpoint from IndexedDB without downloading historical events; the settled table has no continuous animation clock.');
 const visitor=await browser.newPage();await instrument(visitor);await connect(visitor);
 await visitor.evaluate(async id=>{
  const repository=performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname==='/src/lib/backend/repository.ts')?.name??'/src/lib/backend/repository.ts',firebase='/src/lib/backend/firebase.ts';const {db}=await(await import(firebase)).connectFirebase();const r=await import(repository);
  (window as any).__stopVisitor=r.watchGame(db,id,()=>{},(e:Error)=>{throw e;});await r.refreshGame(db,id);
 },game.id);
 expect(await visitor.evaluate(()=>(window as any).__eventReads)).toBe(game.revision);
 let revision=await owner.evaluate(async id=>{const repository=performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname==='/src/lib/backend/repository.ts')?.name??'/src/lib/backend/repository.ts',firebase='/src/lib/backend/firebase.ts';const r=await import(repository),{db,uid}=await(await import(firebase)).connectFirebase(),fresh=await r.refreshGame(db,id);return r.append(db,uid,id,fresh.state,uid,{type:'capacity',value:5});},game.id);
 await visitor.evaluate(async({id,revision})=>{const repository=performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname==='/src/lib/backend/repository.ts')?.name??'/src/lib/backend/repository.ts',firebase='/src/lib/backend/firebase.ts';const {db}=await(await import(firebase)).connectFirebase();await(await import(repository)).refreshGame(db,id,revision-1,revision);},{id:game.id,revision});
 await expect.poll(()=>visitor.evaluate(async key=>{const path='/src/lib/backend/event-cache.ts';return(await(await import(path)).cachedCheckpoint(key))?.sequence;},key)).toBe(revision);
 await visitor.evaluate(async()=>{
  const firebase='/src/lib/backend/firebase.ts',resource=performance.getEntriesByType('resource').find(e=>e.name.includes('/firebase_firestore.js?'))!;
  const sdk=await import(resource.name),{db}=await(await import(firebase)).connectFirebase();await sdk.disableNetwork(db);
 });
 const beforeReconnect=await visitor.evaluate(()=>(window as any).__eventReads);
 for(let i=0;i<3;i++)revision=await owner.evaluate(async({id,value})=>{const repository=performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname==='/src/lib/backend/repository.ts')?.name??'/src/lib/backend/repository.ts',firebase='/src/lib/backend/firebase.ts';const r=await import(repository),{db,uid}=await(await import(firebase)).connectFirebase(),fresh=await r.refreshGame(db,id);return r.append(db,uid,id,fresh.state,uid,{type:'capacity',value});},{id:game.id,value:i%2?4:3});
 await visitor.evaluate(async({id,revision})=>{
  const firebase='/src/lib/backend/firebase.ts',repository=performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname==='/src/lib/backend/repository.ts')?.name??'/src/lib/backend/repository.ts',resource=performance.getEntriesByType('resource').find(e=>e.name.includes('/firebase_firestore.js?'))!;
  const sdk=await import(resource.name),{db}=await(await import(firebase)).connectFirebase();await sdk.enableNetwork(db);await(await import(repository)).refreshGame(db,id,0,revision);
 },{id:game.id,revision});
 expect((await visitor.evaluate(()=>(window as any).__eventReads))-beforeReconnect).toBe(3);
 await expect.poll(()=>visitor.evaluate(async key=>{const path='/src/lib/backend/event-cache.ts';return(await(await import(path)).cachedCheckpoint(key))?.sequence;},key)).toBe(revision);
 await visitor.evaluate(async key=>{const path='/src/lib/backend/event-cache.ts',cache=await import(path),head=await cache.cachedCheckpoint(key);await cache.cacheCommitted(key,[],{...head.state,revision:head.sequence-1});},key);
 expect(await visitor.evaluate(async key=>{const path='/src/lib/backend/event-cache.ts';return(await(await import(path)).cachedCheckpoint(key))?.sequence;},key)).toBe(revision);
 console.log('Reconnect downloaded exactly three missed events; a lagging cache write could not regress the checkpoint.');
 await visitor.reload();await expect(visitor.getByRole('button',{name:'Create a table for friends',exact:true})).toBeEnabled();
 await visitor.evaluate(async id=>{const repository=performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname==='/src/lib/backend/repository.ts')?.name??'/src/lib/backend/repository.ts',firebase='/src/lib/backend/firebase.ts';const {db}=await(await import(firebase)).connectFirebase();const r=await import(repository);(window as any).__stopVisitor=r.watchGame(db,id,()=>{},(e:Error)=>{throw e;});await r.refreshGame(db,id);},game.id);
 expect(await visitor.evaluate(()=>(window as any).__streamCursors)).toEqual([revision]);expect(await visitor.evaluate(()=>(window as any).__eventReads??0)).toBe(0);
 console.log('An anonymous non-member reads once, follows only new events, and resumes at its saved cursor.');
 const peer=await owner.context().newPage();await instrument(peer);await connect(peer);
 await peer.evaluate(async id=>{const firebase='/src/lib/backend/firebase.ts',repository=performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname==='/src/lib/backend/repository.ts')?.name??'/src/lib/backend/repository.ts';const {db}=await(await import(firebase)).connectFirebase();const r=await import(repository);(window as any).__stopPeer=r.watchGame(db,id,()=>{},(e:Error)=>{throw e;});await r.refreshGame(db,id);},game.id);
 await expect(owner.getByRole('button',{name:'4 seats',exact:true})).toBeEnabled();await owner.evaluate(()=>{(window as any).__delayCapacity=true;});
 await owner.getByRole('button',{name:'4 seats',exact:true}).click();
 await peer.evaluate(async id=>{const firebase='/src/lib/backend/firebase.ts',repository=performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname==='/src/lib/backend/repository.ts')?.name??'/src/lib/backend/repository.ts';const r=await import(repository),{db,uid}=await(await import(firebase)).connectFirebase(),fresh=await r.refreshGame(db,id);if(fresh.state.owner!==uid)throw Error('Peer tab does not share the owner identity');await r.append(db,uid,id,fresh.state,uid,{type:'capacity',value:5});},game.id);
 await expect(owner.getByRole('button',{name:'5 seats',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(owner.getByRole('button',{name:'4 seats',exact:true})).toBeEnabled();await expect(owner.getByRole('alert')).toHaveCount(0);
 await owner.getByRole('button',{name:'4 seats',exact:true}).click();await expect(owner.getByRole('button',{name:'4 seats',exact:true})).toHaveAttribute('aria-pressed','true');
 console.log('A peer update arriving before a stale write fails does not falsely block the already synchronized table.');
 const denied=await browser.newPage();await denied.addInitScript(()=>{
  Storage.prototype.getItem=()=>{throw new DOMException('Storage denied','SecurityError');};Storage.prototype.setItem=()=>{throw new DOMException('Storage denied','SecurityError');};
  Object.defineProperty(window,'indexedDB',{get(){throw new DOMException('Storage denied','SecurityError');}});
 });await instrument(denied);await connect(denied);await denied.getByRole('textbox',{name:'Your name',exact:true}).fill('Memory only');await denied.getByRole('button',{name:'Create a table for friends',exact:true}).click();await denied.locator('.game-table').waitFor();
 console.log('Blocked browser storage falls back to memory without breaking anonymous authentication or play.');
 const quota=await browser.newPage();quota.on('pageerror',e=>errors.push(e.message));let reads=0,failures=0;
 await quota.route('**/documents:batchGet*',async route=>{
  if(new URL(route.request().url()).origin!=='http://127.0.0.1:18297')throw Error('Unexpected production request');
  reads++;
  if(reads===1){await route.continue();return;}
  failures++;await route.fulfill({status:429,contentType:'application/json',body:JSON.stringify({error:{code:429,message:'Quota exceeded.',status:'RESOURCE_EXHAUSTED'}})});
 });
 await connect(quota);await quota.getByRole('textbox',{name:'Your name',exact:true}).fill('Quota test');await quota.getByRole('button',{name:'Practice against computer imps',exact:true}).click();
 await expect(quota.getByRole('alert')).toContainText('quota is exhausted',{timeout:15000});const stopped=reads;await quota.waitForTimeout(2200);
 expect(failures).toBe(1);expect(reads).toBe(stopped);expect(await quota.locator('.game-table').getAttribute('data-phase')).toBe('lobby');
 console.log('A real HTTP 429 pauses bot scheduling after one failed transaction, with no automatic quota retry loop.');
 const entryQuota=await browser.newPage();entryQuota.on('pageerror',e=>errors.push(e.message));
 await entryQuota.route('**/documents:batchGet*',route=>route.fulfill({status:429,contentType:'application/json',body:JSON.stringify({error:{code:429,message:'Quota exceeded.',status:'RESOURCE_EXHAUSTED'}})}));
 await connect(entryQuota);await entryQuota.getByRole('textbox',{name:'Your name',exact:true}).fill('Quota at entry');await entryQuota.getByRole('button',{name:'Create a table for friends',exact:true}).click();
 await expect(entryQuota.getByRole('alert')).toContainText('quota is exhausted');await expect(entryQuota.getByRole('button',{name:'Create a table for friends',exact:true})).toBeDisabled();
 console.log('Quota failure before room creation also leaves the entry controls visibly paused.');
 expect(errors).toEqual([]);
}finally{await browser.close();await rules.cleanup();}
