<script lang="ts">
 import GameCard from '../GameCard.svelte';
 import {minor} from '$lib/data/game';
 let {playerId,name,won,bid,landed=false}:{playerId:string;name:string;won:number;bid:number|string;landed?:boolean}=$props();
</script>
<div class="trick-stack" class:landed data-player={playerId} data-won={won} role="img" aria-label={`${name}: ${won} of ${bid} tricks`}>
 <div class="stack-edge edge-one"></div><div class="stack-edge edge-two"></div>
 <GameCard card={minor[0]} back/>
 <div class="stack-count" aria-hidden="true"><b>{won}</b><span>of</span><b>{bid}</b></div>
</div>
<style>
.trick-stack{position:relative;width:100%;isolation:isolate;border-radius:2%;box-shadow:0 3px 5px #0008;container-type:inline-size}.stack-edge{position:absolute;inset:0;border:1px solid #aa8c52;border-radius:4%;background:#51221d;z-index:-1}.edge-one{transform:translate(3px,2px) rotate(3deg)}.edge-two{transform:translate(5px,4px) rotate(5deg)}.stack-count{position:absolute;inset:9% 16%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#15120ed9;border:1px solid #cfb16e99;border-radius:4%;color:#ffe5aa;text-shadow:0 2px 3px #000}.stack-count b{font:600 39cqw/.95 'Cormorant Garamond',serif}.stack-count span{font:500 19cqw/1.25 'Cormorant Garamond',serif}.landed{box-shadow:0 0 8px #dfb963}
</style>
