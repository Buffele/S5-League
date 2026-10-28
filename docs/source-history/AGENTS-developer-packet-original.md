# Guide des agents — S5

Ce dossier est la racine portable du projet : il contient `package.json` et
`vite.config.js`. Ne pas suivre les chemins absolus d’un ancien ordinateur cités
dans la documentation historique. Commencer par `README.md`.

## Repères

- `src/` : gameplay, physique, collisions, paramètres et timings d’armes, rendu,
  personnages, interfaces et cartes.
- `public/assets/` : ressources d’origine utilisées par ces sources. Préserver
  leurs noms et chemins, y compris les identifiants S5Runtime attendus par les chargeurs.
- `docs/` : explications, contrats et état des validations ; certains documents
  décrivent des essais historiques et référencent des archives non fournies.
- `ARMES.md` : état et particularités des familles d’armes.
- `PROJECT.md` : historique ; les sections anciennes ne sont pas toutes l’état actuel.
- `tools/distribution-cleanup.mjs` : helper de build importé par Vite.
- `tools/s5runtime-arsenal/attack-box-intersection.mjs` : helper d’intersection importé
  par le jeu ; le dossier `tools/` exporté n’est pas le pipeline d’import complet.

## Entrées et paramètres

Le jeu démarre par `index.html` → `src/bootstrap.js` → `src/main.js`.
Pour le mouvement, lire `controller.js` et `movement-profile.js`, puis leurs imports.
Pour les collisions, lire `collision.js` et les modules `native-collision-*`.
Les timings sont répartis entre les modules de données de chaque arme, sa machine
d’état et ses consommateurs d’effets ; ne pas confondre durée visuelle et impact.
Les JSON de cartes peuvent contenir géométrie, textures, données et contrats de collision.
Ne pas modifier aveuglément ces exports générés.

## Exécuter et vérifier

Utiliser la version Node de `.nvmrc` et les commandes de `README.md` : `npm ci`,
`npm run dev`, `npm run build`. Les tests du dépôt complet ne sont pas inclus ici.
Adapter la validation à la modification : reproduction du comportement, contrôle
visuel dans le jeu et une compilation par lot de corrections cohérent. Ne pas
répéter un contrôle déjà passé sans changement pertinent ou doute non résolu.
Ne pas modifier `dist/` pour corriger le jeu : modifier les sources puis recompiler.

## Préserver le travail et les contrats

Respecter les modifications en cours et limiter chaque intervention à son sujet.
Avant une correction d’arme, lire sa fiche `docs/imports/` et les guides
`docs/IMPORT-ARMES-GUIDE.md`, `docs/IMPORT-ARMES-CONTROLES.md` et
`docs/IMPORT-ARMES-RETOUR-EXPERIENCE.md`. Pour les effets, lire aussi
`docs/CONTRAT-EFFETS-ARMES.md`.

Préserver les règles détaillées de `docs/AGENTS-armes-original.md` : valider les
clips, la locomotion, les attaques, les attachements après évaluation de la pose
et les espaces des effets. Distinguer source retrouvée, raccordement réalisé,
vérification automatique, observation dans S5 et comparaison native. Une matrice
finie ou une ressource chargée ne prouve pas un placement ou une fidélité correcte.
Ne pas assouplir silencieusement une validation de provenance pour masquer un échec.

Si une référence de test ou de recherche manque parce qu’elle appartient à
`work/` ou au dépôt complet, noter précisément ce qui ne peut pas être vérifié ;
ne pas inventer une preuve ou annoncer la totalité des tests comme passée.
