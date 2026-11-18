import {discardOptions,observeBid} from './policy';
import type {Network} from './network';
import type {State,Command} from '../types';
export function weightedDiscard(s:State,id:string,network:Network,bias:number[]=[]):Command{const options=discardOptions(s,id),values=network.forward(observeBid(s,id,network.inputs)).logits;let best=0;for(let i=1;i<options.length;i++)if(values[i]+(bias[i]??0)>values[best]+(bias[best]??0))best=i;return {type:'discard',cards:options[best]};}
