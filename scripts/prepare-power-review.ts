import sharp from 'sharp';
import {POWER_PORTRAIT,BRIDGE_RATIO} from '../src/lib/art/card-theme';
const dir='static/art/alternate/powers';
// Pad the generated overlay to exact 56:88 proportions without stretching its engraving.
const source=sharp(`${dir}/frame-v2-source.png`);const meta=await source.metadata();
const height=Math.round(meta.width!*88/56),extra=height-meta.height!;
await source.extend({top:Math.floor(extra/2),bottom:Math.ceil(extra/2),left:0,right:0,background:{r:0,g:0,b:0,alpha:0}}).webp({lossless:true,effort:1}).toFile(`${dir}/frame.webp`);
const {data,info}=await sharp(`${dir}/frame.webp`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const {width:w,height:h}=info,seen=new Uint8Array(w*h),queue:number[]=[];
function add(p:number){if(!seen[p]&&data[p*4+3]<128){seen[p]=1;queue.push(p);}}
for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
for(let i=0;i<queue.length;i++){const p=queue[i],x=p%w;if(x)add(p-1);if(x<w-1)add(p+1);if(p>=w)add(p-w);if(p<w*(h-1))add(p+w);}
for(let p=0;p<w*h;p++){data[p*4]=data[p*4+1]=data[p*4+2]=255;data[p*4+3]=seen[p]?data[p*4+3]:255;}
await sharp(data,{raw:info}).webp({lossless:true}).toFile(`${dir}/surface.webp`);
console.log('Prepared exact 56:88 power-card frame and surface.');
// Screen derivatives match the proposed portrait window; original artwork is retained for print.
const {mkdir}=await import('node:fs/promises');
const {imps,arcana}=await import('../src/lib/data/game');
const {artworkWidths}=await import('../src/lib/art/artwork');
await mkdir(`${dir}/portraits`,{recursive:true});
const portraitAspect=POWER_PORTRAIT.width/(POWER_PORTRAIT.height*BRIDGE_RATIO);
for(const card of [...imps,...arcana]){
 const name=card.kind==='imp'?card.name.toLowerCase():card.id;
 for(const width of artworkWidths)await sharp(`static/art/cards/${name}.webp`).resize(width,Math.round(width/portraitAspect),{fit:'cover',kernel:'lanczos3'}).webp({lossless:true,effort:1}).toFile(`${dir}/portraits/${name}-${width}.webp`);
}
console.log('Prepared 32 portrait sets for the proposed window.');
