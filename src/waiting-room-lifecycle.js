// A joined room survives a match. Results never launch a second match.
export const ROOM_RESULTS_SECONDS=15;
export function createWaitingRoomLifecycle({now=()=>performance.now()}={}){
 let phase='outside',serial=0,token=null,lastResult=null,resultDeadline=null;
 const snapshot=()=>Object.freeze({phase,serial,token,lastResult,resultsRemaining:phase==='results'?Math.max(0,(resultDeadline-now())/1000):null,joined:phase!=='outside',inRoom:phase==='waiting',canStart:phase==='waiting'});
 function enter(){if(!['outside','results','returning'].includes(phase))return {accepted:false,reason:'room-unavailable'};phase='waiting';token=null;serial++;return {accepted:true};}
 function beginStart(){if(phase!=='waiting')return {accepted:false,reason:'not-waiting'};phase='starting';token=++serial;return {accepted:true,token};}
 function started(value){if(phase!=='starting'||value!==token)return {accepted:false,reason:'stale-start'};phase='playing';token=null;lastResult=null;return {accepted:true};}
 function startFailed(value){if(phase!=='starting'||value!==token)return {accepted:false,reason:'stale-start'};phase='waiting';token=null;return {accepted:true};}
 function results(result){if(phase!=='playing')return {accepted:false,reason:'not-playing'};lastResult=result;resultDeadline=now()+ROOM_RESULTS_SECONDS*1000;phase='results';serial++;return {accepted:true};}
 function resultsElapsed(){if(phase!=='results'||now()<resultDeadline)return false;phase='returning';return true;}
 function beginReturn(){if(!['playing','results','returning'].includes(phase))return {accepted:false,reason:'no-match'};phase='returning';token=null;return {accepted:true};}
 function returnToRoom(){if(!['playing','results','returning'].includes(phase))return {accepted:false,reason:'no-match'};phase='waiting';token=null;resultDeadline=null;serial++;return {accepted:true};}
 function leave(){phase='outside';token=null;lastResult=null;serial++;return {accepted:true};}
 return Object.freeze({snapshot,enter,beginStart,started,startFailed,results,resultsElapsed,beginReturn,returnToRoom,leave});
}
