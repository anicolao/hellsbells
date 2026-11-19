import {mkdir,appendFile,rename} from 'node:fs/promises';
import {Network,Random} from '../../src/lib/engine/rl/network';
import {initialModels,agent,match,easy,previous,assess,type Agent} from './multi-common';
const players=Number(process.env.PLAYERS??3),generations=Number(process.env.GENERATIONS??8),population=Number(process.env.POPULATION??16),games=Number(process.env.GAMES??60),seed=914703+players,namespace=`hellsbells-multi-tactics-train-v1-${players}`;
if(![3,4,5].includes(players))throw Error('Unsupported player count');
const initial=await initialModels(),bid=Network.load(await Bun.file(`tmp/rl/multi/${players}/bid.json`).json()),discard=Network.load(await Bun.file(`tmp/rl/multi/${players}/discard.json`).json()),frozen=agent(initial.bid,initial.discard,initial.strategy.tactics),rng=new Random(seed);
let mean:number[]=[...initial.strategy.tactics],champion=[...mean],sigma=mean.map((_,i)=>i===8?.3:.25),best=-Infinity;
const output=`tmp/rl/multi/${players}/strategy.json`,normal=()=>Math.sqrt(-2*Math.log(Math.max(1e-9,rng.next())))*Math.cos(2*Math.PI*rng.next());await mkdir(`tmp/rl/multi/${players}`,{recursive:true});
async function evaluate(generation:number){const self=agent(bid,discard,champion),development={easy:assess(self,Array(players-1).fill(easy),`hellsbells-multi-tactics-development-v1-${players}`,180),transfer:assess(self,Array(players-1).fill(frozen),`hellsbells-multi-tactics-development-v1-${players}`,180)},score=(development.easy.uniqueWinRate+development.transfer.uniqueWinRate)/2,entry={generation,players,seed,namespace,weights:champion,development};console.log(JSON.stringify(entry));await appendFile(`tmp/rl/multi/${players}/tactics-training.jsonl`,JSON.stringify(entry)+'\n');if(score>best){best=score;await Bun.write(output+'.tmp',JSON.stringify({tactics:champion,discardBias:Array(6).fill(0),training:{algorithm:'episodic cross-entropy policy search in count-specific league',players,seed,namespace,generation,development}}));await rename(output+'.tmp',output);}}
await evaluate(0);
for(let generation=0;generation<generations;generation++){
 const peer=agent(bid,discard,champion),results:{weights:number[];fitness:number}[]=[];
 for(let sample=0;sample<population;sample++){const weights=sample===0?[...champion]:mean.map((m,i)=>Math.max(i===8?.1:-3,Math.min(3,m+sigma[i]*normal()))),candidate=agent(bid,discard,weights);let reward=0;
 for(let game=0;game<games;game++){const seat=game%players,kind=Math.floor(game/players)%4,rivals=Array.from({length:players-1},(_,i)=>kind===0?easy:kind===1?(players===3?previous:frozen):kind===2?(i%2?frozen:easy):peer);rivals.splice(seat,0,candidate);const s=match(`${namespace}-${generation}-${game}`,rivals),scores=s.players.map(p=>p.score),mine=scores[seat],other=Math.min(...scores.filter((_,i)=>i!==seat));reward+=(mine<other?1:mine===other?.4:0)+.12*Math.tanh((other-mine)/12);}
 results.push({weights,fitness:reward/games});}
 results.sort((a,b)=>b.fitness-a.fitness);const elite=results.slice(0,4);mean=mean.map((_,i)=>elite.reduce((sum,r)=>sum+r.weights[i],0)/elite.length);sigma=sigma.map((v,i)=>Math.max(.035,.5*v+.5*Math.sqrt(elite.reduce((sum,r)=>sum+(r.weights[i]-mean[i])**2,0)/elite.length)));champion=results[0].weights;await evaluate(generation+1);
}
