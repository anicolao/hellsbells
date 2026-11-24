<script lang="ts">
 import {SUIT_THEMES,CARD_INDEXES,suitArtwork,craftedFrame} from '$lib/art/card-theme';
 import type {CardEdge} from '../card-design';
 import {responsiveArtwork} from '$lib/art/responsiveArtwork';
 import {base} from '$app/paths';
 import {ranks,type PlayingCard} from '$lib/data/game';
 let {card,indexStyle='traditional',edge='transparent',eager=false,fullResolution=false}:{card:PlayingCard;indexStyle?:'numeric'|'traditional';edge?:CardEdge;eager?:boolean;fullResolution?:boolean}=$props();
 const theme=$derived(SUIT_THEMES[card.suit]);
 const court=$derived(card.rank>10),suit=$derived(card.suit.toLowerCase());
 const index=$derived(indexStyle==='numeric'?String(card.rank):CARD_INDEXES[card.rank-1]);
 const suitArt=$derived(suitArtwork(base,card.suit));
 const frame=$derived(craftedFrame(base,'playing',theme.material));
 const portraitName=$derived(`court-${suit}-${ranks[card.rank-1].toLowerCase()}`);
 const portrait=$derived(`${base}/art/alternate/courts/full/${portraitName}.webp`);
</script>
<article class="game-card indexed-card" class:court class:transparent-edge={edge==='transparent'} data-card-id={card.id} data-suit={card.suit} aria-label={card.name} style:--paper={theme.paper} style:--ink={theme.ink} style:--surface={`url("${frame.replace(/\.webp$/,'-surface.webp')}")`}>
 {#if !court}<div class="card-paper" aria-hidden="true"></div>{/if}
 {#if court}
  <div class="court-painting" aria-hidden="true">
   {#each [false,true] as inverted}
    <picture class="art-end" class:inverted><source media="print" srcset={portrait}/><img class="court-art" use:responsiveArtwork={{name:portraitName,base,fullResolution,variantDirectory:'/art/alternate/courts',originalPath:`/art/alternate/courts/full/${portraitName}.webp`}} loading={eager?'eager':'lazy'} src={portrait} alt="" draggable="false"/></picture>
   {/each}
  </div>
 {/if}
 {#each [false,true] as inverted}
  <div class="card-end" class:inverted aria-hidden="true">
   {#if !court}
    <div class="pip-field" class:single={card.rank<4}>
     {#each Array(Math.floor(card.rank/2)) as _}<img class="symbol" src={suitArt} alt="" draggable="false"/>{/each}
    </div>
   {/if}
   <div class="well-fill" style:mask-image={`url("${frame.replace(/\.webp$/,'-wells.webp')}")`}></div>
   <img class="engraving" src={frame} alt="" draggable="false"/>
   <div class="index"><b class:wide={index.length>1}>{index}</b><img class="symbol" src={suitArt} alt="" draggable="false"/></div>
   <header><strong>{court?ranks[card.rank-1]:card.suit}</strong><span>{court?card.suit:''}</span></header>
  </div>
 {/each}
 {#if !court && card.rank%2===1}
  <div class="central-pip" class:ace={card.rank===1} aria-hidden="true"><img class="symbol" src={suitArt} alt="" draggable="false"/></div>
 {/if}
</article>
<style>
.indexed-card{position:relative;isolation:isolate;width:100%;aspect-ratio:56/88;container-type:inline-size;background:#080808;box-sizing:border-box;border-radius:4%;color:var(--ink);font-family:'Atkinson Hyperlegible',sans-serif;font-variant-numeric:tabular-nums;filter:drop-shadow(0 4px 7px #20130638)}
.card-end{isolation:isolate;position:absolute;inset:0 0 50%;overflow:hidden;border-radius:4% 4% 0 0}.card-end.inverted{inset:50% 0 0;transform:rotate(180deg)}
.card-paper{position:absolute;inset:0;background:var(--paper);mask-image:var(--surface);mask-size:100% 100%;mask-repeat:no-repeat}
.engraving,.well-fill{position:absolute;inset:0;width:100%;height:200%;pointer-events:none}.well-fill{background:var(--paper);mask-size:100% 100%;mask-repeat:no-repeat;z-index:1}
.engraving{z-index:7}
.index{position:absolute;z-index:4;left:4.8%;top:9%;width:23%;height:54%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2cqw}.index b{font-size:23cqw;font-weight:700;line-height:.9;letter-spacing:-.055em;white-space:nowrap}.index b.wide{font-size:21cqw;letter-spacing:-.08em}.symbol{display:block;object-fit:contain;flex-shrink:0}.index .symbol{width:19cqw;height:19cqw}
header{position:absolute;z-index:3;left:34%;top:12%;width:58%;min-height:20%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.5cqw;padding:2cqw 0;text-align:center;text-transform:uppercase;background:var(--paper);border-radius:1cqw}header strong{font-size:7.3cqw;line-height:1;font-weight:700;letter-spacing:-.035em}header span{font-size:4.5cqw;line-height:1.15;letter-spacing:.04em}header span:empty{display:none}
.court header{top:auto;bottom:3%;min-height:18%}
.court-painting{position:absolute;inset:0;mask-image:var(--surface);mask-size:100% 100%;mask-repeat:no-repeat;background:var(--paper)}
.art-end{position:absolute;inset:0 0 auto;height:56%;clip-path:polygon(0 0,100% 0,100% 78.5714%,0 100%)}.art-end.inverted{top:auto;bottom:0;transform:rotate(180deg)}
.court-art{display:block;width:100%;height:100%;object-fit:cover;object-position:center}
.pip-field{position:absolute;left:34%;top:40%;width:54%;height:49%;display:grid;grid-template-columns:repeat(2,1fr);grid-auto-rows:minmax(0,1fr);gap:2cqw 4cqw;align-items:center;justify-items:center}.pip-field .symbol{width:100%;height:100%;min-height:0}.pip-field .symbol:last-child:nth-child(odd){grid-column:1/-1;width:44%}.pip-field.single{left:41%;width:40%;top:40%;height:45%}.pip-field.single .symbol{width:100%}
.central-pip{position:absolute;z-index:3;left:42%;top:50%;width:16%;aspect-ratio:1;transform:translateY(-50%);display:flex;align-items:center;justify-content:center;border-radius:50%;background:transparent}.central-pip .symbol{width:80%;height:80%}.central-pip.ace{left:31%;width:38%}
/* One dimming overlay above both frame stacks; transformed halves must shade equally. */
.indexed-card::after{z-index:10}
.indexed-card.transparent-edge{background:transparent}.indexed-card.transparent-edge::after{inset:0;mask-image:var(--surface);mask-size:100% 100%;mask-repeat:no-repeat}
@media print{.indexed-card{filter:none;break-inside:avoid;print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style>
