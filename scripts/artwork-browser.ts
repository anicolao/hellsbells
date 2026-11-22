import {chromium,expect} from '@playwright/test';
import {artworkWidth,artworkPath} from '../src/lib/art/artwork';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE??'/Users/anicolao/Library/Caches/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
const root=process.env.LAB_URL?.replace(/\/dev\/animations\/?$/,'')??'http://127.0.0.1:5201';
try{
 for(const density of [1,2,3]){
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:density});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${root}/dev/rendering/`);await page.locator('.comparisons').waitFor();
  for(const width of [70,140,280,70]){
   await page.getByLabel('Card width').fill(String(width));
   for(const index of [2,3]){const img=page.locator('.illustration').nth(index);const expected=artworkWidth(Math.floor(width*.84),density);await expect.poll(()=>img.evaluate((n:HTMLImageElement)=>n.currentSrc)).toContain(artworkPath('amdusias',expected));await img.evaluate((n:HTMLImageElement)=>n.decode());}
   for(const index of [0,1])await expect.poll(()=>page.locator('.illustration').nth(index).evaluate((n:HTMLImageElement)=>n.currentSrc)).toMatch(/\/amdusias.webp$/);
  }
  await page.emulateMedia({media:'print'});for(const img of await page.locator('.illustration').all()){await expect.poll(()=>img.evaluate((n:HTMLImageElement)=>n.currentSrc)).toMatch(/\/amdusias.webp$/);await img.evaluate((n:HTMLImageElement)=>n.decode());}
  await page.emulateMedia({media:'screen'});await expect.poll(()=>page.locator('.illustration').nth(2).evaluate((n:HTMLImageElement)=>n.currentSrc)).toContain('/responsive/');
  await page.goto(`${root}/dev/animations?scenario=hand-wait&players=5`);await page.locator('[data-ready=true]').waitFor();for(const img of await page.locator('.opponent-portrait .illustration').all()){await expect.poll(()=>img.evaluate((n:HTMLImageElement)=>n.currentSrc)).toContain('/responsive/');await img.evaluate((n:HTMLImageElement)=>n.decode());}
  await page.goto(`${root}/gallery/print/?cards=imp-0`);await expect(page.getByRole('button',{name:'Print / save PDF',exact:true})).toBeEnabled();await expect(page.getByLabel('Cards',{exact:true})).toHaveValue('filtered');await expect(page.locator('.print-sheet .illustration')).toHaveCount(1);for(const img of await page.locator('.illustration').all())await expect.poll(()=>img.evaluate((n:HTMLImageElement)=>n.currentSrc)).toMatch(/\/amdusias.webp$/);
  expect(errors).toEqual([]);await page.close();
 }
 console.log('Responsive production artwork selects density-aware sizes, switches down after shrink, preserves rotation parity, and uses originals in print and print previews at 1x/2x/3x.');
}finally{await browser.close();}
