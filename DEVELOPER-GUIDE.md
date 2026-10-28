# S5 League

### A browser playground for third-person movement, combat, and editable game systems

[**Play the current web build**](https://s5-league.s5league.workers.dev) ·
[Get started](#getting-started) · [Explore the code](#explore-the-code) ·
[Weapon reference](ARMES.md) · [Agent guide](AGENTS.md)

S5 League is a Three.js + Vite project with readable gameplay sources and original
runtime resources. This developer packet exposes the systems behind the playable
build: movement physics, collision queries, weapon timings, animation playback,
character attachments, maps, and user interfaces.

The current build is a work in progress. Local sessions are available; some online
features shown in the interface are placeholders. Imported resources and source
evidence do not by themselves prove complete gameplay or visual parity.

## What you can work on

- **Movement and physics:** jumping, dashes, action state transitions, and tuning.
- **Combat:** melee and ranged weapon parameters, timings, impacts, and effects.
- **Collisions:** character movement, world queries, attack volumes, and map geometry.
- **Presentation:** animation, character equipment, map appearance, and interface layouts.

## Getting started

Install **Node.js 22.20.0**, the version recorded in `.nvmrc`. Open a terminal in
the directory containing `package.json`, then run:

```sh
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173/`. The browser loads
models, textures, animations, and sounds from `public/assets/`. The archive contains
the actual resources, not Git LFS pointers. The initial npm installation requires
Internet access. Existing dependency versions are pinned by `package-lock.json`.

## Build and preview

```sh
npm run build
npm run preview
```

The build generates `dist/`. Source modules and resources use portable
`s5runtime` paths. Keep these paths and their referenced identifiers consistent.
The build preserves those bytes; runtime integrity checks remain enabled.

When a resource changes, update its distributed-file digest without replacing
an authored provenance identity. Azit optical materials and Bio Lab map behavior
retain separate source and distribution identities. Archived naming adapters
have been retired; the current helper is `tools/distribution-cleanup.mjs`.

## Explore the code

| System | Start here |
|---|---|
| Application startup | `index.html` → `src/bootstrap.js` → `src/main.js` |
| Movement and physics | `src/controller.js`, `src/movement-profile.js`, `src/motion-graph.js` |
| Reference physics data | `src/s5runtime-physics-data.js`, `src/s5runtime-native-physics-data.js` |
| Collision queries | `src/collision.js`, `src/native-collision-*.js`, `src/native-melee.js` |
| Attack volume intersections | `tools/s5runtime-arsenal/attack-box-intersection.mjs` |
| Weapon timings and parameters | `src/spy-dagger-timing.js`, `src/*-combat-data.js`, `src/*-data.js` |
| Available weapons and loadouts | `src/loadout.js`, `src/weapon-inventory.js`, [weapon guide](ARMES.md) |
| Characters and equipment attachment | `src/avatar.js` and its pose playback imports |
| Maps | `src/*-world.js`, `src/imported-map.js`, `public/assets/maps/` |
| Technical notes and contracts | `docs/`, including `docs/CONTRAT-EFFETS-ARMES.md` |

Follow imports from these entry points. Data files can be generated and large.
An attack's visual duration, input window, damage timing, and recovery interval
can be owned by different modules; avoid treating them as interchangeable values.

## Packet scope

Included: `src/`, original `public/assets/`, technical `docs/`, the eight Vite HTML
entry points, npm/Vite configuration, project guides, and the two helpers required
by the runtime and build. [FILE-MANIFEST.json](FILE-MANIFEST.json) records file sizes
and SHA256 digests.

Excluded: `.git/`, installed `node_modules/`, generated `dist/`, `work/`, Blender
authoring sources under `art/`, captures, the native reference installation,
Android/APK outputs, and historical compiled comparison packages.

The complete test suite and advanced import pipelines are not included: many
depend on research corpora and tools outside this base packet. The exported npm
scripts therefore provide `dev`, `build`, and `preview`. The original package
configuration is retained in `docs/package-projet-original.json`.

## Documentation language and history

The public entry guides are in English. Existing code comments, resource names,
and historical technical notes retain their original language, with internal names normalized;
this packet does not claim to translate every source file or all historical notes.
Historical root guides are retained with normalized internal names under `docs/source-history/`.

[PROJECT.md](PROJECT.md) explains how to distinguish current entry points from
historical research material. Documents may refer to excluded research paths;
those references are context, not a promise that the files are in this packet.

## Validation and known limits

This portable edition normalizes internal file names, resource paths, metadata,
and the integrity references that depend on transformed bytes. It preserves
physics and weapon parameters and keeps authored provenance separate.

See `VALIDATION.json` for the fresh dependency installation, production build,
targeted resource checks, and browser scenarios run for this edition. Archived
validation records describe earlier snapshots and are not a replacement for it.

The existing non-blocking source warning remains:
`assertConquestMonsterStateNotificationReceipt` is referenced but not exported by
`src/conquest-player-monster-combat.js`. The complete research-dependent test suite
is excluded from this packet and is not claimed to pass.

## Git and release archives

Resources in this source packet use ordinary Git binary attributes, without LFS
filters. `public/assets/**` disables newline conversion to preserve authenticated
resource bytes. Keep large distribution ZIPs as release downloads rather than
committing those archives as Git blobs.
