import {test,expect} from 'bun:test';
import {apply,eventFor} from '../../src/lib/engine/engine';
import type {Event,State} from '../../src/lib/engine/types';
import {EventProjection} from '../../src/lib/backend/event-projection';
import {EventStream,type Feed} from '../../src/lib/backend/event-stream';
import {PresentationTimeline} from '../../src/lib/components/play/powers/transitions';
import {isQuotaError} from '../../src/lib/backend/errors';
function history(count:number){const events:Event[]=[];let state:State|undefined;for(let i=0;i<count;i++){const event=eventFor(state,'owner',i?{type:'capacity',value:i%2?4:3}:{type:'create',seed:'incremental',capacity:3},`event-${i}`);events.push(event);state=apply(state,event);}return {events,state:state!};}
const tick=()=>new Promise<void>(resolve=>setTimeout(resolve,0));
function source(initial:Event[]){
 const log=[...initial],cursors:number[]=[];let current:{after:number;receive:Parameters<Feed>[1];error:Parameters<Feed>[2];delivered:number}|undefined,read=0,active=0,peak=0;
 function publish(){if(!current)return;const listener=current,window=log.filter(e=>e.sequence>listener.after).slice(0,32),events=window.filter(e=>e.sequence>listener.delivered);read+=events.length;listener.delivered=events.at(-1)?.sequence??listener.delivered;listener.receive(events,true,window.length===32);}
 const feed:Feed=(after,receive,error)=>{const listener={after,receive,error,delivered:after};current=listener;cursors.push(after);active++;peak=Math.max(peak,active);queueMicrotask(()=>{if(current===listener)publish();});return()=>{active--;if(current===listener)current=undefined;};};
 return {feed,cursors,get read(){return read;},get active(){return active;},get peak(){return peak;},push(event:Event){log.push(event);publish();},fail(error:Error){current?.error(error);},offline(){current?.receive([],false,false);}};
}
test('each sequence is reduced once, duplicates are ignored, and recent memory is bounded',()=>{
 const h=history(1000);let calls=0;const projection=new EventProjection(undefined,(s,e)=>{calls++;return apply(s,e);});
 for(const event of h.events){projection.accept([event]);projection.accept([event]);}
 expect(calls).toBe(1000);expect(projection.state).toEqual(h.state);expect(projection.since(0)).toHaveLength(128);
 const resumed=new EventProjection(h.state);expect(resumed.accept(h.events)).toEqual([]);expect(resumed.state).toBe(h.state);
});
test('a missing sequence is reported rather than silently accepting a partial history',()=>{const h=history(3),projection=new EventProjection();projection.accept([h.events[0]]);expect(()=>projection.accept([h.events[2]])).toThrow('Missing game event 2');});
test('one shared listener advances its cursor; 200 moves do not reread their prefixes',async()=>{
 const h=history(200),s=source([h.events[0]]),stream=new EventStream(crypto.randomUUID(),s.feed),revisions:number[]=[],errors:Error[]=[];
 const stop=stream.subscribe(state=>revisions.push(state.revision),e=>errors.push(e));await stream.waitForRevision(1);await tick();
 const reads=s.read,queries=s.cursors.length;
 const stopSecond=stream.subscribe(state=>expect(state.revision).toBeGreaterThan(0),e=>errors.push(e));expect(s.read).toBe(reads);expect(s.cursors).toHaveLength(queries);
 for(const event of h.events.slice(1)){s.push(event);await stream.waitForRevision(event.sequence);await tick();}
 expect(errors).toEqual([]);expect(s.read).toBe(200);expect(s.peak).toBe(1);expect(s.cursors.at(-1)).toBe(192);s.offline();await tick();expect(s.cursors.at(-1)).toBe(200);expect(revisions.at(-1)).toBe(200);
 stopSecond();stop();expect(s.active).toBe(0);
});
test('conflict catch-up shares the stream rather than opening a history query',async()=>{
 const h=history(3),s=source([h.events[0]]),stream=new EventStream(crypto.randomUUID(),s.feed);
 const stop=stream.subscribe(()=>{},()=>{});await stream.waitForRevision(1);await tick();const queries=s.cursors.length;
 const waiting=stream.waitForRevision(3,1);expect(s.cursors).toHaveLength(queries);
 s.push(h.events[1]);await tick();s.push(h.events[2]);const fresh=await waiting;
 expect(fresh.state).toEqual(h.state);expect(fresh.events.map(e=>e.sequence)).toEqual([2,3]);stop();
});
test('cold catch-up publishes only a complete tip and never replays old animations',async()=>{
 const h=history(100),s=source(h.events),stream=new EventStream(crypto.randomUUID(),s.feed),seen:{revision:number;events:number[]}[]=[];
 const stop=stream.subscribe((state,events,synced)=>{if(synced)seen.push({revision:state.revision,events:events.map(e=>e.sequence)});},e=>{throw e;});
 const fresh=await stream.waitForRevision(100);expect(fresh.state).toEqual(h.state);expect(s.read).toBe(100);expect(seen).toEqual([{revision:100,events:[]}]);stop();
});
test('quota failures reject catch-up and never reopen the failed listener',async()=>{
 const h=history(1),s=source(h.events),stream=new EventStream(crypto.randomUUID(),s.feed),errors:Error[]=[];
 const stop=stream.subscribe(()=>{},e=>errors.push(e));await stream.waitForRevision(1);await tick();
 const waiting=stream.waitForRevision(2),quota=Object.assign(Error('Quota exceeded'),{code:'resource-exhausted'});s.fail(quota);
 await expect(waiting).rejects.toBe(quota);const queries=s.cursors.length;await tick();await expect(stream.waitForRevision(2)).rejects.toBe(quota);
 expect(s.cursors).toHaveLength(queries);expect(s.active).toBe(0);expect(errors).toEqual([quota]);expect(isQuotaError(quota)).toBe(true);expect(isQuotaError({code:'unavailable'})).toBe(false);stop();
});

test('live timeline sampling skips retired frames and eventually releases their snapshots',()=>{
 const h=history(401),timeline=new PresentationTimeline(apply(undefined,h.events[0]));
 for(const event of h.events.slice(1))timeline.append([event],(event.sequence-1)*10);
 timeline.prune(1000);
 Object.defineProperty(timeline.frames[0],'start',{get(){throw Error('Revisited a retired frame');}});
 expect(timeline.sample(1005).game.revision).toBe(101);
 timeline.prune(5000);expect(timeline.pending).toBe(false);expect(timeline.frames).toEqual([]);expect(timeline.sample(5000).game).toEqual(h.state);
});
