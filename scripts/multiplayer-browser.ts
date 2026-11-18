import {chromium} from '@playwright/test';
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE??'/Users/anicolao/Library/Caches/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
const root=process.env.PLAY_URL??'http://127.0.0.1:5201/play/';
const contexts=await Promise.all([0,1,2].map(()=>browser.newContext({viewport:{width:1440,height:1100}})));const pages=await Promise.all(contexts.map(c=>c.newPage()));
try{
 for(const p of pages)p.setDefaultTimeout(1500);
 const host=pages[0];await host.goto(root);await host.waitForFunction(()=>!(document.querySelector('[aria-label="Create a table for friends"]') as HTMLButtonElement)?.disabled);await host.getByRole('button',{name:'Create a table for friends'}).click();await host.locator('.game-table').waitFor({timeout:30000});const invite=host.url();
 await Promise.all(pages.slice(1).map(p=>p.goto(invite)));await Promise.all(pages.slice(1).map(p=>p.locator('.game-table').waitFor()));await host.getByRole('button',{name:'Deal the game'}).click();
 for(const p of pages){await p.locator('.draft-cards button').first().waitFor();await p.locator('.draft-cards button').first().click();}
 await Promise.all(pages.map(p=>p.waitForFunction(()=>document.querySelector('.game-table')?.getAttribute('data-phase')!=='draft')));
 for(let i=0;i<100;i++){
  const phase=await host.locator('.game-table').getAttribute('data-phase');
  for(const p of pages){try{if(await p.locator('.table-error').count())throw Error(await p.locator('.table-error').innerText());
   const keep=p.getByRole('button',{name:/Keep hand \/ continue|Decline Balam’s power/});if(await keep.count()&&await keep.isEnabled())await keep.click();
   if(phase==='discard'){const selection=p.locator('.hand-card .card-control:not(.selected):not(.disabled)').first();if(await selection.count()){await selection.hover({position:{x:15,y:80}});await selection.locator('button').click();const discard=p.getByRole('button',{name:'Discard selected cards'});if(await discard.count()&&await discard.isEnabled())await discard.click();}}
   const bid=p.locator('.bid-tray button');if(await bid.count())try{await bid.first().click({timeout:1000});}catch(error){if(!(error instanceof Error)||error.name!=='TimeoutError')throw error;}
   if(phase==='arcana'){const target=p.locator('.opponent-portrait button').first();if(await p.locator('.target-cue').count())await target.click();}
  }catch(error){if(!(error instanceof Error)||error.name!=='TimeoutError')throw error;}
  }
  if(phase==='play'){await host.screenshot({path:'tmp/qa/play/multiplayer.png'});break;}
  await host.waitForTimeout(100);
 }
 if(await host.locator('.game-table').getAttribute('data-phase')!=='play')throw Error('Multiplayer did not reach play');
 const before=await pages[1].locator('.hand-card').count();await pages[1].reload();await pages[1].locator('.hand-card').first().waitFor();if(await pages[1].locator('.hand-card').count()!==before)throw Error('Guest failed to resume');console.log('Three anonymous human seats joined, drafted, discarded, bid, and resumed:',invite);
}catch(e){for(let i=0;i<pages.length;i++){await pages[i].screenshot({path:'tmp/qa/play/multiplayer-failure-'+i+'.png'});console.log('Seat',i,(await pages[i].locator('body').innerText()).slice(-700));}throw e;}finally{await browser.close();}
