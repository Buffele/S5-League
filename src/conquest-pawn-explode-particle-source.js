// Authenticated immutable source rows for the two PawnExplode third effect CActParticle
// nodes. This retains the native5C byte; converting it tobool loses bit2.
const sources=new WeakMap(),sequences=new WeakMap(),textureAssets=new WeakMap(),f=Math.fround;
import {CONQUEST_PAWN_EXPLODE_PARTICLE_ASSETS as assets} from './conquest-pawn-explode-particle-assets.js';
export const CONQUEST_PAWN_EXPLODE_PARTICLE_SOURCE_ASSETS=Object.freeze(assets.sourceAssets.map(Object.freeze));
function bytes(input){if(input instanceof ArrayBuffer)return new Uint8Array(input.slice(0));if(input instanceof Uint8Array)return new Uint8Array(input);throw Error('Actual PawnExplode third effect sequence bytes required');}
async function checked(input,asset){const b=bytes(input);if(asset.bytes!==undefined&&b.length!==asset.bytes)throw Error('PawnExplode third effect particle source size changed');const digest=await globalThis.crypto.subtle.digest('SHA-256',b);if([...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('')!==asset.sha256)throw Error('PawnExplode third effect particle source identity changed');return b;}
export async function prepareConquestPawnExplodeParticleSource({sequenceBytes,parsedJsonBytes,manifestBytes}={}){
 const [raw,json,manifestRaw]=await Promise.all([checked(sequenceBytes,CONQUEST_PAWN_EXPLODE_PARTICLE_SOURCE_ASSETS[0]),checked(parsedJsonBytes,CONQUEST_PAWN_EXPLODE_PARTICLE_SOURCE_ASSETS[1]),checked(manifestBytes,CONQUEST_PAWN_EXPLODE_PARTICLE_SOURCE_ASSETS[2])]),parsed=JSON.parse(new TextDecoder().decode(json));
 if(!parsed.coverage?.reachesExactEof||parsed.nodes.length!==2||parsed.nodes.some(n=>n.type!=='CActParticle'))throw Error('Exact two source PawnExplode third effect particle nodes required');
 const nodes=parsed.nodes.map(n=>{
  const c=n.fields.control,p=c.primaryWords,v=c.versioned,keys=n.fields.blockA.entries;
  if(c.versionField!==.5||keys.length!==1)throw Error('Unsupported PawnExplode third effect source profile');
  const e=keys[0],emitter={};e.words14to60.forEach((value,i)=>{const off=0x14+i*4;emitter[off]=[0x34,0x58,0x5c,0x60].includes(off)?value.int32:f(value.float32);});
  emitter.sourceFields=Object.freeze({blendMode:p[2].int32,depthFlag64:c.flag64,textureIntervalMs:c.field60.int32,simulationStepMs:v.field68.int32,textures:Object.freeze(n.fields.textures.entries.map(t=>Object.freeze({sourceLiteral:t.path.value,uv:Object.freeze(t.uvWords.map(w=>f(w.float32)))})))});
  return Object.freeze({index:n.index,drawMode:p[0].int32,textureMode:p[1].int32,control54:c.flag54,inheritanceMask:raw[c.field60.offset-1],capacity:c.field58.int32,lifeVariationMs:p[3].int32,commonSizeVariation:f(v.field30.float32),speedVariation:f(p[4].float32),sizeVariation:Object.freeze([p[5].float32,p[6].float32]),rgbVariation:Object.freeze(p.slice(7,10).map(v=>v.float32)),alphaVariation:p[10].float32,angleVariation:p[11].float32,retainSize:v.flags50to53[0],retainRGB:v.flags50to53[1],retainAlpha:v.flags50to53[2],retainAngle:v.flags50to53[3],appearance:Object.freeze(n.fields.blockB.entries.map(row=>Object.freeze(row.map(v=>f(v.float32))))),emitter:Object.freeze(emitter),emitterKeyTime:e.field0c.int32>>>0,emitterContinuous:e.flag10,emitterDuration:n.fields.blockA.field10.int32,emitterLoop:n.fields.blockA.flag14});
 });
 const source=Object.freeze({kind:'conquest-pawn-explode-particle-source',nodeCount:2,scalarControlLoadQualified:true,appearanceLoaderProducerQualified:false,nativeReady:false});sources.set(source,nodes);
 const manifest=JSON.parse(new TextDecoder().decode(manifestRaw));textureAssets.set(source,Object.freeze(assets.textures.map(a=>Object.freeze({...a}))));
 sequences.set(source,Object.freeze({sourcePath:'Effects/pve_mon_pawn_red_eff3.seq',headerByte:parsed.header.byteField,loopingFlag:parsed.header.byteField!==0,durationMs:parsed.header.durationField,actions:Object.freeze(parsed.nodes.map(n=>{const b=n.fields.base;return Object.freeze({index:n.index,parentType:b.field0c.int32,parentIndex:b.field10.int32,boneName:b.name.value,startTimeMs:b.startTimeField.int32,endTimeMs:b.endTimeField.int32});}))}));return source;
}
export function conquestPawnExplodeParticleSourceNode(source,index){const nodes=sources.get(source);if(!nodes||!Number.isInteger(index)||index<0||index>=nodes.length)throw Error('Owned source PawnExplode third effect particle node required');return nodes[index];}
export function conquestPawnExplodeParticleSequence(source){const sequence=sequences.get(source);if(!sequence)throw Error('Owned source PawnExplode third effect particle sequence required');return sequence;}

export function conquestPawnExplodeParticleTextureAssets(source){const rows=textureAssets.get(source);if(!rows)throw Error('Owned source PawnExplode third effect particle textures required');return rows;}
