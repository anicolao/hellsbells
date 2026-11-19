<script lang="ts">
 import {onMount,tick,untrack} from 'svelte';
 import {base} from '$app/paths';
 import {imps,arcana,minor,type GameCard as Card} from '$lib/data/game';
 import type {State,Command,Player} from '$lib/engine/types';
 import {cards,available,legalCards,player,allowedBids,bidMax} from '$lib/engine/engine';
 import {nextActor} from '$lib/engine/bot';
 import GameCard from '../GameCard.svelte';
 import CardControl from './CardControl.svelte';
 import ScoreHistory from './ScoreHistory.svelte';
 import TrickStack from './TrickStack.svelte';
 import CollectTrick from './CollectTrick.svelte';
 import FlyingCard from './FlyingCard.svelte';
 import HandFan from './HandFan.svelte';
 import {seereCanLead,seereLeadCards,decisionDuration,decisionStages,displayedWon,collectionLanding,cardPlayDuration,flightEnd,type CardBox,remainingBalance,adjustments,afterPower,automaticCommand,transitionDuration,collectionPose} from './presentation';
 import ContractToken from './ContractToken.svelte';
 let {game,uid,busy,send,roomId,labProgress=null,onDecline,labArrival=null,labDecision=null,labReady=null,labReadyPlayer=null}:{game:State;uid:string;busy:boolean;send:(c:Command)=>void;roomId:string;labProgress?:number|null;onDecline?:()=>void;labArrival?:number|null;labDecision?:number|null;labReady?:number|null;labReadyPlayer?:string|null}=$props();
 let mounted=$state(false);
 let playedWidth=$state(100),tableWidth=$state(1400),playAreaHeight=$state(300),stageWidth=$state(800);
 let tableHeight=$state(800),arrival=$state(1);
 let tableElement:HTMLDivElement;
 let flight=$state<{card:string;back:boolean;from:CardBox;to:CardBox}|null>(null),previousHand=$state<string[]|null>(null);
 let arrivalKey='',initialized=false;
 const latestPlay=$derived((game.phase==='after'?game.lastTrick:game.trick).at(-1));
 const playKey=$derived(latestPlay?`${game.round}:${game.trickNumber}:${latestPlay.player}:${latestPlay.card}`:'');
 const playProgress=$derived(labArrival??arrival);
 const labMode=$derived(labArrival!==null);
 function box(element:HTMLElement):CardBox{const r=element.getBoundingClientRect();let angle=0,scale=1;for(let node:HTMLElement|null=element;node&&node!==tableElement;node=node.parentElement){const matrix=new DOMMatrix(getComputedStyle(node).transform);angle+=Math.atan2(matrix.b,matrix.a)*180/Math.PI+(parseFloat(getComputedStyle(node).rotate)||0);scale*=Math.hypot(matrix.a,matrix.b)*(parseFloat(getComputedStyle(node).scale)||1);}return {x:r.left+r.width/2-element.offsetWidth*scale/2,y:r.top+r.height/2-element.offsetHeight*scale/2,width:element.offsetWidth*scale,height:element.offsetHeight*scale,angle};}
 function targetBox(){const element=tableElement?.querySelector<HTMLElement>(`[data-trick-card="${latestPlay?.card}"] .game-card`);return element?box(element):null;}
 $effect.pre(()=>{if(!mounted||labMode)return;const key=playKey;let frame=0,cancelled=false;untrack(()=>{
  if(!initialized){initialized=true;arrivalKey=key;return;}if(key===arrivalKey)return;arrivalKey=key;if(!key||!latestPlay){arrival=1;flight=null;previousHand=null;return;}
  const own=latestPlay.player===uid;
  let source=tableElement?.querySelector<HTMLElement>(own?`[data-fan-card="${latestPlay.card}"] .game-card`:`[data-seat="${latestPlay.player}"] .opponent-portrait .game-card`);
  if(!own&&(!source||!source.offsetWidth))source=tableElement?.querySelector<HTMLElement>(`[data-seat="${latestPlay.player}"] .opponent-portrait .game-card`);
  if(!source)return;
  const from=box(source),card=latestPlay.card,back=latestPlay.concealed;
  previousHand=own?[...tableElement.querySelectorAll<HTMLElement>('[data-fan-card]')].map(e=>e.dataset.fanCard!):null;
  arrival=0;flight={card,back,from,to:from};
  void tick().then(()=>{if(cancelled)return;const to=targetBox();if(!to){arrival=1;flight=null;return;}flight={card,back,from,to};const started=performance.now();function step(now:number){if(cancelled)return;arrival=Math.min(1,(now-started)/cardPlayDuration);if(arrival<1)frame=requestAnimationFrame(step);else{flight=null;previousHand=null;}}frame=requestAnimationFrame(step);});
 });return()=>{cancelled=true;cancelAnimationFrame(frame);};});
 $effect(()=>{if(!mounted||!labMode)return;const key=playKey,size=cardSize,area=stageWidth,height=tableHeight,width=tableWidth;untrack(()=>{if(!latestPlay||!key)return;const own=latestPlay.player===uid;previousHand=own?[...hand,latestPlay.card].sort((a,b)=>cards[a].suit.localeCompare(cards[b].suit)||cards[a].rank-cards[b].rank):null;void tick().then(()=>{const source=tableElement?.querySelector<HTMLElement>(own?`[data-fan-card="${latestPlay?.card}"] .game-card`:`[data-seat="${latestPlay?.player}"] .opponent-portrait .game-card`);const to=targetBox();if(source&&to&&latestPlay)flight={card:latestPlay.card,back:latestPlay.concealed,from:box(source),to};});});});
 let progress=$state(0),passed=$state(-1),queuedLead=$state<Command|null>(null);
 onMount(()=>{mounted=true;});
 const automatic=$derived(passed===game.revision&&game.phase==='after'?(queuedLead??{type:'continue'}) as Command:automaticCommand(game,game.phase==='round-end'?game.owner:game.turn));
 const needsDecision=$derived(game.phase==='after'&&!automatic);
 const decisionKey=$derived(game.phase==='after'?`${game.round}:${game.trickNumber}:${game.winner}`:'');
 let decisionProgress=$state(0),presentedKey=$state('');
 let introductionKey='';
 $effect(()=>{if(!mounted||!needsDecision)return;presentedKey=decisionKey;});
 $effect(()=>{if(!mounted||!needsDecision||labDecision!==null||arrival<1)return;const key=decisionKey;let frame=0;untrack(()=>{if(introductionKey===key)return;introductionKey=key;decisionProgress=0;const started=performance.now();function step(now:number){decisionProgress=Math.min(1,(now-started)/decisionDuration);if(decisionProgress<1)frame=requestAnimationFrame(step);}frame=requestAnimationFrame(step);});return()=>cancelAnimationFrame(frame);});
 const decisionTime=$derived(needsDecision?(labDecision??decisionProgress):presentedKey===decisionKey?1:0);
 const decisionMotion=$derived(decisionStages(decisionTime));
 const compactTrick=$derived(game.phase==='after'&&(needsDecision||presentedKey===decisionKey));
 const decisionReady=$derived(!needsDecision||decisionMotion.ready);
 const moving=$derived(queuedLead?progress:labProgress??progress);
 const collecting=$derived(game.phase==='after'&&!!automatic&&arrival>=1);
 let collection=$state<{sources:{card:string;box:CardBox}[];target:CardBox}|null>(null);
 $effect(()=>{if(!mounted||!collecting){collection=null;return;}const winner=game.winner;const width=tableWidth,height=tableHeight;void tick().then(()=>{const target=tableElement?.querySelector<HTMLElement>(`.trick-stack[data-player="${winner}"] .game-card`);if(!target)return;const sources=[...tableElement.querySelectorAll<HTMLElement>('[data-trick-card]')].map(element=>({card:element.dataset.trickCard!,box:box(element.querySelector<HTMLElement>('.game-card')!)}));if(sources.length)collection={sources,target:box(target)};});});
 function won(id:string){return displayedWon(game,id,moving,collecting);}
 function visibleBid(p:Player){return game.arcana===18&&game.phase==='bid'&&p.id!==uid?'?':game.phase==='adjust'?game.initialBids[p.id]:p.bid??'—';}

 $effect(()=>{if(!mounted||labProgress!==null&&!queuedLead||!automatic||busy||arrival<1)return;const revision=game.revision,phase=game.phase;progress=0;let frame=0;const start=performance.now();function step(now:number){progress=Math.min(1,(now-start)/(queuedLead?600:transitionDuration(phase)));if(progress<1)frame=requestAnimationFrame(step);else if(game.revision===revision&&(phase==='round-end'?game.owner:game.turn)===uid)send(automatic!);}frame=requestAnimationFrame(step);return()=>cancelAnimationFrame(frame);});
 let selection=$state<string[]>([]),armed=$state(false),low=$state(false),royal=$state(false),lastRevision=$state(0),stowedVision=$state('');
 const me=$derived(player(game,uid));
 const myTurn=$derived(game.turn===uid);
 const canAct=$derived(!busy&&(myTurn||['draft','discard','adjust'].includes(game.phase)||game.phase==='bid'&&game.arcana===18));
 const hand=$derived([...me.hand].sort((a,b)=>cards[a].suit.localeCompare(cards[b].suit)||cards[a].rank-cards[b].rank));
 const mayLead=$derived(seereCanLead(game,uid));
 const legal=$derived(game.phase==='play'?legalCards(game,uid,game.pending?.original,armed&&me.imp===0||game.forced.includes(uid)):mayLead?seereLeadCards($state.snapshot(game),uid):[]);
 const prompt=$derived(game.phase==='lobby'?'Gather your fellow imps':game.phase==='draft'?'Choose your imp':game.phase==='discard'?`Discard ${game.round} ${game.round===1?'card':'cards'}`:game.phase==='magician'?'Exchange a card, or keep your hand':game.phase==='arcana'?game.arcana===9?'Reserve your final card':game.arcana===6||game.arcana===15?'Choose an opponent':game.arcana===2?'Read an opponent’s hand':'Exchange a card, or keep your hand':game.phase==='prebid'?'Ready to Bid!':game.phase==='bid'?'Make your promise':game.phase==='adjust'?'Last place may adjust their promise':game.phase==='after'?game.winner===uid?'You win the trick':`${player(game,game.winner!).name} wins the trick`:game.phase==='play'?(game.pending?'Choose a replacement':`${player(game,game.turn).name} to play`):game.phase==='round-end'?'The round is scored':'The final bell');
 const cardSize=$derived(Math.max(28,Math.min(220,tableWidth*.23,(playAreaHeight-76)/1.6)));
 const trickGap=$derived(tableWidth<800?5:20);
 const trickOverlap=$derived(Math.max(0,(cardSize*game.players.length+trickGap*(game.players.length-1)-stageWidth)/Math.max(1,game.players.length-1)));
 const adjustment=$derived(game.phase==='adjust'?Array.from({length:bidMax(game)+1},(_,i)=>i).filter(v=>Math.abs(v-me.bid!)<=(game.arcana===20?2:1)):adjustments(game,uid));
 $effect(()=>{if(game.revision!==lastRevision){lastRevision=game.revision;selection=[];armed=false;queuedLead=null;}});
 function decline(){if(!decisionReady)return;if(onDecline)onDecline();else passed=game.revision;}
 function act(c:Command){if(!busy&&!queuedLead&&playProgress>=1&&decisionReady)send(c);}
 function pickCard(id:string){if(game.phase==='discard'){selection=selection.includes(id)?selection.filter(x=>x!==id):selection.length<game.round?[...selection,id]:selection;}
 else if(mayLead&&legal.includes(id)&&!busy&&playProgress>=1){queuedLead={type:'continue',card:id,royal,low};selection=[id];armed=false;progress=0;passed=game.revision;}
 else if(game.phase==='play'&&myTurn)act({type:'play',card:id,power:armed,royal,low});
 else if(['magician','arcana'].includes(game.phase)&&myTurn&&[0,1,9].includes(game.arcana))selection=[id];
 else if(game.phase==='after'&&armed&&me.imp===1)selection=[id];}
 function addBot(policy:'easy'|'rl-v2'){act({type:'bot',value:policy==='rl-v2'?2:0,target:`bot-${crypto.randomUUID().slice(0,8)}`,name:['Belial','Paimon','Vassago','Orobas'][game.players.length-1]});}
 function target(p:Player){if(p.id===uid)return;if(game.phase==='lobby'&&game.owner===uid)return;
 if(game.phase==='arcana'&&myTurn&&[2,6,15].includes(game.arcana)&&(game.arcana!==15||game.standing[uid]===Math.max(...Object.values(game.standing))))act({type:'arcana',target:p.id});
 else if(game.phase==='prebid'&&myTurn&&me.imp===7)act({type:'prebid',target:p.id});
 else if(armed&&game.phase==='play'&&me.imp===6)act({type:'shax',target:p.id});
 else if(armed&&game.phase==='after')act({type:'power',target:p.id,...(selection[0]?{card:selection[0]}:{})});}
 function roundPick(){if(game.phase==='lobby')act({type:'start'});else if(game.phase==='discard'&&selection.length===game.round)act({type:'discard',cards:selection});else if(['magician','arcana'].includes(game.phase))act({type:'arcana',...(selection[0]?{card:selection[0]}:{})});else if(game.phase==='prebid')act({type:'prebid'});else if(game.phase==='round-end'&&!me.done)act({type:'continue',value:1});else if(game.phase==='play'&&game.arcana===4&&!game.trick.length)royal=!royal;}
 function powerReady(){return !me.used&&((game.phase==='prebid'&&myTurn&&me.imp===7)||(game.phase==='play'&&myTurn&&[0,2,3,5,6].includes(me.imp))||afterPower(game,uid))||game.phase==='after'&&game.winner===uid&&me.imp===9&&!game.afterRevealed;}
 const stageDone=$derived(game.phase==='discard'&&me.done||game.phase==='draft'&&me.imp>=0||game.phase==='bid'&&me.bid!==null||game.phase==='adjust'&&(me.done||game.standing[uid]!==Math.max(...Object.values(game.standing))));
</script>
<div bind:this={tableElement} bind:clientHeight={tableHeight} bind:clientWidth={tableWidth} style:--table-height={`${tableHeight}px`} style:--play-card-width={`${cardSize}px`} style:--trick-overlap={`${trickOverlap}px`} style:--trick-gap={`${trickGap}px`} class="game-table" class:waiting={busy} class:auto-transition={!!automatic} class:has-decision={game.phase==='after'&&!automatic} class:playing-trick={game.phase==='play'||game.phase==='after'} class:decision-trick={compactTrick} style:--decision-shrink={decisionMotion.shrink} style:--decision-reveal={decisionMotion.reveal} style:--motion={moving} data-phase={game.phase} data-arcana={game.arcana}>
 <div class="table-topline"><span>ROUND {game.round||'—'} / 5</span><a href={`${base}/play/?game=${roomId}`} title="Share this table">{roomId}</a><div class="trick-status"><span>{game.phase==='play'||game.phase==='after'?`TRICK ${game.trickNumber} / ${game.physical}`:'HELL’S BELLS'}</span>{#if ['play','after','adjust'].includes(game.phase)}{@const balance=remainingBalance(game)}<span class="bid-balance" aria-label={`${balance.label}: ${balance.needed} tricks still needed for bids, ${balance.tricks} tricks left`}>{balance.label} · {balance.tricks} LEFT</span>{/if}</div></div>
 <div class="opponent-rail">{#each game.players.filter(p=>p.id!==uid) as p (p.id)}<div data-seat={p.id} data-bot-policy={p.botPolicy??'human'} class="opponent" class:active={game.turn===p.id}>
 <div class="opponent-portrait"><CardControl card={imps[p.imp>=0?p.imp:0]} back={p.imp<0} disabled={busy||!!queuedLead} label={`Choose ${p.name}`} onpick={()=>target(p)}/></div><div class="seat-caption"><b>{p.name}{#if p.botPolicy==='rl-v1'||p.botPolicy==='rl-v2'}<small class="bot-kind">TRAINED</small>{/if}</b><span>{p.score} <small>POINTS</small></span></div>
 {#if game.round>0}<div class="opponent-tricks"><TrickStack playerId={p.id} name={p.name} won={won(p.id)} bid={visibleBid(p)} landed={collecting&&game.winner===p.id&&moving>=collectionLanding}/></div>{/if}
 </div>{/each}
 {#if game.phase==='lobby'&&game.owner===uid}{#each Array(Math.max(0,game.capacity-game.players.length)) as _,i}<div class="empty-seat"><span>♬</span><small>OPEN SEAT</small></div>{/each}{/if}</div>
 <div class="table-middle" bind:clientHeight={playAreaHeight}>
 {#if game.round>0}<aside class="round-area"><div class="round-card"><CardControl card={arcana[game.arcana]} selected={royal&&game.arcana===4} label={game.phase==='play'?'Royal Command':`Resolve ${arcana[game.arcana].name}`} onpick={roundPick}/></div><span>{arcana[game.arcana].name}</span></aside>{/if}
 <section bind:clientWidth={stageWidth} class="table-stage" aria-label={prompt} ondragover={e=>e.preventDefault()} ondrop={e=>{e.preventDefault();const id=e.dataTransfer?.getData('text/plain');if(id&&me.hand.includes(id))pickCard(id);}}>
 {#if automatic&&game.phase!=='after'&&game.phase!=='round-end'}<div class="phase-ripple" style:opacity={Math.sin(moving*Math.PI)}></div>{/if}
 <p class="table-prompt" aria-live="polite">{stageDone?'Waiting for the other imps':prompt}</p>
 {#if game.led&&(game.phase==='play'||game.phase==='after')}<div class="led-announcement"><img src={`${base}/art/cards/suit-${game.led.toLowerCase()}.webp`} alt=""/><span>LED · {game.led}</span>{#if game.arcana===12}<b>{game.low?'↓ LOW WINS':'↑ HIGH WINS'}</b>{/if}{#if game.royal}<b>ROYAL COMMAND</b>{/if}{#if game.noTrump&&game.arcana!==8}<b>TRUMP SILENCED</b>{/if}</div>{/if}
 {#if game.phase==='lobby'}<div class="lobby-decks">
 {#if game.owner===uid&&game.players.length<game.capacity}<figure><CardControl card={imps[0]} back disabled={busy} label="Seat an easy imp" onpick={()=>addBot('easy')}/><figcaption>EASY IMP</figcaption></figure>{/if}
 <figure><CardControl card={arcana[0]} back disabled={game.owner!==uid||game.players.length<3||busy} label="Deal the game" onpick={roundPick}/><figcaption>DEAL</figcaption></figure>
 {#if game.owner===uid&&game.players.length<game.capacity}<figure><CardControl card={arcana[15]} back disabled={busy||game.capacity!==3} label="Seat a trained imp" onpick={()=>addBot('rl-v2')}/><figcaption>TRAINED IMP<small>3 PLAYERS ONLY</small></figcaption></figure>{/if}
 </div><p class="invite-note">Share the table code to invite friends.{#if game.owner===uid&&game.players.length<game.capacity}{' '}Choose an imp to fill an open seat.{/if}</p>{#if game.owner===uid}<div class="capacity-tokens">{#each [3,4,5] as n}<ContractToken value={n} selected={game.capacity===n} disabled={n<game.players.length||n!==3&&game.players.some(p=>p.botPolicy==='rl-v1'||p.botPolicy==='rl-v2')} label={`${n} seats`} onpick={()=>act({type:'capacity',value:n})}/>{/each}</div>{/if}
 {:else if (game.phase==='draft'&&me.imp<0)}<div class="draft-cards">{#each me.options as index}<CardControl card={imps[index]} disabled={busy} onpick={()=>act({type:'choose',value:index})}/>{/each}</div>
 {:else if game.phase==='draft'&&me.imp>=0}<div class="draft-cards chosen-imp"><GameCard card={imps[me.imp]}/></div>
 {:else if (game.phase==='bid'&&me.bid===null&&(myTurn||game.arcana===18))}<div class="bid-tray">{#each allowedBids(game,uid) as value}<ContractToken {value} onpick={()=>act({type:'bid',value})}/>{/each}</div>
 {:else if (game.phase==='adjust'&&!stageDone)}<div class="bid-tray">{#each adjustment as value}<ContractToken {value} onpick={()=>act({type:'adjust',value})}/>{/each}</div>
 {:else if (['discard','magician','arcana','prebid'].includes(game.phase)&&!automatic&&!stageDone&&(myTurn||game.phase==='discard'))}{#if game.phase==='arcana'&&(game.arcana===6||game.arcana===15&&game.standing[uid]===Math.max(...Object.values(game.standing)))}<div class="target-cue"><img src={`${base}/art/cards/power-token.webp`} alt=""/><span>Choose an opponent’s imp</span></div>{:else}<div class="decision-pile"><CardControl card={minor[0]} back disabled={busy||(game.phase==='discard'&&selection.length!==game.round)} label={game.phase==='discard'?'Discard selected cards':game.phase==='prebid'&&me.imp===7?'Decline Balam’s power':'Keep hand / continue'} onpick={roundPick}/><span>{game.phase==='prebid'&&me.imp===7?'DECLINE BALAM’S POWER':selection.length?`${selection.length} SELECTED`:game.phase==='discard'?'DISCARD':'KEEP / CONTINUE'}</span></div>{/if}
 {:else if (game.phase==='play'||game.phase==='after')}<div class="trick-table">{#each game.phase==='after'?game.lastTrick:game.trick as play,i}{@const pose=collectionPose(0,i,(game.phase==='after'?game.lastTrick:game.trick).length,game.winner===uid,playedWidth+(tableWidth<800?5:20))}<div data-trick-card={play.card} bind:clientWidth={playedWidth} class="played-card" style:translate={`${pose.x}px ${pose.y}px`} style:scale={pose.scale} style:rotate={`${pose.rotate}deg`} style:opacity={(collecting&&collection?0:1)*pose.opacity*(flight?.card===play.card&&playProgress<flightEnd?0:1)} class:trick-winner={game.winner===play.player&&game.phase==='after'}><CardControl card={play.concealed&&play.player!==uid?minor[0]:cards[play.card]} back={play.concealed&&play.player!==uid} label={armed&&me.imp===5?'Recall this card':play.concealed&&play.player!==uid?'Concealed card':cards[play.card].name} disabled={busy} onpick={()=>{if(armed&&me.imp===5&&myTurn)act({type:'recall',card:play.card});}}/><span>{player(game,play.player).name}</span></div>{/each}{#if !game.trick.length}<div class="lead-space"><span>♬</span></div>{/if}</div>
 {#if game.phase==='play'&&!game.trick.length&&game.arcana===12&&myTurn}<div class="direction-cards"><div><CardControl card={minor[13]} selected={!low} label="Highest wins" onpick={()=>low=false}/><span>HIGH</span></div><div><CardControl card={minor[0]} selected={low} label="Lowest wins" onpick={()=>low=true}/><span>LOW</span></div></div>{/if}
 {#if game.phase==='after'&&!automatic}{#if game.winner===uid}<div class="trick-followup decision-followup" inert={!decisionReady} data-decision-ready={decisionReady}>{#if adjustment.length}<p>{game.arcana===3?'The Empress · your first win':'Temperance'} — choose your bid</p><div class="contract-choices"><figure><ContractToken value={me.bid!} label={`Keep bid at ${me.bid}`} onpick={decline}/><figcaption>KEEP {me.bid}</figcaption></figure>{#each adjustment as value}<figure><ContractToken {value} label={`Adjust bid to ${value}`} onpick={()=>act({type:'adjust',value})}/><figcaption>{value>me.bid!?'RAISE':'LOWER'} TO {value}</figcaption></figure>{/each}</div>{:else}<p>{mayLead?'Choose the next leader, or play a card to lead':'Use your imp, or pass'}</p><ContractToken value={me.bid!} label="Pass imp power" onpick={decline}/><span>PASS POWER</span>{/if}</div>{:else}<p class="decision-wait">{player(game,game.winner!).name} is choosing</p>{/if}{/if}
 {:else if (game.phase==='round-end'||game.phase==='ended')}<ScoreHistory {game} {uid} {labReady} {labReadyPlayer}/>{#if game.phase==='round-end'}<div class="next-round-card ready-deck"><CardControl card={arcana[game.round===4?15:game.arcana]} back selected={me.done} disabled={busy||me.done} label={me.done?'You are ready':'Ready for next round'} onpick={roundPick}/><span>{game.players.every(p=>p.done)?'EVERYONE READY':me.done?'WAITING FOR THE OTHER IMPS':'READY FOR NEXT ROUND'}</span></div>{:else}<a data-sveltekit-reload class="new-table" href={`${base}/play/`}>Return to the belfry ↗</a>{/if}
 {/if}
 </section>
 {#if me.imp>=0}<aside class="own-imp"><div class="imp-portrait"><CardControl card={imps[me.imp]} selected={armed} disabled={!powerReady()||busy||!!queuedLead||!decisionReady} label={`Use ${imps[me.imp].power}`} onpick={()=>armed=!armed}/><span>{me.used&&me.imp!==9?'POWER SPENT':armed?'POWER READY':imps[me.imp].power}</span></div>{#if game.round>0}<div class="own-player-status"><b class="own-name">{me.name}</b><div class="own-tricks"><TrickStack playerId={uid} name={me.name} won={won(uid)} bid={visibleBid(me)} landed={collecting&&game.winner===uid&&moving>=collectionLanding}/></div><span class="own-points">{me.score} <small>POINTS</small></span></div>{/if}</aside>{/if}
 </div>
 {#if armed}<p class="power-cue">{me.imp===5?'Choose an earlier card':me.imp===6||game.phase==='after'||game.phase==='prebid'?'Choose an opponent':'Play a card with your power'}</p>{/if}
 <HandFan {cardSize} {previousHand} {playProgress} compact={game.phase==='after'&&!automatic} {hand} {selection} reserved={me.reserved} disabled={id=>busy||!!queuedLead||playProgress<1||stageDone||(mayLead&&!legal.includes(id))||(game.phase==='play'&&(!myTurn||!legal.includes(id)))} onpick={pickCard}/>
 {#if game.inspections.some(i=>i.viewer===uid)&&stowedVision!==`${game.round}:${game.inspections.filter(i=>i.viewer===uid).length}`}{@const vision=game.inspections.filter(i=>i.viewer===uid).at(-1)!}<div class="vision"><span>SEEN · {player(game,vision.target).name}</span>{#each vision.cards as id}<div><CardControl card={cards[id]} label="Stow inspected cards" onpick={()=>stowedVision=`${game.round}:${game.inspections.filter(i=>i.viewer===uid).length}`}/></div>{/each}</div>{/if}
 {#if collecting&&collection}<CollectTrick sources={collection.sources} target={collection.target} progress={moving}/>{/if}
 {#if flight}<FlyingCard card={cards[flight.card]} from={flight.from} to={flight.to} back={flight.back} progress={playProgress}/>{/if}
 <div class="public-cards">{#each game.exposed.filter(id=>game.players.some(p=>p.id!==uid&&p.hand.includes(id))) as id}<div><GameCard card={cards[id]}/></div>{/each}</div>
</div>
