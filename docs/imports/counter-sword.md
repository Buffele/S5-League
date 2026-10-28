# Counter Sword — lot mêlée du 3 octobre 2026

28 octobre2026 — choix F · Flame ajouté par attaque, couleur réglable et option globale
Keep flames active hors attaque, sauvegardés dans inventaire/Échap/paramètres.
Effets/impacts/audio existants conservés ; ancrages post-mixer, limites et
preuves groupées : `work/weapon-flames-all-20261028/README.md`.

27 octobre2026 — maintien gauche : trois auras de contour (Ion Edge, Spectral
Flame, Flowing Aegis), sur les deux scènes équipées à leur échelle réelle.
Elles complètent le déploiement OG à250ms, sans le remplacer. Le feu est un
volume continu issu des triangles du métal, avec surface incandescente ; il
suit les pièces après mixer pendant toute l'action et le fondu550ms. Les petits
plans/filaments ont été retirés. Taille/intensité sauvegardées dans les paramètres
et réglables depuis Échap → Weapon effects ; noms des effets en anglais.
Mécaniques, audio et budgets d'ombres inchangés. Rapport :
`work/counter-effects-menu-20261027/README.md`.

27 octobre2026 — double de l'arme au clic maintenu rétabli dans les trois
variantes : modèles de weapon_counter_upper02 conservés au seuil250ms, son
counterAttack et particules inchangés. Voir
[preuve du correctif](../../work/melee-art-expansion-20261027/README.md).

27 octobre2026 — correction demandée : les12variantes artistiques habillent
désormais les deux parties de l'arme. Surcouches et rémanences incluent les
scènes droite et gauche ; les rubans/filets ont des points et historiques
séparés. En garde B/C, les ornements sont aussi appliqués au plan évalué de
la lame droite, en complément de la protection gauche. Cela remplace la
restriction de scène décrite dans le bilan du26 ci-dessous. Sons, étincelles
de contact, contacts et mécaniques conservés. Preuves :
`work/counter-art-both-parts-20261027/README.md`.

26 octobre2026 —12variantes artistiques sélectionnables dans l'inventaire :
combo, puissant, garde et aérien, chaque attaque avec A/B/C ou origine.
Les échos de lame excluent la scène gauche ; les plaques et filets de garde
suivent le plan évalué du mesh Counter_Sword gauche. Géométries et matériaux
préparés avant combat, fondus et nettoyage par propriétaire. Sons et contacts
existants conservés ; aucune cadence, réaction ou locomotion modifiée.
Gates natifs inchangés ; ces choix sont des créations S5. Preuves et limites :
`work/weapon-effect-variants-20261026/README.md`.

**Réaction après garde,25octobre2026 :** en Deathmatch, après une garde déjà admise, l'attaquant utilise désormais la réaction19 : préfixe00006 ajusté à700ms, puis boucle00007 ; durée totale3000ms, expirations strictes. Les effets/sons2500ms restent séparés. Registre réel lu sous bail en lecture seule, source binaire/Lua,14tests canoniques/125régressions et rendusM/F : [rapport](../../work/melee-pvp-comparison-20261017/capture-expansion-v2/counter-guard-received-animation-fix-20261025/REPORT.txt). Stun13, autres modes et admission de garde restent sur leurs politiques précédentes ; aucune fidélité complète ni nouveau minimum absolu natif annoncé.

**Récupération reçue, 24 octobre 2026 :** les deux contacts normaux du premier léger utilisent désormais200ms dans S5, avec expiration stricte `elapsed > duration`, au lieu de250ms ; chaque réception normale relance sa propre durée, sans remise à zéro supplémentaire depuis le critique agrégé. Le consommateur binaire et les chronologies Counter→Plasma l'étayent. Quatre essais natifs qualifiés comprennent trois entrées en attaque après recul sans dégât de retour ; ce manque de contact reste distinct du verrou. Le Push S5 demeure une approximation et n'est pas modifié pour compenser la portée.11nouveaux tests,107régressions, build et contrôles rendus homme/femme : [vérification finale](../../work/melee-pvp-comparison-20261017/capture-expansion-v2/s5-recovery-duration-v1/verification-final.json). Aucun minimum absolu du clic ni tous les combos n'est nouvellement certifié.

**Dégâts du premier combo léger, 21 octobre 2026 :** le second contact ajoute désormais la contribution critique déclarée seulement si le normal et le volume critique touchent ; le premier reste simple. La séquence centrée donne5,5125+11,025, et le cas latéral conserve deux normales simples. Une réception, une réaction et les effets normaux par activation ; les autres combos/heavy/air restent sur leur politique précédente. Vérification des classes, garde/protection/ledger, Deathmatch principal homme/femme et build : [preuve du correctif borné](../../work/melee-pvp-comparison-20261017/capture-expansion-v2/s5-critical-correction-v1/delivery.json). Les totaux S5Runtime étayent ce correctif ; arbitrage natif des records, physique et fidélité complète restent non certifiés. Cette mise à jour remplace la politique historique « normaux seuls » pour ce seul combo.

Complément du4 octobre : **fitting natif raccordé aux quatre coups, contre et aérien**, y compris récupération. Les clips utilisent la conversion native float32 puis millisecondes entières, avec leurs demandes InitLua explicites ; les MoveBox lisent la même vitesse. Cette preuve remplace l'incertitude de fitting indiquée dans le bilan initial ci-dessous, sans certifier l'horloge globale, les fondus ou resets. **126 tests ciblés passent, build réussi** ; deux sexes/huit orientations et changements d'arme en tests, quatrième coup et récupération aérienne observés M/F dans le jeu principal. Rapport : `work/melee-batch-5/counter-animation-speed.md`. La portée aérienne bornée et la direction du viseur restent couvertes par les régressions.

**Statut : en cours, intégration expérimentale.** Le lot est autorisé. Adaptateur exploitable raccordé par l'intégrateur ; aucun statut natif prêt revendiqué.

## Source actuelle et adaptateur

Classique, item `2000002`, type `1`, deux scènes `counter_sword_r.scn` / `counter_sword_l.scn`. Le catalogue courant issu de `xbn/weapon.xml` donne **Power 12,5 et Range 480**. L'ancien `_eu_weapon.x7` donne 15 et 500 : ces valeurs ne sont pas fusionnées. Branche de combat choisie : `CHANNEL_MELEE` ; bonus `AdditionalPower=0` par défaut dans l'arène.

`tools/s5runtime-local/build_counter_source_contract.py` extrait l'attaque depuis la copie XS actuelle et vérifie longueur/CRC ; il vérifie aussi les six Lua sélectionnés par SHA/CRC, puis authentifie les attributs partagés. Résultat transportable : `tests/fixtures/native/counter-source-contract.json` (22 fonctions et 8 blocs d'attributs). Attaque `package/23.xs`, CRC `3aa1edc2`, SHA256 `8a8f45a56def74ed2faace5b8cd13bbc9074ac7c2c2609f8d340484f5b35d199`. Attributs SHA256 `f714b31691b87c020c5618d96f51876bab361445b689709b8a20880882048c65`. Une déclaration authentifiée ne prouve pas la fonction exécutée en live S5Runtime.

`src/counter-sword-data.js` exporte :

- `COUNTER_DEFINITION`, raccordable à `MELEE.counter` sans recopier le contrôleur ; conserve les horloges et vitesses runtime antérieures.
- `COUNTER_ABILITY` et `counterAttackContacts(kind, comboIndex, options)` : un objet par `CAttack`, avec identifiant, instant, forme native, puissance brute, dépendance critique, conditions et provenance.
- `counterContactAttributes` : contre autorisé/interdit, dégâts/réaction/garde, séquence et son d'impact déclarés.
- `COUNTER_STATE_PARAMETERS`, `COUNTER_RESOURCES`, `COUNTER_UNCERTAINTIES` : mouvement, hit stop, ressources et limites explicites.

`tools/build-counter-runtime-data.mjs` utilise `directionalMapping` pour générer `src/counter-sword-locomotion-data.js` depuis les clés sémantiques du contrat. La conversion gauche/droite n'a lieu qu'à cette frontière.

## Repos, déplacement, actions

`NormalState_CounterSword` déclare `R0004` full-body, boucle, reset false, fondu 1000 ticks. `RunState_CounterSword` déclare séparément huit clips supérieurs `R0016–R0023` et **huit clips inférieurs `00008–00015`**, boucle, reset false, fondu 1000 ticks. Les jambes de garde `R0008–R0015` proviennent exclusivement de `UseWeapon2State_CounterSwordGuard`. L'ancien runtime omettait `runLower` et animait la course avec le haut sur tout le corps ; l'adaptateur corrige ce défaut.

| Action | Clip / retour | Action / retour S5, ms | Contacts normaux, ms | Puissance brute par contact |
|---|---|---|---|---|
| Léger 1 | R0000 / R0025 | 800 / 250 | 100, 350 | 5,5125 ; 5,5125 |
| Léger 2 | R0001 / R0026 | 600 / 400 | 100 | 11 |
| Léger 3 | R0002 / R0027 | 800 / 300 | 300 | 11 |
| Léger 4 | R0003 / R0028 | 1150 / 300 | 100, 650 | 8,9375 ; 12,375 |
| Heavy/contre | R0030 / R0031 | 1000 / 500 | 350 | 18,575 |
| Aérien | R0029 / R0033 | 600 / 600 | 600 | 18,575 |
| Garde | R0005 / R0032 | maintien / clip | aucun | aucun |

Chaque attaque déclare `SetAnim` vitesse 1 et `InitLua` troisième paramètre 40. Ces déclarations restent dans `nativeAnimationSpeed` / `nativeMinimumSceneUpdateMs`. La décompilation ciblée confirme que 40 est l'intervalle minimal de mise à jour de scène, pas une phase supplémentaire. Le fitting des animations demeure à établir.

## Contacts, déplacement et effets

Les contacts terrestres utilisent `MAKEBOX`, avec ancre/direction/dimensions complètes issues des sources ; les boîtes critiques étroites sont conservées. Chaque critique est un `CAttack` à part avec `DependOn` : pas de chance critique ni bonus multiplicatif inventé. La politique de l'intégrateur reste « contacts normaux seuls » jusqu'à résolution du moteur critique. Le contact normal aérien est `MAKECYLINDER([0,10,0],295,range)` ; le port commun a ensuite établi la hauteur complète295 et le rayon480, contact360° et frontières strictes. Voir work/melee-batch/native-mechanisms.md.

Léger 1 arrête MoveBox au toucher ; multiplicateur 1,7. Légers 2–4 : multiplicateur 1. Les cinq premiers contacts légers avant finisher utilisent push `[100,2000,-5000]`, **sauf le premier contact du léger 4 qui n'a aucune condition**. Le dernier léger 4 utilise blow `[3000,2000]` ; heavy blow `[3000,3000]`. Aérien : MoveBox 0, drop à 400 ms `[0,-3600,-6200]`, push au contact. Les réactions d'arène restent une calibration, pas une mesure de déplacement S5Runtime.

Le heavy et son critique **ne sont pas contrables** ; les autres contacts le sont. Les durées `SetDamageData` sont 200 ms pour léger, 800 ms pour heavy, 500 ms pour aérien, 0 ms pour critique ; les flags sont conservés. Heavy et aérien normaux prévoient guard crush, distinct du simple contre.

Les attributs normaux déclarent `effects/backattack_sword_s.seq` sur cible et décor ; sons `bsword_attack.ogg`, ou `bsword_power.ogg` pour l'aérien. Aucun `SetDamageSequence` propre n'est déclaré dans les blocs critiques. Les états déclarent `GhostTrail_counter_sword_01` et voix propres à chaque sexe ; aérien `weapon_counter_upper01.seq` / `bsword_counter.ogg` à 500 ms. Les modèles d'effets et sons déjà convertis sont référencés dans `COUNTER_RESOURCES` ; cela ne valide pas encore leurs sous-séquences ni leur reproduction native.

## Vérification et limites

Preuve du 3 octobre : `work/melee-batch/counter/tests.txt`, **40/40 tests réussis** avec `tests/counter-sword-data.test.mjs`, `tests/counter-air-drop.test.mjs`, `tests/counter-guard-dash.test.mjs`.

- Vraie `Controller`/`MotionGraph` : deux sexes, huit directions, quatre orientations, sept actions, changement Counter→Plasma→Counter et retour au repos ; IDs haut/bas contrôlés.
- Vrais assets des deux rigs : tous les clips requis présents, mixer évalué au repos, huit déplacements, attaque/retour/garde ; jambes réellement actives, transforms finies. Hiérarchie des deux pièces contrôlée après mixer : droite sous `R_Hand_Dummy`, gauche sous `Bip01 L Forearm`. Textures du modèle présentes.
- Ce contrôle de hiérarchie **ne valide pas** le grip, l'orientation visible ou la fidélité à une capture S5Runtime. Aucune correction globale de socket, ni mutation des assets source.
- Régressions spécialisées : impulsion aérienne et fin à l'atterrissage, garde pendant dash, relâchement/changement d'arme, plusieurs cadences.

| Contrôle | Résultat de ce passage |
|---|---|
| C01 sélection/changement | Changement automatique réussi ; observation UI à joindre par intégrateur |
| C02 huit directions | Mapping et vraie graph réussis deux sexes/quatre orientations ; observation visuelle à joindre |
| C03 attache | Parents/hiérarchie après mixer réussis ; grip/orientation exacts non établis |
| C04 visée verticale | Sans objet pour ces états mêlée sans triplet de visée source |
| C05 action mobile | Garde/dash et jambes testés ; observation à joindre |
| C06 effets | Déclarations + ressources conservées ; rendu exact non certifié |
| C07 traceur / C08 fumée | Sans objet : aucune balle ni fumée déclarée dans les états sélectionnés |
| C09 poussée | Paramètres bruts préparés ; calibration native non établie |
| C10 impact / C11 dispersion | C10 règles mêlée explicites ; C11 sans objet |
| C12 sons/secondaire | Garde/contre/aérien préservés ; écoute non réalisée par cet agent |
| C13 contacts | Données distinctes vérifiées ; collisions/consommation communes à vérifier au lot |
| C14 régressions/build | 40 tests spécialisés réussis ; build et gate communs à joindre au lot |

Prochain blocage natif : résoudre `DependOn`/calcul critique, durée demandée à CAnimParam et calibration des corps cibles. Condition de reprise : fonctions natives ciblées ou capture S5Runtime discriminante. Cela n'empêche pas le raccordement des boîtes normales ni la correction certaine des jambes.

## Correction du déplacement aérien signalé par l'utilisateur

Le 3 octobre, le cas depuis une grande hauteur reproduisait 29,76 unités S5 à dt16ms : le vecteur SetDrop persistait pendant les 600ms de récupération. Le code natif remet XYZ à zéro une fois à l'entrée en récupération, strictement après600ms ; la gravité reprend avec le terminal du drop conservé. `resetVelocityOnRecovery` raccorde ce comportement dans le contrôleur, uniquement sur l'aérien Counter. Aucun plafonnement de distance arbitraire ni modification du mouvement général.

Résultat : 7,1424 unités à dt16ms depuis les hauteurs10/30/100, contre29,76 depuis30 auparavant ; nominal continu7,44, limites quantifiées par les ticks. Un départ bas reste interrompu plus tôt par le sol. `tests/counter-air-native-motion.test.mjs` :4/4, 144 trajectoires, deux sexes/huit directions/trois cadences, reset unique, gravité, terminal, inputs et mur mince. Les six régressions aériennes existantes passent aussi.

Preuves : `work/melee-batch/counter-air-native-motion.md`, `counter-air-native/chain-static.json`, `counter-air-before.json` et `counter-air-after.json`. Limite explicite : factory dynamique exacte de left_jump non retracée ; CAttackState et la famille SwordJump native concordent sur cette transition.

Observations dans le jeu principal : captures `work/melee-batch/visual/counter-{male,female}-idle.png`, repos/marche/contact des deux sexes et `counter-male-air-recovery-090.png` / `counter-female-air-recovery-115.png`. PositionZ1,86 conservée pendant la récupération depuisZ9, alors queY descend ; clipR0033. Contacts à deux acteurs : deux coups, HP88,975. Le bilan commun contient build, suite globale et gates non prêts ; ces observations ne constituent pas une comparaison quantitative à S5Runtime.

## Trajectoire au viseur — retour utilisateur du 3 octobre

Chaque entrée du combo au sol et de l'aérien reçoit le point actuel du réticule dans le jeu principal. Correction complémentaire du 4 octobre : le point est désormais relu pendant le coup engagé, y compris l'attaque forte. L'angle horizontal est calculé depuis le personnage jusqu'à ce point. Après le déclenchement du drop, la vitesse horizontale existante est réorientée sans relancer l'impulsion ni augmenter sa durée. Le drop vertical Lua et sa récupération ne changent pas. Le verrouillage du cap pendant le coup était encore contraire au comportement demandé.

`tests/counter-reticle-heading.test.mjs` : deux sexes, huit directions, quatre coups, retouche du point après mise en attente, aérien et convergence sur un rayon de caméra déportée. Régressions communes : **362/362**, build réussi. Preuves et limites : [rapport](../../work/melee-batch-5/counter-reticle-heading.md). La direction demandée est confirmée par l'utilisateur ; le calcul de visée exact S5Runtime reste non certifié, et le gate natif est conservé.

Complément du 4 octobre : **224/224** tests Counter, mêlée, contrôleur et Chaser ; build réussi. Attaque forte et changement de cap pendant le drop vérifiés sur les deux corps et huit directions. [Preuves actuelles](../../work/counter-reticle-follow/README.md). Le suivi continu applique la demande utilisateur ; la politique native exacte de rotation reste non certifiée.
