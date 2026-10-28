# Agent guide — S5 League

This is the portable project root: it contains `package.json` and `vite.config.js`.
Start with `README.md`. Do not recreate absolute paths from an earlier computer
that appear in historical documents.

## Project map

- `src/`: gameplay, physics, collisions, weapon parameters and timings, animation,
  characters, maps, rendering, and interfaces.
- `public/assets/`: original resources selected by these sources. Preserve names
  and paths, including the S5Runtime identifiers expected by loaders and validators.
- `docs/`: contracts, explanations, and validation history. Some notes describe
  experiments and reference research material not supplied in this packet.
- `ARMES.md`: English entry guide to the weapon implementation and original notes.
- `PROJECT.md`: English orientation and pointers to historical project records.
- `tools/distribution-cleanup.mjs`: the Vite build helper.
- `tools/s5runtime-arsenal/attack-box-intersection.mjs`: attack volume helper used by
  the game. The included `tools/` directory is not the complete import pipeline.

## Follow the implementation

Startup is `index.html` → `src/bootstrap.js` → `src/main.js`.
Read `controller.js` and `movement-profile.js` for movement, then their imports.
Read `collision.js` and `native-collision-*` for collision behavior.
Weapon timings span per-weapon data, state machines, and effect consumers: visual
duration is not necessarily the input, impact, or recovery window.
Map JSON files can contain geometry, texture references, and collision contracts.
Do not change generated exports blindly.

## Work and validation

Use the Node version in `.nvmrc`: `npm ci`, `npm run dev`, and `npm run build`.
The full repository tests and research corpora are not included here. Do not claim
that the complete test suite passed, and do not invent missing source evidence.
Choose validation that addresses the change, reproduce the relevant behavior in
the game, and run one appropriate build for a coherent batch of fixes.
Avoid repeating passing checks without a new relevant change or unresolved doubt.
Edit sources and rebuild rather than correcting generated output directly.

Respect work already in progress and keep each change within its scope.
Before a weapon change, read its sheet under `docs/imports/`, together with
`docs/IMPORT-ARMES-GUIDE.md`, `docs/IMPORT-ARMES-CONTROLES.md`, and
`docs/IMPORT-ARMES-RETOUR-EXPERIENCE.md`. For effects, also read
`docs/CONTRAT-EFFETS-ARMES.md`. These historical technical notes retain their
original language; the English guide does not replace their detailed contracts.

## Weapon and effect contracts

Keep explicit mappings for idle and ordinary locomotion separate from attack and
charge scripts. Check NormalState/RunState channels, direction mapping, blending,
and loop settings. Unknown mappings must remain marked unverified.
Check that required clips exist, then validate neutral, all movement directions,
return to neutral, attacks, and weapon switching for the selected character.
Evaluate equipment attachment after the owning animation mixer has applied poses.
A correct bind matrix alone does not prove a correct animated attachment.

For each effect component, preserve its anchor, orientation, source pivot,
emitter/particle spaces, and exit policy. Measure against the evaluated weapon
socket or real contact; never silently use the actor origin as a fallback.
A finite matrix or a loaded asset does not prove correct placement or fidelity.
Do not weaken provenance validation to mask an error.

Distinguish recovered source, completed integration, automatic checks, observation
inside S5, and native-reference comparison. The detailed original weapon rules
remain in `docs/AGENTS-armes-original.md` and the source-history archive.
If an excluded test or research reference is needed, state the missing evidence
and the exact limit of the verification performed.
