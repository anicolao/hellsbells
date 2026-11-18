<script lang="ts">
 import type { Suit } from '$lib/data/game';
 let {suit}: {suit:Suit} = $props();
</script>
<svg class="suit-icon" data-suit={suit} viewBox="0 0 48 48" role="img" aria-label={suit} fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
 {#if suit==='Wands'}<path d="M15 39 32 9M19 31l-9-3m14-6 10 2M27 15l-3-7M15 39l3 2M29 8l5 3"/><path d="m8 11 2-5 2 5 5 2-5 2-2 5-2-5-5-2z"/>
 {:else if suit==='Cups'}<path d="M14 10h20v11c0 13-20 13-20 0zm10 21v9m-8 0h16M14 14H8v6c0 5 4 6 7 6m19-12h6v6c0 5-4 6-7 6"/>
 {:else if suit==='Swords'}<path d="m24 5 5 9-3 18h-4l-3-18zM13 31l11 3 11-3M24 34v8m-4 0h8"/>
 {:else}<circle cx="24" cy="24" r="18"/><path d="m24 9 9 27-23-17h28L15 36z"/>{/if}
</svg>
<style>.suit-icon{width:1.5em;height:1.5em;display:inline-block;vertical-align:middle}</style>
