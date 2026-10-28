import {Matrix4,Vector3} from 'three';
const matrix=m=>{if(!m?.isMatrix4||!m.elements.every(Number.isFinite))throw new TypeError('Explicit finite Assault external matrix required');return m.clone();};
export function assaultRifleLightningConfig(node,texture){
 if(node?.type!=='CActLightning')throw new TypeError('Assault CActLightning source required');
 const b=node.fields.base,d=node.fields.data,v=d.versioned,cfg={id:node.index,type:'CActLightning',parentType:b.field0c.int32,parent:b.field10.int32,bone:b.name.value,start:b.startTimeField.int32/1000,end:b.endTimeField.int32/1000,destination:{type:node.fields.field38.int32,id:node.fields.field3c.int32,bone:node.fields.destinationNodeName.value},points:d.fields10to14[0].int32+2,width:d.fields10to14[1].int32,displacementSign:d.fields1cto28[0].int32,jitter:d.fields1cto28[1].int32,refreshMs:d.fields1cto28[2].int32,scroll:d.fields1cto28[3].float32,riseMs:d.fields30to34[0].int32,fallMs:d.fields30to34[1].int32,blend:v.field0c.int32,tiles:v.field2c.float32,depth:!!d.flag38,flags:[!!v.flag39,!!v.flag3a,!!v.flag3b],texture,nativeReady:false};
 if(cfg.parentType!==0||cfg.parent!==1||cfg.bone||cfg.destination.type!==0||cfg.destination.id!==2||cfg.destination.bone||cfg.points!==3||cfg.width!==5||cfg.jitter!==0||cfg.blend!==1||cfg.flags.some(Boolean))throw Error('Unverified Assault Lightning profile');return cfg;
}
export function createAssaultRifleLightningContext({rootMatrix,muzzleEvaluatedMatrix,eventVector2C,coordinateSpace,modelCC}={}){
 if(coordinateSpace!=='s5-world')throw new TypeError('Assault coordinates must cross native-to-world boundary exactly once');
 if(!Number.isInteger(modelCC))throw new TypeError('Explicit native model+CC value required');
 if(modelCC!==0)return {supported:false,reason:'Native model+CC alternative A producer unresolved',nativeReady:false};
 const root=matrix(rootMatrix),muzzle=matrix(muzzleEvaluatedMatrix),a=new Vector3().setFromMatrixPosition(muzzle);
 if(!eventVector2C||![eventVector2C.x,eventVector2C.y,eventVector2C.z].every(Number.isFinite))throw new TypeError('Explicit finite event+2C vector required');
 const b=new Vector3().copy(eventVector2C);
 return {supported:true,externals:[root,new Matrix4().makeTranslation(a.x,a.y,a.z),new Matrix4().makeTranslation(b.x,b.y,b.z),null],roles:['root','sampled-muzzle-A','event-vector-B','auxiliary-C-position-unresolved'],provenance:{A:'72A0C0 node assult_Fire_Dummy evaluated matrix translation +30/+34/+38',B:'72A0C0 event object vector+2C, producer hit/miss/range unresolved',registration:'AFACA0 root before AFD1C0 appends A/B/C',coordinateSpace},socketSampledAtDispatch:true,liveSocketFollow:false,laterExternalUpdatesVerified:false,nativeReady:false};
}
export function assaultRifleLightningEndpoints(config,context){
 if(!context?.supported)throw Error('Assault external context unavailable');if(config.parentType!==0||config.destination.type!==0||config.parent!==1||config.destination.id!==2)throw Error('Assault direct external slots1/2 required');
 return {startMatrix:matrix(context.externals[1]),endMatrix:matrix(context.externals[2]),rootMatrix:matrix(context.externals[0]),nativeReady:false};
}
