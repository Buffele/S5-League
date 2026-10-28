# Passation S5 / S5Runtime — 27 septembre 2026

## 1. Objectif et priorité utilisateur

Étendre l'arsenal jouable de S5 en réutilisant les ressources S5Runtime authentiques,
comprendre les déplacements/timings/collisions pour améliorer la fidélité, et
conserver des preuves reproductibles. Le but n'est pas de récupérer le source
C++ original : ressources et scripts Lua ne restituent pas le moteur.

Priorité récente : intégrer concrètement le Breaker, puis éviter que les prochaines
armes soient livrées avec une mauvaise animation de repos/marche ou une attache inversée.
Ne pas passer des heures à rechercher une fidélité native parfaite en bloquant une
intégration utilisable ; annoncer précisément les adaptations restantes.
Inversement, ne jamais présenter un simple export ou un test vert comme une validation visuelle.

## 2. État concret du jeu

Quatre armes exposées : Counter Sword, Spy Dagger, Plasma Sword, Breaker.
Breaker est dans le menu principal et le slot physique Digit4 (touche 4).
Jeu local : http://127.0.0.1:5173/?weapon=breaker&weaponSkin=classic

Breaker : modèle/textures d'origine, deux rigs, 25 clips exportés par sexe,
sons, frappe sol courte/longue, frappe aérienne depuis un vrai saut,
maintien droit et relâchement vers attaque 4, déplacements d'attaque,
contacts orientés, dégâts et obstacles dans l'entraînement S5.
Le maintien/release est une adaptation S5, pas la preuve des règles natives de charge.
Le badge BR est temporaire ; les effets complets d'origine ne sont pas encore rendus.

### Corrections importantes après retour utilisateur

1. Repos : HM000 (NormalState_Breaker et previewactoranimsetting.lua), pas HM006.
   HM006 est une posture de charge.
2. Marche : HM008–HM015 en haut, 00008–00015 pour les jambes.
   SG018–SG025 appartiennent à la locomotion basse pendant la charge.
3. Ordre S5 front/rightFront/right/rightBack/back/leftBack/left/leftFront :
   haut HM008,HM009,HM010,HM014,HM013,HM015,HM012,HM011 ;
   bas 00008,00009,00010,00014,00013,00015,00012,00011.
   C'est la convention de présentation du rig importé ; ne pas trier par numéro.
4. Attache : inverse(Sword_Wea_Dummy) × ModelData, sous L_Hand_Dummy.
   La correction de bind seule était annulée au premier frame par les animations
   BASE du dummy. equipment-rig.js convertit désormais aussi ces poses dans
   le repère aligné. Ne pas ajouter une rotation arbitraire de 180°.
5. La charge ne disparaît plus après 2,5 s. setWeapon accepte Breaker.
   Le taux de déplacement Breaker vaut 1, adaptation neutre explicitement
   documentée ; son absence causait des positions/vitesses NaN.

Les tests vérifient désormais l'attache APRÈS évaluation du mélangeur d'animation,
pas seulement les matrices au chargement. Le repos masculin et la marche féminine
ont été inspectés visuellement après ces dernières corrections.

## 3. Découvertes vérifiées

- 74 archives, 55 619 entrées inventoriées.
- IMPORTANT : les 18 archives initialement dites verrouillées étaient refusées
  par les permissions du sandbox. Une lecture autorisée a fonctionné pendant
  l'exécution de S5Runtime. Ne pas reprendre l'ancien diagnostic de verrou exclusif.
- XS : blocs Snappy bruts, puis XOR sur blocs complets de 8 octets ; la fin
  incomplète reste inchangée. Clés récupérées par signatures connues et vérifiées
  sur le contenu complet. Génération générale des clés encore inconnue.
  L'ancienne piste « tout est bloqué par XInflate » est dépassée.
- 912 textes extraits et revérifiés : 409 Lua, 333 X7, 23 XML, 147 INI.
  Lua vérifiés syntaxiquement, jamais exécutés.
- 6 047 scènes SCN extraites ; 1 683 enveloppes CC01 déchiffrées via ChaCha20.
  Le parseur accepte 6 046/6 047 scènes.
- Rigs principaux lisibles intégralement : 777 clips masculins, 734 féminins.
  Ce sont les clips disponibles dans les fichiers, pas tous des animations
  déjà importées ou validées dans S5.
- Chaîne MoveBox : différence d'échantillons animés, rotation locale/monde,
  multiplicateur, contrôleur puis collisions.
- Hit Breaker : seuil strict, événement au premier update au-delà du délai.
  SetDrop remplace une vitesse ; ce n'est pas une téléportation.
- MAKEBOX : dimensions complètes, ancre distincte du centre (décalage de D/2).
  Intersection OBB/AABB native étudiée et testée séparément.
- GhostTrail : géométrie, échantillonnage, UV, couleur et plusieurs états D3D
  retracés ; cela ne constitue pas encore un renderer fidèle.
- Résolution des textures particules : DDS de même dossier/basename préféré
  par le chargeur natif. Ne pas appliquer cette règle à toute texture sans preuve.
- Obstructions Breaker type 1 : masque 0x2107c0 ; 0x400 correspond à CObstruction.
  Le registre CShield 0x800 n'est ajouté que pour types 4/8/6, pas Breaker type 1.
  Plusieurs bits et un facteur de hauteur dynamique restent opaques.

Les tables X7/XBN peuvent diverger. Une valeur trouvée dans un fichier n'est pas
automatiquement la valeur prioritaire utilisée à l'exécution.

## 4. Outils et fichiers utiles

### Dépôt du jeu

C:\Users\Baba\Documents\Codex\2026-09-24\ai\S5leaguePV
Distant configuré : https://github.com/Alkatarak/S5leaguePV.git
Branche inspectée : main.

- AGENTS.md : règles de validation pour les prochaines armes.
- tools/s5runtime-arsenal/XsInventory : indexeur XS en lecture seule.
- tools/s5runtime-arsenal/build-catalog.mjs : catalogue des 22 familles.
- public/assets/s5runtime/arsenal-catalog.json : ancien inventaire 56 archives ;
  ses statuts de jouabilité ont été actualisés, pas sa provenance historique.
- public/assets/s5runtime/animations/breaker : deltas masculins/féminins et SHA.
- public/assets/s5runtime/weapon-breaker-classic.json, textures et sons associés.
- src/loadout.js, weapon-slots.js, avatar.js : exposition et chargement.
- src/melee-weapons.js, controller.js, motion-graph.js : états et animations.
- src/breaker-movebox-data.js : courbes extraites pour le gameplay.
- src/breaker-contact.js, combat-state.js, training-combat.js : contact/dégâts.
- src/equipment-rig.js : attache et conversion des poses du dummy.
- src/rig-animation-delta.js : fusion sans remplacer le squelette existant.
- breaker-preview.html et src/breaker-*-preview / breaker-preview-motion :
  diagnostic isolé ; il ne remplace pas le jeu principal.
- tests/breaker-locomotion.test.mjs : repos et huit directions, deux sexes.
- tests/equipment-rig.test.mjs : attache après animation et non-régression.
- tests/breaker-gameplay.test.mjs, breaker-integration.test.mjs :
  phases, charge, changement, contacts, obstacles, assets et déplacements.

### Dossier de recherche séparé — pas dans le dépôt Git du jeu

C:\Users\Baba\Documents\ChatGPT\S5 league

- tools/s5runtime-arsenal/README.md : état réel du codec et commandes.
- tools/s5runtime-arsenal/xs_decode.py, header-signatures.json : extraction XS.
- tools/s5runtime-arsenal/scn-decode.mjs : deuxième couche CC01.
- tools/s5runtime-arsenal/attack-box-{math,intersection}.mjs : références géométriques.
- tools/s5runtime-arsenal/ghost-trail-{math,render-state}.mjs : références de traînée.
- work/arsenal-integration/convert-scn.mjs : lecteur/convertisseur strict.
- work/arsenal-integration/prepare-breaker-rig-animations.mjs : export 25 clips.
- work/arsenal-integration/breaker-locomotion-source.test.mjs :
  vérifie que les clips NormalState/RunState sont réellement exportés.
- work/s5runtime-decoder/game-data : textes sources et manifeste.
- work/s5runtime-decoder/scn-library : scènes extraites originales, conservées.
- work/s5runtime-decoder/scn-inner-decoded : sorties déchiffrées distinctes.
- work/s5runtime-decoder/SCN-NATIVE-DECODE.md : preuve et limites CC01.
- work/s5runtime-decoder/ATTACK-BOX-NATIVE.md, ATTACK-BOX-INTERSECTION.md,
  WEAPON-RANGE-NATIVE.md, GHOSTTRAIL-NATIVE.md, GHOSTTRAIL-RENDER-STATE.md,
  TEXTURE-NATIVE-RESOLUTION.md : preuves techniques.
- work/movement-analysis/rapport-mouvements-s5runtime.md : rapport général.
- work/movement-analysis/breaker-movement-map.md, breaker-hit-native-chain.md,
  breaker-setdrop-native-audit.md, breaker-target-rules-native-audit.md,
  breaker-obstruction-mask-native-audit.md : approfondissements ciblés.
- Les anciennes notes GOAL-PLAN et les manifestes « staged » décrivent souvent
  des étapes historiques. Ce document et les sources actuelles priment pour
  l'état d'intégration ; les manifestes de données ne certifient pas le gameplay.

Un clone Git du jeu ne transporte PAS cette bibliothèque de recherche (~1,5 Go
de scènes sources), ni tous les décodeurs et rapports du dossier séparé.
Prévoir leur transfert explicite si le prochain agent travaille sur une autre machine.

## 5. Validation et reproduction

Dernière suite globale du jeu : terminée avec code 0 après les corrections
repos/marche/attache. Build Vite : réussi, 122 modules.
Tests ciblés d'animations/gameplay/intégration : 23/23 avant correction d'attache ;
tests attache/locomotion après correction : 11/11 ; export/source : 3/3.
Ne pas convertir ces nombres en un total global déduit : recompter en relançant.

Depuis le dépôt :
  node --test --test-reporter=dot tests/*.test.mjs
  node node_modules/vite/bin/vite.js build

npm n'était pas disponible dans le PATH de ce terminal ; les commandes Node
directes ont fonctionné. L'écriture du build peut nécessiter une autorisation
car le dépôt réel est distinct du workspace de recherche.

Scénarios de diagnostic, contrôleur et moteur de rendu réels :
  ?weapon=breaker&qa=idle&t=.5&qaView=profile
  ?weapon=breaker&sex=female&qa=front&t=.3&qaView=profile
  ?weapon=breaker&qa=breaker-contact&t=.3
  ?weapon=breaker&qa=breaker-jump&t=.4
  ?weapon=breaker&sex=female&qa=breaker-charge&t=.9

qaView=profile évite de dépendre des préférences de caméra libre de l'utilisateur.
Retirer qa et qaView pour rendre le jeu au contrôle normal.
Le réglage d'entraînement utilisé donne 24 dégâts normaux/aériens et 20,4 pour
attack4 (24 × .85), sans bonus. Ce n'est pas une mesure des dégâts serveur.
L'import de nouveaux clips nécessite un rechargement du navigateur.

## 6. Restant par rapport à l'objectif

### Breaker, jouable mais pas encore reproduction native complète
- Conditions réelles de charge, pleine charge, coûts SP et annulations.
- Priorité effective des tables d'équipement et formules de dégâts.
- Transition MoveBox réellement blendée dans le gameplay : le preview dispose
  d'une référence plus complète ; le gameplay échantillonne encore par phase.
- Orientation native exacte des volumes, dimensions des cibles et règles
  d'obstruction/éligibilité ; la version S5 a une adaptation explicite.
- Impulsions/réactions natives : poussée, projection, hitstop, etc.
- Rendu complet des SEQ et GhostTrail ; ne pas confondre dépendances extraites
  avec effets rendus. skill_bat_strike1.seq littéral n'a pas été retrouvé.
- Icône authentique en remplacement du badge BR.

### Arsenal et physique
- Prochaines familles documentées : Katana, Air Gun, Cannonade.
- Importer modèle, véritables états repos/marche/attaque, sons, effets et règles
  de chaque arme ; valider sur deux personnages avant exposition.
- Réduire les inconnues de collisions, walljump et cancels à partir des preuves.
  Ne pas réécrire automatiquement sprint/dodge/mouvement global.
- Conserver les avancées des autres chantiers S5 (terrain/interface/mouvements)
  sans les attribuer au travail arsenal ni les écraser.

### Décodage/outillage
- Génération générale des clés XS encore ouverte.
- Dernier SCN rejeté : model/character/body/115_male_body.scn,
  groupe Hood_Dummy supplémentaire de 93 octets ; ne pas supprimer ces octets.
- Actualiser le catalogue historique avec l'inventaire complet, si utile.
- Rendre export, validation et provenance facilement reproductibles.

## 7. Suite conseillée

1. Faire confirmer en jeu la tenue corrigée du Breaker et son comportement.
2. Passer à une autre arme documentée (Katana est un candidat), avec la nouvelle
   liste de vérifications, sans recommencer le chantier codec résolu.
3. Séparer les tâches « nouvelle arme jouable » et « fidélité native approfondie ».
4. Construire ensuite un validateur commun de contrat d'arme (assets, clips,
   mappings, timings, niveaux de preuve), au lieu de répéter les raccords manuels.

## 8. Contraintes et pièges pour le prochain agent

- S5Runtime : travail statique uniquement ; aucune injection, attache, capture,
  lecture de mémoire ou modification/exécution du processus.
- Ne jamais ouvrir C:\Users\Baba\AppData\Local\S5Runtime\dumps\client.dmp.
- Ne pas exécuter les Lua ou DLL extraits pour les « tester ».
- Garder chiffrés/originaux et sorties déchiffrées séparés avec CRC/SHA/provenance.
- Pas de conclusion de fidélité à partir d'un nom de clip, d'un parsing réussi
  ou d'un test écrit contre une hypothèse non vérifiée.
- Lire AGENTS.md avant les prochains imports ; préserver les changements concurrents.
- Les assets et preuves d'analyse statique ne donnent pas le code C++ original.
- Les documents historiques parlant de rigs indéchiffrables, de Breaker absent
  du sélecteur ou de verrouillage exclusif des 18 archives sont dépassés.

Chats utiles (inspecter leur état avant de leur confier du travail) :
intégration 01a0df2b-e730-7ff3-91f9-ebb363f1666f ;
analyse mouvement 01a0df79-865e-70c3-9110-208d900ddec8.
Ne créer ni relancer d'autres chats sans autorisation appropriée.

