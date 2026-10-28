# Arsenal integration checks

On the original PC, the active project root is `C:/Users/newpc/Desktop/S5 league`.
On another PC, use the root of the cloned repository (the directory containing
this file and package.json); never recreate or follow another user's absolute path.
See `docs/EMPLACEMENT-PROJET.md` for the migration and archived chat evidence.

Start with `docs/IMPORT-ARMES-GUIDE.md` and the weapon's sheet in
`docs/imports/`. Apply `docs/IMPORT-ARMES-CONTROLES.md` with evidence,
not unchecked assumptions. The guide's preparation-only notice must be updated
when the user explicitly launches the import series; it is not permanent.
During an authorized series, after three distinct failed attempts or 30 minutes
without verifiable progress on the same problem, record the exact blocker and
resume condition, then move to the next weapon. Keep native readiness gates.

Read `docs/IMPORT-ARMES-RETOUR-EXPERIENCE.md` before the next weapon import.
It records user-found regressions in handedness, charge attachment, missing
effects, physical knockback, mobile reload and main-game exposure.

For weapon effects, also read `docs/CONTRAT-EFFETS-ARMES.md`. Record each
component's anchor, orientation, source pivot, emitter/particle spaces and exit
policy. Measure against the evaluated weapon socket or actual contact after
the owning avatar's mixer. A finite matrix or a loaded effect is not proof of
correct placement; never silently fall back to the actor origin.

When importing or exposing a weapon, do not infer idle or ordinary locomotion
from its attack/charge script. Read its explicit NormalState and RunState,
including upper/lower channels, directional mapping, blend and loop settings.
Read the attack states separately. Record which source supports each mapping.
Unknown mappings must remain explicitly unverified, not silently substituted.

Before calling a weapon ready:

- User update, 26 October 2026: prioritize implementation time. Collect related
  corrections before validation; reuse one grouped regression run and build for
  the batch. Do not repeat passing checks without a new relevant change or
  unresolved failure. Keep required evidence and native readiness gates.
- User update, 25 October 2026: implement related corrections as batches.
  Prefer one relevant regression run and one build per completed batch over
  repeated per-weapon checks. Isolate a test only to diagnose a blocking bug.
- User update, 25 October 2026: use one selected character for this weapon
  polish series. Do not duplicate captures, native trials or manual checks by
  sex. Keep existing regression coverage; do not remove tests to shorten reports.
- Verify the required clips exist on the selected rig.
- Test neutral, all eight movement directions, return to neutral, attacks and
  switching weapons. Check the selected clip IDs, not just finite motion.
- Validate attachment after the animation mixer evaluates poses. A correct bind
  matrix alone is insufficient: BASE or explicit equipment tracks can restore
  the old transform. Check grip and orientation without editing source assets.
- Visually inspect neutral, walking and attacks on the selected character in the main game.
  Do not substitute attack screenshots or an isolated preview for these checks.
- Run relevant regression tests and the build. Keep approximations documented.

Breaker regressions are exemplified by tests/breaker-locomotion.test.mjs and
the animated attachment checks in tests/equipment-rig.test.mjs.
Keep general movement tuning and unrelated equipment unchanged.
