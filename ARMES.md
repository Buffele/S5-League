# Weapons — developer entry guide

This English index points to the current implementation and the original weapon
history. The original detailed document is preserved, without translation, in
[docs/source-history/ARMES-project-original.md](docs/source-history/ARMES-project-original.md).

## Find the relevant implementation

| Topic | Files |
|---|---|
| Available loadout choices | `src/loadout.js` |
| Imported weapon identities and inventory | `src/weapon-inventory.js` |
| Attack state and movement integration | `src/controller.js`, `src/combat-state.js`, `src/motion-graph.js` |
| Spy Dagger timing | `src/spy-dagger-timing.js` |
| Family parameters and timing data | `src/*-data.js`, `src/*-combat-data.js` |
| Character equipment and attachment | `src/avatar.js` and pose playback modules |
| Attack volume intersections | `tools/s5runtime-arsenal/attack-box-intersection.mjs` |
| Weapon resources | `public/assets/s5runtime/`, `public/assets/weapons/` |

The naming used by the code is intentionally retained. Follow imports and the
specific family's state machine; a value in an effect definition is not proof
of the timing of damage, input, or recovery.

## Read the contracts

- `docs/imports/`: per-weapon notes and integration evidence.
- `docs/IMPORT-ARMES-GUIDE.md`: integration workflow and evidence categories.
- `docs/IMPORT-ARMES-CONTROLES.md`: checks used by the full project.
- `docs/IMPORT-ARMES-RETOUR-EXPERIENCE.md`: previously found regressions.
- `docs/CONTRAT-EFFETS-ARMES.md`: attachment and effect-space contracts.

Historical documents retain their original language. Some refer to research
corpora, native tools, or tests not included in this base packet. Preserve the
distinction between available resources, integrated behavior, and verified parity.
