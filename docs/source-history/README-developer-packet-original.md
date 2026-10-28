# S5 — paquet développeur

Sources lisibles du jeu Three.js + Vite, avec les ressources d’origine nécessaires
au lancement et à la compilation. La physique, les collisions, les paramètres des
armes et leurs timings sont dans les fichiers JavaScript de `src/`.

## Installation et lancement

Installer Node.js 22.20.0 (version indiquée dans `.nvmrc`), puis ouvrir un terminal
dans ce dossier, celui qui contient `package.json`.

```sh
npm ci
npm run dev
```

Ouvrir l’adresse affichée par Vite, normalement `http://127.0.0.1:5173/`.
Le navigateur charge les modèles, textures, animations et sons depuis `public/assets/`.
Le ZIP contient les vrais fichiers de ressources ; Git et Git LFS ne sont pas
nécessaires pour utiliser cette archive. La première installation npm utilise Internet.

## Compiler

```sh
npm run build
npm run preview
```

`dist/` est généré par la compilation. Le développement conserve les chemins et
identifiants d’origine, dont les références à S5Runtime. Le plugin de distribution
existant réécrit certains noms dans le build ; ne pas faire ce renommage à la main
dans les sources ou dans les ressources.

Le helper de compilation fourni corrige également une confusion entre empreinte
de provenance et empreinte de distribution pour Azit : la provenance attendue
par les matériaux et le jeu est conservée, et l’empreinte du fichier transformé
est enregistrée séparément. Les validations du jeu restent actives. Le helper
original est conservé dans `docs/distribution-cleanup-projet-original.mjs`.

## Où chercher

| Sujet | Points de départ |
|---|---|
| Démarrage du jeu | `index.html`, `src/bootstrap.js`, `src/main.js` |
| Déplacement et physique | `src/controller.js`, `src/movement-profile.js`, `src/motion-graph.js` |
| Données physiques de référence | `src/s5runtime-physics-data.js`, `src/s5runtime-native-physics-data.js` |
| Collisions | `src/collision.js`, `src/native-collision-*.js`, `src/native-melee.js` |
| Intersections de volumes d’attaque | `tools/s5runtime-arsenal/attack-box-intersection.mjs` |
| Timings et paramètres d’armes | `src/spy-dagger-timing.js`, `src/*-combat-data.js`, `src/*-data.js` |
| Liste des armes et apparences | `src/loadout.js`, `src/weapon-inventory.js`, `ARMES.md` |
| Personnages et attachements | `src/avatar.js` et les modules de lecture de pose |
| Cartes | `src/*-world.js`, `src/imported-map.js`, `public/assets/maps/` |
| Explications et contrats techniques | `docs/`, notamment `docs/CONTRAT-EFFETS-ARMES.md` |
| Consignes pour les agents | `AGENTS.md` |

Les modules spécialisés réutilisent ces points d’entrée ; lire leurs imports pour
suivre un comportement. Les fichiers de données peuvent être volumineux et générés.
Des cartes et armes comportent encore des prototypes et des limites documentées :
ne pas considérer une ressource importée comme une validation complète du gameplay.

## Vérifications fournies

La compilation isolée a transformé 1 178 modules et généré 114 sorties en mémoire,
sans accéder au projet d’origine. Le lancement et l’entrée en arène, ainsi que le
chargement d’Azit, ont été contrôlés depuis cette copie. Le helper de provenance
a un contrôle ciblé. Voir `VALIDATION.json` pour le périmètre et les limites.

Un avertissement non bloquant des sources existantes est conservé :
`assertConquestMonsterStateNotificationReceipt` est référencé mais absent des
exports de `src/conquest-player-monster-combat.js`. Le gameplay n’a pas été modifié
pour masquer cet avertissement. La suite complète de tests n’est pas fournie.
Les dépendances installées ont servi à la validation, mais ne sont pas dans le ZIP ;
une installation npm neuve n’a pas été exécutée lors de ce contrôle.

## Périmètre de cette archive

Inclus : `src/`, `public/assets/`, `docs/`, les huit entrées HTML prévues dans Vite,
les configurations npm/Vite, les guides de projet et les deux helpers requis par
le jeu et le build. `MANIFESTE-FICHIERS.json` détaille les fichiers et leurs empreintes.

Les tests du dépôt, les imports avancés et leurs corpus de recherche ne sont pas
inclus dans ce paquet de base. Plusieurs tests dépendent de `work/` et d’outils
externes ; les annoncer comme autonomes aurait été trompeur. Les anciennes
commandes npm `test`, `catalog:build` et `arsenal:*` sont donc retirées du
`package.json` exporté. Sa version d’origine est conservée dans
`docs/package-projet-original.json`. Les dépendances et le verrou npm restent inchangés.

Exclus : installation de référence native, `work/`, sources Blender `art/`, captures,
archives historiques, `.git/`, `node_modules/`, `dist/`, Android et APK.
Les liens des documents historiques vers ces éléments restent des références de
recherche, pas des fichiers promis dans cette archive.

Le README historique est conservé dans `docs/README-projet-original.md`.
Les consignes d’armes originales sont dans `docs/AGENTS-armes-original.md`.
Cette archive développeur est indépendante du paquet jouable compilé.
