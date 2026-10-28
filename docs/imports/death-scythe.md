# Death Scythe — lot mêlée du 3 octobre 2026

28 octobre2026 — choix F · Flame ajouté par attaque, couleur réglable et option globale
Keep flames active hors attaque, sauvegardés dans inventaire/Échap/paramètres.
Effets/impacts/audio existants conservés ; ancrages post-mixer, limites et
preuves groupées : `work/weapon-flames-all-20261028/README.md`.

27 octobre2026 — trois directions artistiques propres à cette arme, déclinées
par attaque et sélectionnables dans l'inventaire. Géométries distinctes ;
séquences structurelles, particules d'impact et audio existants conservés.
Mécaniques et gates natifs inchangés. Sources, ancrages et contrôles :
[lot artistique](../../work/melee-art-expansion-20261027/README.md).

26 octobre 2026 — le son `sword_s` de `SetAttackSequence` est désormais
émis pour chaque volume d'attaque activé, séparément des sons d'état et des
sons d'impact. La ressource existante est préparée avec la banque d'arme ;
le payload conserve le bon index même après sortie de l'état. Régression et
limites : `work/weapon-polish-20261025/melee-activation-audio/README.md`.
L'écoute et la comparaison au Jeu référence restent à faire.

26 octobre 2026 — les quatre couches depthWrite du lourd ne sont plus
dessinées pendant leurs fenêtres d'alpha nul. Animations et parentage restent
évalués ; réactivation à alpha positif. Pistes confirmées dans le pack,
54 contrôles groupés et un build ; lourd GR004_1 à 240 ms observé dans le jeu
principal. [Lot](../../work/weapon-polish-20261025/melee-zero-draw-batch/README.md).

26 octobre 2026 — événements d'état visuels/sonores : seuil strict et horloge
ms/s harmonisés, appels identiques de la source conservés séparément.
68 contrôles groupés et un build ; pas de nouvelle certification de la
finition spéciale. [Lot](../../work/weapon-polish-20261025/melee-event-clock-batch/README.md).

25 octobre 2026 — modèle auxiliaire `deathscythe_unique` masqué sans cacher
sa lame enfant. Les pistes GR alpha vides ne créent pas d'entrée native :
après l'initialisation, sélection de repli BASE mémorisée, valeur0. Ce défaut
est qualifié pour ce SCN et n'est pas généralisé. Complément source authentifié,
matériaux masqués après mixer, transformations/attaches/coups conservés.
28 contrôles groupés finaux et build commun réussis avec le lot Sigma.
Lame visible et animée dans le jeu principal sur le personnage sélectionné.
[Lot](../../work/weapon-polish-20261025/scythe-equipped-visibility/README.md).

25 octobre2026 — deux noyaux supplémentaires préparés, **pas encore activés** :
timer/physique reçue du lourd170 et déplacement supplémentaire du receveur171.
Capture groupée132 entiers/159 floats ; Float60 courant2,5, différent de l'ancien2,3.
Lecture des propriétés acteur refusée sur deux corps modifiés non complètement
authentifiés ; aucun garde relâché.290 tests Node en lot et16 tests de lecteurs
passent. La comparaison native et les gates prêts restent ouverts.
[Préparation](../../work/melee-pvp-comparison-20261017/capture-expansion-v2/scythe-victim-kernels-20261025/REPORT.md).

25 octobre2026 — la projection du troisième léger (Attack2/attribut173) rejoint
le cycle Blow/Down/Standup commun en Deathmatch. Lourd170 et aérien171 gardent
leurs chemins spécifiques non qualifiés ; aucun contact hors plage n'est admis
par repli.39 fichiers/285 tests passent au premier lot, build isolé36,75s.
Physique native et minimum de riposte non certifiés ; gate prêt conservé faux.
[Preuves](../../work/melee-pvp-comparison-20261017/capture-expansion-v2/scythe-ordinary-blow-20261025/REPORT.md).

25 octobre2026 — la première séquence spéciale `deathscythe_ex_att_eff`
suit la racine SCN évaluée du personnage, échelle comprise. Six relevés
natifs stables montrent la racine égale au parent personnage à33/201/402ms,
avec déplacement réel. Les deux déclarations de cette séquence sont conservées.
La finition ex2, non observée dans cette capture, garde sa politique séparée.
23contrôles groupés et build commun ; le recalage n'avance pas les horloges
ni les particules existantes. Gates non prêts conservés.
[Lot](../../work/weapon-polish-20261025/melee-actor-scene-follow/README.md).

25 octobre2026 — deux scènes supplémentaires raccordées : troisième coup
`deathscythe_3_att` (39modèles) et finition spéciale `deathscythe_ex2_att`
(40modèles). Le conteneur du SCN porte le même nom que plusieurs modèles ;
les parents Dummy01/eff_Dummy retrouvent la racine authentifiée et leurs pistes.
Les maillages restent distingués par index, sans modification des assets.
Troisième coup et spécial observés dans le jeu principal sur un personnage ;
31régressions groupées et un build commun passent. Les deux calendriers
d'entrées natifs n'ont pas atteint le troisième coup, et le spécial observé
n'a pas déclenché ex2 : comparaison directe de ces deux rendus encore ouverte.
Cela remplace leur ancienne exclusion pour homonymie, sans changer les gates.
[Bilan](../../work/weapon-polish-20261025/melee-active-hierarchies/README.md).

25 octobre2026 — Dummy01 et sa piste restaurés pour les60modèles de
`deathscythe_strong_att`, sans changer le placement externe ni le dispatcher.
Lot partagé : `work/weapon-polish-20261025/melee-effect-hierarchy-batch/README.md`.
Les autres scènes à noms dupliqués et les gates natifs restent inchangés.

25 octobre2026 — adversaire Free training exposé avec `loadDeathScytheTrails`
préparé et mis en cache. Le contrôle groupé atteint le troisième primaire qui
déclare le ruban, sans en ajouter aux premiers coups. Lot de six armes :
`work/weapon-polish-20261025/melee-opponent-batch/README.md`. Gates inchangés.

Statut : **raccordée dans le jeu principal en essais ; fidélité native non certifiée**. Série mêlée autorisée ; les fichiers partagés restent à l'intégrateur. Aucun ancien essai isolé ne sert de validation actuelle.

## État du raccordement et des horloges

### Contrôle du contact lourd lors du passage UpperCut —18octobre2026

Le test de maintien attribuait auparavant les dégâts à `source.attack` au moment
du callback. Ce champ désigne déjà UpperCut lorsque le contact lourd conservé
dans le payload est consommé. Le moteur ne produisait pas un contact UpperCut :
c'était une erreur de provenance dans le test.

`tests/held-secondary-combat.test.mjs` observe désormais le snapshot réellement
reçu et le relie à l'activation émise par son index et son ledger de cibles.
Les assertions de répétition, dégâts/PV et double consommation restent actives.
Deux cas M/F vérifient explicitement la transition au même tick : ancien objet
lourd conservé, état courant UpperCut distinct, aucune fenêtre de dégâts ajoutée,
aucun second contact à l'atterrissage ou à la sortie et aucune nouvelle entrée
d'attaque après relâchement. Aucun fichier de gameplay ou d'asset n'a été modifié.

Contrôle commun actuel :128/128 tests dans15 fichiers, sources stables.
Reproduction et empreintes :
`work/s5-main-delivery-20261017/game-flow/scythe-held-contact-receipt.json`.
Les deux échecs du reçu audio précédent sont historiques et expliqués par ce
défaut de test. Aucune nouvelle comparaison native ni certification globale
de Death Scythe ne découle de cette correction.

### Helper des phases du spécial

`src/death-scythe-special-state.js` porte maintenant les quatre timers de Tick64ff30 et le sélecteur651340, avec [preuves et ordre d'intégration](../../work/death-scythe-native/special-phases.md). **8/8 tests propres passent**. Le premier mouvement400 doit être déjà strictement dépassé avant le Tick qui choisit GR008 (premier délai500) ou, si le latch externe a été consommé, GR009 (finition550), puis GR010 (délai final500). Un seul timer avance par Tick, sans report du surplus ; le sélecteur change le clip après cet incrément. Le helper ne produit aucun signal ni callback et conserve l'origine des contacts distincte de celle du clip final.

Le helper est maintenant raccordé au runtime et remplace la durée forte fixe. Sans signal et avec des ticks16ms, la demande de sortie intervient à944ms ; avec des ticks100ms, à1200ms. `native-u32` reproduit les timers entiers ; `arena-fractional-ms` est une politique S5 explicite. Le MoveBox de l'ancien clip est traité avant la transition. Les trois appels de finition sont résolus : copie temporaire d'un vecteur zéro, copie vers la vitesse physiqueXYZ, destructeur vide. Le [reset final](../../work/death-scythe-native/finish-motion.md) est raccordé une seule fois au passage local vers GR009, sans effacer position, mode vertical ou gravité. L'ordre global des animations et leur fitting à la durée demandée restent des limites.

### SECOND_IMPACT : invocation et filtres raccordés

La preuve [second-impact.md](../../work/death-scythe-native/second-impact.md) établit l'invocation : un contact qualifié arme42 / attribut172 arme le flag state+373 ; le début d'un Tick ultérieur consomme ce signal une seule fois via state+372 et appelle `SpecialAttackByDeathScythe_SECOND_IMPACT`. Les contacts démarrent leurs horloges **350/450 ms à la création par callback**, indépendamment de l'animation finale. Ce n'est ni un clic supplémentaire ni une suite automatique d'un spécial raté.

Le helper `src/death-scythe-second-impact.js` expose le signal, sa consommation unique et l'annulation. Le runtime applique maintenant le filtre angulaire de catégorie1 et l'exclusion des cibles invincibles, puis consomme le latch au Tick suivant. Les contacts enfants1/72 utilisent leurs propres horloges callback+350/450, sans démarrer prématurément GR009. `nativeContactTriggeredFollow:true` signale ce chemin conditionnel ; `automaticStrongFollow:false` signifie uniquement l'absence d'enchaînement inconditionnel par entrée. L'équivalence de tous les champs natifs de cible/direction avec les états de l'arène n'est pas certifiée.

Dernier passage transmis par l'intégrateur : **8 tests gameplay passent**, couvrant M/F, huit directions, exclusions face/côté/invincible, changement d'arme et resetXYZ unique. Les logs racine sont à joindre par l'intégrateur. Le second impact est maintenant observé dans le jeu principal M/F : détails du passage du4 octobre ci-dessous.

Passage4 octobre2026 : finition conditionnelle observée M/F, GR009 et deux
contacts enfants, HP3.6 après23.4+1+72 ; angle exclu avec la cible retournée,
GR008 et aucun enfant, HP76.6. Le relevé QA expose séparément latch/origine
et compteur enfants ; le HUD ne dit plus que cette seconde phase manque.
67 tests dédiés/régressions et build passent. Captures, scénarios, horloges et
limites : `work/melee-batch-5/death-scythe-second-impact-visual.md`.
Cette observation confirme présence et routage ; placement natif des VFX,
huit vues et écoute restent non certifiés. Statut essais conservé.

Le menu/inventaire, les contacts, les cues/audio, le repos féminin, les combos/SP et le StaySky natif sont raccordés. La preuve [stay-sky.md](../../work/death-scythe-native/stay-sky.md) remplace en production l'ancienne politique fractionnaire : compteur avant tick <=500, physique active en montée mode1, suspension hors montée avec vitesses conservées, puis reprise au tick suivant le dépassement strict. Résultats transmis :16 gameplay/118 ciblés réussis ; la suite complète1603/1607 précédait la dernière correction StaySky (quatre échecs connus), suivie de régressions ciblées. Cette actualisation n'ajoute aucun résultat de test.

### Reprise contacts/effets et chargement par défaut

Le thunk MAKECYLINDER `583a60` révèle une erreur dans l'interprétation précédente du deuxième coup. Le Lua passe `MAKEVECTOR3(0,50,-100), MAKEVECTOR2(0,-1), range*0.7, range*0.8/0.6`. Le reader numérique du slot 2 reçoit un userdata vec2 et renvoie **0** ; le slot 3 devient le rayon **0,7r** ; le dernier scalaire est ignoré. Les deux formes natives sont donc identiques : ancre `[0,50,-100]`, hauteur **0**, rayon **350** au preset. Il ne faut ni supprimer silencieusement le vec2 pour lire les deux derniers scalaires, ni remplacer zéro par une hauteur positive. La collision native autorise ce cylindre plat si le plan passe strictement entre pieds et tête. Les preuves du binding et de la coercition sont distinctes de la calibration du corps cible.

`src/death-scythe-effects.js` fournit `deathScytheStateCues`, `deathScytheSoundCues`, `deathScytheTrailWindows`, les loaders et `DEATH_SCYTHE_SOUND_FILES`. Chaque cue conserve son index d'appel et sa source. **Deux** appels ex_att à 0 ms (AddSequence puis AddSequenceBySex) et **deux** rires à 1000 ms sont conservés ; aucun dédoublonnage natif n'est supposé. Les pistes de voix sexuées sont maintenant extraites et disponibles avec les sons propres. Les GhostTrail vides n'activent aucune traînée.

Les deux rires source à1000ms appartiennent à l'horloge commune du spécial. Le runtime utilise désormais les quatre timers natifs, avec ou sans contact qualifié ; il ne rallonge pas l'état pour forcer ces sons. `deathScytheEventClockReport` conserve un diagnostic des profils nominaux et ne doit pas remplacer l'horloge du helper raccordé. `strongFollow` ne rejoue pas les événements parent ; les contacts enfants viennent du latch qualifié. `follow:false` et la consommation des arguments de fin restent une politique d'arène à comparer.

Le loader `loadAvatar({sex,weapon:'deathscythe'})` est vérifié sans override M/F : 23 clips supplémentaires par sexe, aucune collision de noms avec le rig partagé, repos féminin GR000_1, huit directions et toutes les animations d'action après mixer. Les images/HTTP sont simulés dans ce test, les meshes, clips et hiérarchies sont réels ; il ne remplace pas la capture en jeu principal. Tests propres : `death-scythe-avatar.test.mjs` et `death-scythe-effects.test.mjs`. Le passage complet source/entrées/effets/loader/cylindres réussit **23/23 tests** ; preuve `work/melee-batch-4/death-scythe/tests-integration-pass.log`. Le helper dédié `src/death-scythe-cylinder.js` est effectivement appliqué aux deux contacts et conserve les arguments Lua bruts dans ses métadonnées ; preuve native `work/death-scythe-native/cylinder-binding.md`.

Le troisième argument **40 ms** des InitLua ordinaires est conservé comme `sceneUpdateMs`, et retiré de `minimumMs` : il ne rallonge plus chaque attaque d'une phase artificielle. Pour le spécial, `DEATH_SCYTHE_SPECIAL_TIMING` conserve les **deux mouvements400/550ms** et les **deux délais500/500ms** distincts. Leur dispatcher natif est prouvé et raccordé : un timer par Tick, tests stricts avant incrément, finition seulement après latch qualifié et expiration préalable du premier mouvement. Ces valeurs ne sont pas additionnées pour imposer une durée fixe.

`src/death-scythe-input.js` livre du code directement appelable :

- `deathScytheInitialAction(input,{grounded,energy})` route les commandes sémantiques et filtre les dépenses SP 20/10. L'uppercut depuis le sol est une règle d'entrée d'arène ; ce helper ne certifie pas tous les CanEnter natifs.

- `deathScytheInputTransition(attack,input,dtMs)` réutilise les tables natives **capturées le 23 septembre**, `tests/fixtures/native/tables-entrees-attaques.json` et `destinations-attaques.json`. Light1 court attend le dépassement de **499 ms** vers light2 ; light1 long celui de **650 ms** vers le spécial ; light2 court celui de **599 ms** vers light3. Les plages tardives sont directes, à 500/651/600 ms. Les événements short/long restent distincts et n'ajoutent aucun clic de fin d'animation. Le nom diagnostic historique de la destination48 disait uppercut ; le binding XML courant `left_attack3` prouve sa destination actuelle BasicAttack3. Cette relecture des captures n'est pas une nouvelle capture du client courant.

- Dans l'air, le handler capturé **INPUT_MOVE** attend **>1200 ms** puis renvoie `{kind:'normal',targetStateId:5}` : c'est une demande de sortie, jamais une création d'attaque `normal`. Le profil brut aérien1000 ms et ce délai capturé1200 ms ne suffisent pas à déduire l'origine et l'addition des horloges ; cette limite reste signalée au raccordement.

- **Politique historique conservée hors production** : `createDeathScytheAirState({policy:'arena-entry-relative-hold'})` et `advanceDeathScytheAirState(state,dtMs,{grounded,cancelled})` consomment les deux valeurs Lua **DelayCngStateTA250** et **TimeToStaySky500**. Ils renvoient des segments de simulation séparés aux bornes250/500, un indicateur `taReady`, une demande de suspension verticale jusqu'à500 ms, puis sa reprise. L'appelant conserve ses vitesses et collisions ; aucun vecteur de chute, déplacement imposé ou changement automatique de phase n'est créé. L'interprétation relative à l'entrée est une politique **opt-in**, marquée `nativeDispatcherVerified:false`, et non une preuve de l'origine des timers ou du comportement physique natif. Atterrissage et annulation terminent proprement cet état.

Le défaut de documentation du repos féminin est corrigé : la fonction complète contenait déjà **SetAniNameForHuman("GR000","GR000_1",true)**, masqué par le premier relevé filtré sur SetAnim. Le choix GR000_1 féminin est donc **explicitement sourcé**, sans alias fabriqué. Métadonnées des deltas et tests ont été corrigés.

Contrôles : `node --test tests/death-scythe-source.test.mjs tests/death-scythe-input.test.mjs`, **15/15 passent** ; preuve `tests-input-pass.log`. Tests des plages exactes, horloges sans40 additionnels, dépenses SP, entrée/sortie/cancel aérien, découpage invariant entre un tick750 ms et75 ticks10 ms, puis régressions de ressources et des deux mixers.

## Référence et preuves

L'item courant **2000031 « EXO Scythe »** emploie la famille native Death Scythe, type **42**, Power **18**, portée **500**, vitesse déplacement **1,1**, vitesse attaque **1**. Le Power 17 du catalogue historique EU n'est pas utilisé. Modèle classique courant : `model/weapon/deathscythe_normal.scn` ; la présence d'un nœud interne `deathscythe_unique` appartient à ce fichier source et ne justifie pas sa suppression.

Preuves dans `work/melee-batch-4/death-scythe/` : `source-contract.json` conserve **11 sources et 16 fonctions** depuis les archives actuelles, CRC/SHA vérifiés et bindings XML/XBN comparés au catalogue. Le nom XML `Damage_DEATH_SCYTHE` est résolu par l'alias explicite `DAMAGEANIMTABLE` vers `DamageState_DEATH_SCYTHE` dans `actorstates_gameplay.lua`. `source-manifest.json` authentifie **62 ressources binaires**. `extract_sources.py`, `extract_assets.py`, `stage.mjs` et `build-events.mjs` reproduisent la préparation, sans modifier l'installation originale.

Les animations viennent des porteurs courants `model/character/bip_male/male_bip_0000.scn` et `bip_female/female_bip_0000.scn`. Les porteurs principaux n'ont pas les clips GR. Les scènes sont décodées/parcourues jusqu'à EOF ; les deltas gardent les pistes directes et les liens de provenance.

## Livrables et interface

- `src/death-scythe-data.js` : `DEATH_SCYTHE_ABILITY`, `DEATH_SCYTHE_DEFINITION`, `DEATH_SCYTHE_LOCOMOTION`, `DEATH_SCYTHE_RESOURCES`, `deathScytheAttackContacts(kind, comboIndex, options)`, `deathScytheStateParameters` et attributs.

- `src/death-scythe-motion-data.js` : durées et MoveBox directs des **23 clips par sexe**.

- `src/death-scythe-events-data.js` : tous les appels actifs d'événements, méthode et arguments exacts ; les doublons source ne sont pas effacés.

- `src/death-scythe-equipment.js` : adaptation explicite des pistes d'équipement manquantes, déjà appliquée à `public/assets/s5runtime/death-scythe/model.json` (tableau compatible chargeur).

- `tests/death-scythe-source.test.mjs` : provenance, paramètres, clips, événements, géométrie et attache après mixer.

## Repos, marche et actions séparés

`NormalState_DeathScythe` déclare d'abord **GR000**, puis **SetAniNameForHuman("GR000","GR000_1",true)** ; boucle, vitesse 1, reset false, blend 1000 ticks. Le porteur masculin contient GR000 ; le féminin contient **GR000_1**. `idleBySex` suit cet appel explicite sans renommer les sources.

`RunState_DEATH_SCYTHE` définit les huit hauts `GR013 GR014 GR015 GR019 GR018 GR020 GR017 GR016` et bas `00008 00009 00010 00014 00013 00015 00012 00011`, dans l'ordre S5 avant, avant-droite, droite, arrière-droite, arrière, arrière-gauche, gauche, avant-gauche. Boucle, vitesse 1, reset false, blend 1000 ticks. Les clés natives sont conservées et la conversion des axes intervient à la même frontière que les rigs existants.

| Action S5 / binding | Clips action / récupération | Paramètres Lua |

| --- | --- | --- |

| light 0 / left_weak | GR001 / GR003 | InitLua `[310,400,40,true]`, MoveBox 1,7, HitStop 300/400, stop au dommage |

| light 1 / left_attack2 | GR002 / GR004 | `[400,210,40,true]`, MoveBox 1, HitStop 200/350 |

| light 2 / left_attack3 | GR021 / GR022 | `[700,200,40,false]`, MoveBox 2,5, HitStop 250/350 |

| heavy / right_attack | GR004_1 / GR006 | `[400,500,40,true]`, SP 20, HitStop 250/420 |

| air / left_jump | GR011 / GR012 | `[1000,0,0,false]`, MoveBox 2, vitesse 0,5, SP 10, DelayCngStateTA 250, TimeToStaySky 500 |

| strong / left_strong1 | GR007 / GR008 | `[400,550,40,true]`, InitDelayTA `[500,500]`, MoveBox 2, UseMoveBox true |

| strongFollow / callback distinct | GR009 / GR010 | Phase finale après contact qualifié ; horloge des contacts distincte, aucun enchaînement inconditionnel par entrée |

Les animations source sont à vitesse **1**, indépendamment des durées de l'état. Par exemple GR001 fait 2800 ticks et GR004_1 1200 ticks ; ils ne sont pas étirés pour couvrir la durée d'état. Le mapping des champs InitLua, la transition aérienne particulière et les fenêtres d'annulation ne constituent pas une reproduction native certifiée. Les valeurs brutes restent disponibles ; aucune impulsion de chute générique n'est inventée.

## Contacts et conditions

Les branches MELEE et ELSE déclarent les mêmes objets pour cette référence. **Dix objets par branche** sont conservés, y compris le rayon non activé par défaut et les deux objets du callback spécial.

| Action | Instant / quatrième argument de dégâts | Forme source | Conditions |

| --- | --- | --- | --- |

| light 0 | 300 ms / Power × 0,6 | BOX ancre `[0,250,50]`, dimensions `[1,2r;0,6r;1,1r]` | Push `[100,2000,-5000]` |

| light 1 | 200 et 300 ms / Power × 0,4 chacun | CYLINDER `[0,50,-100]`, hauteur0/rayon0,7r pour les deux objets après coercition native du vec2 | Push `[100,2000,-5000]` |

| light 2 | 250 ms / Power × 0,6 | BOX `[0,250,-100]`, `[0,8r;0,8r;1,2r]` | Blow `[0,2500]` |

| uppercut normal | 320 ms / Power × 0,8 | BOX `[0,250,-100]`, `[0,7r;1,1r;0,9r]` | Blow **et** UpperCut `[0,2500]` |

| uppercut rayon | 420 ms / Power × 0,3 | RAY `[0,250,-100]`, longueur `r−100` | Nom d'attribut COUNTER_CRITICAL ; aucun AlwaysCritical/DependOn déclaré |

| aérien | 250 ms / Power × 1 | FAN `[0,150,-50]`, `[0,8r;1,2r;r;120]` | Blow `[0,0]` |

| spécial première phase | 330 ms / Power × 1,3 **+ AdditionalPower** | BOX `[0,180,100]`, `[0,6r;0,6r;1,1r]` | Aucune ; ancien Stun commenté |

| callback spécial | 350 ms / **1 fixe** ; 450 ms / **72 fixes** | BOX puis FAN : paramètres `[0,7r;0,25r;0,85r]`, angle 120 pour FAN | Premier : Stun `[2000,3500,0,1000]` ; second : aucune |

Le rayon d'uppercut est exclu par défaut selon une **politique d'arène explicite** ; `includeUnverifiedRay:true` permet d'inspecter sa déclaration exacte. Il n'est pas transformé artificiellement en AlwaysCritical. La priorité et le contact du rayon demandent une preuve native. Pour le normal uppercut, les deux conditions restent dans `conditions[]` ; `condition` expose Blow, et l'effet additionnel UpperCut demeure une limite.

`SpecialAttackByDeathScythe_SECOND_IMPACT` crée deux objets avec `EnterState(ACTOR)` et sans argument de Power. Le cinquième argument vaut respectivement **1** et **10**. Son appel par latch au Tick suivant, le filtrage angulaire/non-invincible et l'origine d'horloge à la création sont raccordés. `automaticStrongFollow:false`, `nativeContactTriggeredFollow:true` et `requiresNativeCallback:true` distinguent ce déclenchement conditionnel d'une suite inconditionnelle. Les72 dégâts appartiennent au contact enfant tardif, pas au premier impact.

Pour les autres actions ordinaires, `AdditionalPower` n'est **pas** ajouté au quatrième argument source ; le cinquième `AddtionalPower`, mal orthographié, demeure inconnu. Les attributs, camera shakes, guard/damage data et les chemins d'effets sont préservés. Défense, body-part et HP final ne sont pas certifiés.

## Ressources et attache

Le dossier public contient **61 assets plus le manifeste**, dont le modèle d'arme, deux deltas, treize sons (six voix sexuées incluses), neuf séquences, huit modèles d'effets et leurs textures. Aucune dépendance de ces séquences ne manque. `blank_1sec` n'a aucun émetteur visible par sa déclaration ; ce n'est pas une extraction manquante. Les champs XBN auxiliaires `weapon_counter_upper02.seq`/`bsword_counter.ogg` sont conservés dans le contrat ; leur éventuel chemin d'invocation distinct des états n'est pas raccordé par cette préparation.

| Séquence | Durée / composants préparés |

| --- | --- |

| deathscythe_hit | 0,9 s, cinq émetteurs |

| deathscythe_1_att / 2_att / 3_att | 0,5 / 0,6 / 0,7 s, modèle animé chacun |

| deathscythe_4_att | 1,1 s, six composants |

| weapon_deathscythe_strong_att | 2 s, huit composants |

| deathscythe_ex_att_eff | 1,5 s, sept composants |

| deathscythe_ex2_att_eff | 2,2 s, huit composants |

Les GhostTrail vides des actions 1/2/air/spécial restent vides ; seule la troisième attaque et l'uppercut déclarent `GhostTrail_Death_Scythe_01`, 50–600 ms. Sa texture `death_scythe` est préparée. Les événements spéciaux contiennent deux appels actifs au rire à 1000 ms et deux déclarations de la première séquence, méthodes différentes : ces doublons sont conservés, sans prétendre que leur restitution simultanée soit déjà validée.

Le ruban acteur est désormais raccordé par `src/death-scythe-trails.js` dans
les trois chemins réels (arme initiale, cache de changement et avatars QA).
Il lit la paire P/P+V de `Line01` après le mixer, la texture authentifiée et
le mode additif issu du `blendType=0` type42 ; les buffers et le warmup sont
réutilisés. Les contrôles M/F, fenêtres nommées, extinction, remplacement
d'arme et chargement par cache passent dans
`tests/death-scythe-trails.test.mjs` et
`tests/death-scythe-main-trail.test.mjs`. Cette livraison ne recrée pas la
seconde passe GPU `flag22`, ni ne prétend comparer les pixels, l'ordre exact
des matrices ou le relais lourd→UpperCut au Jeu référence.

XML : scène 0 attachée à **R_Hand_Dummy**, link 0, rangement **Spine_Dummy**. Le test a reproduit une double transformation avec une normalisation inverse(BASE) appliquée comme pour Breaker. Les pistes explicites GR du `Sword_Wea_Dummy` sont déjà quasi identité dans l'espace de la main : l'adaptateur conserve leurs données sans inverse(BASE). Les pistes d'équipement GR014–GR020 manquent sur le dummy et le modèle parent, bien que les clips du personnage existent. Pour empêcher le retour à la pose BASE de scène pendant ces marches, l'adaptateur réutilise **GR013 pour ces quatorze entrées uniquement**. Cette politique est marquée `nativeFallbackVerified:false`. Tous les autres clips, transformations, hiérarchies et poses explicites sont inchangés. `source-model.json` conserve le modèle parsé avant adaptation. Aucun renommage d'une ressource source n'est effectué.

## Vérification courte et limites

`node --test tests/death-scythe-source.test.mjs` : **9/9 passent**, log `work/melee-batch-4/death-scythe/tests.log`. Comparaison indépendante des dix contacts contre chaque branche source, paramètres de dégâts/forme/conditions, empreintes, événements exacts et fermeture des textures. Les deux rigs réels fusionnent les 23 clips ; repos, huit directions et attaques sont évalués au mixer à 0/0,32/0,6 s. Le dummy reste à la main à la tolérance 0,0001 unité source. Le test prouve l'absence de double offset, pas une prise visuelle certifiée contre S5Runtime.

Le raccordement principal est réalisé : menu/inventaire, accès/changement, contacts, combos/SP, cues/audio, repos féminin et StaySky. Des captures du jeu principal sont conservées dans `work/melee-batch-4/visual/scythe-*` : repos homme **GR000** et femme **GR000_1**, marche avant homme **GR013**, marche gauche-arrière femme **GR020**, troisième coup homme **GR021**, attaque aérienne femme **GR011**. Ces observations couvrent les scènes citées ; elles ne certifient pas à elles seules tous les angles de prise, le suivi/extinction de chaque effet ou la comparaison à S5Runtime.

Bilan final transmis par l'intégrateur : **118/118 tests d'intégration**, **56/56 tests physique/helpers**, **build final réussi**. La suite complète **1603/1607** a été exécutée **avant la dernière correction StaySky**, avec quatre échecs préexistants ; elle n'est pas présentée comme une nouvelle suite complète après cette correction. Sources, tests et captures du jeu principal restent des preuves distinctes d'une comparaison directe avec S5Runtime. Le statut demeure **ready=false**.

Le **filtre angulaire de SECOND_IMPACT**, l'exclusion invincible, les phases natives, les horloges des contacts enfants et le resetXYZ unique de finition sont maintenant raccordés et couverts par les huit tests gameplay supplémentaires indiqués en tête. Aucune capture nouvelle de ce chemin n'est revendiquée dans cette mise à jour.

Limites restantes : équivalence complète du vecteur cible natif actor+a8 et des flags de réception avec le yaw et les états S5, millisecondes fractionnaires d'arène, fitting des animations, ordre global moteur, pipeline HP natif, priorité du rayon d'uppercut, transitions TA250 et fallback natif des pistes de marche de l'arme. Le filtre angulaire strict float32 est prouvé et utilisé ; la correspondance de tous les cas particuliers natifs n'est pas revendiquée. Le repos féminin est résolu par SetAniNameForHuman. Le gate demeure non prêt.

## Passage du 17 octobre 2026 — lourd vers primaire et UpperCut local

La limite historique « effet additionnel UpperCut non raccordé » est levée pour l'attaquant local dans ce passage. Le contact lourd320ms applique la condition UpperCut : impulsion verticale native2500 (15m/s dans S5), animation GR005 en vol puis GR006 au sol. Le Tick natif tient l'horloge à500ms en vol ; la sortie sol attend le dépassement strict de1000ms. Input7 court rejoint AIR45 ; input8 long n'a pas ce binding. Aucun contact ni son d'attaque supplémentaire n'est créé. Les autres limites de cette fiche restent distinctes.

Preuves : `tests/fixtures/native/scythe-uppercut-20261017.json` fixe les fonctions, paramètres et hypothèses rejetées ; `src/death-scythe-uppercut.js` porte le cycle intégré. GR0054400ticks a été ajouté aux deux deltas depuis les carriers authentifiés, portant leur nombre de23 à24 clips, anciens clips conservés. Le manifeste et le contrat central sont actualisés. Les poses et l'attache après mixer incluent désormais GR005 sur les deux rigs.

Comparaison S5Runtime : sept scénarios ciblés, court avant/après UpperCut et témoin saut→court, en complément de la matrice mêlée. Jeu principal S5 observé sur un seul personnage conformément à la demande humaine : projection GR005, court→GR011 aérien, et essai distinct d'atterrissage GR006. Rapport et images : [heavy-primary-transitions/DELIVERY.md](../../work/parallel-gameplay-reference/heavy-primary-transitions/DELIVERY.md).

Validation finale : **1150/1150 tests ciblés**, build **510 modules/5.85s**. La trajectoire native exacte après raccordement n'a pas été remesurée : la nouvelle copie a échoué au démarrage avant toute injection d'entrée. Le comportement pré-intégration, les paramètres sources et le résultat S5 sont des preuves distinctes. Le gate central reste **ready=false**, sans assouplissement ; aucune certification complète de l'arme n'est revendiquée.
