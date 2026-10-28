# Station 2 — Bleu, ivoire et corail

La référence retenue est l'image « Anime cel-shading » fournie par l'utilisateur.
Cette révision remplace les surfaces grises de la première carte Blender par
des panneaux peints bleu cobalt et ivoire, des bandes corail, un dallage clair
et une ville lumineuse. Le train validé conserve ses modèles et matériaux.

Le dallage, le pont et les parties claires des murs utilisent une teinte
crème/beige. Une patine spatiale irrégulière ajoute quelques variations de
teinte, de matité et des traces fines, sans relief ni modification des collisions.
Elle est implémentée dans `src/station2-surface-finish.js`.

Les paramètres visuels proposent des contours noirs désactivables : personnages
seuls, ou personnages et objets sélectionnés (train et ponts). L'épaisseur est
réglable et le choix est mémorisé localement. Le HUD affiche seulement les deux
barres HP/SP, sans valeurs chiffrées ni panneau permanent d'arme.

Les contours utilisent un identifiant par personnage/objet dans le masque :
ils restent séparés lorsque le personnage passe devant le train ou un pont.
Les effets transparents ne sont pas traités comme des murs opaques lors de
ce calcul. La page `/tests/fixtures/outline-regression.html` vérifie les
superpositions, la transparence et l'occlusion solide sur douze positions.

## Ouvrir

- Jeu : `/?scene=station2-modular&visuals=blender`.
- Atelier : `/station2-blender.html`, vues Alpha, Bêta, Pont et Ensemble.
- Source Blender : `art/station2-blender/station2-anime.blend`.

Les noms de fichiers historiques sont conservés pour les liens existants.
Le nom visible dans le jeu est **Anime · bleu / corail**.

## Modèles et matières

Les parois ont de grandes surfaces peintes, des doubles obliques corail et
des bordures continues. Le découpage en petites cassettes entourées de blanc
a été supprimé. Les piliers ont un noyau continu avec armure
ivoire, une bande d'équipe et une grille centrale, au lieu de blocs empilés.
Les bords de plateforme suivent les contours d'origine. Les parois des bases
portent ALPHA/BETA, S5 LEAGUE, STATION 02 et des chevrons géométriques. De grands
marquages et emblèmes sont aussi plaqués sur les murs des plateformes et routes.

Les nouvelles textures `paint-anime.png` et `floor-anime.png` remplacent le
béton granuleux sur l'architecture jouable. `sky-anime.png` remplace le ciel
orageux. Ces trois images ont été produites avec l'outil intégré de génération
d'images ; les prompts exacts sont dans
`public/assets/station2-blender/anime-prompts.json`. Les fichiers sont locaux
au projet. Le rendu est une direction artistique anime avec matériaux
Three.js physiques et ombres ; il ne prétend pas être un shader toon intégral.

Le paysage utilise désormais 42 bâtiments répartis en six quartiers, issus de
neuf modèles GLB du **City Kit Commercial 2.1 de Kenney**, licence CC0 :
https://kenney.nl/assets/city-kit-commercial. Façades ivoire, vitrages bleutés,
accents corail : le shader adapte la palette, les géométries et leurs proportions
restent celles des modèles importés. La mer de nuages demeure sous la carte.

Les vingt tours procédurales, anneaux, rochers et navettes de l'ancien décor
sont masqués ensemble. Ils restent dans le fichier Blender historique, mais
ne sont plus affichés dans la variante anime. Le décor importé est un module
Three.js séparé, éditable dans `public/assets/station2-city/layout.json` :
modèle, position, hauteur (échelle uniforme) et rotation en radians pour chaque
bâtiment. Le bouton **Cité** de l'atelier fournit un angle dédié.

Budget du décor importé : 1 728 504 octets de GLB, une palette PNG partagée,
96 392 triangles affichés, neuf appels de dessin hors post-traitement grâce
aux instances. Les bâtiments ne projettent pas d'ombres sur la zone jouable.
La licence et les empreintes des fichiers sont dans
`public/assets/station2-city/LICENSE-Kenney.txt` et `sources.json`.
Le script `node tools/import-station2-city.mjs` recopie la sélection depuis
`art/external/city-kit-commercial/source` sans écraser la disposition éditée.
L'option explicite `--reset-layout` régénère la disposition initiale.

L'ancien matériau de rocher conservé dans le GLB vient de **Rock Face**,
Poly Haven, CC0 : https://polyhaven.com/a/rock_face. Powered by Poly Haven.
Les crédits historiques restent dans `public/assets/station2-blender/pbr/sources.json`.

## Reproduire

### Finitions de la station

`src/station2-detail-kit.js` ajoute les détails de présentation aux modules :
17 panneaux et trappes de service, 9 plaques murales, joints du pont, guides
lumineux, bordures métalliques et marquage CENTRAL LINK. Les plaques sont
ajustées par raycasts contre les vraies surfaces et évitent les volumes de
signalétique Blender conservés dans `brandingBounds` lors du regroupement.
Le graphisme des plaques partage un atlas Canvas de 1024 × 1024 pixels.

Les 22 faisceaux sont reconstruits à partir des composantes connexes des
triangles natifs : les ouvertures, portées et hauteurs restent identiques.
Un cœur cylindrique lumineux, une gaine parcourue d'impulsions et deux
bagues d'optique complètent les filaments natifs dont l'animation est conservée.
Trois drones de maintenance et deux enseignes suspendues occupent les abords
hors parcours. Leurs matériaux reprennent l'ivoire, le bleu et le corail.

Cette passe ajoute 27 630 triangles et 67 groupes de dessin, sans nouveaux
colliders ni changements de niveau. Les pièces statiques sont regroupées par
matériau et module ; chaque drone conserve seulement son mouvement de flottement.
`tests/station2-details.test.mjs` vérifie les ouvertures des lasers, la symétrie,
les supports du pont, les données de collision inchangées et le budget.

### Source Blender

Blender Lab ouvert avec le pont local actif :

```powershell
python tools/blender-bridge.py tools/blender-station2-world.py
```

Le générateur appelle les scripts `blender-station2-materials.py`,
`blender-station2-world-additions.py`, `blender-station2-design.py` et
`blender-station2-branding.py`.
Les surfaces décoratives plaquées sont de simples faces ; leurs dos invisibles
ne sont pas subdivisés. Three.js regroupe les objets par matériau et module.

Blender ne transmet pas la constante du nœud de multiplication de couleur
dans ce graphe de matériaux. Le générateur reporte donc `s5Tint` dans le
`baseColorFactor` standard du GLB après export, sans toucher aux images.
Le test lit le GLB réel pour éviter une nouvelle perte silencieuse des couleurs.

Le nettoyage d'export supprime les anciens cadres décoratifs, sépare les
parois verticales du dallage et compacte les données inutilisées. Budget
du GLB complet : 32 Mo, textures embarquées, moins de 450 000 triangles.

Les collisions, les pivots, les départs et la hauteur de reset sont conservés.
Les nouveaux détails ne sont pas des colliders. Les effets natifs, les grilles
et les surfaces transparentes restent gérés par leurs composants existants.

Les quatre écrans des bases (deux par camp) utilisent maintenant des reflets
planaires dynamiques via `src/station2-screens.js`. Leurs dimensions, positions
et orientations viennent des surfaces natives `screenlight`, avec dédoublonnage
des deux couches superposées du préfab Bêta. L'ancien import ne conservait
qu'une texture bleue additive, sans passe de réflexion ; il ne fournissait pas
le shader miroir d'origine. La nouvelle réflexion est calculée dans Three.js,
à 768 × 384 avec anticrénelage, sans modifier les colliders. Les captures ne
sont pas récursives et sont désactivées pendant les passes de contours.
Les vues « Écrans » et « Écrans Bêta » de l'atelier permettent de les vérifier.

Vérification :

```powershell
node --test tests/station2-city.test.mjs tests/ink-outline.test.mjs tests/station2-blender.test.mjs tests/modular-map.test.mjs tests/station2-brutal.test.mjs
node --test tests/station2-screens.test.mjs tests/station2-details.test.mjs
npm run build
```
