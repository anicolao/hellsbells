import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
import {imps,arcana,minor,ranks} from '../src/lib/data/game';
import {artworkWidths,illustrationAspect} from '../src/lib/art/artwork';
const names=[...imps.map(c=>c.name.toLowerCase()),...arcana.map(c=>c.id),...minor.filter(c=>c.rank>10).map(c=>`court-${c.suit.toLowerCase()}-${ranks[c.rank-1].toLowerCase()}`)];
await mkdir('static/art/cards/responsive',{recursive:true});
for(const name of names)for(const width of artworkWidths){
 await sharp(`static/art/cards/${name}.webp`).resize(width,Math.round(width/illustrationAspect),{fit:'cover',kernel:'lanczos3',withoutEnlargement:true}).webp({lossless:true,effort:1}).toFile(`static/art/cards/responsive/${name}-${width}.webp`);
}
console.log(`Prepared ${names.length} illustrations at ${artworkWidths.length} screen sizes; full-resolution originals retained.`);
