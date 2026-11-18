import {startRound,apply,eventFor} from '$lib/engine/engine';
import {botCommand,nextActor} from '$lib/engine/bot';
import type {State,Command} from '$lib/engine/types';
export const scenarios=[
 {id:'play',name:'Play a card · into the trick',hint:'The actual card flies from its slot into the trick; only after it lands does the fan close the gap. Scrub both stages.'},
 {id:'play-opponent',name:'Opponent plays · from under the imp',hint:'The card emerges from beneath the opponent’s imp and flies into the trick at full playing-card size.'},
 {id:'prebid',name:'Ready to Bid! · automatic',hint:'No eligible power: the transition plays and bidding opens without a confirmation.'},
 {id:'collect',name:'Collect trick · your win',hint:'Read the completed trick, gather the cards, then sweep them toward your seat.'},
 {id:'opponent',name:'Collect trick · opponent wins',hint:'The trick gathers and travels toward the winning opponent.'},
 {id:'win-decision',name:'Winning play → Empress decision',hint:'Your last card flies in, the winning trick holds, then shrinks to make room for the Empress choice. Choose a bid to collect.'},
 {id:'empress',name:'Empress · first-win decision',hint:'Playback stops at the decision. Choose KEEP or RAISE on the actual contract tokens; then replay collection.'},
 {id:'temperance',name:'Temperance · bid decision',hint:'A genuine choice stays on screen indefinitely. Choose a contract to continue.'},
 {id:'imp',name:'Imp · after-win decision',hint:'Use the imp and choose a target, or explicitly pass. The trick itself cannot dismiss this choice.'},
 {id:'seere',name:'Seere · play to keep the lead',hint:'After the decision appears, click a legal hand card to decline Seere’s power and lead it. The final-trick version never offers her power.'},
 {id:'balam',name:'Balam · before-bid decision',hint:'An eligible inspection pauses. Choose an opponent’s imp or tap the pile marked “Decline Balam’s power.”'},
 {id:'score-history',name:'Scores · round four history',hint:'Four scored rounds, with the current round highlighted. Each cell shows won / bid and the original penalty minus any recovery. Totals and readiness stay with each player.'},
 {id:'score-final',name:'Scores · completed game',hint:'The complete five-round ledger. Hover a round result to see its power and running total.'},
 {id:'score',name:'Round scoring · ready for next round',hint:'Tap the deck when you are ready. Each player’s seal appears as they ready; the next round starts when everyone is ready.'},
 {id:'round-ready',name:'Round scoring · readiness seal',hint:'Scrub the readiness seal arriving beside a player’s score. Use Ready another player to simulate the other seats.'},
 {id:'hand',name:'Full hand · 3–5 players',hint:'All cards fit in a fan. Hover or focus a card to lift it; tap or drag to play. Resize the viewport to test the fit.'},
] as const;
export function fixture(kind:string,count=3):State{if(kind==='score-history'||kind==='score-final')return historyFixture(count,kind==='score-final');let s:State|undefined;function step(actor:string,command:Command){s=apply(s,eventFor(s,actor,command,`lab-${(s?.revision??0)+1}`));}
 step('you',{type:'create',name:'You',capacity:count,seed:'animation-lab-4'});for(let i=1;i<count;i++)step(`seat-${i}`,{type:'join',name:['Belial','Paimon','Vassago','Orobas'][i-1]});step('you',{type:'start'});
 for(let i=0;i<1000&&s!.phase!=='play';i++){const actor=nextActor(s!)!;step(actor,botCommand(s!,actor));}
 const state=s!;state.players.forEach((p,i)=>{p.imp=i===0?2:0;p.used=false;});
 if(kind==='prebid'||kind==='balam'){state.phase='prebid';state.turn='you';state.players.forEach(p=>{p.bid=null;p.done=false;});if(kind==='balam')state.players[0].imp=7;}
 else if(kind!=='hand'){
 if(kind==='play'||kind==='play-opponent'){const actor=kind==='play'?'you':'seat-1';s!.turn=actor;s!.leader=actor;s!.arcana=1;const hand=[...s!.players.find(p=>p.id===actor)!.hand].sort((a,b)=>a.localeCompare(b));step(actor,{type:'play',card:hand[Math.floor(hand.length/2)]});return s!;}
 for(let i=0;i<count;i++){const actor=nextActor(s!)!;step(actor,botCommand(s!,actor));}
 s!.winner=kind==='opponent'?'seat-1':'you';s!.turn=s!.winner;s!.players.forEach(p=>{p.won=p.id===s!.winner?1:0;});s!.firstWin={you:true};s!.players[0].bid=4;
 if(kind==='empress'||kind==='win-decision')s!.arcana=3;else if(kind==='temperance')s!.arcana=14;else s!.arcana=1;
 if(kind==='imp')s!.players[0].imp=4;if(kind==='seere')s!.players[0].imp=8;
 }
 if(kind==='win-decision'){const own=s!.lastTrick.find(p=>p.player==='you')!,strong=s!.lastTrick.reduce((a,b)=>Number(a.card.split('-')[1])>Number(b.card.split('-')[1])?a:b);[own.card,strong.card]=[strong.card,own.card];s!.lastTrick=[...s!.lastTrick.filter(p=>p.player!=='you'),own];s!.trick=s!.lastTrick.map(p=>({...p}));}
 if(kind==='hand'){s!.turn='you';s!.leader='you';s!.arcana=1;}
 if(kind==='score'||kind==='round-ready'){for(let i=0;i<300&&s!.phase!=='round-end';i++){const actor=nextActor(s!)!;step(actor,botCommand(s!,actor));}}
 if(kind==='round-ready')step('seat-1',{type:'continue',value:1});
 return s!;
}

function historyFixture(count:number,final:boolean):State{
 let s=fixture('hand',count);s.round=0;s.history=[];s.remaining=Array.from({length:15},(_,i)=>i);for(const p of s.players){p.score=0;p.penalties=[];p.recoveries=[];}startRound(s,10);
 for(let n=0;n<5000;n++){if(final?s.phase==='ended':s.phase==='round-end'&&s.round===4)return s;const actor=nextActor(s);if(!actor)break;s=apply(s,eventFor(s,actor,botCommand(s,actor)));}
 throw Error('Could not prepare score history');
}
