import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
import {minor,ranks} from '../src/lib/data/game';
import {artworkWidths} from '../src/lib/art/artwork';
await mkdir('static/art/alternate/courts',{recursive:true});
const aspect=56/(88*.56);
for(const card of minor.filter(c=>c.rank>10)){
 const name=`court-${card.suit.toLowerCase()}-${ranks[card.rank-1].toLowerCase()}`;
 for(const width of artworkWidths)await sharp(`static/art/alternate/courts/full/${name}.webp`).resize(width,Math.round(width/aspect),{fit:'cover',kernel:'lanczos3'}).webp({lossless:true,effort:1}).toFile(`static/art/alternate/courts/${name}-${width}.webp`);
}
console.log('Prepared 16 alternate court portraits at seven sizes, matching each full-bleed bridge-card half.');
