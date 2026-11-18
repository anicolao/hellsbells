import {mkdir,appendFile} from 'node:fs/promises';
import {apply,eventFor,allowedBids,player} from '../../src/lib/engine/engine';
import {nextActor} from '../../src/lib/engine/bot';
import {Network,Random} from '../../src/lib/engine/rl/network';
import {observeBid,INPUTS,learnedCommand,discardOptions} from '../../src/lib/engine/rl/policy';
import {initialTactics,tacticalCommand} from '../../src/lib/engine/rl/tactics';
import {easy,previous,assess,type Agent} from './league';
import type {State,Command} from '../../src/lib/engine/types';
const episodes=Number(process.env.EPISODES??3000),interval=Number(process.env.EVAL_EVERY??100),count=Number(process.env.DEV_GAMES??180),seed=Number(process.env.TRAIN_SEED??230811),namespace=process.env.TRAIN_NAMESPACE??'hellsbells-league-train-v2',offset=Number(process.env.OFFSET??0),mode=process.env.MODE??'bid';
if(/heldout|development|evaluation/.test(namespace))throw Error('Evaluation namespaces cannot be used for training');
const bid=Network.load(await Bun.file(process.env.BID_MODEL??'models/rl-bid.json').json()).expandInputs(INPUTS),discard=Network.load(await Bun.file(process.env.DISCARD_MODEL??'models/rl-discard.json').json());bid.mode='q';
const network=mode==='discard'?discard:bid,weights=process.env.TACTICS?await Bun.file(process.env.TACTICS).json():initialTactics,rng=new Random(seed),buffer:{x:Float64Array;actions:number[];targets:number[]}[]=[];let inserted=0,best=-Infinity,loss=0,observations=0;
const output=process.env.OUTPUT??`tmp/rl/league-${mode}.json`;
await mkdir('tmp/rl',{recursive:true});
const self:Agent=(s,id)=>s.phase==='bid'||s.phase==='discard'?learnedCommand(s,id,bid,undefined,discard).command:tacticalCommand(s,id,weights);
function opponents(episode:number):Agent[]{switch(episode%4){case 0:return [easy,easy];case 1:return [previous,previous];case 2:return [easy,previous];default:return [self,self];}}
function reward(s:State,next:State,id:string){const before=s.players.map(p=>p.score),d=next.players.map((p,i)=>p.score-before[i]),me=s.players.findIndex(p=>p.id===id);return (-d[me]+.25*d.reduce((sum,x,i)=>sum+(i===me?0:x),0)/2)/s.round;}
function rollout(s:State,id:string,c:Command,agents:Agent[]){const previous=s.history.length;let next=apply(s,eventFor(s,id,c));for(let i=0;i<400&&next.history.length===previous;i++){const actor=nextActor(next)!;next=apply(next,eventFor(next,actor,agents[['a','b','c'].indexOf(actor)](next,actor)));}if(next.history.length===previous)throw Error('Rollout failed');return reward(s,next,id);}
console.log(JSON.stringify({kind:'configuration',algorithm:'counterfactual action-value RL in easy/v1/self-play league',episodes,seed,namespace,mode,output}));
for(let episode=0;episode<episodes;episode++){
 const ids=['a','b','c'],seat=(episode+offset)%3,agent=ids[seat],rivals=opponents(episode+offset),agents=ids.map((_,i)=>i===seat?self:rivals[i<seat?i:i-1]);let state:State|undefined;const step=(actor:string,c:Command)=>state=apply(state,eventFor(state,actor,c));step('a',{type:'create',seed:`${namespace}-${episode+offset}`,capacity:3});step('b',{type:'join'});step('c',{type:'join'});step('a',{type:'start'});
 for(let n=0;n<1800&&state!.phase!=='ended';n++){const s=state!,actor=nextActor(s)!;if(actor===agent&&s.phase===(mode==='bid'?'bid':'discard')){
  const commands:Command[]=mode==='bid'?allowedBids(s,actor).map(value=>({type:'bid',value})):discardOptions(s,actor).map(cards=>({type:'discard',cards}));const actions=mode==='bid'?commands.map(c=>c.value!):commands.map((_,i)=>i),sample={x:observeBid(s,actor,network.inputs),actions,targets:commands.map(c=>rollout(s,actor,c,agents))};if(buffer.length<20000)buffer.push(sample);else buffer[inserted%20000]=sample;inserted++;
  step(actor,rng.next()<.2?commands[rng.pick(commands.length)]:self(s,actor));
 }else step(actor,agents[ids.indexOf(actor)](s,actor));}
 if(state!.phase!=='ended')throw Error('Episode did not finish');
 for(let update=0;update<6;update++){const gradient=new Float64Array(network.weights.length);for(let j=0;j<32;j++){const sample=buffer[rng.pick(buffer.length)],f=network.forward(sample.x),dz=new Float64Array(network.outputs);for(let k=0;k<sample.actions.length;k++){const a=sample.actions[k],error=f.logits[a]-sample.targets[k];loss+=error*error;observations++;dz[a]=Math.max(-10,Math.min(10,error))/sample.actions.length/32;}network.backward(sample.x,f,dz,0,gradient);}network.update(gradient,.0007);}
 if((episode+1)%interval===0||episode===episodes-1){const development={easy:assess(self,[easy,easy],'hellsbells-league-development-v2',count),previous:assess(self,[previous,previous],'hellsbells-league-development-v2',count)},score=(development.easy.uniqueWinRate+development.previous.uniqueWinRate)/2,entry={kind:'development',episode:episode+offset+1,samples:inserted,mse:loss/observations,development};console.log(JSON.stringify(entry));await appendFile(`tmp/rl/${namespace}.jsonl`,JSON.stringify(entry)+'\n');await Bun.write(`tmp/rl/latest-league-${mode}.json`,JSON.stringify(network.checkpoint()));if(score>best){best=score;await Bun.write(output,JSON.stringify({...network.checkpoint(),training:{algorithm:'league counterfactual action-value RL',namespace,episodes:episode+offset+1,seed,development}}));}loss=0;observations=0;}
}
