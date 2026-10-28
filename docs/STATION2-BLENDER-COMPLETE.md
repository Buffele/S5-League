# Station 2 — Blender, carte complète V1

Historique de la première passe. La direction actuelle est décrite dans
[STATION2-ANIME.md](STATION2-ANIME.md).

Cette version étend la zone pilote à toute l’architecture de Station 2. Elle
reste une première passe artistique, avec des surfaces et détails à affiner.
Elle reprend la composition « Brutalisme néon » : béton, acier sombre, signes
citron, éclairage bleu, bannières bordeaux et cité verticale au-dessus des nuages.

## Accès

- Aperçu : `/station2-blender.html` ; vues Ensemble, Train, Intérieur, Escaliers,
  Pilier, Base, comparaison avec l’ancien habillage et gabarits physiques.
- Jeu : `/?scene=station2-modular&visuals=blender`.
- Menu : **Blender · carte complète V1**.
- Source éditable : `art/station2-blender/station2-brutalisme.blend`.

## Étendue

Les 17 modules gardent leurs pivots. Les surfaces opaques du train, des deux
bases, des deux escaliers, des deux consoles, des plateformes et des routes
extérieures sont retravaillées/exportées depuis Blender. Les composants des
émetteurs laser reçoivent de nouveaux matériaux et des optiques.

Les contours utiles au gameplay servent de gabarits. Il s’agit d’une
reconstruction et d’un habillage à partir de ces contours, avec redécoupe,
chanfreins, parements et nouvelles pièces, pas d’une topologie intégralement
dessinée à la main. Les grilles, vitrages et effets animés qui nécessitent leurs
transparences ou données natives sont conservés. Le Fumbi et les effets des
buts restent les objets fonctionnels du jeu.

Le plancher du train est recréé à partir des 82 triangles horizontaux du
support intérieur, avec un décalage visuel de 3 mm. Il possède une face
supérieure orientée vers le haut et une sous-face. Un test vérifie sa couverture
en quinze points intérieurs dans le GLB réellement exporté.

## Décor

- 31 reliefs rocheux en géométrie 3D.
- 8 tours avec contreforts, niveaux et baies sur leurs différentes façades.
- 2 anneaux monumentaux et des silhouettes de navettes lointaines.
- 6 bannières murales, avec petits éléments de végétation décorative.
- Un ciel panoramique nuageux et trois couches de brume animées sous la carte.

Les tours et rochers sont des modèles du module `backdrop`, et non des éléments
dessinés dans le ciel. La brume est un shader de bruit léger ; ce n’est pas un
calcul volumétrique physique. L’éclairage et les reflets restent ceux de Three.js,
sans ray tracing. La fidélité visuelle au concept est une direction artistique,
pas une reproduction pixel à pixel de l’image générée.

## Génération et export

Dans Blender interactif, avec le pont Blender Lab actif :

```powershell
python tools/blender-bridge.py tools/blender-station2-world.py
```

Le générateur de carte appelle la construction de la zone pilote, puis
`tools/blender-station2-world-additions.py`. Il ne remplace que les scènes qu’il
a lui-même créées. Le fichier GLB garde le nom `station2-slice.glb` pour conserver
la compatibilité des liens ; le manifest porte `scope: full-map-v1`.

Les objets restent séparés dans Blender. Au chargement Three.js, ils sont
regroupés par matériau et module afin de limiter les appels de rendu. Les petits
détails distants évitent les subdivisions inutiles.

## Physique et vérification

Les tableaux de triangles physiques, les pivots, le départ et le seuil de reset
restent inchangés. Les nouveaux objets ne deviennent jamais des colliders.
Les détails fins, joints, chanfreins et feuilles n’ajoutent pas d’obstacles.

Tests : `node --test tests/station2-blender.test.mjs tests/modular-map.test.mjs
tests/station2-brutal.test.mjs`, puis `npm run build`.

Le ciel est généré avec l’outil intégré de génération d’images. Le fichier retenu
est `public/assets/station2-blender/sky-clouds.png` et son prompt complet est
archivé dans `public/assets/station2-blender/sky-prompt.txt`. Les textures béton
et métal réutilisent celles de la première direction artistique.

L’éditeur de disposition recharge les préfabs d’origine lorsqu’un module est
reconstruit ; l’habillage Blender doit alors être réappliqué. Ce lot ne prétend
pas fournir un éditeur d’art synchronisé en direct entre Blender et le jeu.
