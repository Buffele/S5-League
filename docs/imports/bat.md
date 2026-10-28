# Bat / Storm Bat classique

28 octobre2026 — choix F · Flame ajouté par attaque, couleur réglable et option globale
Keep flames active hors attaque, sauvegardés dans inventaire/Échap/paramètres.
Effets/impacts/audio existants conservés ; ancrages post-mixer, limites et
preuves groupées : `work/weapon-flames-all-20261028/README.md`.

26 octobre2026 —9variantes artistiques sélectionnables dans l'inventaire :
frappe, rotation (y compris ses variantes spin) et aérien, chacun A/B/C ou
origine. Traînée dense, échos, spirales de vent ou arcs segmentés et fragments.
Le choix ne remplace ni les sons ni les contacts existants ; timing et dégâts
restent conservés. Les impacts source sont gardés, avec un complément lumineux
au point de contact. Gates natifs inchangés. Contrat et preuves groupés :
`work/weapon-effect-variants-20261026/README.md`.

25 octobre2026 — impact aérien sur décor : `bat_hit` est maintenant distinct
du `bat_hit1` réservé au personnage, conformément aux deux arguments sonores
de SetDamageSequence. La ressource était déjà décodée dans la bank ; aucun
asset ajouté. Le résolveur respecte une clé damageObjectSound explicite,
y compris le silence, avant de reprendre une clé acteur.49contrôles groupés
et build commun réussis. Audit de43combinaisons attribut/flag sur9familles,
six attributs Vital commentés conservés hors des entrées validées.
[Preuves et périmètre](../../work/weapon-polish-20261025/melee-contact-presentation/README.md).

25 octobre2026 — sons corrigés : `bat_swing` des rotations est émis une fois
au départ de l'état ; il ne se répète plus aux volumes150/300ms. En aérien, le swing
d'activation reste `bat_swing` et le `sword_power` séparé démarre après300ms.
Voix BB001/A0015 restaurées selon les déclarations sexuées. L'absence de
strike1 visuel ne supprime pas son son déclaré.47contrôles du lot et build ;
pas de comparaison audio native nouvelle revendiquée.
[Lot](../../work/weapon-polish-20261025/melee-audio-events/README.md).

25 octobre2026 — la traînée SEQ aérienne est maintenant raccordée dans le jeu
principal, joueur/adversaire, avec buffers et préparation propres au ruban
supplémentaire. Les lectures natives actives corrigent l'ancienne hypothèse de
racine directe : conteneur a0015 identité sous Bat, Shape conservant sa pose
chargée, Ghost identité sous ce Shape.43 relevés enrichis comparés et31 tests
groupés réussis ; capture principale et build final :
`work/weapon-polish-20261025/bat-aerial-integration/README.md`.
Cette reprise remplace le checkpoint ci-dessous pour skill_bat_strike ; seconde
passe GPU/cadence/reset exacts et strike1 restent ouverts, gate inchangé.

25 octobre2026 — checkpoint : le loader `a0015` du strike aérien est un Shape
sans maillage ; l'effet visible dépend du CActGhostTrail non raccordé, et ne
peut être réparé par un simple renommage de parent. Le cycle/pose active reste
ouvert, sans ruban substitué. Aucune nouvelle tentative native dans ce passage.
Voir `work/weapon-polish-20261025/effect-pool-lifecycle-batch/README.md`.

25 octobre2026 — adversaire Free training exposé avec `loadBatTrails`,
préparation/cache et pose adverse réelle. Lot de six armes :
`work/weapon-polish-20261025/melee-opponent-batch/README.md`. Ce raccordement
ne tranche pas les parents externes des séquences aérienne/whirlwind ci-dessous.

## Comparaison aérienne enregistrée — 25 octobre 2026

Trois séries natives M/F sont conservées dans
[`bat-reference-comparison`](../../work/weapon-polish-20261025/bat-reference-comparison/README.md).
Les captures montrent l'énergie verticale pendant la descente, distincte du
ruban de l'arme. Les deux demandes de mouvement après frappe ne produisent pas
de déplacement mesuré : elles ne permettent pas de trancher le suivi.
Le scénario principal S5 commence à4m, plus haut que le saut enregistré ; son
effet hors cadre à250ms ne prouve donc pas à lui seul un mauvais repère externe.
Les bornes temporelles réelles et les limites sont conservées dans les rapports.
Le parent externe reste ouvert : reprendre avec déplacement réel pendant
l'effet ou lecture qualifiée des matrices natives. Aucun changement follow ou
recentrage basé sur ces seules images. Statut essais conservé.

## Dummies des effets restaurés — 25 octobre 2026

Le contrat des effets a permis de reproduire deux erreurs dans le runtime :
`bat_jumpattack` ne résolvait pas les deux dummies de son modèle7 et
`bat_whirlwind1` perdait le nœud animé sans maillage de son modèle2. Dans les
deux cas, la résolution revenait à la matrice de la racine du chargeur.

`loadBatEffectDefinitions` demande maintenant une hiérarchie qualifiée pour
ces deux scènes et leurs clips uniques (`JUMP_ATTACK`, `WIND EFF3`).
`prepareBatEffectHierarchy` conserve les deux dummies, leur parenté et les
pistes TRS ; le tourbillon retrouve son émission orbitale. La rotation des
particules locales est conservée. Une cible nommée absente déclenche une erreur
explicite pour ces séquences, au lieu d'une émission à la racine.

| Composant | Parent source consommé | Contrôle |
| --- | --- | --- |
| Aérien, particules0–5 | action7 / Dummy02 | Matrice comparée au clip source, trois orientations |
| Aérien, particules6 et8 | action7 / Dummy01 | Dummies distincts, positions préservées |
| Rotations4/5, particule0 | action2 / Dummy02 sous Dummy01 | Deux pistes interpolées, orbite et instances indépendantes |

`tests/bat-effect-hierarchy.test.mjs` reproduisait initialement les deux
parents absents et passe après correction. Les assets décodés, textures,
fenêtres et événements d'action sont conservés. Le test de chargement commun
conserve son empreinte historique après retrait des seuls champs de hiérarchie
et rotation ajoutés ; les autres définitions restent protégées.

Cette correction établit les parents internes des effets. Le repère externe
est encore à comparer dans le Jeu référence. La rotation5 est observée dans
le jeu principal sur femme, avec tourbillon et particules, dans
`work/weapon-polish-20261025/bat-effect-hierarchy/female-spin5-090-profile.png`.
Le bilan et les contrôles sont dans le README de ce dossier. Le repère externe
de la séquence, sa politique actuelle `follow:false`, les dummies d'arme et le
ruban acteur restent des points distincts ; le repère Breaker n'a pas été
recopié sur Bat. Le CActGhostTrail de `skill_bat_strike` et l'asset
`skill_bat_strike1` restent ouverts. L'arme conserve le statut essais.

**25 octobre 2026 — traînée d’acteur raccordée au joueur principal.**
`src/bat-trails.js` remplace le ruban générique désactivé dans les trois chemins
de préparation de l’équipement (initial, bibliothèque QA, inventaire/cache).
Le profil producteur est 200 ms de vie, spacing50, rise50/fall100 ; XML blend1
est remappé en contrôleur0 alpha. Le délai Lua est franchi strictement et le
second nombre est une durée après activation, pas une borne absolue.
Le Shape Line01 est évalué après mixer, les queues restent entre coups,
texture/GPU préparés avant l’équipement et buffers stables pendant la frappe.
83 tests du lot passent, build réussi ; trait observé dans le scénario principal
sur les deux personnages, extinction observée sur femme à1,2s.
La passe graphique supplémentaire flag22 n’est pas portée ; fidélité native,
comparaison des poses et commandes ordinaires restent ouvertes. Les mentions
historiques de traînée totalement désactivée ci-dessous sont supersédées pour
ce seul rendu acteur local ; le CActGhostTrail du SEQ aérien est distinct.
Preuves : [raccordement](../../work/weapon-polish-20261024/bat-effects/HANDOFF.md),
`tests/bat-main-trail.test.mjs`, `tests/bat-trails.test.mjs` et
`work/weapon-polish-20261024/bat-effects/integration-tests.tap`.

**Dégâts du premier léger, 21 octobre 2026 :** le normal16,798 reçoit la contribution critique déclarée12,7465 lorsque les deux volumes touchent, soit29,5445 ; hors du critique, le normal reste seul. Bat conserve deux records source indépendants : aucune dépendance `DependOn` n'est inventée. Le runtime agrège une réception et conserve la réaction, le recul et les effets normaux. Vérification des classes, garde/protection/ledger, Deathmatch principal homme/femme et build : [preuve du correctif borné](../../work/melee-pvp-comparison-20261017/capture-expansion-v2/s5-critical-correction-v1/delivery.json). Les autres états gardent leur politique précédente. Les anciennes mentions « aucun critique ajouté » sont supersédées pour ce seul léger ; arbitrage natif et fidélité physique restent non certifiés.

**Marche pendant le premier coup, mise à jour du4octobre :** les jambes utilisent désormais la commande du joueur et le rapport natif1100/915, au lieu du fitting800ms et de la vitesse physique. Seuil strict300 conservé, marche quand la translation est bloquée et repos après relâchement. Vrais avatars M/F×8directions×2orientations, observation principale M/F en mouvement ; **195 tests et build passent**. [Preuve et limites](../../work/melee-batch-5/bat-lower-speed.md).

**Fin du premier coup, mise à jour du4octobre :** la chaîne factory→timer de base prouve une durée1000ms et une sortie strictement après1000. Light/strong ont été corrigées de900 à1000ms ; l’override d’animation900 et la vitesse0.9 restent distincts. **194 tests passent, build réussi**, observation principale M/F actif à1000 et repos à1010. [Preuve et limites](../../work/melee-batch-5/bat-light-end.md). Ce passage clôt la durée ordinaire sans pause ; orchestration hitstop/pauses et permissions complètes restent ouvertes. Les paragraphes précédents conservés ci-dessous sont supersédés sur cette fin d’état.

**Premier coup au sol, mise à jour du4octobre :** BB001 utilise maintenant la demande native1000ms et l’override Lua900ms, soit vitesse0.9. Vrais avatars M/F dans huit directions, observation principale M/F à600ms, **194 tests ciblés et build réussis**. [Preuve](../../work/melee-batch-5/bat-light-duration.md). La fin d’état S5 reste900ms, explicitement non certifiée ; demande d’animation et achèvement de l’état sont deux questions distinctes. Le fitting BB001 n’est plus ouvert, contrairement aux mélanges et à cette fin d’état.

**Mise à jour du4octobre :** vitesses natives raccordées pour l’aérienne et les cinq rotations, en conservant vitesse Lua, override de durée et durée d’état séparés. A0015 joue à0.85 ; A0016 utilise l’override1000 pour l’état1100. Les rotations utilisent les durées des timers natifs. **193 tests ciblés passent, build réussi, huit observations du jeu principal M/F** pour l’aérienne et les fins des deux branches de combo. [Preuve et limites](../../work/melee-batch-5/bat-animation-speed.md). Ce raccordement remplace l’incertitude de fitting de ces seules actions ; BB001, mélanges globaux et effets restent ouverts.

3 octobre 2026. **Raccordée dans le jeu principal en essais : menu, inventaire, contacts, effets et sons.** Pas de certification native. Vérifications et limites du lot : [bilan](../../work/melee-batch-3/README.md). [Guide](../IMPORT-ARMES-GUIDE.md).

Item **2000003**, type13, power18.5, range500, déplacement1.1. Les 38 sources actuelles sont authentifiées par longueur/CRC d’archive et SHA256 : `work/melee-batch-3/bat/source-manifest.json`. Le skin classique utilise `model/weapon/bat.scn`, socket `R_Hand_Dummy`, alignement `Sword_Wea_Dummy` ; rangement `Spine_Dummy`.

| Action | Source actuelle / adaptation | Contacts normaux |
| --- | --- | --- |
| Repos / marche | NormalState_BatSword A0013 ; RunState_BatSword upper A0005–12, lower00008–15, boucle1, blend1000ticks | Aucun |
| Gauche court / long initial | Les deux bindings appellent StandAttack_Strong : BB001, SetAnim demande900ms, déplacement.8 ; lowerE0008–15/A0024 après300ms | BOX400ms,16.798 ; blow4000/2600 |
| Rotation secondaire initiale | Attack2, BB002/BB004, état700/300ms, déplacement1.5 | CYLINDER150/300ms,3.478 chacun |
| Aérien | JumpAttack, A0015/A0016, état300/1100ms, drop200ms(0,-20000,0) | BOX300ms,26.64 ; pas de condition push/blow dans ce CAttack |
| Strong2, rotations2–5 | Strong2 source séparée ; rotations natives1→2/4 et2/4→3/5, press précoce ou tardif | Strong2 facteur1.002 ; rotations .345/.501/.689/1.002 ; rotations4/5 critiques déclarées, dégâts bruts sans multiplicateur inventé |

Les volumes sont bruts en unités natives. Les contacts de rotation sont distincts ; aucun critique n’est ajouté aux dégâts normaux. Les attributs counterable, damage/guard data et effets sont conservés. `InitLua`40 n’ajoute pas une phase inventée. Le contrat garde surcharges et durées séparées : premier coup état1000ms strict, override SetAnim900ms, vitesse0.9 ; orchestration des pauses/hitstop encore distincte.

Code consommable : `src/bat-data.js` (`BAT_DEFINITION`, `batAttackContacts`, presets/ressources/incertitudes), `src/bat-motion-data.js` (durées M/F), `src/bat-effects.js` (définitions et cues), `src/bat-input.js` (graphe natif de rotation). `batAttackContacts` accepte `criticalPolicy:'normal-only'` par défaut ou `'include-declared'` ; le runtime sélectionne explicitement cette dernière pour les spins4/5.

Correction utilisateur du3octobre : [preuve des entrées](../../work/melee-batch-3/bat/input-fixes/README.md). La première pression droite acceptée prépare la suite, dispatch strictement après400ms ; plage0..300 normale,301..400 critique (priorité native dans le recouvrement documentée). Tests dédiés `tests/bat-input-native.test.mjs`9/9, vrais contrôleur/entrées M/F et contacts, récupération finale immobile, dodge prématuré bloqué, saut phase2 conservant BB001. L’entrée aérienne native prend le cap caméra une fois ; pas de rotation continue déduite. Le seuil sol strict>300 est natif ; les permissions saut/dodge appliquent l’observation S5Runtime explicitement rapportée par l’utilisateur, sans prétendre que leur chemin natif complet a été décompilé. Les sauts précoces sont consommés sans buffer retardé. Le Tick natif des rotations n’applique aucun mouvement en récupération.

`public/assets/s5runtime/bat/` contient modèle/textures, icône exacte2000003, quatre nouveaux clipsBB001–004 par sexe, quatre sons, trois séquences et leur runtime. Les28clips communs existants sont conservés, jamais écrasés. Le manifeste répertorie31sorties et leurs SHA. Préparation reproductible : `extract_current.py`, `build_contract.py`, puis `stage.mjs` dans `work/melee-batch-3/bat/`. Le runtime ne lit aucun fichier privé.

Limites précises :

- Aucun MoveBox direct pour les six clips d’action/récupération : déplacement de courbe nul explicitement marqué, fallback BASE natif non établi.
- `skill_bat_strike1.seq` cité à300ms est absent de l’index actuel. `sword_power.ogg` existe séparément ; pas de séquence de substitution. Reprise : archive contenant la ressource authentifiable ou observation native démontrant son absence.
- `skill_bat_strike.seq` charge `a0015.scn` sans maillage et un `CActGhostTrail` non converti. `bat_jumpattack.seq` conserve ses9nœuds, dont particules et modèle électrique. `bat_whirlwind1` conserve son modèle visible `eff_bat_wind2` ; `eff_bat_wind` n’a pas de maillage. Aucun de ces constats ne vaut observation visuelle en jeu.
- Suivi des effets, pauses/hitstop et mélanges globaux, réaction/impulsion physique des victimes et pipeline critique restent à comparer. Fitting BB001/aérien/rotations et fin ordinaire de BB001 raccordés et vérifiés dans S5 : voir les mises à jour du4octobre. La faute source `AddtionalPower` demeure une incertitude de binding.
- Le déplacement.8/1.5 et les directions sont testés dans S5 ; leur rendu final, les sons, l’angle de prise et les effets doivent être observés dans le jeu principal M/F.

Vérification courte : `node --test tests/bat-data.test.mjs tests/bat-gameplay.test.mjs` **11/11 passent**. Sources et attributs, BOX/CYLINDER dans8orientations, SHA/fermeture des ressources, vrais avatars M/F et attache après mixer (matrice relative main/dummy tolérance3e-5), Controller/MotionGraph M/F×8directions×2orientations, jambes mobiles, contacts uniques, fin d’action et changements d’arme. Ce contrôle numérique ne prouve pas l’angle visuel par rapport à S5Runtime.

Prochain point : terminer raccordement audiovisuel/observation principale après les corrections Twin prioritaires, puis régressions et build du lot par l’intégrateur. Aucun fichier partagé n’a été modifié par l’agent Bat.
# Mécanisme commun des traînées

Le contrôleur `src/native-ghost-trail.js` porte maintenant le vieillissement,
la montée/descente d'opacité, le reset et l'échantillonnage natifs prouvés.
Il reste distinct du renderer et n'est pas encore raccordé à Storm Bat :
Shape après mixer et états graphiques hérités à établir. L'horloge interne
est désormais portée en millisecondes dans `src/native-scene-timer.js` ;
preuve [`native-scene-timer.md`](../../work/melee-batch-5/native-scene-timer.md).
Aucun
ruban approximatif ajouté. Preuve et API :
[`ghost-trail-controller.md`](../../work/melee-batch-5/ghost-trail-controller.md).

Le Shape Line01 est maintenant conservé par le chargeur d'effets et expose
`shapeEndpoints(name,evaluatedGhostMatrix)` pour alimenter le contrôleur
natif : [binding et preuves](../../work/melee-batch-5/native-shape-binding.md).
47tests natifs passent, build réussi. Régressions effets56/57 : manifeste
Breaker désynchronisé consigné dans le rapport. La matrice de liaison native
et le renderer restent à établir ; aucune activation de traînée revendiquée.

Résolution du parent SEQ et attache native portées dans `src/native-sequence-parent.js` : type1/index0/Line01 désigne le Shape de l'action0 chargée. Preuve : [native-sequence-parent.md](../../work/melee-batch-5/native-sequence-parent.md), 34 tests ciblés et build réussis. Recherche native de nœud désormais portée dans `src/native-node-lookup.js` : [native-node-lookup.md](../../work/melee-batch-5/native-node-lookup.md), 38 tests ciblés et build réussis. Les données réelles contiennent deux Line01 distincts (arme et effet) : respecter la portée de l'action0. Objets Shape runtime, porteur externe Bat, activation et rendu restent à raccorder ; traînée toujours désactivée.

Le chargeur d'effets conserve aussi les objets runtime Shape dans `effect.shapeNodes` : [native-shape-node.md](../../work/melee-batch-5/native-shape-node.md). La chaîne SEQ→parent Shape→matrice GhostTrail→contrôleur est testée sur les données réelles avec poses explicites, huit orientations ; 66 tests ciblés et build réussis. Alimentation par les poses du jeu, activation et rendu restent ouverts.

Pose locale statique de Line01 désormais calculée par les fonctions D3DX9_29 réellement importées : [native-shape-pose.md](../../work/melee-batch-5/native-shape-pose.md). Ressource dédiée et `evaluateRecordedStaticPose` raccordable ; entrée exacte requise, aucune substitution aux pistes animées. 69 tests ciblés et build réussis. Pose non encore consommée automatiquement par le jeu.

Racine réelle du NodeLoader et raccordement après mixer : [bat-native-strike-shape.md](../../work/melee-batch-5/bat-native-strike-shape.md). Le Shape est la racine directe, sans groupe ajouté ; adaptateur de liaison/matrices/détachement livré. 96 tests ciblés, deux rigs, huit orientations, clips BB001/BB002/A0015. Attention :12016f0 remet la pose locale à identité, donc le cache de pose chargée n'est pas une pose d'attaque automatique. Cycle reset/activation et rendu encore ouverts.

Horloge du contrôleur SEQ portée : [native-sequence-clock.md](../../work/melee-batch-5/native-sequence-clock.md). 103 tests ciblés et build réussis. Source distingue reset conditionnel du gestionnaire, attache et update ; fin stricte/modulo conservés. Précision x87 et liaison du delta doivent être explicites ; module pas encore branché au jeu.

Update/reset du gestionnaire porté : [native-sequence-manager.md](../../work/melee-batch-5/native-sequence-manager.md). Nettoyage même à delta zéro, reset conditionnel avant retrait et ordre horloge/actions/parents externes ; 33 tests ciblés et build réussis. Le constructeur du jeu active le flag de reset. Cycle complet de démarrage/cache et renderer encore ouverts ; aucun raccordement visible revendiqué. Prochain passage de polishing : combos Twin.

Composition de matrice GhostTrail et remontée au dernier ancêtre désormais
portées : [native-node-matrix.md](../../work/melee-batch-5/native-node-matrix.md).
52tests communs réussis, dont Line01 dans8orientations. Parent runtime demandé
par l'action et états graphiques hérités encore inconnus ; traînée désactivée.

## Reprise des effets du 24 octobre 2026

Lacune actuelle reproduite par les fonctions runtime : `trailWindow` retourne
toujours false pour Bat. La frappe forte source demande pourtant
`GhostTrail_bat_sword_01` entre50 et350ms, et les rotations ont leurs propres
fenêtres. Les séquences disponibles aériennes et des rotations4/5 sont déjà
raccordées ; elles ne remplacent pas cette traînée. Aucun effet de charge
supplémentaire n'est inventé pour les bindings actuels.

La vraie texture actorstate `image/bi_atex.dds` est retrouvée et authentifiée
depuis l'archive copiée39.xs : CRC7f94b38c, SHA256
`beae5e989c6d23875a782739be84819f6864cfdfbfd32fe4a015deaa684d20f9`.
DDS et PNG restent dans `work/weapon-polish-20261024/bat-effects/`, sans
modification de public. L'index courant confirme toujours l'absence de
`effects/skill_bat_strike1.seq`.

La lecture statique bornée du PE établit la chaîne AddGhostTrail :
enregistrement560df7, thunk567024 virtual+98, MovingState5c8d70,
wrapper885310, attache885550 et lookup9823f0. Le wrapper ne construit pas
le profil d'échantillonnage : il retrouve un GhostTrail déjà présent dans
le modèle acteur+70 par son nom, vérifie sa classe et emprunte le contrôleur
node+D8. Ses deux temps Lua restent les bornes d'activation.

**Blocage du raccordement : producteur/configuration de ce nœud de modèle
actorstate non établis** (sampleLifetime, spacing, rise/fall, initialisation
et reset). Les UV/RGBA et la géométrie native existent déjà, mais les profils
Rocket700/10/0/0 et SEQ aérien500/100/0/400 ne doivent pas être copiés dans
cette branche. Aucun ruban générique activé. Pas de nouveau processus natif,
pas de build et aucune certification de fidélité.

Preuves et condition de reprise :
[bilan ciblé](../../work/weapon-polish-20261024/bat-effects/HANDOFF.md),
`cue-gap.json`, `resource-proof.json` et `addghosttrail-static.json` dans ce
dossier. Le passage est clos avec cette dépendance précise ; reprise quand
le constructeur/configurateur du GhostTrail de modèle type13 est établi.


## Traînée actorstate : producteur retrouvé et module livré le24octobre2026

Cette section supersède le blocage de profil et les descriptions de temps du passage précédent. Le producteur natif B94D60→982170 établit le profil **sampleLifetime200/spacing50/rise50/fall100**, fog=true, flag22=true. Le XML `blendType=1` est **remappé en mode0, alpha SrcAlpha/OneMinusSrcAlpha**, et ne signifie pas ici additif. Aucun profil SEQ/Rocket n’est emprunté.

`src/bat-trails.js` est livré pour raccordement principal : `loadBatTrails(avatar)`, `mesh`, `update(dt,attack,{cancel})`, `render()`, `warmup(renderer,camera,scene)`, `clear()` et `dispose()`. ShapeLine01 sous le modèleBat réellement évalué après mixer, première paireP/P+V ; matrices et assets source intacts. Texture `bi_atex.png` authentifiée ajoutée dans public et au manifeste. Buffers GPU préalloués ; texture et variante fog compilées pendant la préparation.

Le wrapper8856C0 franchit strictement le délai, puis avance la durée seulement pendant l’émission, premier tick actif compris. Ainsi50,350 ne constitue **pas** une fenêtre absolue50–350. À la sortie,888210→885690 désactive l’émission sans effacer les samples ; un changement de coup préserve donc les traces et leur fondu. L’ordre du reset d’historique distinct888040→8855E0 reste non qualifié.

Le flag22 **ajoute** un pass après les listes ordinaires118C490→118C140. Le module fournit un seul rendu monde sourcé, sans inventer ce pass GPU supplémentaire. **nativeReady:false**, `additionalNativePassPorted:false` ; états GPU hérités, comparaison visuelle des poses et ordonnancement du delta restent ouverts. La séquence `skill_bat_strike1.seq` manque toujours, sans substitution.

**23 tests ciblés passent**, dont vrais avatars M/F au repos, huit marches et huit actions exposées via createMeleeAttack/meleeClipSample, endpoints après mixer, vertices/UV/RGBA, fade/combos et warmup sans mutation. Build commun et observation principale M/F restent à l’intégrateur ; aucune certification complète annoncée. [Preuves, API et limites](../../work/weapon-polish-20261024/bat-effects/HANDOFF.md), producteur statique18fonctions `actor-ghosttrail-producer.json`, test `tests/bat-trails.test.mjs`. Aucun fichier partagé modifié par cet agent.
