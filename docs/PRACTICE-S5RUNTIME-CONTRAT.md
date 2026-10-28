# Practice4 : session principale partielle et sources

**État relu dans le code le 17 octobre 2026 :** Practice est sélectionnable
dans le jeu principal, avec les cartes partielles 52/54 et les véritables
Sentry récupérés. `main.js:preparePracticeSession` utilise
`createPracticeSession`, et non l'ancien `createPracticeMatch` à cibles S5.
Les options natives pilotent le temps et les attributs Sentry. Score,
santé du joueur, perception/attaque et conclusion natives restent incomplets ;
expirer le temps ne produit pas de résultat. L'ancien prototype ne doit pas
remplacer ces producteurs manquants. Voir
`work/practice-playability/DELIVERY.md` et
`work/practice-playability/completion-sources/HANDOFF.md` pour les preuves
navigateur déjà acquises et les conditions de reprise. Aucune reproduction
complète ni nouvelle comparaison native n'est annoncée.

Les sections datées du 15 octobre ci-dessous conservent l'historique de
récupération et de staging ; leurs mentions « main à intégrer » sont
supersédées par la session principale ci-dessus.

Practice4 est distinct de l’entraînement libre S5 et des modes Training13,
CombatTraining16/17/18 et WeaponTraining19. Le XML `_eu_gameinfo.x7` le déclare
avec un participant, première option254points/4minutes et `use=false`. Les
cartes déclarées51–55 n’ont pas été chargées dans S5. L’option254 est
explicitement `score_string_key="UNLIMIT"` ; elle ne termine pas à254points.
Les options50/75/100 correspondent respectivement à5/6/7minutes.

## Source native et référence

`work/game-modes/practice-recovery/trace-source.py` vérifie le PE copié
SHA256`6bea9d8cc2503a1e660c1d8a9dfd1241f394207c4f1cb84a9d4a1fea3d3c8017`,
le XML et les extraits Netsphere. Il lit uniquement les fichiers.

Le constructeur DD69D0 produit la règle/vtable1443F88. Le joueur natif conserve
un seul mot d’extension à+A4, décodé par1117560 et remis à0 par11174D0.
La route mission vtable+CC→DD6CB0→11062A0 ajoute l’incrément reçu au compteur
du participant et au score de son équipe. Get/set :10D7DD0/10D7E10.
Le callback kill ordinaire reste1075920, qui actualise le bookkeeping commun
des armes : il ne prouve pas une attribution directe au compteur Practice.

La référence Netsphere `Practice.cs` donne1point/killed target au joueur et
à son équipe, termine au score limite, ne comporte pas de mi-temps et retourne
0PEN/EXP. Sa notification mission donne1 mais ne prouve pas le producteur
original de mission dans S5Runtime. Le prédicat natif11063C0 teste explicitement
l’optionFE(254), cohérente avec le label UNLIMIT du XML. Le script mission
original est désormais retrouvé et décrit ci-dessous ; sa liaison runtime
aux acteurs sentry/notifications réseau n’est pas encore exécutée.

## Missions et ressources retrouvées

`trace-mission.py` authentifie13fichiers par longueur/CRC/SHA intégraux.
`map.x7` déclare les cartes51–55 avec `mode_number=4` et un joueur.
`mission_list.x7` relie ces mêmes IDs à `exercise_mission_station1.lua`.
Celui-ci enregistre un stage, un message initial, une alarme5000ms, puis une
alarme répétée2000ms. Le binder natif est maintenant établi : B2FD10 compare
strictement elapsed>delay ; B30650 émet avant de relire repeat puis remet le
timer à zéro. B306D0 désactive aussi repeat. Le driver/ordre de stage reste ouvert.

L’événement26 de destruction alimente `GetScoreAdder(...,1)` et le compteur
de cibles, limité à10. Les45noms `trg_box1_1`→`trg_box9_5` ont chacun5variantes,
soit225notifications enregistrées1000–1224. Le binder random reçoit pourtant
1225comme borne brute : B42DE0 prouve la borne INCLUSIVE.1225est donc un résultat
sans SpawnHelper enregistré, conservé sans wrap. B46CE0 prouve aussi l’aléa300 :
deuxtirages indépendants rand()%300-150 en X/Z, carré[-150,149], pas un rayon.

Limite de fidélité supplémentaire : GetScoreAdder est enregistré et construit,
mais ses callbacks bound B43BE0/B43C00/B43C10 sont des corps return1 sans call
dans le PE copié. Le script décrit l’intention ; l’attribution native effective
n’est pas établie. Une éventuelle redirection runtime doit être vérifiée par le
circuit natif du coordinateur, pas remplacée par un point S5 présenté comme natif.

Les options254/50/75/100 sélectionnent les types sentry5/6/7/8, HP30/50/70/90,
avec leurs propres timings et dégâts dans `sentrygunattribindexer.lua`.
Le modèle `SentryGun.scn`, troisSEQ et troisOGG sont récupérés CRC/SHA.
Le SCN et laSEQ de destruction passent le parse EOF ; les deuxSEQ waiting/attack
échouent au NodeLoader (compteur1701080910àoffset144), sans substitution.
CinqDDS candidates aux noms de textures TGA sont également authentifiées ;
leur normalisation par le loader reste à confirmer avant publication.

`practice-mission-plan.js` fournit les options et enregistrements exacts ;
`practice-spawn-location.js` fournit les matrices natives des135nœuds des
cartes52/54/55. Les scènes `ms_station.scn`, `ms_station01.scn`, `ms_tunnel.scn`
passent EOF et contiennent chacune les45nœuds attendus. Les scènes des cartes
51/53 sont absentes de l’index actuel ; aucune autre carte ne les remplace.
Ces modules ne créent pas encore de sentry, timer natif ni carte rendue.

## Modules proposés

`practice-state.js` sépare notifications mission et éliminations de référence,
avec déduplication commune par événement/cycle de cible ; aucun double point.
Le compteur+A4 et le score équipe avancent ensemble. Les morts locales restent
distinctes, sans inventer de champ natif de morts/suicides ni de pénalité.
Temps, limite, annonce, résultat et reset fonctionnent sans mi-temps.
254reste illimité même après300points dans le test ; les limites finies utilisent
leurs durées XML sauf override explicite de fixture.

`practice-combat.js` et `practice-match.js` réutilisent vrais Controllers,
contacts, collisions, HP et animation graph existants. Deux avatars passifs
servent de **cibles S5**, et non de joueurs supplémentaires dans une room
Practice ni de NPC natifs importés. Une mort de cible provoquée par le joueur
produit une notification mission1 locale ; chute de cible ne donne pas de score.
Le retour4s, les spawns sur la carte courante et le pont mort→mission sont des
politiques S5 explicites. Le temps simulation reste≤1/30s. Résultat bloque les
contacts/commandes ; reset remet les cibles, actions, HP et générations à zéro.

`practice-ui.js` expose points, missions/éliminations de référence séparées,
morts locales, temps, limite, annonce, bilan et bouton Rejouer. Elle porte
« essais locaux » et les limites cibles/cartes ; disposition S5, sans scène UI
Practice ni sons natifs revendiqués. Résultat au temps est une fin de session
neutre ; score atteint donne un objectif S5 atteint, pas une victoire native.

## Vérification et reprise

Les tests état et adaptateur couvrent vraies entrées Dagger de Controllers
homme/femme, contact unique, retour réel des cibles puis nouvelle élimination,
mur bloquant le contact, cibles passives, chute/respawn local, verrouillage du
résultat et reset. Les avatars des tests d’adaptateur sont des doubles de rendu ;
ils ne prouvent pas les clips, les meshes ou un rendu navigateur Practice.
Le test séparé `mode-replay-pose.test.mjs` charge les vrais rigs M/F pour le
correctif de reset partagé, indépendamment de l’intégration du nouveau mode.

À établir : driver des triggers et attribution native effective, vrais acteurs sentry et leurs
attaques/collisions, chargement des cartes, scènes51/53, politique serveur de
conclusion, UI/audio et comparaison native. Les noms/attributs/scripts sont
des sources récupérées, pas une jouabilité observée. Aucun gate n’est ouvert.

Lot mission :18tests Practice,17tests Conquest et1test rigs replay, soit36PASS,
dans `mission-regressions.tap` ; build PASS dans `mission-build.log`.
Raccordement et scénarios précis : `work/game-modes/practice-recovery/INTEGRATION.md`.

Lot binders suivant :7enregistrements et25fonctions natives authentifiés,
45exports Ghidra à entrées concordantes. `practice-trigger-timing.js` porte
alarme/random/quota comme consommateurs isolés ; `practiceSentryLocation`
applique les tirages natifs explicites. Aucune notification de score ni NPC
fictif n’est généré.24tests Practice,22Conquest,1rig =47PASS (binder-regressions.tap),
build PASS (binder-build.log). Preuve : binder-source.json.

## 15 October — geometry and real Sentry adapter staged

See `work/game-modes/practice-recovery/RENDER-HANDOFF.md` and `render-proof.json`.
62 outputs prepared under work from73 authenticated source files, no public publication.
Actual recovered map52 collision5291 triangles / map54 collision3052 triangles;
map55 blocked without collision scene, no fabricated floor.14 INI references plus
2 absent spawn scenes rechecked across170 actual local XS archives/111312 entries
and3 alternate indices, zero read failures and no matches. Sentry9 meshes/14 bones
and literal animations retain source hierarchy/scale. M/F actual Controller Dagger
events contact real triangles, dedup and replay tested. Default scoring none;
optional local-destroy stays explicit local policy, no native score/ACK/winner.
55 combined Practice/Conquest/real-rig tests and build PASS. Browser/native/main
integration and complete Practice mode remain unverified/incomplete.

## 15 October — Sentry state/animation consumer and effects recovered

The previous waiting/attack SEQ parse blocker is superseded. Native NodeLoader reader115F8B0 reads its substructure only for version>=float32(.3); the shared parser incorrectly consumed it for0.1. A staged minimal patch now parses both Sentry sequences to exact EOF and preserves all fields on twelve existing Breaker/UI sequences. Root owns shared-parser promotion.

New reserved modules src/practice-sentry-behavior.js and src/practice-sentry-profiles.js provide an executable native state consumer and real Sentry model driver. Proven state/clip pairs:0Creation/S1,1Normal/S4,2Reload/S5,3Attack/S2,5Destruction/S3. SetTime fields, strict DWORD elapsed>delay, ordered HP==0, reload target/no-target branching and delayed destruction removal are source-backed. Perception/head/impact services and actor+6C remain explicit bindings; source pose-clock composition/blending is not replaced by a hidden default. Tests identify their raw-source-seconds pose fixture.

Five childSCN/177meshes and elevenDDS are authenticated; threeSEQ structures, five modelJSON, elevenPNG, profiles and bundle yield21preparedoutputs. No public/main import added. Original BMP/TGA names and sentrygun_loop.ogg absent after170archives/111312records+3indices, zero read failures; DDS candidates/particle preference separated, no replacement sound/clip/node.

83tests PASS and build PASS. Evidence and exact API/lifecycle integration: work/game-modes/practice-recovery/sentry-behavior-staged/HANDOFF.md and proof.json. Ten new tests include actual M/F Controller Dagger contacts on Sentry triangles, real source poses, delayed removal/replay, cue cleanup and parser/resource regressions. No browser/native rendering or full Practice mission certified. Passive adapter must preserve dying actors until removal instead of hiding/reusing their slots immediately. Scoring/conclusion remains a separate unresolved producer.

## 15 October — driver Sentry intégré à l’adaptateur

practice-sentry-adapter.js instancie désormais le driver sur chaque vrai modèle. Un contact réel HP0 retire la cible du quota vivant et, sous le gate local diagnostic déclaré, échantillonne immédiatement S3 sans avancer le joueur. Le modèle reste visible à3000ms exact puis est retiré après strict>3000ms. Les acteurs en destruction gardent leur modèle ; des clones synchrones source permettent10vivants+10destructions, sans confondre quota vivant et nombre total. Replay nettoie cues/drivers, conserve les dix slots initiaux et dispose les surplus ; générations/contact périmés et reset/sortie sont testés.

practice-sentry-ports.js expose les services manquants comme unbound/unknown, pas comme des réponses natives. Perception/impacts/head/audio/canaux restent à raccorder ; gate6C=false et horloge source brute par défaut sont explicitement des politiques diagnostic non prouvées. Aucun nearest-player, outgoing-hit, son substitué ni score/ACK natif ajouté. scorePolicy:none reste le défaut.

La régression parseur utilise désormais le canonique contre15JSON antérieurs hashés (5Breakerpublic+10UI), et non deux parseurs identiques après promotion root. Passation actuelle : work/game-modes/practice-recovery/sentry-adapter-integration/HANDOFF.md. Les anciennes limites adapterpassif sont supersédées, les anciennes preuves restent historiques. Intégration main/navigateur/natif et conclusion Practice restent ouvertes.
# Sentry : perception, visée et orchestration source du15octobre

Lot courant : `work/game-modes/practice-recovery/sentry-native-v3/HANDOFF.md`
et `proof.json`. Deux consommateurs propres ajoutés, raccordables par
`createSentryPorts` : `practice-sentry-perception.js` et
`practice-sentry-gameplay.js`. Le vrai adaptateur/driver possède maintenant des
hooks post-mixer et cleanup par génération. Les ports absents restent inconnus.

Source fermée : sélection ordonnée par distance² et stable à égalité, filtres
bruts1C4/D4/HP, peer64 avec high16 requis, SetRange20000/120/40, obstruction
type4/mask210FC0, demi-hauteur de cible, origine native(0,170,-50), NeckBone et
direction horizontale/complète ; begin/tick/end des quatre composants.
15exports exact-entry,43corps CFG bornés, deux constant_info CRC/longueur/SHA.
La multiplication D3DX respecte l'ordre décrit par la
[documentation Microsoft](https://learn.microsoft.com/en-us/windows/win32/direct3d9/d3dxquaternionmultiply).

102tests passent, dont11nouveaux (vrais triangles, vrai modèle Sentry,
Controller/positions homme et femme, attaque→destruction→replay) ; build PASS.
Ces preuves sont offline. Les bits, IDs et HP bruts des cibles dans les tests
sont des entrées explicites, pas une validation de leur mapping natif.

**Dégâts sortants non produits** :56D890/56E870,570130 et54FCA0 restent les
consumers/gates à fermer. Aucun dommage2/4/6/10 déduit du seul profil ni de
raycast local. Registre, querydispatcher/classement/Shield, scheduler des
contrôleurs NeckBone/horloge et ScoreAdder/conclusion demeurent distincts.
Sans leurs producteurs, aucune victoire, aucun ACK ou `nativeReady`.

## Sentry : contacts et réception des dégâts, lot v5 du15octobre

La passation `work/game-modes/practice-recovery/sentry-native-v5/HANDOFF.md`
supersède les limites de récupération56E870/570130/54FCA0 ci-dessus : trois
exports terminés,28corps bornés et vrais slots Sentry établis.56E870 est un
résolveur générique ;570130 une recherche d'attribut ;54FCA0 une condition Push.
Leurs noms d'exports sont des labels d'analyse, pas des symboles natifs.

`practice-sentry-impact.js` porte filtres bruts, distance au centre d'acteur,
partition obstruction type4 et pipeline injectable. Les égalités qsort et
passes primaires/critiques non résolues restent inconnues. Les paramètres
Sentry8/16 et single-hit ne deviennent pas une règle Grenade/explosion.
`practice-sentry-attack-clock.js` porte le sous-ensemble timers source, avec
quatre composants, pauses/gates explicites et seuil strict ; pas de tir infini.

Le vrai adaptateur reçoit désormais `receiveSourceDamageRecord` par génération.
Le consumer Sentry typé prépare le record, applique ses conditions, lit sa
puissance effective puis applique le préfixe HP de97FA20 sur la vraie cible.
HP0 utilise S3 et le retrait strict>3000ms existants. Les effets de bord restants
de97FA20 restent séparés. Aucun slot Sentry n'est attribué au joueur : ses
tables source connues possèdent d'autres B8/F0/268, classe live non établie.

115tests et build PASS, dont13nouveaux avec vrais triangles, Controller/M/F,
modèle Sentry, HP→destruction→cleanup→replay. Les records, gates et7.25HP des
tests sont des fixtures injectées, aucune mesure native des dégâts. Le
checkpoint102tests v3 reste historique. Producteur de puissance/protections,
réception joueur, scoring/conclusion, scheduler et comparaisons navigateur/
S5Runtime restent ouverts : mode complet et `nativeReady` toujours non prêts.

## Entrée session concrète et assets publics,15octobre

`src/practice-session.js` réutilise les vrais Controller/rig/MotionGraph/audio
et les scènes sources52/54, avec politiques diagnostiques obligatoires.
83sorties sont publiées sous `public/assets/s5runtime/practice/` après89contrôles
sources CRC/longueur/SHA ; le manifeste conserve les4/5scènes manquantes.
Les trois OGG originaux sont consommés par le contexte audio partagé après
unlock utilisateur, gains sfx et cleanup réel. Le son loop absent est inconnu.

La session fournit step/render/replay/exit, pose rig immédiate àdt0, contacts
mêlée sur le vrai Sentry et aucun double tick en présentation gérée par main.
Les nouveaux état/UI affichent deadline expirée et diagnostic partiel sans
produire de score, résultat, victoire ni ACK. Perception/visée source sont
injectables ; les producteurs acteur absents restent visibles, sans nearest-
player ou faux rôle. Ranged/projectiles Sentry et renduSEQ restent non raccordés.

Patch main isolé et non appliqué :
`work/game-modes/practice-recovery/main-entry-staged/main.patch`.
Passation/API/limites/critères navigateur : HANDOFF.md dans ce dossier.
133tests PASS dont18nouveaux vrais rigs/Controller/cartes52/54, sons originaux,
contacts, destruction/replay/cleanup. Préparation/activation explicites : les
vrais consommateurs main conservent ancien match/HP/Controller/rig/UI/audio
sur échec asset/décode/warm. Deux null-guards caméra et gates Play/sessionBusy
sont couverts. Build actuel et syntaxe/applicabilité du
patch passent ; aucune observation navigateur/native ni mode complet annoncé.

## Effet de destruction Sentry raccordé,15octobre

`practice-session-effects.js` consomme les quatre émetteurs originaux de
`mapeffect_blast_glass.seq`, textures et champs authentifiés, via le moteur
Particles/Sequence existant sous politique de rendu diagnostique explicite.
Le join source Sentry AF1BE0→AFF110→vtable13F8EE4/AFF160 emprunte actor+70,
distinct du descripteur Shield qui alloue un clone. Racine réelle du modèle,
horloge entière, propriétaire acteur+génération, début à0sans dtantérieur,
stop/replay/retrait3001/exit et libération ressources propres sont raccordés.

Attente/attaque restent inconnues : animation NodeLoader vide et consommateur
NodeControl/attaches non établis. Aucun clip1 ou effet de remplacement choisi.
Caméra requise via getCamera ou render(...,{camera}) ; hook main une ligne
préparé sous `sentry-effects-staged/`, non appliqué par cet agent. Le test des
six consommateurs importe désormais src/main.js réel, historiques conservés.
140tests et build PASS ; testsM/F52/54 couvrent les vrais FX0→3000→cleanup3001.
Pixels/browser/native, échelle/billboard/RNG/scheduler exacts restent non
certifiés. Passation complète : `sentry-effects-staged/HANDOFF.md`.


## Tirs Hand Gun, Assault Rifle et Burst vers Sentry, 15 octobre

Le résolveur Practice consomme les vraies queues de tirs après le mixer et les
sockets originaux. Collision carte réelle et consommateur Shield source bornent
le rayon avant les triangles rendus du Sentry. Les quatre contacts Burst sont
résolus avant tout HP. Les mêmes contacts finalisés alimentent les vrais effets
d'armes existants, l'impact audio et la destruction Sentry S3/SEQ/OGG, puis retrait
strictement après3000ms. Replay, génération et sortie nettoient la session.

La formule source de distance est réutilisée ; AdditionalPower absent vaut zéro
selon une politique locale nommée. Les HP passent par applyContact diagnostique,
jamais un faux CDamageRecord : préparation/conditions/défense/gates et volume NPC
natifs restent non établis. Aucun Push, score, résultat, victoire ou ACK ajouté.
Autres armes/projectiles restent non raccordés et le statut le précise.

Modules Practice promus ; main reste à intégrer par root avec deux hooks isolés
sous work/game-modes/practice-recovery/ranged-entry-staged/main.patch. Le yaw
session-owned réutilise désormais setAvatarFacing comme le vrai main. 99tests
ciblés PASS (23nouveaux), build2,43s PASS. Six parcours exécutent le corps exact
animateAvatar du candidat main avec vrais rigs/Controller/effets ; la preuve est
staged et ne constitue pas une observation du main livré/navigateur/S5Runtime.
Passation, empreintes octets et critères root : ranged-entry-staged/HANDOFF.md.
