import {describe,test,expect} from 'bun:test';
import {arcana,imps,minor,allCards,roundSetup,penalty} from '../src/lib/data/game';
import {readFileSync,existsSync} from 'node:fs';
describe('complete playable component catalog',()=>{
 test('all 88 distinct cards are represented',()=>{expect(imps).toHaveLength(10);expect(arcana).toHaveLength(22);expect(minor).toHaveLength(56);expect(new Set(allCards.map(c=>c.id)).size).toBe(88);});
 test('all powers match the authoritative rulebook',()=>{const source=readFileSync('HELLS_BELLS_RULES.md','utf8');for(const card of [...imps,...arcana])expect(source).toContain(card.rule);});
 test('all illustrations and frames exist',()=>{for(const imp of imps)expect(existsSync(`static/art/cards/${imp.name.toLowerCase()}.webp`)).toBe(true);for(const card of arcana)expect(existsSync(`static/art/cards/${card.id}.webp`)).toBe(true);for(const suit of ['wands','cups','swords','pentacles']){expect(existsSync(`static/art/cards/suit-${suit}.webp`)).toBe(true);for(const rank of ['page','knight','queen','king'])expect(existsSync(`static/art/cards/court-${suit}-${rank}.webp`)).toBe(true);}for(const id of ['frame','playing-frame','card-back','power-token'])expect(existsSync(`static/art/cards/${id}.webp`)).toBe(true);});
 test('round arithmetic conserves the deck for every player count',()=>{for(const players of [3,4,5])for(const round of [1,2,3,4,5]){const s=roundSetup(players,round);expect(s.dealt*players+s.reserve).toBe(56);expect(s.reserve).toBeGreaterThanOrEqual(players);expect(s.tricks+s.discard).toBe(s.dealt);expect(s.discard).toBe(round);}});
 test('scoring penalizes over- and undershoots equally',()=>{expect(penalty(4,3,5)).toBe(8);expect(penalty(4,5,3)).toBe(8);expect(penalty(5,0,0)).toBe(0);});
});
