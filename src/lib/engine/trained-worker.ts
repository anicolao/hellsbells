import type {State,Command} from './types';
import type {Request,Response} from './rl-v2.worker';
let worker:Worker|undefined,sequence=0;
const pending=new Map<number,{resolve:(command:Command)=>void;reject:(error:Error)=>void}>();
/** Keep simulation and model loading off the rendering thread. */
export function trainedCommand(state:State,player:string):Promise<Command>{
 if(!worker){
  worker=new Worker(new URL('./rl-v2.worker.ts',import.meta.url),{type:'module'});
  worker.onmessage=({data}:MessageEvent<Response>)=>{const request=pending.get(data.request);if(!request)return;pending.delete(data.request);if(data.error!==undefined)request.reject(new Error(data.error));else request.resolve(data.command);};
  worker.onerror=event=>{const error=new Error(event.message||'Trained imp could not calculate its move');for(const request of pending.values())request.reject(error);pending.clear();worker?.terminate();worker=undefined;};
 }
 const request=++sequence;
 return new Promise((resolve,reject)=>{pending.set(request,{resolve,reject});try{worker!.postMessage({request,state,player} satisfies Request);}catch(error){pending.delete(request);reject(error instanceof Error?error:new Error(String(error)));}});
}
