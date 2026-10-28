# Chaser — Precision Neon assets

Generated with the built-in ImageGen tool on 2026-10-04 from the selected Precision Neon concept. Original transparent PNGs are preserved without pixel edits. Full generation prompts: [prompts.json](prompts.json). Alpha measurements and CSS fitting: [manifest.json](manifest.json).

## Active textures (12)

- score-best.png / score-mine.png: leaderboard and personal score plates.
- timer.png: timer wings.
- hp.png / sp.png: player resource rails.
- weapon.png: current weapon plate, with the actual game weapon image.
- target.png: gold target nameplate projected above the marked character.
- ability.png: fireball plate.
- announcement.png / victory.png: round announcement skins.
- results.png: detailed match results board.
- light-sweep.png: animated edge glints.

The generated survivors.png backing plate is retained as an unused generation artifact. It is no longer referenced by the HUD. Survivor population is shown only through original S5Runtime hud-38.png silhouettes, white when alive and tinted green when eliminated. No visible ALIVE/DEAD totals and no Chaser health gauge. Icons persist across updates for the 700 ms death transition; reduced-motion preferences disable motion.

## Integration and verification

Live labels are English, with player names and scores. Animated highlights cover score gains, leader changes, target changes, deaths, resource fills, urgent timer and low HP. Winners can move and jump during Chaser intermission, both as Chaser and survivor; new-round preparation resets the actors. Round scoring remains closed after the outcome.

2026-10-04: 37 relevant automated tests passed; Vite production build passed. In-game QA fixtures verified both victorious roles changing horizontal position and jumping while intermission remains active and unlocked. Captures under audit/: chaser-imagegen-survivors.jpg and chaser-imagegen-hud.jpg. These are S5 checks, not comparative S5Runtime validation.
