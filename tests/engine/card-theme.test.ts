import {test,expect} from 'bun:test';
import {SUIT_THEMES,IMP_THEME,CARD_INDEXES,BRIDGE_RATIO} from '../../src/lib/art/card-theme';
function luminance(hex:string){const rgb=hex.slice(1).match(/../g)!.map(h=>parseInt(h,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
for(const [name,theme] of Object.entries({...SUIT_THEMES,Imps:IMP_THEME}))test(`${name} index and rules text exceeds 7:1 contrast on its paper`,()=>{
 const a=luminance(theme.ink),b=luminance(theme.paper);expect((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toBeGreaterThan(7);
});
test('shared bridge geometry and court indexes',()=>{expect(BRIDGE_RATIO).toBe(88/56);expect(CARD_INDEXES).toEqual(['A','2','3','4','5','6','7','8','9','10','P','N','Q','K']);});
