import {chromium,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE??'/Users/anicolao/Library/Caches/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
const url=process.env.LAB_URL??'http://127.0.0.1:5201/dev/animations';
try{
 await mkdir('tmp/qa/powers',{recursive:true});
 await page.addInitScript(()=>{(window as any).__rings=0;const create=AudioContext.prototype.createOscillator;AudioContext.prototype.createOscillator=function(){(window as any).__rings++;return create.call(this);};});
 for(let imp=0;imp<10;imp++){
  await page.goto(`${url}?scenario=bell-${imp}`);await page.locator('[data-ready=true]').waitFor();
  await expect(page.locator('.game-table')).toHaveCount(1);
  const slider=page.getByRole('slider',{name:'Animation timeline'});
  await slider.fill('.08');await expect(page.locator('.bell-announcement')).toBeVisible();
  await slider.fill('.5');await page.screenshot({path:`tmp/qa/powers/production-${imp}.png`});
  if([1,4,7].includes(imp)){await page.getByLabel('View from').selectOption('2');await expect(page.locator('.power-fx-card[data-face=front]')).toHaveCount(0);}
  await slider.fill('1');await expect(page.locator('.bell-announcement,.power-fx-card,.power-result,.effect-caption')).toHaveCount(0);await expect(page.locator('.game-presentation')).toHaveAttribute('data-presenting','false');
 }
 await page.goto(`${url}?scenario=bell-1`);await page.locator('[data-ready=true]').waitFor();await page.getByRole('button',{name:'Play',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as any).__rings)).toBe(8);await page.getByRole('button',{name:'Pause',exact:true}).click();await page.getByRole('slider').fill('.5');expect(await page.evaluate(()=>(window as any).__rings)).toBe(8);
 for(const size of [{width:390,height:844},{width:844,height:390}]){await page.setViewportSize(size);await page.goto(`${url}?scenario=bell-1`);await page.locator('[data-ready=true]').waitFor();await page.getByRole('slider').fill('.5');await page.screenshot({path:`tmp/qa/powers/production-${size.width}.png`});}
 if(errors.length)throw Error(errors.join('\n'));console.log('Production presenter: all ten legal power histories, single table, privacy, scrub endpoints, and mobile layouts passed.');
}finally{await browser.close();}
