import sharp from 'sharp';
import {readFile,mkdir,copyFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
// Generated colour and shading are preserved verbatim. Only uniform fitting,
// exact opposing halves and a filled exterior silhouette are derived here.
const dir='static/art/alternate/frames';
const manifest=process.argv[2];
if(!manifest)throw new Error('Usage: bun scripts/prepare-crafted-frames.ts <generation-manifest.json>');
const parsed=JSON.parse(await readFile(manifest,'utf8'));
const jobs=Array.isArray(parsed)?parsed:parsed.jobs;
await mkdir(dir,{recursive:true});
const layouts:Record<string,{left:number;top:number;width:number;height:number}>={};
for(const job of jobs){
 const name=`${job.kind}-${job.material}`;
 if(resolve(job.source)!==resolve(`${dir}/${name}-source.png`))await copyFile(job.source,`${dir}/${name}-source.png`);
 const w=1008,h=1584;
 let {data,info}=await sharp(job.source).resize(w,h,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(job.kind==='playing'){
  for(let y=0;y<h/2;y++)for(let x=0;x<w;x++){
   const a=(y*w+x)*4,b=((h-1-y)*w+(w-1-x))*4;
   for(let c=0;c<4;c++)data[b+c]=data[a+c];
  }
 }
 await sharp(data,{raw:info}).webp({lossless:true,effort:3}).toFile(`${dir}/${name}.webp`);
 if(job.kind==='playing'){
  const wells=Buffer.alloc(data.length),seen=new Uint8Array(w*h),queue:number[]=[];
  function add(p:number){if(!seen[p]&&data[p*4+3]<128){seen[p]=1;queue.push(p);}}
  add(Math.round(h*.15)*w+Math.round(w*.16));
  add(Math.round(h*.85)*w+Math.round(w*.84));
  for(let i=0;i<queue.length;i++){const p=queue[i],x=p%w;if(x)add(p-1);if(x<w-1)add(p+1);if(p>=w)add(p-w);if(p<w*(h-1))add(p+w);}
  if(queue.length>w*h*.25)throw new Error(`${name}: index opening leaks into the artwork; inspect frame`);
  for(const p of queue){wells[p*4]=wells[p*4+1]=wells[p*4+2]=wells[p*4+3]=255;}
  await sharp(wells,{raw:info}).webp({lossless:true,effort:1}).toFile(`${dir}/${name}-wells.webp`);
 }
 if(job.kind==='power'){
  // Read the actual generated divider positions so the painting bleeds below
  // the frame rather than exposing a paper gap when ornament varies slightly.
  function divider(nominal:number){
   const rows:number[]=[];
   for(let y=Math.round((nominal-.03)*h);y<(nominal+.03)*h;y++){
    let sum=0,count=0;for(let x=Math.round(w*.3);x<w*.7;x++){sum+=data[(y*w+x)*4+3];count++;}
    if(sum/count>220)rows.push(y);
   }
   if(!rows.length)throw new Error(`${name}: no clear divider near ${nominal}`);
   return (rows[0]+rows[rows.length-1])/2/h*100;
  }
  const top=divider(.178),bottom=divider(.576);
  layouts[job.material]={left:3,top,width:94,height:bottom-top};
 }
 // The filled silhouette follows each generated frame's outer contour.
 // Scanlines tolerate tiny breaks in a fine engraving's perimeter.
 for(let y=0;y<h;y++){
  let left=w,right=-1;
  for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>=128){left=Math.min(left,x);right=x;}
  for(let x=0;x<w;x++){
   const p=(y*w+x)*4;data[p]=data[p+1]=data[p+2]=255;
   if(x>=left&&x<=right)data[p+3]=255;
  }
 }
 await sharp(data,{raw:info}).webp({lossless:true,effort:1}).toFile(`${dir}/${name}-surface.webp`);
 console.log(`${name}: imported illustrated RGBA frame`);
}
await writeFile(`${dir}/PROMPTS.json`,JSON.stringify({tool:'image_gen.imagegen',jobs:jobs.map((j:any)=>({...j,generatedSource:j.generatedSource??j.source,source:`${dir}/${j.kind}-${j.material}-source.png`}))},null,2)+'\n');
await writeFile('src/lib/art/crafted-frame-layouts.json',JSON.stringify(layouts,null,2)+'\n');
