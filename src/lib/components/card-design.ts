import {getContext,setContext} from 'svelte';
import {BRIDGE_RATIO} from '$lib/art/card-theme';
export type CardDesign='classic'|'indexed';
export type CardEdge='black'|'transparent';
const key=Symbol('hellsbells-card-design');
const edgeKey=Symbol('hellsbells-card-edge');
/** Review surfaces select a design once; every nested production card inherits it. */
export function useCardDesign(){return getContext<CardDesign>(key)??'indexed';}
export function useCardEdge(){return getContext<CardEdge>(edgeKey)??'transparent';}
export function provideCardDesign(design:CardDesign,edge:CardEdge='transparent'){setContext(key,design);setContext(edgeKey,edge);}
export function playingCardRatio(design:CardDesign){return design==='indexed'?BRIDGE_RATIO:1586/992;}
