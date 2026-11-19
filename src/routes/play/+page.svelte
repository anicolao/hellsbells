<script lang="ts">
 import {onMount,onDestroy} from 'svelte';
 import {base} from '$app/paths';
 import {replaceState} from '$app/navigation';
 import {imps,arcana} from '$lib/data/game';
 import CardControl from '$lib/components/play/CardControl.svelte';
 import ContractToken from '$lib/components/play/ContractToken.svelte';
 import Table from '$lib/components/play/Table.svelte';
 import {readLaunch,playerName} from '$lib/backend/launch';
 import {connectFirebase} from '$lib/backend/firebase';
 import {createGame,joinGame,watchGame,append,waitForGame,hasSeat} from '$lib/backend/repository';
 import {cardPlayDuration,automaticCommand,transitionDuration} from '$lib/components/play/presentation';
 import {nextActor,botCommand} from '$lib/engine/bot';
 import type {State,Command} from '$lib/engine/types';
 import type {Firestore} from 'firebase/firestore';
 import '$lib/components/play/table.css';
 let game=$state<State>(),uid=$state(''),db:Firestore,roomId=$state(''),name=$state(''),code=$state(''),capacity=$state(3),busy=$state(false),error=$state(''),ready=$state(false),practice=$state(false),practicePolicy=$state<'easy'|'rl-v1'|'rl-v2'|'rl-v3'>('easy');
 let alive=true;
 let waiting=$state(false);
 let stopWaiting:()=>void=()=>{};
 function rememberName(){name=playerName(name);if(!name)throw Error('Enter your name to take a seat.');localStorage.setItem('hellsbells:name',name);return name;}
 let unsubscribe:()=>void=()=>{},timer:ReturnType<typeof setTimeout>|undefined;
 async function send(command:Command,actor=uid){if(!game||busy)return;busy=true;error='';try{await append(db,uid,roomId,$state.snapshot(game),actor,$state.snapshot(command));}catch(e){error=(e as Error).message;}finally{busy=false;}}
 function watch(id:string){waiting=false;stopWaiting();roomId=id;localStorage.setItem('hellsbells:last-game',id);replaceState(`${base}/play/?game=${id}`,{});unsubscribe();unsubscribe=watchGame(db,id,state=>{game=state;const seated=state.players.find(p=>p.id===uid);if(seated&&seated.name!=='Wanderer'){name=seated.name;localStorage.setItem('hellsbells:name',name);}error='';},e=>error=e.message);}
 async function create(solo:boolean,policy:'easy'|'rl-v1'|'rl-v2'|'rl-v3'='easy'){if(!ready||busy)return;busy=true;error='';try{rememberName();practice=solo;practicePolicy=policy;const id=await createGame(db,uid,name,capacity);watch(id);}catch(e){error=(e as Error).message;}finally{busy=false;}}
 async function join(id=code){if(!ready||busy||!id)return;busy=true;error='';try{if(!await hasSeat(db,uid,id.toUpperCase()))await joinGame(db,uid,id.toUpperCase(),rememberName());watch(id.toUpperCase());}catch(e){error=(e as Error).message;}finally{busy=false;}}
 onMount(()=>{name=playerName(localStorage.getItem('hellsbells:name'));if(name==='Wanderer')name='';connectFirebase().then(async c=>{
  if(!alive)return;db=c.db;uid=c.uid;ready=true;
  const launch=readLaunch(location.search);name=launch.name||name||playerName(c.auth.currentUser?.displayName);code=launch.table;
  if(launch.mode==='create'){rememberName();busy=true;try{await createGame(db,uid,name,5,launch.table);if(alive)watch(launch.table);}finally{busy=false;}}
  else if(launch.mode==='join'){
   rememberName();waiting=true;
   stopWaiting=waitForGame(db,launch.table,()=>{if(!waiting||!alive)return;waiting=false;stopWaiting();void join(launch.table);},e=>{waiting=false;error=e.message;});
  }else if(launch.table&&(name||await hasSeat(db,uid,launch.table)))await join(launch.table);
 }).catch(e=>error=e.message);});
 $effect(()=>{clearTimeout(timer);if(!game||busy||game.owner!==uid)return;const current=game,tableId=roomId;
 if(practice&&current.phase==='lobby'){timer=setTimeout(()=>{if(current.players.length<current.capacity)send({type:'bot',value:practicePolicy==='rl-v3'?3:practicePolicy==='rl-v2'?2:practicePolicy==='rl-v1'?1:0,target:`bot-${crypto.randomUUID().slice(0,8)}`,name:['Belial','Paimon','Vassago','Orobas'][current.players.length-1]});else{practice=false;send({type:'start'});}},400);return;}
 let actor=nextActor(current);
 if(actor&&(current.players.some(p=>p.id===actor&&p.bot))){timer=setTimeout(async()=>{try{const policy=current.players.find(p=>p.id===actor)?.botPolicy;const choose=policy&&policy!=='easy'?(await import('$lib/engine/trained-worker')).trainedCommand:botCommand;if(!alive||roomId!==tableId||game?.revision!==current.revision||busy)return;const command=await choose($state.snapshot(current),actor!);if(!alive||roomId!==tableId||game?.revision!==current.revision||busy)return;await send(command,actor!);}catch(e){if(alive&&roomId===tableId)error=(e as Error).message;}},Number(import.meta.env.VITE_BOT_DELAY_MS)||(current.phase==='after'?cardPlayDuration+transitionDuration(current.phase):current.phase==='play'?cardPlayDuration+100:automaticCommand(current,actor!)?transitionDuration(current.phase):700));}
 });
 onDestroy(()=>{alive=false;stopWaiting();unsubscribe();clearTimeout(timer);});
</script>
<svelte:head><title>Play Hell’s Bells</title><meta name="description" content="Take your seat in the belfry. Play Hell’s Bells online with friends or computer imps."/></svelte:head>
<main id="main" class="play-shell">
 {#if game}<Table {game} {uid} {busy} {roomId} send={c=>send(c)}/>
 {:else}<section class="belfry-entry"><div class="entry-copy"><p class="eyebrow">THE BELFRY IS OPEN</p><h1>Take your seat.</h1><p>Keep your promise.<br/>Outwit the other imps.</p><label>Your name<input maxlength="24" disabled={!ready||busy} bind:value={name} autocomplete="nickname" onkeydown={e=>{if(e.key==='Enter'&&code.length===8)join();}} aria-label="Your name"/></label><div class="entry-capacity">{#each [3,4,5] as n}<ContractToken value={n} selected={capacity===n} label={`${n} players`} onpick={()=>capacity=n}/>{/each}</div><label>Join a table<input bind:value={code} maxlength="8" placeholder="TABLE CODE" aria-label="Table code" onkeydown={e=>{if(e.key==='Enter')join();}}/></label>{#if waiting}<p role="status">Waiting for your host to open the table…</p>{:else if code.length===8}<a href={`${base}/play/?game=${code.toUpperCase()}`} onclick={e=>{e.preventDefault();join();}}>Take this seat ↗</a>{/if}</div><div class="entry-decks"><figure><CardControl card={arcana[0]} back disabled={!ready||busy} label="Create a table for friends" onpick={()=>create(false)}/><figcaption>WITH FRIENDS</figcaption></figure><figure><CardControl card={imps[0]} back disabled={!ready||busy} label="Practice against computer imps" onpick={()=>create(true)}/><figcaption>EASY IMPS</figcaption></figure><figure><CardControl card={arcana[15]} back disabled={!ready||busy} label="Practice against trained imps" onpick={()=>create(true,'rl-v3')}/><figcaption>TRAINED IMPS</figcaption></figure></div></section>{/if}
 {#if error}<p class="table-error" role="alert">{error}</p>{/if}
 {#if !ready&&!error}<p class="connection-status" role="status">Lighting the candles…</p>{/if}
</main>
