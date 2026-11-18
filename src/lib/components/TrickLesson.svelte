<script lang="ts">
 import GameCard from './GameCard.svelte';
 import {minor} from '$lib/data/game';
 let stage=$state(0);
 const examples=[{cards:[minor[4],minor[9],minor[2],minor[6]],winner:1,title:'Follow the leader.',text:'Wands were led. Everyone has Wands, so everyone follows suit. The 10 is the highest Wand: it wins the trick.'},{cards:[minor[4],minor[9],minor[28],minor[6]],winner:2,title:'A little trump changes everything.',text:'Wands were led; Swords are trump. The third player has no Wands and plays the Ace of Swords. Even the lowest trump beats every non-trump.'},{cards:[minor[4],minor[9],minor[27],minor[6]],winner:1,title:'A big card in the wrong suit loses.',text:'Wands were led; Swords are trump. The third player has no Wands and plays the King of Cups. It is neither led suit nor trump. The 10 of Wands wins.'}];
 let example=$derived(examples[stage]);
</script>
<div class="lesson"><div class="lesson-top"><span class="eyebrow">TRY A TRICK · SWORDS ARE TRUMP</span><div class="segmented" aria-label="Trick examples">{#each ['Follow suit','Trump','Off-suit'] as label,i}<button aria-pressed={stage===i} onclick={()=>stage=i}>{label}</button>{/each}</div></div><div class="trick-cards">{#each example.cards as card,i}<div class:winning={i===example.winner}><span class="seat">{i===0?'1 · LEADS':`${i+1} · FOLLOWS`}</span><GameCard {card}/><span class="result">{i===example.winner?'✦ WINS THE TRICK':' '}</span></div>{/each}</div><div class="lesson-caption" aria-live="polite"><h3>{example.title}</h3><p>{example.text}</p></div></div>
