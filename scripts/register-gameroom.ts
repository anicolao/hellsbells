/** One requested catalogue addition, not a seed or migration. Dry-run by default. */
import {createRequire} from 'node:module';
import {realpathSync,writeFileSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const executable=realpathSync(execFileSync('which',['firebase'],{encoding:'utf8'}).trim());
const nixPackage=resolve(dirname(executable),'../lib/node_modules/firebase-tools/package.json');
const cli=createRequire(existsSync(nixPackage)?nixPackage:resolve(dirname(executable),'../../package.json'));
const auth=cli('./lib/auth'),{requireAuth}=cli('./lib/requireAuth');
const playUrl=process.argv.find(a=>a.startsWith('--play-url='))?.slice('--play-url='.length)??'https://anicolao.github.io/hellsbells/play/';
const url=new URL(playUrl);
if(url.origin!=='https://anicolao.github.io'||!/^\/hellsbells\/(pr\d+\/)?play\/$/.test(url.pathname)||url.search||url.hash)throw Error('Use the production or PR Hell’s Bells play URL.');
const cover=new URL('../art/launcher/hellsbells.webp',url).href;
const record={Title:'Hell’s Bells',Hidden:true,WebURL:url.href,GameroomEnabled:'integrated',Icon:cover};
const account=auth.getGlobalDefaultAccount();await requireAuth({project:'launcherui',...account});
const {access_token}=await auth.getAccessToken(account.tokens.refresh_token,[]);
const headers={Authorization:`Bearer ${access_token}`,'Content-Type':'application/json'},base='https://firestore.googleapis.com/v1/projects/launcherui/databases/(default)/documents';
const response=await fetch(`${base}/Applications?pageSize=1000`,{headers});if(!response.ok)throw Error(`Catalogue read failed (${response.status}).`);
const snapshot=await response.json() as {documents?:{name:string;fields:Record<string,{stringValue?:string}>;updateTime:string}[]},documents=snapshot.documents??[];
const matching=documents.filter(d=>d.name.endsWith('/hellsbells')||d.fields.WebURL?.stringValue?.includes('/hellsbells/')||d.fields.Title?.stringValue?.replace(/[’']/g,'').toLowerCase()==='hells bells');
if(matching.length>1)throw Error('Multiple Hell’s Bells records exist; review them before editing.');
const existing=matching[0],fields=Object.fromEntries(Object.entries(record).map(([key,value])=>[key,typeof value==='boolean'?{booleanValue:value}:{stringValue:value}]));
console.log(JSON.stringify({document:existing?.name??'Applications/hellsbells',...record},null,2));
if(!process.argv.includes('--apply')){console.log('Dry run. Use --apply after the play URL and cover are deployed.');process.exit(0);}
for(const target of [url.href,cover]){const check=await fetch(target);if(!check.ok)throw Error(`Deploy the asset first: ${target} (${check.status})`);}
const backup=`/tmp/hellsbells-catalog-before-${Date.now()}.json`;writeFileSync(backup,JSON.stringify(snapshot,null,2));
const write={update:{name:existing?.name??'projects/launcherui/databases/(default)/documents/Applications/hellsbells',fields},...(existing?{updateMask:{fieldPaths:Object.keys(record)},currentDocument:{updateTime:existing.updateTime}}:{currentDocument:{exists:false}})};
const result=await fetch(`${base}:commit`,{method:'POST',headers,body:JSON.stringify({writes:[write]})});if(!result.ok)throw Error(`Catalogue update failed (${result.status}): ${await result.text()}`);
console.log(`Updated only Hell’s Bells. Previous catalogue saved to ${backup}.`);
