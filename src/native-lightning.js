// s5runtimegame.exe1284330/1290270/12904B0/12840C0. This adapter deliberately
// accepts the observed straight Cannonade profile; curved/jittered profiles
// require their native branches rather than a substitute beam.
const f=Math.fround;
export const LIGHTNING_FP_REFERENCE=Object.freeze({precisionBits:24,roundingMode:'nearest',evidence:'work/cannonade-recovery/native-lightning/frame-fpu-v1.json'});
export function cannonadeLightningConfig(node,texture){
 const b=node.fields.base,d=node.fields.data,v=d.versioned;
 const cfg={id:node.index,type:'CActLightning',parentType:b.field0c.int32,parent:b.field10.int32,bone:b.name.value,
  start:b.startTimeField.int32/1000,end:b.endTimeField.int32/1000,
  destination:{type:node.fields.field38.int32,id:node.fields.field3c.int32,bone:node.fields.destinationNodeName.value},
  points:d.fields10to14[0].int32+2,width:d.fields10to14[1].int32,
  displacementSign:d.fields1cto28[0].int32,jitter:d.fields1cto28[1].int32,refreshMs:d.fields1cto28[2].int32,scroll:d.fields1cto28[3].float32,
  riseMs:d.fields30to34[0].int32,fallMs:d.fields30to34[1].int32,
  blend:v.field0c.int32,tiles:v.field2c.float32,depth:!!d.flag38,flags:[!!v.flag39,!!v.flag3a,!!v.flag3b],precisionBits:LIGHTNING_FP_REFERENCE.precisionBits,texture};
 if(cfg.points!==3||cfg.width!==80||cfg.jitter!==0||cfg.blend!==1||cfg.flags.some(Boolean)||cfg.destination.type!==0||cfg.destination.id!==1||cfg.destination.bone||cfg.parentType!==0||cfg.parent!==0||cfg.bone)throw Error('Unported native Lightning profile');
 return cfg;
}
export function createLightningClock(){return {opacity:0,scroll:0,elapsedMs:0};}
export function advanceLightningClock(state,deltaMs,emitting,{riseMs,fallMs,scroll,precisionBits=LIGHTNING_FP_REFERENCE.precisionBits}){
 if(!Number.isInteger(deltaMs)||deltaMs<0||deltaMs>0xffffffff)throw Error('Native uint32 Lightning delta required');
 if(deltaMs===0)return;
 state.elapsedMs=(state.elapsedMs+deltaMs)>>>0;
 //1290303..1290318 uses x87. Six original-frame queries show24-bit/nearest
 // on this reference build. The first standalone CLR oracle used its host FP
 // mode instead; its different intermediates must not override live evidence.
 if(![24,53].includes(precisionBits))throw Error('Unverified Lightning FP precision');
 const round=precisionBits===24?f:value=>value;
 state.scroll=f(state.scroll+round(round(f(deltaMs)*f(scroll))/1000));
 if(emitting&&state.opacity<1)state.opacity=Math.min(1,f(state.opacity+round(f(deltaMs)/f(riseMs))));
 else if(!emitting&&state.opacity>0)state.opacity=Math.max(0,f(state.opacity-round(f(deltaMs)/f(fallMs))));
}
export function lightningPointCenters(start,end,points=3){
 if(points!==3||![...start,...end].every(Number.isFinite))throw Error('Explicit finite straight Lightning endpoints required');
 return Array.from({length:points},(_,i)=>start.map((a,k)=>f(f(a)+f(f(f(end[k])-f(a))*f(i/(points-1))))));
}
