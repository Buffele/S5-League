# S5 League — Station 2 · Brutalisme néon

## Lancer

- Jeu : `/?scene=station2-modular&visuals=brutal` (par défaut sur la carte modulaire).
- Visite avec trois caméras et compteurs : `/station2-brutal.html`.
- Comparaison : `&visuals=classic`, ou `&visuals=modern` pour l'ancienne passe d'éclairage.

## Réalisation

Les textures ont été remplacées, pas seulement éclairées différemment : béton, métal, deux atlas du train, structure et façades. Sept images locales dans `public/assets/station2-brutal`, ciel compris. Génération par l'outil imagegen intégré ; prompts conservés dans `public/assets/station2-brutal/generation-prompts.json`. Les atlas utilisent les UV existants ; leur résolution effective est celle des PNG livrés par l'outil, pas une résolution 4K revendiquée.

Les coques de la station conservent l'enveloppe géométrique des surfaces jouables. Les grandes faces reçoivent des dalles 3D biseautées, des capots, de nouvelles garnitures, des phares et des bandes lumineuses. Il s'agit d'un nouvel habillage modulaire sur les enveloppes de référence, pas d'une sculpture manuelle entièrement neuve de chaque objet. Les principaux détails ajoutés sont regroupés par matériau et module pour réduire les appels de rendu. Les panneaux sont testés contre leurs faces porteuses ; ils ne remplissent pas les portes et fenêtres. Leur relief ne dépasse que de quelques centimètres graphiques.

Un panorama remplace le ciel d'origine. Des tours et anneaux 3D occupent uniquement le lointain. Le personnage, les lasers animés, le Fumbi et les surfaces transparentes gardent leurs animations et ouvertures.

Le modèle de ventilation importé vient de [Poly Haven — Exterior Aircon Unit](https://polyhaven.com/a/exterior_aircon_unit), par Monsta3D, licence [CC0](https://polyhaven.com/license). Variante propre, textures 1K, environ 9 493 triangles par instance. Deux instances remplacent les coques de ventilation du toit du train, à l'intérieur des volumes d'équipement d'origine. Le fichier `aircon-clean.gltf` sélectionne uniquement le nœud propre du fichier téléchargé ; les données originales restent disponibles. Téléchargement ponctuel assisté par l'API Poly Haven (Powered by Poly Haven), aucune requête externe au lancement du jeu.

## Garanties et limites

Le traitement artistique ne modifie pas `world.triangles`, `world.meshes`, le spawn, la disposition, les modules ou leurs matrices. Les nouveaux objets graphiques ne rejoignent jamais le moteur de collision. Les tests comparent tous les triangles et les hauteurs de support avant/après, notamment aux anciens points problématiques.

Les concepts générés ne constituent pas des captures promises pixel pour pixel. Le rendu navigateur utilise du PBR, une réflexion d'environnement, une ombre directionnelle filtrée 2048 et un bloom modéré. Aucun ray tracing ni réflexion temps réel. Les textures PNG pèsent environ 17 Mo ; les fichiers glTF et leurs textures ajoutent environ 8 Mo sur disque. Les ressources inutilisées de la variante rouillée ne sont pas chargées par le glTF de jeu.

La visite compte environ 113 k triangles pour les coques et habillages, plus les détails importés et le décor. Le compteur GPU affiche également les passes d'ombre et de post-traitement : ne pas comparer directement ce nombre aux seuls triangles des modèles. Les FPS observés dans la visite sans personnage ne garantissent pas ceux du jeu sur d'autres machines.

## Modifier

`src/station2-brutal.js` : palette, nouvelles coques, détails, dalles, importer glTF et skyline.
`src/station2-visuals.js` : éclairage, environnement et post-traitement.
`src/station2-brutal-review.js` : angles et inspection.

Validation : suites `station2-brutal`, `station2-visuals`, `modular-map`, `imported-maps`, `map-animation`, build Vite et inspection des trois vues puis du jeu.
