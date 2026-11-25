export function isQuotaError(error:unknown){
 const code=(error as {code?:string}|null)?.code;
 return code==='resource-exhausted'||code==='firestore/resource-exhausted';
}
export class TableConflict extends Error{
 constructor(public revision:number){super('The table changed. Try your move again.');}
}
