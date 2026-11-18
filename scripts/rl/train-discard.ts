import {mkdir,appendFile} from 'node:fs/promises';
import {apply,eventFor} from '../../src/lib/engine/engine';
import {botCommand,nextActor} from '../../src/lib/engine/bot';
import {Network,Random,type Checkpoint} from '../../src/lib/engine/rl/network';
import {observeBid,INPUTS,learnedCommand,discardOptions,learnedDiscard} from '../../src/lib/engine/rl/policy';
import type {State,Command} from '../../src/lib/engine/types';
import {evaluate} from './simulator';
const episodes=Number(process.env.EPISODES??1500),interval=Number(process.env.EVAL_EVERY??250),count=Number(process.env.DEV_GAMES??600),seed=Number(process.env.TRAIN_SEED??45719),namespace=process.env.TRAIN_NAMESPACE??'hellsbells-discard-train-v1',bidPath=process.env.BID_MODEL??'models/rl-bid.json';
const bid=Network.load(await Bun.file(bidPath).json() as Checkpoint),network=new Network(INPUTS,48,6,seed);network.mode='q';const rng=new Random(seed),buffer:{x:Float64Array;targets:number[]}[]=[];let inserted=0,best=0,loss=0,observations=0;
if(/heldout|development|evaluation/.test(namespace))throw Error('Evaluation namespaces cannot be used for training');
const output=process.env.OUTPUT??'tmp/rl/discard-candidate.json';
await mkdir('tmp/rl',{recursive:true});
function rollout(s:State,id:string,cards:string[]){const before=s.players.map(p=>p.score),previous=s.history.length;let next=apply(s,eventFor(s,id,{type:'discard',cards}));for(let i=0;i<350&&next.history.length===previous;i++){const actor=nextActor(next)!;next=apply(next,eventFor(next,actor,actor===id?learnedCommand(next,actor,bid).command:botCommand(next,actor)));}if(next.history.length===previous)throw Error('Discard rollout failed');const index=s.players.findIndex(p=>p.id===id),change=next.players.map((p,i)=>p.score-before[i]);return (-change[index]+.25*change.reduce((n,c,i)=>n+(i===index?0:c),0)/2)/s.round;}
console.log(JSON.stringify({kind:'configuration',algorithm:'Monte Carlo action-value RL for discard choices',episodes,seed,namespace,bidPath}));
for(let episode=0;episode<episodes;episode++){
 const agent=['a','b','c'][episode%3];let state:State|undefined;function step(actor:string,command:Command){state=apply(state,eventFor(state,actor,command));}step('a',{type:'create',seed:`${namespace}-${episode}`,capacity:3});for(const id of ['b','c'])step(id,{type:'join'});step('a',{type:'start'});
 for(let n=0;n<1500&&state!.phase!=='ended';n++){const s=state!,actor=nextActor(s)!;if(actor===agent&&s.phase==='discard'){const options=discardOptions(s,actor),sample={x:observeBid(s,actor),targets:options.map(cards=>rollout(s,actor,cards))};if(buffer.length<15000)buffer.push(sample);else buffer[inserted%15000]=sample;inserted++;step(actor,rng.next()<.3?botCommand(s,actor):learnedDiscard(s,actor,network,rng));}else step(actor,actor===agent?learnedCommand(s,actor,bid).command:botCommand(s,actor));}
 for(let update=0;update<4;update++){const gradient=new Float64Array(network.weights.length);for(let j=0;j<32;j++){const sample=buffer[rng.pick(buffer.length)],f=network.forward(sample.x),dz=new Float64Array(6);for(let a=0;a<6;a++){const error=f.logits[a]-sample.targets[a];loss+=error*error;observations++;dz[a]=Math.max(-10,Math.min(10,error))/6/32;}network.backward(sample.x,f,dz,0,gradient);}network.update(gradient,.001);}
 if((episode+1)%interval===0||episode===episodes-1){const development=evaluate(bid,'hellsbells-development-v1',count,network),entry={kind:'development',episode:episode+1,samples:inserted,mse:loss/observations,development};console.log(JSON.stringify(entry));await appendFile(`tmp/rl/${namespace}.jsonl`,JSON.stringify(entry)+'\n');if(development.uniqueWinRate>best){best=development.uniqueWinRate;await Bun.write(output,JSON.stringify({...network.checkpoint(),training:{namespace,episodes:episode+1,seed,bidPath,development}}));}loss=0;observations=0;}
}
