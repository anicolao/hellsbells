import {chromium,expect} from '@playwright/test';
import {makePowerScene} from '../src/routes/dev/animations/powers/scenes';
import {replay} from '../src/lib/engine/engine';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE??'/Users/anicolao/Library/Caches/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
const pages=await Promise.all([0,1,2].map(async()=>{const c=await browser.newContext({viewport:{width:1440,height:1000}});return c.newPage();}));
const errors:string[]=[];pages.forEach(p=>p.on('pageerror',e=>errors.push(e.message)));
try{
 const identities=await Promise.all(pages.map(async p=>{await p.goto('http://127.0.0.1:5201/play/');return p.evaluate(async()=>{const path='/src/lib/backend/firebase.ts';const {connectFirebase}=await import(path);const {uid,db}=await connectFirebase();return {uid,project:db.app.options.projectId};});}));
 if(identities.some(i=>i.project!=='demo-hellsbells'))throw Error('Live browser test requires the local demo Firebase project.');
 const demo=makePowerScene(1,3),map=new Map(demo.before.players.map((p,i)=>[p.id,identities[i].uid]));
 const events=demo.history.map(e=>({...e,actor:map.get(e.actor)!,command:{...e.command,...(e.command.target?{target:map.get(e.command.target)}:{})}}));
 const state=replay(events)!,id=crypto.randomUUID().slice(0,8).toUpperCase(),project='demo-hellsbells';
 const value=(v:any):any=>v===null?{nullValue:null}:typeof v==='string'?{stringValue:v}:typeof v==='boolean'?{booleanValue:v}:typeof v==='number'?{integerValue:String(v)}:Array.isArray(v)?{arrayValue:{values:v.map(value)}}:{mapValue:{fields:Object.fromEntries(Object.entries(v).map(([k,x])=>[k,value(x)]))}};
 const prefix=`projects/${project}/databases/(default)/documents/games/${id}`;
 const documents=[{name:prefix,data:{owner:state.owner,members:state.players.map(p=>p.id),bots:[],capacity:3,revision:state.revision,phase:state.phase,version:1}},...events.map(e=>({name:`${prefix}/events/${e.sequence}`,data:e}))];
 const response=await fetch(`http://127.0.0.1:18297/v1/projects/${project}/databases/(default)/documents:commit`,{method:'POST',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:JSON.stringify({writes:documents.map(d=>({update:{name:d.name,fields:value(d.data).mapValue.fields}}))})});if(!response.ok)throw Error(await response.text());
 await Promise.all(pages.map(async p=>{await p.goto(`http://127.0.0.1:5201/play/?game=${id}`);await p.locator('.game-table').waitFor();await expect(p.locator('.game-presentation')).toHaveAttribute('data-presenting','false');await expect(p.locator('.bell-announcement')).toHaveCount(0);}));
 const host=pages[0];await host.getByRole('button',{name:'Use Sticky Fingers',exact:true}).click();
 const given=state.players[0].hand[0];await host.locator(`[data-fan-card="${given}"] button`).evaluate((button:HTMLButtonElement)=>button.click());await host.getByRole('button',{name:'Choose Belial',exact:true}).click();
 await Promise.all(pages.map(p=>expect(p.locator('.bell-announcement')).toBeVisible()));
 await expect(pages[2].locator('.power-fx-card[data-face=back]')).toHaveCount(2);await expect(pages[2].locator('.power-fx-card[data-face=front]')).toHaveCount(0);
 await Promise.all(pages.map(p=>expect(p.locator('.game-presentation')).toHaveAttribute('data-presenting','false',{timeout:7000})));
 await expect(host.locator(`[data-fan-card="${given}"]:not(.ghost)`)).toHaveCount(0);
 // The production table's automatic collection timer must keep advancing
 // while the presenter's animation clock ticks.
 await Promise.all(pages.map(p=>expect(p.locator('.game-table')).toHaveAttribute('data-phase','play',{timeout:8000})));
 // Observe the first paint of a real play, from each seat, before the flight
 // has travelled. The owner's source must be its hand; peers use its imp.
 const candidate=host.locator('.hand-card .card-control:not(.disabled) button').first();
 const cardId=await candidate.evaluate(n=>(n.closest('[data-fan-card]') as HTMLElement).dataset.fanCard!);
 const sources=await Promise.all(pages.map((p,i)=>p.locator(i===0?`[data-fan-card="${cardId}"] .game-card`:`.opponent[data-seat="${identities[0].uid}"] .opponent-portrait .game-card`).boundingBox()));
 const flights=pages.map(p=>p.evaluate(()=>new Promise<{x:number;y:number}>(resolve=>{
  function watch(){const n=document.querySelector('.power-fx-card[data-power-card="play"]');if(n){const r=n.getBoundingClientRect();resolve({x:r.x+r.width/2,y:r.y+r.height/2});}else requestAnimationFrame(watch);}watch();
 })));
 // A hovered spectator card must keep its pose throughout someone else's
 // flight. Capture every animation frame, rather than just its endpoints.
 const observer=pages[2];await observer.locator('.fan-card').last().dispatchEvent('pointerenter');
 await observer.waitForTimeout(250);
 const steadyHand=observer.evaluate(()=>new Promise<{moved:boolean;reflowed:boolean}>(resolve=>{
  const snapshot=()=>[...document.querySelectorAll<HTMLElement>('.fan-card')].map(n=>{const b=n.getBoundingClientRect();return [n.dataset.fanCard,b.x,b.y,b.width,b.height];});
  const before=JSON.stringify(snapshot()),started=performance.now();let moved=false,reflowed=false;
  function sample(){moved ||= JSON.stringify(snapshot())!==before;reflowed ||= !!document.querySelector('.fan-card.reflowing');if(performance.now()-started<1400)requestAnimationFrame(sample);else resolve({moved,reflowed});}sample();
 }));
 await candidate.evaluate((n:HTMLButtonElement)=>n.click());
 const starts=await Promise.all(flights);
 for(let i=0;i<3;i++){const source=sources[i]!;expect(Math.hypot(starts[i].x-source.x-source.width/2,starts[i].y-source.y-source.height/2)).toBeLessThan(25);}
 const stability=await steadyHand;expect(stability.moved).toBe(false);expect(stability.reflowed).toBe(false);
 if(errors.length)throw Error(errors.join('\n'));console.log('Live /play: three independent authenticated seats received a committed Valefor exchange; same presenter, private faces, no historical bell on load, and input resumed.',id);
}finally{await browser.close();}
