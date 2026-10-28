// Authenticated immutable source rows for the seven Enter Base CActParticle
// nodes. This retains the native5C byte; converting it tobool loses bit2.
const sources=new WeakMap(),sequences=new WeakMap(),textureAssets=new WeakMap(),f=Math.fround;
export const CONQUEST_ENTER_BASE_PARTICLE_SOURCE_ASSETS=Object.freeze([
 Object.freeze({url:'/assets/conquest/pawn/enter-base/enter-base.seq',bytes:3222,sha256:'a0600484fcb8b0f9f8aa8f02e48dc16cfe1b63dac9c9ccde3950a17827f1235a'}),
 Object.freeze({url:'/assets/conquest/pawn/enter-base/enter-base.json',sha256:'bc4000a063c1c994e49c1b842714c0fdaee46741ca8ea41f6cf0a218b9dd2e33'}),
 Object.freeze({url:'/assets/conquest/pawn/enter-base/assets.json',sha256:'6a4b858cfe0b0853162d9785ab10340d6961a3555b418a93e092b4f94a2b98d3'}),
]);
function bytes(input){if(input instanceof ArrayBuffer)return new Uint8Array(input.slice(0));if(input instanceof Uint8Array)return new Uint8Array(input);throw Error('Actual Enter Base sequence bytes required');}
async function checked(input,asset){const b=bytes(input);if(asset.bytes!==undefined&&b.length!==asset.bytes)throw Error('Enter Base particle source size changed');const digest=await globalThis.crypto.subtle.digest('SHA-256',b);if([...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('')!==asset.sha256)throw Error('Enter Base particle source identity changed');return b;}
export async function prepareConquestEnterBaseParticleSource({sequenceBytes,parsedJsonBytes,manifestBytes}={}){
 const [raw,json,manifestRaw]=await Promise.all([checked(sequenceBytes,CONQUEST_ENTER_BASE_PARTICLE_SOURCE_ASSETS[0]),checked(parsedJsonBytes,CONQUEST_ENTER_BASE_PARTICLE_SOURCE_ASSETS[1]),checked(manifestBytes,CONQUEST_ENTER_BASE_PARTICLE_SOURCE_ASSETS[2])]),parsed=JSON.parse(new TextDecoder().decode(json));
 if(!parsed.coverage?.reachesExactEof||parsed.nodes.length!==7||parsed.nodes.some(n=>n.type!=='CActParticle'))throw Error('Exact seven source Enter Base particle nodes required');
 const nodes=parsed.nodes.map(n=>{
  const c=n.fields.control,p=c.primaryWords,v=c.versioned,keys=n.fields.blockA.entries;
  if(c.versionField!==.5||keys.length!==1)throw Error('Unsupported Enter Base source profile');
  const e=keys[0],emitter={};e.words14to60.forEach((value,i)=>{const off=0x14+i*4;emitter[off]=[0x34,0x58,0x5c,0x60].includes(off)?value.int32:f(value.float32);});
  emitter.sourceFields=Object.freeze({blendMode:p[2].int32,depthFlag64:c.flag64,textureIntervalMs:c.field60.int32,simulationStepMs:v.field68.int32,textures:Object.freeze(n.fields.textures.entries.map(t=>Object.freeze({sourceLiteral:t.path.value,uv:Object.freeze(t.uvWords.map(w=>f(w.float32)))})))});
  return Object.freeze({index:n.index,drawMode:p[0].int32,textureMode:p[1].int32,control54:c.flag54,inheritanceMask:raw[c.field60.offset-1],capacity:c.field58.int32,lifeVariationMs:p[3].int32,commonSizeVariation:f(v.field30.float32),speedVariation:f(p[4].float32),sizeVariation:Object.freeze([p[5].float32,p[6].float32]),rgbVariation:Object.freeze(p.slice(7,10).map(v=>v.float32)),alphaVariation:p[10].float32,angleVariation:p[11].float32,retainSize:v.flags50to53[0],retainRGB:v.flags50to53[1],retainAlpha:v.flags50to53[2],retainAngle:v.flags50to53[3],appearance:Object.freeze(n.fields.blockB.entries.map(row=>Object.freeze(row.map(v=>f(v.float32))))),emitter:Object.freeze(emitter),emitterKeyTime:e.field0c.int32>>>0,emitterContinuous:e.flag10,emitterDuration:n.fields.blockA.field10.int32,emitterLoop:n.fields.blockA.flag14});
 });
 const source=Object.freeze({kind:'conquest-enter-base-particle-source',nodeCount:7,scalarControlLoadQualified:true,appearanceLoaderProducerQualified:false,nativeReady:false});sources.set(source,nodes);
 const manifest=JSON.parse(new TextDecoder().decode(manifestRaw));textureAssets.set(source,Object.freeze(manifest.outputs.map(a=>Object.freeze({...a}))));
 sequences.set(source,Object.freeze({sourcePath:'Resources/Effects/enter_base.seq',headerByte:parsed.header.byteField,loopingFlag:parsed.header.byteField!==0,durationMs:parsed.header.durationField,actions:Object.freeze(parsed.nodes.map(n=>{const b=n.fields.base;return Object.freeze({index:n.index,parentType:b.field0c.int32,parentIndex:b.field10.int32,boneName:b.name.value,startTimeMs:b.startTimeField.int32,endTimeMs:b.endTimeField.int32});}))}));return source;
}
export function conquestEnterBaseParticleSourceNode(source,index){const nodes=sources.get(source);if(!nodes||!Number.isInteger(index)||index<0||index>=nodes.length)throw Error('Owned source Enter Base particle node required');return nodes[index];}
export function conquestEnterBaseParticleSequence(source){const sequence=sequences.get(source);if(!sequence)throw Error('Owned source Enter Base particle sequence required');return sequence;}

export function conquestEnterBaseParticleTextureAssets(source){const rows=textureAssets.get(source);if(!rows)throw Error('Owned source Enter Base particle textures required');return rows;}
