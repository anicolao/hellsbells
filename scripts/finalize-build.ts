import {rm,writeFile,readdir} from 'node:fs/promises';
// Source art remains in the repository, but only web assets are published.
for(const path of ['build/art/v2','build/art/belfry.png','build/art/imps.png','build/art/ui/logo-source.png','build/art/ui/ready-source.png'])await rm(path,{recursive:true,force:true});
// Keep generation sources and superseded art experiments in Git, not Pages.
async function selectedCardArt(directory:string){
 for(const entry of await readdir(`build/art/alternate/${directory}`,{withFileTypes:true})){
  const relative=directory?`${directory}/${entry.name}`:entry.name;
  if(entry.isDirectory())await selectedCardArt(relative);
  else if(!/^(backs|frames|courts)\/.*\.webp$|^powers\/portraits\/.*\.webp$|^suits\/suit-(cups|swords|pentacles)\.webp$/.test(relative))await rm(`build/art/alternate/${relative}`);
 }
}
await selectedCardArt('');
await writeFile('build/.nojekyll','');
