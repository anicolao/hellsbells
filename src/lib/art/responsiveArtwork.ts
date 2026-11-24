import {artworkPath,artworkWidth} from './artwork';
/** Select explicitly so shrinking a previously large card also releases the large source. */
export function responsiveArtwork(img:HTMLImageElement,options:{name:string;base:string;fullResolution:boolean;variantDirectory?:string;originalPath?:string}){
 let frame=0,query:MediaQueryList;
 function selectSource(){
  const width=options.fullResolution?null:artworkWidth(img.clientWidth,window.devicePixelRatio||1);
  const src=options.base+(width===null&&options.originalPath?options.originalPath:width!==null&&options.variantDirectory?`${options.variantDirectory}/${options.name}-${width}.webp`:artworkPath(options.name,width));if(img.getAttribute('src')!==src)img.src=src;
 }
 function refresh(){cancelAnimationFrame(frame);frame=requestAnimationFrame(selectSource);}
 function densityChanged(){query?.removeEventListener('change',densityChanged);query=matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);query.addEventListener('change',densityChanged);refresh();}
 const observer=new ResizeObserver(refresh);observer.observe(img);densityChanged();cancelAnimationFrame(frame);selectSource();window.addEventListener('resize',refresh);
 return {update(next:typeof options){options=next;refresh();},destroy(){cancelAnimationFrame(frame);observer.disconnect();query?.removeEventListener('change',densityChanged);window.removeEventListener('resize',refresh);}};
}
