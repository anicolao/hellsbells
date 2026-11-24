<script lang="ts">
 import {useCardDesign,playingCardRatio} from '../card-design';
 const design=useCardDesign();
 import GameCard from '../GameCard.svelte';
 import type {GameCard as Card} from '$lib/data/game';
 import {flightPose,flightEnd,type CardBox} from './presentation';
 let {card,from,to,progress,back=false}:{card:Card;from:CardBox;to:CardBox;progress:number;back?:boolean}=$props();
 const origin=$derived(design==='indexed'&&card.kind==='minor'?{...from,height:from.width*playingCardRatio(design)}:from);
 const pose=$derived(flightPose(origin,to,progress));
 // Keep layout and artwork resolution fixed; only the motion transform changes per frame.
 const renderWidth=$derived(Math.max(origin.width,to.width));
 const renderHeight=$derived(renderWidth*to.height/to.width);
</script>
{#if progress<flightEnd}<div class="flying-card" aria-hidden="true" data-flight-card={card.id} style:width={`${renderWidth}px`} style:height={`${renderHeight}px`} style:transform={`translate3d(${pose.x+pose.width/2}px,${pose.y+pose.height/2}px,0) rotate(${pose.angle}deg) scale(${pose.width/renderWidth},${pose.height/renderHeight}) translate(-50%,-50%)`}><GameCard {card} {back} eager/></div>{/if}
<style>.flying-card{position:fixed;left:0;top:0;z-index:150;pointer-events:none;transform-origin:0 0;border-radius:2%;box-shadow:0 12px 15px #0008}.flying-card :global(.game-card){width:100%;height:100%}@media(prefers-reduced-motion:reduce){.flying-card{box-shadow:none}}</style>
