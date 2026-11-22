import {chromium,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE??'/Users/anicolao/Library/Caches/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
const root=process.env.PLAY_URL??'http://127.0.0.1:5201/play/';
const pages=await Promise.all([0,1,2].map(()=>browser.newPage({viewport:{width:1180,height:820}})));
pages.forEach(p=>p.setDefaultTimeout(15000));
const [host,guest,early]=pages,errors:string[]=[];pages.forEach(p=>p.on('pageerror',e=>errors.push(e.message)));
try{
 await mkdir('tmp/qa/join',{recursive:true});
 console.log('Fresh room');await host.goto(root);await host.getByRole('textbox',{name:'Your name'}).fill('Alex');await host.getByRole('button',{name:'Create a table for friends'}).click();await host.locator('.game-table').waitFor();const invite=host.url();
 console.log('Fresh invitation');await guest.goto(invite);await expect(guest.getByRole('textbox',{name:'Your name'})).toHaveValue('');await expect(guest.locator('.game-table')).toHaveCount(0);
 await guest.getByRole('textbox',{name:'Your name'}).fill('Andrew');await guest.getByText('Take this seat',{exact:true}).click();await guest.locator('.game-table').waitFor();
 expect(await guest.evaluate(()=>localStorage.getItem('hellsbells:name'))).toBe('Andrew');await guest.reload();await guest.locator('.game-table').waitFor();await expect(host.locator('.game-table')).toContainText('Andrew');
 await host.goto(root);await host.getByRole('button',{name:'Create a table for friends'}).click();await host.locator('.game-table').waitFor();await guest.goto(host.url());await guest.locator('.game-table').waitFor();await expect(host.locator('.game-table')).toContainText('Andrew');
 console.log('Gameroom launch');const table=crypto.randomUUID().slice(0,8).toUpperCase(),launch=(mode:string,name:string)=>`${root}?table=${table}&launch=${mode}&name=${encodeURIComponent(name)}`;
 await early.goto(launch('join','Alex'));await expect(early.getByRole('status')).toContainText('Waiting for your host');
 await host.goto(launch('create','Alex'));await host.locator('.game-table').waitFor();await early.locator('.game-table').waitFor();await expect(host.getByRole('button',{name:'5 seats',exact:true})).toHaveAttribute('aria-pressed','true');
 await guest.goto(launch('join','Sam'));await guest.locator('.game-table').waitFor();expect(await guest.evaluate(()=>localStorage.getItem('hellsbells:name'))).toBe('Sam');
 await host.reload();await host.locator('.game-table').waitFor();await guest.reload();await guest.locator('.game-table').waitFor();
 await host.screenshot({path:'tmp/qa/join/launcher-lobby.png'});
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Fresh link requires a name; manual join saves it; saved identity joins new rooms; launch supports early guests, duplicate names, five seats and idempotent reloads.');
}catch(e){await Promise.all(pages.map((p,i)=>p.screenshot({path:`tmp/qa/join/failure-${i}.png`}).catch(()=>{})));console.log(await Promise.all(pages.map(p=>p.locator('body').innerText())));throw e;}finally{await browser.close();}
