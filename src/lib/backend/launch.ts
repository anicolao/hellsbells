/** Names are preferences. Only Firebase Auth identifies a seat. */
export function playerName(value:string|null|undefined){return value?.trim().slice(0,24)??'';}
export function readLaunch(search:string){
 const params=new URLSearchParams(search),mode=params.get('launch');
 if(mode!==null&&mode!=='create'&&mode!=='join')throw Error('This invitation needs a create or join instruction.');
 const table=(params.get(mode?'table':'game')??'').toUpperCase();
 if(table&&!/^[A-F0-9]{8}$/.test(table)||mode&&!table)throw Error('This invitation needs an eight-character table code.');
 const name=playerName(params.get('name'));
 if(mode&&!name)throw Error('This invitation needs a player name.');
 return {mode,table,name};
}
