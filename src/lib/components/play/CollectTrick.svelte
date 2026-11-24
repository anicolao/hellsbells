<script lang="ts">
 import {useCardDesign,playingCardRatio} from '../card-design';
 const heightRatio=playingCardRatio(useCardDesign());
 import GameCard from '../GameCard.svelte';
 import {cards} from '$lib/engine/engine';
 import {collectFlightPose,collectionLanding,type CardBox} from './presentation';
 let {sources,target,progress}:{sources:{card:string;box:CardBox}[];target:CardBox;progress:number}=$props();
 // Scaling the rendered card avoids reflowing text and swapping image sources during collection.
 const renderWidth=$derived(Math.max(target.width,...sources.map(s=>s.box.width)));
 const renderHeight=$derived(renderWidth*heightRatio);
 const centre=$derived({x:sources.reduce((n,s)=>n+s.box.x,0)/sources.length,y:sources.reduce((n,s)=>n+s.box.y,0)/sources.length,width:sources[0].box.width,height:sources[0].box.height,angle:0});
</script>
{#if progress<collectionLanding}{#each sources as source,i}{@const pose=collectFlightPose(source.box,centre,target,i,progress)}<div class="collecting-card" data-collect-card={source.card} aria-hidden="true" style:width={`${renderWidth}px`} style:height={`${renderHeight}px`} style:transform={`translate3d(${pose.x+pose.width/2}px,${pose.y+pose.height/2}px,0) rotate(${pose.angle}deg) ${pose.flip?`rotateY(${pose.flip}deg)`:''} scale(${pose.width/renderWidth},${pose.height/renderHeight}) translate(-50%,-50%)`}><GameCard card={cards[source.card]} back={pose.back} eager/></div>{/each}{/if}
<style>.collecting-card{position:fixed;left:0;top:0;z-index:140;pointer-events:none;transform-origin:0 0;border-radius:2%;box-shadow:0 6px 8px #0007}.collecting-card :global(.game-card){width:100%;height:100%}@media(prefers-reduced-motion:reduce){.collecting-card{box-shadow:none}}</style>
