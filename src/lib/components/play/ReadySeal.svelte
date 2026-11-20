<script lang="ts">
 import {onMount} from 'svelte';
 import {base} from '$app/paths';
 import {readyDuration,readyPose} from './presentation';
 let {progress=null,name}:{progress?:number|null;name:string}=$props();
 let elapsed=$state(0);
 const pose=$derived(readyPose(progress??elapsed));
 onMount(()=>{if(progress!==null)return;let frame=0;const started=performance.now();function step(now:number){elapsed=Math.min(1,(now-started)/readyDuration);if(elapsed<1)frame=requestAnimationFrame(step);}frame=requestAnimationFrame(step);return()=>cancelAnimationFrame(frame);});
</script>
<div class="ready-seal" role="img" aria-label={`${name} is ready`} style:opacity={pose.opacity} style:transform={`scale(${pose.scale}) rotate(${pose.angle}deg)`}><img src={`${base}/art/cards/power-token.webp`} alt=""/><span>✓</span></div>
<style>.ready-seal{position:relative;width:40px;height:40px;border-radius:50%;box-shadow:0 2px 4px #0008;transform-origin:center}.ready-seal img{width:100%;height:100%;object-fit:contain}.ready-seal span{position:absolute;inset:0;display:grid;place-items:center;color:#ffecb1;font:700 23px/1 serif;text-shadow:0 1px 3px #000,0 0 5px #000}@media(max-width:800px){.ready-seal{width:28px;height:28px}.ready-seal span{font-size:18px}}@media(max-height:600px){.ready-seal{width:20px;height:20px}.ready-seal span{font-size:13px}}@media(prefers-reduced-motion:reduce){.ready-seal{transform:none!important}}
</style>
