import {chromium,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE??'/Users/anicolao/Library/Caches/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
const lab=process.env.LAB_URL??'http://127.0.0.1:5201/dev/animations',root=lab.replace(/\/dev\/animations\/?$/,'');
try{await mkdir('tmp/qa/menu',{recursive:true});
 for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:844,height:390}]){
  const page=await browser.newPage({viewport}),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${lab}?scenario=hand-wait&players=5`);await page.locator('[data-ready=true]').waitFor();await expect(page.locator('.site-header')).toHaveCount(0);
  const table=await page.locator('.game-table').boundingBox(),logo=await page.getByRole('button',{name:'Open menu',exact:true}).boundingBox();expect(table!.y).toBe(0);expect(logo!.x).toBeGreaterThanOrEqual(0);expect(logo!.y).toBeGreaterThanOrEqual(0);
  const round=await page.locator('.table-topline>span').first().boundingBox();expect(round!.x).toBeGreaterThanOrEqual(logo!.x+logo!.width);
  await page.screenshot({path:`tmp/qa/menu/closed-${viewport.width}.png`});expect(await page.locator('body').innerText()).not.toMatch(/[\p{Extended_Pictographic}\uFE0F♬✓✦]/u);await expect(page.locator('#site-menu')).toBeHidden();await page.getByRole('button',{name:'Open menu',exact:true}).click();await expect(page.locator('#site-menu')).toBeVisible();await expect(page.locator('#site-menu a')).toHaveCount(4);
  await expect(page.locator('.menu-logo')).toHaveAttribute('aria-expanded','true');await page.screenshot({path:`tmp/qa/menu/open-${viewport.width}.png`});
  const nav=await page.locator('#site-menu').boundingBox();expect(nav!.x+nav!.width).toBeLessThanOrEqual(viewport.width);expect(nav!.y+nav!.height).toBeLessThanOrEqual(viewport.height);
  await page.keyboard.press('Escape');await expect(page.locator('#site-menu')).toBeHidden();await expect(page.locator('.menu-logo')).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('#site-menu')).toBeVisible();await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Open menu',exact:true}).click();await page.mouse.click(viewport.width-8,viewport.height-8);await expect(page.locator('#site-menu')).toBeHidden();
  await page.getByRole('button',{name:'Open menu',exact:true}).click();await page.getByRole('link',{name:'The components',exact:true}).click();await expect(page).toHaveURL(new RegExp('/gallery/$'));await expect(page.locator('#site-menu')).toBeHidden();
  expect(await page.locator('body').innerText()).not.toMatch(/[\p{Extended_Pictographic}\uFE0F♬✓✦]/u);
  await page.getByRole('button',{name:'Open menu',exact:true}).click();await page.emulateMedia({media:'print'});await expect(page.locator('.menu-logo')).toBeHidden();await expect(page.locator('#site-menu')).toBeHidden();
  expect(errors).toEqual([]);await page.close();
 }
 console.log('Logo menu: full-height table, unobstructed status, navigation, Escape/focus return, outside dismissal, print hiding, and emoji-free interface passed on desktop, phone, and landscape.');
}finally{await browser.close();}
