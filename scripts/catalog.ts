import { writeFileSync, readFileSync } from 'node:fs';
const source = readFileSync('HELLS_BELLS_RULES.md','utf8');
const imps = [...source.matchAll(/#### ([^\n]+)\n\n([^#]+?)(?=\n####|\n###|\n##|$)/g)].filter(m=>!m[2].startsWith('**Trump:')).map((m,i)=>{const [name,power]=m[1].split(' — ');return {id:`imp-${i}`,name,power,rule:m[2].trim(),art:i,kind:'imp'};});
const arcana = [...source.matchAll(/#### ([^\n]+)\n\n\*\*Trump: (\w+)\.\*\* ([^#]+?)(?=\n####|\n###|\n##|$)/g)].map((m,i)=>{const [number,name]=m[1].split(' — '); return {id:`arcana-${i}`,number,name,suit:m[2],rule:m[3].trim(),kind:'arcana',pool:i<15?'Regular':'Catch-up',symbol:['✧','☽','✺','♜','♛','✥','♡','➶','✦','☾','☸','⚖','↕','☠','♧','♆','ϟ','★','☾','☀','♬','◎'][i]};});
writeFileSync('src/lib/data/catalog.json',JSON.stringify({imps,arcana},null,2)+'\n');
console.log(`${imps.length} imps, ${arcana.length} Arcana`);
