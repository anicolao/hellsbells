import {test,expect} from 'bun:test';
import {BellAudio,listenForBellUnlock} from '../../src/lib/components/play/powers/bell';
test('WebKit output is primed synchronously before resume resolves, only once when running',async()=>{
 const calls:string[]=[];
 const context={state:'running',sampleRate:44100,destination:{},resume:()=>{calls.push('resume');return Promise.resolve().then(()=>{calls.push('resumed');});},createBuffer:()=>({}),createBufferSource:()=>({buffer:null,connect:()=>{},start:()=>calls.push('start'),disconnect:()=>{}})};
 const bell=new BellAudio(()=>context as unknown as AudioContext);
 const unlocking=bell.unlock();expect(calls).toEqual(['resume','start']);await unlocking;
 expect(calls).toEqual(['resume','start','resumed']);await bell.unlock();expect(calls).toHaveLength(3);
 context.state='interrupted';await bell.unlock();expect(calls.slice(3)).toEqual(['resume','start','resumed']);
});
test('release and click gestures retry audio unlocking and cleanup removes handlers',async()=>{
 const target=new EventTarget();let attempts=0;
 const stop=listenForBellUnlock({unlock:async()=>{attempts++;if(attempts===1)throw Error('Gesture not accepted');}},target);
 for(const type of ['pointerdown','pointerup','click','touchend','keydown'])target.dispatchEvent(new Event(type));
 await Promise.resolve();expect(attempts).toBe(5);stop();target.dispatchEvent(new Event('click'));expect(attempts).toBe(5);
});
