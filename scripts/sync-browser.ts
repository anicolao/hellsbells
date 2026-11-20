import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE??'/Users/anicolao/Library/Caches/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
const safari=process.env.SYNC_SAFARI==='true';
const page=await browser.newPage(safari?{userAgent:'Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Version/26.5 Safari/605.1.15'}:{}),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
try{
 // Delay only delivery of real Firestore snapshots to reproduce a write being
 // acknowledged well before the table's listener catches up.
 await page.route('**/src/lib/backend/repository.ts',async route=>{
  const response=await route.fetch(),source=await response.text();
  if(!source.includes('update(state, events);'))throw Error('Watcher injection point changed');
  await route.fulfill({response,body:source.replace('update(state, events);','setTimeout(() => update(state, events), 1200);')});
 });
 await page.goto(process.env.PLAY_URL??'http://127.0.0.1:5201/play/');
 const demo=await page.evaluate(async()=>{const path='/src/lib/backend/firebase.ts';const {connectFirebase}=await import(path);const {db}=await connectFirebase();return {project:db.app.options.projectId,streams:(db as any)._settings.useFetchStreams};});
 expect(demo.streams).toBe(!safari);
 if(demo.project!=='demo-hellsbells')throw Error('This test requires local Firebase emulators.');
 await page.getByRole('textbox',{name:'Your name'}).fill('Delayed listener');
 await expect(page.getByRole('button',{name:'Practice against computer imps'})).toBeEnabled();
 await page.getByRole('button',{name:'Practice against computer imps'}).click();
 await expect(page.locator('.game-table')).toHaveAttribute('data-phase','draft',{timeout:20000});
 await expect(page.locator('.table-error')).toHaveCount(0);
 await page.locator('.draft-cards button').first().click();
 await expect(page.locator('.game-table')).not.toHaveAttribute('data-phase','draft',{timeout:20000});
 await expect(page.locator('.table-error')).toHaveCount(0);
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Delayed real listener: solo bot seating, start, and draft advance without stale automatic resubmissions.');
}finally{await browser.close();}
