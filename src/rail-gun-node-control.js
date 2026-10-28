export function railGunChargeNodeControl(node){
 if(node?.type!=='CActNodeControl')throw new TypeError('Rail charge CActNodeControl required');const f=node.fields,b=f.base,v=f.versioned,t=f.transformControl;
 const cfg={id:node.index,type:node.type,parentType:b.field0c.int32,parent:b.field10.int32,bone:b.name.value,start:b.startTimeField.int32/1000,end:b.endTimeField.int32/1000,control:{inherit:!!v.flags38to3a[0],destType:v.field3c.int32,destId:v.field40.int32,destNode:v.textureKey.value,positionMode:v.fields5cto64[0].int32,rotationMode:v.fields5cto64[1].int32,scaleMode:v.fields5cto64[2].int32},nativeReady:false};
 if(cfg.parentType!==1||cfg.parent!==30||cfg.bone||cfg.control.destType!==1||cfg.control.destId!==30||cfg.control.destNode||!cfg.control.inherit||v.flags38to3a[1]||v.flags38to3a[2]||[cfg.control.positionMode,cfg.control.rotationMode,cfg.control.scaleMode].join()!=='0,1,0'||f.scriptKeys.count||t.positionKeys.count||t.rotationKeys.count||t.scaleKeys.count||t.positionWords.some(w=>w.float32!==0)||t.rotationWords.map(w=>w.float32).join()!=='0,0,0,1'||t.scaleWords.some(w=>w.float32!==1))throw new Error('Unverified Rail charge NodeControl profile');
 return cfg;
}
// 1201BC0→119F5D0 kind1 resolves the sequence's actor collection by index.
// It returns null when count<=index. Do not alias serialized target30 to0.
export function resolveRailGunChargeControlActor(config,{actorCount,actorAt}={}){
 if(!Number.isInteger(actorCount)||actorCount<0||typeof actorAt!=='function')throw new TypeError('Explicit actor collection count/resolver required');if(config.parentType!==1||config.control.destType!==1)throw new Error('Rail charge direct actor indices required');
 const resolve=id=>id>=0&&id<actorCount?actorAt(id):null;return {target:resolve(config.parent),destination:resolve(config.control.destId),actorCount,nativeCollectionCountVerified:false,nativeReady:false};
}
