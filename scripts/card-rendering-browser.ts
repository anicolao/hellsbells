import {chromium,webkit,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const engine=process.env.BROWSER??'webkit',browser=engine==='webkit'?await webkit.launch():await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE??'/Users/anicolao/Library/Caches/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
const context=await browser.newContext({viewport:{width:1024,height:1366},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
const root=process.env.LAB_URL??'http://127.0.0.1:5201/dev/animations',label=process.env.RENDER_LABEL??'after';
async function settled(){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.classList.contains('frame')||i.classList.contains('card-back')).map(i=>i.decode()));});}
try{
 await mkdir('tmp/qa/card-rendering',{recursive:true});
 for(const viewport of [{width:1024,height:1366},{width:1366,height:1024}]){
  await page.setViewportSize(viewport);
  for(const scenario of ['hand-wait','win-decision','bell-0','bell-3','collect']){
   await page.goto(`${root}?scenario=${scenario}`);await page.locator('[data-ready=true]').waitFor();await settled();
   const slider=page.getByRole('slider');
   if(await slider.isEnabled())for(const p of ['1','0','1','0','.5']){await slider.fill(p);await page.evaluate(()=>new Promise(requestAnimationFrame));}
   await settled();await page.screenshot({path:`tmp/qa/card-rendering/${label}-${engine}-${viewport.width}-${scenario}.png`});
   if(label!=='before'){
    const cards=await page.locator('.game-card').evaluateAll(nodes=>nodes.map(node=>{const c=getComputedStyle(node);const image=node.querySelector<HTMLImageElement>('.frame,.card-back');return {overflow:c.overflow,width:(node as HTMLElement).offsetWidth,natural:image?.naturalWidth??0};}));
    expect(cards.every(c=>c.overflow==='visible')).toBe(true);
    const filtered=await page.locator('.game-card').evaluateAll(nodes=>nodes.flatMap(card=>{
     const result:string[]=[];for(let n:Element|null=card;n&&!n.classList.contains('game-table');n=n.parentElement)if(!n.classList.contains('game-card')&&!n.classList.contains('reserved')&&getComputedStyle(n).filter!=='none')result.push(n.className);
     return result;
    }));
    expect(filtered).toEqual([]);
    expect(await page.locator('.game-card').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).filter.startsWith('drop-shadow(')))).toBe(true);
    if(scenario==='bell-0'){
     expect(await page.locator('.power-fx-card').evaluateAll(nodes=>nodes.every(n=>new DOMMatrix(getComputedStyle(n).transform).is2D))).toBe(true);
     await expect(page.locator('.effect-cards')).toHaveCSS('perspective','none');
    }

    expect(cards.every(c=>c.natural>=c.width*2)).toBe(true);
    expect(await page.locator('.played-card,.flying-card,.collecting-card').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).willChange==='auto'))).toBe(true);
   }
   if(await slider.isEnabled()){await slider.fill('1');await settled();await page.screenshot({path:`tmp/qa/card-rendering/${label}-${engine}-${viewport.width}-${scenario}-settled.png`});}
  }
 }
 await page.goto(`${root}?scenario=andromalius&players=5`);await page.locator('[data-ready=true]').waitFor();await settled();
 const revealed=page.locator('.opponent .revealed-card').first();
 const baseWidth=await revealed.evaluate(n=>(n as HTMLElement).offsetWidth);
 const handBefore=await page.locator('.hand-fan').boundingBox();
 await revealed.tap();
 await expect.poll(()=>revealed.evaluate(n=>(n as HTMLElement).offsetWidth)).toBeGreaterThanOrEqual(baseWidth*2-1);
 expect(await revealed.evaluate(n=>new DOMMatrix(getComputedStyle(n).transform).a)).toBe(1);
 expect(await page.locator('.hand-fan').boundingBox()).toEqual(handBefore);
 await page.screenshot({path:`tmp/qa/card-rendering/${label}-${engine}-revealed-zoom.png`});
 if(errors.length)throw Error(errors.join('\n'));console.log(`${engine}: Retina iPad portrait/landscape cards captured after repeated scale and flip transitions.`);
}finally{await browser.close();}
