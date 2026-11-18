import {minor,arcana as roundCards} from '../data/game';
import type {State,Player,Command,Event,Play} from './types';
export const cards=Object.fromEntries(minor.map(c=>[c.id,c]));
function requireRule(ok:unknown,message:string):asserts ok{if(!ok)throw Error(message);}
export function hash(seed:string){let x=2166136261;for(const c of seed)x=Math.imul(x^c.charCodeAt(0),16777619);return x>>>0||1;}
export function random(s:State,max:number){s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return Math.floor(s.rng/4294967296*max);}
function shuffled<T>(s:State,items:T[]){const a=[...items];for(let i=a.length-1;i>0;i--){const j=random(s,i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
export function player(s:State,id:string){const p=s.players.find(p=>p.id===id);requireRule(p,'Unknown player');return p;}
export function clockwise(s:State,id:string){return s.players[(s.players.findIndex(p=>p.id===id)+1)%s.players.length].id;}
export function order(s:State,from=s.dealer){const a:string[]=[];let id=from;for(let i=0;i<s.players.length;i++){id=clockwise(s,id);a.push(id);}return a;}
export function available(s:State,p:Player){return p.hand.filter(id=>id!==p.reserved||s.trickNumber===s.physical);}
export function trump(s:State){return roundCards[s.arcana].suit;}
export function bidMax(s:State){return s.physical+(s.arcana===13?1:0);}
function newPlayer(id:string,name:string,bot=false):Player{return {id,name,bot,options:[],imp:-1,hand:[],discard:[],reserved:null,bid:null,won:0,score:0,penalties:[],recoveries:[],used:false,adjusted:false,choice:null,done:false};}
export function createState(actor:string,c:Command):State{
 requireRule(c.type==='create'&&c.seed&&[3,4,5].includes(c.capacity??4),'Invalid creation');
 return {version:1,revision:1,owner:actor,capacity:c.capacity??4,phase:'lobby',players:[newPlayer(actor,c.name?.trim()||'Bell-ringer')],rng:hash(c.seed),round:0,dealer:actor,arcana:0,remaining:Array.from({length:15},(_,i)=>i),reserve:[],physical:0,trickNumber:0,turn:actor,leader:actor,led:null,trick:[],lastTrick:[],winner:null,nextLeader:null,noTrump:false,low:false,royal:false,forced:[],changedSuit:false,pending:null,exposed:[],inspections:[],standing:{},initialBids:{},firstWin:{},afterRevealed:false,history:[]};
}
function resetDone(s:State){for(const p of s.players)p.done=false;}
function nextStagePlayer(s:State,phase:State['phase']){const next=order(s).find(id=>!player(s,id).done);if(next){s.turn=next;return;}resetDone(s);s.phase=phase;s.turn=clockwise(s,s.dealer);}
function beginPrebid(s:State){resetDone(s);s.phase='prebid';s.turn=clockwise(s,s.dealer);}
function afterDiscards(s:State){resetDone(s);if([0,2,6,9,15].includes(s.arcana)){s.phase='arcana';s.turn=clockwise(s,s.dealer);}else beginPrebid(s);}
export function startRound(s:State,forcedArcana?:number){
 s.round++;s.arcana=forcedArcana??(s.round===5?15+random(s,7):s.remaining[random(s,s.remaining.length)]);s.remaining=s.remaining.filter(a=>a!==s.arcana);
 const deck=shuffled(s,minor.map(c=>c.id));const dealt=Math.floor((56-s.players.length)/s.players.length);s.reserve=deck.slice(dealt*s.players.length);s.physical=dealt-s.round;s.trickNumber=1;s.trick=[];s.lastTrick=[];s.completedTricks=[];s.winner=null;s.pending=null;s.exposed=[];s.inspections=[];s.firstWin={};s.initialBids={};s.standing=Object.fromEntries(s.players.map(p=>[p.id,p.score]));
 for(const [i,p] of s.players.entries()){p.hand=deck.slice(i*dealt,(i+1)*dealt);p.discard=[];p.reserved=null;p.bid=null;p.won=0;p.used=false;p.adjusted=false;p.choice=null;p.done=false;}
 s.phase=s.arcana===1?'magician':'discard';s.turn=clockwise(s,s.dealer);s.leader=s.turn;
}
function beginTrick(s:State){s.phase='play';s.turn=s.nextLeader??s.winner??clockwise(s,s.dealer);s.leader=s.turn;s.nextLeader=null;s.trick=[];s.led=null;s.royal=false;s.low=false;s.noTrump=s.arcana===8;s.changedSuit=false;s.forced=[];s.afterRevealed=false;s.pending=null;}
export function legalCards(s:State,id:string,exclude?:string,ignore=false):string[]{
 const p=player(s,id);let hand=available(s,p).filter(c=>c!==exclude);if(ignore)return hand;
 const leading=s.pending?s.pending.index===0&&!s.changedSuit:s.trick.length===0;
 if(!leading&&s.led){const follow=hand.filter(c=>cards[c].suit===s.led);if(follow.length)hand=follow;else if(s.arcana===5){const tr=hand.filter(c=>cards[c].suit===trump(s));if(tr.length)hand=tr;}}
 if(leading&&s.arcana===7&&s.winner===id){const max=Math.max(...hand.map(c=>cards[c].rank));hand=hand.filter(c=>cards[c].rank===max);}
 if(!leading&&s.royal)hand=hand.filter(c=>!hand.some(other=>cards[other].suit===cards[c].suit&&cards[other].rank>cards[c].rank));
 return hand;
}
export function trickWinner(s:State,plays=s.trick){const effectiveTrump=!s.noTrump&&plays.some(p=>cards[p.card].suit===trump(s));const suit=effectiveTrump?trump(s):s.led;const eligible=plays.filter(p=>cards[p.card].suit===suit);requireRule(eligible.length,'No eligible winner');return eligible.reduce((a,b)=>(s.low?cards[b.card].rank<cards[a.card].rank:cards[b.card].rank>cards[a.card].rank)?b:a).player;}
function award(s:State){s.winner=trickWinner(s);s.lastTrick=s.trick.map(p=>({...p,concealed:false}));(s.completedTricks??=[]).push(s.lastTrick.map(p=>({...p}))); const p=player(s,s.winner);const first=p.won===0;p.won+=s.arcana===13&&s.trickNumber===s.physical?2:1;s.firstWin[p.id]=first;s.phase='after';s.turn=p.id;}
function inspect(s:State,viewer:string,target:string,count:number){requireRule(target!==viewer,'Choose an opponent');const p=player(s,target);s.inspections.push({viewer,target,cards:shuffled(s,available(s,p)).slice(0,count)});}
export function scoreRound(s:State){
 const penalties:Record<string,number>={},recoveries:Record<string,number>={};const totals=Object.values(s.standing);const best=Math.min(...totals),worst=Math.max(...totals);const cutoff=[...totals].sort((a,b)=>b-a)[Math.floor(s.players.length/2)-1];
 for(const p of s.players){const error=p.won-p.bid!;let cost=s.round*Math.abs(error);if(s.arcana===11&&error<0)cost*=2;if(s.arcana===16&&s.standing[p.id]===best)cost*=2;if(s.arcana===17&&s.standing[p.id]>=cutoff&&Math.abs(error)===1)cost=0;penalties[p.id]=cost;}
 for(const p of s.players){let recovery=0;const exact=p.won===p.bid;if(s.arcana===6&&exact&&p.choice&&player(s,p.choice).won===player(s,p.choice).bid)recovery=2;if(s.arcana===10&&exact)recovery=1;if(s.arcana===15&&s.standing[p.id]===worst&&p.choice)recovery=Math.floor(penalties[p.choice]/2);if(s.arcana===19&&exact)recovery=s.standing[p.id]===worst?10:5;if(s.arcana===21&&exact)recovery=Math.max(0,...p.penalties.slice(0,4));recoveries[p.id]=recovery;p.penalties.push(penalties[p.id]);p.recoveries.push(recovery);p.score=Math.max(0,p.score+penalties[p.id]-recovery);}
 s.history.push({round:s.round,arcana:s.arcana,penalties,recoveries,bids:Object.fromEntries(s.players.map(p=>[p.id,p.bid!])),won:Object.fromEntries(s.players.map(p=>[p.id,p.won])),scores:Object.fromEntries(s.players.map(p=>[p.id,p.score]))});resetDone(s);s.phase=s.round===5?'ended':'round-end';s.turn=s.owner;
}
// Explicit copies avoid structured-clone serialization in the simulation hot path.
// Copy every nested mutable collection, including historical records.
function copyState(s:State):State{return {...s,
 players:s.players.map(p=>({...p,options:[...p.options],hand:[...p.hand],discard:[...p.discard],penalties:[...p.penalties],recoveries:[...p.recoveries]})),
 remaining:[...s.remaining],reserve:[...s.reserve],trick:s.trick.map(p=>({...p})),lastTrick:s.lastTrick.map(p=>({...p})),
 ...(s.completedTricks?{completedTricks:s.completedTricks.map(t=>t.map(p=>({...p})))}:{}),
 forced:[...s.forced],pending:s.pending?{...s.pending}:null,exposed:[...s.exposed],inspections:s.inspections.map(i=>({...i,cards:[...i.cards]})),
 standing:{...s.standing},initialBids:{...s.initialBids},firstWin:{...s.firstWin},
 history:s.history.map(r=>({...r,penalties:{...r.penalties},recoveries:{...r.recoveries},bids:{...r.bids},won:{...r.won},scores:{...r.scores}}))};}
export function apply(previous:State|undefined,event:Event):State{
 requireRule(event.version===1,'Unsupported event version');if(!previous){requireRule(event.sequence===1,'Missing creation');return createState(event.actor,event.command);}
 requireRule(event.sequence===previous.revision+1,'Stale event');const s=copyState(previous),c=event.command,id=event.actor;
 if(c.type==='join'||c.type==='bot'){requireRule(s.phase==='lobby'&&s.players.length<s.capacity,'Table is full or started');const bot=c.type==='bot';requireRule(!bot||id===s.owner,'Only the host adds imps');const uid=bot?c.target!:id;requireRule(uid&&!s.players.some(p=>p.id===uid),'Already seated');if(bot){requireRule(c.value===undefined||c.value===0||c.value===1,'Unknown computer policy');requireRule(c.value!==1||s.capacity===3,'Trained imps require three players');}const joined=newPlayer(uid,c.name?.trim().slice(0,24)||'Guest',bot);if(bot)joined.botPolicy=c.value===1?'rl-v1':'easy';s.players.push(joined);}
 else {const p=player(s,id);
 if(c.type==='capacity'){requireRule(id===s.owner&&s.phase==='lobby'&&[3,4,5].includes(c.value!)&&c.value!>=s.players.length,'Invalid table size');requireRule(c.value===3||!s.players.some(p=>p.botPolicy==='rl-v1'),'Trained imps require three players');s.capacity=c.value!;}
 else if(c.type==='start'){requireRule(id===s.owner&&s.phase==='lobby'&&s.players.length>=3,'Gather at least three players');s.capacity=s.players.length;const pool=shuffled(s,Array.from({length:10},(_,i)=>i));s.players.forEach((p,i)=>p.options=pool.slice(i*2,i*2+2));s.dealer=s.players[random(s,s.players.length)].id;s.phase='draft';}
 else if(c.type==='choose'){requireRule(s.phase==='draft'&&p.imp<0&&p.options.includes(c.value!),'Choose an offered imp');p.imp=c.value!;if(s.players.every(p=>p.imp>=0))startRound(s);}
 else if(c.type==='discard'){requireRule(s.phase==='discard'&&!p.done&&c.cards?.length===s.round&&new Set(c.cards).size===s.round&&c.cards.every(card=>p.hand.includes(card)),'Discard the required cards');p.discard=c.cards!;p.hand=p.hand.filter(card=>!p.discard.includes(card));p.done=true;if(s.players.every(p=>p.done))afterDiscards(s);}
 else if(c.type==='arcana'){requireRule(['magician','arcana'].includes(s.phase)&&s.turn===id,'Wait for your pre-bid turn');if(s.arcana===6||s.arcana===15&&s.standing[id]===Math.max(...Object.values(s.standing)))requireRule(c.target,'Choose an opponent');if(c.card){requireRule(available(s,p).includes(c.card),'Card unavailable');if(s.arcana===0||s.arcana===1){const incoming=s.reserve.splice(random(s,s.reserve.length),1)[0];p.hand[p.hand.indexOf(c.card)]=incoming;if(s.arcana===1)s.reserve.push(c.card);else p.discard.push(c.card);}else if(s.arcana===9)p.reserved=c.card;else throw Error('This Arcana does not select a card');}if(c.target){requireRule(c.target!==id,'Choose an opponent');player(s,c.target);if(s.arcana===2)inspect(s,id,c.target,2);else if(s.arcana===6)p.choice=c.target;else if(s.arcana===15){requireRule(s.standing[id]===Math.max(...Object.values(s.standing)),'Only last place chooses');p.choice=c.target;}else throw Error('No target for this Arcana');}p.done=true;const before=s.phase;nextStagePlayer(s,before==='magician'?'discard':'prebid');}
 else if(c.type==='prebid'){requireRule(s.phase==='prebid'&&s.turn===id,'Wait for your pre-bid turn');if(c.target){requireRule(p.imp===7&&!p.used,'Balam only');inspect(s,id,c.target,3);p.used=true;}p.done=true;nextStagePlayer(s,'bid');}
 else if(c.type==='bid'){requireRule(s.phase==='bid'&&p.bid===null&&(s.arcana===18||s.turn===id),'Not your bid');requireRule(Number.isInteger(c.value)&&c.value!>=0&&c.value!<=bidMax(s),'Bid out of range');if(s.arcana!==18&&id===s.dealer)requireRule(s.players.reduce((sum,p)=>sum+(p.bid??0),0)+c.value!!==bidMax(s),'Dealer’s hook');p.bid=c.value!;if(s.players.every(p=>p.bid!==null)){s.initialBids=Object.fromEntries(s.players.map(p=>[p.id,p.bid!]));if([18,20].includes(s.arcana)){resetDone(s);s.phase='adjust';}else beginTrick(s);}else if(s.arcana!==18)s.turn=clockwise(s,id);}
 else if(c.type==='adjust'){requireRule(Number.isInteger(c.value)&&c.value!>=0&&c.value!<=bidMax(s),'Bid out of range');if(s.phase==='adjust'){requireRule(!p.done&&s.standing[id]===Math.max(...Object.values(s.standing)),'Only last place adjusts');requireRule(Math.abs(c.value!-p.bid!)<=(s.arcana===20?2:1),'Adjustment too large');p.bid=c.value!;p.done=true;const worst=Math.max(...Object.values(s.standing));if(s.players.filter(p=>s.standing[p.id]===worst).every(p=>p.done))beginTrick(s);}else{requireRule(s.phase==='after'&&s.winner===id&&!p.adjusted,'No adjustment now');requireRule((s.arcana===3&&s.firstWin[id]&&c.value===p.bid!+1)||(s.arcana===14&&Math.abs(c.value!-p.bid!)===1),'Invalid adjustment');p.bid=c.value!;p.adjusted=true;}}
 else if(c.type==='shax'){requireRule(s.phase==='play'&&!s.pending&&s.turn===id&&p.imp===6&&!p.used,'Shax cannot act now');requireRule(c.target&&c.target!==id&&!s.trick.some(play=>play.player===c.target),'Choose someone still to play');player(s,c.target);s.forced.push(c.target);p.used=true;}
 else if(c.type==='recall'){requireRule(s.phase==='play'&&!s.pending&&s.turn===id&&p.imp===5&&!p.used,'Agares cannot act now');const index=s.trick.findIndex(play=>play.card===c.card);requireRule(index>=0,'Choose an earlier play');p.used=true;const original=s.trick[index];const owner=player(s,original.player);owner.hand.push(original.card);const pending={owner:owner.id,index,original:original.card,returnTo:id,concealed:original.concealed,led:s.led};s.pending=pending;if(legalCards(s,owner.id,original.card).length){s.turn=owner.id;}else{owner.hand=owner.hand.filter(card=>card!==original.card);s.pending=null;}}
 else if(c.type==='play'){
 requireRule(s.phase==='play'&&s.turn===id,'Not your play');const pending=s.pending;const forced=!pending&&s.forced.includes(id);let card=forced?available(s,p)[random(s,available(s,p).length)]:c.card;requireRule(card&&available(s,p).includes(card),'Choose a card in your hand');
 const powered=!!c.power;requireRule(!powered||(!pending&&!p.used&&[0,2,3].includes(p.imp)),'Power unavailable');const ignore=forced||(powered&&p.imp===0);requireRule(legalCards(s,id,pending?.original,ignore).includes(card),'Follow the card-choice rules');if(powered){if(p.imp===2)requireRule(s.trick.length>0,'Furfur acts during a trick');p.used=true;}
 p.hand=p.hand.filter(c=>c!==card);const play={player:id,card,concealed:powered&&p.imp===3||!!pending?.concealed};
 if(pending){s.trick[pending.index]=play;if(pending.index===0&&!s.changedSuit)s.led=cards[card].suit;s.pending=null;s.turn=pending.returnTo;}
 else{if(!s.trick.length){s.led=cards[card].suit;s.royal=s.arcana===4&&!!c.royal;s.low=s.arcana===12&&!!c.low;}if(powered&&p.imp===0){s.led=cards[card].suit;s.changedSuit=true;}if(powered&&p.imp===2)s.noTrump=true;s.trick.push(play);if(s.trick.length===s.players.length)award(s);else s.turn=clockwise(s,id);}}
 else if(c.type==='power'){
 requireRule(s.phase==='after'&&s.winner===id,'Win a trick first');requireRule((!p.used||p.imp===9)&&!s.afterRevealed,'Power already used');const target=c.target;requireRule(target&&target!==id,'Choose an opponent');const opponent=player(s,target);
 if(p.imp===1){requireRule(c.card&&available(s,p).includes(c.card)&&available(s,opponent).length,'Choose an available exchange');const other=available(s,opponent)[random(s,available(s,opponent).length)];p.hand[p.hand.indexOf(c.card)]=other;opponent.hand[opponent.hand.indexOf(other)]=c.card;}
 else if(p.imp===4)inspect(s,id,target,2);
 else if(p.imp===8){requireRule(s.trickNumber<s.physical,'No next trick');s.nextLeader=target;}
 else if(p.imp===9){const options=available(s,opponent);if(options.length){const exposed=options[random(s,options.length)];if(!s.exposed.includes(exposed))s.exposed.push(exposed);}}
 else throw Error('No after-win power');p.used=true;s.afterRevealed=true;}
 // value:1 records per-seat readiness; unvalued continuations preserve existing transcripts.
 else if(c.type==='continue'){if(s.phase==='after'){requireRule(s.winner===id,'Winner continues');if(c.card)requireRule(p.imp===8&&!p.used&&s.trickNumber<s.physical&&!s.nextLeader,'Cannot lead while passing this power');if(s.trickNumber===s.physical)scoreRound(s);else{s.trickNumber++;beginTrick(s);if(c.card)return apply(s,{...event,command:{type:'play',card:c.card,royal:c.royal,low:c.low}});}}else if(s.phase==='round-end'){if(c.value!==undefined){requireRule(c.value===1,'Invalid readiness signal');requireRule(!p.done,'Already ready');p.done=true;}if(c.value===undefined){const best=Math.min(...s.players.map(p=>p.score));s.dealer=order(s).find(id=>player(s,id).score===best)!;startRound(s);}}else throw Error('Cannot continue now');}
 else throw Error('Unsupported command');
 }
 s.revision=event.sequence;return s;
}
export function replay(events:Event[]){return events.reduce<State|undefined>((s,e)=>apply(s,e),undefined);}
export function eventFor(s:State|undefined,actor:string,command:Command,id='command'):Event{return {version:1,sequence:(s?.revision??0)+1,actor,command,id};}
export function allowedBids(s:State,id:string){return Array.from({length:bidMax(s)+1},(_,i)=>i).filter(value=>s.arcana===18||id!==s.dealer||s.players.reduce((sum,p)=>sum+(p.bid??0),0)+value!==bidMax(s));}
