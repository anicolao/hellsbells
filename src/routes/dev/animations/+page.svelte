<script lang="ts">
 import {provideCardDesign} from '$lib/components/card-design';
 provideCardDesign('indexed','transparent');
 import GamePresentation from '$lib/components/play/GamePresentation.svelte';
 import {makePowerScene} from './powers/scenes';
 import {PresentationTimeline} from '$lib/components/play/powers/transitions';
 import {onMount} from 'svelte';
 import Table from '$lib/components/play/Table.svelte';
 import {botCommand,nextActor} from '$lib/engine/bot';
 import {apply,eventFor} from '$lib/engine/engine';
 import {readyDuration,decisionDuration,cardPlayDuration,automaticCommand,transitionDuration} from '$lib/components/play/presentation';
 import type {State,Command} from '$lib/engine/types';
 import {fixture,scenarios} from './scenarios';
 import '$lib/components/play/table.css';
 let presentation=$state<GamePresentation>();
 let soundOn=$state(true);
 let tableOnly=$state(false);
 let ready=$state(false),realtime=$state(false),viewerSeat=$state(0);
 let subject=$state('collect'),count=$state(3),speed=$state(1),position=$state(0),playing=$state(false),game=$state<State>(fixture('collect')),error=$state(''),generation=$state(0);
 const powerIndex=$derived(subject.startsWith('bell-')?Number(subject.slice(5)):-1);
 const powerScene=$derived(powerIndex>=0&&powerIndex<10);
 const demo=$derived(powerScene?makePowerScene(powerIndex,count):null);
 const powerDuration=$derived.by(()=>{if(!demo)return 1;const t=new PresentationTimeline(demo.before);t.append(demo.events);return t.end;});
 const viewingId=$derived(game.players[Math.min(viewerSeat,game.players.length-1)]?.id??'you');
 const automatic=$derived(automaticCommand(game,game.phase==='round-end'?game.owner:game.turn));
 const combined=$derived(subject==='win-decision'&&!automatic);
 const decisionScene=$derived(game.phase==='after'&&!automatic&&['empress','temperance','imp','win-decision','seere','andromalius'].includes(subject));
 const motionScene=$derived(['play','play-opponent'].includes(subject)||combined);
 const readinessScene=$derived(subject==='round-ready'&&game.phase==='round-end');
 const playable=$derived(powerScene||!!automatic||motionScene||decisionScene||readinessScene);
 const duration=$derived(powerScene?powerDuration:readinessScene?readyDuration:combined?cardPlayDuration+decisionDuration:decisionScene?decisionDuration:motionScene?cardPlayDuration:transitionDuration(game.phase));
 function reset(){viewerSeat=powerScene||['seating','seating-later','andromalius'].includes(subject)?Math.max(0,Math.min(viewerSeat,count-1)):0;game=powerScene?makePowerScene(powerIndex,count).before:fixture(subject,count);position=0;playing=false;error='';generation++;}
 function decline(){game={...game,players:game.players.map(p=>p.id===viewingId?{...p,adjusted:true,used:true}:p),afterRevealed:true};position=0;playing=true;}
 function command(c:Command,actor='you'){try{game=apply($state.snapshot(game),eventFor(game,actor,c,`lab-action-${game.revision+1}`));position=0;playing=!!automaticCommand(game,game.phase==='round-end'?game.owner:game.turn);error='';}catch(e){error=(e as Error).message;}}
 async function toggle(){if(playing){playing=false;return;}if(position>=1)position=0;if(powerScene&&soundOn)try{await presentation?.unlockAudio();}catch{error='Bell sound is unavailable; the visual sequence still plays.';}playing=true;}
 function scrub(){playing=false;}
 function nextImp(){subject=`bell-${(powerIndex+1)%10}`;reset();}
 onMount(()=>{const params=new URLSearchParams(location.search);realtime=params.get('realtime')==='1';viewerSeat=Math.max(0,Math.min(4,Number(params.get('seat')??0)||0));const scenario=params.get('scenario'),players=Number(params.get('players'));if(scenarios.some(s=>s.id===scenario))subject=scenario!;if([3,4,5].includes(players))count=players;if(scenario||players)reset();tableOnly=params.get('table')==='1';if(tableOnly){position=1;realtime=true;}ready=true;let frame=0,last=performance.now();const tick=(now:number)=>{if(playing){position=Math.min(1,position+(now-last)/duration*speed);if(position===1){playing=false;if(subject==='score'&&game.phase==='round-end'&&automatic&&game.players.every(p=>p.done))command(automatic,game.owner);}}last=now;frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(frame);};});
</script>
<svelte:head><title>Animation lab · Hell’s Bells</title></svelte:head>
<main class="play-shell animation-lab" class:table-only={tableOnly} data-ready={ready} data-scenario={subject} id="main">
 {#if powerScene}<GamePresentation bind:this={presentation} game={demo!.before} initial={demo!.before} events={demo!.events} uid={viewingId} roomId="MOTION" busy={false} send={()=>{}} time={position*duration} {playing} sound={soundOn}/>{:else}{#key `${generation}:${viewingId}`}<Table game={game} uid={viewingId} roomId="MOTION" busy={false} send={c=>command(c,viewingId)} labProgress={realtime?null:position} labArrival={realtime?null:motionScene?combined?Math.min(1,position*duration/cardPlayDuration):position:null} labDecision={realtime?null:decisionScene?combined?Math.max(0,(position*duration-cardPlayDuration)/decisionDuration):position:null} labReady={readinessScene?position:null} labReadyPlayer={readinessScene?'seat-1':null} onDecline={decline}/>{/key}{/if}
 <aside class="lab-tools" aria-label="Animation lab">
 <div class="lab-row"><strong>Animation lab</strong><label>Outcome<select aria-label="Outcome" value={subject} onchange={e=>{subject=e.currentTarget.value;reset();}}>{#each scenarios as scene}<option value={scene.id}>{scene.name}</option>{/each}</select></label><label>Players<select aria-label="Players" value={count} onchange={e=>{count=Number(e.currentTarget.value);reset();}}><option value={3}>3</option><option value={4}>4</option><option value={5}>5</option></select></label>{#if powerScene||subject==='seating'||subject==='seating-later'||subject==='andromalius'}<label>View from<select aria-label="View from" bind:value={viewerSeat}>{#each game.players as p,i}<option value={i}>{p.name}</option>{/each}</select></label>{#if !powerScene}<button onclick={()=>{const actor=nextActor(game);if(actor)command(botCommand($state.snapshot(game),actor),actor);}}>Next play</button>{/if}{/if}<label>Speed<select aria-label="Speed" bind:value={speed}><option value={.25}>¼×</option><option value={.5}>½×</option><option value={1}>1×</option><option value={2}>2×</option></select></label><button onclick={reset}>Reset</button>{#if powerScene}<button onclick={nextImp}>Next imp</button><label class="sound-control"><input type="checkbox" bind:checked={soundOn} />Bell sound</label>{/if}{#if subject==='andromalius'}<button disabled={!game.exposed.length} onclick={()=>game={...game,exposed:[]}}>Hide exposed cards</button>{/if}{#if subject==='discard'||subject==='magician-wait'}<button disabled={!game.players.some(p=>p.id!=='you'&&!p.done)} onclick={()=>{const p=game.phase==='discard'?game.players.find(p=>p.id!=='you'&&!p.done):game.players.find(p=>p.id===game.turn&&p.id!=='you');if(p)command(botCommand($state.snapshot(game),p.id),p.id);}}>Resolve another player</button>{/if}{#if game.phase==='round-end'}<button disabled={!game.players.some(p=>p.id!=='you'&&!p.done)} onclick={()=>{const p=game.players.find(p=>p.id!=='you'&&!p.done);if(p)command({type:'continue',value:1},p.id);}}>Ready another player</button>{/if}<button onclick={toggle} disabled={!playable}>{playing?'Pause':position>=1?'Replay':'Play'}</button></div>
 <div class="timeline"><span>{Math.round(position*duration)} ms</span><input type="range" min="0" max="1" step=".001" bind:value={position} oninput={scrub} aria-label="Animation timeline" disabled={!playable}/><span>{duration} ms</span></div>
 <p>{scenarios.find(s=>s.id===subject)?.hint} <b>{powerScene?`${playing?'playing':'paused'}.`:!playable||decisionScene&&position>=1?'Waiting for your choice.':position>=1?'Transition complete.':playing?'Playing.':'Paused · scrub to inspect.'}</b></p>
 {#if !powerScene&&automatic&&position>=1}<button onclick={()=>command(automatic,game.phase==='round-end'?game.owner:game.turn)}>Advance to resulting game</button>{/if}{#if error}<p role="alert">{error}</p>{/if}
 </aside>
</main>
<style>
.animation-lab{--lab-height:156px}.animation-lab :global(.game-table){height:calc(100dvh - var(--lab-height))}.lab-tools{height:var(--lab-height);box-sizing:border-box;background:#101711;border-top:1px solid #887348;padding:12px 3%;color:#d5c29c;font-size:.75rem;position:relative;z-index:200}.lab-row{display:flex;gap:14px;align-items:center;flex-wrap:wrap}.lab-tools .sound-control{white-space:nowrap}.lab-tools .sound-control input{accent-color:#d5ad66;width:15px;height:15px}.lab-tools label{display:flex;gap:7px;align-items:center;margin:0;font-size:.7rem}.lab-tools select,.lab-tools button{background:#27352b;color:#f2dfb5;border:1px solid #8c774e;padding:6px 10px;border-radius:3px;font-size:.75rem}.lab-tools button:disabled{opacity:.35}.timeline{display:flex;align-items:center;gap:14px;margin-top:10px;font-variant-numeric:tabular-nums}.timeline input{flex:1;min-width:50px;accent-color:#d5ad66}.timeline span{min-width:64px}.lab-tools p{margin:7px 0;font-size:.7rem}.lab-tools b{color:#f0ce87;margin-left:8px}@media(max-width:800px){.animation-lab{--lab-height:220px}.animation-lab :global(.game-table){height:calc(100dvh - var(--lab-height))}.lab-row{gap:7px}.lab-row strong{display:none}.lab-tools{padding:8px}.lab-tools select{max-width:180px}.lab-tools p{font-size:.65rem}}

@media(max-height:600px){.animation-lab{--lab-height:110px}.animation-lab :global(.game-table){height:calc(100dvh - 110px)}.lab-tools{padding:5px 12px}.lab-tools p{display:none}.lab-row{gap:6px}.lab-tools select,.lab-tools button{padding:3px 7px}.timeline{margin-top:4px}}


@media(max-width:800px) and (min-height:601px){
 .animation-lab[data-scenario^='seating'] .lab-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
 .animation-lab[data-scenario^='seating'] .lab-row>label:first-of-type{grid-column:1/-1}
 .animation-lab[data-scenario^='seating'] .lab-row label{min-width:0;gap:4px;white-space:nowrap}
 .animation-lab[data-scenario^='seating'] .lab-row select{min-width:0;max-width:none;width:100%;padding:5px}
 .animation-lab[data-scenario^='seating'] .lab-row button{padding:5px}
}
.animation-lab.table-only{--lab-height:0px}.animation-lab.table-only :global(.game-table){height:100dvh}.table-only .lab-tools{display:none}
</style>
