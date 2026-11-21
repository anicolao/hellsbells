import type {GameCard} from '$lib/data/game';
export type Paper='a4'|'letter';
export type CardSize='tall'|'poker';
export const paperSizes={a4:{width:210,height:297,label:'A4'},letter:{width:215.9,height:279.4,label:'US Letter'}} as const;
export const formats={tall:{width:63,height:101,columns:3,rows:2,label:'Tall · 63 × 101 mm'},poker:{width:63,height:88,columns:3,rows:3,label:'Poker · 63 × 88 mm'}} as const;
export const bleed=1,trimBorder=1;
export type PrintCard={card:GameCard;copy:number;x:number;y:number};
export type PrintSheet={format:CardSize;side:'front'|'back';sheet:number;cards:PrintCard[];x:number;y:number;width:number;height:number};
/** Fit the production artwork without stretching it, inside a black trim border. */
export function artworkSize(format:CardSize){const f=formats[format],ratio=992/1586,width=Math.min(f.width-2*trimBorder,(f.height-2*trimBorder)*ratio);return {width,height:width/ratio};}
export function printSheets(cards:GameCard[],format:CardSize,paper:Paper,backOffset={x:0,y:0}):PrintSheet[]{
 const result:PrintSheet[]=[],f=formats[format],p=paperSizes[paper],width=f.columns*f.width,height=f.rows*f.height,x=(p.width-width)/2,y=(p.height-height)/2,capacity=f.columns*f.rows;
 for(let offset=0;offset<cards.length;offset+=capacity){
  const sheet=result.length/2+1,front=cards.slice(offset,offset+capacity).map((card,i)=>({card,copy:1,x:x+i%f.columns*f.width,y:y+Math.floor(i/f.columns)*f.height}));
  result.push({format,side:'front',sheet,cards:front,x,y,width,height});
  result.push({format,side:'back',sheet,cards:front.map(c=>({...c,x:p.width-c.x-f.width+backOffset.x,y:c.y+backOffset.y})),x:x+backOffset.x,y:y+backOffset.y,width,height});
 }
 return result;
}
export function cropMarks(sheet:PrintSheet){
 const f=formats[sheet.format],marks:{x1:number;y1:number;x2:number;y2:number}[]=[],gap=bleed+.5,length=2;
 for(let col=0;col<=f.columns;col++){const x=sheet.x+col*f.width;marks.push({x1:x,x2:x,y1:sheet.y-gap-length,y2:sheet.y-gap},{x1:x,x2:x,y1:sheet.y+sheet.height+gap,y2:sheet.y+sheet.height+gap+length});}
 for(let row=0;row<=f.rows;row++){const y=sheet.y+row*f.height;marks.push({y1:y,y2:y,x1:sheet.x-gap-length,x2:sheet.x-gap},{y1:y,y2:y,x1:sheet.x+sheet.width+gap,x2:sheet.x+sheet.width+gap+length});}
 return marks;
}
