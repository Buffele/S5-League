# Station 2 — première zone Blender

Historique de la zone pilote. La version actuelle est décrite dans
[STATION2-BLENDER-COMPLETE.md](STATION2-BLENDER-COMPLETE.md).

Trois pièces : train, escalier alpha et pilier/console alpha. Les autres éléments
restent dans la version précédente. Ce lot est une première passe artistique,
pas une refonte terminée de toute la carte.

## Voir et jouer

- `/station2-blender.html` : aperçu Three.js, quatre caméras, comparaison avec
  la version précédente et affichage des gabarits physiques.
- `/?scene=station2-modular&visuals=blender` : version jouable optionnelle.
- Le menu de rendu propose « Blender · zone pilote ».

## Sources modifiables

- `art/station2-blender/station2-brutalisme.blend` : composants séparés,
  chanfreins non destructifs, matériaux, gabarits masqués et caméra.
- `tools/blender-station2-slice.py` : construction reproductible.
- `tools/blender-bridge.py` : exécute un script via le pont Blender Lab local
  déjà activé (localhost:9876). Ne modifie pas les préférences de Blender.
- `public/assets/station2-blender/station2-slice.glb` et `manifest.json` :
  export et correspondance exacte des morceaux remplacés.

Le générateur crée sa propre scène. Il remplace uniquement ses anciennes scènes
préfixées `S5 • Station 2 • Atelier Blender`, sans effacer la scène utilisateur.
Il faut le relancer dans une session Blender interactive, ou utiliser son code
dans une session où `bpy.context.window` existe.

## Travail de géométrie

Le contour du train, les ouvertures et le châssis de l’escalier sont recalés à
partir des surfaces existantes : ce lot ne prétend pas reconstruire arbitrairement
ces contours depuis zéro. Les surfaces sont réunies, redécoupées et chanfreinées,
avec nouvelles UV, cassettes de carrosserie, optiques et blocs de ventilation.
Les cadres des fenêtres conservent leurs ouvertures. Les bandes de peinture
sont délimitées par des coupes réelles plutôt que par les triangles historiques.

Les contremarches et les marches sont reconstruites d’après les niveaux du
gabarit. Le fût du pilier est reconstruit en sept voussoirs octogonaux à joints
creux, sous la console qui conserve sa surface praticable. Les inserts lumineux
et marques d’identification sont des objets séparés.

Les textures béton et métal réutilisent les textures générées lors du premier
habillage. Les autres matériaux sont des matériaux PBR simples. Il reste une
passe de détails et d’usure à réaliser pour atteindre une finition artistique
plus poussée ; ni ray tracing ni qualité « AAA » ne sont revendiqués.

## Contraintes et performances

Les sommets de collision, le point de départ et les transformations de modules
ne sont jamais remplacés. Les nouveaux objets vivent dans des groupes de
présentation exclus des listes de collision. Les cadres et surfaces praticables
du gabarit servent à l’alignement. Les détails sont purement visuels, avec de
petits chanfreins et joints ; ils ne définissent pas un nouveau relief physique.

La conversion Three.js `(x,y,z)` vers Blender `(x,-z,y)` est inversée par
l’exporteur glTF. Chaque module est exporté à l’origine puis rattaché au pivot
existant. Les pièces éditables sont regroupées par matériau au chargement pour
limiter les appels de rendu ; elles restent séparées dans le `.blend`.

Le remplacement des modules dans l’éditeur de disposition recharge leurs
préfabs d’origine. Cet habillage doit être réappliqué après une reconstruction
de module ; cette première version ne constitue pas un éditeur d’art en direct.

Vérification : `node --test tests/station2-blender.test.mjs
tests/station2-brutal.test.mjs tests/modular-map.test.mjs`, puis `npm run build`.
Les tests portent sur les collisions inchangées, l’atomicité en cas de module
absent, les matériaux lors du regroupement et la structure du GLB exporté.
