/** The shared production bell. Audio unlocks only after a user gesture. */
export function strikeBell(context:BaseAudioContext,destination:AudioNode,volume=.35){
 const time=context.currentTime,nodes:AudioScheduledSourceNode[]=[],bus=context.createGain();bus.gain.value=Math.max(0,Math.min(1,volume))*.3;bus.connect(destination);
 // Inharmonic bronze partials: a low hum, a strong strike and a long, soft tail.
 const ratios=[.5,1,1.506,2.003,2.756,4.07,5.43,6.8],levels=[.22,.72,.38,.24,.17,.10,.055,.025];
 ratios.forEach((ratio,i)=>{const oscillator=context.createOscillator(),envelope=context.createGain();oscillator.type='sine';oscillator.frequency.value=196*ratio;oscillator.detune.value=i%2?1.8:-1.8;const peak=levels[i],decay=5.8-i*.53;envelope.gain.setValueAtTime(.00001,time);envelope.gain.exponentialRampToValueAtTime(peak,time+.007+i*.0003);envelope.gain.exponentialRampToValueAtTime(.00001,time+decay);oscillator.connect(envelope);envelope.connect(bus);oscillator.start(time);oscillator.stop(time+Math.max(.3,decay)+.05);nodes.push(oscillator);});
 const noise=context.createBuffer(1,Math.ceil(context.sampleRate*.08),context.sampleRate),data=noise.getChannelData(0);let seed=1719;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/4294967296*2-1)*Math.exp(-i/(context.sampleRate*.009));}const strike=context.createBufferSource(),filter=context.createBiquadFilter();strike.buffer=noise;filter.type='bandpass';filter.frequency.value=2100;filter.Q.value=.7;const hit=context.createGain();hit.gain.value=.13;strike.connect(filter);filter.connect(hit);hit.connect(bus);strike.start(time);nodes.push(strike);
 return ()=>{bus.gain.cancelScheduledValues(context.currentTime);bus.gain.setTargetAtTime(.00001,context.currentTime,.012);for(const node of nodes)try{node.stop(context.currentTime+.08);}catch{/* Already ended. */}};
}
export class BellAudio{
 private context:AudioContext|undefined;private stop:()=>void=()=>{};
 async unlock(){this.context??=new AudioContext();await this.context.resume();}
 ring(volume=.35){if(this.context?.state==='running'){this.stop();this.stop=strikeBell(this.context,this.context.destination,volume);}}
 silence(){this.stop();this.stop=()=>{};}
 dispose(){this.silence();void this.context?.close();this.context=undefined;}
}
