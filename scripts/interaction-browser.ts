import {chromium,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE??'/Users/anicolao/Library/Caches/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
const root=process.env.LAB_URL??'http://127.0.0.1:5201/dev/animations';
async function scene(id:string){await page.goto(`${root}?scenario=${id}`);await page.locator('[data-ready=true]').waitFor();await expect(page.locator('.animation-lab')).toHaveAttribute('data-scenario',id);}
try{
 await mkdir('tmp/qa/interactions',{recursive:true});await scene('magician');
 await expect(page.locator('.round-area button')).toHaveCount(0);
 await page.locator('.round-area .game-card').click();await expect(page.locator('.game-table')).toHaveAttribute('data-phase','magician');
 const card=page.locator('.fan-card button').first();await card.focus();await card.press('Enter');await expect(page.locator('.fan-card .selected')).toHaveCount(1);
 await page.locator('.round-area .game-card').click();await expect(page.locator('.fan-card .selected')).toHaveCount(1);await expect(page.locator('.game-table')).toHaveAttribute('data-phase','magician');
 await page.locator('.decision-pile button').click();await expect(page.locator('.decision-pile')).toHaveCount(0);await expect(page.locator('.game-table')).toHaveAttribute('data-phase','magician');
 await page.screenshot({path:'tmp/qa/interactions/magician.png'});
 await scene('magician-wait');await expect(page.locator('.fan-card button:enabled')).toHaveCount(0);await page.locator('.fan-card').last().hover();await expect(page.locator('.fan-card.raised')).toHaveCount(0);await expect(page.locator('.table-prompt')).toContainText('Belial is resolving The Magician');
 await scene('discard');for(let n=0;n<2;n++){const c=page.locator('.fan-card .card-control:not(.selected) button:enabled').first();await c.focus();await c.press('Enter');}await expect(page.locator('.fan-card .selected')).toHaveCount(2);await page.getByRole('button',{name:'Resolve another player'}).click();await expect(page.locator('.fan-card .selected')).toHaveCount(2);await page.getByRole('button',{name:'Discard selected cards'}).click();await expect(page.locator('.fan-card .selected')).toHaveCount(0);await expect(page.locator('.fan-card button:enabled')).toHaveCount(0);
 await scene('shax');await expect(page.locator('.forced-draw')).toBeVisible();await expect(page.locator('.fan-card button:enabled')).toHaveCount(0);await page.goto(`${root}?scenario=shax&realtime=1`);await page.locator('[data-ready=true]').waitFor();await expect(page.locator('.played-card:not(.forced-draw)')).toHaveCount(1);await expect(page.locator('.forced-draw')).toHaveCount(0);await expect(page.locator('.table-topline')).toContainText('TRICK 1');
 if(errors.length)throw Error(errors.join('\n'));console.log('Round artwork cannot submit or decline a decision; explicit exchange remains functional.');
}catch(error){await page.screenshot({path:'tmp/qa/interactions/failure.png'});throw error;}finally{await browser.close();}
