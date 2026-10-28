# Demonic Knuckle — Demon’s Fist

28 octobre2026 — choix F · Flame ajouté par attaque, couleur réglable et option globale
Keep flames active hors attaque, sauvegardés dans inventaire/Échap/paramètres.
Effets/impacts/audio existants conservés ; ancrages post-mixer, limites et
preuves groupées : `work/weapon-flames-all-20261028/README.md`.

27 octobre2026 — trois directions artistiques propres à cette arme, déclinées
par attaque et sélectionnables dans l'inventaire. Géométries distinctes ;
séquences structurelles, particules d'impact et audio existants conservés.
Mécaniques et gates natifs inchangés. Sources, ancrages et contrôles :
[lot artistique](../../work/melee-art-expansion-20261027/README.md).

26 octobre 2026 — les deux traînées acteur héritent maintenant du brouillard
de la carte, conformément au FogEnable=true du producteur XML commun type47.
Préparation séparée none/linear/exp2, sans avancée des historiques vivants.
Aucune attache n'est rouverte par ce changement. Paramètres/pixels natifs et
seconde passe restent ouverts. [Lot](../../work/weapon-polish-20261025/melee-trail-fog/README.md).

## Point de reprise — 26 octobre 2026

Le défaut signalé d'attache du gant droit a été corrigé le 25 octobre : le
body est directement rattaché à l'avant-bras, conformément aux quatre matrices
capturées. Correction active dans `equipment-hierarchy.js`, tests dans
`demonic-knuckle-native-link.test.mjs`, livraison dans
`attachment-native-v6/HANDOFF.md`. Ce défaut n'est pas une tâche ouverte.
Les anciennes conclusions « bras mal placé reste non corrigé » conservées
dans les analyses antérieures sont dépassées pour ce raccordement précis.

Le 26 octobre, l'utilisateur a rappelé de ne pas rouvrir cette correction sans
nouveau défaut constaté. Les comparaisons de clips, surfaces et pixels encore
incomplètes sont des validations distinctes ; leur absence ne démontre pas une
régression d'attache. Le relevé supplémentaire de sous-arbre n'a livré aucun
changement runtime et ne justifie pas de repartir sur le placement corrigé.

26 octobre 2026 — les particules des griffures suivies naissent désormais après
le mixer de leur propriétaire en combat. L'update réserve leur nombre, puis le
passage post-pose utilise le repère courant ; les particules monde déjà émises
gardent leur trajectoire. Le cycle réel Training/Chaser/Battle Royal est vérifié
avec la griffure droite et les vrais avatars féminins. Les espaces source et
les politiques de suivi restent ceux déjà qualifiés. Lot commun 57 contrôles
et un build ; comparaison visuelle native complète toujours ouverte.
[Preuves](../../work/weapon-polish-20261025/melee-post-pose-emission/README.md).

26 octobre 2026 — le son `bsword_s` des volumes primaire et secondaire
est raccordé à leur activation, séparément de la voix d'état et du son de
contact. L'attribut aérien déclare un son vide et reste silencieux à cet
endroit. Le fichier existant concorde avec le pack fourni ; 63 tests et build.
[Preuve](../../work/weapon-polish-20261025/demonic-activation-audio/README.md).
Écoute et spatialisation comparatives restent ouvertes.

26 octobre 2026 — lorsqu'une protection bloque une condition pendant que le
personnage réagit déjà, un coup de mêlée accepté affiche désormais son impact
sans interrompre son animation ni ajouter de pause. Cas Bat → Demonic testé
via la réception et le résolveur du jeu ; autres règles de protection non
modifiées. [Preuve](../../work/weapon-polish-20261025/melee-retained-impact/README.md).

26 octobre 2026 — les deux traînées acteur utilisent le contrôleur GhostTrail
commun (profil XML 200/50/50/100), les formes Line01 et deux horloges
indépendantes. Les deux attaches évaluées après mixer, leur texture et le
mélange additif sont conservés ; arrêt progressif à la sortie et nettoyage
au changement/interruption. Raccordement joueur/adversaire et préchauffage
réutilisent les chemins existants. Les limites de comparaison visuelle, de
matrice native et de seconde passe demeurent ouvertes.
[Preuves](../../work/weapon-polish-20261025/demonic-native-trails/README.md).

26 octobre 2026 — le modèle lumineux du secondaire évalue maintenant ses deux
dummies source, auparavant omis, et leurs pistes de position/échelle. Source
locale et pack décodé identiques ; racine et 13 émetteurs de main conservés.
56 contrôles groupés, un build et une observation principale KN024 à 720 ms.
Attache externe et comparaison visuelle native restent ouvertes.
[Lot](../../work/weapon-polish-20261025/melee-secondary-hierarchy/README.md).

26 octobre 2026 — sons et séquences d'état déclenchés strictement après leur
seuil, avec horloge ms/s cohérente. Griffure droite KN012 à 80 ms et effet
aérien KN023 à 680 ms observés dans le jeu principal, sans erreur de console.
68 contrôles groupés et un build ; rendu comparatif complet encore ouvert.
[Lot](../../work/weapon-polish-20261025/melee-event-clock-batch/README.md).

26 octobre 2026 — raccordement du suivi de racine des deux griffures KN011/KN012
et de l'effet aérien KN013 : la scène évaluée du personnage porte désormais
les trois séquences, avec son échelle. Les parents internes du dummy aérien
restent distincts ; le secondaire conserve sa racine fixe et son suivi d'os.
52 relevés externes et 36 internes issus de la capture du 25 octobre étayent
ce périmètre. 27 régressions groupées et un build réussis. La capture principale
KN012 à 250 ms ne suffit pas à valider visuellement chaque composant ; rendu
complet et comparaison visuelle restent ouverts.
[Bilan du lot](../../work/weapon-polish-20261025/melee-root-follow-batch/README.md).

25 octobre 2026 — les 26 inserts renderState1 des deux gants utilisent
maintenant le matériau source sans éclairage. Les 30 autres pièces conservent
leur présentation ; ombres/contours des inserts opaques préservés. Assets,
poids et attaches intacts. 28 régressions groupées passent ; rendu KN011 à10ms
observé dans le jeu principal. Pas de comparaison de pixels native revendiquée.
[Preuves et suivi du build](../../work/weapon-polish-20261025/demonic-equipped-materials/README.md).

25 octobre2026 — le recalage après pose prend désormais en compte le suivi
des os seuls du secondaire. Les treize émetteurs de main sont recalés après
le mixer et l'interpolation finale, en gardant la racine fixe et les particules
existantes. Préparation GPU sans visibilité du pool,46 tests et un build commun :
`work/weapon-polish-20261025/effect-presentation-batch/README.md`.
Observation principale KN014 à310ms : énergie visible près de la main ;
comparaison au Jeu référence et autres limites natives toujours ouvertes.

25 octobre2026 — les deux rubans utilisent désormais le mélange additif
déclaré type47/scènes0–1, plutôt que le mélange normal hérité. Lot commun,
33 contrôles et un build :
`work/weapon-polish-20261025/ironboots-dark-panels/README.md`.
Les autres limites de reconstruction et de rendu restent ouvertes.

25 octobre2026 — la scène `demonic_claw_02` est désormais incluse avec les
pièces homonymes conservées par index ; cette suite remplace son exclusion
ci-dessous. Bilan : `work/weapon-polish-20261025/indexed-melee-effects/README.md`.

25 octobre2026 — parents et pistes internes restaurés sur `demonic_claw_01`
et `demonic_kn013_eff_01`, sans toucher au lourd kn014 déjà corrigé.
Lot partagé : `work/weapon-polish-20261025/melee-effect-hierarchy-batch/README.md`.
La scène claw02 à noms dupliqués est exclue de ce consommateur, pas fusionnée.

25 octobre2026 — adversaire Free training exposé avec les deux traînées de
gant existantes, préparées avant combat. Nouveau préchauffage GPU des deux
maillages aussi utilisé côté joueur. Lot groupé :
`work/weapon-polish-20261025/melee-opponent-batch/README.md`. Limites maintenues.

25 octobre2026 — durées de traînées : les aériennes gauche/droite50+400 et
50+1000 et le coup light2 à50+300 ne sont plus coupés à400/1000/300ms depuis
l'entrée. Même correction délai+durée que pour Iron Boots, entrée stricte,
aucune modification de la main sélectionnée ou des attaches. Lot commun :
`work/weapon-polish-20261025/dual-trail-duration-fix/`. Le renderer et la cadence
nominale restent des reconstructions déclarées ; pas de fidélité globale revendiquée.

## Gant droit : correction depuis la capture native, 25 octobre2026

La capturev6 obtient les deux attaches sur les deux personnages après les
gates réels du laboratoire. Le body_Dummy droit est directement sous
`Bip01 R Forearm`, alors que S5 conservait `Cs_Wea_Dummy` entre les deux.
Cet ancêtre supplémentaire ajoutait environ90° et18,725unités natives de
décalage. Le gauche garde BONESYSTEM sous `Bip01 L Forearm` et correspond.

`src/equipment-hierarchy.js` rattache désormais uniquement le body_Dummy du
fichier `demonic_knuckle_r_01.scn` au support d'avant-bras. Ses courbes locales,
les descendants, les données de skin et tous les assets restent intacts.
Aucune rotation ajustée à la main ni inverse globale n'est appliquée.
L'autre scène et les autres familles ne changent pas.

Le relevé après correction concorde avec les quatre matrices natives
relatives : erreur maximale droite2,10e-4unité native, gauche à l'arrondi.
Fixture portable `tests/fixtures/native/demonic-knuckle-link-v6.json` ;
preuve et association source/socket :
`work/weapon-polish-20261025/attachment-native-v6/HANDOFF.md`.
L'ancien comparateur qui exigeait une racine SCN dans la chaîne refuse à
raison ces données : les roots d'origine sont détachés. Le nouveau relevé
conserve cette limite et associe les scènes par socket XML unique et fichiers
SCN du catalogue observés ; aucun root fictif n'est ajouté.

37tests du correctif et des consommateurs Demonic passent ; 51régressions
de hiérarchie et des autres familles passent, notamment Plasma/Spy/Counter.
Build commun réussi. Le nouveau test reproduisait le parent supplémentaire
sur M/F, puis contrôle après mixer repos, huit directions, actions et retour,
ainsi que la concordance aux mesures natives au repos source échantillonné.
Rapports `demonic-native-link-tests.tap`, `equipment-regressions.tap` et
`build-receipt.json` dans `work/weapon-polish-20261025/`.

Contrôle principal : reposKN000, marcheKN001 et primaireKN011 observés dans
le jeu principal chez la femme comme chez l'homme, avec gants cohérents après
évaluation de pose. Les six captures ont été reprises le25octobre, sans
modifier la production ; le reçu distingue leur URL, readout et empreinte.
Cela vérifie ce périmètre visuel S5, pas une parité de pixels ou de déformation
avec le Jeu référence. Preuves et limite de fermeture de l'onglet de contrôle :
`work/weapon-polish-20261025/attachment-native-v6/browser/HANDOFF.md`.

Limites : les IDs de clips natifs ne sont pas certifiés, les relectures ne
sont pas atomiques et les surfaces skinnées/pixels ne sont pas comparés
numériquement. B92B20 ne suffit pas à expliquer le parent final observé :
une étape aval reste non localisée. Ce correctif est fondé sur l'observation
type47 M/F ; aucune généralisation aux autres liens ou certification de
l'arme entière. La conclusion statique antérieure en fin de fiche est
supersédée sur l'existence du décalage droit par cette capture.

4 octobre2026, complément supérieur : primaire ajusté à la durée native
demandée500. KN011/KN012 utilisent speed1.732/1.798, au lieu1, avec la
conversion native float32 puis millisecondes entières. Contact240 et sortie
stricte500 préservés ; deux mains observées M/F ;105 tests et build réussis.
Preuve : `work/melee-batch-5/demonic-upper-speed.md`. Blending/reset et
scheduling global restent à établir ; cette preuve remplace l'ancienne
incertitude sur le fitting supérieur du primaire uniquement.

4 octobre2026 : marche inférieure du primaire corrigée. Le constructeur
natif active le flag attaque et applique le rapport1100/915 ; S5 utilisait1.
Calcul partagé avec Sigma, sélection depuis la commande plutôt que la vitesse
résiduelle, seuil strict50 et repos conservés. Vrais avatars M/F×8caps testés,
observation principale M/F,103 tests et build réussis. Preuve/limites :
`work/melee-batch-5/demonic-lower-speed.md`. Blending et fitting supérieur
restent distincts de cette correction ; statut essais conservé.

3 octobre 2026. **Sélectionnable dans le jeu principal en essais, non prête native. 38 tests dédiés et 253 régressions ciblées passent ; build réussi. Repos, marche et attaques observés sur les deux corps.**

Item2000036 «Demon’s Fist», type47, parent2000038 «Metallic Fist». Ce n’est pas une famille déduite de scripts isolés : item.x7, XBN weapon.xml, sept bindings propres dans weapon_lua.x7 et deux attaches sont présents et authentifiés depuis les archives copiées actuelles. Variante2000064 «Curious Cat Claw» identifiée mais hors import présent. Preuve détaillée : `work/melee-batch-5/demonic-knuckle/active-family-proof.json` et `source-manifest.json`.

`weapon_init.lua:49` requiert `_weapon_demonicknuckle_atk.lua`, `actorstates_gameplay.lua:25` requiert `_weapon_demonicknuckle_ani.lua`. `weapon_demonicknuckle_atk_2.lua` possède des fonctions homonymes et des valeurs différentes ; il est archivé dans la preuve mais exclu de l’adaptateur car non requis par cette chaîne. Exemple : déplacement attaque1 vaut1.2 dans le fichier requis,0.9 dans l’alternative. Power XBN10 ; ancien `_eu_weapon`15 conservé comme divergence, sans fusion silencieuse.

| État | Source retenue / comportement déclaré |
| --- | --- |
| Repos | NormalState : KN000, boucle, vitesse1, blend1000ticks |
| Marche | RunState upper et lower explicites : KN001/002/003/007/006/008/005/004, ordre avant→gauche→arrière→droite |
| Primaire | CAttackMovingState durée de factory500ms ; InitLua800/50/0/false distinct. MoveBox×2, déplacement1.2 ; contact240ms,9dégâts. Première entrée KN011 gauche puis KN012 droite, alternance persistante ; lower E0008..E0015/reposA0024 après seuil strict50ms |
| État primaire2 | InitLua800/50/0/false, contact180ms,9dégâts, KN012. **Commentaire source : coquille inutilisée ; pas ajouté à un combo** |
| Aérien | KN013 puisKN023, InitLua550/550/40/false ; drop400ms vecteur[0,-4000,0], cooldown1500 ; FAN550ms,8dégâts, stun[1200,1600,0,500] |
| Secondaire | KN014 puisKN024, InitLua700/800/40/true ; SP minimum/dépense40, cooldown4000, immunité1500, défense+.2 ; Box700ms28.8+AdditionalPower. Rayon simultané AlwaysCritical700ms18, conservé séparément |

Le secondaire réduit d’abord range de200 et multiplie Power par1.8 ; le multiplicateur1.6 du contact boîte s’applique ensuite. Aucun facteur critique supplémentaire inventé. Le rayon critique reste exclu du profil normal par défaut, accessible avec `includeDeclaredCritical:true` et `geometrySupported:false`.

Code : `src/demonic-knuckle-data.js` fournit définition, paramètres, contacts, profils avec choix explicite de main, ressources et limites. `src/demonic-knuckle-motion-data.js` fournit durées/courbes directes. `src/demonic-knuckle-effects.js` fournit chargement des définitions, événements VFX/audio et fenêtres de traînées. Les événements légers exigent la main retenue : `SetOnlyOneSequence/SetOnlyOneGhostTrail` interdit d’afficher implicitement les deux mains.

`src/demonic-knuckle-moving-state.js` porte l’entrée/tick/annulation natifs du primaire. Conserver `createDemonicKnuckleHandState()` par acteur/famille, puis appeler `beginDemonicKnuckleLight` à chaque entrée effective et transmettre sa main au profil. Le compteur est incrémenté avant sélection : index initial0→1gauche→0droite. Une entrée annulée compte aussi ; Exit ne remet pas l’index à zéro. Le tick incrémente les horloges indépendantes, déclenche lower seulement `elapsed>50`, et demande la sortie seulement `elapsed>500` en laissant les contacts du tick s’exécuter. Le reset du compteur correspond à une nouvelle instance, pas au changement d’arme.

Raccordement des animations : arguments source upper `[0,50,0,false,1,true]`, lower marche `[800,500,500,true,1,false]`, lower repos `[0,500,300,true,1,true]`, conservés dans `sourceAnimationArguments`. La durée de factory500 est `actionMs` ;800 du Lua est `nativeSceneParameterMs`, pas une durée de vie d’état. Conserver les channels séparés et le seuil strict50 ; aucune durée/fade ne doit être substituée à l’autre par simple égalité de nom.

Le Controller raccordé conserve `demonicKnuckleHand` et `demonicKnuckleCooldowns` après changement d’arme. Chaque primaire crée son `demonicLight` avec la politique d’horloge fractionnaire S5 et la main native alternée. Les gestes S5 actuels : gauche court ou long au sol→primaire, gauche en l’air→aérien, droite au sol→secondaire ; aucun état primaire2/strong inventé. Cette correspondance de gestes et le départ des cooldowns à l’entrée sont des politiques S5 encore distinctes d’une preuve des handlers natifs. Les valeurs1500/4000 et la dépense40 viennent du Lua. Les contacts du rayon critique restent exclus, pas remplacés par un multiplicateur arbitraire.

Physique de récupération désormais établie pour l’aérien et le secondaire : les factories natives `82a9c0` (appel `82b000`) et `82b090` (appel `82b240`) passent toutes deux par `5e3240`, la même classe CAttackCounter. La remise à zéro XYZ de l’entrée de récupération (`5e56b1..5e56ee`) s’applique donc aux deux profils. Le Controller la déclenche une seule fois au changement de phase ; la gravité continue ensuite, sans restaurer chaque tick l’ancienne vitesse de drop. Le test aérien M/F atteintKN023, élimine une vitesse héritéeXYZ non nulle, puis constate une gravité cumulée au tick suivant. Cette preuve ne certifie pas les autres politiques de cooldown/entrée mentionnées ci-dessus.

`public/assets/s5runtime/demonic-knuckle/` contient43fichiers, dont le manifeste et la texture dédiée des traînées : deux scènes dans model.json, quinze clips nouveaux par sexe, icône exacte, septOGG, cinq séquences avec leurs textures et modèles. Aucune dépendance de conversion manquante. Porteur KN : `model/character/bip_{sex}/{sex}_bip_0000.scn` ; les clips existants ne sont pas réécrits. Les sources associent scène0 à `Bip01 R Forearm` link0 et scène1 à `Bip01 L Forearm` link1. Les dummies du modèle sont respectivement `Cs_Wea_Dummy` et `Counter_Sword_Dummy` ; leur alignement exact n’est pas encore certifié.

Limites bloquant l’annonce «prête» :

- Entrée, alternance, durée de factory et phase lower du primaire sont décodées et raccordées par le helper persistant. L’ajustement exact de la lecture d’animation au champ de scène800 reste distinct et non certifié. Le primaire2 inutilisé n’hérite pas automatiquement de la preuve de durée du primaire1.
- Coût SP40 et cooldowns1500/4000 sont raccordés et testés ; origine exacte des cooldowns et gestes natifs restent à établir. Les conditions explicites sont filtrées par l’immunité native ; le mapping des réactions ordinaires n’est pas encore résolu. La défense native des composantes0/1 est livrée en helper, sans application arbitraire aux HP S5. Arbitration du rayon critique et de la boîte non établie.
- Repos, marche et attaques sont observés M/F ; les huit directions et l’attache après mixer sont testées. Cela ne certifie pas le grip ni la comparaison visuelle S5Runtime. Les traînées utilisent les deux Line01 et la texture source, mais le rendu du ruban et sa durée de vie120ms restent S5.

Tests `tests/demonic-knuckle-data.test.mjs` :7/7. Identité/bindings et choix du script ; locomotion explicite ; dégâts/conditions/volumes dans8caps ; helper natif→main/profil/effet après interruption ; SHA et fermeture des dépendances ; **chargement standard** des vrais avatars M/F (sans override de modèle/delta) et évaluation des clips. `tests/demonic-knuckle-moving-state.test.mjs` :4/4, première main/alternance, seuils stricts50/500, pauses indépendantes, différents ticks. Preuve native : `work/melee-batch-5/demonic-knuckle/native/README.md`.

`tests/demonic-knuckle-gameplay.test.mjs` :14/14 sur vrai Controller/MotionGraph : deux sexes, huit directions à deux caps, reposKN000, upper/lower de marche et primaire mobile ; seuils stricts50/240/500 ; gauche puis droite après fin, interruption réelle de combat et changement d’arme ; reset nouvelle instance ; `TrainingCombat.resolve/receive` et CombatState réels, deux cibles par huit caps,9PV chacune et suppression des contacts répétés ; secondaire SP40, contacts700/550 et gates1500/4000 conservés au switch ; aucun contact tardif après changement ; resetXYZ unique à l’entréeKN023 et gravité poursuivie. Le passage combiné précédent données+gameplay avait réussi19/19 ; le nouveau passage gameplay complet réussit14/14. Ces assertions ne remplacent pas les captures, le grip animé ou une comparaison visuelle S5Runtime.

Préparation reproductible : `extract_current.py`, `build_source.py`, `stage.mjs` dans le dossier de preuve. L’intégrateur garde les fichiers partagés, captures, régressions et build final.

## Immunité et preuves principales du raccordement

`demonic-knuckle-protection.js` porte la condition native0x800 : elle expire strictement après1500ms, sans rafraîchissement à une nouvelle entrée tant qu’elle existe. Sa durée est indépendante de l’attaque et du changement d’arme. Le Controller avance son horloge ; TrainingCombat l’avance aussi pendant les réactions et pauses de l’arène lorsque Controller.step n’est pas exécuté. L’ordre exact de cette horloge fractionnaire S5 vis-à-vis du hitstop natif reste à comparer.

Le résolveur refuse les nouvelles conditions explicites stun/blow/push et le stun renvoyé par la garde, tout en recevant les dégâts HP. Une condition refusée n’efface pas une réaction existante. La réaction ordinaire provisoire de l’arène peut encore interrompre le secondaire : le mapping natif du record+40 est le prochain blocage, pas une immunité HP à inventer. La défense est remise à zéro en sortie d’attaque ; son calcul natif sur deux composantes est livré mais leur correspondance avec nos HP n’est pas certifiée. Preuves : `work/melee-batch-5/demonic-knuckle/native-defense/README.md`.

38 tests dédiés couvrent données7, état Moving4, gameplay14, traînées4, protection native4 et protection raccordée5. Après les derniers changements : **253/253 régressions ciblées**, `batch-regressions.tap`, et **build réussi**, `build.log`. Contrat central11/11 ; ses gates natifs restent fermés. Aucun résultat de suite globale complète n’est revendiqué.

Captures principales dans `work/melee-batch-5/visual/knuckle-*` : M/F reposKN000 ; homme marcheKN001 et femme arrière-gaucheKN008 ; gaucheKN011 (HP91), second primaire droiteKN012 (HP82), homme secondaireKN014 puis femmeKN024 (HP71.2), femme aérienKN023 (HP92/stun). Les événements de séquence sont visibles. Le son est raccordé et ses fichiers sont présents ; aucune écoute S5Runtime directe n’est revendiquée. Un import manquant transitoire dans TrainingCombat a été détecté et corrigé pendant le raccordement ; le scénario d’alternance a été rejoué dans un onglet neuf pour distinguer cette erreur historique du code final.
# Mise à jour : aérien et secondaire, 4 octobre 2026

Les demandes natives de durée sont raccordées aux phases action/récupération : KN013/KN023550ms, KN014700ms, KN024800ms avec override Lua800. Le haut et le MoveBox utilisent la même vitesse calculée ; l'ancien speed1 ne lisait que le début du mouvement lourd. KN024 conserve speed1 par son override explicite. Preuve : `work/melee-batch-5/demonic-action-speed.md` et probe PE authentifié.107 tests ciblés passent, build réussi ; six observations/captures dans le jeu principal couvrent les deux sexes, lourd/aérien300ms et récupération lourde900ms. L'horloge globale, les fondus, l'intégration physique et les effets restent à distinguer du fitting établi. L'arme reste en essais.

## Secondaire : suivi des émetteurs de main — 24 octobre 2026

`ANI_RightAttack_DemonicKnuckle`, dans le Lua conservé
`work/melee-batch-5/demonic-knuckle/source/script/_weapon_demonicknuckle_ani.lua:300`,
déclenche `demonic_kn014_eff_01.seq`. La séquence publiée contient treize
émetteurs liés à `R_Hand_Dummy`, dont certains commencent à200 ou300ms, et
des nœuds sans os. L'ancien `follow:false` figeait aussi les matrices des os
au déclenchement : les émissions différées restaient au poignet initial.
La reproduction CPU sur les vrais Controller, MotionGraph et avatars M/F
mesure à310ms un écart de1,937109 unité scène entre l'émetteur et le poignet
courant. Script conservé :
`work/melee-batch-5/demonic-knuckle/effect-hand-follow-repro-20261024.mjs`.
Ce script documente le comportement antérieur, pas un test du correctif.

Le cue du secondaire demande désormais `followBones:true`, indépendamment
de `follow:false` : les os nommés doivent suivre la pose évaluée, tandis que
le root et les nœuds sans os gardent le placement initial. Les positions,
vitesses, âges et indicateurs d'espace des particules vivantes ne sont pas
réinitialisés ; les émetteurs concernés conservent leur `native['54']=1`.
Primaire et aérien gardent leurs cues précédents. Les coups, leurs contacts,
la dépense SP et les ressources source ne changent pas.

`tests/demonic-knuckle-effect-follow.test.mjs` contrôle les vrais
avatars M/F, les matrices après mixer, les émissions différées avec la vraie
classe Particles, la conservation des particules, le root fixe et le
nettoyage/réemploi d'une séquence. Les trois tests dédiés et les régressions
données, traînées, gameplay, Moving et protection passent : **41/41 tests**,
zéro échec. Journal :
`work/melee-batch-5/demonic-knuckle/effect-hand-follow-tests-20261024.tap`.
Aucun build propre à ce sous-lot ; compilation commune laissée à l'intégrateur.
Ces contrôles CPU ne prouvent ni le rendu GPU/pixels, ni une comparaison
visuelle en partie au Jeu référence ; cette vérification reste ouverte.
Le statut essais et les gates natifs restent inchangés.


## Attache type47 : consommateurs link0/link1 établis,25octobre2026

Le nouveau point d’entréeB94F50 lit le recordXML56octets et dispatch le champ link+1C :0→B92B20,1→B933E0,2→B92F80. Droite/link0 déplace le premier nœud contenantWea_Dummy, iciCs_Wea_Dummy, vers idleAttach ; attackAttach est mémorisé séparément, les deux étantBip01 R Forearm pour ce type. Gauche/link1 déplace tous les enfants directs de la racineSCN, iciBONESYSTEM, versBip01 L Forearm. AddChild flag0 ajoute à la liste, SetParent1155C20 écrit uniquement+8C ; aucune inverse(dummy) ni rotation normalisée n’est produite.

B95600 enregistre récursivement les nœuds ayant des animateurs dans le contrôleur fourni ; ce n’est pas un rebind de skin.46nœuds animés de chaque scène sont dans le sous-arbre déplacé. Le BONESYSTEM droit, présent comme ancêtre supplémentaire dans S5, est exactement identité/sans animateurs : cette seule différence de topologie est neutre. Le périmètre gauche est déjà conservé entier. **Aucun défaut de transformation supplémentaire n’est prouvé par ce switch ; aucun patch actif n’est livré et le défaut visuel reste ouvert.**

[Preuve bornée14fonctions, conditions et bilan](../../work/weapon-polish-20261025/type47-link-source/HANDOFF.md). Aucun processus natif, asset modifié ou build séparé. La reprise discriminante porte sur le consommateur des canaux/clips/fallbacks des nœuds enregistrés, les surfaces pondérées, ou des poses natives comparables des deux sockets ; ne pas relancer les inverses de dummies rejetées. Plasma/Spy/Counter restent hors corrections.
