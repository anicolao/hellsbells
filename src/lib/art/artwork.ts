export const artworkWidths=[64,96,128,192,256,384,512] as const;
export const illustrationAspect=.84/(.37*1586/992);
export function artworkWidth(cssWidth:number,density:number){return artworkWidths.find(width=>width>=Math.ceil(cssWidth*density))??null;}
export function artworkPath(name:string,width:number|null){return width===null?`/art/cards/${name}.webp`:`/art/cards/responsive/${name}-${width}.webp`;}
