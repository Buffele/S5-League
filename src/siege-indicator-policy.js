import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';

// Pinned native build: AEDFD0/AEE0B0 integer gauge conversion, AEE3F0 path
// selection, AEF850 position. Names/thresholds come from those consumers.
// This is the selector, not a claim that S5 supplies the native network states.
const validTeam=t=>t===null||t==='alpha'||t==='beta';
export function siegeIndicatorSelection({gauge,maximum,captureTeam,owner,localTeam}){
 if(!Number.isSafeInteger(gauge)||gauge<-2147483647||gauge>2147483647||!Number.isSafeInteger(maximum)||maximum<-2147483647||maximum>2147483647)throw Error('Native Siege gauge requires signed integer values');
 if(!validTeam(captureTeam)||!validTeam(owner)||!['alpha','beta'].includes(localTeam))throw Error('Explicit Siege team identities required');
 const divisor=Math.max(1,Math.trunc(Math.max(1,maximum)/5));
 let stage=Math.min(5,Math.abs(Math.trunc(gauge/divisor)));
 if(captureTeam===null)stage=0;
 let name;
 if(captureTeam===null)name='indicator_seize_neutral';
 else{
  name='indicator_seize_'+(captureTeam===localTeam?'green':'red')+(stage*20);
  if(stage>0&&stage<5&&captureTeam===owner)name+='_down';
 }
 // Native owned point with zero stage uses the neutral transition in the
 // opposite colour to the incoming capture team (AEE7D8..AEE89E).
 if(owner!==null&&stage===0)name='indicator_seize_neutral_'+(captureTeam===localTeam?'red':'green');
 return Object.freeze({stage,name,source:'model/background/'+name+'.scn',clip:name,loop:captureTeam===null||stage===5,
  base:Object.freeze({colour:captureTeam===null?null:captureTeam===localTeam?'green':'red',clip:'in'+String(stage*20).padStart(2,'0')})});
}

export function siegeIndicatorAnchor(core){
 if(!Array.isArray(core?.center)||!Array.isArray(core?.halfExtents)||core.center.length!==3||core.halfExtents.length!==3||![...core.center,...core.halfExtents].every(Number.isFinite)||core.halfExtents.some(v=>v<0))throw Error('Explicit finite Siege core OBB required');
 // AEF8B9..AEF8D8: core.center.y - core.halfExtent.y * 2 * 2 +30.
 // The OBB passed here already uses S5 world units; convert only30 once.
 return {x:core.center[0],y:core.center[1]-core.halfExtents[1]*4+30*SCN_SCENE_SCALE,z:core.center[2]};
}
