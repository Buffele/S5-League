# Iron Boots — adaptateur actuel, en cours de raccordement

28 octobre2026 — choix F · Flame ajouté par attaque, couleur réglable et option globale
Keep flames active hors attaque, sauvegardés dans inventaire/Échap/paramètres.
Effets/impacts/audio existants conservés ; ancrages post-mixer, limites et
preuves groupées : `work/weapon-flames-all-20261028/README.md`.

27 octobre2026 — trois directions artistiques propres à cette arme, déclinées
par attaque et sélectionnables dans l'inventaire. Géométries distinctes ;
séquences structurelles, particules d'impact et audio existants conservés.
Mécaniques et gates natifs inchangés. Sources, ancrages et contrôles :
[lot artistique](../../work/melee-art-expansion-20261027/README.md).

26 octobre 2026 — les volumes qui déclarent `sword_s` le jouent maintenant
à leur activation, indépendamment des sons de l'état. Les deux attributs
réassignés à des armes à feu n'ont pas ce son ; les volumes `SetPlaySound(false)`
restent silencieux. Régression et limites :
`work/weapon-polish-20261025/melee-activation-audio/README.md`.

26 octobre 2026 — sphère du dash : garde de dessin rétablie sous le seuil
alpha, sans changer depthWrite, hiérarchie ou animation. Piste source vérifiée
dans le pack, 54 contrôles groupés et un build. Sockets des boosters inchangés.
[Lot](../../work/weapon-polish-20261025/melee-zero-draw-batch/README.md).

26 octobre 2026 — sons AddSequence déclenchés strictement après leur seuil,
avec horloge ms/s cohérente. 68 contrôles groupés et un build ; aucun nouveau
binding de booster ou ruban déduit de ce changement temporel.
[Lot](../../work/weapon-polish-20261025/melee-event-clock-batch/README.md).

26 octobre 2026 — les scènes classiques arme/pied/jambe du pack décodé sont
identiques aux sources validées, sans boosterDummy. Ses scripts correspondent
également. Les Shape de la scène d'arme ne résolvent pas à eux seuls les bindings
manquants ; le boost n'est pas déplacé sur une origine fictive.
[Bilan](../../work/weapon-polish-20261025/resource-library-batch/README.md).

25 octobre2026 — voix du dash IB005 restaurée (attack3 selon la déclaration
ANI_IRONBOOTS_Dash_Kick_Attack). Aucun autre événement des boosters ni la
signature atypique du son du troisième coup n'est extrapolé.47contrôles
groupés avec Bat/Twin/Breaker et build commun ; sélection de source validée,
écoute comparative native encore distincte.
[Lot](../../work/weapon-polish-20261025/melee-audio-events/README.md).

25 octobre2026 — panneaux sombres des deux rubans supprimés par composition
additive de leur texture RGB émissive. Cause isolée dans le jeu principal,
33 contrôles groupés et un build réussis avec Demonic Knuckle/Assassin Claw :
`work/weapon-polish-20261025/ironboots-dark-panels/README.md`.
Ce choix de présentation ne certifie ni le binding natif ni l'ancrage du ruban.

25 octobre2026 — les deux scènes strong et la scène aérienne `ironboots_2atk_01`
restaurent maintenant leurs bones sans fusionner les modèles feuilles homonymes.
Cela remplace leur exclusion du précédent lot :
`work/weapon-polish-20261025/indexed-melee-effects/README.md`.

25 octobre2026 — dummy animé du dash `ironboots_dashatk_01` rétabli sur ses
trois loaders, en conservant modèles, pistes et temps SEQ. Lot partagé :
`work/weapon-polish-20261025/melee-effect-hierarchy-batch/README.md`.
Les scènes de frappe à noms dupliqués et les sockets booster restent hors du lot.

25 octobre2026 — adversaire Free training exposé avec les deux rubans des
pieds skinnés, préparés avant combat. Le préchauffage des deux maillages est
également utilisé côté joueur. Lot de six armes :
`work/weapon-polish-20261025/melee-opponent-batch/README.md`. Les rubans restent
reconstruits ; les limites de slots et sockets ci-dessous restent ouvertes.

25 octobre2026 — correction du premier coup : la traînée gauche déclarée
`AddGhostTrail(...,600,600)` était supprimée comme fenêtre vide. Le consommateur
lit maintenant délai600 + durée600. Les autres fenêtres utilisent également
leur durée entière et une entrée strictement après le délai. Les pieds, meshes,
textures et commandes restent inchangés. Correction par lot avec Demonic
Knuckle, régressions et build communs :
`work/weapon-polish-20261025/dual-trail-duration-fix/`.
Le ruban et son horloge nominale restent reconstruits, pas certifiés natifs.

## 24 octobre2026 — contrôle des effets et des sockets bruts

Le sexe de l'effet upper est correctement transmis par le dispatcher actuel :
Controller M/F → weaponStateCues → AddSequenceBySex sélectionne respectivement
weapon_ironboots_n_strong_01 et weapon_ironboots_strong_01. Deux tests de cette
vraie route avec les SCN/particules passent sans correction runtime ; aucune
régression de sexe corrigée n'est revendiquée.

La recherche bornée des quatre boosterDummy a été refaite dans les SCN
authentiques, avant tout filtrage JSON. SHA/CRC/longueur et index actuel
vérifiés, parsingEOF exact : weapon/leg/foot n_01 (4/7/8 nœuds), porteurs
male/female_bip_0000 (106/107), rigs male/female_bip (107/108) ne contiennent
aucun des quatre noms. Il ne s'agit pas d'une omission de conversion.

Une autre variante **actuelle** porte les sockets : le catalogue authentifié
associe item2000030/type43 à ironboots_01.scn, tandis que2000035/type43 reste
ironboots_n_01.scn. Son foot/ironboots_01_foot.scn contient17 nœuds, dont les
quatre dummies demandés, à gauche sous L Foot et à droite sous R Calf.
Ni modèle ni matrices de2000030 n'ont été transférés vers2000035.

Le boost S5 produit toujours zéro cue rendu pour ces quatre AddInstantEffect,
mais leur déclaration **ne prouve pas une visibilité native sur2000035**.
Une lecture PE courte retrouve le consommateur61c840 : lookup parent via
acteur+70 virtualB4, contrôleNULL à61cc1a, puis créationAFC680 seulement dans
la branche nonNULL. Aucun fallback origineacteur n'est établi dans cette
branche ; l'implémentation du lookup lui-même reste à qualifier. Aucun effet
n'est donc arbitrairement placé sur l'acteur, et aucune absence native n'est
affirmée depuis le seul Lua. Pas de client natif utilisé pour cette vérification.

Preuves et limites : `work/weapon-polish-20261024/iron-boots/RAW-SOCKETS.md`,
`raw-sockets.mjs/json`, `instant-parent-proof.py/json` et
`tests/iron-boots-effect-sex.test.mjs`. Gate inchangé, aucun nouveau build.

4 octobre 2026 : récupération du dash corrigée : remise à zéro native de la
vitesse physique XYZ une seule fois, courbe MoveBox IB006 conservée.
Preuve statique Sliding5b17e0→phase1→actor+F0 ; tests M/F×8caps avec
impulsion verticale antérieure, gravité après reset, déplacement de courbe
et arrêt en fin d'attaque. 104/104 régressions ciblées et build réussis.
Preuves : `work/melee-batch-5/iron-sliding-recovery.md`.
La vitesse affichée par S5 pendant la récupération comprend le débit de
MoveBox ; elle n'est pas une mesure isolée de l'inertie physique native.

4 octobre 2026 : enchaînement **boost → dash par clic gauche raccordé**.
Le Lua actuel authentifié par CRC/longueur donne événements5/6/7
(pression/relâchement/relâchement court), état39=USE_WEAPON1 et
item2000035 `left_attack`=DashKick. Le binaire61c270 impose elapsed>100ms.
Les vraies entrées souris, deux sexes et huit caps passent ; 102/102
régressions ciblées et build réussis. Captures M/F action/contact IB005 et
récupération IB006 : `work/melee-batch-5/iron-boost-dash-input.md`.
Éligibilité/SP, réorientation et ordonnanceur natif des transitions restent
non certifiés. Les paragraphes suivants conservent la chronologie ; leurs
mentions de routage boost/dash non résolu sont dépassées par cette preuve.

4 octobre2026 : adaptateur d'événements natifs du boost livré, seuil strict
100ms pour5..7, commandes de transition conservées sans mapping clavier
supposé. Preuve : `work/melee-batch-5/iron-boost-input.md`.
Émetteurs d'événements, table équipée d'état39 et réorientation encore ouverts.

4 octobre2026 : déplacement direct du boost raccordé depuis Tick61a130,
vitesse acteur×sprint1.5×RunSpeedMultiplier1.2, collision incluse, dernier tick
d'action conservé et arrêt en récupération. M/F×8 orientations, 63 régressions
ciblées, build et deux captures : 1.4256m à100ms, 2.99376m à210ms.
Preuve : `work/melee-batch-5/iron-boost-movement.md`.
Éligibilité, réorientation, MP/SP et temporisations restent non certifiés.

4 octobre 2026 : boost IB016/R0033 conserve maintenant la vitesse Lua1,
durée d'animation demandée0 dans CFastRunVerIronBoots ; récupération0
conservée un tick et vitesse physique remise à zéro à son entrée.
Vrais rigs M/F×8caps, 61 régressions ciblées, build et quatre captures.
Preuve : `work/melee-batch-5/iron-boost-speed.md`.
Le déplacement a été raccordé au passage suivant ci-dessus ; règles d'entrée/sortie du boost restent à établir.

4 octobre 2026 : dash IB005/IB006 désormais ajusté aux demandes natives
800/1000 ms de CAttackIronBootsSlidingState, vitesses0.75/0.899.
Vrais rigs M/F×8 orientations, 60 régressions ciblées et quatre captures
action/récupération du jeu principal. Preuve :
`work/melee-batch-5/iron-sliding-speed.md`. Diagnostic action=dash ajouté ;
commande native du dash et déplacement du boost restent à établir, gate toujours non prêt.

4 octobre2026 : trois coups, upper et aérien ajustés aux requêtes natives
CAttackState. Upper conserve son clip en récupération au lieu de le rejouer.
Durée du clip partagé R0033 réparée dans le runtime et le stage : plus de NaN
de déplacement en récupération aérienne. Vrais rigs M/F×8caps×5états,
104 régressions, build et quatre captures du jeu principal réussis.
Preuve : `work/melee-batch-5/iron-boots-animation-speed.md`.
Déclenchement du dash, boost, terminal upper et autres limites demeurent ouverts.

3 octobre 2026. Raccordée dans le jeu principal en essais. Gate natif non prêt.

Raccordement : choix/inventaire, courbes et playback natif sur les cinq états
CAttackState, dash et boost (déplacement du boost reste à vérifier), combo trois coups,
maintien gauche upper, aérien trois contacts, droit boost (pas dash), sons/effets
authentifiés et deux rubans sur les vertices animés des pieds. Tests contrôleur
M/F, huit directions, contacts, SP/cooldown, changement d'arme ; 32/32 ciblés.
Suite complète1531/1535, les quatre échecs Breaker/Revolver préexistants conservés.
Contrat10/10 et build réussi. Journaux : `work/melee-batch-3/iron-boots/`.

Politiques arène explicites : combo soumis à la fin d'action de chaque coup ;
upper25SP et cooldown2s, boost cooldown5s ; maintien boost total non établi.
Le dash séparé et ses250SP n'ont pas de routage d'entrée natif établi.
Le terminal natif signé est confirmé (97DFA0/97F9A0/52732B), donc l'upper conserve
Y=+9 pendant l'action ; la récupération S5 revient au terminal ordinaire après
reset XYZ. Cette restauration de terminal est une reconstruction et ne prétend
pas résoudre le comportement natif de sortie de l'upper. Les sockets des quatre
effets boost manquent encore ; aucun effet n'est déplacé à l'origine acteur.
Rubans S5 : association1→droite/2→gauche et endpoints de maillage reconstruits,
fenêtres source conservées. Pas de certification du renderer GhostTrail.

## Sources et ressources

Item classique2000035, type43, puissance15, portée500, vitesse1.2 dans XBN actuel (ancien EU1.1). CRC/longueur/SHA : `work/melee-batch-3/iron-boots/source-manifest.json`. Fonctions exactes et attributs : `source-contract.json` et `tests/fixtures/native/iron-boots-source-contract.json`. Extraction/staging reproductibles : `extract_current.py`, `stage.mjs`. 67 sources authentifiées,58fichiers runtime incluant manifeste, modèle,20clips nouveaux par sexe, textures, cinq sons, icône actuelle et neuf séquences ; aucune dépendance manquante parmi les effets sélectionnés.

Icône `image/weapon/icon_iron_boots_nomal.png` copiée sans conversion. Aliases audio impact : `ironFirstHit`=smg3_hit, `ironSecondHit`=player_attack, `ironHit`=sword_attack. Les OGG actuels sont dans le dossier sons Iron avec bsword_counter/deathside_jump.

## Placement des bottes

Le SCN weapon ne contient que deux dummies. La géométrie réelle est dans `model/character/leg/ironboots_n_01_leg.scn` et `model/character/foot/ironboots_n_01_foot.scn`, skinnée aux os acteur bassin/cuisses/mollets/pieds/orteils. L'ancien stage ajoutait attachment=Bip01 Pelvis et un squelette enfant : double transformation. Le nouveau modèle conserve poids/matrices, omet attachment et marque weaponWearable=true. Le loader lie directement les poids aux os acteur existants et doit traiter weaponWearable comme arme pour le nettoyage/masquage.

XML type43 nomme L/R Calf avec le même sceneIndex0 ; cela ne justifie pas un second parent sur les pièces de vêtement. Texture réelle sous foot/ et leg/, pas directement character/. Les vêtements ordinaires peuvent recouvrir partiellement les bottes : vérifier visuellement avant de décider une suppression de pièces.

## Contrat d'animation et combat

NormalState_IRONBOOTS : IB000, boucle, vitesse1, fondu500ticks. RunState_IRONBOOTS haut/bas identiques : IB008 devant, IB009 gauche-devant, IB010 gauche, IB014 gauche-arrière, IB011 droite-devant, IB012 droite, IB015 droite-arrière, IB013 arrière, fondu1000ticks. Frontière latérale de présentation explicite comme Counter, sans inversion des commandes.

Les animations sont dans les porteurs actuels bip_male/male_bip_0000.scn et bip_female/female_bip_0000.scn, pas dans le principal male_bip. Deltas20clips directs par sexe, R0033 déjà présent. MoveBox extrait, pistes absentes marquées reconstruction zéro.

| Action | Clips action / récupération | Durées ms | Contacts normaux ms |
|---|---|---|---|
| light0 | IB001 / IB021 | 800 / 500 | 150,350 |
| light1 | ES001 / DC005 | 700 / 300 | 300 |
| light2 | DC002 / IB024 | 400 / 600 | 300 |
| strong | IB019 / aucun déclaré | 350 / 100 | 250 |
| air | IB002 / R0033 | 600 / 500 | 320,410,500 |
| dash, alias heavy | IB005 / IB006 | 800 / 1000 | 360,460,580 |
| boost | IB016 / R0033 | 200 / 0 | aucun |

Bindings actuels : left_attack=DashKick, left_weak=First, left_attack2/3=Second/Third, left_strong1=Upper, left_jump=Jump, right_attack=Boost. Le graphe exact des entrées n'est pas établi ; heavy alias dash est une présentation S5. Le quatrième coup est commenté/absent, non exposé. Les200ms boost ne prouvent pas une durée native totale du maintien.

Modules `src/iron-boots-data.js`, `iron-boots-motion-data.js` : définition, paramètres, contacts indépendants BOX/FAN/CYLINDER, courbes M/F, poses et chemins. Les critiques BOX du troisième coup et RAY du dash restent dans sourceContacts mais sont exclus par défaut, sans arbitration ou multiplicateur inventé. Le troisième argument40 de InitLua n'ajoute pas une phase.

Anomalie actuelle conservée : attackattribindexer2337/2349 réaffecte FIRST/SECOND aux types SMG3/REVOLVER2 avec effets gun, contre désactivé, guard1000/crush ; leurs données sont conservées et testées. THIRD seul contrable ; OBJECT_BLAST/DASH/UPPER non contrables. Priorité native des tables non établie.

## Effets et limites

`iron-boots-effects.js` : loader, ironBootsStateCues(attack,{sex}), sons, fenêtres de traînée. Passer le sexe pour strong. Neuf séquences disponibles : strong M/F, air, dash, boost00/01, Counter upper et impacts actuels weapon_smashgun_hit_gold/gun_hit4_gold. Noms BMP résolus vers les DDS actuels de même nom.

Boost possède quatre cues50ms sur L/R_boo_Dummy01/02 ; sockets absents des pièces classiques/delta, cues séparées sans les placer artificiellement à l'origine. Traînées déclarées mais runtime géométrique à raccorder. Première attaque trail2=600..600 conservé. Troisième coup AddSequence son à quatre arguments inhabituel, déclenchement non inventé. Voix non fermées dans ce lot ; les deux effets d'impact gun réaffectés ont ensuite été récupérés avec modèle/textures.

Strong IB019 sans DELAY : maintien recovery approximation déclarée. SetDrop positif [0,1500,10] à1ms nécessite un traitement explicite. L'analyse statique 97DFA0/97F9A0 et physique52732B montre une borne signée sans filtre : après reset recovery une borne positive peut réaccélérer vers le haut tant qu'elle n'est pas restaurée. Tout garde-fou S5 négatif-only est une reconstruction, pas une preuve native. Air SetDrop320 [0,-9600,100]. SP25/250 et cooldowns2000/5000 sont des paramètres source, leur consommation en jeu reste à raccorder.

## Vérification

`node --test tests/iron-boots-data.test.mjs` :6/6. Contrats, dégâts/activations, attributs, SHA/fermeture, volumes dans8orientations, vrai loadAvatar/mixer M/F au repos, huit marches, toutes actions/récupérations et retour repos. Les vrais sommets des pieds restent sous le bassin au repos et proches des os de jambe après animation. Mesures `work/melee-batch-3/iron-boots/post-mixer-measurements.json`.

Raccordement S5 réalisé : sélection/inventaire, trois frappes, upper, aérien et boost, contacts, effets/audio/traînées et nettoyage au changement. Tests ciblés :32/32 ; suite complète :1531/1535, les quatre échecs préexistants restent séparés dans `work/melee-batch-3/iron-boots/full-regressions.tap`. Build réussi et contrat10/10. Captures principales disponibles pour repos homme, marche femme et upper femme ; couverture visuelle encore incomplète.

Politiques S5 encore non certifiées : enchaînement gauche au terme de l'action, maintien de la pose IB019 en récupération et restauration de la borne verticale en récupération, consommation SP25 de l'upper, cooldowns2000/5000 et durée finie du boost. Le dash déclaré n'est pas routé faute de condition d'entrée démontrée. Les tests numériques ne valent pas comparaison S5Runtime ; gate natif conservé non prêt.

Complément visuel principal, lot4 : female idle IB000, male front IB008,
male light IB001 avec contact (95.5PV adverses), female boost IB016 sans
contact (100PV). Captures `work/melee-batch-4/visual/boots-*` ; aucune erreur
navigateur relevée pendant le boost. Elles complètent les observations
précédentes, sans valider les sockets boost manquants, les huit vues ni tous
les coups dans les deux sexes. Régressions Iron Boots incluses dans les
211tests du passage SECOND_IMPACT ; build partagé réussi.
## Impacts décor corrigés — 4 octobre2026

Les deux premiers coups ont maintenant leurs séquences et sons décor source,
distincts de l'impact cible : weapon_smashgun_hit_wall_gold/smg3_wall_hit,
gun_hit_gold/wall_attack. Ressources actuelles et dépendances authentifiées,
modèle animé et particules raccordés, manifest public actualisé.67 tests
ciblés/régressions et build passent. Premier impact observé sur un mur réel
dans le jeu principal, M/F ; deuxième également observé M/F via le vrai
combo, ES001 à340ms, temps global1.14s, impact jaune sur la face du mur.
SetPlaySound(false) respecté sur le dash.
Preuve : `work/melee-batch-5/iron-boots-surface.md`.
Probe de collision décor et offset restent S5, placement/mixage natifs non
certifiés. Aucun gate ni statut prêt modifié.

Scénario reproductible ajouté : action=surface-combo. Relevés et captures
dans `work/melee-batch-5/iron-boots-second-surface-visual.json` et `visual/`.
10 tests Iron Boots passent à nouveau, build réussi. Les quatre sockets
L/R_boo_Dummy01/02 demandés par ANI_IRONBOOTS_Boost_Dash_Attack_Normal
sont toujours absents du modèle runtime ; leur placement reste à établir.

## Boost : sockets absents de la variante actuelle — 4 octobre2026

Trois recherches distinctes : modèles weapon/leg/foot actuels parsés jusqu'à
EOF avec SHA authentifiés ; porteurs M/F actuels ; ancienne variante extraite
des archives actuelles avec CRC/longueur/SHA. Les deux premières ne contiennent
aucun boo_Dummy. L'ancienne foot/ironboots_01_foot.scn en contient six :
gauche sous L Foot, droite sous R Calf. Le Lua normal demande quatre de ces
noms, mais la variante n_01 ne les contient pas. Aucun transfert des matrices
de l'ancienne variante ni substitution du modèle. Blocage limité au placement
du boost ; reprise avec sockets/transforms de la variante actuelle ou preuve
native du rattachement alternatif. Preuve reproductible :
`work/melee-batch-3/iron-boots/probe-original-sockets.mjs` ; résultats
`work/melee-batch-5/iron-boots-original-sockets.json`.

Préparation reproductible corrigée : l'extracteur surface sans arguments
extrait aussi toutes les dépendances, et le stage habituel exige ces SHA
avant écriture puis lance le complément automatiquement. Exécution complète
vérifiée, onze définitions conservées, 10/10 tests. Six JSON historiques
diffèrent seulement par nativeSubstructure.entries=[] (métadonnée vide du
parseur), sans modification des données runtime ; hashes manifest cohérents.
Journaux/proof : `work/melee-batch-5/iron-boots-stage-reproduction.json`,
`iron-boots-stage-reproduction.log`, `iron-boots-stage-tests.tap`.


25 octobre2026 — poussées simples raccordées au moteur de déplacement source
commun, avec leurs durées/accélérations propres, sans lift arbitraire. Pour
Iron Boots léger2, DamageData0 conserve désormais l’attaque et les clocks
de réaction en cours tout en appliquant le recul. Les contacts mixtes gardent
leur politique antérieure non certifiée. Lot commun498 contrôles et build :
[rapport](../../work/melee-pvp-comparison-20261017/capture-expansion-v2/source-melee-push-batch-20261025/REPORT.md).
Aucune qualification native complète ni nouveau statut prêt.

25 octobre2026 — premier combo/contact2 : Blow(0,0) puis Push sont conserves
independamment ; la vitesse verticale generique3 est supprimee. La reaction
utilise la politique Blow S5 existante, dont la duree/phases reste non certifiee.
151 controles en lot et build26s : [rapport](../../work/melee-pvp-comparison-20261017/capture-expansion-v2/iron-boots-mixed-condition-20261025/REPORT.md).
Le deuxieme combo DamageData0+Push reste distinct et conserve l’attaque adverse.

25 octobre2026 — le chemin Blow vivant en Deathmatch dispose désormais de
phases séparées (début, attente du sol, fin, Down, Standup), avec intentions de
relevé pour les deux rôles. Dans le jeu principal masculin, le léger laisse88HP
et sélectionne00021 à1,8s puis00035 à2,8s. Contact physique S5 explicite,
collisions murales/Bound et minimum natif non qualifiés. Voir le
[rapport de cycle](../../work/melee-pvp-comparison-20261017/capture-expansion-v2/blow-lifecycle-integration-20261025/REPORT.md).
