import {Network} from './network';
import {MULTI_INPUTS} from './policy';
/** Insert opponent masks/slots while preserving the old three-player predictions. */
export function transferToMulti(source:Network):Network{
 if(source.inputs===MULTI_INPUTS)return source;
 if(![81,141].includes(source.inputs))throw Error('Unknown source observation schema');
 const next=new Network(MULTI_INPUTS,source.hidden,source.outputs);next.weights.fill(0);next.mode=source.mode;
 const target=(i:number)=>i<75?i:i<81?76+Math.floor((i-75)/3)*4+(i-75)%3:i+10;
 for(let row=0;row<source.hidden;row++){for(let i=0;i<source.inputs;i++)next.weights[row*(MULTI_INPUTS+1)+target(i)]=source.weights[row*(source.inputs+1)+i];next.weights[row*(MULTI_INPUTS+1)+MULTI_INPUTS]=source.weights[row*(source.inputs+1)+source.inputs];}
 next.weights.set(source.weights.subarray(source.hidden*(source.inputs+1)),source.hidden*(MULTI_INPUTS+1));return next;
}
