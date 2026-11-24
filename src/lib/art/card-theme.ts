import frameLayouts from './crafted-frame-layouts.json';
import type {Suit} from '$lib/data/game';
export const BRIDGE_WIDTH=56;
export const BRIDGE_HEIGHT=88;
export const BRIDGE_RATIO=BRIDGE_HEIGHT/BRIDGE_WIDTH;
// Portrait bleeds underneath both engraved dividers; screen and print share this window.
export const POWER_PORTRAIT={left:3,top:17.8,width:94,height:39.8} as const;
export const CARD_INDEXES=['A','2','3','4','5','6','7','8','9','10','P','N','Q','K'] as const;
export type CardTheme={material:string;frame:string;paper:string;ink:string};
export const SUIT_THEMES:Record<Suit,CardTheme>={
 Wands:{material:'Red leather',frame:'#971e35',paper:'#3b141e',ink:'#ffe4ce'},
 Cups:{material:'Silver',frame:'#b9c6d0',paper:'#23313a',ink:'#eef4f5'},
 Swords:{material:'Iron',frame:'#626c77',paper:'#20232b',ink:'#e9e9e5'},
 Pentacles:{material:'Gold',frame:'#c69a38',paper:'#34250f',ink:'#ffe7a8'}
};
export const IMP_THEME:CardTheme={material:'Copper',frame:'#b5784f',paper:'#30201c',ink:'#f7e2c6'};
export function suitArtwork(base:string,suit:string){return suit==='Wands'?`${base}/art/cards/suit-wands.webp`:`${base}/art/alternate/suits/suit-${suit.toLowerCase()}.webp`;}
export function craftedFrame(base:string,kind:'playing'|'power',material:string){
 return `${base}/art/alternate/frames/${kind}-${material.toLowerCase().replaceAll(' ','-')}.webp`;
}
export function craftedPowerPortrait(material:string){
 const key=material.toLowerCase().replaceAll(' ','-') as keyof typeof frameLayouts;
 return frameLayouts[key];
}
