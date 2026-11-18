<script lang="ts">
 import GameCard from '../GameCard.svelte';
 import type {GameCard as Card} from '$lib/data/game';
 let {card,back=false,selected=false,disabled=false,label=card.name,onpick,drag=false}:{card:Card;back?:boolean;selected?:boolean;disabled?:boolean;label?:string;onpick?:()=>void;drag?:boolean}=$props();
</script>
<div role="group" class="card-control" class:selected class:disabled draggable={drag&&!disabled} ondragstart={e=>{e.dataTransfer?.setData('text/plain',card.id);}}><GameCard {card} {back}/><button aria-label={label} aria-pressed={selected} {disabled} onclick={onpick}></button></div>
<style>.card-control{position:relative;width:100%;transition:transform .18s,filter .18s;touch-action:manipulation}.card-control>button{position:absolute;inset:0;width:100%;height:100%;background:transparent;border:0;border-radius:10px}.card-control.selected{transform:translateY(-18px);filter:drop-shadow(0 0 5px #edc772)}.card-control:focus-within{z-index:10;transform:translateY(-20px)}.card-control.disabled{filter:brightness(.7)}.card-control>button:disabled{cursor:default}.card-control[draggable=true]{cursor:grab}@media(prefers-reduced-motion:reduce){.card-control{transition:none}}</style>
