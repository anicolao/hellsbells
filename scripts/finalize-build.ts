import {rm,writeFile} from 'node:fs/promises';
// Source art remains in the repository, but only web assets are published.
for(const path of ['build/art/v2','build/art/belfry.png','build/art/imps.png','build/art/ui/logo-source.png','build/art/ui/ready-source.png'])await rm(path,{recursive:true,force:true});
await writeFile('build/.nojekyll','');
