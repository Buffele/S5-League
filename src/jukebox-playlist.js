import {JUKEBOX_DATA} from './options-jukebox-data.js';
const keys=new Set(JUKEBOX_DATA.catalog.map(row=>row.key));
export const JUKEBOX_DEFAULTS=Object.freeze({...JUKEBOX_DATA.station2Defaults,slots:Object.freeze([...JUKEBOX_DATA.station2Defaults.slots])});
export function validPlaylist(value){return value&&Object.keys(value).length===3&&value.nativeMapId===66&&typeof value.random==='boolean'&&Array.isArray(value.slots)&&value.slots.length===3&&value.slots.every(key=>key===''||keys.has(key));}
// 6F1420 refills the consumed queue and performs2*n swaps using rand()%n.
// Injection names the S5 RNG policy; no native CRT random sequence is claimed.
export function createJukeboxQueue(record,{nextInt=null,rngPolicy=null}={}){
 if(!validPlaylist(record))throw TypeError('Authenticated three-slot map66 record required');
 if(record.random&&(typeof nextInt!=='function'||typeof rngPolicy!=='string'||!rngPolicy))throw TypeError('Explicit RNG policy required');
 const indices=record.slots.map((key,index)=>key?index:null).filter(index=>index!==null);let order=[...indices],pending=[];
 return {next(){if(!indices.length)return null;if(!pending.length){if(record.random)for(let i=0;i<2*order.length;i++){const a=nextInt(order.length),b=nextInt(order.length);if(!Number.isInteger(a)||a<0||a>=order.length||!Number.isInteger(b)||b<0||b>=order.length)throw RangeError('Invalid injected RNG index');[order[a],order[b]]=[order[b],order[a]];}pending=[...order];}const index=pending.shift();return {index,key:record.slots[index]};},snapshot:()=>({pending:[...pending],indices:[...indices],order:[...order],rngPolicy:record.random?rngPolicy:null})};
}
