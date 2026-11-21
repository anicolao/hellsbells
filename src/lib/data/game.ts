import catalog from './catalog.json';
export type Suit = 'Wands' | 'Cups' | 'Swords' | 'Pentacles';
export const suits: Suit[] = ['Wands','Cups','Swords','Pentacles'];
export const suitSymbols: Record<Suit,string> = {Wands:'⚚',Cups:'♜',Swords:'†',Pentacles:'✵'};
export const ranks = ['Ace','2','3','4','5','6','7','8','9','10','Page','Knight','Queen','King'];
export type PlayingCard = {id:string;kind:'minor';name:string;suit:Suit;rank:number};
export type ImpCard = (typeof catalog.imps)[number] & {kind:'imp'};
export type ArcanaCard = Omit<(typeof catalog.arcana)[number], 'kind'|'suit'> & {kind:'arcana';suit:Suit};
export const imps = catalog.imps as ImpCard[];
export const arcana = catalog.arcana as ArcanaCard[];
export const minor: PlayingCard[] = suits.flatMap(suit=>ranks.map((name,i)=>({id:`${suit}-${i}`,kind:'minor',name:`${name} of ${suit}`,suit,rank:i+1})));
export type GameCard = PlayingCard | ImpCard | ArcanaCard;
export const allCards: GameCard[] = [...imps,...arcana,...minor];
export function roundSetup(players:number,round:number) {const dealt=Math.floor((56-players)/players);return {dealt,reserve:56-dealt*players,discard:round,tricks:dealt-round};}
export function penalty(round:number,bid:number,won:number){return round*Math.abs(won-bid);}

export function roundsForPlayers(players:number){if(players===3)return 6;if(players===4)return 8;if(players===5)return 5;throw Error("Expected 3–5 players");}
