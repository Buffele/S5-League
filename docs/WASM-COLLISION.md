# Collision WebAssembly: source and rebuild

The application is authored directly in JavaScript, using Three.js and Vite.
There is no TypeScript-to-JavaScript compilation stage in this repository.
Some JavaScript data modules are generated from extracted instruction data.

## Reproduce the included binary

Use Node.js 22.20.0 from `.nvmrc`, with development dependencies installed:

```sh
npm ci
npm run wasm:check
```

`wasm:check` compiles the source in memory and compares both the binary bytes
and generated manifest with the checked-in files. It exits unsuccessfully on a
mismatch and does not write either file. The build dependency is **wabt 1.0.39**,
pinned in `package.json` and `package-lock.json`.

To regenerate after an intentional source change:

```sh
npm run wasm:build
npm run test:wasm
npm run build
```

Review and commit both generated files together. Ordinary `npm run build` bundles
the included binary; it does not regenerate it. A native client, C/C++ compiler,
Emscripten installation, and private research directories are not required for
these commands.

## Files and compilation

| File | Role |
| --- | --- |
| `src/native-collision-bool-program.js` | Executable instruction rows and immutable constants used as the generator input |
| `tools/build-native-bool-wasm.mjs` | Validates admitted instructions and x87 stack flow, emits WebAssembly text, then uses WABT to assemble it |
| `src/native-collision-bool.wasm` | Generated binary loaded by the application |
| `src/native-collision-bool-wasm-manifest.js` | Generated source/binary SHA256 digests and compilation counts |
| `src/native-collision-bool-wasm.js` | Integrity checks, preparation, host import, and runtime selection |
| `src/native-collision-bool-distance.js` | JavaScript interpreter and public query wrapper |

The included program has 2,350 instructions and produces a 48,494-byte binary.
Its SHA256 is `635831bb273b88b1d08b0da66fb963ec32da6019f93c277c3c6ed6698bbb2b07`.
The generator enables WebAssembly tail calls and bulk memory. The point-triangle
callee remains a JavaScript host import with its retained arithmetic profile.
This is a focused compiler for the included instruction subset, not a general
x86 compiler or a recovered original C/C++ source tree.

## Portable regression coverage and limits

`npm run test:wasm` runs the included collision acceleration tests and 165-case
fixture. It checks parity with the existing JavaScript interpreter, signed zero,
NaN handling, unsupported-profile fallback, preparation/integrity failures,
reentrancy, source immutability, and instruction rejection. The fixture pins the
distributed map's byte digest separately from historical source references.
Research paths in fixture metadata document provenance; the test does not need
those private files. The full research-dependent project suite remains excluded.

Binary reproducibility and interpreter parity do not establish full native x87
bitwise parity or certify all gameplay collisions. Runtime diagnostics retain
those limitations. If preparation is unavailable, the existing interpreter is
used through the explicit fallback path.

## Published Git history

The initial public release was a portable source snapshot. Its visible history
was deliberately restarted during publication cleanup, which normalized internal
names and omitted local archives. It is not the full development history.
The WASM tooling correction is a new commit on that public history. It does not
restore or fabricate the original sequence of development commits. Historical
technical notes are available under `docs/source-history/`, with the scope and
missing evidence described in the developer guide.

The original `snapshot-2026-10-28` developer ZIP represents that initial snapshot.
For this tooling correction, clone the repository or download the source archive
of the correction commit. The playable browser build is unaffected.
