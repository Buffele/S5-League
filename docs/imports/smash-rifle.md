# Smash Rifle — secondaire DD022

**21 octobre2026 — interaction Shield :** le rayon primaire définitif utilise
désormais le masque MAKERAY authentifié et le cutoff Shield avant dégâts/VFX.
315tests/build passent. Secondaire mêlée et gates DAMAGEMOVING/PartialAnim
inchangés. [Livraison commune](../../work/shield-ranged-integration-20261021/DELIVERY.md).

15 octobre 2026. **Secondaire raccordé au jeu principal, fidélité native incomplète.**
Le primaire automatique, la recharge et les ressources existantes sont conservés.
Reprise réception primaire du18octobre : les consommateurs natifs de
DAMAGEMOVING et PartialAnim00016 sont retrouvés séparément. La locomotion
inférieure de l'état dommage et le mélange partiel ne constituent pas une
impulsion de recul. Le setup des onze nœuds et la porte de distance à la caméra
sont établis statiquement ; la durée0 saute l'état dommage complet mais garde
le chemin partiel. L'admission contextuelle du record reste à qualifier avant
raccordement ; la baseline S5 sans réaction n'est pas une validation S5Runtime.
Voir [reprise et preuves](../../work/automatic-rifle-reactions-20261017/FOLLOWUP.md).
Le clic droit déclenche désormais une attaque de mêlée, même sans munition ;
aucune balle n'est consommée pendant ce coup. Le changement d'arme ou une
réaction reçue l'annule et permet de reprendre le tir normal.

## Sources et horloges

Item2010006/type21. `StandardSmg3sword` et les états
`UseWeapon2WeakState_SMG3Sword`/`UseWeapon2StrongState_SMG3Sword` sont authentifiés
par les SHA/longueurs du manifeste d'extraction. Les copies du checkout avaient
des CRLF : seules les copies du nouveau dossier sont normalisées en LF, après
reproduction exacte du SHA et de la longueur attendus. Sources originales intactes.
Contrat : `work/smash-secondary-recovery/source-contract.json`.

NormalState_SMG3 et RunState_SMG3 sont lus séparément : DD000 au repos,
DD014–DD021 pour le haut et00008–00015 pour les jambes. Le secondaire ne les
remplace pas par des animations d'attaque comme locomotion ordinaire.

Factory native837980, nom ATTACK_2_SMG3 : constant_info s32[58]=1000 fixe
la durée principale+60 via le slot64/561550. `InitLua(40,200,false,false)`
configure le minimum de scène et le timer inférieur, pas une attaque de40ms.
La sortie est strictement après1000ms ; la phase inférieure s'ouvre strictement
après200ms. Le sélecteur5C8720 prend la durée principale pour le fitting.
DD022 conserve l'override900 et vitesse Lua1 : vitesse float32(900/1000).
Avant la phase inférieure, corps entier DD022 ; ensuite haut DD022 et jambes
DD005–DD012 en mouvement, A0024 à l'arrêt. Preuve statique : `native/audit.json`
dans le dossier de reprise ; aucune exécution S5Runtime revendiquée.

## Vrai contact et effets

Le Lua contient deux CAttack à400ms, puissance explicite10 :

- rayon AlwaysCritical, origine(0,250,100), direction(0,0,-1), longueur range×0.8−100 ;
- box normale, même origine/direction, dimensions500×100×range×0.8,
  Blow(2500,2000), sans consommation de munition.

Les deux déclarations sont conservées. **Le rayon critique n'est pas encore
raccordé au calcul des dégâts : l'arbitrage natif sans DependOn reste inconnu.**
L'arène applique explicitement la seule box normale de10 ; elle ne prouve pas
les PV S5Runtime. Les dimensions corporelles restent la politique d'arène commune.
Le Blow utilise les magnitudes déjà portées : vitesse horizontale15, verticale12
en unités S5, avec déplacement et collisions réels.

Voix masculine1/féminine2 à l'entrée ; sword_s à l'activation ; sword_attack
et backattack_sword_s au contact accepté. Les balles ordinaires gardent leur
chemin distinct sans réaction. `blank_1sec.seq` contient un émetteur sans texture,
non raccordé par le renderer texturé S5 ; son comportement natif reste à vérifier.
Le GhostTrail_bat_sword_01 déclaré50–350ms n'a qu'une entrée XML type13,
aucune entrée type21 classique : sa résolution native reste à établir.
Aucun ruban de dimensions arbitraires n'est raccordé pour le remplacer.

## Vérification et limites

11 tests dédiés et118 régressions ciblées réussissent ; build réussi1.69s.
Les tests utilisent Controller/MotionGraph, les deux vrais rigs, huit directions,
le grip et les sommets après mixer, le contact unique, les PV d'arène90,
l'impact et la projection physique, puis l'interruption et le retour au tir.
Logs et timestamps de début/fin : `work/smash-secondary-recovery/`.
Ces durées ne mesurent pas le débit de tests natifs ni un gain ×10.

QA principale : `?weapon=smashrifle&sex=male&qa=smash-secondary&t=.3`,
variante female, qaMove=front/right/etc ; `qa=smash-secondary-contact&t=.45`
place la cible à1.7m. L'observation navigateur M/F est conduite séparément
par l'intégrateur et reste à joindre à ce bilan.

Restent ouverts : rayon critique, PV/équipement/armure, AddtionalPower séparé,
hitstop450/650, permissions natives de saut/esquive et souris, annulation furtive,
GhostTrail et fidélité des effets/caméra/audio. Le gate natif reste fermé.

## Complément de comparaison — 15 octobre 2026

`smashSecondaryContactCandidates` évalue désormais les deux déclarations à
partir des formes source, sans modifier les PV ou consommer l'activation.
Le choix `rayCollisionMode` est obligatoire : `ellipsoid` utilise le port
statique de la branche542450 ; `detailed-unresolved` conserve un résultat
inconnu pour les volumes squelettiques7AF0F0. Il ne substitue jamais
silencieusement l'ellipsoïde au personnage natif détaillé.

Les preuves antérieures `work/melee-critical/README.md` et `evidence.json`
établissent la limite de portée par distance ancre→centre, puis le test de
demi-droite/ellipsoïde. Elles établissent aussi que SetAlwaysCritical écrit
un flag indépendant, sans démontrer un multiplicateur de PV. Ces preuves
ne résolvent ni la priorité entre Attack1/Attack2, ni le partage de victimes.
La politique de dégâts du jeu principal reste donc normal-only.

18 tests ciblés passent (dont géométrie dans huit caps, corps détaillé
inconnu, non-mutation et intégration existante des deux rigs), puis le build
réussit. Logs : `work/parallel-gameplay-reference/armes/smash-tests.tap` et
`smash-build.log`. `smash-candidates-proof.mjs/json` conserve les SHA des
sources, quatre cas numériques et la demande S5Runtime discriminante. Ces
positions utilisent le corps d'arène1.2×1.8 ; les positions S5Runtime doivent
être recalculées depuis les dimensions/range effectivement mesurés.
Aucune nouvelle observation navigateur ou S5Runtime n'est revendiquée.


## 18 octobre 2026 — réserve du fichier courant
La réserve utilise désormais max_ammo=-1 du xbn/weapon.xml actuel, authentifié
par CRC/longueur/SHA et index courant. Les chargeurs restent7/30/40 pour
Revolver/Semi/Smash. Les autres paramètres de cette arme sont conservés.
Tests des deux sexes, tir/recharge/changement et bonus Siege ; contrôle
navigateur du vrai runtime avec fixture QA explicite. Réserve logique
native en partie non observée ; nativeReady inchangé. Compilation globale
actuellement bloquée dans le CSS du lobby, régressions d'interface ouvertes.
[Preuves, résultats et limites](../../work/rifle-ammo-reference-20261018/DELIVERY.md).
