import {test,expect} from 'bun:test';
import {apply,eventFor} from '../../src/lib/engine/engine';
import {botCommand,nextActor} from '../../src/lib/engine/bot';
function freeze<T>(value:T):T{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;}
test('the reducer accepts deeply frozen prior states throughout complete 3–5 player games',()=>{for(let game=0;game<30;game++){const count=3+game%3;let state=apply(undefined,eventFor(undefined,'a',{type:'create',seed:`immutable-${game}`,capacity:count}));for(let i=1;i<count;i++)state=apply(freeze(state),eventFor(state,`p${i}`,{type:'join'}));state=apply(freeze(state),eventFor(state,'a',{type:'start'}));for(let step=0;step<1800&&state.phase!=='ended';step++){const id=nextActor(state)!;state=apply(freeze(state),eventFor(state,id,botCommand(state,id)));}expect(state.phase).toBe('ended');expect(state.history).toHaveLength(5);}});
