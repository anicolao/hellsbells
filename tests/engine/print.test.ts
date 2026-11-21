import {test,expect} from 'bun:test';
import {allCards} from '../../src/lib/data/game';
import {printSheets,formats,paperSizes,artworkSize,cropMarks} from '../../src/lib/print/layout';
for(const paper of ['a4','letter'] as const)for(const format of ['tall','poker'] as const)test(`${paper} ${format}: full set, physical fit and duplex reflection`,()=>{
 const sheets=printSheets(allCards,format,paper),f=formats[format],p=paperSizes[paper];
 expect(sheets.filter(s=>s.side==='front').flatMap(s=>s.cards.map(c=>c.card.id))).toEqual(allCards.map(c=>c.id));
 for(let i=0;i<sheets.length;i+=2){const front=sheets[i],back=sheets[i+1];expect(front.sheet).toBe(back.sheet);
  for(let j=0;j<front.cards.length;j++){const a=front.cards[j],b=back.cards[j];expect(b.card.id).toBe(a.card.id);expect(b.x+a.x+f.width).toBeCloseTo(p.width,8);expect(b.y).toBe(a.y);expect(a.x).toBeGreaterThan(0);expect(a.y+f.height).toBeLessThan(p.height);}
  for(const m of cropMarks(front))for(const [axis,value] of Object.entries(m))expect(value).toBeGreaterThanOrEqual(0);
 }
 const art=artworkSize(format);expect(art.width/art.height).toBeCloseTo(992/1586,8);expect(art.width).toBeLessThan(f.width);expect(art.height).toBeLessThan(f.height);
});
test('partial sheets retain holes and move all back coordinates and guides together',()=>{
 const cards=allCards.slice(0,4),normal=printSheets(cards,'poker','letter'),shifted=printSheets(cards,'poker','letter',{x:-1,y:2});
 expect(shifted[0]).toEqual(normal[0]);for(let i=0;i<4;i++){expect(shifted[1].cards[i].x).toBe(normal[1].cards[i].x-1);expect(shifted[1].cards[i].y).toBe(normal[1].cards[i].y+2);}
 expect(cropMarks(shifted[1])[0].x1).toBe(cropMarks(normal[1])[0].x1-1);
});
