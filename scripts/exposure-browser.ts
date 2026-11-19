import {chromium,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {fixture} from '../src/routes/dev/animations/scenarios';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE??'/Users/anicolao/Library/Caches/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
const page=await browser.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
const root=process.env.LAB_URL??'http://127.0.0.1:5201/dev/animations';
async function settled(){await page.evaluate(async()=>{await document.fonts.ready;await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);});await page.locator('.revealed-card').evaluateAll(async nodes=>{await Promise.all(nodes.flatMap(n=>n.getAnimations()).map(a=>a.finished.catch(()=>{})));});}
try{
 await mkdir('tmp/qa/exposure',{recursive:true});
 for(const count of [3,4,5])for(let seat=0;seat<count;seat++){
  const s=fixture('andromalius',count);await page.setViewportSize({width:1440,height:1000});await page.goto(`${root}?scenario=andromalius&players=${count}&seat=${seat}`);await page.locator('[data-ready=true]').waitFor();
  for(const p of s.players){const known=p.hand.filter(id=>s.exposed.includes(id)),group=page.locator(`[data-revealed-owner="${p.id}"]`);await expect(group).toHaveCount(known.length?1:0);if(known.length){expect((await group.locator('[data-exposed-card]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-exposed-card')))).sort()).toEqual([...known].sort());expect(await group.evaluate(n=>n.closest('[data-seat]')?.getAttribute('data-seat'))).toBe(p.id);}}
  for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:844,height:390}]){
   await page.setViewportSize(viewport);await settled();
   for(const card of await page.locator('.revealed-card').all()){const r=await card.boundingBox();if(!r||r.x<-.5||r.y<-.5||r.x+r.width>viewport.width+.5||r.y+r.height>viewport.height+.5)throw Error('Exposed card clipped: '+JSON.stringify({count,seat,viewport,r}));}
   if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight))throw Error('Exposure layout scrolls');
   if(seat<2)await page.screenshot({path:`tmp/qa/exposure/${count}-seat${seat}-${viewport.width}.png`});
  }
 }
 await page.setViewportSize({width:1440,height:1000});await page.goto(`${root}?scenario=andromalius&players=3`);await page.locator('[data-ready=true]').waitFor();await page.getByRole('slider',{name:'Animation timeline'}).fill('1');await page.getByRole('button',{name:'Use Caught Red-Handed',exact:true}).click();
 await expect(page.getByRole('button',{name:'Choose Paimon',exact:true})).toBeDisabled();await page.getByRole('button',{name:'Choose Belial',exact:true}).click();await expect(page.locator('[data-revealed-owner="seat-1"] [data-exposed-card]')).toHaveCount(3);await settled();
 const last=page.locator('[data-revealed-owner="seat-1"] .revealed-card').last();await page.mouse.move(0,0);await last.focus();await expect.poll(async()=>last.evaluate(n=>n.getBoundingClientRect().width/(n as HTMLElement).offsetWidth)).toBeGreaterThan(1.8);
 await page.screenshot({path:'tmp/qa/exposure/fresh-reveal-focused.png'});await page.getByRole('button',{name:'Next play',exact:true}).click();const exposedOwn=fixture('andromalius',3).players[0].hand[0];await page.locator(`[data-fan-card="${exposedOwn}"] button`).focus();await page.locator(`[data-fan-card="${exposedOwn}"] button`).press('Enter');await expect(page.locator('[data-revealed-owner="you"] [data-exposed-card]')).toHaveCount(1);if(errors.length)throw Error(errors.join('\n'));console.log('Exposure ownership and visibility agree for all 3–5 player seats at desktop, phone and landscape sizes; fresh reveals, exhausted-target gating and card inspection passed.');
}catch(e){await page.screenshot({path:'tmp/qa/exposure/failure.png'});throw e;}finally{await browser.close();}
