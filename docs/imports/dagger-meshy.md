# Spy Dagger — visuel Meshy expérimental, 17 octobre 2026

L'utilisateur demande un prototype immédiatement essayable et fournit
`Meshy_AI_cyber_karambit_quad_1_1017071041_texture_fbx.zip`. Ce passage remplace
la surface de la Spy Dagger existante. Son combat, les contacts, les effets,
les sons, les rigs et les animations ne sont pas modifiés. Les limites de
`spy-dagger.md` et le gate natif non prêt restent applicables.

## Modèle et reproduction

Archive SHA256 : `90111e5f1f32ef18035f0696f919ba8587b7e0eb057e3a54bd768f1a46c00bf3`.
Le FBX a 98 879 sommets et 197 764 triangles, sans squelette nécessaire pour
cette arme rigide. Il contient une île principale de 98 876 sommets et une
minuscule île de trois sommets. Les fichiers source, leurs cartes 4K et les
octets de l'archive extraits restent intacts sous
`art/weapons/meshy/dagger/source/`. Extraction avec vérification CRC ZIP,
contrôle des chemins et empreintes dans `source-manifest.json`.

La copie runtime a **9 999 triangles**, 9 267 sommets après séparation des
normales/UV, et une couleur **2K**. Les volumes sont conservés par rotation,
échelle uniforme et translation ; aucun étirement par axe. Le grip est la
barre noire oblique enveloppée, identifiée sur `source-front.png`, et non le
grand anneau arrière. La version corrigée **V2** aligne le vecteur grip→pointe
sur celui du classique, avec le ventre de coupe du même côté (+X local).
Le centre du grip reste à l'origine de la main native évaluée en pose base.

- Runtime : `public/assets/s5runtime/weapon-dagger-meshy.json`.
- Couleur : `public/assets/weapons/meshy/dagger/base-color.png`.
- Copie éditable : `art/weapons/meshy/dagger/dagger-meshy-runtime.blend` / `.glb`.
- Source importée : `art/weapons/meshy/dagger/source-import.blend`.
- Rapport : `art/weapons/meshy/dagger/import-report.json`.

Exécuter `tools/inspect-dagger-meshy.py` dans Blender background avec `--`
puis le chemin du ZIP fourni ; ensuite `tools/import-dagger-meshy.py`.
Le premier outil préserve et inspecte, le second transforme une copie.
Les captures `source-front.png`, `source-top.png`, `source-side.png` montrent
le modèle fourni. `classic-local.png` aide à comparer le plan local classique.
`tools/render-dagger-meshy-alignment.py` produit
`orientation-v2-comparison.png`, face et profil côte à côte en repères locaux.
Ce rendu d'analyse ne remplace pas les observations dans le jeu principal.

## Correction d'orientation V2

Le premier fit alignait seulement l'axe de la poignée et l'envergure Y.
Il laissait la pointe vers X≈+79 et Y≈−121, alors que la pointe native est
`[-9.530236,-150.67503,0]`. Cette orientation n'était pas correcte malgré
la conservation des matrices d'attache. La version V2 remplace ce critère
par deux repères anatomiques de l'arme : direction grip→pointe et côté du
ventre de coupe. La face source −Y est tournée vers le côté +Z du plan local
natif avec une rotation propre (déterminant +1), sans miroir. L'échelle
uniforme positive vaut **116,139465**.

La pointe du mesh décimé est
`[-9.519497,-150.68988,-0.013078]`, à **moins de 0,023 unité locale** de la pointe
classique. Le ventre de lame repéré est à `[40.9753,-74.5241,1.9743]`, du même
côté +X que le ventre classique `[47.702263,-56.174034,0]`. Le rapport
consigne les points source, les bases orthogonales et la rotation complète.
La forme de la nouvelle poignée reste différente : son inclinaison et son
anneau ne peuvent se superposer exactement au classique par rotation seule.

## Composant et pivot pour l'éditeur

Un composant visible : **`spydagger`**, parent **`shortknife_Wea_Dummy`**,
attache **`R_Hand_Dummy`**. Le grip, dans les unités model-local du JSON,
est `[-6.205471515655518, -0.45422136783599854, 3.8423688411712646]`.
Le pivot géométrique du fichier est toujours celui du classique ; cette
coordonnée donne au futur éditeur un centre de rotation utile autour de
la prise. Les noms, parents, matrices, nodes Bone/ModelData/Shape,
`Line01`, clips et pistes d'animation sont strictement ceux du classique.
Le mixer peut donc continuer à animer la dague en cut et en récupération.

## Contrat de mouvement relu séparément des attaques

Source : les corps exacts dans
`work/melee-batch/dagger/source-contract.json`, authentifiés par
`tests/spy-dagger-source.test.mjs`, et le raccordement
`src/spy-dagger-data.js`. `NormalState_SpyDagger` choisit **SN002**, loop true,
speed 1, reset false, blend 1000/4800 seconde. `RunState_SpyDagger` déclare
séparément le haut et le bas avec les mêmes paramètres de boucle et blend.

| Direction S5 | Haut | Bas |
| --- | --- | --- |
| Avant | SN004 | E0019 |
| Droite avant | SN005 | E0020 |
| Droite | SN008 | E0023 |
| Droite arrière | SN010 | E0025 |
| Arrière | SN009 | E0024 |
| Gauche arrière | SN011 | E0026 |
| Gauche | SN006 | E0021 |
| Gauche avant | SN007 | E0022 |

Les labels diagonaux natifs passent par le mapping existant explicite.
Les attaques sont relues dans `UseWeapon1State_SpyDagger` (SN013/SN014,
blend haut 50 ticks, bas DD005–DD012/A0024) et
`UseWeapon2State_SpyDagger` (SN001, puis SN012). L'aérien SN003/SN000 déclaré
n'est pas un binding du classique et ne remplace pas le cut aérien conservé.
Aucune de ces règles n'est déduite du nouveau mesh ni modifiée pour le skin.

## Validation et limites du prototype

`tests/dagger-meshy.test.mjs` contrôle les sources préservées, le classique
inchangé, les données hors surface exactement conservées, les UV/normales,
les indices, la texture 2K et l'absence de miroir ou d'étirement. Pour chacun
des deux sexes, le vrai Controller/MotionGraph sélectionne les huit IDs haut
et bas, retourne au repos et change d'arme. Les matrices du classique et
du Meshy sont comparées **après mixer**, sur chaque os et sur le mesh, pendant
la marche, les retours au repos, les deux cuts, le rush et la récupération.
Les pistes directes de modèle et BASE restent actives et identiques.

Commande : `node --test tests/dagger-meshy.test.mjs tests/spy-dagger-source.test.mjs tests/spy-dagger-timing.test.mjs tests/dagger-switch-rush.test.mjs`.
Résultat du 17 octobre après correction V2 : **73 tests réussis, 0 échec**.
Le nouveau contrôle compare directement la pointe du mesh décimé au classique
et vérifie le côté du ventre de coupe, indépendamment des landmarks du rapport.
Journal : `work/meshy-dagger-tests-v2.log`. Runtime contrôlé SHA256 :
`4cd5e59d878803ce2462ef65adf708ddfe193a8fc1fc5e3bea2d810490e73400`.
Les fichiers publics et outils ne sont pas ignorés par Git.

Le catalogue, l'éditeur de placement, le build commun et les observations
repos/marche/attaque dans le jeu principal sont à réaliser par l'intégrateur.
Les tests numériques ne valident pas l'apparence. Le statut reste
**prototype de surface, intégration en cours** tant que ces vues ne sont pas
consignées. Aucune certification native n'est ajoutée par ce remplacement.

Limites visuelles connues : l'anneau arrière et l'angle de la barre de poignée
diffèrent de la boucle classique, donc dégagement des doigts/garde nécessitent l'essai
utilisateur demandé. Le trail `Line01` reste le profil natif, pas un nouveau
contour exact de cette lame. Le shader toon consomme la couleur uniquement ;
les cartes source normal/metallic/roughness restent préservées pour la suite.

## Bilan intégrateur du passage atelier / nouveaux modèles

Le catalogue et `/weapon-fitting.html` proposent les trois skins Meshy.
Les 98 tests ciblés et la compilation passent ; journaux dans
`work/weapon-fitting/tests-final.log` et `build-final.log`. Les empreintes
des runtimes testés et le périmètre des vues sont dans `validation.json`.
La Spy corrigée est observée sur les deux sexes au repos, en marche et en
coupe. Le nouveau modèle Plasma et la Counter articulée sont observés dans
ces trois états sur le corps masculin. Le contrôle féminin final de ces deux
runtimes reste explicitement non vérifié : plusieurs commandes du navigateur
de contrôle ont cessé de répondre, y compris après nouvelle session.
Reprise : navigateur réactif, puis QA idle/front/left-attack, sex=female,
weaponFit=default pour Plasma et Counter. Aucune certification native ajoutée.
