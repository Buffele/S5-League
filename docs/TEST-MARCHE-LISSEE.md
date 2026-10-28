# Essai de marche lissée — 20 octobre 2026

Essai demandé par l’utilisateur, puis rendu accessible immédiatement à sa
demande, avant la fin de la revue visuelle. Aucune validation native annoncée.

## Accès

Ouvrir le jeu avec `?character=s5runtime&weapon=dagger&runStyle=smooth`.
Settings → Character animations → Ground movement :
`Marche lissée · TEST Spy Dagger · 8 directions`. `Classic` rétablit les clips
habituels. Fonctionne pour les corps homme et femme, uniquement avec la Spy
Dagger au sol hors sprint et actions. Le choix est enregistré lorsqu’on le
change dans Settings. L’URL peut imposer temporairement le choix au chargement.

## Nature du test

Le moteur interpolait déjà les poses. Le test reconstruit des courbes Hermite
pour les positions et les quaternions du corps, puis les échantillonne à
120 Hz en conservant les instants des clés sources. Ce taux ne garantit pas
120 images affichées par seconde. Les rotations sont normalisées et leurs
signes alignés ; les positions utilisent des tangentes monotones. Les raccords
cycliques sont traités quand les extrémités sources concordent. Les changements
de direction conservent la phase du pas. Les poses et la cadence restent celles
de S5Runtime ; il s’agit d’un lissage expérimental, pas d’une nouvelle gestuelle.

Sources : `work/melee-batch/dagger/source-contract.json`, corps explicites
`NormalState_SpyDagger` et `RunState_SpyDagger`, puis mapping de présentation
`src/spy-dagger-data.js`. Repos SN002, huit hauts SN004–SN011, huit bas
E0019–E0026, boucles, vitesse 1, blend 1000/4800 s. Le test garde ces choix,
avec le préfixe runtime `SMOOTH_WALK_` pour les variantes de marche uniquement.
Les attaques sont lues séparément par les modules existants et ne sont pas
réécrites. Échelles et pistes des équipements/dummies restent celles d’origine.
Les assets sources et les réglages de déplacement n’ont pas été modifiés.

## Preuves disponibles à l’ouverture de l’essai

- `work/walk-smoothing/regressions.tap` : 52 tests passés, 0 échec, incluant
  les dix tests dédiés, continuité des animations, source/transitions Spy
  Dagger, équipements, Breaker, locomotion Mixamo et changements d’arme.
- Les tests dédiés vérifient les deux sexes, huit mappings haut/bas à plusieurs
  orientations, clés conservées, durées, quaternions unitaires, continuité de
  phase et sélection hors essai pour repos/sprint/aérien/attaque/autre arme.
- L’attache est comparée après mixer et fondus à son propre transform animé
  natif, et non à une matrice identité supposée.
- `work/walk-smoothing/build.log` : build réussi, avertissements de taille de
  bundles et imports dynamiques existants.
- Captures du jeu principal : `work/walk-smoothing/male-front.png` et
  `female-left-front.png` ; clips affichés SMOOTH_WALK_SN004 et SN007.
  Les fichiers `*-review.png` recadrent la zone rendue pour lecture.

À poursuivre après le retour utilisateur : comparaison animée A/B, revue
visuelle complète repos/marche/attaques sur les deux sexes, pieds/glissement et
transitions rapides. Les captures ponctuelles ne valident pas ces points.
L’appréciation « plus moderne » et la comparaison visuelle directe avec S5Runtime
restent ouvertes. L’essai n’est pas généralisé aux autres armes.
