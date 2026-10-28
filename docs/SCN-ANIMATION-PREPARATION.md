# Préparation des pistes d'animation S5

Les helpers partagés proposent une préparation explicite pour les ressources immuables déjà chargées : `compileTransformTrack({track,provenance:{source}})` et `compileScnMorphFrames(frames)`.

Préparer une fois par ressource et animation sélectionnée, puis partager les snapshots entre les clones. Les géométries, matériaux, horloges et callbacks restent propres à chaque instance. Le consommateur doit authentifier les octets source avant cette préparation ; la compilation vérifie le domaine des valeurs et leur ordre, pas leur origine.

Les snapshots possédés sont profondément gelés. Un registre privé reconnaît uniquement les snapshots créés par le helper ; un tableau brut ou simplement gelé reste validé à chaque appel. Toute modification ultérieure du tableau brut reste visible avec l'ancienne API et ne modifie pas un snapshot déjà compilé. Recompiler explicitement si les données doivent changer.

La compilation ne modifie pas la recherche de clé, les arrondis, les valeurs par défaut, les cas de clés dupliquées ou les écritures de sommets/UV. Elle ne prépare ni les floatKeys de visibilité, ni la durée, ni le temps de scène. Les branches du sampler, la fréquence d'évaluation et le passage morph de rendu restent identiques.

Les noms des modules partagés historiques sont conservés afin de préserver leurs consommateurs. Les nouveaux tests portent des noms descriptifs : `tests/scn-transform-compiled.test.mjs` et `tests/anchoring-scn-morph-compiled.test.mjs`.

Validation du lot : `work/parallel-gameplay-reference/finish-gameplay/performance-compilation/verification.json`. Elle couvre 48 tests ciblés, 5654 échantillons de transformation et3972 plans morph strictement identiques aux baselines épinglées. Le consumer proposé est comparé sur cinq modèles et deux instances, avec50 comparaisons de matrices, buffers, matériaux et horloges.

Ce résultat ne mesure pas la fluidité dans le navigateur. Le lot reste à raccorder au consommateur Practice, construire avec le jeu principal, puis observer à charge réelle avec relance et sortie.
