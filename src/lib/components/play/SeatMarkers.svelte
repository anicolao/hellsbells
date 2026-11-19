<script lang="ts">
 import {base} from '$app/paths';
 let {name,dealer=false,leader=false,show=true,reserve=false}:{name:string;dealer?:boolean;leader?:boolean;show?:boolean;reserve?:boolean}=$props();
</script>
{#if show&&(dealer||leader||reserve)}<div class="seat-markers" class:both={dealer&&leader}>
 {#if dealer}<img class="dealer-marker" src={`${base}/art/cards/dealer-button.webp`} alt={`${name} is the dealer`} title={`${name} deals this round`} data-marker="dealer"/>{/if}
 {#if leader}<img class="leader-marker" src={`${base}/art/cards/leads-indicator.webp`} alt={`${name} leads this trick`} title={`${name} leads this trick`} data-marker="leader"/>{/if}
</div>{/if}
<style>
.seat-markers{display:flex;flex-direction:row;align-items:center;justify-content:center;gap:5px;width:var(--seat-marker-size,54px);min-height:var(--seat-marker-size,54px);flex-shrink:0;pointer-events:none}.seat-markers img{display:block;width:auto;height:var(--seat-marker-size,54px);max-width:none;object-fit:contain;filter:drop-shadow(0 2px 3px #0008)}
.seat-markers.both img{height:calc((var(--seat-marker-size,54px) - 5px)/2)}
</style>
