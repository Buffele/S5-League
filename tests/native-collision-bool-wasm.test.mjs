import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {nativeBooleanSegmentTriangleDistance as query,interpretNativeBooleanSegmentTriangleDistance as interpret} from '../src/native-collision-bool-distance.js';
import {prepareNativeBooleanDistanceAcceleration,tryPreparedNativeBooleanDistance,readNativeBooleanDistanceAcceleration,setNativeBooleanDistanceAccelerationEnabled} from '../src/native-collision-bool-wasm.js';
import {CONQUEST_NAVIGATION_WORLD_MATH_PROFILE as navigationProfile} from '../src/conquest-navigation-math-profile.js';
import {CONQUEST_NAVIGATION_WORLD_MATH_PROFILE as publicNavigationProfile} from '../src/conquest-navigation-world-queries.js';
import {CONQUEST_MOVEMENT_WORLD_MATH_PROFILE as movementProfile} from '../src/conquest-movement-world-queries.js';
import {NATIVE_BOOL_DISTANCE_PROGRAM as program} from '../src/native-collision-bool-program.js';
import {assertNativeBoolWasmSourceRows} from '../tools/build-native-bool-wasm.mjs';

const fixture=JSON.parse(await fs.readFile(new URL('./fixtures/native-bool-wasm-corpus.json',import.meta.url),'utf8'),(key,value)=>value==='-0'?-0:value),rows=fixture.cases;
const bits=value=>{const view=new DataView(new ArrayBuffer(8));view.setFloat64(0,value,false);return view.getBigUint64(0,false).toString(16).padStart(16,'0');};
function same(actual,expected,label){
 assert.equal(actual.qualified,expected.qualified,label+' qualified');assert.equal(actual.hit,expected.hit,label+' hit');assert.equal(actual.sourceInstructions,expected.sourceInstructions,label+' source instructions');
 if(Number.isNaN(expected.distanceSquared))assert.ok(Number.isNaN(actual.distanceSquared),label+' NaN class (payload/sign are explicitly unqualified)');else assert.equal(bits(actual.distanceSquared),bits(expected.distanceSquared),label+' exact distance64');
 assert.equal(actual.nativeReady,false);assert.equal(actual.x87BitwiseParityVerified,false);assert.equal(actual.numericProfile,expected.numericProfile,label+' profile');
 if(Object.hasOwn(expected,'sourceTrace'))assert.deepEqual(actual.sourceTrace,expected.sourceTrace,label+' trace');else assert.equal(Object.hasOwn(actual,'sourceTrace'),false);
}
async function binaryResponse(url){
 const text=String(url),path=text.startsWith('/assets/')?new URL('../public'+text,import.meta.url):new URL(text,import.meta.url),bytes=await fs.readFile(path);
 return {ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};
}
let readyPromise;
function ready(){return readyPromise??=(async()=>{const previousFetch=globalThis.fetch;globalThis.fetch=binaryResponse;try{const first=prepareNativeBooleanDistanceAcceleration(),second=prepareNativeBooleanDistanceAcceleration();assert.equal(first,second,'one retained preparation promise');await first;}finally{globalThis.fetch=previousFetch;}const snapshot=readNativeBooleanDistanceAcceleration();assert.equal(snapshot.phase,'ready',JSON.stringify(snapshot));return snapshot;})();}

test('permanent corpus pins actual map46 source and preserves negative-zero inputs',async()=>{
 assert.equal(fixture.schema,'native-bool-wasm-source-corpus-v1');assert.equal(rows.length,165);assert.equal(fixture.summary.map46OriginalFaces,1601);assert.equal(fixture.summary.map46Packets,12);assert.equal(fixture.summary.nativeProofCases,97);assert.ok(rows.some(row=>Object.is(row.origin[0],-0)));
 assert.equal(publicNavigationProfile,navigationProfile,'actual navigation consumer retains the exact canonical identity');
 assert.equal(createHash('sha256').update(await fs.readFile(new URL('../public/assets/s5runtime/conquest/collision/46.json',import.meta.url))).digest('hex'),fixture.map46DistributedSha256);
});

test('promoted canonical NAVIGATION backend executes165 cases with exact finite bits and explicit NaN class',async()=>{
 await ready();setNativeBooleanDistanceAccelerationEnabled(true);const before=readNativeBooleanDistanceAcceleration();let nanCases=0;
 for(const row of rows){const args={origin:row.origin,direction:row.direction,packet:row.packet,arithmeticProfile:navigationProfile},beforeInput=structuredClone({origin:row.origin,direction:row.direction,packet:row.packet}),expected=interpret(args),actual=query(args);same(actual,expected,row.id);assert.deepEqual({origin:row.origin,direction:row.direction,packet:row.packet},beforeInput,row.id+' immutable inputs');if(Number.isNaN(actual.distanceSquared))nanCases++;if(row.kind==='native-proof'){assert.equal(actual.distanceSquared,row.source.referenceDistance,row.id+' independently pinned native distance');assert.equal(actual.hit,row.source.referenceHit,row.id+' independently pinned native hit');}}
 const after=readNativeBooleanDistanceAcceleration();assert.equal(after.wasmQueries-before.wasmQueries,165);assert.equal(after.fallbackQueries-before.fallbackQueries,0);assert.ok(nanCases>0);assert.equal(after.busy,false);
});

test('MOVEMENT, cloned NAVIGATION, traces and custom q keep the actual source interpreter',async()=>{
 await ready();setNativeBooleanDistanceAccelerationEnabled(true);const row=rows.find(row=>row.id==='away'),before=readNativeBooleanDistanceAcceleration();
 for(const arithmeticProfile of [movementProfile,Object.freeze({...navigationProfile}),Object.freeze({...navigationProfile,captureSourceTrace:true})]){const args={...row,arithmeticProfile};assert.equal(tryPreparedNativeBooleanDistance(args),null);same(query(args),interpret(args),'unsupported retained/custom profile');}
 function observed(fn){const calls=[],arithmeticProfile={...navigationProfile,source:'Observed custom q stays source VM',roundX87:value=>{calls.push(bits(value));return Math.fround(value);}};return {result:fn({...row,arithmeticProfile}),calls};}
 const expected=observed(interpret),actual=observed(query);same(actual.result,expected.result,'custom q');assert.deepEqual(actual.calls,expected.calls);assert.equal(readNativeBooleanDistanceAcceleration().wasmQueries,before.wasmQueries);assert.ok(readNativeBooleanDistanceAcceleration().fallbackQueries>before.fallbackQueries);
});

test('backend toggle changes execution selection only and stays reversible without preparing again',async()=>{
 await ready();const row=rows[0],args={...row,arithmeticProfile:navigationProfile},expected=interpret(args),before=readNativeBooleanDistanceAcceleration();
 try{setNativeBooleanDistanceAccelerationEnabled(false);assert.equal(readNativeBooleanDistanceAcceleration().enabled,false);assert.equal(tryPreparedNativeBooleanDistance(args),null);same(query(args),expected,'disabled');assert.equal(readNativeBooleanDistanceAcceleration().wasmQueries,before.wasmQueries);assert.throws(()=>setNativeBooleanDistanceAccelerationEnabled('true'));setNativeBooleanDistanceAccelerationEnabled(true);same(query(args),expected,'enabled again');assert.equal(readNativeBooleanDistanceAcceleration().wasmQueries,before.wasmQueries+1);assert.equal(readNativeBooleanDistanceAcceleration().phase,'ready');assert.equal(readNativeBooleanDistanceAcceleration().preparations,before.preparations);assert.equal(readNativeBooleanDistanceAcceleration().programSha256,before.programSha256);assert.equal(readNativeBooleanDistanceAcceleration().binarySha256,before.binarySha256);}
 finally{setNativeBooleanDistanceAccelerationEnabled(true);}
});

test('promoted wrapper preserves getter order on WASM and every source fallback route',async()=>{
 await ready();const row=rows[0];
 function observed(fn,arithmeticProfile){const log=[],packet={};for(const key of ['origin','edge1','edge2'])Object.defineProperty(packet,key,{get:()=>{log.push('packet.'+key);return row.packet[key];}});const result=fn({get origin(){log.push('origin');return row.origin;},get direction(){log.push('direction');return row.direction;},get packet(){log.push('packet');return packet;},get arithmeticProfile(){log.push('profile');return arithmeticProfile;}});return {result,log};}
 for(const arithmeticProfile of [navigationProfile,movementProfile,Object.freeze({...navigationProfile}),Object.freeze({...navigationProfile,captureSourceTrace:true})]){const expected=observed(interpret,arithmeticProfile),actual=observed(query,arithmeticProfile);same(actual.result,expected.result,'getter result');assert.deepEqual(actual.log,expected.log,'no duplicated fallback input getters');}
 setNativeBooleanDistanceAccelerationEnabled(false);try{const expected=observed(interpret,navigationProfile),actual=observed(query,navigationProfile);same(actual.result,expected.result,'disabled getter');assert.deepEqual(actual.log,expected.log);}finally{setNativeBooleanDistanceAccelerationEnabled(true);}
});

test('input Array callbacks can reenter through the real promoted wrapper without overwriting outer memory',async()=>{
 await ready();const outer=rows[0],nested=rows.find(row=>row.id==='away'),before=readNativeBooleanDistanceAcceleration();
 function observed(fn){const log=[],origin=outer.origin.slice();let nestedResult;origin.some=function(callback){log.push('some');return Array.prototype.some.call(this,callback);};origin.map=function(callback){log.push('map');const value=Array.prototype.map.call(this,callback);value.forEach=function(put){log.push('forEach');nestedResult=fn({...nested,arithmeticProfile:navigationProfile});for(let i=0;i<this.length;i++){log.push('put'+i);put(this[i],i,this);}};return value;};return {result:fn({...outer,origin,arithmeticProfile:navigationProfile}),nestedResult,log};}
 const expected=observed(interpret),actual=observed(query);same(actual.result,expected.result,'outer');same(actual.nestedResult,expected.nestedResult,'nested');assert.deepEqual(actual.log,expected.log);const after=readNativeBooleanDistanceAcceleration();assert.equal(after.wasmQueries,before.wasmQueries+1);assert.ok(after.fallbackQueries>before.fallbackQueries);assert.equal(after.busy,false);
});

test('callback/input errors retain source exceptions and reset promoted backend busy state',async()=>{
 await ready();const row=rows[0],failure=Error('actual input callback failure'),origin=row.origin.slice();origin.map=()=>{throw failure;};assert.throws(()=>query({...row,origin,arithmeticProfile:navigationProfile}),error=>error===failure);assert.equal(readNativeBooleanDistanceAcceleration().busy,false);
 const qFailure=Error('actual q callback failure');assert.throws(()=>query({...row,arithmeticProfile:{...navigationProfile,source:'q exception',roundX87:()=>{throw qFailure;}}}),error=>error===qFailure);
 for(const bad of [null,[0,0],[0,NaN,0],[0,Infinity,0],[0,2**129,0]]){const args={...row,origin:bad,arithmeticProfile:navigationProfile};let expected;try{interpret(args);}catch(error){expected=error;}assert.ok(expected);assert.throws(()=>query(args),error=>error.constructor===expected.constructor&&error.message===expected.message);assert.equal(readNativeBooleanDistanceAcceleration().busy,false);}
 same(query({...row,arithmeticProfile:navigationProfile}),interpret({...row,arithmeticProfile:navigationProfile}),'usable after error');
});

test('generator rejects ret immediate before emission while all2350 admitted rows remain valid',()=>{
 const sourceRows=Object.values(program.programs).flat();assert.equal(sourceRows.length,2350);assert.doesNotThrow(()=>assertNativeBoolWasmSourceRows(sourceRows));const modified=sourceRows.map(row=>row[1]==='ret'?[row[0],row[1],[['i',4,4]],row[3]]:row);assert.throws(()=>assertNativeBoolWasmSourceRows(modified),/ret/i);
});

test('prepared executable code is deeply immutable independently of mutable scene objects',async()=>{
 await ready();const row=Object.values(program.programs)[0][0];assert.ok(Object.isFrozen(program)&&Object.isFrozen(program.programs)&&Object.isFrozen(row)&&Object.isFrozen(row[2]));assert.throws(()=>{row[3]++;},TypeError);const constant=Object.values(program.constants)[0];assert.ok(Object.isFrozen(constant));assert.throws(()=>{constant.hex='00';},TypeError);
});

for(const scenario of ['fetch','csp','binary-sha','source-sha'])test('preparation '+scenario+' refusal leaves explicit unavailable state and source fallback',()=>{
 const wasmURL=new URL('../src/native-collision-bool-wasm.js',import.meta.url).href,queryURL=new URL('../src/native-collision-bool-distance.js',import.meta.url).href,profileURL=new URL('../src/conquest-navigation-math-profile.js',import.meta.url).href,programURL=new URL('../src/native-collision-bool-program.js',import.meta.url).href,projectURL=new URL('../',import.meta.url).href;
 const script=`import assert from 'node:assert/strict';import fs from 'node:fs/promises';const scenario=${JSON.stringify(scenario)};let compileCalls=0;const compile=WebAssembly.compile;WebAssembly.compile=async(...args)=>{compileCalls++;if(scenario==='csp')throw Error('fixture CSP compile refusal');return compile(...args);};globalThis.fetch=async value=>{if(scenario==='fetch')throw Error('fixture binary fetch refusal');if(scenario==='binary-sha')return {ok:true,arrayBuffer:async()=>new Uint8Array([0,97,115,109,1,0,0,0]).buffer};const s=String(value),url=s.startsWith('/assets/')?new URL('public'+s,${JSON.stringify(projectURL)}):new URL(s,${JSON.stringify(projectURL)}),b=await fs.readFile(url);return {ok:true,arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)};};if(scenario==='source-sha'){const {NATIVE_BOOL_DISTANCE_PROGRAM:p}=await import(${JSON.stringify(programURL)});Object.values(p.programs)[0][0][3]++;}const w=await import(${JSON.stringify(wasmURL)});await w.prepareNativeBooleanDistanceAcceleration();const d=w.readNativeBooleanDistanceAcceleration();assert.equal(d.phase,'unavailable',JSON.stringify(d));if(scenario==='csp')assert.match(JSON.stringify(d),/CSP/);if(scenario==='fetch')assert.match(JSON.stringify(d),/fetch refusal/);if(scenario==='binary-sha'){assert.match(JSON.stringify(d),/hash|sha|binary|match/i);assert.equal(compileCalls,0);}if(scenario==='source-sha'){assert.match(JSON.stringify(d),/hash|sha|source|program|match/i);assert.equal(compileCalls,0);}else{const {nativeBooleanSegmentTriangleDistance:q,interpretNativeBooleanSegmentTriangleDistance:vm}=await import(${JSON.stringify(queryURL)});const {CONQUEST_NAVIGATION_WORLD_MATH_PROFILE:p}=await import(${JSON.stringify(profileURL)});const a={origin:[0,1,0],direction:[0,-2,0],packet:{origin:[-10,0,-10],edge1:[20,0,0],edge2:[0,0,20]},arithmeticProfile:p};assert.deepEqual(q(a),vm(a));assert.equal(w.readNativeBooleanDistanceAcceleration().wasmQueries,0);assert.ok(w.readNativeBooleanDistanceAcceleration().fallbackQueries>0);}`;
 const result=spawnSync(process.execPath,['--input-type=module','-e',script],{encoding:'utf8',timeout:15000});assert.equal(result.status,0,result.stderr||result.error?.message);
});
