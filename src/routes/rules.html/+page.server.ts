import {readFileSync} from 'node:fs';
import {marked} from 'marked';
export function load(){const source=readFileSync('HELLS_BELLS_RULES.md','utf8');const sections=source.split(/\n(?=## )/).slice(1).map((text,i)=>({id:`reference-${i}`,title:text.match(/^## (.+)/)?.[1]??'Rules',html:marked.parse(text.replace(/^## .+\n/,'')) as string}));return {sections};}
