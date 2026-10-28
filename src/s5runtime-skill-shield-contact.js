import * as THREE from 'three';
// CShield7FCF00: actor position + actor forward*float[115] + (0,float[105],0).
// Source floats115=275,105=175; ctor scale float[53]=1.3. Native units only.
export function s5runtimeShieldNativePose({actorPosition,actorForward,actorQuaternion}={}){
 for(const [v,n] of [[actorPosition,3],[actorForward,3],[actorQuaternion,4]])if(!Array.isArray(v)||v.length!==n||!v.every(Number.isFinite))throw Error('Explicit native Shield actor pose required');
 const position=actorPosition.map((v,i)=>v+actorForward[i]*275+(i===1?175:0));
 return {position,quaternion:[...actorQuaternion],scale:[1.3,1.3,1.3],nativeReady:false};
}
export function transformS5RuntimeShieldTriangles(localTriangles,modelWorldMatrix){
 if(!Array.isArray(modelWorldMatrix)||modelWorldMatrix.length!==16||!modelWorldMatrix.every(Number.isFinite))throw Error('Native model world matrix required');
 const matrix=new THREE.Matrix4().fromArray(modelWorldMatrix);
 return localTriangles.map(triangle=>{if(!Array.isArray(triangle)||triangle.length!==3)throw Error('Invalid native Shield triangle');return triangle.map(p=>{if(!Array.isArray(p)||p.length!==3||!p.every(Number.isFinite))throw Error('Invalid native Shield vertex');return new THREE.Vector3().fromArray(p).applyMatrix4(matrix).toArray();});});
}
// Selection guards and strict nearest endpoint follow7FDAC0/7B5F10. Triangle
// math below is a geometric preview: native11FACA0 epsilon/sidedness unverified.
export function queryS5RuntimeShieldSegment({from,to,worldTriangles,queryMask,ownerSlot1c4,requesterSlot1c4,shieldId,nativeContext}={}){
 if(nativeContext?.enabled!==true)return {hit:false,reason:'native-context-required',nativeReady:false};
 if(!Number.isInteger(queryMask)||typeof ownerSlot1c4!=='boolean'||typeof requesterSlot1c4!=='boolean')return {hit:false,reason:'raw-shield-query-predicates-required',nativeReady:false};
 if(!(queryMask&0x800)||ownerSlot1c4===requesterSlot1c4)return {hit:false,reason:'native-shield-query-filtered',nativeReady:false};
 for(const v of [from,to])if(!Array.isArray(v)||v.length!==3||!v.every(Number.isFinite))throw Error('Invalid Shield segment');
 const origin=new THREE.Vector3().fromArray(from),end=new THREE.Vector3().fromArray(to),direction=end.clone().sub(origin),length=direction.length();
 if(!length)return {hit:false,nativeReady:false};direction.divideScalar(length);const ray=new THREE.Ray(origin,direction),point=new THREE.Vector3();let nearest=length,hit=null;
 for(const triangle of worldTriangles){const [a,b,c]=triangle.map(p=>new THREE.Vector3().fromArray(p));if(ray.intersectTriangle(a,b,c,false,point)){const distance=point.distanceTo(origin);if(distance<nearest){nearest=distance;hit=point.clone();}}}
 return hit?{hit:true,point:hit.toArray(),distance:nearest,hitMask:0x800,shieldId,nativeReady:false,qualification:'source-selection-policy; geometric-preview-not-native-intersection-certified'}:{hit:false,nativeReady:false};
}
