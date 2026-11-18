import sharp from 'sharp';
import {readdir} from 'node:fs/promises';
const folder='tmp/qa/illustrated-final';
const files=(await readdir(folder)).filter(f=>/^page-\d+\.png$/.test(f)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
const layers=[];
for(let i=0;i<files.length;i++){layers.push({input:await sharp(folder+'/'+files[i]).resize({width:370}).png().toBuffer(),left:(i%3)*390,top:Math.floor(i/3)*545});}
await sharp({create:{width:1170,height:Math.ceil(files.length/3)*545,channels:3,background:'#bbb'}}).composite(layers).png().toFile(folder+'/contact.png');
console.log(files.length);
