import {trainedBotCommand} from './trained-bot';
import type {State,Command} from './types';
export type Request={request:number;state:State;player:string};
export type Response={request:number;command:Command;error?:never}|{request:number;error:string;command?:never};
const scope=globalThis as unknown as Pick<Worker,'onmessage'|'postMessage'>;
scope.onmessage=({data}:MessageEvent<Request>)=>{
 let response:Response;
 try{response={request:data.request,command:trainedBotCommand(data.state,data.player)};}
 catch(error){response={request:data.request,error:error instanceof Error?error.message:String(error)};}
 scope.postMessage(response);
};
