# Station 2 modulaire

Jouer : `/?scene=station2-modular`. L’import de référence reste à `/?scene=station2`.
Atelier : `/station2-workshop.html` (aussi inclus dans la compilation de production).

## Modifier la carte par le code

Le fichier à modifier est **`src/station2-layout.js`**. Les 17 ensembles possèdent
leur propre repère, leurs matériaux et leurs collisions : train, deux ponts,
deux escaliers, deux bases, deux plateformes centrales, deux routes extérieures,
deux ensembles de lasers, deux buts, architecture extérieure et ciel.

`position` déplace le pivot en unités du jeu ; `rotation` contient les angles
X/Y/Z en degrés ; `scale` redimensionne dans le repère du module. Les changements
concernent simultanément le décor, les collisions et les objets attachés. Les
coordonnées correspondent au jeu, sans conversion .006 ou miroir à gérer.

Exemple : élargir l’escalier Alpha de 50 %, puis le décaler de deux unités :

```js
{
 id:'alpha-stairs', kind:'prefab', prefab:'alpha-stairs',
 position:[11.81,5.8,-7.86], rotation:[0,0,0], scale:[1.5,1,1]
}
```

Ajouter une nouvelle passerelle ou un escalier **généré par le code**, sans asset :

```js
{id:'passerelle-test',kind:'box',position:[0,12,28],size:[10,.4,4]},
{id:'escalier-test',kind:'stairs',position:[0,8,24],width:3,height:4,length:10,steps:16},
{id:'rampe-test',kind:'ramp',position:[8,8,24],width:3,height:4,length:10},
```

Une boîte est centrée sur son pivot. Un escalier/une rampe commence à Y=0, Z=0
dans son repère et monte vers Z=-length. Les escaliers générés ont une collision
continue en pente : aucun obstacle de marche à franchir avec le personnage.
Une valeur `color` peut modifier la couleur. Les tailles/échelles négatives ou
nulles sont refusées. Un `id` est unique ; le même prefab peut avoir plusieurs
instances indépendantes.

## Atelier et sauvegarde

Sélectionner un ensemble, régler ses coordonnées/dimensions, puis **Appliquer**.
**Dupliquer**, **Retirer**, **Annuler**, ajouter des primitives et afficher les
collisions sont disponibles. Le module contenant le spawn est protégé contre
la suppression ; le code peut déplacer ce spawn avant de retirer le module.

**Exporter JSON** produit une disposition réimportable. **Enregistrer et jouer**
enregistre un brouillon local au navigateur et ouvre
`/?scene=station2-modular&layout=workshop`. La carte initiale n’est pas écrasée.
Pour pérenniser un brouillon dans le projet, reporter son objet JSON dans
`STATION2_LAYOUT` ; aucun réexport des textures ou du kit n’est nécessaire.

## Organisation et fidélité

Le moteur modulaire (`src/modular-map.js`) est indépendant du chargeur de la
carte importée. Il compose la carte depuis des blocs locaux dans
`public/assets/station2-kit/`. Les géométries et textures de référence sont
conservées dans ces blocs pour ne pas remplacer les détails S5Runtime par des
approximations. Ce n’est donc pas un remodelage manuel de tous les sommets :
c’est une nouvelle composition éditable, assortie de constructeurs procéduraux.

Le découpage coupe les triangles traversant les frontières des ensembles,
avec interpolation des UV et des normales. Les collisions suivent le même
découpage. Le manifeste vérifie la conservation de la surface des collisions.
La disposition initiale conserve les hauteurs de support originales, le Fumbi,
le ciel, les lasers animés, les grillages et l’opacité des vitres.

Chaque ensemble est un bloc cohérent, pas encore un objet distinct pour chaque
petite vis ou chaque marche décorative. Déplacer un bloc peut naturellement
ouvrir un passage ou laisser un vide entre deux blocs : le moteur n’étire pas
automatiquement les ensembles voisins. Redimensionner une base étire aussi ses
détails et ses textures. Pour des modifications structurelles plus fines,
utiliser les primitives ou subdiviser le prefab concerné.

## API et maintenance

Le monde fournit `updateModule(id,patch)`, `addModule(definition)`,
`duplicateModule(id,newId,patch)`, `removeModule(id)`, `setSpawn(marker)` et
`exportLayout()`. Les mutations asynchrones doivent être attendues. La liste de
triangles est remplacée après chaque modification, ce qui actualise le moteur
de collision et les obstacles de caméra. Le Fumbi est attaché au module train.

`node tools/build-station2-kit.mjs` reconstruit les blocs depuis l’import de
référence. Les pivots source sont fixes dans `tools/station2-reference.js` :
modifier la disposition n’altère pas ces repères. Ne lancer cette commande que
si les assets source ou les règles de découpage changent.

Vérifications : `node --test tests/modular-map.test.mjs tests/imported-maps.test.mjs tests/map-animation.test.mjs` puis `npm run build`.
