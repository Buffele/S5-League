# S5leaguePV / Air Dagger

Jeu de développement Three.js + Vite, basé sur l'analyse de S5Runtime Melee.
Le dépôt contient le jeu, les ressources utilisées, les sources Blender et
les références nécessaires aux tests. La fidélité complète à S5Runtime reste à valider.

## Reprendre sur un nouveau PC

L'état du 1er octobre 2026 comprend le Katon, les travaux d'armes en cours,
les sources et les ressources du jeu. Voir [la passation actuelle](docs/REPRISE-2026-10-01.md).
Les anciennes sauvegardes de `work/reprise-local/` sont exclues : elles ne sont
pas nécessaires pour reprendre cet état. Ne pas recopier les chemins absolus
de l'ancien ordinateur ; travailler dans le dossier du nouveau clone.

Installer Git, Git LFS et Node.js 22.20.0 (ou une version compatible avec Vite 8,
au minimum Node 22.12 dans la branche 22). Blender n'est nécessaire que pour
modifier les sources 3D ; les exports du jeu sont déjà inclus.

```sh
git lfs install
git clone https://github.com/Alkatarak/S5leaguePV.git
cd S5leaguePV
git lfs pull
npm ci
npm run dev -- --port 5174
```

Ouvrir http://127.0.0.1:5174 et sélectionner ce dossier comme projet dans Codex.
GitHub peut demander une connexion au premier clonage du dépôt privé.
Les fichiers Blender et GLB passent par Git LFS : des petits fichiers texte
à leur place indiquent que leur téléchargement LFS n'a pas été effectué.

## Passer d'un PC à l'autre

Au début d'une session, depuis une copie sans modifications locales :

```sh
git pull --ff-only
git lfs pull
npm ci
```

Avant de quitter le PC, vérifier les fichiers puis enregistrer et envoyer :

```sh
git status
git add .
git commit -m "Décrire les changements de cette session"
git push
```

GitHub reçoit uniquement les modifications envoyées avec `git push`.
Si `git pull --ff-only` refuse, conserver les fichiers et demander à Codex
de résoudre la divergence ; ne pas utiliser de reset destructif.
Sur chaque PC, configurer son identité Git si Git la demande lors d'un commit.

## Vérifier et compiler

```sh
npm test
npm run build
```

`dist/` est généré par la compilation et n'est pas versionné.
Les références des tests sont dans `tests/fixtures/` ; leur provenance et leurs
empreintes SHA-256 sont enregistrées dans son manifeste.

## Se repérer

- [Circle 2 · Azure Atrium](docs/CIRCLE2-AZURE-ATRIUM.md) : reconstruction Blender,
  carte jouable `/?scene=circle2` et visite orbitale `/circle2-preview.html`.
- `docs/REPRISE.md` : état du projet et points d'entrée pour reprendre avec Codex.
- `src/` : gameplay, animations, rendu, interfaces et cartes.
- `public/assets/` : ressources chargées par le jeu.
- `art/` : sources Blender, références et ressources de création.
- `tools/` : scripts de génération et d'export, et le nouveau captureur Windows
  en lecture seule [`s5runtime-trace`](tools/s5runtime-trace/README.md).
- `tests/` : tests de régression.
- `PROJECT.md` : historique de développement ; plusieurs sections sont anciennes.

Le dépôt ne contient pas l'installation complète de S5Runtime, l'ancien programme de
capture, ni toutes les archives d'extraction et de recherche de l'ancien espace de
travail. Il contient désormais un remplaçant générique (`tools/s5runtime-trace`) et un
profil expérimental pour S5Runtime `0.8.32.92531`; l'identité de l'acteur doit être
vérifiée avant une prise et une autre version du client doit être recalibrée.
Le [bilan des captures et tests](docs/BILAN-CAPTURES-S5RUNTIME.md) précise les résultats
confirmés et les limites. Les captures brutes restent locales. S5Runtime et ces données
ne sont pas requis pour lancer le jeu et ses tests.
