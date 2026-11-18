<script lang="ts">
 import {onMount} from 'svelte';
 import Table from '$lib/components/play/Table.svelte';
 import {apply,eventFor} from '$lib/engine/engine';
 import {readyDuration,decisionDuration,cardPlayDuration,automaticCommand,transitionDuration} from '$lib/components/play/presentation';
 import type {State,Command} from '$lib/engine/types';
 import {fixture,scenarios} from './scenarios';
 import '$lib/components/play/table.css';
 let ready=$state(false);
 let subject=$state('collect'),count=$state(3),speed=$state(1),position=$state(0),playing=$state(false),game=$state<State>(fixture('collect')),error=$state(''),generation=$state(0);
 const automatic=$derived(automaticCommand(game,game.phase==='round-end'?game.owner:game.turn));
 const combined=$derived(subject==='win-decision'&&!automatic);
 const decisionScene=$derived(game.phase==='after'&&!automatic&&['empress','temperance','imp','win-decision'].includes(subject));
 const motionScene=$derived(['play','play-opponent'].includes(subject)||combined);
 const readinessScene=$derived(subject==='round-ready'&&game.phase==='round-end');
 const playable=$derived(!!automatic||motionScene||decisionScene||readinessScene);
 const duration=$derived(readinessScene?readyDuration:combined?cardPlayDuration+decisionDuration:decisionScene?decisionDuration:motionScene?cardPlayDuration:transitionDuration(game.phase));
 function reset(){game=fixture(subject,count);position=0;playing=false;error='';generation++;}
 function decline(){game={...game,players:game.players.map(p=>p.id==='you'?{...p,adjusted:true,used:true}:p),afterRevealed:true};position=0;playing=true;}
 function command(c:Command,actor='you'){try{game=apply($state.snapshot(game),eventFor(game,actor,c,`lab-action-${game.revision+1}`));position=0;playing=!!automaticCommand(game,game.phase==='round-end'?game.owner:game.turn);error='';}catch(e){error=(e as Error).message;}}
 function toggle(){if(position>=1)position=0;playing=!playing;}
 onMount(()=>{ready=true;let frame=0,last=performance.now();const tick=(now:number)=>{if(playing){position=Math.min(1,position+(now-last)/duration*speed);if(position===1){playing=false;if(subject==='score'&&game.phase==='round-end'&&automatic&&game.players.every(p=>p.done))command(automatic,game.owner);}}last=now;frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);});
</script>
<svelte:head><title>Animation lab · Hell’s Bells</title></svelte:head>
<main class="play-shell animation-lab" data-ready={ready} data-scenario={subject} id="main">
 {#key generation}<Table game={game} uid="you" roomId="MOTION" busy={false} send={command} labProgress={position} labArrival={motionScene?combined?Math.min(1,position*duration/cardPlayDuration):position:null} labDecision={decisionScene?combined?Math.max(0,(position*duration-cardPlayDuration)/decisionDuration):position:null} labReady={readinessScene?position:null} labReadyPlayer={readinessScene?'seat-1':null} onDecline={decline}/>{/key}
 <aside class="lab-tools" aria-label="Animation lab">
 <div class="lab-row"><strong>Animation lab</strong><label>Outcome<select aria-label="Outcome" value={subject} onchange={e=>{subject=e.currentTarget.value;reset();}}>{#each scenarios as scene}<option value={scene.id}>{scene.name}</option>{/each}</select></label><label>Players<select aria-label="Players" value={count} onchange={e=>{count=Number(e.currentTarget.value);reset();}}><option value={3}>3</option><option value={4}>4</option><option value={5}>5</option></select></label><label>Speed<select aria-label="Speed" bind:value={speed}><option value={.25}>¼×</option><option value={.5}>½×</option><option value={1}>1×</option><option value={2}>2×</option></select></label><button onclick={reset}>Reset</button>{#if game.phase==='round-end'}<button disabled={!game.players.some(p=>p.id!=='you'&&!p.done)} onclick={()=>{const p=game.players.find(p=>p.id!=='you'&&!p.done);if(p)command({type:'continue',value:1},p.id);}}>Ready another player</button>{/if}<button onclick={toggle} disabled={!playable}>{playing?'Pause':position>=1?'Replay':'Play'}</button></div>
 <div class="timeline"><span>{Math.round(position*duration)} ms</span><input type="range" min="0" max="1" step=".001" bind:value={position} oninput={()=>playing=false} aria-label="Animation timeline" disabled={!playable}/><span>{duration} ms</span></div>
 <p>{scenarios.find(s=>s.id===subject)?.hint} <b>{!playable||decisionScene&&position>=1?'Waiting for your choice.':position>=1?'Transition complete.':playing?'Playing.':'Paused · scrub to inspect.'}</b></p>
 {#if automatic&&position>=1}<button onclick={()=>command(automatic,game.phase==='round-end'?game.owner:game.turn)}>Advance to resulting game</button>{/if}{#if error}<p role="alert">{error}</p>{/if}
 </aside>
</main>
<style>
.animation-lab{--lab-height:156px}.animation-lab :global(.game-table){height:calc(100dvh - 92px - var(--lab-height))}.lab-tools{height:var(--lab-height);box-sizing:border-box;background:#101711;border-top:1px solid #887348;padding:12px 3%;color:#d5c29c;font-size:.75rem;position:relative;z-index:200}.lab-row{display:flex;gap:14px;align-items:center;flex-wrap:wrap}.lab-tools label{display:flex;gap:7px;align-items:center;margin:0;font-size:.7rem}.lab-tools select,.lab-tools button{background:#27352b;color:#f2dfb5;border:1px solid #8c774e;padding:6px 10px;border-radius:3px;font-size:.75rem}.lab-tools button:disabled{opacity:.35}.timeline{display:flex;align-items:center;gap:14px;margin-top:10px;font-variant-numeric:tabular-nums}.timeline input{flex:1;min-width:50px;accent-color:#d5ad66}.timeline span{min-width:64px}.lab-tools p{margin:7px 0;font-size:.7rem}.lab-tools b{color:#f0ce87;margin-left:8px}@media(max-width:800px){.animation-lab{--lab-height:220px}.animation-lab :global(.game-table){height:calc(100dvh - 78px - var(--lab-height))}.lab-row{gap:7px}.lab-row strong{display:none}.lab-tools{padding:8px}.lab-tools select{max-width:180px}.lab-tools p{font-size:.65rem}}

@media(max-height:600px){.animation-lab{--lab-height:110px}.animation-lab :global(.game-table){height:calc(100dvh - 110px)}.lab-tools{padding:5px 12px}.lab-tools p{display:none}.lab-row{gap:6px}.lab-tools select,.lab-tools button{padding:3px 7px}.timeline{margin-top:4px}}
</style>
