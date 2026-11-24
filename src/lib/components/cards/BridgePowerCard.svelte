<script lang="ts">
 import {SUIT_THEMES,IMP_THEME,suitArtwork,craftedFrame,craftedPowerPortrait} from '$lib/art/card-theme';
 import {base} from '$app/paths';
 import type {ArcanaCard,ImpCard} from '$lib/data/game';
 import type {CardEdge} from '../card-design';
 import {cardCopy} from '$lib/data/card-copy';
 import {responsiveArtwork} from '$lib/art/responsiveArtwork';
 import {fitRules} from '../fitRules';
 let {card,eager=false,fullResolution=false,edge='transparent'}:{card:ArcanaCard|ImpCard;eager?:boolean;fullResolution?:boolean;edge?:CardEdge}=$props();
 const theme=$derived(card.kind==='imp'?IMP_THEME:SUIT_THEMES[card.suit]);
 const imp=$derived(card.kind==='imp');
 const portraitWindow=$derived(craftedPowerPortrait(theme.material));
 const portrait=$derived(card.kind==='imp'?card.name.toLowerCase():card.id);
 const catchup=$derived(card.kind==='arcana'&&card.pool==='Catch-up');
 const frame=$derived(craftedFrame(base,'power',theme.material));
</script>
<article class="game-card bridge-power-card" class:imp class:catchup class:transparent-edge={edge==='transparent'} data-card-id={card.id} aria-label={card.name} style:--portrait-left={`${portraitWindow.left}%`} style:--portrait-top={`${portraitWindow.top}%`} style:--portrait-width={`${portraitWindow.width}%`} style:--portrait-height={`${portraitWindow.height}%`} style:--paper={theme.paper} style:--ink={theme.ink} style:--surface={`url("${frame.replace(/\.webp$/,'-surface.webp')}")`}>
 <div class="paper"></div>
 <picture><source media="print" srcset={`${base}/art/cards/${portrait}.webp`}/><img class="power-portrait" src={`${base}/art/cards/${portrait}.webp`} alt="" loading={eager?'eager':'lazy'} draggable="false" use:responsiveArtwork={{name:portrait,base,fullResolution,variantDirectory:'/art/alternate/powers/portraits'}}/></picture>
 <header class="power-header">
  <h3>{card.name}</h3>
  {#if card.kind==='arcana'}<div class="trump"><img src={suitArtwork(base,card.suit)} alt={`${card.suit} trump`}/></div>{/if}
 </header>
 <div class="power-copy" use:fitRules={card.id}>
  {#if card.kind==='imp'}<p class="ability-name">{card.power}</p>{/if}
  <p class="effect">{cardCopy[card.id]}</p>
 </div>
 <footer class="power-footer">{#if card.kind==='imp'}<span>IMP</span><b>{card.name==='Andromalius'?'AFTER EVERY WIN':'ONCE PER ROUND'}</b>{:else}<b class="pool">{catchup?'CATCH-UP ROUND':'REGULAR ROUND'}</b><span>{card.suit}</span>{/if}</footer>
 <img class="power-engraving" src={frame} alt="" draggable="false"/>
</article>
<style>
.bridge-power-card{aspect-ratio:56/88;background:#080808;border-radius:4%;color:var(--ink);text-align:left}
.paper{position:absolute;inset:0;background:var(--paper);mask-image:var(--surface);mask-size:100% 100%}
.power-portrait{position:absolute;left:var(--portrait-left);top:var(--portrait-top);width:var(--portrait-width);height:var(--portrait-height);object-fit:cover;object-position:center}
.power-header{position:absolute;left:10%;right:10%;top:5.2%;height:10.8%;display:grid;grid-template-columns:minmax(0,1fr) 22cqw;align-items:center;gap:3cqw;z-index:2}
.power-header h3{font:700 7.5cqw/1.08 'Atkinson Hyperlegible',sans-serif;color:var(--ink);text-align:left;margin:0;text-wrap:balance}
.imp .power-header{display:flex;justify-content:center}.imp .power-header h3{font-size:8.7cqw;white-space:nowrap;text-align:center}
.trump{display:flex;align-items:center;justify-content:center}.trump img{width:22cqw;height:17cqw;object-fit:contain}
.power-copy{position:absolute;left:10%;right:10%;top:59%;height:30.2%;display:flex;flex-direction:column;justify-content:center;gap:2cqw;z-index:2}
.ability-name{font-size:6.1cqw;line-height:1.1;font-weight:700;text-transform:uppercase;margin:0;color:var(--ink);white-space:nowrap;letter-spacing:-.02em}
.bridge-power-card .effect{font-size:7cqw;line-height:1.22;margin:0;color:var(--ink)}
.bridge-power-card .power-footer{position:absolute;left:13%;right:13%;top:91.5%;height:4.5%;display:flex;align-items:center;justify-content:space-between;gap:2cqw;font-size:4cqw;line-height:1;color:var(--ink);z-index:2;letter-spacing:0}
.power-footer b{font-size:4.2cqw;white-space:nowrap}.catchup .pool{background:var(--ink);color:var(--paper);padding:1.2cqw 1.5cqw;border-radius:.7cqw}
.power-engraving{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:7}.bridge-power-card::after{z-index:10}
.transparent-edge{background:transparent}.transparent-edge::after{inset:0;mask-image:var(--surface);mask-size:100% 100%}
@media print{.bridge-power-card{filter:none;break-inside:avoid;print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style>
