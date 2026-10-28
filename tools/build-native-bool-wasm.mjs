import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {NATIVE_BOOL_DISTANCE_PROGRAM as defaultSource} from '../src/native-collision-bool-program.js';

// Safe to import from tests: no code generation or tool dependency is loaded.
export function assertNativeBoolWasmSourceRows(rows) {
 if (!Array.isArray(rows)) throw Error('Explicit native boolean source rows required');
 for (const row of rows) {
  if (!Array.isArray(row) || !Array.isArray(row[2])) throw Error('Explicit source instruction operands required');
  // The validated ABI has two plain returns. An immediate would require extra
  // source stack cleanup; reject it instead of silently compiling plain ret.
  if (row[1] === 'ret' && row[2].length !== 0) throw Error('Unsupported native bool ret immediate/stack cleanup');
 }
 return true;
}

export async function buildNativeBooleanDistanceWasm({source = defaultSource, wabtModule = 'wabt', check = false} = {}) {
const rows = Object.values(source.programs).flat();
assertNativeBoolWasmSourceRows(rows);
const table = new Map(rows.map(r => [r[0], r]));
const entries = Object.keys(source.programs).map(Number), leaders = new Set(entries);
const builtinPush = new Set([0x100af90, 0x100b5f0, 0x119c440]);
const calls = new Set(rows.filter(r => r[1] === 'call').map(r => r[2][0][1]));
for (const [ip, op, args, next] of rows) {
 if (['jb', 'jbe', 'je', 'jmp'].includes(op)) {
  if (args[0][0] !== 'i' || args[0][1] <= ip) throw Error('Only proven forward immediate branches admitted');
  leaders.add(args[0][1]); leaders.add(next);
 }
 if (op === 'call') leaders.add(next);
}
// Establish stack validity on both outcomes of every source branch, including
// degenerate/NaN paths. Internal128B500 is nonrecursive and returns one value.
let maximumFP = 0, checkedRows = 0;
for (const entry of entries) {
 const depths = new Map(), pending = [[entry, 0]];
 while (pending.length) {
  const [ip, input] = pending.pop();
  if (depths.has(ip)) {if (depths.get(ip) !== input) throw Error('Inconsistent x87 stack join'); continue;}
  depths.set(ip, input); checkedRows++;
  const row = table.get(ip); if (!row) throw Error('Missing reachable source instruction');
  const [, op, args, next] = row;
  let depth = input;
  for (const a of args) if (a[0] === 'r' && a[1].startsWith('st(') && Number(a[1].slice(3, -1)) >= input) throw Error('Undefined source x87 operand');
  if (['fld', 'fldz', 'fld1'].includes(op)) depth++;
  if (['fstp', 'faddp', 'fsubp', 'fdivrp', 'fcompi'].includes(op)) depth--;
  if (op === 'call' && (builtinPush.has(args[0][1]) || entries.includes(args[0][1]))) depth++;
  if (depth < 0 || depth > 8) throw Error('Unqualified source x87 stack range');
  maximumFP = Math.max(maximumFP, depth);
  if (op === 'ret') {if (depth !== 1) throw Error('Source must return one x87 result'); continue;}
  if (op !== 'jmp') pending.push([next, depth]);
  if (['jb', 'jbe', 'je', 'jmp'].includes(op)) pending.push([args[0][1], depth]);
 }
}
const ic = x => `(i32.const ${x | 0})`, fc = x => `(f64.const ${Object.is(x, -0) ? '-0' : x})`;
const g = n => `(global.get $${n})`, set = (n, v) => `(global.set $${n} ${v})`;
const addr = o => `(i32.add (i32.add ${o[1] ? g(o[1]) : ic(0)} ${o[2] ? `(i32.mul ${g(o[2])} ${ic(o[3])})` : ic(0)}) ${ic(o[4])})`;
const constant = (o, float) => {
 const at = o[4];
 if (!float && at === 0x15f67b0) return ic(0);
 const c = source.constants[at]; if (!c) throw Error('Unknown immutable source address ' + at.toString(16));
 const bytes = Uint8Array.from(c.hex.match(/../g), x => parseInt(x, 16)), view = new DataView(bytes.buffer);
 return float ? fc(o[5] === 8 ? view.getFloat64(0, true) : view.getFloat32(0, true)) : ic(view.getUint32(0, true));
};
function readI(o) {
 if (o[0] === 'i') return ic(o[1]);
 if (o[0] === 'r') return o[1] === 'al' ? `(i32.and ${g('eax')} ${ic(255)})` : g(o[1]);
 if (!o[1] && !o[2] && o[4] >= 65536) return constant(o, false);
 return `(i32.load${o[5] === 1 ? '8_u' : o[5] === 2 ? '16_u' : ''} ${addr(o)})`;
}
function readF(o) {
 if (o[0] === 'i') return fc(o[1]);
 if (o[0] === 'r') {
  if (o[1].startsWith('st(')) return `(call $fpget ${ic(Number(o[1].slice(3, -1)))})`;
  if (o[1] === 'xmm0') return `(f64.promote_f32 ${g('xmm0')})`;
  return `(f64.convert_i32_u ${readI(o)})`;
 }
 if (!o[1] && !o[2] && o[4] >= 65536) return constant(o, true);
 return o[5] === 8 ? `(f64.load ${addr(o)})` : `(f64.promote_f32 (f32.load ${addr(o)}))`;
}
function writeI(o, value) {
 if (o[0] === 'r') return o[1] === 'al' ? set('eax', `(i32.or (i32.and ${g('eax')} ${ic(0xffffff00)}) (i32.and ${value} ${ic(255)}))`) : set(o[1], value);
 return `(i32.store${o[5] === 1 ? '8' : o[5] === 2 ? '16' : ''} ${addr(o)} ${value})`;
}
function writeF(o, value) {
 if (o[0] === 'r') {
  if (o[1] === 'xmm0') return set('xmm0', `(f32.demote_f64 ${value})`);
  if (o[1].startsWith('st(')) return `(call $fpset ${ic(Number(o[1].slice(3, -1)))} ${value})`;
  throw Error('Unsupported source floating register write');
 }
 return o[5] === 8 ? `(f64.store ${addr(o)} ${value})` : `(f32.store ${addr(o)} (f32.demote_f64 ${value}))`;
}
const fp = i => `(call $fpget ${ic(i)})`, fpset = (i, value) => `(call $fpset ${ic(i)} ${value})`;
const jump = at => `(return_call $b${at.toString(16)})`;
function emit(row) {
 const [ip, op, args, next] = row, [a, b] = args;
 let body;
 switch (op) {
  case 'mov': case 'movzx': body = writeI(a, readI(b)); break;
  case 'lea': body = writeI(a, addr(b)); break;
  case 'movss': body = writeF(a, readF(b)); break;
  case 'push': body = `(call $push ${readI(a)})`; break;
  case 'pop': body = writeI(a, '(call $pop)'); break;
  case 'add': case 'sub': case 'xor': body = writeI(a, `(i32.${op} ${readI(a)} ${readI(b)})`); break;
  case 'xorps': body = set('xmm0', `(f32.reinterpret_i32 (i32.xor (i32.reinterpret_f32 ${g('xmm0')}) ${readI(b)}))`); break;
  case 'test': body = `${set('zf', `(i32.eqz (i32.and ${readI(a)} ${readI(b)}))`)} ${set('cf', ic(0))}`; break;
  case 'fld': body = `(call $fpush ${readF(a)})`; break;
  case 'fldz': case 'fld1': body = `(call $fpush ${fc(op === 'fld1' ? 1 : 0)})`; break;
  case 'fstp': body = `${writeF(a, fp(0))} (call $fpop)`; break;
  case 'fchs': body = fpset(0, `(f64.neg ${fp(0)})`); break;
  case 'fxch': {const operand = b ?? a, i = Number(operand[1].slice(3, -1)); body = `(local.set $tmp ${fp(0)}) ${fpset(0, fp(i))} ${fpset(i, '(local.get $tmp)')}`; break;}
  case 'fmul': case 'fadd': case 'fdiv': body = fpset(0, `(f64.${op.slice(1)} ${fp(0)} ${readF(a)})`); break;
  case 'faddp': case 'fsubp': case 'fdivrp': {
   const kind = {faddp: 'add', fsubp: 'sub', fdivrp: 'div'}[op];
   body = `${fpset(1, `(f64.${kind} ${fp(op === 'fdivrp' ? 0 : 1)} ${fp(op === 'fdivrp' ? 1 : 0)})`)} (call $fpop)`; break;
  }
  case 'fcompi': body = `(local.set $x ${fp(0)}) (local.set $y ${readF(a)})
   ${set('cf', '(i32.or (i32.or (f64.ne (local.get $x) (local.get $x)) (f64.ne (local.get $y) (local.get $y))) (f64.lt (local.get $x) (local.get $y)))')}
   ${set('zf', '(i32.or (i32.or (f64.ne (local.get $x) (local.get $x)) (f64.ne (local.get $y) (local.get $y))) (f64.eq (local.get $x) (local.get $y)))')} (call $fpop)`; break;
  case 'jb': case 'jbe': case 'je': body = `(if ${op === 'jb' ? g('cf') : op === 'je' ? g('zf') : `(i32.or ${g('cf')} ${g('zf')})`} (then ${jump(a[1])}))`; break;
  case 'jmp': body = jump(a[1]); break;
  case 'call': {
   if (a[0] !== 'i' || !calls.has(a[1])) throw Error('Only exact immediate source callees admitted');
   body = `(call $push ${ic(next)}) ` + (entries.includes(a[1]) ? `(call $b${a[1].toString(16)})` : `(call $builtin${a[1].toString(16)})`); break;
  }
  case 'ret': body = '(drop (call $pop)) (return)'; break;
  default: throw Error('Unsupported opcode ' + op);
 }
 return `;; ${ip.toString(16)} ${op}\n(call $tick) ${body}\n`;
}
// Keep helpers separate, small and literal: source vector operations have f32
// stores after every multiply/add/subtract, with no fused multiply-add opcode.
const vload = (ptr, axis) => `(f32.load (i32.add ${ptr} ${ic(axis * 4)}))`;
const vstore = (ptr, axis, val) => `(f32.store (i32.add ${ptr} ${ic(axis * 4)}) ${val})`;
const vdot = (a, b) => `(f32.add (f32.add (f32.mul ${vload(a, 0)} ${vload(b, 0)}) (f32.mul ${vload(a, 1)} ${vload(b, 1)})) (f32.mul ${vload(a, 2)} ${vload(b, 2)}))`;
const self = g('ecx'), argA = '(local.get $a)', argB = '(local.get $b)';
const builtinDefs = [...calls].filter(t => !entries.includes(t)).map(target => {
 let body = '', cleanup = 0;
 if (target === 0x100ad10 || target === 0x119b970) {
  if (target === 0x119b970) body += `(i32.store ${self} ${ic(0x149e5a0)})\n`;
  for (let i = 0; i < (target === 0x119b970 ? 6 : 3); i++) body += vstore(target === 0x119b970 ? `(i32.add ${self} ${ic(4)})` : self, i, '(f32.const 0)') + '\n';
  body += set('eax', self);
 } else if (target === 0x119b9e0) {
  // Source destructor stub has no modeled writes, exactly as JS baseline.
 } else if (target === 0x5785c0 || target === 0x7aff90) {
  // Load all source components before any potentially aliased destination store.
  for (let i = 0; i < 3; i++) body += `(local.set $v${i} (f32.${target === 0x5785c0 ? 'sub' : 'add'} ${vload(self, i)} ${vload(argB, i)}))\n`;
  for (let i = 0; i < 3; i++) body += vstore(argA, i, `(local.get $v${i})`) + '\n';
  body += set('eax', argA); cleanup = 8;
 } else if (target === 0x100af90 || target === 0x100b5f0) {
  body += `(call $fpush (f64.promote_f32 ${vdot(self, target === 0x100af90 ? argA : self)}))`;
  cleanup = target === 0x100af90 ? 4 : 0;
 } else if (target === 0x100b040) {
  for (let i = 0; i < 3; i++) body += `(local.set $v${i} (f32.sub (f32.mul ${vload(argA, (i + 1) % 3)} ${vload(argB, (i + 2) % 3)}) (f32.mul ${vload(argA, (i + 2) % 3)} ${vload(argB, (i + 1) % 3)})))\n`;
  for (let i = 0; i < 3; i++) body += vstore(self, i, `(local.get $v${i})`) + '\n';
  body += set('eax', self); cleanup = 8;
 } else if (target === 0x119c440) body += `(call $fpush (call $point ${argA} ${argB}))`;
 else throw Error('Missing exact builtin');
 return `(func $builtin${target.toString(16)} (local $a i32) (local $b i32) (local $v0 f32) (local $v1 f32) (local $v2 f32)
  (local.set $a (i32.load (i32.add ${g('esp')} ${ic(4)}))) (local.set $b (i32.load (i32.add ${g('esp')} ${ic(8)})))
  ${body}\n(drop (call $pop)) ${set('esp', `(i32.add ${g('esp')} ${ic(cleanup)})`)}\n)`;
}).join('\n');
const blocks = [...leaders].filter(ip => table.has(ip)).map(start => {
 let body = '', ip = start;
 while (table.has(ip)) {
  const row = table.get(ip); body += emit(row);
  if (['ret', 'jmp'].includes(row[1])) break;
  ip = row[3];
  if (leaders.has(ip)) {body += jump(ip); break;}
 }
 return `(func $b${start.toString(16)} (local $tmp f64) (local $x f64) (local $y f64)\n${body}\n)`;
}).join('\n');
const registers = ['eax', 'ebx', 'ecx', 'edx', 'esi', 'edi', 'ebp', 'esp', 'cf', 'zf', 'steps', 'fpcount'];
const wat = `(module
 (import "host" "point" (func $point (param i32 i32) (result f64)))
 (memory (export "memory") 2 2)
 ${registers.map(r => `(global $${r} (mut i32) (i32.const 0))`).join('\n')}
 (global $xmm0 (mut f32) (f32.const 0))
 (func $tick ${set('steps', `(i32.add ${g('steps')} ${ic(1)})`)} (if (i32.gt_u ${g('steps')} ${ic(100000)}) (then unreachable)))
 (func $push (param $v i32) ${set('esp', `(i32.sub ${g('esp')} ${ic(4)})`)} (i32.store ${g('esp')} (local.get $v)))
 (func $pop (result i32) (local $v i32) (local.set $v (i32.load ${g('esp')})) ${set('esp', `(i32.add ${g('esp')} ${ic(4)})`)} (local.get $v))
 (func $fpaddr (param $i i32) (result i32) (i32.add ${ic(65536)} (i32.shl (i32.sub (i32.sub ${g('fpcount')} ${ic(1)}) (local.get $i)) ${ic(3)})))
 (func $fpget (param $i i32) (result f64) (f64.load (call $fpaddr (local.get $i))))
 (func $fpset (param $i i32) (param $v f64) (f64.store (call $fpaddr (local.get $i)) (local.get $v)))
 (func $fpush (param $v f64) (f64.store (i32.add ${ic(65536)} (i32.shl ${g('fpcount')} ${ic(3)})) (local.get $v)) ${set('fpcount', `(i32.add ${g('fpcount')} ${ic(1)})`)})
 (func $fpop ${set('fpcount', `(i32.sub ${g('fpcount')} ${ic(1)})`)})
 ${builtinDefs}\n${blocks}
 (func (export "reset") (memory.fill ${ic(0)} ${ic(0)} ${ic(131072)}) ${registers.map(r => set(r, ic(r === 'esp' ? 0x8000 : 0))).join('\n')} ${set('xmm0', '(f32.const 0)')})
 (func (export "run") (result f64) (call $push ${ic(0x200)}) (call $push ${ic(0x100)}) (call $push ${ic(0)}) (call $b128bf40)
  (if (i32.ne ${g('fpcount')} ${ic(1)}) (then unreachable)) ${fp(0)})
 (func (export "steps") (result i32) ${g('steps')})
)`;
const wabtModuleURL = wabtModule === 'wabt' ? 'wabt' : pathToFileURL(path.resolve(wabtModule)).href;
const {default: wabtFactory} = await import(wabtModuleURL);
const wabt = await wabtFactory(), parsed = wabt.parseWat('generated.wat', wat, {tail_call: true, bulk_memory: true});
parsed.resolveNames(); parsed.validate({tail_call: true, bulk_memory: true});
const binary = parsed.toBinary({write_debug_names: true}).buffer;
const output = new URL('../src/native-collision-bool.wasm', import.meta.url);
const manifest = {sourceProgramSha256: createHash('sha256').update(JSON.stringify(source)).digest('hex'), sourceInstructions: rows.length,
 blocks: leaders.size, reachableCheckedInstructions: checkedRows, maximumFP, backwardBranches: 0, wasmBytes: binary.length,
 externalPointTriangleCallee: 'original JS119C440/profile retained', wasmSha256: createHash('sha256').update(binary).digest('hex')};
const manifestSource = '// Generated by tools/build-native-bool-wasm.mjs; do not edit binary hashes by hand.\n' +
 'export const NATIVE_BOOL_WASM_SOURCE_SHA256 = ' + JSON.stringify(manifest.sourceProgramSha256) + ';\n' +
 'export const NATIVE_BOOL_WASM_BINARY_SHA256 = ' + JSON.stringify(manifest.wasmSha256) + ';\n' +
 'export const NATIVE_BOOL_WASM_COMPILATION = Object.freeze(' + JSON.stringify(manifest, null, 2) + ');\n';
const manifestOutput = new URL('../src/native-collision-bool-wasm-manifest.js', import.meta.url);
if (check) {
 const [existingBinary, existingManifest] = await Promise.all([fs.readFile(output), fs.readFile(manifestOutput, 'utf8')]);
 if (!existingBinary.equals(Buffer.from(binary))) throw Error('Generated WASM differs from src/native-collision-bool.wasm; run npm run wasm:build');
 if (existingManifest.replaceAll('\r\n', '\n') !== manifestSource) throw Error('Generated WASM manifest differs; run npm run wasm:build');
} else {
 await fs.writeFile(output, binary);
 await fs.writeFile(manifestOutput, manifestSource);
}
parsed.destroy();
return manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
 const at = process.argv.indexOf('--wabt');
 console.log(JSON.stringify(await buildNativeBooleanDistanceWasm({wabtModule: at < 0 ? 'wabt' : process.argv[at + 1], check: process.argv.includes('--check')})));
}
