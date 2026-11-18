<script lang="ts">
 import GameCard from '../GameCard.svelte';
 import type {GameCard as Card} from '$lib/data/game';
 import {flightPose,flightEnd,type CardBox} from './presentation';
 let {card,from,to,progress,back=false}:{card:Card;from:CardBox;to:CardBox;progress:number;back?:boolean}=$props();
 const pose=$derived(flightPose(from,to,progress));
</script>
{#if progress<flightEnd}<div class="flying-card" aria-hidden="true" data-flight-card={card.id} style:left={`${pose.x}px`} style:top={`${pose.y}px`} style:width={`${pose.width}px`} style:height={`${pose.height}px`} style:transform={`rotate(${pose.angle}deg)`}><GameCard {card} {back}/></div>{/if}
<style>.flying-card{position:fixed;z-index:150;pointer-events:none;transform-origin:center;filter:drop-shadow(0 12px 15px #0008);will-change:top,left,width,transform}.flying-card :global(.game-card){width:100%;height:100%}@media(prefers-reduced-motion:reduce){.flying-card{filter:none}}</style>
