# Dual Magnum — item2010028, type41

15 octobre2026. Sources et adaptateur préparés ; famille non exposée dans le jeu principal par ce lot. NativeReady=false. Ne pas confondre avec SnowDrop2010038, les variantes2010050/56 ou l'ancien modèle dualgun.scn.

Le catalogue actuel authentifié donne power9.5, capacity24, maxAmmo−1, moveSpeedRate1, rateOfFire8, accuracy.03 et range1000. Les anciennes valeurs EU8.5/22/66 ne sont pas sélectionnées. Deux scènes actuelles sont conservées : r_dual_gun.scn →R_Hand_Dummy et l_dual_gun.scn →L_Hand_Dummy, link0, au repos comme équipée. La texture dualmagnum.dds et cinq sons actuels sont récupérés.

NormalState demande D0026 (le commentaire source exclut DU000 dont les sexes étaient inversés). RunState demande DU011..18 en haut et00008..15 en bas, directions natives conservées dans le contrat et converties au repère de présentation dans l'adaptateur. ReloadState demande DU010/2000ms, jambes D0027..34/800ms en déplacement, et DU010 au neutre. Les durées réelles M/F restent distinctes et le haut de recharge est ajusté à2000ms.

56clips requis par sexe existent sur les porteurs actuels base et bip_*0000 authentifiés. Le générateur vérifie les clips déjà présents dans le rig sans les dupliquer dans le delta. Il conserve DU002_1, DU005_1 et DU008_1 pour les jambes neutres des trois actions ; l'ancien générateur les omettait. Les sources originales des modèles et de leurs animations ne sont pas modifiées.

| Route source | Attaques CAttack, ms | Attributs | Particularités |
|---|---|---|---|
| RenewalDualMagnum_SHOT |100,250,400|1,1,1|Le script actuel demande le socket droit pour les trois attaques ; ne pas alterner arbitrairement les mains. Attack2 porte un offset.|
| StandardDualgunAfterDash2 |100,250,400,550|1,2,1,2|Alternance explicite des attributs droit/gauche ; offsets sur2/3/4.|
| StandardDualgunAfterDash3 |350,350,700,700|3,3,3,3|Deux paires simultanées ; offsets sur2/4.|
| RenewalDualMagnum_JUMP_SHOT |100,100|3,3|JumpPower800, fenêtre200ms, SpendSP0, jambes DU027_1 ; deux offsets surAttack2.|
| RenewalDualMagnum_ROLLING_SHOT |50,50|3,3|UseMoveBox=true, multiplier2.0*1.09, SpendSP5, CoolTime0 ; un offset surAttack2.|

Chaque CAttack consomme1munition, puissance Power+AdditionalPower, rayons source, DamageApplyType3, dropoff4000..8000/min.2, corps par thickray=false. Aucun SetCritical actif n'est déclaré. Les offsets restent verbatim : angle/position/sélection/expansion et comportement du consommateur ne sont pas établis. Aucun projectile supplémentaire ou guidage n'est inventé.

Attribut1 : un binding muzzle weapon_dual_mg_fire_1 surdualgun_R_Fire_Dummy. Attribut2 : weapon_dual_mg_fire surdualgun_L_Fire_Dummy. Attribut3 : deux bindings ordonnés, weapon_dual_mg_fire surle socket droit puisweapon_dual_mg_fire_1 surle socket gauche. Les deux ont handgun_blast.ogg. Ce sont des listes, pas un sélecteur au sol/aérien. Les5SEQ sont structurées et toutes leurs dépendances (4modèles/15textures) sont récupérées ; NodeLoader et particules sont convertis avec les mêmes champs que les convertisseurs existants. Rendu natif et fréquence du caller restent ouverts.

API : src/dual-magnum-runtime.js exports createDualMagnumState, advanceDualMagnum, dualMagnumPose, beginDualMagnumAction et cancelDualMagnum. Clé proposée dualmagnum, ownsPendingShots=true. La queue appartient à l'adaptateur. La politique d'arène nommée one-source-action-per-press-cancel-release exécute une liste par pression ; rateOfFire8 n'est pas interprété comme huit listes de trois attaques par seconde. Les délais de récupération sont explicitement des valeurs d'arène. Les quatre routes spéciales exigent diagnostic=true ; saut/roulade produisent seulement des demandes de mouvement non appliquées. Aucune route automatique vers ces actions n'est revendiquée.

La pose mélange les deux clips upper explicitement fournis par le Lua avec un poids fourni par le caller (neutre0 par défaut), sans déduire sa sémantique depuis le viseur. Les jambes d'action/recharge portent les demandes de loop source. Avatar.motion ignore actuellement un choix lowerLoop ; correction demandée à son propriétaire avant revendication de fidélité de boucle des jambes. La sélection/transition des deux clips de roulade est diagnostic explicite, pas une phase native inventée.

Le wrapper FX exige des contacts acceptés par le resolver du propriétaire. Sa politique d'arène one-dispatch-per-action-time-attribute évite de multiplier les deux bindings à cause des deux attaques simultanées d'attribut3. Les impacts restent distincts par attaque/contact. Sons avant effet dans chaque record ; erreurs indépendantes, lastBlastDispatchReport observable, resetSerial/avatar/weapon nettoient les effets et la déduplication. Pas de traceur ajouté : le tracer source est une chaîne vide. Main doit fournir onSound et resolveShots, sans ajouter un ancien événement audio shot en parallèle.

Validation automatique :13/13 tests propres, dont30/60/120Hz, listes/ammo/cancel/reload fini, contrats bindings/dédup/reset, loadAvatar réel M/F avec56clips, deux poignées et sockets après mixer sur huit directions, cinq actions, repos et recharge mobile. Ces tests ne remplacent ni une observation du jeu principal ni une comparaison S5Runtime. Build et résultats finaux : work/parallel-gameplay-reference/armes/dual-magnum/delivery.json.

Gates restants : factory/arbitrage900 et260, transitions AfterDash/Jump/Roll, poids de CustomAnimBlender, physique/SP et timing natif, offsets partagés avec Homing, pipeline dégâts final, fréquence et contexte son/FX, comparaison visuelle/native. Voir integration-requests.md et native-gate.json dans le dossier de preuves de la famille. Aucun lancement natif/navigateur dans ce lot.
