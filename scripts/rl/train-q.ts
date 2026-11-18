import {mkdir,appendFile} from 'node:fs/promises';
import {apply,eventFor,player,allowedBids} from '../../src/lib/engine/engine';
import {botCommand,nextActor} from '../../src/lib/engine/bot';
import {Network,Random,type Checkpoint} from '../../src/lib/engine/rl/network';
import {observeBid,INPUTS,learnedCommand} from '../../src/lib/engine/rl/policy';
import type {State,Command} from '../../src/lib/engine/types';
import {evaluate} from './simulator';
type Sample={x:Float64Array;actions:number[];targets:number[]};
const episodes=Number(process.env.EPISODES??3000),interval=Number(process.env.EVAL_EVERY??250),devCount=Number(process.env.DEV_GAMES??600),seed=Number(process.env.TRAIN_SEED??71931),namespace=process.env.TRAIN_NAMESPACE??'hellsbells-q-train-v1',offset=Number(process.env.OFFSET??0);
const dimensions=Number(process.env.FEATURES??81);
let network=process.env.RESUME?Network.load(await Bun.file(process.env.RESUME).json() as Checkpoint):new Network(dimensions,64,18,seed);if(network.inputs!==dimensions)network=network.expandInputs(dimensions);else if(process.env.RESUME)network.steps=0;network.mode='q';const rng=new Random(seed),buffer:Sample[]=[],capacity=20000;let inserted=0,best=0,loss=0,updates=0;
if(/heldout|development|evaluation/.test(namespace))throw Error('Evaluation namespaces cannot be used for training');
const output=process.env.OUTPUT??'tmp/rl/bid-candidate.json';
await mkdir('tmp/rl',{recursive:true});await mkdir('models',{recursive:true});
function result(s:State,id:string,action:number){const before=s.players.map(p=>p.score),previous=s.history.length;let next=apply(s,eventFor(s,id,{type:'bid',value:action}));for(let i=0;i<300&&next.history.length===previous;i++){const actor=nextActor(next)!;next=apply(next,eventFor(next,actor,botCommand(next,actor)));}if(next.history.length===previous)throw Error('Round rollout failed');const me=s.players.findIndex(p=>p.id===id),change=next.players.map((p,i)=>p.score-before[i]);return (-change[me]+.25*(change.reduce((n,c,i)=>n+(i===me?0:c),0)/2))/s.round;}
console.log(JSON.stringify({kind:'configuration',algorithm:'Monte Carlo action-value reinforcement learning with simulator counterfactuals and replay',episodes,seed,namespace,hidden:network.hidden,inputs:network.inputs,resume:process.env.RESUME??null,capacity}));
for(let episode=0;episode<episodes;episode++){
 const ids=['a','b','c'],agent=ids[(episode+offset)%3];let state:State|undefined;function step(actor:string,command:Command){state=apply(state,eventFor(state,actor,command));}step('a',{type:'create',seed:`${namespace}-${episode+offset}`,capacity:3});step('b',{type:'join'});step('c',{type:'join'});step('a',{type:'start'});
 for(let n=0;n<1500&&state!.phase!=='ended';n++){const s=state!,actor=nextActor(s)!;if(actor===agent&&s.phase==='bid'){const actions=allowedBids(s,actor),sample={x:observeBid(s,actor,network.inputs),actions,targets:actions.map(a=>result(s,actor,a))};if(buffer.length<capacity)buffer.push(sample);else buffer[inserted%capacity]=sample;inserted++;const cmd=rng.next()<.3?botCommand(s,actor):learnedCommand(s,actor,network,rng).command;step(actor,cmd);}else step(actor,botCommand(s,actor));}
 if(state!.phase!=='ended')throw Error('Episode did not finish');
 for(let update=0;update<4;update++){const gradient=new Float64Array(network.weights.length);for(let j=0;j<32;j++){const sample=buffer[rng.pick(buffer.length)],f=network.forward(sample.x),dz=new Float64Array(network.outputs);for(let k=0;k<sample.actions.length;k++){const a=sample.actions[k],error=f.logits[a]-sample.targets[k];loss+=error*error;updates++;dz[a]=Math.max(-10,Math.min(10,error))/sample.actions.length/32;}network.backward(sample.x,f,dz,0,gradient);}network.update(gradient,.001);}
 if((episode+1)%interval===0||episode===episodes-1){const development=evaluate(network,'hellsbells-development-v1',devCount),entry={kind:'development',episode:episode+1+offset,samples:inserted,steps:network.steps,mse:loss/updates,development};console.log(JSON.stringify(entry));await appendFile(`tmp/rl/${namespace}.jsonl`,JSON.stringify(entry)+'\n');await Bun.write('tmp/rl/latest-q-policy.json',JSON.stringify(network.checkpoint()));if(development.uniqueWinRate>best){best=development.uniqueWinRate;await Bun.write(output,JSON.stringify({...network.checkpoint(),training:{algorithm:'Monte Carlo action-value reinforcement learning',namespace,episodes:episode+1+offset,samples:inserted,seed,development}}));}loss=0;updates=0;}
}
