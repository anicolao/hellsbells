import sharp from 'sharp';
// Keep the physical back untouched; derive a silhouette for transparent online edges.
const {data,info}=await sharp('static/art/alternate/back-minor.webp').ensureAlpha().raw().toBuffer({resolveWithObject:true});
const {width:w,height:h}=info,exterior=new Uint8Array(w*h),queue:number[]=[];
function add(p:number){if(!exterior[p]&&Math.max(data[p*4],data[p*4+1],data[p*4+2])<32){exterior[p]=1;queue.push(p);}}
for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
for(let i=0;i<queue.length;i++){const p=queue[i],x=p%w;if(x)add(p-1);if(x<w-1)add(p+1);if(p>=w)add(p-w);if(p<w*(h-1))add(p+w);}
for(let p=0;p<w*h;p++){data[p*4]=data[p*4+1]=data[p*4+2]=255;data[p*4+3]=exterior[p]?0:255;}
await sharp(data,{raw:info}).webp({lossless:true}).toFile('static/art/alternate/back-minor-surface.webp');
console.log('Prepared separate card-back edge silhouette.');
