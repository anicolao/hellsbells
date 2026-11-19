<script lang="ts">
 import {onMount,tick,untrack} from 'svelte';
 import {base} from '$app/paths';
 import Table from './Table.svelte';
 import GameCard from '../GameCard.svelte';
 import {imps,arcana} from '$lib/data/game';
 import {cards} from '$lib/engine/engine';
 import type {State,Event,Command} from '$lib/engine/types';
 import {PresentationTimeline,bellDuration,bellTime} from './powers/transitions';
 import {powerSprites,portion,travel,type Anchors,type Box} from './powers/motion';
 import {BellAudio} from './powers/bell';
 let {game,events,uid,busy,roomId,send,initial,time=null,playing=true,sound=true,presenting=$bindable(false)}:{game:State;events:Event[];uid:string;busy:boolean;roomId:string;send:(c:Command)=>void;initial?:State;time?:number|null;playing?:boolean;sound?:boolean;presenting?:boolean}=$props();
 let timeline:PresentationTimeline|undefined,root:HTMLDivElement;
 let clock=$state(0),version=$state(0),anchors=$state<Anchors>({}),oldHand=$state<string[]|null>(null);
 const audio=new BellAudio();let previousTime=-1;
 export async function unlockAudio(){await audio.unlock();}
 $effect(()=>{const log=events,latest=game,seed=initial;untrack(()=>{if(!timeline||seed&&timeline.seed!==seed&&time!==null){timeline=new PresentationTimeline(seed??latest);if(seed)timeline.append(log);version++;}else{timeline.append(log,clock);version++;}});});
 const sample=$derived.by(()=>{void version;return timeline?.sample(time??clock)??{game,frame:null,elapsed:0,progress:1,effect:1,busy:false};});
 // Keep the table's state identity stable between event transitions. A ticking
 // presentation clock must not restart the table's automatic phase timers.
 const displayedGame=$derived(sample.game);
 const feedbackActive=$derived(sample.busy);
 const tableBusy=$derived(busy||feedbackActive||time!==null);
 function dispatch(command:Command){if(!sample.busy&&sample.game.revision===game.revision)send(command);}
 const frame=$derived(sample.frame),motion=$derived(frame?.motion);
 const sprites=$derived(frame?powerSprites(frame,sample.effect,uid,anchors):[]);
 const announce=$derived(motion?.bell?Math.min(portion(sample.elapsed,0,120),1-portion(sample.elapsed,700,bellDuration)):0);
 $effect(()=>{presenting=sample.busy;});
 function measure():Anchors{
  if(!root)return {};const r=root.getBoundingClientRect(),w=r.width,h=r.height,cw=Math.min(150,w*.23,h*.3),centre={x:w/2-cw/2,y:h*.45-cw*.6,width:cw,height:cw*1.6};
  function box(selector:string,fallback:Box=centre){const node=root.querySelector<HTMLElement>(selector);if(!node)return fallback;const b=node.getBoundingClientRect();let angle=0,scale=1;for(let el:HTMLElement|null=node;el&&el!==root;el=el.parentElement){const style=getComputedStyle(el),matrix=new DOMMatrix(style.transform);angle+=Math.atan2(matrix.b,matrix.a)*180/Math.PI+(parseFloat(style.rotate)||0);scale*=Math.hypot(matrix.a,matrix.b)*(parseFloat(style.scale)||1);}const width=(node.offsetWidth||b.width)*scale,height=(node.offsetHeight||b.height)*scale;return {x:b.x+(b.width-width)/2-r.x,y:b.y+(b.height-height)/2-r.y,width,height,angle};}
  const a:Anchors={centre,'centre-left':{...centre,x:w/2-cw-12},'centre-right':{...centre,x:w/2+12}};
  for(const p of sample.game.players){a[`seat:${p.id}`]=box(p.id===uid?'.own-imp .imp-portrait .game-card':`.opponent[data-seat="${p.id}"] .game-card`);for(const c of p.hand)a[`hand:${p.id}:${c}`]=p.id===uid?box(`[data-fan-card="${c}"] .game-card`,a[`seat:${p.id}`]):a[`seat:${p.id}`];}
  for(const play of sample.game.phase==='after'?sample.game.lastTrick:sample.game.trick)a[`trick:${play.card}`]=box(`[data-trick-card="${play.card}"] .game-card`);
  for(const c of sample.game.exposed)a[`public:${c}`]=box(`[data-exposed-card="${c}"] .game-card`);
  return a;
 }
 // Capture the existing DOM before the reducer's new state is painted; measure destinations after it.
 let measuredKey='';
 $effect.pre(()=>{const key=frame?.key??'',captureKey=`${uid}:${key}`,revision=sample.game.revision;if(!root)return;untrack(()=>{
  if(captureKey!==measuredKey){anchors=measure();oldHand=[...root.querySelectorAll<HTMLElement>('[data-fan-card]')].map(n=>n.dataset.fanCard!);measuredKey=captureKey;}
  void tick().then(()=>{if(!frame||frame.key!==key)return;const after=measure(),m=frame.motion,source=anchors;const seat=(id:string|undefined)=>source[`seat:${id}`]??after[`seat:${id}`]??after.centre;const hand=(id:string|undefined,c:string|undefined,a:Anchors)=>a[`hand:${id}:${c}`]??seat(id);
   anchors={...source,...after,'actor-seat':seat(m.actor),'target-seat':seat(m.target),'actor-hand':source['actor-hand']??hand(m.actor,m.given??m.played,source),'target-hand':source['target-hand']??hand(m.target,m.received??m.played,source),'received-hand':hand(m.actor,m.received,after),'given-target':hand(m.target,m.given,after),'returned-hand':hand(m.target,m.returned,after),'trick-original':source[`trick:${m.returned}`]??after.centre,'trick-slot':after[`trick:${m.played}`]??after.centre,'new-public':after[`public:${m.revealed[0]}`]??seat(m.target)};
   m.inspected.forEach((_,i)=>anchors[`inspection-${i}`]={...after.centre,x:root.clientWidth/2+(i-(m.inspected.length-1)/2)*(after.centre.width+10)-after.centre.width/2});
  });void revision;
 });});
 $effect(()=>{const now=time??clock;void version;if(!playing||!sound){audio.silence();previousTime=now;return;}if(timeline&&now>=previousTime)for(const f of timeline.frames)if(f.motion.bell&&previousTime<f.start+bellTime&&now>=f.start+bellTime)audio.ring();previousTime=now;});
 $effect(()=>{if(!root)return;const active=frame&&sample.elapsed>=(motion?.bell?bellDuration:0),f=sample.effect;for(const n of root.querySelectorAll('[data-power-hidden]'))n.removeAttribute('data-power-hidden');if(!active||!motion)return;
  const landing=motion.imp===1?.76:motion.imp===5?.72:motion.imp===9?.78:motion.kind==='draw'?.75:.69;
  const hidden=motion.kind==='reveal'?motion.revealed:f<landing?[motion.played,motion.given,motion.received,motion.returned,...motion.revealed].filter(Boolean):[];
  for(const c of hidden)for(const n of root.querySelectorAll(`[data-fan-card="${c}"],[data-trick-card="${c}"],[data-exposed-card="${c}"]`))n.setAttribute('data-power-hidden','');
 });
 onMount(()=>{let raf=0;const start=performance.now();function step(now:number){clock=now-start;raf=requestAnimationFrame(step);}raf=requestAnimationFrame(step);const unlock=()=>void audio.unlock().catch(()=>{});document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);return()=>{cancelAnimationFrame(raf);audio.dispose();document.removeEventListener('pointerdown',unlock);document.removeEventListener('keydown',unlock);};});
</script>
<div class="game-presentation" bind:this={root} data-power={motion?.imp} data-animation={motion?.kind} data-presenting={sample.busy}>
 <Table game={displayedGame} {uid} {roomId} busy={tableBusy} send={dispatch} {feedbackActive} feedbackHand={sample.busy?oldHand:null} feedbackProgress={sample.effect} concealedCards={frame?.mask??[]}/>
 {#if announce>0&&motion}<div class="bell-announcement" style:opacity={announce} role="status"><img src={`${base}/art/cards/power-token.webp`} alt="" style:transform={`rotate(${Math.sin(sample.elapsed/48)*15*Math.exp(-sample.elapsed/420)}deg)`}/><strong>{imps[motion.imp].name}</strong><span>{sample.game.players.find(p=>p.id===motion.actor)?.name}</span></div>{/if}
 <div class="effect-cards" aria-hidden="true">{#each sprites as s (s.key)}<div class="power-fx-card" data-face={s.back?'back':'front'} data-power-card={s.key} style:left={`${s.box.x}px`} style:top={`${s.box.y}px`} style:width={`${s.box.width}px`} style:height={`${s.box.height}px`} style:transform={`rotate(${s.angle}deg) rotateY(${s.flip}deg)`}><GameCard card={cards[s.card]} back={s.back}/></div>{/each}</div>
 {#if motion&&sample.effect>0&&sample.effect<1}
  {#if motion.bell&&(motion.imp===0||motion.imp===2)}<div class="suit-effect" style:opacity={Math.sin(sample.effect*Math.PI)}>{#if motion.imp===0&&frame?.before.led}<img src={`${base}/art/cards/suit-${frame.before.led.toLowerCase()}.webp`} alt={frame.before.led}/><span>→</span>{/if}<div><img src={`${base}/art/cards/suit-${(motion.imp===0?sample.game.led??'Wands':arcana[sample.game.arcana].suit).toLowerCase()}.webp`} alt=""/>{#if motion.imp===2}<i></i>{/if}</div></div>{/if}
  {#if motion.bell&&motion.imp===8&&anchors['actor-seat']&&anchors['target-seat']}{@const b=travel(anchors['actor-seat'],anchors['target-seat'],sample.effect,70)}<img class="lead-flight" src={`${base}/art/cards/leads-indicator.webp`} alt="" style:left={`${b.x}px`} style:top={`${b.y}px`} style:width={`${Math.min(65,b.width)}px`}/>{/if}
  {#if motion.bell&&motion.imp===6&&anchors['target-seat']}{@const b=anchors['target-seat']}<img class="shax-mark" src={`${base}/art/cards/power-token.webp`} alt="" style:left={`${b.x}px`} style:top={`${b.y}px`} style:width={`${b.width}px`} style:opacity={Math.sin(sample.effect*Math.PI)}/>{/if}
 {/if}
</div>
<style>
.game-presentation{position:relative;isolation:isolate}.game-presentation :global([data-power-hidden]){visibility:hidden}.game-presentation[data-presenting='true'] :global(.vision),.game-presentation[data-presenting='true'] :global(.decision-followup),.game-presentation[data-presenting='true'] :global(.power-cue){visibility:hidden}.bell-announcement{position:absolute;inset:0;z-index:260;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;background:radial-gradient(ellipse,#080d0bc9,transparent 70%);color:#ffe4a6;text-shadow:0 2px 8px #000}.bell-announcement img{width:clamp(100px,19vw,200px);transform-origin:50% 14%;filter:drop-shadow(0 0 20px #d9ad6755)}.bell-announcement strong{font:600 clamp(2rem,5vw,3.8rem)/1.1 'Cormorant Garamond',serif}.bell-announcement span{font-size:1rem;color:#e5c78a}.effect-cards{position:absolute;inset:0;z-index:180;pointer-events:none;perspective:1000px}.power-fx-card{position:absolute;filter:drop-shadow(0 8px 12px #0009);transform-origin:center}.power-fx-card :global(.game-card){width:100%;height:100%}.suit-effect{position:absolute;left:50%;top:35%;transform:translateX(-50%);display:flex;align-items:center;gap:22px;z-index:190;pointer-events:none;color:#edc578}.suit-effect img{width:60px;height:70px;object-fit:contain;filter:drop-shadow(0 2px 7px #000)}.suit-effect>div{position:relative}.suit-effect i{position:absolute;left:-15%;top:48%;width:130%;height:5px;background:#cd7055;transform:rotate(-35deg)}.lead-flight,.shax-mark{position:absolute;z-index:190;pointer-events:none}.shax-mark{filter:drop-shadow(0 0 18px #edc578)}
</style>
