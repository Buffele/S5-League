# Assault Rifle classique — item2010024/type34

**23 octobre — Conquest :** raccord réel du Controller, reçus par balle,
rayon après dispersion/obstacles/Shield et PV usine conservés lors du changement
d'arme. Main testé sur les deux sexes, attribut85, politique S5 plain-item/FREE2
à13PV proches. Aucun Push ajouté. Gate visuel complet et comparaison native
encore ouverts ; voir `work/game-modes/conquest-recovery/pawn-finalization-20261023/rifle-delivery-checkpoint.json`.

15 octobre2026. Adaptateur raccordable et ressources préparées ;
Controller/MotionGraph/registry raccordés par le coordinateur. Exposition et
contacts principaux attendent l'autre propriétaire. Gate natif fermé.

24 ressources extraites de la copie privée S5Runtime en lecture seule, toutes
vérifiées CRC/longueur/SHA,0 échec de décodage. Modèle, texture
assult_rifle.dds, cinq sons dont assultrifle_reload.ogg, quatre séquences dont
weapon_assultgun_rail.seq et quatre textures d'effets. Les trois anciens
blocages ARMES sont donc levés ; cela ne prouve pas leur rendu natif.
La copie originale n'est pas modifiée. Preuves dans
work/parallel-gameplay-reference/armes/assault-rifle/.

Le catalogue actuel et l'attache établissent type34, et non type24 cité par
l'ancien builder isolé. Hand socket R_Hand_Dummy/link0, rangement Gun_Dummy,
origine assult_Wea_Dummy et muzzle assult_Fire_Dummy. Le source Attack1
déclare WEAPONTYPE_SUBMACHINE_GUN tandis que l'attribut CLASSICRIFLE déclare
WEAPONTYPE_CLASSICRIFLE : les deux déclarations sont conservées, sans en
déduire la priorité native.

NormalState : AS000. RunState lu séparément : WK014–WK021 en haut,
00008–00015 en bas. Tir : AS001/AS002/AS003, boucle et vitesse1 ; jambes
E0008–E0015 en mouvement et AS002 au repos. La frontière latérale de
présentation est explicite. Recharge AS004 demandée2000ms, durée source
14800ticks pour les deux sexes ; curseur ajusté au fitting. Recharge mobile
avec jambes RunState reste une politique d'arène héritée du REX à comparer.

Porteurs male_bip.scn/female_bip.scn actuels du lot Submachine vérifiés par
SHA/longueur.29 clips requis, métadonnées des clips de base comparées ;
ajouts et chaînes de copies conservés. Les deux rigs chargent dans loadAvatar
avec les overrides explicites, sans modifier avatar/equipment partagés.
Grip et sommets du modèle sont mesurés après mixer dans huit directions,
repos/tir/recharge sur les deux sexes ; cela ne certifie pas les angles S5Runtime.

StandardClassicRifle : InitLua(260,40,−40,250,0,666,1,drySound), attaque10ms,
Power+AdditionalPower, consommation1, pattern30points API>=2. Catalogue actuel
power6.5, cadence7.5, capacité30, réserve max_ammo−1, mouvement1, accuracy.03.
Le catalogue EU8/60 n'est pas sélectionné. Adaptateur automatique avec
réserve Infinity, queue propriétaire, une munition par tir et délai.01s.
Cadence fractionnaire et remise du pattern après500ms sans tir sont des
politiques d'arène non certifiées par le dispatcher natif.
Dégâts décroissants4000→12000, minimum.2, distincts de l'ancienne borne8000.
SetCritical(2.3,0) ne devient pas un multiplicateur systématique. Aucun Push
ou Blow n'est déclaré dans StandardClassicRifle. L'attribut de dégâts indique
durée0/DAMAGEMOVING_ENABLE/DAMAGEBYPART_ENABLE ; réactions finales à comparer.

Reprise du18octobre : les consommateurs typés de DAMAGEMOVING et PartialAnim
sont désormais retrouvés dans le PE. Le premier autorise une composante de
locomotion dans l'état dommage ; le second mélange localement le clip00016
avec une enveloppe variable. Ce ne sont pas des preuves d'une poussée.
Chargement du masque de onze nœuds et distance carrée à la caméra sont établis
statiquement. La durée0 saute le changement d'état dommage complet, mais
conserve le chemin partiel. Admission contextuelle du record et comparaison
en partie restent ouvertes ; aucun nouveau comportement n'est activé dans S5
par cet audit.
Voir [reprise et preuves](../../work/automatic-rifle-reactions-20261017/FOLLOWUP.md).

Le runtime effets contient le muzzle gun_blast1_1 et impact mur gun_hit
octet-identiques aux séquences partagées converties, plus les trois émetteurs
natifs de weapon_assultgun_hit. Les anciens chemins BMP sont résolus vers
leurs DDS de même dossier par resolveParticleTexture, avec preuves natives
et entrées exactes. Dépendances empaquetées et SHA conservés dans effects/proof.
La séquence rail est entièrement parsée : CActLightning droit,3points,
largeur5, externe1→externe2, texture orange_beam. Nouvelle preuve statique
du15octobre : root0 précède A1 (translation de matriceassult_Fire_Dummy
évaluée au dispatch), B2 (vecteurevent+2C) etauxiliaireC3. Le nouveau module
assault-rifle-lightning.js conserve ce contrat et des snapshots séparés,
sans modifier le profil Cannonade partagé. B n'est pas qualifié de pointtouché
tant que son producteur hit/miss/range reste ouvert. Branche model+CCnonzero
gated, positionauxiliaire etupdates ultérieurs inconnus ; aucun followlive
socket inventé. Tests3/3 de slots/snapshots/gates, pas de rendu certifié.
Le wrapper expose toujours le traceur procédural actuel comme
présentation d'arène explicite, sans le qualifier de natif.

37/37 tests ciblés (dont Controller et contrat central) et build2.72s réussis.
Le vérificateur central antérieur retourne1 avec gates non prêts ; rapport
central-gate-baseline.json conservé, aucune ouverture de gate.
Tests : cadence30/60/120Hz, pattern/débit/queue, chargeur vide, réserve infinie
et finie, recharge et fitting, ressources retrouvées, fermeture des effets,
deux vrais rigs/29clips/huit directions/poses après mixer. Logs tests/build
dans le dossier de preuves. Aucun navigateur, serveur ou client S5Runtime lancé.
Demandes main/avatar/audio/UI/contact et contrat central dans
integration-requests.md et central-contract-patch-request.json.
