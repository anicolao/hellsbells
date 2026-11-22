import {test,expect} from 'bun:test';
import {artworkWidth,artworkPath} from '../../src/lib/art/artwork';
test('artwork candidates cover physical pixels and fall back to originals above the largest size',()=>{
 for(const [css,density,width] of [[58,1,64],[58,2,128],[58,3,192],[117,2,256],[256,2,512],[256.1,2,null],[512,2,null]] as const)expect(artworkWidth(css,density)).toBe(width);
 expect(artworkPath('amdusias',128)).toBe('/art/cards/responsive/amdusias-128.webp');expect(artworkPath('amdusias',null)).toBe('/art/cards/amdusias.webp');
});
