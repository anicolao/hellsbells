import {chromium,expect} from '@playwright/test';
import {empressHistory} from '../tests/fixtures/empress';
import {replay} from '../src/lib/engine/engine';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE??'/Users/anicolao/Library/Caches/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
const pages=await Promise.all([0,1,2].map(async()=>{const c=await browser.newContext({viewport:{width:1440,height:1000}});return c.newPage();}));
const errors:string[]=[];pages.forEach(p=>p.on('pageerror',e=>errors.push(e.message)));
try{
 const identities=await Promise.all(pages.map(async p=>{await p.goto('http://127.0.0.1:5201/play/');return p.evaluate(async()=>{const path='/src/lib/backend/firebase.ts';const {connectFirebase}=await import(path);const {uid,db}=await connectFirebase();return {uid,project:db.app.options.projectId};});}));
 if(identities.some(i=>i.project!=='demo-hellsbells'))throw Error('Live browser test requires the local demo Firebase project.');
 for(const raise of [false,true]){
 const history=empressHistory(),demo={before:replay(history)!,history},map=new Map(demo.before.players.map((p,i)=>[p.id,identities[i].uid]));
 const events=demo.history.map(e=>({...e,actor:map.get(e.actor)!,command:{...e.command,...(e.command.target?{target:map.get(e.command.target)}:{})}}));
 const state=replay(events)!,id=crypto.randomUUID().slice(0,8).toUpperCase(),project='demo-hellsbells';
 const value=(v:any):any=>v===null?{nullValue:null}:typeof v==='string'?{stringValue:v}:typeof v==='boolean'?{booleanValue:v}:typeof v==='number'?{integerValue:String(v)}:Array.isArray(v)?{arrayValue:{values:v.map(value)}}:{mapValue:{fields:Object.fromEntries(Object.entries(v).map(([k,x])=>[k,value(x)]))}};
 const prefix=`projects/${project}/databases/(default)/documents/games/${id}`;
 const documents=[{name:prefix,data:{owner:state.owner,members:state.players.map(p=>p.id),bots:[],capacity:3,revision:state.revision,phase:state.phase,version:1}},...events.map(e=>({name:`${prefix}/events/${e.sequence}`,data:e}))];
 const response=await fetch(`http://127.0.0.1:18297/v1/projects/${project}/databases/(default)/documents:commit`,{method:'POST',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:JSON.stringify({writes:documents.map(d=>({update:{name:d.name,fields:value(d.data).mapValue.fields}}))})});if(!response.ok)throw Error(await response.text());
 await Promise.all(pages.map(async p=>{await p.goto(`http://127.0.0.1:5201/play/?game=${id}`);await p.locator('.game-table').waitFor();await expect(p.locator('.game-presentation')).toHaveAttribute('data-presenting','false');await expect(p.locator('.bell-announcement')).toHaveCount(0);}));

 const host=pages[0],bid=state.players[0].bid!;
 await host.getByRole('button',{name:raise?`Adjust bid to ${bid+1}`:`Keep bid at ${bid}`,exact:true}).click();
 await expect(host.getByRole('button',{name:'Pass imp power',exact:true})).toBeVisible();
 await expect(host.locator('.game-table')).toHaveAttribute('data-phase','after');
 await host.getByRole('button',{name:'Use Caught Red-Handed',exact:true}).click();
 await host.getByRole('button',{name:'Choose Belial',exact:true}).click();
 await expect(host.locator('.bell-announcement')).toBeVisible();
 await expect(host.locator(`[data-revealed-owner="${identities[1].uid}"] [data-exposed-card]`)).toHaveCount(1);
 }
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Real Empress first win: keeping or raising the bid preserves Andromalius activation and reveals a card.');
}finally{await browser.close();}
