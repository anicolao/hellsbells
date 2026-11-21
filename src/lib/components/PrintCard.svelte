<script lang="ts">
 import GameCard from './GameCard.svelte';
 import type {GameCard as Card} from '$lib/data/game';
 import {artworkSize,formats,type CardSize} from '$lib/print/layout';
 let {card,format,side,lamination=0,filterId='print-lamination-tones'}:{card:Card;format:CardSize;side:'front'|'back';lamination?:number;filterId?:string}=$props();
 const art=$derived(artworkSize(format));
</script>
<div class="artwork" class:laminated={lamination>0} style:--lamination-filter={`url(#${filterId})`} style:width={`${art.width}mm`} style:height={`${art.height}mm`} style:left={`${(formats[format].width-art.width)/2}mm`} style:top={`${(formats[format].height-art.height)/2}mm`}>
 <GameCard {card} eager back={side==='back'}/>
</div>
<style>
.artwork{position:absolute;break-inside:avoid}.artwork :global(.game-card){width:100%;height:100%;box-shadow:none;--card-dim:0}.laminated :global(img){filter:var(--lamination-filter)}
</style>
