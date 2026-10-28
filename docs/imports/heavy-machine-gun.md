# Heavy Machine Gun — adaptateur source et limites natives

25 octobre2026 — le runtime partagé prépare désormais les six images du
NodeLoader de tir sur le GPU avant leur sélection. Aucun tirage RNG ni tick
pendant cette préparation ; les phases et les coups HMG restent inchangés.
47 contrôles groupés et build commun avec le cycle des effets mêlée :
`work/weapon-polish-20261025/effect-pool-lifecycle-batch/README.md`.

**21 octobre2026 — Shield et entraînement :** les vingt rayons définitifs
conservent maintenant le masque MAKERAY authentifié et le cutoff Shield.
L'adversaire HMG est accessible dans le menu Échap de Free training, avec
maintien de tir par l'AI locale.315tests/build passent ; protection observée
dans le jeu principal sur les deux sexes. Comparaison vivante S5Runtime et gates
de l'arme inchangés. [Preuves et limites](../../work/shield-ranged-integration-20261021/DELIVERY.md).

**21 octobre2026 — rotations du motif local :** RotateY/RotateZ sont reliés
aux méthodes CVector3 du client. Les arrondis float32 sont raccordés au vrai
consommateur de contacts HMG ;80cas d'instructions originales en CPU isolé
concordent avec le port. Les trigonométries sont des ports mathématiques,
pas le CRT natif exécuté ; le repère de visée S5 reste non comparé.73tests et
build passent, tirs homme/femme observés dans le jeu principal. Cela ne
qualifie pas toute la dispersion, les dégâts ou l'arme ; nativeReadyfalse.
[Preuves et limites](../../work/parallel-gameplay-reference/armes/heavy-machine-gun/SOURCE-ROTATIONS-20261021.md).

**20 octobre2026 :** effet au canon désormais visible dans le jeu principal :
modèle et hiérarchie animés, six textures de flash, particules, suivi du dummy
après mixer, boucle et arrêt par acteur. 321 tests/build et44 observations
navigateur M/F passent. Le mapping AnimName1→HW et la comparaison GPU native
restent explicitement non vérifiés ; nativeReadyfalse. Les anciens blocages
de parser ci-dessous sont historiques. [Livraison du rendu et limites](../../work/parallel-gameplay-reference/armes/heavy-machine-gun/FIRING-EFFECT-DELIVERY-20261020.md).

**18 octobre2026 :** arme maintenant sélectionnable et jouable en essais dans
le jeu principal, avec modèle/animations M/F, contacts, impacts NodeLoader et
sons disponibles. Recharge corrigée à5s, corroborée dans S5Runtime sur les deux
personnages :1000 dans SetAnim n'était pas une durée de recharge1s.
Les anciennes mentions «main à raccorder», «reload1000ms» et «NodeLoader
non porté» ci-dessous décrivent le lot de préparation. Le cycle natif1666ms
est observé, mais la cadence et le débit exacts restent non certifiés ; la
politique d'arène est conservée explicitement, nativeReadyfalse.
[Livraison actuelle, contrôles et limites](../../work/parallel-gameplay-reference/armes/heavy-machine-gun/MAIN-DELIVERY-20261018.md).

**Mise à jour du même jour :** la politique d'arène ci-dessus est remplacée
par les horloges séparées natives : préparation >750ms, vingt fenêtres dans
un cycle >1666ms, débit initial >100ms puis >83ms. 504 transitions natives M/F
rejouées exactement pour les compteurs, 154 tests et build passent, 40 contrôles
navigateur. Aucune parité atomique du débit ni validation des contacts natifs
revendiquée ; nativeReady reste false. Les anciennes mentions de cadence12Hz
ci-dessous sont historiques. Son/SEQ de tir découverts dans la branche C,
encore à raccorder. [Détail du lot et limites](../../work/parallel-gameplay-reference/armes/heavy-machine-gun/CLOCK-DELIVERY-20261018.md).

**Présentation de tir :** `hmg_blast.ogg` est désormais raccordé en boucle par
acteur, selon le consommateur C natif vérifié. Arrêt et propriété des handles
contrôlés, y compris banque partagée par des adversaires. 235 tests/build et
16 observations audio navigateur M/F passent. La séquence au canon reste
bloquée sur sa liste de six textures NodeLoader ; aucune approximation n'est
annoncée comme complète. [Preuves et suite](../../work/parallel-gameplay-reference/armes/heavy-machine-gun/FIRING-AUDIO-DELIVERY-20261018.md).

15 octobre 2026. Item2020001/type5, handler StandardMachinegun,
classe native CAttackHeavyWeaponShotState distincte du Gauss/MG2.
API createHeavyMachineGunState/advanceHeavyMachineGun/heavyMachineGunPose,
clé `heavymachinegun`, queue possédée par l'adaptateur. Le coordinateur a
raccordé Controller/MotionGraph et fourni3tests Controller ; main/UI/audio/
contacts/VFX restent à raccorder par leur propriétaire. Gate natif fermé.

Catalogue courant : puissance6, cadence12, capacité120, réserve infinie,
déplacement/attaque0.8, précision0.06. Modèle hw.scn, gatling.dds retrouvée
et convertie ;3bones dont Hw_Wea_Dummy/HW_Fire_Dummy. Attache **L_Hand_Dummy**,
link0, rangement Spine_Dummy. Les24clips requis sont présents pour chaque
sexe sur carriers authentifiés, avec attache et vertices testés après mixer.
Les deux pistes de modèle F0006 hors avatar sont exclues explicitement ;
les pistes de rig exactes sont conservées.

Normal F0002 ; Run haut F0018 **dans les huit directions**, bas E0019..26
selon clés Lua. Début F0001 non bouclé ; tir AimBlend F0003/4/5, jambes
F0008..15 ou neutral F0017. Recharge F0006/24000ticks demandée1000ms,
LOOP_TRUE, bas normal F0006. Aucune marche de recharge directionnelle
n'est déclarée : l'adaptateur conserve F0006 plutôt que substituer E*.

StandardMachinegun déclare20CAttack, temps(index−1)*OneShotTime,
RotateY(0.9*scale) puis RotateZ selon deux tableaux exacts, avec attribut
LOWER/MIDDLE/UPPER choisi par scale1/2/3. Puissance Power+Additional,
critique2.5, falloff3000..6000/min0.2. **Aucun SetConsumeAmmo déclaré**.
Le calcul de direction d'arène indique sa convention de rotation non certifiée.

Preuve native : InitLua5AB370 reçoit trois arguments et initialise
timers+23C/+25C/+31C. Phase0 joue ANIM_BEGIN et teste strictement>750ms
avant phase1/2 selon ammo. Phase1 évalue les contacts puis remet son cycle
à zéro. OneShotTime réel, durée de cycle, débit ammo et entrées release
restent non certifiés. Politique d'essai exportée : cadence catalogue12Hz,
un débit/rayon, répétition des20indices, relâchement immédiat/reset. Ces
choix sont séparés des déclarations source et gardent nativeReadyfalse.

19sources et8dépendances d'effets vérifiées CRC/longueur/SHA ; anciennes
absences texture et sonreload levées. gun_hit4/gun_hit parsés EOF exact,
2modèles et6textures dépendantes convertis, aucune texture imbriquée restante.
Le renderer NodeLoader reste à porter ; aucun effet complet observé.
Source muzzle/tracer sequences vides : ne pas fabriquer un blast certifié.
Impact LOWER utilise player_attack.ogg retrouvé ; MIDDLE/UPPER utilisent
hmg_hit.ogg toujours introuvable dans l'index courant/historique contrôlé.
hmg_fire_start.ogg est récupéré mais sa liaison connue est AI, pas joueur.

Validation :10tests propres (30/60/120Hz, strict750, annulation/queue, ammo,
reload, M/F huitdirections et mixer),12tests contrat central : **22/22**.
Build exit0,2.04s avant dernière fermeture des seules dépendances VFX.
Tests Controller coordinateur3/3 et ammo7/7 rapportés séparément.
Pas de navigateur, client S5Runtime ou comparaison native lancé par cet agent.
Preuves et demandes : work/parallel-gameplay-reference/armes/heavy-machine-gun/.
