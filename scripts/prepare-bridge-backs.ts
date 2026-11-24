import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
const dir='static/art/alternate/backs';await mkdir(dir,{recursive:true});
for(const name of ['back-minor','back-imp','back-regular','back-catchup']){
 const input=name==='back-minor'?`${dir}/back-minor-source.png`:`static/art/cards/${name}.webp`;
 await sharp(input).resize(1008,1584,{fit:'contain',background:'#080808',kernel:'lanczos3'}).flatten({background:'#080808'}).webp({lossless:true,effort:1}).toFile(`${dir}/${name}.webp`);
 const {data,info}=await sharp(`${dir}/${name}.webp`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {width:w,height:h}=info,seen=new Uint8Array(w*h),queue:number[]=[];
 function add(p:number){if(!seen[p]&&Math.max(data[p*4],data[p*4+1],data[p*4+2])<32){seen[p]=1;queue.push(p);}}
 for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
 for(let i=0;i<queue.length;i++){const p=queue[i],x=p%w;if(x)add(p-1);if(x<w-1)add(p+1);if(p>=w)add(p-w);if(p<w*(h-1))add(p+w);}
 for(let p=0;p<w*h;p++){data[p*4]=data[p*4+1]=data[p*4+2]=255;data[p*4+3]=seen[p]?0:255;}
 await sharp(data,{raw:info}).webp({lossless:true}).toFile(`${dir}/${name}-surface.webp`);
}
console.log('Prepared all four complete bridge backs and transparent-edge masks.');
