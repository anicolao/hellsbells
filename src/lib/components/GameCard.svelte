<script lang="ts">
 import {base} from '$app/paths';
 import type {GameCard} from '$lib/data/game';
 import './game-card.css';
 import {fitRules} from './fitRules';
 import {cardCopy} from '$lib/data/card-copy';
 import {ranks} from '$lib/data/game';
 let {card,back=false}: {card:GameCard;back?:boolean}=$props();
 let pip=$derived(card.kind==='minor'&&card.rank<=10);
 let suit=$derived('suit' in card?card.suit.toLowerCase():'');
 let portrait=$derived(card.kind==='imp'?card.name.toLowerCase():card.kind==='arcana'?card.id:`court-${suit}-${ranks[(card.kind==='minor'?card.rank:1)-1].toLowerCase()}`);
 let rankLabel=$derived(card.kind==='minor'?(card.rank===1?'A':card.rank<=10?String(card.rank):ranks[card.rank-1]):'');
 let backArt=$derived(card.kind==='minor'?'back-minor':card.kind==='imp'?'back-imp':card.pool==='Catch-up'?'back-catchup':'back-regular');
</script>
<article class="game-card" class:back class:pip data-card-id={card.id} data-suit={'suit' in card?card.suit:undefined} aria-label={back?`${card.kind} card back`:card.name}>
 {#if back}<img class="card-back" src={`${base}/art/cards/${backArt}.webp`} alt="" draggable="false"/>
 {:else}
 <img class="frame" src={`${base}/art/cards/${pip?'playing-frame':'frame'}.webp`} alt="" aria-hidden="true" draggable="false"/>
 {#if pip&&card.kind==='minor'}
 <div class="corner"><b>{rankLabel}</b><img src={`${base}/art/cards/suit-${suit}.webp`} alt=""/></div><div class="corner bottom"><b>{rankLabel}</b><img src={`${base}/art/cards/suit-${suit}.webp`} alt=""/></div>
 <div class="pips" class:ace={card.rank===1} aria-hidden="true">{#each Array(card.rank) as _,i}<img src={`${base}/art/cards/suit-${suit}.webp`} alt="" class:inverted={i>=Math.ceil(card.rank/2)}/>{/each}</div>
 <div class="playing-label">{ranks[card.rank-1]} of {card.suit}</div>
 {:else}
 <img class="illustration" src={`${base}/art/cards/${portrait}.webp`} alt={card.kind==='imp'?`${card.name}, ${card.power}`:card.name} loading="lazy" draggable="false"/>
 <header class="title" class:court-title={card.kind==='minor'} data-fit="title">{#if card.kind==='minor'}<img class="title-suit" src={`${base}/art/cards/suit-${suit}.webp`} alt=""/>{/if}<h3>{card.kind==='minor'?ranks[card.rank-1]+' of '+card.suit:card.name}</h3></header>
 <div class="card-copy" data-fit="rules" use:fitRules={card.id}>
 {#if card.kind==='imp'}<p class="power">{card.power}</p><p class="effect">{cardCopy[card.id]}</p>
 {:else if card.kind==='arcana'}<p class="power">TRUMP · {card.suit}</p><p class="effect"><img class="trump-symbol" src={`${base}/art/cards/suit-${suit}.webp`} alt={`${card.suit} trump`}/>{cardCopy[card.id]}</p>
 {:else}<div class="court-suit"><img src={`${base}/art/cards/suit-${suit}.webp`} alt=""/><p>{ranks[card.rank-1]}</p><span>{card.suit}</span></div>{/if}
 </div>
 <footer>{#if card.kind==='imp'}<span>{card.name==='Andromalius'?'AFTER EVERY WIN':'ONCE PER ROUND'}</span>{:else if card.kind==='arcana'}<span>{card.number} · {card.pool.toUpperCase()}</span>{:else}<span>MINOR ARCANA · RANK {card.rank}</span>{/if}<span>HELL’S BELLS</span></footer>
 {/if}{/if}
</article>

