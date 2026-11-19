<script lang="ts">
 import {onMount,onDestroy} from 'svelte';
 import {base} from '$app/paths';
 import {replaceState} from '$app/navigation';
 import {imps,arcana} from '$lib/data/game';
 import CardControl from '$lib/components/play/CardControl.svelte';
 import ContractToken from '$lib/components/play/ContractToken.svelte';
 import Table from '$lib/components/play/Table.svelte';
 import {connectFirebase} from '$lib/backend/firebase';
 import {createGame,joinGame,watchGame,append} from '$lib/backend/repository';
 import {cardPlayDuration,automaticCommand,transitionDuration} from '$lib/components/play/presentation';
 import {nextActor,botCommand} from '$lib/engine/bot';
 import type {State,Command} from '$lib/engine/types';
 import type {Firestore} from 'firebase/firestore';
 import '$lib/components/play/table.css';
 let game=$state<State>(),uid=$state(''),db:Firestore,roomId=$state(''),name=$state(''),code=$state(''),capacity=$state(3),busy=$state(false),error=$state(''),ready=$state(false),practice=$state(false),practicePolicy=$state<'easy'|'rl-v1'|'rl-v2'|'rl-v3'>('easy');
 let alive=true;
 let unsubscribe:()=>void=()=>{},timer:ReturnType<typeof setTimeout>|undefined;
 async function send(command:Command,actor=uid){if(!game||busy)return;busy=true;error='';try{await append(db,uid,roomId,$state.snapshot(game),actor,$state.snapshot(command));}catch(e){error=(e as Error).message;}finally{busy=false;}}
 function watch(id:string){roomId=id;localStorage.setItem('hellsbells:last-game',id);replaceState(`${base}/play/?game=${id}`,{});unsubscribe();unsubscribe=watchGame(db,id,state=>{game=state;error='';},e=>error=e.message);}
 async function create(solo:boolean,policy:'easy'|'rl-v1'|'rl-v2'|'rl-v3'='easy'){if(!ready||busy)return;busy=true;error='';try{localStorage.setItem('hellsbells:name',name||'Wanderer');practice=solo;practicePolicy=policy;const id=await createGame(db,uid,name||'Wanderer',capacity);watch(id);}catch(e){error=(e as Error).message;}finally{busy=false;}}
 async function join(id=code){if(!ready||busy||!id)return;busy=true;error='';try{await joinGame(db,uid,id.toUpperCase(),name||'Wanderer');watch(id.toUpperCase());}catch(e){error=(e as Error).message;}finally{busy=false;}}
 onMount(()=>{name=localStorage.getItem('hellsbells:name')??'Wanderer';connectFirebase().then(async c=>{db=c.db;uid=c.uid;ready=true;const id=new URLSearchParams(location.search).get('game');if(id)await join(id);}).catch(e=>error=e.message);});
 $effect(()=>{clearTimeout(timer);if(!game||busy||game.owner!==uid)return;const current=game,tableId=roomId;
 if(practice&&current.phase==='lobby'){timer=setTimeout(()=>{if(current.players.length<current.capacity)send({type:'bot',value:practicePolicy==='rl-v3'?3:practicePolicy==='rl-v2'?2:practicePolicy==='rl-v1'?1:0,target:`bot-${crypto.randomUUID().slice(0,8)}`,name:['Belial','Paimon','Vassago','Orobas'][current.players.length-1]});else{practice=false;send({type:'start'});}},400);return;}
 let actor=nextActor(current);
 if(actor&&(current.players.some(p=>p.id===actor&&p.bot))){timer=setTimeout(async()=>{try{const policy=current.players.find(p=>p.id===actor)?.botPolicy;const choose=policy&&policy!=='easy'?(await import('$lib/engine/trained-worker')).trainedCommand:botCommand;if(!alive||roomId!==tableId||game?.revision!==current.revision||busy)return;const command=await choose($state.snapshot(current),actor!);if(!alive||roomId!==tableId||game?.revision!==current.revision||busy)return;await send(command,actor!);}catch(e){if(alive&&roomId===tableId)error=(e as Error).message;}},Number(import.meta.env.VITE_BOT_DELAY_MS)||(current.phase==='after'?cardPlayDuration+transitionDuration(current.phase):current.phase==='play'?cardPlayDuration+100:automaticCommand(current,actor!)?transitionDuration(current.phase):700));}
 });
 onDestroy(()=>{alive=false;unsubscribe();clearTimeout(timer);});
</script>
<svelte:head><title>Play Hell’s Bells</title><meta name="description" content="Take your seat in the belfry. Play Hell’s Bells online with friends or computer imps."/></svelte:head>
<main id="main" class="play-shell">
 {#if game}<Table {game} {uid} {busy} {roomId} send={c=>send(c)}/>
 {:else}<section class="belfry-entry"><div class="entry-copy"><p class="eyebrow">THE BELFRY IS OPEN</p><h1>Take your seat.</h1><p>Keep your promise.<br/>Outwit the other imps.</p><label>Your name<input maxlength="24" bind:value={name} autocomplete="nickname" aria-label="Your name"/></label><div class="entry-capacity">{#each [3,4,5] as n}<ContractToken value={n} selected={capacity===n} label={`${n} players`} onpick={()=>capacity=n}/>{/each}</div><label>Join a table<input bind:value={code} maxlength="8" placeholder="TABLE CODE" aria-label="Table code" onkeydown={e=>{if(e.key==='Enter')join();}}/></label>{#if code.length===8}<a href={`${base}/play/?game=${code.toUpperCase()}`} onclick={e=>{e.preventDefault();join();}}>Take this seat ↗</a>{/if}</div><div class="entry-decks"><figure><CardControl card={arcana[0]} back disabled={!ready||busy} label="Create a table for friends" onpick={()=>create(false)}/><figcaption>WITH FRIENDS</figcaption></figure><figure><CardControl card={imps[0]} back disabled={!ready||busy} label="Practice against computer imps" onpick={()=>create(true)}/><figcaption>EASY IMPS</figcaption></figure><figure><CardControl card={arcana[15]} back disabled={!ready||busy} label="Practice against trained imps" onpick={()=>create(true,'rl-v3')}/><figcaption>TRAINED IMPS</figcaption></figure></div></section>{/if}
 {#if error}<p class="table-error" role="alert">{error}</p>{/if}
 {#if !ready&&!error}<p class="connection-status" role="status">Lighting the candles…</p>{/if}
</main>
