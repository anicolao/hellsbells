<script lang="ts">
 import GameCard from './GameCard.svelte';
 import type {PlayingCard} from '$lib/data/game';
 let {cards,winner,title,explanation}:{cards:PlayingCard[];winner:number;title:string;explanation:string}=$props();
</script>
<figure class="static-trick">
 <div class="example-cards">{#each cards as card,i}<div class:trick-winner={i===winner}><span class="example-seat">{i===0?'LEADS':`PLAYER ${i+1}`}</span><GameCard {card}/><b class="example-result">{i===winner?'WINNER':' '}</b></div>{/each}</div>
 <figcaption><strong>{title}</strong> {explanation}</figcaption>
</figure>
