import {nativePointTriangleDistanceSquared} from './native-post-move-query.js';
import {CONQUEST_NAVIGATION_WORLD_MATH_PROFILE} from './conquest-navigation-math-profile.js';
import {NATIVE_BOOL_DISTANCE_PROGRAM} from './native-collision-bool-program.js';
import {NATIVE_BOOL_WASM_SOURCE_SHA256, NATIVE_BOOL_WASM_BINARY_SHA256} from './native-collision-bool-wasm-manifest.js';

const f = Math.fround, threshold = 9.999999960041972e-13;
const xyz = v => {
 if (!Array.isArray(v) || v.length !== 3 || v.some(x => !Number.isFinite(x) || !Number.isFinite(f(x)))) throw Error('Finite native XYZ required');
 return v.map(f);
};
const hex = hash => Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
let preparation, phase = 'unprepared', preparationError = null, instance = null, memory = null, mem = null;
let enabled = true, busy = false, currentProfile = null, programReadonly = false, programSha256 = null, binarySha256 = null;
let preparations = 0, wasmQueries = 0, fallbackQueries = 0, pointTriangleCalls = 0, lastPath = null, lastFallbackReason = null;
const fallbackReasons = {unsupported: 0, disabled: 0, busy: 0, notReady: 0};

function freezeExecutableProgram() {
 const seen = new Set(), objects = [];
 function validate(value) {
  if (value === null || typeof value !== 'object') {
   if (!['number', 'string', 'boolean', 'object'].includes(typeof value) || typeof value === 'number' && !Number.isFinite(value)) throw Error('Bool Wasm requires plain JSON executable data');
   return;
  }
  if (seen.has(value)) throw Error('Bool Wasm requires acyclic unaliased executable JSON');
  seen.add(value); objects.push(value);
  if (Object.getPrototypeOf(value) !== (Array.isArray(value) ? Array.prototype : Object.prototype) || Object.getOwnPropertySymbols(value).length) throw Error('Bool Wasm requires plain executable data');
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
   if (!('value' in descriptor)) throw Error('Bool Wasm executable accessors refused');
   if (Array.isArray(value) && key === 'length') continue;
   validate(descriptor.value);
  }
 }
 validate(NATIVE_BOOL_DISTANCE_PROGRAM);
 // Native executable data is read-only. Freeze synchronously before the async
 // hash so retained VM rows/constants cannot change during preparation.
 for (const object of objects) Object.freeze(object);
 programReadonly = true;
 return new TextEncoder().encode(JSON.stringify(NATIVE_BOOL_DISTANCE_PROGRAM));
}

const vec = at => [0, 4, 8].map(i => mem.getFloat32(at + i, true));
const put = (at, values) => values.forEach((x, i) => mem.setFloat32(at + i * 4, x, true));

// Optional acceleration never prevents the existing VM from being used. The
// same promise is retained on success or failure; no per-query preparation/hash.
export function prepareNativeBooleanDistanceAcceleration() {
 if (preparation) return preparation;
 preparations++; phase = 'preparing';
 preparation = (async () => {
  try {
   const programBytes = freezeExecutableProgram();
   programSha256 = hex(await crypto.subtle.digest('SHA-256', programBytes));
   if (programSha256 !== NATIVE_BOOL_WASM_SOURCE_SHA256) throw Error('Bool Wasm executable source does not match compiled program');
   const response = await fetch(new URL('./native-collision-bool.wasm', import.meta.url));
   if (!response.ok) throw Error('Bool Wasm asset unavailable: ' + response.status);
   const bytes = await response.arrayBuffer();
   binarySha256 = hex(await crypto.subtle.digest('SHA-256', bytes));
   if (binarySha256 !== NATIVE_BOOL_WASM_BINARY_SHA256) throw Error('Bool Wasm binary does not match generated manifest');
   const module = await WebAssembly.compile(bytes);
   instance = await WebAssembly.instantiate(module, {host: {point(a, b) {
    pointTriangleCalls++;
    // Keep119C440 in its original JS implementation, with the actual retained
    // caller profile and identical input-vector construction/store ordering.
    return nativePointTriangleDistanceSquared({point: vec(a), packet: {origin: vec(b + 4), edge1: vec(b + 16), edge2: vec(b + 28)}, arithmeticProfile: currentProfile}).distanceSquared;
   }}});
   memory = instance.exports.memory;
   // The second private page is only x87 workspace; source input Array methods
   // still observe the original exactly64K DataView write bounds.
   mem = new DataView(memory.buffer, 0, 0x10000); phase = 'ready';
  } catch (error) {
   instance = null; memory = null; mem = null;
   phase = 'unavailable'; preparationError = error?.message ?? String(error);
  }
  return readNativeBooleanDistanceAcceleration();
 })();
 return preparation;
}

function fallback(reason) {
 fallbackQueries++; fallbackReasons[reason]++; lastPath = 'javascript'; lastFallbackReason = reason; return null;
}

// Returning null asks the public owner to run its original interpreter. This
// module never imports that owner, avoiding a VM/profile initialization cycle.
export function tryPreparedNativeBooleanDistance({origin, direction, packet, arithmeticProfile} = {}) {
 if (arithmeticProfile !== CONQUEST_NAVIGATION_WORLD_MATH_PROFILE) return fallback('unsupported');
 if (!enabled) return fallback('disabled');
 if (busy) return fallback('busy');
 if (phase !== 'ready') return fallback('notReady');
 busy = true; currentProfile = arithmeticProfile; wasmQueries++; lastPath = 'wasm'; lastFallbackReason = null;
 try {
  instance.exports.reset();
  // Preserve source xyz/map/forEach/put interleaving. Nested calls reach the
  // original VM through the busy null return and own independent memory.
  mem.setUint32(0x100, 0x149e5a0, true); put(0x104, xyz(origin)); put(0x110, xyz(direction));
  mem.setUint32(0x200, 0x149fe64, true); put(0x204, xyz(packet?.origin)); put(0x210, xyz(packet?.edge1)); put(0x21c, xyz(packet?.edge2));
  const distanceSquared = instance.exports.run(), sourceInstructions = instance.exports.steps();
  lastPath = 'wasm'; lastFallbackReason = null;
  return {qualified: Number.isFinite(distanceSquared), distanceSquared, hit: distanceSquared <= threshold, sourceInstructions,
   nativeReady: false, x87BitwiseParityVerified: false, numericProfile: arithmeticProfile.source};
 } finally {busy = false; currentProfile = null;}
}

// Snapshots are explicit diagnostic calls, never constructed in the frame loop.
// Counters are cumulative so callers can compare deltas across an A/B window.
export function readNativeBooleanDistanceAcceleration() {
 return {phase, ready: phase === 'ready', wasmAvailable: phase === 'ready', enabled, busy, preparations, preparationError,
  wasmQueries, fallbackQueries, fallbackReasons: {...fallbackReasons}, pointTriangleCalls, lastPath, lastFallbackReason,
  memoryBytes: memory?.buffer.byteLength ?? 0, sourceMemoryBytes: 0x10000, programReadonly, programSha256, binarySha256,
  expectedProgramSha256: NATIVE_BOOL_WASM_SOURCE_SHA256, expectedBinarySha256: NATIVE_BOOL_WASM_BINARY_SHA256,
  profileIdentityOnly: true, profile: 'retained-navigation-only', nativeReady: false, x87BitwiseParityVerified: false};
}

export function setNativeBooleanDistanceAccelerationEnabled(value) {
 if (typeof value !== 'boolean' || busy) throw Error('Boolean acceleration switch outside query required');
 enabled = value; return enabled;
}
