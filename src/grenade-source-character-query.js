// Staged, source-specific53E240 primitive. No actor bounds/defaults, no globals.
const f=Math.fround;
function origin(p){if(!p||!['source-port','s5-explicit-adaptation','source-initialization-model'].includes(p.kind)||typeof p.source!=='string'||!p.source.trim())throw Error('Explicit source/adaptation provenance required');return p;}
function vec(value,label){if(!Array.isArray(value)||value.length!==3||!value.every(Number.isFinite))throw Error(`Explicit finite ${label} required`);const v=value.map(f);if(!v.every(Number.isFinite))throw Error('Native float32 vector overflow');return v;}
function scalar(value,label){if(!Number.isFinite(value)||value<0||!Number.isFinite(f(value)))throw Error(`Explicit nonnegative native ${label} required`);return f(value);}
const sub=(a,b)=>a.map((v,i)=>f(v-b[i]));
const dot=(a,b)=>f(f(f(a[0]*b[0])+f(a[1]*b[1]))+f(a[2]*b[2])); //100AF90/100B5F0 SSE stores
export function createFloat33InitializationProfile({provenance}={}){
 if(origin(provenance).kind!=='source-initialization-model')throw Error('Select compiled Float33 initialization explicitly');
 return Object.freeze({float33:.5,registry:'0x1642f30/+8',getter:'1053900',index:33,initializer:'10501A0:105290D→1052920',constant:'14C908C:0000003F',provenance:Object.freeze({...provenance}),currentRuntimeObserved:false,nativeReady:false});
}
export function test53e240Geometry({center,radius,anchorSlot7c,extentSlot68,extentSlot6c,float33,coordinateSpace,provenance}={}){
 origin(provenance);if(coordinateSpace!=='s5runtime-source')throw Error('53E240 requires source-native coordinates, never unconverted S5 scene');
 const p=vec(center,'query center'),anchor=vec(anchorSlot7c,'actor slot7C anchor'),a=scalar(extentSlot68,'actor slot68'),b=scalar(extentSlot6c,'actor slot6C'),scale=scalar(float33,'logical Float33'),queryRadius=scalar(radius,'query radius');
 const half=f((b>a?a:b)*scale),base=[anchor[0],f(anchor[1]+half),anchor[2]],delta=[0,b>a?f(b-a):f(a-b),0];
 const expandedRadius=f(queryRadius+half),radiusSquared=f(expandedRadius*expandedRadius);
 let residual=sub(p,base);const projection=dot(residual,delta),lengthSquared=dot(delta,delta);
 if(projection>0){const closest=projection>=lengthSquared?delta:delta.map(v=>f(v*f(projection/lengthSquared)));residual=sub(residual,closest);}
 const distanceSquared=dot(residual,residual);
 if(![half,...base,...delta,radiusSquared,distanceSquared].every(Number.isFinite))throw Error('Native geometry arithmetic overflow');
 return {accepted:radiusSquared>distanceSquared,distanceSquared,radiusSquared,halfExtentScale:scale,actorExpansionRadius:half,segment:{base,delta},
  sourceFunction:'0x53e240',sourceDistanceFunction:'0x119c230',boundary:'strict',sourceGeometryAlgorithmVerified:true,x87BitwiseParityVerified:false,actorGeometryNativeVerified:false,nativeReady:false};
}
function flags(value){for(const k of ['global165ade4','global165ade5','global165ade6','global165ade7'])if(typeof value?.[k]!=='boolean')throw Error(`Explicit inherited ${k} required`);return value;}
function category(actor){const words=actor?.nativeIdWords;if(!Array.isArray(words)||words.length!==2||words.some(v=>!Number.isInteger(v)||v<0||v>0xffffffff))throw Error('Actor vslot2C native ID words required for category filter');return (words[1]>>>16)&7;}
export function enumerate548ae0Snapshot({groups,extraAc4,extraAe0,globals,provenance}={}){
 origin(provenance);flags(globals);if(!Array.isArray(groups)||!Array.isArray(extraAc4)||!Array.isArray(extraAe0))throw Error('Explicit ordered native manager lists required');
 const actors=[];
 for(const group of groups){if(typeof group?.logicalActive8!=='boolean')throw Error('Explicit group+8 logical active required');if(!group.logicalActive8)continue;if(!Array.isArray(group.actors))throw Error('Active native group actor list required');
  for(const actor of group.actors){if(globals.global165ade4&&category(actor)===2)continue;if(globals.global165ade7&&category(actor)===5)continue;actors.push(actor);}
 }
 if(!globals.global165ade5)actors.push(...extraAc4);if(!globals.global165ade6)actors.push(...extraAe0);
 return actors; // preserve native order, duplicates and identities; no sorting
}
function port(p,name){origin(p?.provenance);if(typeof p?.tick!=='function'||['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(p.tick.constructor?.name))throw Error(`Qualified synchronous ${name} port required`);}
function call(p,...args){const value=p.tick(...args);if(value&&typeof value==='object'&&(typeof value.then==='function'||typeof value.next==='function'))throw Error('Synchronous port returned Promise/iterator');return value;}
export function createCharacterQuery53e240(ports){
 for(const name of ['enumerateActors548ae0','readSlot44','readSlot7c','readSlot68','readSlot6c','readFloat33'])port(ports?.[name],name);
 function run(descriptor){
  if(descriptor?.nativeFunction!=='0x53e240'||descriptor.coordinateSpace!=='s5runtime-source'||descriptor.radius!==75)throw Error('Exact Grenade source query descriptor/radius75 required');
  const center=vec(descriptor.center,'query center');
  const enumerated=call(ports.enumerateActors548ae0);if(!Array.isArray(enumerated))throw Error('Explicit ordered native candidates required');const candidates=[...enumerated];
  const actors=[],reports=[];
  for(const actor of candidates){
   const eligible=call(ports.readSlot44,actor);if(typeof eligible!=='boolean')throw Error('Actor slot44 must return explicit boolean');
   if(!eligible){reports.push({actor,eligible:false,accepted:false});continue;}
   const anchorSlot7c=vec(call(ports.readSlot7c,actor),'actor slot7C anchor'),extentSlot68=call(ports.readSlot68,actor),extentSlot6c=call(ports.readSlot6c,actor),float33=call(ports.readFloat33);
   const geometry=test53e240Geometry({...descriptor,center,anchorSlot7c,extentSlot68,extentSlot6c,float33,provenance:{kind:'source-port',source:'qualified explicit actor slots and Float33, supplied per candidate in native call order'}});
   reports.push({actor,eligible:true,...geometry});if(geometry.accepted)actors.push(actor);
  }
  return {actors,reports,sourceEnumeration:'0x548ae0',sourceQuery:'0x53e240',sourceGeometryAlgorithmVerified:true,actorQueryNativeVerified:false,nativeReady:false};
 }
 return Object.freeze({run,queryActors:descriptor=>run(descriptor).actors});
}
