<script lang="ts">
 import GameCard from '../GameCard.svelte';
 import {cards} from '$lib/engine/engine';
 import {collectFlightPose,collectionLanding,type CardBox} from './presentation';
 let {sources,target,progress}:{sources:{card:string;box:CardBox}[];target:CardBox;progress:number}=$props();
 const centre=$derived({x:sources.reduce((n,s)=>n+s.box.x,0)/sources.length,y:sources.reduce((n,s)=>n+s.box.y,0)/sources.length,width:sources[0].box.width,height:sources[0].box.height,angle:0});
</script>
{#if progress<collectionLanding}{#each sources as source,i}{@const pose=collectFlightPose(source.box,centre,target,i,progress)}<div class="collecting-card" data-collect-card={source.card} aria-hidden="true" style:left={`${pose.x}px`} style:top={`${pose.y}px`} style:width={`${pose.width}px`} style:height={`${pose.height}px`} style:transform={`rotate(${pose.angle}deg) rotateY(${pose.flip}deg)`}><GameCard card={cards[source.card]} back={pose.back}/></div>{/each}{/if}
<style>.collecting-card{position:fixed;z-index:140;pointer-events:none;transform-origin:center;filter:drop-shadow(0 6px 8px #0007)}.collecting-card :global(.game-card){width:100%;height:100%}@media(prefers-reduced-motion:reduce){.collecting-card{filter:none}}</style>
