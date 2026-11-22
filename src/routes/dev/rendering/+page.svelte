<script lang="ts">
 import {onMount} from 'svelte';
 import GameCard from '$lib/components/GameCard.svelte';
 import {imps} from '$lib/data/game';
 let width=$state(140),name=$state('amdusias'),ratio=$state(1),ready=$state(false);
 const variants=[{name:'Original · upright',thumb:false,angle:0},{name:'Original · rotated',thumb:false,angle:-7},{name:'Responsive · upright',thumb:true,angle:0},{name:'Responsive · rotated',thumb:true,angle:-7}];
 onMount(()=>{ratio=window.devicePixelRatio;ready=true;});

</script>
<svelte:head><title>Card sampling comparison · Hell’s Bells</title></svelte:head>
<main id="main">
 <h1>Card sampling comparison</h1>
 <p>Same production card component and artwork in every column. Only image sampling and rotation differ. Responsive artwork is cropped and reduced with Lanczos3, then selected for this card’s size and display density. Originals are reduced by the browser.</p>
 <div class="controls"><label>Artwork <select bind:value={name}><option value="amdusias">Amdusias</option><option value="furfur">Furfur</option></select></label><label>Card width <input type="number" min="50" max="300" step="1" bind:value={width}/> CSS px</label><button onclick={()=>width=70}>Opponent size · 70px</button><button onclick={()=>width=140}>140px</button><span>Device pixel ratio: {ratio}</span></div>
 {#if ready}{#key `${width}-${name}-${ratio}`}<div class="comparisons">{#each variants as variant}<section><h2>{variant.name}</h2><p>{width}px wide · {variant.angle}°</p><div class="card-space"><div class="card" style:width={`${width}px`} style:transform={`rotate(${variant.angle}deg)`}><GameCard card={imps[name==='amdusias'?0:2]} eager fullResolution={!variant.thumb}/></div></div></section>{/each}</div>{/key}{/if}
 <p>Compare the artwork’s fine detail and shading, not just the card border. Keep browser zoom unchanged. Responsive columns use the same image selection as the game.</p>
</main>
<style>
 main{max-width:1400px;margin:auto;padding:32px;color:#eedfc1;background:#1c241f;min-height:75vh}h1{font-size:2rem}p{max-width:950px;line-height:1.5}.controls{display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin:24px 0}.controls label{display:flex;gap:8px;align-items:center}.controls input{width:75px}.controls input,.controls select,.controls button{padding:8px;background:#29392e;color:#ffe6ad;border:1px solid #a68e59}.comparisons{display:grid;grid-template-columns:repeat(4,minmax(200px,1fr));gap:16px;overflow-x:auto;padding:12px}section{background:#151d18;border:1px solid #7e704b;padding:16px}h2{font-size:1rem}section p{font-size:.8rem}.card-space{min-height:530px;display:flex;justify-content:center;align-items:flex-start;padding-top:32px}.card{flex-shrink:0;transform-origin:center}
</style>
