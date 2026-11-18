<script lang="ts">
 import {base} from '$app/paths';
 import {imps,arcana,minor,type GameCard as Card} from '$lib/data/game';
 import type {State,Command,Player} from '$lib/engine/types';
 import {cards,available,legalCards,player,allowedBids,bidMax} from '$lib/engine/engine';
 import {nextActor} from '$lib/engine/bot';
 import GameCard from '../GameCard.svelte';
 import CardControl from './CardControl.svelte';
 import ContractToken from './ContractToken.svelte';
 let {game,uid,busy,send,roomId}:{game:State;uid:string;busy:boolean;send:(c:Command)=>void;roomId:string}=$props();
 let selection=$state<string[]>([]),armed=$state(false),low=$state(false),royal=$state(false),lastRevision=$state(0),stowedVision=$state('');
 const me=$derived(player(game,uid));
 const myTurn=$derived(game.turn===uid);
 const canAct=$derived(!busy&&(myTurn||['draft','discard','adjust'].includes(game.phase)||game.phase==='bid'&&game.arcana===18));
 const hand=$derived([...me.hand].sort((a,b)=>cards[a].suit.localeCompare(cards[b].suit)||cards[a].rank-cards[b].rank));
 const legal=$derived(game.phase==='play'?legalCards(game,uid,game.pending?.original,armed&&me.imp===0||game.forced.includes(uid)):[]);
 const prompt=$derived(game.phase==='lobby'?'Gather your fellow imps':game.phase==='draft'?'Choose your imp':game.phase==='discard'?`Set aside ${game.round} ${game.round===1?'card':'cards'}`:game.phase==='magician'?'Exchange a card, or keep your hand':game.phase==='arcana'?game.arcana===9?'Reserve your final card':game.arcana===6||game.arcana===15?'Choose an opponent':game.arcana===2?'Read an opponent’s hand':'Exchange a card, or keep your hand':game.phase==='prebid'?'Before the bidding':game.phase==='bid'?'Make your promise':game.phase==='adjust'?'Last place may adjust their promise':game.phase==='after'?`${player(game,game.winner!).name} wins the trick`:game.phase==='play'?(game.pending?'Choose a replacement':`${player(game,game.turn).name} to play`):game.phase==='round-end'?'The round is scored':'The final bell');
 const adjustment=$derived(game.phase==='adjust'?Array.from({length:bidMax(game)+1},(_,i)=>i).filter(v=>Math.abs(v-me.bid!)<=(game.arcana===20?2:1)):game.phase==='after'&&game.winner===uid&&!me.adjusted&&[3,14].includes(game.arcana)?[me.bid!+1,...(game.arcana===14?[me.bid!-1]:[])].filter(v=>v>=0&&v<=bidMax(game)&&(game.arcana!==3||game.firstWin[uid])):[]);
 $effect(()=>{if(game.revision!==lastRevision){lastRevision=game.revision;selection=[];armed=false;}});
 function act(c:Command){if(!busy)send(c);}
 function pickCard(id:string){if(game.phase==='discard'){selection=selection.includes(id)?selection.filter(x=>x!==id):selection.length<game.round?[...selection,id]:selection;}
 else if(game.phase==='play'&&myTurn)act({type:'play',card:id,power:armed,royal,low});
 else if(['magician','arcana'].includes(game.phase)&&myTurn&&[0,1,9].includes(game.arcana))selection=[id];
 else if(game.phase==='after'&&armed&&me.imp===1)selection=[id];}
 function target(p:Player){if(p.id===uid)return;if(game.phase==='lobby'&&game.owner===uid)return;
 if(game.phase==='arcana'&&myTurn&&[2,6,15].includes(game.arcana)&&(game.arcana!==15||game.standing[uid]===Math.max(...Object.values(game.standing))))act({type:'arcana',target:p.id});
 else if(game.phase==='prebid'&&myTurn&&me.imp===7)act({type:'prebid',target:p.id});
 else if(armed&&game.phase==='play'&&me.imp===6)act({type:'shax',target:p.id});
 else if(armed&&game.phase==='after')act({type:'power',target:p.id,...(selection[0]?{card:selection[0]}:{})});}
 function roundPick(){if(game.phase==='lobby')act({type:'start'});else if(game.phase==='discard'&&selection.length===game.round)act({type:'discard',cards:selection});else if(['magician','arcana'].includes(game.phase))act({type:'arcana',...(selection[0]?{card:selection[0]}:{})});else if(game.phase==='prebid')act({type:'prebid'});else if(['round-end'].includes(game.phase))act({type:'continue'});else if(game.phase==='play'&&game.arcana===4&&!game.trick.length)royal=!royal;}
 function powerReady(){return !me.used&&((game.phase==='prebid'&&myTurn&&me.imp===7)||(game.phase==='play'&&myTurn&&[0,2,3,5,6].includes(me.imp))||(game.phase==='after'&&game.winner===uid&&[1,4,8].includes(me.imp)))||game.phase==='after'&&game.winner===uid&&me.imp===9&&!game.afterRevealed;}
 const stageDone=$derived(game.phase==='discard'&&me.done||game.phase==='draft'&&me.imp>=0||game.phase==='bid'&&me.bid!==null||game.phase==='adjust'&&(me.done||game.standing[uid]!==Math.max(...Object.values(game.standing))));
</script>
<div class="game-table" class:waiting={busy} data-phase={game.phase}>
 <div class="table-topline"><span>ROUND {game.round||'—'} / 5</span><a href={`${base}/play/?game=${roomId}`} title="Share this table">{roomId}</a><span>{game.phase==='play'||game.phase==='after'?`TRICK ${game.trickNumber} / ${game.physical}`:'HELL’S BELLS'}</span></div>
 <div class="opponent-rail">{#each game.players.filter(p=>p.id!==uid) as p (p.id)}<div class="opponent" class:active={game.turn===p.id}>
 <div class="opponent-portrait"><CardControl card={imps[p.imp>=0?p.imp:0]} back={p.imp<0} disabled={busy} label={`Choose ${p.name}`} onpick={()=>target(p)}/></div><div class="seat-caption"><b>{p.name}</b><span>{p.won} / {game.arcana===18&&game.phase==='bid'?'?':game.phase==='adjust'?game.initialBids[p.id]:p.bid??'—'} <small>TRICKS</small></span><span>{p.score} <small>POINTS</small></span></div>
 {#if p.hand.length}<div class="opponent-hand"><GameCard card={minor[0]} back/><b>{p.hand.length}</b></div>{/if}
 </div>{/each}
 {#if game.phase==='lobby'&&game.owner===uid}{#each Array(Math.max(0,game.capacity-game.players.length)) as _,i}<button class="empty-seat" onclick={()=>act({type:'bot',target:`bot-${crypto.randomUUID().slice(0,8)}`,name:['Belial','Paimon','Vassago','Orobas'][i]})} aria-label="Add a computer imp"><span>♬</span><small>Invite a friend<br/>or seat an imp</small></button>{/each}{/if}</div>
 <div class="table-middle">
 {#if game.round>0}<aside class="round-area"><div class="round-card"><CardControl card={arcana[game.arcana]} selected={royal&&game.arcana===4} label={game.phase==='play'?'Royal Command':`Resolve ${arcana[game.arcana].name}`} onpick={roundPick}/></div><span>{arcana[game.arcana].name}</span></aside>{/if}
 <section class="table-stage" aria-label={prompt} ondragover={e=>e.preventDefault()} ondrop={e=>{e.preventDefault();const id=e.dataTransfer?.getData('text/plain');if(id&&me.hand.includes(id))pickCard(id);}}>
 <p class="table-prompt" aria-live="polite">{stageDone?'Waiting for the other imps':prompt}</p>
 {#if game.led&&(game.phase==='play'||game.phase==='after')}<div class="led-announcement"><img src={`${base}/art/cards/suit-${game.led.toLowerCase()}.webp`} alt=""/><span>LED · {game.led}</span>{#if game.arcana===12}<b>{game.low?'↓ LOW WINS':'↑ HIGH WINS'}</b>{/if}{#if game.royal}<b>ROYAL COMMAND</b>{/if}{#if game.noTrump&&game.arcana!==8}<b>TRUMP SILENCED</b>{/if}</div>{/if}
 {#if game.phase==='lobby'}<div class="gather-deck"><CardControl card={arcana[0]} back disabled={game.owner!==uid||game.players.length<3||busy} label="Deal the game" onpick={roundPick}/><span>DEAL</span></div><p class="invite-note">Share the table code above. Tap an empty seat for a computer imp.</p>{#if game.owner===uid}<div class="capacity-tokens">{#each [3,4,5] as n}<ContractToken value={n} selected={game.capacity===n} disabled={n<game.players.length} label={`${n} seats`} onpick={()=>act({type:'capacity',value:n})}/>{/each}</div>{/if}
 {:else if (game.phase==='draft'&&me.imp<0)}<div class="draft-cards">{#each me.options as index}<CardControl card={imps[index]} disabled={busy} onpick={()=>act({type:'choose',value:index})}/>{/each}</div>
 {:else if (game.phase==='bid'&&me.bid===null&&(myTurn||game.arcana===18))}<div class="bid-tray">{#each allowedBids(game,uid) as value}<ContractToken {value} onpick={()=>act({type:'bid',value})}/>{/each}</div>
 {:else if (game.phase==='adjust'&&!stageDone)}<div class="bid-tray">{#each adjustment as value}<ContractToken {value} onpick={()=>act({type:'adjust',value})}/>{/each}</div>
 {:else if (['discard','magician','arcana','prebid'].includes(game.phase)&&!stageDone&&(myTurn||game.phase==='discard'))}{#if game.phase==='arcana'&&(game.arcana===6||game.arcana===15&&game.standing[uid]===Math.max(...Object.values(game.standing)))}<div class="target-cue"><img src={`${base}/art/cards/power-token.webp`} alt=""/><span>Choose an opponent’s imp</span></div>{:else}<div class="decision-pile"><CardControl card={minor[0]} back disabled={busy||(game.phase==='discard'&&selection.length!==game.round)} label={game.phase==='discard'?'Discard selected cards':'Keep hand / continue'} onpick={roundPick}/><span>{selection.length?`${selection.length} SELECTED`:game.phase==='discard'?'DISCARD':'KEEP / CONTINUE'}</span></div>{/if}
 {:else if (game.phase==='play'||game.phase==='after')}<div class="trick-table">{#each game.phase==='after'?game.lastTrick:game.trick as play}<div class="played-card" class:trick-winner={game.winner===play.player&&game.phase==='after'}><CardControl card={play.concealed&&play.player!==uid?minor[0]:cards[play.card]} back={play.concealed&&play.player!==uid} label={armed&&me.imp===5?'Recall this card':game.phase==='after'&&game.winner===uid?'Take the trick':play.concealed&&play.player!==uid?'Concealed card':cards[play.card].name} disabled={busy} onpick={()=>{if(armed&&me.imp===5&&myTurn)act({type:'recall',card:play.card});else if(game.phase==='after'&&game.winner===uid)act({type:'continue'});}}/><span>{player(game,play.player).name}</span></div>{/each}{#if !game.trick.length}<div class="lead-space"><span>♬</span></div>{/if}</div>
 {#if game.phase==='play'&&!game.trick.length&&game.arcana===12&&myTurn}<div class="direction-cards"><div><CardControl card={minor[13]} selected={!low} label="Highest wins" onpick={()=>low=false}/><span>HIGH</span></div><div><CardControl card={minor[0]} selected={low} label="Lowest wins" onpick={()=>low=true}/><span>LOW</span></div></div>{/if}
 {#if game.phase==='after'&&game.winner===uid}<div class="trick-followup">{#each adjustment as value}<ContractToken {value} label={`Adjust bid to ${value}`} onpick={()=>act({type:'adjust',value})}/>{/each}<p>Tap the trick to take it</p></div>{/if}
 {:else if (game.phase==='round-end'||game.phase==='ended')}<div class="score-ledger">{#each [...game.players].sort((a,b)=>a.score-b.score) as p}<div><span>{p.name}</span><b>{p.score}</b><small>{p.won} / {p.bid} tricks</small></div>{/each}</div>{#if game.phase==='round-end'}<div class="next-round-card"><CardControl card={arcana[game.round===4?15:game.arcana]} back label="Deal next round" onpick={roundPick}/><span>NEXT ROUND</span></div>{:else}<a data-sveltekit-reload class="new-table" href={`${base}/play/`}>Return to the belfry ↗</a>{/if}
 {/if}
 </section>
 {#if me.imp>=0}<aside class="own-imp"><CardControl card={imps[me.imp]} selected={armed} disabled={!powerReady()||busy} label={`Use ${imps[me.imp].power}`} onpick={()=>armed=!armed}/><span>{me.used&&me.imp!==9?'POWER SPENT':armed?'POWER READY':imps[me.imp].power}</span></aside>{/if}
 </div>
 <div class="own-contract"><b>{me.name}</b><span>{me.won} / {me.bid??'—'} <small>TRICKS</small></span><span>{me.score} <small>POINTS</small></span>{#if armed}<em>{me.imp===5?'Choose an earlier card':me.imp===6||game.phase==='after'||game.phase==='prebid'?'Choose an opponent':'Play a card with your power'}</em>{/if}</div>
 <div class="hand-zone" aria-label="Your hand">{#each hand as id (id)}<div class="hand-card" class:reserved={me.reserved===id} style:--hand-count={hand.length}><CardControl card={cards[id]} selected={selection.includes(id)} drag disabled={busy||stageDone||(game.phase==='play'&&(!myTurn||!legal.includes(id)))} onpick={()=>pickCard(id)}/></div>{/each}</div>
 {#if game.inspections.some(i=>i.viewer===uid)&&stowedVision!==`${game.round}:${game.inspections.filter(i=>i.viewer===uid).length}`}{@const vision=game.inspections.filter(i=>i.viewer===uid).at(-1)!}<div class="vision"><span>SEEN · {player(game,vision.target).name}</span>{#each vision.cards as id}<div><CardControl card={cards[id]} label="Stow inspected cards" onpick={()=>stowedVision=`${game.round}:${game.inspections.filter(i=>i.viewer===uid).length}`}/></div>{/each}</div>{/if}
 <div class="public-cards">{#each game.exposed.filter(id=>game.players.some(p=>p.id!==uid&&p.hand.includes(id))) as id}<div><GameCard card={cards[id]}/></div>{/each}</div>
</div>
