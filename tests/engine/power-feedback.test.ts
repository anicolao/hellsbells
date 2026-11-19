import {test,expect} from 'bun:test';
import {makePowerScene} from '../../src/routes/dev/animations/powers/scenes';
import {replay} from '../../src/lib/engine/engine';
import {PresentationTimeline,describeEvent} from '../../src/lib/components/play/powers/transitions';
import {powerSprites,type Anchors} from '../../src/lib/components/play/powers/motion';
const box={x:10,y:20,width:100,height:160};
const anchors:Anchors=Object.fromEntries(['centre','centre-left','centre-right','actor-seat','target-seat','actor-hand','target-hand','received-hand','given-target','trick-slot','trick-original','returned-hand','new-public','inspection-0','inspection-1','inspection-2'].map(k=>[k,box]));
for(const count of [3,4,5])for(let imp=0;imp<10;imp++)test(`real event history: imp ${imp}, ${count} players`,()=>{
 const d=makePowerScene(imp,count);expect(replay(d.history)).toEqual(d.before);
 const t=new PresentationTimeline(d.before);t.append(d.events);
 expect(t.latest).toEqual(replay([...d.history,...d.events])!);
 expect(t.frames.filter(f=>f.motion.bell)).toHaveLength(1);
 expect(t.sample(t.end).busy).toBe(false);expect(t.sample(t.end).game).toEqual(t.latest);
 const length=t.frames.length;t.append(d.events);expect(t.frames).toHaveLength(length);
 expect(t.sample(100)).toEqual(t.sample(100));
});
for(const imp of [1,4,7])test(`private cards remain private for imp ${imp}`,()=>{
 const d=makePowerScene(imp,3),t=new PresentationTimeline(d.before);t.append(d.events);const f=t.frames[0];
 const outsider=d.before.players.find(p=>p.id!==d.actor&&p.id!==d.target)!.id;
 const hidden=powerSprites(f,.5,outsider,anchors);expect(hidden.length).toBeGreaterThan(0);expect(hidden.every(s=>s.back)).toBe(true);
 expect(powerSprites(f,.5,d.actor,anchors).every(s=>!s.back)).toBe(true);
});
test('recall and forced draw wait for their own events',()=>{
 for(const imp of [5,6]){const d=makePowerScene(imp,3),first=describeEvent(d.before,d.events[0]);expect(first.motions).toHaveLength(1);expect(first.motions[0].played).toBeUndefined();const t=new PresentationTimeline(d.before);t.append(d.events);expect(t.frames.some(f=>f.motion.kind===(imp===5?'replacement':'draw'))).toBe(true);}
});
test('Bael reveal is a separate real completed-trick event',()=>{const d=makePowerScene(3,5),t=new PresentationTimeline(d.before);t.append(d.events);const reveal=t.frames.find(f=>f.motion.kind==='reveal')!;expect(reveal).toBeDefined();expect(reveal.event.id).not.toBe(d.events[0].id);expect(reveal.motion.bell).toBe(false);expect(reveal.after.phase).toBe('after');});
test('live append queues behind the current effect without replaying history',()=>{const d=makePowerScene(6,3),t=new PresentationTimeline(d.before);expect(t.sample(0).busy).toBe(false);t.append([d.events[0]],500);const end=t.end;t.append(d.events.slice(1),600);expect(t.frames[1].start).toBe(end);t.prune(t.end);expect(t.frames).toHaveLength(0);expect(t.sample(t.end).game).toEqual(t.latest);});
test('forced draws originate at the viewer’s hand and opponents’ imps',()=>{
 const d=makePowerScene(6,3),t=new PresentationTimeline(d.before);t.append(d.events);
 const f=t.frames.find(f=>f.motion.kind==='draw')!;
 const hand={x:300,y:600,width:150,height:240},seat={x:900,y:100,width:80,height:128};
 const a={...anchors,'target-hand':hand,'target-seat':seat};
 const own=powerSprites(f,.30,f.motion.target!,a).find(s=>s.key==='draw')!;
 const peer=powerSprites(f,.30,f.motion.actor,a).find(s=>s.key==='draw')!;
 expect(own.box.x).toBe(hand.x);expect(own.box.y).toBe(hand.y);
 expect(peer.box.x).toBe(seat.x);expect(peer.box.y).toBe(seat.y);
});
