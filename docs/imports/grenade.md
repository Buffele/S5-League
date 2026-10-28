# Grenade — Summer Night Mine Gun 2050010

15 octobre 2026. Contrat source et ressources préparés ; le raccordement acteur
appartient au coordinateur. Aucune exposition principale, observation en jeu ou
comparaison native revendiquée par ce lot. Tous les gates natifs restent fermés.

Le catalogue courant déclare type10, capacité1, réserve4, puissance46,
cadence0.3, portée500 et taux de déplacement/action1. weapon_lua sélectionne
GrenadeUniqueLaunch / UseWeapon1State_MineLauncher. La fonction d'explosion
GrenadeUniqueExplosion ignore ses paramètres de dégâts/portée et déclare
explicitement puissance85, sphère350, Push(300,2000,-5000), DamageApplyType1,
DamageRates(.71,.71,.59), ExplosionRanges(.25,.5,.75). Cette constante85 ne prouve
pas les HP appliqués par la chaîne native d'équipement et de dégâts.

Normal G0014 et Run haut G0004..11 / bas00008..15 sont lus séparément de
l'action. Launch demande100ms avant création, action500ms, vitesse5000 ; custom
haut/bas neutre G0000/G0001 et G0003/G0001, mobile G0015/G0016 et G0017/G0016.
LowerPart DD005..12 directionnel / G0000 neutre. Le contexte aérien explicite
sélectionne le custom mobile. Le driver et la priorité du mélange restent à
établir. Reload G0002_2 exact, boucle,12320ticks ; lower mobile non déclaré et
retourné null. Aucune substitution G0002 ou locomotion ajoutée.

Les32clips requis existent pour chaque sexe. Les31clips communs ont été comparés
numériquement aux rigs existants après normalisation float32/zéros signés ;
G0002_2 provient du porteur bip_*0000 authentifié. Le modèle conserve sa géométrie,
BASE et échelle source, attache R_Hand_Dummy/link0, stowSpine_Dummy ; racine
Minegun_Wea_Dummy, muzzleMinegun_Fire_Dummy. Les tests post-mixer couvrent M/F,
neutre, huit directions, action et recharge, sans certifier les angles natifs.

Ressources sous public/assets/s5runtime/grenade-source : quatre modèles,20PNG,
quatre OGG, six SEQ avec fin de parsing exacte et dépendances résolues. Les
archives courantes sont vérifiées par longueur/CRC/SHA. coreResourceReady et
effectResourceReady qualifient les fichiers, pas le rendu. Le son et la SEQ
grenade_bump sont prouvés dans F629B0 ; audio avant guard de visibilité, SEQ
conditionnelle. Le solveur de rebond F64150 n'est pas remplacé par un rebond
inventé. La préparation ressource ne constitue pas un lecteur SEQ intégré.

API acteur createGrenadeSourceState / advanceGrenadeSource / cancelGrenadeSource /
grenadeSourcePose, clé grenade. L'adaptateur possède pendingSpawns ; vider une
seule fois par splice(0). Les projectiles transférés appartiennent ensuite au
gestionnaire hôte et survivent au changement/rechargement ; reset session doit
les supprimer. La politique nommée latched-primary-strict-source-delay-natural-reload
utilise les seuils source strictement >100ms et >500ms ; arbitrage entrée/cycle/fin recharge natifs
non certifiés. Annulation avant lancement ne dépense rien ; aucune restitution
après consommation. Les fichiers runtime/data stables sont réservés à
l'intégration du coordinateur, sans régénération concurrente.

API projectile createGrenadeSourceProjectile / advanceGrenadeSourceProjectile :
coordonnées s5runtime-source, position/vitesse et politique explicites. dt entier
uint32, coefficient et plafond positifs float32 obligatoires. Le profil
createGrenadeStepInitializationProfile sélectionne explicitement les valeurs
initiales PE Float3=.001f et Float23=.1f, sans prétendre lire le runtime courant.
Le pas est min(float32(dt*coefficient),cap) ; le compteur de fusée prend dt entier
complet, non le pas plafonné. Fuse F63F30 expire strictement après3000ms ; son
gate d'horloge brut et le contexte d'explosion restent fournis par l'appelant.
Ports mouvement/query synchrones ; erreurs refusées avant mutation projectile.
Sans port collision, seul le vol libre est modélisé. Aucune parité x87 certifiée.

Le handler mode1 F63B00 appelle53E240 au centre du solveur avec rayon75, puis
53C0F0 efface les candidats de même booléen brut slot1C4 que le propriétaire.
Ce contact précède la fusée ; contact positif saute l'avancement de fusée même
si le contexte refuse encore l'explosion. Aucune interprétation équipe/itemType.
createCharacterQuery53e240 demande six ports qualifiés : énumération548AE0,
slots44/7C/68/6C et Float33. Il préserve ordre, doublons et identités. Géométrie
source : segment vertical anchor+[0,min(A,B)*Float33,0], deltaY=abs(B-A), test
strict distance²<(75+min(A,B)*Float33)². Float33 initial PE=.5f doit être choisi
explicitement ; dimensions dynamiques et listes natives restent inconnues.
Pas de Box3, capsule de remplacement, swept collision ou masque Shield ajouté.

Preuves et demandes de raccordement :
work/parallel-gameplay-reference/armes/grenade/HANDOFF.md et delivery.json.
28tests du lot passent, y compris ports invalides sans mutation, fusée stricte,
contact avant fusée, tangence, ressources publiques et mélange M/F. À observer
dans le jeu principal puis comparer à S5Runtime : entrée/fin d'état, lancement réel,
contexte/énumération et dimensions, rebonds, dommages/réactions et lecture
VFX/audio. Aucune de ces mesures n'est remplacée par les tests synthétiques.

Correction source des timers promue : runtime b8841101…9afdc9, tests exact100 sans lancement/101 lancement et500 action/501 sortie. L’arbitrage visuel Begin→custom à100 reste une politique S5 non prouvée : Enter applique G0001 et initialise le custom/lower dès le départ ; Tick du custom précède les timers. Aucun setter primaire supplémentaire n’est trouvé dans le bloc de lancement. Ne pas assimiler cette sélection au timer projectile.
