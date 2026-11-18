import {chromium} from '@playwright/test';
const b=await chromium.launch({headless:true,executablePath:'/Users/anicolao/Library/Caches/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
const p=await b.newPage({viewport:{width:1200,height:1100}});
await p.goto('http://127.0.0.1:5197/gallery');
for(const name of ['Andromalius']){await p.getByRole('button',{name:`Inspect ${name}`,exact:true}).click();await p.locator('dialog').waitFor({state:'visible'});await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:`tmp/qa/${name.replaceAll(' ','-')}.png`});await p.keyboard.press('Escape');}
await p.getByRole('button',{name:'Table essentials',exact:true}).click();await p.emulateMedia({media:'print'});const blank=await p.locator('.print-ledger').innerText();if(blank.includes('—'))throw Error('Ledger contains dashes');console.log('Blank ledger checked');await b.close();
