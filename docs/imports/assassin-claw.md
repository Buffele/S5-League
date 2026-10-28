# Assassin Claw — lot mêlée du 3 octobre 2026

28 octobre2026 — choix F · Flame ajouté par attaque, couleur réglable et option globale
Keep flames active hors attaque, sauvegardés dans inventaire/Échap/paramètres.
Effets/impacts/audio existants conservés ; ancrages post-mixer, limites et
preuves groupées : `work/weapon-flames-all-20261028/README.md`.

27 octobre2026 — trois directions artistiques propres à cette arme, déclinées
par attaque et sélectionnables dans l'inventaire. Géométries distinctes ;
séquences structurelles, particules d'impact et audio existants conservés.
Mécaniques et gates natifs inchangés. Sources, ancrages et contrôles :
[lot artistique](../../work/melee-art-expansion-20261027/README.md).

26 octobre 2026 — `vital_shock.scn` du pack décodé correspond exactement à
la scène validée : 15 nœuds, aucun Shape. Pas de Line01 supplémentaire récupérée
par cette source ; l'approximation de ruban reste explicitement ouverte.
[Bilan](../../work/weapon-polish-20261025/resource-library-batch/README.md).

25 octobre2026 — traînée préparée et mise en cache dans les trois routes du
joueur et chez l'adversaire Free training, désormais sélectionnable. Elle utilise
sa texture dédiée et le corps exact `vital_shock`, sans repli sur la main skinnée.
La fenêtre est délai50 + durée350ms, entrée après50 et émission nominale jusque400,
avec nettoyage en cas de retour en arrière/interruption.50 contrôles groupés
et un build commun réussis : `work/weapon-polish-20261025/claw-main-batch/README.md`.
Le modèle converti courant ne contient aucun Shape/Line01 : le ruban de volume
S5 reste une approximation déclarée, sans certification de sa forme native.

25 octobre2026 — mélange additif rétabli sur le ruban RGB `gi`, selon la
déclaration type20/scène0/blendType0. Les valeurs normales des armes validées
restent inchangées. Lot commun :33 contrôles et un build réussis,
`work/weapon-polish-20261025/ironboots-dark-panels/README.md`.
La forme du ruban et sa fenêtre reconstruite restent à qualifier séparément.

Statut : **raccordée dans le jeu principal en essais ; non prête native**. Série mêlée autorisée par l'utilisateur ; l'intégrateur possède les fichiers partagés. Les anciens essais `qa-matrix-6` ne constituent aucune preuve pour ce passage.

**Correction de périmètre du même jour :** cette fiche couvre seulement l'ancien item 2000005, désormais distingué comme Assassin Claw (ancien Vital Shock). Le Vital Shock à cinq mouvements signalé par l'utilisateur correspond aux bindings distincts de l'item 2000065 ; son code, ses ressources et les divergences actuelles sont livrés séparément dans [vital-shock.md](vital-shock.md). Les flags d'attaques absentes ci-dessous décrivent 2000005 uniquement, pas la totalité de la famille commerciale Vital Shock.

Raccordement principal : menu/inventaire, avatar M/F, jambes d'attaque,
neuf activations, sons et particules isolées `assassin_claw_body`.
Repos/marche/contacts observés sur les deux sexes ; cible féminine HP40 après les
neuf contacts. Tests contrôleur M/F×8caps×3cadences, retour au repos et changement
d'arme : `tests/melee-batch-3-runtime.test.mjs`. Bilan technique et captures :
`work/melee-batch-3/README.md`, `visual/`. Gates natifs non prêts.

## Identité et sources actuelles

La famille native Assassin Claw correspond à l'item classique **2000005 « Vital Shock »**, type **20**, Power **5**, portée **250**, vitesse déplacement **1,1**, vitesse attaque **1**. Le modèle courant est `model/weapon/vital_shock.scn`. Les variantes Vital Claw utilisant `NormalState_VitalShock` et leurs propres actions ne sont pas substituées à cette référence.

`work/melee-batch-3/assassin-claw/source-contract.json` conserve dix sources CRC/SHA authentifiées depuis la copie des archives actuelles : NormalState, RunState, damage, actorstates_etcweapon, weapon_assassinclaw, attributs, attache, ghost trail, bindings XML et XBN. Les cinq fonctions exactes de l'item sont conservées. L'XBN et les bindings sont comparés au catalogue courant. `extract_sources.py` est reproductible et ne modifie pas l'installation originale.

`source-manifest.json` et `extract_assets.py` couvrent dix-huit ressources binaires authentifiées. Les carriers déjà extraits du lot Twin Blade sont réutilisés uniquement après vérification CRC contre l'index actuel. `stage.mjs` réutilise le convertisseur existant avec décodage SCN, empreintes de la clé et lecture jusqu'à EOF ; aucun ancien contrôleur n'est repris.

## Module raccordable

`src/assassin-claw-data.js` expose la définition `ASSASSIN_CLAW_DEFINITION`, l'aptitude, la locomotion, les jambes d'attaque, les ressources et `assassinClawAttackContacts(kind, comboIndex, options)`. `src/assassin-claw-motion-data.js` contient les durées et la piste MoveBox directe. L'API des contacts garde formes, attributs, ressources acteur/décor et arguments natifs.

| État | Source et clips | Paramètres |
| --- | --- | --- |
| Repos | `NormalState_AssassinClaw`, `C0011` | Boucle, vitesse 1, reset false, blend 1000 ticks ; durée M 4800/F 8000 ticks |
| Marche | `RunState_AssassinClaw`, haut `C0012 C0013 C0014 C0018 C0017 C0019 C0016 C0015` ; bas `00008 00009 00010 00014 00013 00015 00012 00011` | Ordre S5 avant, avant-droite, droite, arrière-droite, arrière, arrière-gauche, gauche, avant-gauche ; boucle, vitesse 1, blend 1000 ticks |
| Attaque | `UseWeapon1State_AssassinClaw`, FIRST/SECOND/THIRD déclarent tous `C0000` | Non bouclé, vitesse 1, reset true, blends 200/300 ticks |
| Jambes pendant attaque | `C0003 C0004 C0005 C0009 C0008 C0010 C0007 C0006` ; immobile `C0000` | Même ordre ; boucle, vitesse 1, blend 500 ticks, fin 300 ticks pour immobile |

Le mapping applique la même frontière de coordonnées que les rigs convertis existants, à partir des clés natives distinctes. Le seul binding d'attaque de l'item est **left_attack → StandardAssassinclaw / UseWeapon1State_AssassinClaw**. `supportsAir`, `supportsSecondary`, `supportsStrong` sont false : aucune attaque forte, charge ou action aérienne distincte n'est inventée. L'éligibilité de l'attaque gauche ordinaire en l'air reste à établir ; `InitLua(40,0,false,true)` et l'autorisation de saut déclarée restent disponibles pour l'intégrateur.

La durée d'attaque proposée de **2000 ms** vient du clip C0000, **9600 ticks sur les deux sexes à vitesse 1**. C'est une politique d'arène explicite ; le Lua ne déclare pas la durée finale de cet état. La vitesse de déplacement source pendant l'attaque est 1. L'adaptateur ne force pas une courbe MoveBox à remplacer le déplacement clavier.

## Contacts, réactions et effets

Le Lua crée **neuf objets** : un à **400 ms**, Power × 4 (20 au preset), puis une boucle de huit à **500, 625, 750, 875, 1000, 1125, 1250 et 1375 ms**, Power × 1 (5 chacun). Chaque objet a une identité distincte malgré le nom local répété `Attack`. La BOX ancre `[0,250,-100]`, direction `[0,0,-1]`, dimensions `[100,100,range]` est compatible avec le moteur commun. Les dégâts sont le quatrième argument de `InitAttack1`, pas un HP final natif certifié ; le cinquième `AddtionalPower` mal orthographié est conservé comme incertitude.

L'attribut `ATTACKATTRIB_ASSASSIN_CLAW` est **non contrable**, guard `[400,GUARDCRUSH_ENABLE]`, damage `[400,DAMAGEMOVING_DISABLE,DAMAGEBYPART_ENABLE]`, POWER_WEAK et dégâts décor 5. Aucun Push/Blow/Stun n'est déclaré : le raccordement ne doit pas ajouter de poussée générique. Aucun objet AlwaysCritical/DependOn n'existe ; `DAMAGEBYPART_ENABLE` ne prouve pas un multiplicateur critique. Camera shake `[50,25,5]`, `[1,1,1000,1000]`, direction aléatoire sont conservés.

Les ressources sont sous `public/assets/s5runtime/assassin-claw/` : modèle avec deux meshes, texture classique, deltas de **18 clips par sexe**, icône, deux sons et effets. `weapon_mindshock_body` est restauré avec **cinq émetteurs et huit textures distinctes** ; toutes les textures runtime existent. Il est déclaré pour contact acteur et décor. `sword_attack.ogg` est le son d'impact ; `bmindenergy_enemy.ogg` accompagne la séquence d'attaque `blank_1sec`, qui ne contient aucune texture visible. Sa présence dans `manifest.missing` décrit cette absence de rendu source et non une extraction manquante. La traînée `GhostTrail_two_hand_sword_01` est déclarée avec un délai de50ms et une durée de350ms, texture `gi` récupérée ; géométrie Line01 et fidélité du rendu restent à vérifier en jeu.

L'attache XML est **ber_arm_R, link=1, sceneIndex=0**, sans `idleAttach`. Le modèle conserve le mesh rigide `vital_shock` et la main skinnée `vital_shock_hand`, ses poids, matrices et hiérarchie. Aucun socket de rangement dans le dos n'est inventé. La fidélité de link=1, la forme de la main et l'angle de prise demandent une observation après raccordement.

## Vérification et prochaine limite

**6/6 tests propres passent** : `node --test tests/assassin-claw-source.test.mjs`. Ils vérifient provenance/empreintes, bindings exacts, neuf contacts et paramètres, géométrie proche/hors-volume, fermeture des ressources d'effets, clips de repos/marche/attaque et huit jambes sur **les deux rigs réels**. Le mixer évalue toutes ces poses à 0/0,4/1,375 s et conserve la matrice relative authored entre `ber_arm_R` et le dummy du modèle. Ce dernier test prévient la dérive des pistes ; il ne certifie pas que la prise native a le bon angle.

| Contrôles | État du passage |
| --- | --- |
| C01 accès/changement, C14 build commun | À effectuer par l'intégrateur après raccordement |
| C02 directions, C05 jambes | Mapping source et présence/évaluation M/F testés ; déplacement/rendu principal à observer |
| C03 attache | Matrice source conservée après mixer ; prise/skin/link1 visuels non certifiés |
| C06/C08 effets, C12 sons | Ressources et références fermées ; émission, suivi, extinction et écoute à observer |
| C09 poussée | Aucune condition physique déclarée ; ne pas inventer une poussée |
| C10 réactions/C13 contacts | Attributs/neuf activations livrés ; annulations, HP natif et réaction exacte non certifiés |
| C04/C07/C11 visée/traceur/dispersion | Aucun tir ni projectile déclaré dans l'action actuelle |

Prochaine limite : **durée/annulations natives de l'état et sémantique link=1**, puis observation en jeu principal des deux sexes et des impacts. Aucune comparaison directe S5Runtime ni capture du nouveau raccordement n'est revendiquée. Aucun blocage au seuil de trois pistes/30 minutes sans progrès : sources, assets et tests ont progressé. Le gate demeure **ready=false**.
