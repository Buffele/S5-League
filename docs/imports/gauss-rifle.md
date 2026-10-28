# Gauss Rifle — préparation source, non raccordée

15 octobre 2026. Lot actuel : **Gauss Rifle MK2, item2020039**. Le Gauss
standard2020002 est une identité indépendante ; aucune fusion de comportement.
Les résultats sont dans `work/parallel-gameplay-reference/armes/gauss-rifle/staged/`.
Aucun adaptateur, registre ou asset public Gauss ajouté par ce lot. Gates natifs fermés.

## Contrat authentifié

Catalogue : type équipement16, attaque Lua44, puissance9, cadence6, chargeur24,
réserve infinie, déplacement0.9, précision0.15, scope25°. Attache type16 et44 :
R_Hand_Dummy/link0, rangement Spine_Dummy ; modèle gaussrifle_mk2_v01.scn,
texture réelle gaussrifle_mk2.dds. Le modèle contient13bones et les sockets MK2.

NormalState_MG2 donne Z0000. RunState_MG2 donne Z0014..21 selon les huit clés
sémantiques, bas E0019..26 ; aucune locomotion dérivée des attaques.
Primaire : blenders Z0001/2/3 et ZZ001/2/3, bas E* ou Z0013.
Secondaire : ZZ022/23/24, bas E* ou Z0013. Reload Z0004 demande2000ms et
LOOP_TRUE : conserver cette déclaration. Les36clips requis sont présents pour
chaque sexe après fusion de deux carriers authentifiés ; le test évalue mixer,
huit directions et attache réelle. Ce résultat ne constitue pas une observation visuelle.

Primaire GaussRifleMK2_Standard : InitLua(900,250,200,260), SetMK2(true),
10CAttack à20,180,310,440,570,700,830,960,1090,1220ms ; chaque attaque
consomme1munition, puissance Power, critique2.5. Ne pas tronquer à900ms.
Secondaire : InitLua(1400,740,0,260), inputDelay800, directionSequence à250,
SP35, portée1800,7directions normalisées, puissance1.15*Power+AdditionalPower,
Blow(1200,1500),1munition par attaque. **OneShotTime passé par la factory reste
inconnu** ; le commentaire Lua0 ne fournit pas cet argument.

## Résultat natif borné

La factory836090 construit l'état MG2. InitLua5BBE80 reçoit quatre arguments
(ret16) ;900 initialise le timer du composant principal. SetMK25BC3D0 active
des canaux supplémentaires3/4/5 du blender F6D630, sans preuve de modification
du timer. Tick5BC9B0 saute les timers+20/+10 sous un prédicat externe vrai.
Sinon l'expiry strict du end-gate avec latch demande phase1 avant le timer
principal. L'expiry strict du principal demande vslot24(external+1C).
INPUT_USE_WEAPON1_END=6 authentifié ;5BCC80 latch le relâchement.

Enter5BBED0 transmet le même paramètre à component+8 et state+54 via
58B870→561520. Le rapprochement interface acteur (getter vslot3C→byte6C,
vslot24→pendingstate) est corroboré par l'audit compétences, mais la vtable
concrète de ce paramètre et l'ordre global activation/base Tick restent à établir.
Le module staged n'est qu'une transcription partielle exigeant un prédicat
explicite ; il ne certifie ni la durée totale ni les contacts.

## Ressources et limites

23sources extraites avec contrôles CRC/longueur/empreintes ;5séquences parsées
jusqu'à EOF et17dépendances retrouvées. Le NodeLoader passif référence
effects/gauss_rifle_mk2_eff_node_dummy_01.scn, absent de l'index courant et
historique vérifié. Aucune substitution silencieuse.
L'attribut LEFT courant référence PlasmaSword_Heavy ; RIGHT n'a aucun
GetAttackAttrib courant. Les sons/effets MG2 retrouvés ne prouvent donc pas
leur sélection pour MK2. Le mapping crosshair MK2 n'est pas établi ; ne pas
certifier le fallback standard.

## Validation et reprise

`node --test work/parallel-gameplay-reference/armes/gauss-rifle/staged/assets.test.mjs work/parallel-gameplay-reference/armes/gauss-rifle/staged/native-component.test.mjs` : **7/7**.
Pas de build nécessaire pour ce lot de préparation, ni navigateur/S5Runtime lancé.
Reprise : prouver le type externe et l'ordre des contacts/timers ; relever
l'argument secondaire OneShotTime et la résolution des attributs. L'adaptateur
futur createGaussRifleState/advanceGaussRifle/gaussRiflePose possédera sa queue
(`ownsPendingShots:true`) seulement après résolution ou politique d'essai
explicitement décidée. Pas de patch partagé demandé avant ce contrat.
