import {mkdir,appendFile} from 'node:fs/promises';
import {Random,Network} from '../../src/lib/engine/rl/network';
import {initialTactics} from '../../src/lib/engine/rl/tactics';
import {match,tactical,easy,previous,assess} from './league';
const rng=new Random(Number(process.env.TRAIN_SEED??981713)),generations=Number(process.env.GENERATIONS??30),population=Number(process.env.POPULATION??24),games=Number(process.env.GAMES??90),namespace=process.env.TRAIN_NAMESPACE??'hellsbells-tactics-train-v2',output=process.env.OUTPUT??'tmp/rl/league-tactics.json';
if(/heldout|development|evaluation/.test(namespace))throw Error('Evaluation namespace');
const bid=Network.load(await Bun.file(process.env.BID_MODEL??'tmp/rl/league-bid.json').json()),discard=Network.load(await Bun.file(process.env.DISCARD_MODEL??'models/rl-discard.json').json());
const rawWeights=process.env.RESUME?await Bun.file(process.env.RESUME).json():initialTactics;let mean:number[]=Array.isArray(rawWeights)?[...rawWeights]:[...rawWeights.tactics],sigma=mean.map((_,i)=>i===8?.3:.25),champion=[...mean],best=-Infinity;
const normal=()=>Math.sqrt(-2*Math.log(Math.max(1e-9,rng.next())))*Math.cos(2*Math.PI*rng.next());
await mkdir('tmp/rl',{recursive:true});
console.log(JSON.stringify({kind:'configuration',algorithm:'cross-entropy policy search with episodic league returns',namespace,generations,population,games}));
for(let generation=0;generation<generations;generation++){
 const rivals=tactical(bid,discard,champion),results:{weights:number[];fitness:number;wins:number}[]=[];
 for(let sample=0;sample<population;sample++){const weights=sample===0?[...champion]:mean.map((m,i)=>Math.max(i===8?.1:-3,Math.min(3,m+sigma[i]*normal()))),agent=tactical(bid,discard,weights);let total=0,wins=0;
 for(let game=0;game<games;game++){const seat=game%3,kind=Math.floor(game/3)%4,opponents=kind===0?[easy,easy]:kind===1?[previous,previous]:kind===2?[easy,previous]:[rivals,rivals],agents=[...opponents];agents.splice(seat,0,agent);const s=match(`${namespace}-${generation}-${game}`,agents),scores=s.players.map(p=>p.score),mine=scores[seat],others=scores.filter((_,i)=>i!==seat),best=Math.min(...others),win=mine<best,tie=mine===best;wins+=+win;total+=(win?1:tie?.4:0)+.12*Math.tanh((best-mine)/12);}
 results.push({weights,fitness:total/games,wins});}
 results.sort((a,b)=>b.fitness-a.fitness);const elite=results.slice(0,Math.max(3,Math.floor(population/4)));mean=mean.map((_,i)=>elite.reduce((sum,r)=>sum+r.weights[i],0)/elite.length);sigma=sigma.map((old,i)=>Math.max(.035,.5*old+.5*Math.sqrt(elite.reduce((sum,r)=>sum+(r.weights[i]-mean[i])**2,0)/elite.length)));champion=results[0].weights;
 const agent=tactical(bid,discard,champion),development={easy:assess(agent,[easy,easy],'hellsbells-tactics-development-v2',180),previous:assess(agent,[previous,previous],'hellsbells-tactics-development-v2',180)},score=(development.easy.uniqueWinRate+development.previous.uniqueWinRate)/2,entry={generation:generation+1,fitness:results[0].fitness,weights:champion,sigma,development};console.log(JSON.stringify(entry));await appendFile(`tmp/rl/${namespace}.jsonl`,JSON.stringify(entry)+'\n');if(score>best){best=score;await Bun.write(output,JSON.stringify(champion));await Bun.write(output+'.training.json',JSON.stringify({algorithm:'episodic cross-entropy reinforcement learning',namespace,generation:generation+1,development},null,2));}}
