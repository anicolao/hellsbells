<script lang="ts">
 import {base} from '$app/paths';
  let { spent = false }: { spent?: boolean } = $props();
</script>
<span class="power-token" class:spent role="img" aria-label={spent ? 'Power spent' : 'Power available'}>
  <img src={base + "/art/cards/power-token.webp"} alt="" />
  {#if spent}<span>USED</span>{/if}
</span>
<style>
  .power-token{display:inline-grid;place-items:center;width:75px;aspect-ratio:1;position:relative;flex-shrink:0}
  img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 3px 2px #2116)}
  .spent img{filter:grayscale(1) brightness(.65)}
  .power-token>span{position:absolute;font-size:10px;letter-spacing:.12em;color:white;background:#302a23e6;padding:4px}
</style>
