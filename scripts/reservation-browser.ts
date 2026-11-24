import {chromium,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE??'/Users/anicolao/Library/Caches/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),root=process.env.LAB_URL??'http://127.0.0.1:5201/dev/animations';
try{
 await mkdir('tmp/qa/reservation',{recursive:true});
 await page.goto(`${root}?scenario=hermit-held`);await page.locator('[data-ready=true]').waitFor();
 const reserved=page.locator('[data-fan-card="Cups-3"]'),ordinary=page.locator('[data-fan-card="Cups-6"]');
 await expect(reserved.getByRole('button')).toBeDisabled();await expect(ordinary.getByRole('button')).toBeDisabled();
 await expect(reserved.getByRole('button')).toHaveAccessibleName('4 of Cups — reserved for the final trick');
 const darkness=(selector:string)=>page.locator(selector+' .game-card').evaluate(e=>Number(getComputedStyle(e,'::after').backgroundColor.match(/,\s*([\d.]+)\)$/)?.[1]??0));
 expect(await darkness('[data-fan-card="Cups-3"]')).toBeGreaterThan((await darkness('[data-fan-card="Cups-6"]'))+.3);
 await expect(page.locator('[data-fan-card="Pentacles-3"] button')).toBeEnabled();
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
 await page.locator('.hand-fan').screenshot({path:'tmp/qa/reservation/following-pentacles.png'});
 await page.goto(`${root}?scenario=hermit-final`);await page.locator('[data-ready=true]').waitFor();
 await expect(reserved).not.toHaveClass(/reserved/);await expect(reserved.getByRole('button',{name:'4 of Cups',exact:true})).toBeEnabled();
 expect(await darkness('[data-fan-card="Cups-3"]')).toBe(0);
 await reserved.getByRole('button').click();await expect(page.locator('.played-card [data-card-id="Cups-3"]')).toBeVisible();
 console.log('Reserved Cups remain distinctly disabled alongside other off-suit cards, and unlock with normal appearance on the final trick.');
}finally{await browser.close();}
