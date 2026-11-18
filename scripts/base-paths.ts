import {readdir,readFile,writeFile} from 'node:fs/promises';
async function walk(dir:string):Promise<string[]>{return (await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?walk(`${dir}/${e.name}`):[`${dir}/${e.name}`]))).flat();}
for(const path of await walk('src')){
 if(!path.endsWith('.svelte'))continue;
 let s=await readFile(path,'utf8');
 if(!/(href="\/|src="\/|src=\{`\/art)/.test(s))continue;
 if(!s.includes("from '$app/paths'"))s=s.replace('<script lang="ts">',"<script lang=\"ts\">\n import {base} from '$app/paths';");
 s=s.replace(/(href|src)="(\/[^"]*)"/g,(_,attr,url)=>`${attr}={base + ${JSON.stringify(url.replace(/^\/gallery$/, '/gallery/'))}}`);
 s=s.replaceAll('src={`/art/','src={`${base}/art/');
 s=s.replace("page.url.pathname==='/rules.html'","page.url.pathname===base+'/rules.html'").replace("page.url.pathname.startsWith('/gallery')","page.url.pathname.startsWith(base+'/gallery')");
 await writeFile(path,s);
}
