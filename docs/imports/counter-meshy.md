# Counter Sword — visuel Meshy expérimental, 17 octobre 2026

L’utilisateur a fourni `Meshy_AI_dagger_gauntlet_quad__1017064819_texture_fbx.zip` et demandé une première version immédiatement essayable, sans attendre le polish. Il s’agit d’un skin de la Counter existante ; aucun comportement de combat ni animation source n’a été changé. Statut de ce passage : **prototype jouable exposé dans le catalogue et observé dans le jeu principal sur les deux sexes**. Aucune certification native ni apparence finalisée n’est revendiquée.

Le FBX fourni contient 99 150 sommets, 198 236 triangles et aucun squelette. Ses trois îlots sont la lame (26 492 sommets), le gantelet (72 647) et un détail du gantelet (11). Les deux composants sont extraits sans couper leurs surfaces. Copie source, FBX et textures intacts : `art/weapons/meshy/counter/source/`, avec SHA256 dans `source-manifest.json`. Le fichier `source-import.blend` est une importation de travail, pas une modification du FBX.

La copie jeu est `public/assets/s5runtime/weapon-counter-meshy.json` : 4 999 triangles pour la lame, 9 499 pour le gantelet, soit **14 498 triangles**. Une rotation rigide, une échelle uniforme et une translation par composant raccordent les volumes à l’encombrement classique. Le gantelet reçoit ensuite une conversion anatomique droite→gauche par miroir Z, décrite ci-dessous. Le détail et les proportions du fichier fourni ne sont pas étirés indépendamment par axe. Le decimate ne remplace pas la source ; la copie Blender éditable est `art/weapons/meshy/counter/counter-meshy-runtime.blend`.

La couleur 4K d’origine est convertie en PNG 2K dans `public/assets/weapons/meshy/counter/base-color.png`. Les cartes metallic, roughness et metallic_roughness 2K sont aussi conservées. Le moteur courant emploie la couleur avec son shader toon ; aucune prétention de rendu PBR identique à Meshy. Les UV sont conservés et convertis une seule fois pour `TextureLoader.flipY=false`.

## Contrat natif conservé

La fiche `counter-sword.md` et le contrat authentifié `tests/fixtures/native/counter-source-contract.json` restent la référence. NormalState lit `R0004` ; RunState lit séparément le haut `R0016–R0023` et le bas `00008–00015`, avec le mapping courant de `src/counter-sword-locomotion-data.js`. Les clips de garde `R0008–R0015` restent propres à la garde. Les actions et récupérations sont conservées séparément (quatre légers, heavy/contre, aérien, garde).

Tous les noms de scènes, os, modèles, matrices, nodes, attachments et pistes du JSON classique sont conservés strictement. La lame remplace `Counter_Sword_SwordParts` sous `R_Hand_Dummy`. Le gantelet remplace la surface `Counter_Sword` sous la hiérarchie native attachée à `Bip01 L Forearm`, et sa main est désormais une surface skinnée distincte `Counter_Sword_Hand`. Les anciens panneaux deviennent vides pour éviter de superposer deux armes ; leurs carriers et pistes restent présents.

Limites du prototype actuel : les doigts suivent les os et animations de la main classique, mais seulement trois chaînes natives sont disponibles (pouce, index, groupe des autres doigts). Plusieurs doigts Meshy partagent donc la même chaîne ; le pouce replié et les proportions des jointures diffèrent de la source classique. Les nouveaux panneaux de l’avant-bras restent rigides. La position du grip et les éventuels chevauchements avec le personnage doivent être observés dans le jeu ; une égalité des matrices ne prouve pas leur qualité visuelle. Les effets, contacts, dégâts, son et horloges restent ceux de la Counter existante, avec leurs limites natives déjà documentées.

## Preuves techniques de ce passage

Commande actuelle : `node --test tests/counter-meshy.test.mjs tests/counter-meshy-fingers.test.mjs tests/counter-sword-data.test.mjs tests/weapon-fitting.test.mjs` — **20 tests réussis, 0 échec**, 17 octobre 2026, après correction anatomique et articulation.

- Le test du skin vérifie les fichiers publics, la couleur 2K, les indices/normales/UV, le budget, les deux surfaces et l’absence de modification du contrat classique.
- Le test post-mixer charge réellement les deux rigs, le classique et le nouveau skin. Les matrices monde des deux modèles visibles restent égales à celles du classique à plusieurs instants pour BASE, repos, les huit directions haut/bas, chaque action, chaque récupération et le retour au repos.
- Les tests Counter existants vérifient les IDs de clips haut/bas, les deux sexes, huit directions, quatre orientations, les actions et les changements Counter→Plasma→Counter.

Le rapport de géométrie, les matrices de conversion et les limites sont dans `art/weapons/meshy/counter/import-report.json`. Outils reproductibles : `tools/inspect-counter-meshy.py`, `tools/export-counter-meshy-reference.mjs`, `tools/import-counter-meshy.py`.

| Contrôle | Résultat de cet agent |
| --- | --- |
| C01 sélection/changement | Runtime créé et chargeable ; catalogue/UI et essai principal confiés à l’intégrateur |
| C02 directions | Mapping et IDs conservés, tests Counter deux sexes/huit directions réussis ; revue visuelle à joindre |
| C03 attache | Matrices après mixer égales au classique pour les deux pièces ; grip et orientation visuels à joindre |
| C04 visée verticale | Sans objet : ce skin n’ajoute aucun état ni triplet de visée |
| C05 action mobile | Contrat Counter inchangé ; tests existants haut/bas et actions réussis |
| C06 effets | Aucun effet modifié ; apparence/traînée du nouveau volume à observer |
| C07/C08 | Sans objet pour cette modification de surfaces : aucune balle ni fumée ajoutée |
| C09/C10/C11/C12/C13 | Combat, poussée, garde, sons et contacts Counter inchangés ; aucune nouvelle certification native |
| C14 régressions/build | 20 tests ciblés Counter/atelier réussis ; build et observations principaux par l’intégrateur |

Cette fiche ne remplace pas les gates natifs existants et ne les assouplit pas. Le polish des doigts, panneaux, matériaux et du grip peut être poursuivi après les retours du premier essai.

## Première exposition et observation par l’intégrateur, avant correction anatomique

Le 17 octobre, le skin **Meshy · prototype** a été ajouté au catalogue principal.
La sélection Counter Meshy et le retour Plasma Meshy ont été effectués dans
l’inventaire, avec conservation du skin de chaque slot. La Counter a été
observée dans le jeu principal sur les deux sexes au repos (`R0004`), en marche
avant (`R0016`) et en attaque (`R0000`), à t=0,3 s. Les six captures sont dans
`work/meshy-weapons/qa/counter-*.png`, et l’inventaire dans `loadout-meshy.png`.
Les deux composants suivent leur attache ; les doigts rigides et le volume
important du gantelet restent des limites visibles de cette première version.
Les autres directions restent vérifiées par les tests, sans revue visuelle
exhaustive dans ce passage.

Passage commun : **65 tests ciblés réussis, 0 échec**, compilation réussie.
Logs `work/meshy-plasma/weapons-tests.log` et `build.log`. Empreintes des
runtimes et liste des preuves : `work/meshy-weapons/validation.json`.
Cette observation complète les lignes C01/C02/C03/C06/C14 ci-dessus pour le
prototype ; elle ne modifie aucun gate natif.

## Correction du sens anatomique du gantelet

Le retour utilisateur signale une mauvaise orientation que les comparaisons de carriers n’avaient pas détectée. Les rendus locaux comparatifs de la géométrie évaluée classique et du nouveau volume établissent la différence : doigts vers +Y et racine du pouce côté +X dans les deux cas, mais paume/dos inversés. Le classique a ses plaques dorsales de doigts côté −Z et ses coussinets palmaires côté +Z ; le Meshy initial présente l’inverse. Une rotation de 180° autour de Y corrigerait paume/dos tout en déplaçant la racine du pouce du mauvais côté. La source représente donc la main opposée pour ce raccord.

Après autorisation de cette conversion ciblée, seule la **copie géométrique du gantelet** est réfléchie en Z dans le repère local du modèle, autour du plan de la racine palmaire native `Counter_Sword_Skin_Dummy`, Z=−5,407494545. Le winding est inversé et les normales sont recalculées. Aucun objet runtime ne reçoit d’échelle négative. La lame, les rigs, les scènes et les pistes restent inchangés.

Preuves conservées sous `art/weapons/meshy/counter/orientation/` : comparaison initiale dans `front-z-positive.png` / `back-z-negative.png`, puis versions corrigées dans `corrected/`. En vue +Z, les deux mains présentent désormais leur face palmaire ; en vue −Z, les deux présentent leurs plaques dorsales. Le cadrage de la vue arrière inverse les positions écran gauche/droite ; il s’agit du même repère local. Les doigts restent dans le sens distal +Y.

Les marqueurs `source-anatomy-landmarks.json` sont des sommets de la source intacte repérés depuis les deux faces, indépendamment du recalcul du fit. Le test supplémentaire contrôle leur côté dorsal/palmaire, leur sens distal, le côté radial du pouce, leur proximité à la surface réellement réduite et le volume signé positif du shell (winding extérieur). Il distingue explicitement rotation propre pour la lame et conversion de chiralité pour le gantelet. Les vérifications post-mixer des deux sexes et des huit directions restent réussies.

Le nouveau gantelet garde une pose initiale de doigts différente du classique, dont un pouce replié. Ce passage corrige le sens anatomique ; l’articulation suivante est décrite ci-dessous. Les premières captures du jeu principal citées plus haut précèdent ces corrections : le comparateur et le jeu doivent être rafraîchis pour la nouvelle revue visuelle. Aucun nouveau statut natif prêt n’est déclaré.

## Prototype de doigts articulés

À la demande utilisateur du 17 octobre, la surface du gantelet corrigé est partitionnée en **avant-bras rigide `Counter_Sword` (5 777 triangles)** et **paume/doigts `Counter_Sword_Hand` skinnés (3 722 triangles)**. Le total demeure 9 499 pour le gantelet, 14 498 avec la lame. Aucune position, UV ni triangle n’est inventé ou supprimé par cette partition ; la lame est strictement identique à la version précédente. La copie pré-articulation est conservée sous `articulation/rigid-input.json`.

Les poids sont transférés depuis les triangles évalués du gant classique en BASE, avec interpolation barycentrique au point le plus proche, puis normalisation des quatre plus fortes influences. Les **96 sommets de couture, doublons UV compris**, sont ancrés à 100% à `Counter_Sword`, avec une transition douce vers la paume entre Y64 et Y77. Ce garde-fou a été ajouté après qu’un test a détecté les doublons UV non couverts par une vérification sur seuls indices partagés.

La main conserve ses sommets dans le même **repère local du mesh `Counter_Sword`** que la coque rigide. Pour chaque os natif référencé, l’inverse de bind exportée est `inverse(BoneWorld_BASE) × Counter_SwordWorld_BASE`, sérialisée column-major. Au chargement, le `SkinnedMesh` est ajouté à `avatar.rig`, transform local identité, `bindMatrix` identité et mode attaché du loader courant. Ce bind est vérifié sur les deux sexes : l’acteur et son avant-bras s’annulent dans la conversion relative. Les bones, pistes et matrices sources ne sont pas modifiés.

L’atelier doit régler la coque et la main comme un seul composant Gantelet. L’intégrateur utilise des bones suiveurs privés pour la main, mises à jour après mixer : pour un réglage local D et le repère monde courant C=`Counter_Sword`, `BoneWorld_suiveur = (C × D × inverse(C)) × BoneWorld_natif`. Cela laisse les bones natives et les inverse binds intactes, tout en déplaçant le résultat après skinning avec la coque. Les tests `weapon-fitting.test.mjs` contrôlent ce raccord sur les deux sexes.

Preuves locales : `articulation/poses/` contient les surfaces réellement évaluées par le mixer pour BASE, repos, début/maintien de garde, marche, léger, heavy et récupération, sur les deux sexes. `comparison-palmar.png` montre le classique en haut et Meshy en bas, BASE/repos/garde/attaque de gauche à droite ; la vue dorsale inverse l’ordre écran des colonnes parce qu’elle regarde l’autre côté. Ce sont des rendus diagnostiques de la vraie géométrie évaluée, pas des captures du jeu principal.

La portée du centre pondéré du bout de l’index vers la racine palmaire passe d’environ **45,88 à 14,94 unités** entre BASE et attaque pour Meshy, contre **49,43 à 8,69** pour le classique. Le groupe des autres doigts passe de **43,29 à 11,35**, contre **49,48 à 9,29**. Le repos et la garde donnent des valeurs intermédiaires ; le retour BASE retrouve la pose ouverte. Les rendus locaux montrent le poing fermé et une couture stable. Le transfert reste approximatif, surtout pour le pouce préplié et les jointures ; il ne prétend pas reproduire chaque détail d’une main classique de géométrie différente.

Outils : `node tools/rig-counter-meshy-fingers.mjs` écrit un candidat sous `articulation/` sans recharger les pages QA ; `--publish` copie le résultat dans le JSON public et actualise le rapport. `tools/export-counter-meshy-finger-poses.mjs` puis `tools/render-counter-meshy-finger-poses.py` régénèrent mesures et comparaisons. Après une régénération du fit rigide par `import-counter-meshy.py`, rejouer la passe d’articulation avec `--refresh-input --publish` ; ce mode exige une surface rigide et refuse de remplacer l’entrée par une surface déjà articulée. La copie d’entrée rigide est authentifiée dans le rapport.

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
