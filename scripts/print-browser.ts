import {chromium,webkit,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const engine=process.env.BROWSER??'chromium',browser=engine==='webkit'?await webkit.launch():await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE??'/Users/anicolao/Library/Caches/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors:string[]=[];let stage='setup';page.on('pageerror',e=>errors.push(`${stage}: ${e.message}`));
const root=process.env.PRINT_URL??'http://127.0.0.1:5201/gallery/print/';
async function ready(){await expect(page.getByRole('button',{name:'Print / save PDF',exact:true})).toBeEnabled();}
async function decode(){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));window.dispatchEvent(new Event('beforeprint'));await new Promise(requestAnimationFrame);});}
try{
 await mkdir('tmp/qa/print',{recursive:true});await page.goto(root);await ready();
 await expect(page.getByRole('status')).toHaveText('88 cards · 15 sheets · 30 PDF pages');
 await page.getByLabel('Card size',{exact:true}).selectOption('poker');await expect(page.getByRole('status')).toHaveText('88 cards · 10 sheets · 20 PDF pages');
 const all=await page.locator('.print-sheet[data-side=front] .print-card').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-card-id')));expect(new Set(all).size).toBe(88);
 await page.getByLabel('One-sided — fronts only').check();await expect(page.locator('.print-sheet')).toHaveCount(10);
 await page.getByText('Adjust double-sided alignment',{exact:true}).click();await page.getByLabel('Back horizontal offset (mm)',{exact:true}).fill('-1');await page.getByLabel('Back vertical offset (mm)',{exact:true}).fill('2');
 await page.getByLabel('One-sided — backs only').check();await expect(page.getByLabel('One-sided — fronts only')).not.toBeChecked();await expect(page.locator('.print-sheet')).toHaveCount(10);
 const first=await page.locator('.print-card').first().evaluate(n=>({x:(n as HTMLElement).style.left,y:(n as HTMLElement).style.top}));expect(first).toEqual({x:'135.5mm',y:'18.5mm'});
 await page.getByRole('button',{name:'Reset alignment'}).click();await page.getByLabel('One-sided — backs only').uncheck();
 for(const paper of ['a4','letter'])for(const format of ['tall','poker']){
  stage=`${paper}-${format}`;await page.emulateMedia({media:'screen'});await page.getByLabel('Paper',{exact:true}).selectOption(paper);await page.getByLabel('Card size',{exact:true}).selectOption(format);
  await page.emulateMedia({media:'print'});await decode();
  const geometry=await page.locator('.print-sheet').evaluateAll(sheets=>sheets.map(s=>{const r=s.getBoundingClientRect();return {w:r.width,h:r.height,cards:[...s.querySelectorAll<HTMLElement>('.print-card')].map(c=>{const b=c.getBoundingClientRect();return {id:c.dataset.cardId,x:b.x-r.x,y:b.y-r.y,w:b.width,h:b.height};})};}));
  const mm=96/25.4;for(let i=0;i<geometry.length;i+=2){const a=geometry[i],b=geometry[i+1];expect(a.w/mm).toBeCloseTo(paper==='a4'?210:215.9,1);expect(a.h/mm).toBeCloseTo(paper==='a4'?297:279.4,1);
   for(let c=0;c<a.cards.length;c++){const f=a.cards[c],back=b.cards[c];expect(f.w/mm).toBeCloseTo(63,1);expect(f.h/mm).toBeCloseTo(format==='tall'?101:88,1);expect(f.x+back.x+f.w).toBeCloseTo(a.w,1);expect(f.y).toBeCloseTo(back.y,1);expect(f.id).toBe(back.id);}
  }
  const clipped=await page.locator('.print-sheet .card-copy').evaluateAll(nodes=>nodes.filter(n=>n.scrollHeight>n.clientHeight+1).map(n=>n.closest('[data-card-id]')?.getAttribute('data-card-id')));expect(clipped).toEqual([]);
  expect(await page.locator('.print-sheet[data-side=front] .effect').evaluateAll(nodes=>nodes.every(n=>parseFloat(getComputedStyle(n).fontSize)>=10))).toBe(true);
  if(engine==='chromium'){
  const path=`tmp/qa/print/hellsbells-${paper}-${format}.pdf`;await page.pdf({path,preferCSSPageSize:true,printBackground:true});
  const info=execFileSync(process.env.PDFINFO??'pdfinfo',[path],{encoding:'utf8'});expect(Number(info.match(/Pages:\s+(\d+)/)?.[1])).toBe(format==='tall'?30:20);
  }

 }
 stage='calibration';await page.emulateMedia({media:'screen'});await page.goto(`${root}?calibration`);await ready();await expect(page.locator('.print-sheet')).toHaveCount(1);await expect(page.locator('.sample-label')).toHaveCount(9);await expect(page.locator('filter')).toHaveCount(10);await page.screenshot({path:'tmp/qa/print/calibration.png'});
 await page.goto(`${root}?cards=imp-9,arcana-15,Wands-0`);await ready();await expect(page.getByLabel('Cards',{exact:true})).toHaveValue('filtered');await expect(page.getByRole('status')).toHaveText('3 cards · 1 sheet · 2 PDF pages');
 stage='responsive preview';for(const viewport of [{width:390,height:844},{width:1024,height:1366}]){await page.setViewportSize(viewport);await decode();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`tmp/qa/print/preview-${viewport.width}.png`});}
 stage='lamination print';await page.getByLabel('Colour profile').selectOption('lamination');await page.getByLabel('Lightening strength').fill('30');await expect(page.locator('.artwork.laminated')).toHaveCount(6);
 // Exercise the actual Print action without opening a system dialog.
 await page.evaluate(()=>{(window as any).__printed=false;window.print=()=>{(window as any).__printed=true;};});await page.getByRole('button',{name:'Print / save PDF',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as any).__printed)).toBe(true);await expect(page.getByRole('alert')).toHaveCount(0);
 stage='gallery selection';const gallery=root.replace(/print\/$/,'');await page.goto(`${gallery}?kind=imp`);await expect(page.locator('.collection-count')).toContainText('10 cards');await page.getByRole('link',{name:'Print these cards'}).click();await ready();await expect(page.getByRole('status')).toHaveText('10 cards · 2 sheets · 4 PDF pages');
 if(errors.length)throw Error(errors.join('\n'));console.log('Print-and-play: all 88 cards, four physical PDF layouts, duplex reflection, manual sides, offsets, calibration, gallery selections, mobile preview and Print action passed.');
}finally{await browser.close();}
