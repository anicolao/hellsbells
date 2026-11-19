<script lang="ts">
 import {cards} from '$lib/engine/engine';
 import GameCard from '../GameCard.svelte';
 let {owner,playerId,hand,exposed}:{owner:string;playerId:string;hand:string[];exposed:string[]}=$props();
 const revealed=$derived(hand.filter(id=>exposed.includes(id)).sort((a,b)=>cards[a].suit.localeCompare(cards[b].suit)||cards[a].rank-cards[b].rank));
 let width=$state(160);
 const size=$derived(Math.min(64,Math.max(30,width*.55)));
 const spacing=$derived(revealed.length>1?Math.min(size*.66,(width-size)/Math.max(1,revealed.length-1)):0);
</script>
{#if revealed.length}
 <div class="revealed-hand" bind:clientWidth={width} style:--reveal-size={`${size}px`} role="group" aria-label={`${owner}’s exposed cards · visible to everyone`} data-revealed-owner={playerId}>
  {#each revealed as id,i (id)}
   <button type="button" class="revealed-card" style:left={`calc(50% + ${(i-(revealed.length-1)/2)*spacing}px)`} style:z-index={i+1} style:transform-origin={`${revealed.length>1?i/(revealed.length-1)*100:50}% top`} aria-label={`${cards[id].name} · exposed in ${owner}’s hand`} title={`${owner} · ${cards[id].name} · visible to everyone`} data-exposed-card={id}>
    <GameCard card={cards[id]}/>
   </button>
  {/each}
 </div>
{/if}
<style>
.revealed-hand{position:relative;width:100%;height:calc(var(--reveal-size)*1.6 + 12px);min-width:0;flex-shrink:0;isolation:isolate}
.revealed-card{appearance:none;border:0;padding:0;background:transparent;color:inherit;cursor:zoom-in;position:absolute;top:5px;width:var(--reveal-size);transform:translateX(-50%);transform-origin:center top;filter:drop-shadow(0 0 3px #e0bc6d80);transition:transform .18s;animation:reveal .65s ease-out;outline:none}
.revealed-card:hover,.revealed-card:focus{z-index:100!important;transform:translateX(-50%) scale(2);filter:drop-shadow(0 4px 10px #000c)}
.revealed-card:focus-visible{outline:2px solid #e0bc6d;outline-offset:3px}
@keyframes reveal{from{opacity:0;transform:translateX(-50%) translateY(-14px) rotateY(90deg)}to{opacity:1;transform:translateX(-50%) translateY(0) rotateY(0)}}
@media(prefers-reduced-motion:reduce){.revealed-card{animation:none;transition:none}}
</style>
