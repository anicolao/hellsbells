import type {PresentationFrame} from './transitions';
export type Box={x:number;y:number;width:number;height:number;angle?:number};
export type Anchors=Record<string,Box>;
export type Sprite={key:string;card:string;back:boolean;box:Box;angle:number;flip:number};
export const clamp=(n:number)=>Math.max(0,Math.min(1,n));
export const portion=(n:number,a:number,b:number)=>clamp((n-a)/(b-a));
export const ease=(n:number)=>{n=clamp(n);return n*n*(3-2*n);};
export const turnAngle=(t:number)=>t<.5?t*180:(t-1)*180;
export function travel(a:Box,b:Box,t:number,arc=0):Box{const e=ease(t);return {x:a.x+(b.x-a.x)*e,y:a.y+(b.y-a.y)*e-Math.sin(Math.PI*e)*arc,width:a.width+(b.width-a.width)*e,height:a.height+(b.height-a.height)*e};}
export function powerSprites(frame:PresentationFrame,f:number,viewer:string,a:Anchors){
 const m=frame.motion,result:Sprite[]=[];if(!a.centre||f>=1)return result;
 function flight(key:string,card:string|undefined,from:string,to:string,start=0,end=.69,back=false,arc=40,flip=0){if(!card||f<start||f>end||!a[from]||!a[to])return;const t=portion(f,start,end);result.push({key,card,back,box:travel(a[from],a[to],t,arc),angle:(a[from].angle??0)*(1-ease(t))+(a[to].angle??0)*ease(t)+Math.sin(t*Math.PI)*5,flip});}
 if(m.kind==='reveal'){m.revealed.forEach((card,i)=>{const t=portion(f,.08+i*.04,.75),box=a[`trick:${card}`]??a.centre;result.push({key:card,card,back:t<.5,box,angle:0,flip:turnAngle(t)});});return result;}
 if(m.kind==='draw'){
  const base=a['target-seat'];if(base&&f<.34)for(let i=0;i<4;i++){const spread=Math.sin(portion(f,0,.34)*Math.PI);result.push({key:`shuffle-${i}`,card:m.played!,back:true,box:{...base,x:base.x+(i-1.5)*8*spread,y:base.y-8*spread},angle:(i-1.5)*11*spread,flip:0});}
  flight('draw',m.played,'target-seat','trick-slot',.30,.75,m.concealed,55);return result;
 }
 if(m.kind==='replacement'){flight('replacement',m.played,'target-hand','trick-slot',0,.69,m.concealed,50);return result;}
 if(m.kind==='play'){flight('play',m.played,'actor-hand','trick-slot',0,.69,m.concealed,45);return result;}
 switch(m.imp){
 case 0:case 2:flight('play',m.played,'actor-hand','trick-slot',0,.69,false,50);break;
 case 1:{const known=viewer===m.actor||viewer===m.target;
  flight('given',m.given,'actor-hand','centre-left',0,.28,!known,40);flight('given-hold',m.given,'centre-left','centre-left',.28,.40,!known,0);flight('given-away',m.given,'centre-left','given-target',.40,.72,!known,45);
  flight('received',m.received,'target-hand','centre-right',.06,.34,!known,40);flight('received-hold',m.received,'centre-right','centre-right',.34,.44,!known,0);flight('received-home',m.received,'centre-right','received-hand',.44,.76,!known,45);break;}
 case 3:{const t=portion(f,0,.69),turn=portion(t,.15,.68);flight('conceal',m.played,'actor-hand','trick-slot',0,.69,viewer!==m.actor||turn>=.5,45,viewer===m.actor?turnAngle(turn):0);break;}
 case 4:case 7:m.inspected.forEach((card,i)=>{const t=portion(f,.03+i*.04,.42+i*.04),returning=portion(f,.77,1),reveal=portion(t,.3,.75),box=a[`inspection-${i}`],origin=a['target-seat'];if(!box||!origin||f<.03+i*.04)return;result.push({key:card,card,back:viewer!==m.actor||(returning>0?returning>=.5:reveal<.5),box:returning>0?travel(box,origin,returning,20):travel(origin,box,t,35),angle:0,flip:viewer===m.actor?turnAngle(returning>0?returning:reveal):0});});break;
 case 5:flight('return',m.returned,'trick-original','returned-hand',0,.72,m.concealed&&viewer!==m.target,55);break;
 case 9:m.revealed.forEach(card=>{const t=portion(f,.02,.38),landing=portion(f,.53,.78),turn=portion(t,.20,.75),origin=a['target-seat'],to=a['new-public'];if(!origin||!to)return;result.push({key:card,card,back:turn<.5,box:landing>0?travel(a.centre,to,landing,25):travel(origin,a.centre,t,40),angle:0,flip:turnAngle(turn)});});break;
 }
 return result;
}
