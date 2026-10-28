# Reprise du développement

Pour les captures et la calibration récentes, lire en priorité le
[bilan S5Runtime du 25 septembre 2026](BILAN-CAPTURES-S5RUNTIME.md) : résultats, limites,
correction walljump → dash à la dague, tests et données conservées localement.

## État au 24 septembre 2026

Le dossier de ce dépôt est la version de travail active, précédemment nommée
`air-dagger-next`. Ne pas repartir d'une ancienne copie `air-dagger-source-*`.
Lire le code actuel et les tests avant les anciennes notes de `PROJECT.md`.

Objectif principal : reproduire les règles de S5Runtime Melee, notamment les
déplacements, les transitions et les attaques. Distinguer ce qui est mesuré
dans le client original des choix visuels et des hypothèses restantes.
Les tests de régression ne prouvent pas à eux seuls la fidélité complète 1:1.

Le jeu propose Spy Dagger, Counter Sword et Plasma Sword, deux corps et plusieurs
équipements, une arène d'essai avec adversaire et plusieurs travaux sur Station 2.
Les cartes et les sources Blender en cours sont conservées dans le dépôt.

Dernier choix utilisateur : abandon de la course bestiale au profit du sprint
`Anime · élan`, avec option `S5Runtime classique`. La marche reste normale.
F3 alterne ces deux styles et mémorise le choix ; F4 active ou désactive
l'énergie infinie (auparavant sur F3).
Le compteur FPS apparaît en haut à droite et se met à jour toutes les 500 ms.
Les notifications d'action « WALL JUMP » et « CONTACT » ont été retirées.
Le sprint anime conserve les pistes d'échelle et les attaches natives ; modifier
la tête ou les accessoires sans les conserver peut faire réapparaître une
réduction de leurs dimensions. Les fichiers bestiaux dans `art/predator-run/`
restent une archive et un studio utilisé par le script de création anime ;
ils ne constituent pas une option de locomotion active.

## Points d'entrée

- Boucle de jeu, chargement, options : `src/main.js`.
- Entrées et simulation : `src/input.js`, `src/controller.js`,
  `src/simulation-clock.js`, `src/collision.js`.
- Dash et wall jump : `src/dash-motion.js`, `src/wall-jump.js`.
- Attaques et contact : `src/melee-weapons.js`, `src/melee-contact.js`,
  `src/training-combat.js`.
- Animation : `src/avatar.js`, `src/animation-player.js`,
  `src/motion-graph.js`, `src/weapon-pose-transition.js`.
- Sprint anime : `src/anime-sprint.js`, `art/anime-sprint/sprint-anime.blend`,
  `tools/anime-sprint-reference.mjs`, `tools/blender-anime-sprint.py`.
- Effets et sons : `src/combat-effects.js`, `src/imported-effects.js`,
  `src/sprint-effect.js`, `src/sprint-foot-flash.js`, `src/game-audio.js`.
- Cartes : modules `src/station2-*` et notes `docs/STATION2-*.md`.

## Vérifications

Installer les dépendances avec `npm ci`, puis lancer `npm test` et
`npm run build`. Pour un test visuel du sprint :
`http://127.0.0.1:5174/?qa=sprint&t=.35&front=1`.
Les paramètres QA sont des scénarios de contrôle, pas le mode de jeu normal.

Les références originales utilisées par les tests ont été copiées sans
modification dans `tests/fixtures/`, au lieu de dépendre de chemins extérieurs.
Le manifeste permet de vérifier leur provenance et leur contenu.

## Données extérieures et contexte

Les mentions de `outputs/analyse-s5runtime`, `outputs/extracteur-s5runtime` et de chemins
Windows dans les anciennes notes désignent l'ancien poste. Les extraits utiles
aux tests sont présents, mais pas l'intégralité de ces archives ni le captureur.
Un nouveau captureur générique en lecture seule est disponible dans
`tools/s5runtime-trace`. Des sondes ont été calibrées sur S5Runtime `0.8.32.92531`
(position, entrée native, HP/SP et états de mouvement). Le profil principal
reste expérimental : sélection de l'acteur à vérifier après changement de salle,
orientation non validée. Les autres versions doivent être recalibrées.
Les captures brutes sous `calibration/` ne sont pas transportées par Git.

Ce dépôt transporte le projet et ce guide, pas l'intégralité de la conversation
Codex précédente. Sur un autre PC, ouvrir ce dépôt et demander à Codex de lire
ce document en précisant le prochain changement voulu.
