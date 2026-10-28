# Burst Shotgun — item2010008/type23

15 octobre2026. Aucun runtime Burst préalable trouvé dans src/tests/tools.
Adaptateur raccordé au registry/Controller/MotionGraph par le coordinateur ;
exposition/contacts principaux attendent l'autre propriétaire. Gate fermé.

23 ressources réextraites depuis la copie privée authentifiée en lecture
seule, toutes CRC/longueur/SHA vérifiées,0 échec de décodage. Sources exactes
et manifeste dans work/parallel-gameplay-reference/armes/burst-shotgun/.
Modèle shotgun.scn, texture shotgun.dds, cinq sons, quatre séquences et trois
textures de muzzle. Type23 confirmé par weapon.xml/weapon_attach.x7 ;
R_Hand_Dummy/link0, rangement Spine_Dummy, ShotGun_Wea_Dummy et deux muzzles
ShotGun_Fire_Dummy/ShotGun_Fire_Dummy01. Ne pas confondre avec l'item2010013
« Classic Burst Shotgun » qui porte shotpstol.scn, MK2 ou TEST.

NormalState SS000 et RunState SS014–SS021/00008–00015 sont lus séparément.
Tir SS001/SS002/SS003, vitesse Lua1 et custom blend non bouclé ; jambes
E0008–E0015 en mouvement, SS002 au repos. Recharge SS004 demandée2500ms,
14400ticks M/F, curseur fitting ajusté. Recharge mobile avec jambes RunState
reste une politique d'arène héritée du REX à comparer spécifiquement.
Les porteurs complets male_bip/female_bip actuels sont vérifiés par SHA et
longueur ;29clips requis, copies conservées, métadonnées des clips de base
comparées. Les deux meshes et le grip sont mesurés après mixer sur M/F×8dirs
au repos/tir/recharge ; pas de certification des angles natifs par proximité.

StandardSmg4 déclare **quatre CAttack distincts au même instant150ms** :
directions (0,0,−1), (0,−.034641,−1), (.03,.017321,−1), (−.03,.017321,−1).
Chacun porte Power*.25+AdditionalPower ; avec le preset25.75 actuel,
6.4375 par rayon avant falloff. Seul Attack1 consomme1munition. Aucun motif
séquentiel AddPatternPoint, aucun AddProjectileOffset ; ne pas réutiliser
la politique du Hand Gun ou du Revolver par nom/alias.
Falloff4000→8000/min.2 et SetCritical(2.3,0) conservés ; pipeline final
équipement/armure/critique/HP logique non certifié.

Chaque rayon porte Push(120,1315,−5000). Le helper exige index natif,
direction du record et politique native explicites ; aucun Blow générique
ou hold n'est substitué. Empilement/remplacement de quatre Push sur la même
victime reste à mesurer. Les candidats géométriques partiels/murs sont testés
avec les quatre directions réelles, distincts des volumes squelettiques S5Runtime.

Runtime avec répétition au maintien depuis le22 octobre2026 : phase700ms,
activation150ms, une salve en queue par cycle,
un débit ammo, capacité8/réserveInfinity. InitLua main700/cool625 et période
catalogue1.2=833.333ms restent séparés ; l'adaptateur impose la période
catalogue, sans prétendre avoir reproduit l'arbitrage du dispatcher natif.

17 octobre : les quatre contacts peuvent maintenant ajouter chacun leur
Push dans le jeu principal, sans écrasement par une Map de victimes. Les
masques zéro des Push de base ne se bloquent/remplacent pas mutuellement
dans le manager natif vérifié. La direction suit le record FRONT horizontal
depuis l'origine de la géométrie du tir ; aucun Blow, lift ou hold arbitraire
n'est ajouté. Le bridge S5 conserve les collisions et les protections, avec
politique acteur neutre et constantes FREE historiques explicitement
qualifiées. La réception/cadence/physique courante S5Runtime n'est toujours pas
mesurée et nativeReady reste false. Rapport de raccordement :
`work/ranged-push-direction-20261017/DELIVERY.md`.
SS002 dure3600ticks=750ms ; vitesse Lua1 conservée et fitting d'action native
reste à vérifier. Horloge >=150, input et annulation sont des
politiques testées localement qui nécessitent comparaison native.

Effets : weapon_shotgun_fire (deux émetteurs) et weapon_shotgun_jump (un)
récupérés/parsésexactEOF, impacts gun_hit4/gun_hit octet-identiques aux
séquences partagées converties. Dépendances empaquetées hachées dans effects/
proof.json. Nouvelle preuve statique du15octobre : les deux SetGunBlastSequence
ajoutent deux records parcourus dans l'ordre, chacun avec son node et son son.
Le second n'est pas un sélecteur aérien. Data.blastBindings/runtime.blast0
etblast1 remplacent airMuzzle/airShot ; sons burstshotgun_blast puisrevo_blast
authentifié. Wrapper dispatch les deux records parvolleyS5, sans multiplier
par4pellets ; cette fréquence demeure une politique d'arène. Le caller natif
56D890/56E5D7 est conditionné par un franchissement de timerobjet et des gates
communes ; son application aux quatre CAttack et l'initialisation de tous ses
flags restent ouvertes. Le callback onSound est fourni au propriétaire audio,
qui doit remplacer l'ancien eventshot seul pour éviter un premier son doublé.
Le wrapper suit resetSerial du vrai Controller et expose lastBlastDispatchReport.
Traceurs procéduraux d'arène non certifiés natifs. Sons récupérés :
burstshotgun_blast/hit/wall_hit/reload, revo_blast etsmg_dry_fire ; aucune écoute native.

50/50 tests ciblés (dont Controller, Hand Gun/Assault et contrat central)
et build3.21s réussis. Tests : sources/pluralité/consommation, salves30/60/120Hz, impacts partiels,
murs, tir vertical à base explicite, puissance par rayon, Push indépendant,
annulation avant150, reload finie/infinie, effets et deux rigs réels après
mixer. Logs tests/build conservés dans le dossier de preuves. Demandes autres
propriétaires et contrat central dans integration-requests.md et JSON voisin.
Aucun navigateur, serveur, client ou attach natif lancé pour ce passage.

## 22 octobre2026 — maintien du clic gauche

Le bouton maintenu accepte maintenant le cycle suivant, après fin de phase et
cooldown. Relâcher empêche une nouvelle salve ; celle déjà acceptée termine
son activation. La recharge commune reprend le tir si le bouton reste tenu.
Un seul débit par salve de quatre rayons, clic bref et annulation avant150ms
sont conservés. Les durées existantes et gates natifs restent inchangés.
Les tests historiques ci-dessus précèdent ce correctif. Preuves actuelles,
captures dans le jeu principal M/F et limites :
`work/revolver-shotgun-hold-20261022/analysis.md`.
