import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const paths=['models/rl-bid.json','models/rl-discard.json'];
const models=paths.map(path=>{const raw=readFileSync(path,'utf8'),model=JSON.parse(raw);return {path,sha256:createHash('sha256').update(raw).digest('hex'),inputs:model.inputs,hidden:model.hidden,outputs:model.outputs,training:model.training};});
const heldout=await Bun.file('reports/rl/heldout.json').json(),baseline=await Bun.file('reports/rl/baseline.json').json();
if(heldout.models&&models.some(model=>!heldout.models.some((old:{path:string;sha256:string})=>old.path===model.path&&old.sha256===model.sha256)))throw Error('Checkpoint changed since evaluation; run a fresh evaluation');
heldout.models=models.map(({path,sha256})=>({path,sha256}));heldout.winCriterion='sole lowest final score; shared wins excluded';heldout.opponents='two unchanged easy bots';
baseline.models=[];baseline.winCriterion=heldout.winCriterion;baseline.opponents=heldout.opponents;
await Bun.write('reports/rl/heldout.json',JSON.stringify(heldout,null,2)+'\n');await Bun.write('reports/rl/baseline.json',JSON.stringify(baseline,null,2)+'\n');
const manifest={version:1,algorithm:'Monte Carlo action-value reinforcement learning with replay',runtime:Bun.version,playerCount:3,learnedActions:['bid','discard-template'],otherActions:'unchanged easy bot',models,acceptance:{minimumUniqueWinRate:.6,criterion:'95% Wilson lower bound >= target',passed:heldout.wilson95[0]>=.6,report:'reports/rl/heldout.json'},evaluation:{namespace:heldout.namespace,games:heldout.games,wins:heldout.wins,ties:heldout.ties,uniqueWinRate:heldout.uniqueWinRate,wilson95:heldout.wilson95,baselineUniqueWinRate:baseline.uniqueWinRate}};
await Bun.write('models/rl-manifest.json',JSON.stringify(manifest,null,2)+'\n');
const experiments=['hellsbells-q-train-v1','hellsbells-q-train-v2','hellsbells-discard-train-v1'];const logs=[];for(const namespace of experiments){const file=Bun.file(`tmp/rl/${namespace}.jsonl`);if(await file.exists())logs.push({namespace,checkpoints:(await file.text()).trim().split('\n').map(line=>JSON.parse(line))});}
await Bun.write('reports/rl/training.json',JSON.stringify({developmentNamespace:'hellsbells-development-v1',developmentGames:600,heldoutUsedAfterFreezing:true,experiments:logs},null,2)+'\n');
console.log(JSON.stringify(manifest.acceptance));
