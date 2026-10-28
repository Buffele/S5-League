# Plasma Sword — visuel Meshy expérimental, 17 octobre 2026

L’utilisateur a fourni, puis remplacé la première génération par
`Meshy_AI_plasma_sword_quad_100_1017073952_texture_fbx.zip`
et demandé un premier essai jouable sans attendre le polish. Le skin `meshy`
utilise le comportement de la Plasma existante. Les limites et gates natifs de
`plasma-sword.md` restent applicables ; ce passage ne certifie pas la fidélité
native du combat.

Le FBX actuel a 98 545 sommets et 197 096 triangles, sans squelette nécessaire
pour cette arme rigide. Le pack source et ses quatre cartes restent intacts
sous `art/weapons/meshy/plasma/source/`. Extraction avec contrôle CRC ZIP et SHA256
dans `art/weapons/meshy/plasma/import-report.json`. L’archive a le SHA256
`f18dd0354e9b8e18fa8fcac5e5865e623bde90ec024f5a86197cc264055f143a`.

Une copie est réduite à 9 999 triangles (8 055 sommets runtime), la couleur 4K à 2K. Une seule rotation,
une échelle uniforme et une translation alignent la poignée sur l’origine de
l’attache SWORD classique ; les volumes ne sont pas étirés par axe. Le modèle
fourni a sa poignée cylindrique encastrée entre les rails. Elle a été identifiée
visuellement, distinctement des deux ergots du talon, au point source
`[-0,0005 ; 0,0005 ; -0,4875]`. Le cylindre est identifié par sa section
constante et sa couleur grise entre environ Z source -0,65 et -0,325 ; mesures
dans `work/weapon-fitting/plasma-grip-samples.json`, vue source dans
`art/weapons/meshy/plasma/inspection-v2/source-front.png`. La pointe +Z source
est alignée au -Z du classique. L’échelle uniforme est 170,103621455.
La place du talon et les chevauchements éventuels sont des points à revoir
après le premier essai utilisateur.

Le runtime est `public/assets/s5runtime/weapon-plasma-meshy.json` et sa couleur est
`public/assets/weapons/meshy/plasma/base-color.png`. Le skin est proposé dans
`WEAPON_CHOICES.plasma.skins` sous **Meshy · prototype**. Les noms de scènes,
os, modèles, matrices, nodes, settings d’attache et pistes d’animation sont
strictement ceux du classique. Les shaders toon courants utilisent la couleur ;
les autres cartes originales restent disponibles pour un travail ultérieur.

## Animations et contrôles

Les déclarations NormalState et RunState ont été relues séparément dans
`tests/fixtures/native/plasma-source-contract.json` : repos `A0013`, haut de
déplacement `A0005–A0012` et bas `00008–00015`, mappings explicites conservés
dans `src/plasma-locomotion-data.js`, boucle et blend 1000/4800 s. Les actions
restent séparées et inchangées. Aucun réglage de déplacement, contact, dégâts,
effet, son ou horloge d’attaque n’a été modifié.

`tests/plasma-meshy.test.mjs` vérifie le contrat hors surface, le fichier classique
inchangé, la géométrie finie/indices/normales/UV, la texture 2K, les deux formes
d’URL et les matrices après mixer. Le nouveau mesh et le classique restent au
même emplacement pour les deux sexes, les huit directions, le repos, les clips
d’attaque et les resets de changement. Les IDs de locomotion restent contrôlés
indépendamment par `tests/plasma-locomotion-source.test.mjs`.

Les fichiers Blender/GLB éditables sont `art/weapons/meshy/plasma/plasma-game-10k.*`.
Reproduction : exécuter `tools/import-meshy-plasma.py` dans Blender background,
avec `--` puis le chemin de l’archive fournie, puis
`--grip-point '-0.0005,0.0005,-0.4875' --blade-z-positive`.
Ne pas utiliser le point de grip
spécifique à ce modèle pour une autre génération sans inspection.

Les preuves du passage commun sont conservées sous `work/meshy-plasma/`
(tests/build) et `work/meshy-weapons/qa/` (observations principales). Le statut
reste prototype visuel essayable, sans promesse de polish ni certification native.

Validation du 17 octobre : **65 tests ciblés réussis, 0 échec**, compilation
réussie. Le jeu principal a été observé sur les deux sexes au repos (`A0013`),
en marche avant (`A0005`) et pendant l’attaque (`A0002`), à t=0,3 s. Les six
captures sont dans `work/meshy-weapons/qa/plasma-*.png`. Le passage
Plasma Meshy → Counter Meshy → Plasma Meshy a aussi été effectué dans
l’inventaire principal ; les deux skins restent sélectionnés. Les autres
directions sont couvertes par les tests, pas par ces six captures.

Lien d’essai local :
`http://127.0.0.1:5173/?weapons=plasma%3Ameshy%2Ccounter%3Ameshy%2C-&weaponSlot=1&weapon=plasma&weaponSkin=meshy`.
Cliquer sur Enter room, puis utiliser les slots 1 et 2. Les empreintes des
runtimes validés et les preuves communes sont dans
`work/meshy-weapons/validation.json`.

Le premier runtime et ses Blender/GLB/rapport sont conservés sous
`art/weapons/meshy/plasma/versions/initial/` ; ses fichiers source restent
intacts sous `source/`. Les captures/65 tests ci-dessus concernent cette
première génération. Le contrôle du modèle de remplacement et de l’atelier
est consigné séparément dans `work/weapon-fitting/validation.json`.

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
