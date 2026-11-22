<script lang="ts">
 import {base} from '$app/paths';
 let {name,dealer=false,leader=false,show=true,reserve=false}:{name:string;dealer?:boolean;leader?:boolean;show?:boolean;reserve?:boolean}=$props();
</script>
{#if show&&(dealer||leader||reserve)}<div class="seat-markers" class:both={dealer&&leader}>
 {#if dealer}<img class="dealer-marker" src={`${base}/art/cards/dealer-button.webp`} alt={`${name} is the dealer`} title={`${name} deals this round`} data-marker="dealer"/>{/if}
 {#if leader}<img class="leader-marker" src={`${base}/art/cards/leads-indicator.webp`} alt={`${name} leads this trick`} title={`${name} leads this trick`} data-marker="leader"/>{/if}
</div>{/if}
<style>
.seat-markers{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;width:100%;min-height:0;flex-shrink:0;pointer-events:none}.seat-markers img{display:block;width:100%;height:auto;max-width:100%;object-fit:contain}
</style>
