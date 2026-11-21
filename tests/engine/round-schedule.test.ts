import {test,expect} from 'bun:test';
import {apply,eventFor,replay,totalRounds,clockwise,scoreRound} from '../../src/lib/engine/engine';
import {botCommand,nextActor} from '../../src/lib/engine/bot';
import type {State,Command,Event} from '../../src/lib/engine/types';
for(const count of [3,4,5])test(`${count} seats: full schedule, equal clockwise deals, final catch-up and deterministic replay`,()=>{
 let s:State|undefined;const log:Event[]=[];const dealers:string[]=[],powers:number[]=[];
 function send(actor:string,c:Command){const e=eventFor(s,actor,c,String(log.length));log.push(e);s=apply(s,e);}
 send('a',{type:'create',capacity:count,seed:`schedule-${count}`});for(let i=1;i<count;i++)send(String(i),{type:'join'});send('a',{type:'start'});
 for(let n=0;n<6000&&s!.phase!=='ended';n++){
  const before=s!,actor=nextActor(before)!;send(actor,botCommand(before,actor));
  if(s!.round!==before.round){dealers.push(s!.dealer);powers.push(s!.arcana);expect(s!.physical).toBe(Math.floor((56-count)/count)-s!.round);if(before.round>0)expect(s!.dealer).toBe(clockwise(before,before.dealer));}
 }
 const rounds=count===3?6:count===4?8:5;
 expect(s!.phase).toBe('ended');expect(totalRounds(s!)).toBe(rounds);expect(s!.history).toHaveLength(rounds);
 expect(powers.slice(0,-1).every(a=>a<15)).toBe(true);expect(new Set(powers.slice(0,-1)).size).toBe(rounds-1);expect(powers.at(-1)!).toBeGreaterThanOrEqual(15);
 for(const p of s!.players)expect(dealers.filter(id=>id===p.id)).toHaveLength(count===5?1:2);
 expect(replay(log)).toEqual(s!);
});
test('legacy untagged event logs retain five rounds and score-based dealing',()=>{
 let s=apply(undefined,{version:1,sequence:1,id:'legacy',actor:'a',command:{type:'create',capacity:3,seed:'legacy'}});
 expect(totalRounds(s)).toBe(5);for(const id of ['b','c'])s=apply(s,eventFor(s,id,{type:'join'}));s=apply(s,eventFor(s,'a',{type:'start'}));
 for(let i=0;i<4000&&s.phase!=='ended';i++){const before=s,actor=nextActor(s)!;s=apply(s,eventFor(s,actor,botCommand(s,actor)));if(s.round>before.round&&before.round>0)expect(before.players.find(p=>p.id===s.dealer)!.score).toBe(Math.min(...before.players.map(p=>p.score)));}
 expect(s.phase).toBe('ended');expect(s.history).toHaveLength(5);
});
test('dealer rotates even when another player has a lower score',()=>{
 let s=apply(undefined,eventFor(undefined,'a',{type:'create',capacity:3,seed:'rotation'}));for(const id of ['b','c'])s=apply(s,eventFor(s,id,{type:'join'}));s.phase='round-end';s.round=1;s.dealer='a';s.players[0].score=0;s.players[1].score=50;s.players[2].score=2;
 s=apply(s,eventFor(s,'a',{type:'continue'}));expect(s.dealer).toBe('b');expect(s.round).toBe(2);
});

test('The World can recover a penalty from round seven in an eight-round game',()=>{
 let s=apply(undefined,eventFor(undefined,'a',{type:'create',capacity:4,seed:'world'}));for(const id of ['b','c','d'])s=apply(s,eventFor(s,id,{type:'join'}));s.round=8;s.arcana=21;s.standing=Object.fromEntries(s.players.map(p=>[p.id,50]));for(const p of s.players){p.score=50;p.penalties=[1,2,3,4,5,6,20];p.won=p.bid=0;}scoreRound(s);expect(s.phase).toBe('ended');expect(s.players[0].recoveries).toEqual([20]);expect(s.players[0].score).toBe(30);
});
