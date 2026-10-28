import {AUDIO_DEFAULT_PERCENT} from './audio-settings.js';
const channels=['sfx','bgm'];
// The existing audioSettings remains the single live sink/gain authority.
// This record is the distinct native-current equivalent; it is not a second bus.
export function createAudioOptionsPort({audioSettings,initialCurrent=null}={}){
 if(!audioSettings?.setPercent)throw TypeError('Actual audio settings required');
 let current={...(initialCurrent??audioSettings.export().percentages)};
 const valid=value=>value&&Object.keys(value).length===2&&channels.every(id=>Number.isInteger(value[id])&&value[id]>=0&&value[id]<=100);
 if(!valid(current))throw TypeError('Invalid initial current audio record');
 const port={id:'audio',source:{open:'D75680/C724D0/122E610',edit:'D757B0/D757E0',commit:'D755E0',cancel:'D755D0',reset:'D754F0'},
  policy:{preview:'live',cancel:'no-op',reset:'current-and-draft'},
  readCurrent:()=>({...current}),defaults:()=>({...AUDIO_DEFAULT_PERCENT}),
  validate(value){if(!valid(value))return {accepted:false,reason:'invalid-percent'};
   for(const id of channels)if(!audioSettings.get(id).available && value[id]!==current[id])return {accepted:false,reason:'unavailable',channel:id};return {accepted:true};},
  writeCurrent(value){current={...value};return {accepted:true};},
  preview(value,{reason}){
   const results=channels.filter(id=>audioSettings.get(id).available).map(id=>audioSettings.get(id).percent===value[id]?
    reason==='retry'?audioSettings.apply(id):{accepted:true,delivered:true}:audioSettings.setPercent(id,value[id]));
   const asynchronous=results.some(row=>row.completion);
   return {accepted:true,delivered:asynchronous?null:results.every(row=>row.delivered!==false),
    completion:asynchronous?Promise.all(results.map(row=>row.completion??row)).then(rows=>({delivered:rows.every(row=>row?.delivered!==false)})):undefined};
  },
 };
 return {port,createView(transaction){
  const update=(id,value)=>{if(!channels.includes(id))return {accepted:false,reason:'unknown-channel'};
   const state=transaction.snapshot();if(state.phase!=='open')return {accepted:false,reason:'closed'};
   return transaction.stage('audio',{...state.draft.audio,[id]:value});};
  return Object.freeze({
   get:id=>audioSettings.get(id),snapshot:()=>audioSettings.snapshot(),
   setPercent:update,
   setMuted(id,muted){
    if(transaction.snapshot().phase!=='open')return {accepted:false,reason:'closed'};
    const result=audioSettings.setMuted(id,muted);if(!result.accepted)return result;
    return {...update(id,audioSettings.get(id).percent),completion:result.completion};
   },
   reset:id=>transaction.reset('audio',[id]),apply:id=>channels.includes(id)?transaction.retryPreview('audio'):{accepted:false,reason:'unknown-channel'},
   subscribe(listener){const a=audioSettings.subscribe(listener),b=transaction.subscribe(listener);return()=>{a();b();};},
   export:()=>({version:1,percentages:{...current}}),
  });
 }};
}
