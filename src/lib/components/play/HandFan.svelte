<script lang="ts">
 import {cards} from '$lib/engine/engine';
 import {fanPose,playStages} from './presentation';
 import CardControl from './CardControl.svelte';
 let {hand,selection=[],reserved=null,disabled=()=>false,onpick,compact=false,previousHand=null,playProgress=1,cardSize=null}:{cardSize?:number|null;previousHand?:string[]|null;playProgress?:number;compact?:boolean;hand:string[];selection?:string[];reserved?:string|null;disabled?:(id:string)=>boolean;onpick:(id:string)=>void}=$props();
 let width=$state(900),height=$state(900),active=$state('');
 const cardWidth=$derived(cardSize??Math.min(compact?130:175,Math.max(80,width*.23),height*(height<600?.13:.19)));
 const shown=$derived(previousHand&&playProgress<1?previousHand:hand);
 const reflow=$derived(playStages(playProgress).reflow);
 const span=$derived(Math.min(width-cardWidth-60,Math.max(0,hand.length-1)*cardWidth*.43));
</script>
<svelte:window bind:innerHeight={height}/>
<div class="hand-fan" bind:clientWidth={width} style:--card-width={`${cardWidth}px`} style:height={`${cardWidth*1.6+52}px`} role="group" aria-label="Your hand">
 {#each shown as id,i (id)}{@const before=fanPose(previousHand?.indexOf(id)??i,previousHand?.length??hand.length,width,cardWidth)}{@const after=fanPose(hand.indexOf(id),hand.length,width,cardWidth)}{@const x=before.x+(after.x-before.x)*reflow}{@const angle=before.angle+(after.angle-before.angle)*reflow}{@const dip=before.dip+(after.dip-before.dip)*reflow}
 <div role="group" aria-label={cards[id].name} class="fan-card hand-card" data-fan-card={id} class:ghost={!hand.includes(id)} aria-hidden={!hand.includes(id)} class:reflowing={!!previousHand&&playProgress<1} class:raised={active===id&&!previousHand} class:reserved={reserved===id} style:left={`calc(50% + ${x}px)`} style:--angle={`${angle}deg`} style:--dip={`${dip}px`} style:z-index={active===id?100:i+1} onpointerenter={()=>active=id} onpointerleave={()=>active=''} onfocusin={()=>active=id} onfocusout={()=>active=''}>
 <CardControl card={cards[id]} selected={selection.includes(id)} drag disabled={!hand.includes(id)||disabled(id)} onpick={()=>onpick(id)}/>
 </div>{/each}
</div>
<style>
.fan-card.ghost{opacity:0;pointer-events:none}.fan-card.reflowing{transition:none}.fan-card.reflowing:focus-within{transform:translateX(-50%) translateY(var(--dip)) rotate(var(--angle))}.hand-fan{position:relative;flex-shrink:0;width:100%;isolation:isolate;overflow:visible}.fan-card{position:absolute;top:35px;width:var(--card-width);margin:0!important;transform:translateX(-50%) translateY(var(--dip)) rotate(var(--angle));transform-origin:50% 100%;transition:transform .18s,filter .18s}.fan-card.raised,.fan-card:focus-within{transform:translateX(-50%) translateY(-35px) rotate(0deg);filter:drop-shadow(0 5px 12px #000a)}.fan-card.reserved{filter:saturate(.4)}.fan-card :global(.card-control.disabled){filter:brightness(.64)}@media(prefers-reduced-motion:reduce){.fan-card{transition:none}}
</style>
