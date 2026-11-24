import sharp from 'sharp';
// Fill the frame's enclosed regions, preserving its exterior alpha contour.
const input='static/art/alternate/index-frame-bridge.webp';
await sharp('static/art/alternate/index-frame-source.png').resize(1008,1584,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({lossless:true}).toFile(input);
const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const {width:w,height:h}=info;
function flood(starts:number[],accept:(p:number)=>boolean){
 const seen=new Uint8Array(w*h),queue:number[]=[];
 function add(p:number){if(!seen[p]&&accept(p)){seen[p]=1;queue.push(p);}}
 for(const p of starts)add(p);
 for(let i=0;i<queue.length;i++){const p=queue[i],x=p%w;if(x)add(p-1);if(x<w-1)add(p+1);if(p>=w)add(p-w);if(p<w*(h-1))add(p+w);}
 return seen;
}
const edges:number[]=[];for(let x=0;x<w;x++)edges.push(x,(h-1)*w+x);for(let y=0;y<h;y++)edges.push(y*w,y*w+w-1);
const exterior=flood(edges,p=>data[p*4+3]<128);
const surface=Buffer.from(data);
for(let p=0;p<w*h;p++){surface[p*4]=surface[p*4+1]=surface[p*4+2]=255;surface[p*4+3]=exterior[p]?data[p*4+3]:255;}
await sharp(surface,{raw:info}).webp({lossless:true}).toFile('static/art/alternate/index-surface.webp');
// The blank index well is a flat paper region, not part of the engraving.
const pocket=flood([200*w+160],p=>data[p*4+3]>240&&Math.min(data[p*4],data[p*4+1],data[p*4+2])>180);
const wells=Buffer.alloc(data.length);
for(let p=0;p<w*h;p++)if(pocket[p]){wells[p*4]=wells[p*4+1]=wells[p*4+2]=255;wells[p*4+3]=data[p*4+3];data[p*4+3]=0;}
await sharp(wells,{raw:info}).webp({lossless:true}).toFile('static/art/alternate/index-wells.webp');
await sharp(data,{raw:info}).webp({lossless:true}).toFile('static/art/alternate/index-frame-open.webp');
console.log('Prepared exterior silhouette and open index wells.');
