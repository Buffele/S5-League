# Modes jouables S5 League

17 octobre 2026. Périmètre : Touchdown sur Station 2 modulaire, Deathmatch, Chaser, Battle Royal, Captain et Siege en session locale avec adversaires simulés, avec les limites expérimentales détaillées ci-dessous. Practice reste un diagnostic sur cartes partielles. Les ressources S5Runtime servent de source ; les règles sont raccordées au moteur S5 existant. Le catalogue des 24 modes et les preuves du client natif restent distincts dans `S5RUNTIME-MODES-NATIFS.md`.

## Accès et interface

**Parcours actuel,17 octobre2026 :** une entrée normale rejoint d'abord la salle
d'attente3D. Le personnage peut s'y déplacer ; le maintien du clic droit oriente
la caméra, tandis que le pointeur libre sert aux menus. Start lance la partie.
Pour les six modes compétitifs, les résultats et meilleurs scores restent
affichés15 secondes puis le retour à la même salle est automatique, sans bouton
Rejouer ni validation Entrée. Les mentions historiques de replay ci-dessous
concernent les anciennes vérifications et les entrées de diagnostic sans salle.
Practice reste partiel : son compteur expiré ne fabrique pas un résultat natif ;
sa sortie manuelle rejoint la salle si elle est jointe. Le diagnostic direct
sans salle conserve sa sortie vers l'entraînement libre.

Dans Équipement, choisir « Mode de jeu », puis l'équipe Alpha ou Beta en Touchdown/Deathmatch/Captain. Touchdown utilise Station 2 modulaire. Chaser, Battle Royal et Captain proposent l'arène, Circle 2 Azure et Circle 2 classique. Battle Royal est marqué « essais locaux » et n'utilise pas le choix d'équipe. Deathmatch conserve le choix de terrain. L'entraînement libre reste disponible.

URLs du jeu principal : `/?mode=touchdown`, `/?mode=deathmatch`, `/?mode=chaser`, `/?mode=battleroyal`, `/?mode=captain`, `/?mode=siege`. Practice utilise `/?mode=practice&scene=practice-52` ou `practice-54`. `team=beta` choisit Beta dans les modes par équipes. Les URLs `qa=modes` ajoutent des contrôles de vérification et peuvent entrer directement dans la partie ; `qa=modes&qaEntry=room` conserve explicitement le parcours par la salle. Ces contrôles sont absents des parties ordinaires.

L'interface utilise les ressources originales S5Runtime communes : police, HP/SP, équipement, compteurs, boutons, classement et glyphes de résultat. Le Chaser utilise les chiffres et silhouettes de son groupe XUI original. Les dispositions et les contrôles propres à S5 restent adaptés. Les scènes animées natives de victoire/défaite sont exécutées dans le résultat commun ; le réseau et l'économie du lobby ne sont pas reproduits. Voir [UI-S5RUNTIME-S5.md](UI-S5RUNTIME-S5.md). Tab affiche le classement en Deathmatch/Chaser/Battle Royal. R garde sa fonction de rechargement pour les fusils ; avec une arme de mêlée, il remet le joueur en jeu en Touchdown et compte une mort volontaire en Deathmatch/Chaser/Battle Royal.

## Touchdown

`touchdown-state.js` gère les équipes, la possession unique, le ballon au sol, les points, la mi-temps et le résultat. `station2-touchdown.js` raccorde les règles à la carte, aux personnages et aux collisions réelles.

- Un porteur vivant peut marquer uniquement dans le but adverse. Un but donne un point et ne peut pas être compté deux fois. Pendant la célébration, le buteur garde le contrôle de son déplacement et de ses sauts, avec sa caméra habituelle ; les autres personnages, le combat et la possession restent en pause.
- Limite de 8 points ; deux périodes de 10 minutes ; mi-temps à 4 points pour une équipe ou à la fin de la première période ; pause de but 10 secondes ; pause de mi-temps 35 secondes. Les valeurs de score/durée/pause proviennent de la référence locale `tools/s5runtime-local/local-modes.mjs`. Le chronomètre S5 compte le temps de jeu et s'arrête pendant les annonces.
- Les lasers appartenant à l'autre équipe tuent en un contact, même si une protection d'arme active l'invincibilité. Les lasers alliés laissent passer le personnage. Tout contact du porteur avec un laser, allié ou ennemi, renvoie immédiatement le Fumbi au centre et libère sa possession ; un laser ennemi tue aussi le porteur. Les volumes suivent chaque faisceau réel, avec les espaces entre faisceaux conservés ; un balayage détecte aussi les traversées rapides. Les triggers suivent la position, rotation et échelle des modules.
- Le Fumbi suit son porteur, tombe en cas d'élimination, peut être repris et revient au centre après 15 secondes ou sous le seuil de chute de la carte. Retour automatique du joueur mort après 4 secondes. R abandonne le Fumbi et remet les personnages à leurs bases : choix local S5.
- Le bot peut posséder le Fumbi, le perdre et marquer pour sa propre équipe. Sa navigation utilise les surfaces et obstacles de la carte actuelle ; son déplacement jusqu'au Fumbi est testé avec le vrai Controller. Ce planificateur et ses sauts sont S5, pas le pathfinding natif S5Runtime. Un parcours autonome complet jusqu'au but adverse, notamment entre les lasers, n'est pas certifié.
- Après un but, le Fumbi joue son clip, s'élève et tourne avec des anneaux S5. Si le joueur local marque, sa caméra continue de le suivre ; si le rival marque, la caméra montre la célébration côté terrain. La reprise réinitialise personnages, protections, attaques, effets et possession.

Les buts utilisent les deux Box `alpha_net`/`beta_net` relues dans `station2_td.scn` après décodage protégé et parsing strict des 41295 octets/20 objets. Les demi-dimensions source sont 150/62,69999695/150 unités natives, soit 0,9/0,37619998/0,9 après conversion `.006, -Z`. Les centres exacts et volumes restent attachés aux bases modulaires, y compris déplacées, tournées ou redimensionnées. Ces dimensions remplacent les anciennes valeurs manuelles X/Z ±1,35 ; Y −2,4/+1,5. `tools/prepare-station2-goals.mjs --check` vérifie checksum, empreintes, parsing entier, axes et génération ; la preuve compacte des enregistrements est dans `tests/fixtures/native/station2-touchdown-source-boxes.json`.

Le 17 octobre, une lecture mémoire seule d'une partie S5Runtime Touchdown active a corroboré les deux volumes source (écart inférieur à 0,001 unité native) et le corps par défaut : demi-dimensions 70/160/70, centre à la position du personnage +160 en Y. La capture indépendante est conservée dans `tests/fixtures/native/touchdown-bounds-20261017.json`. Le chemin statique `F5EA30 → F5EF72 → 119CEE0 → 119D830 → 11B4BF0` construit une Box du porteur à sa position courante puis teste les deux Box orientées ; il ne balaie pas sa position précédente et ne teste pas le Fumbi affiché. `touchdown-goal-contact.js` applique ce contact, avec les arrondis float32 et les frontières inclusives de la traduction existante du SAT natif. Les lasers gardent leur balayage distinct. Les tests couvrent les contacts de bord, les séparations, les faux positifs du précédent balayage, les buts tournés et les transformations modulaires.

Cette comparaison ne valide pas encore un but marqué physiquement dans S5Runtime : `nativeGoalScoredObserved` et `nativeTouchdownCompared` restent faux. Les formes alternatives du personnage, l'autre producteur de requête `72114D` et l'autorité serveur restent à établir. Le SAT traduit n'est pas un émulateur x87 bit à bit. Les règles de score ne sont pas déduites de ces seuls volumes.

Le changement de camps est désormais séparé de l'identité des équipes : `71A650/71A600` inverse les identifiants de scène1/2 dans les sous-états natifs2 et3. La lecture du client actif (`tests/fixtures/native/touchdown-halves-20261017.json`) confirme le drapeau de scène faux en première période, vrai après l'annonce de10secondes, puis encore vrai en seconde période après25secondes de pause. Cette observation utilise une transition contrôlée par le serveur local via `touchdown-half-time`, avec le véritable `LocalRound.halfTime()` et ses timers ; elle ne prétend pas constituer une partie entière terminée naturellement. La commande exige un propriétaire présent dans une première période Touchdown locale ; un second appel est refusé. Le lecteur `capture_touchdown_halves.py` est strictement VM_READ. Une première observation naturelle a été interrompue par la requête de sortie native2002/raison3 avant la mi-temps ; elle ne prouve que le sous-état1.

Dans S5, les buts visés, lasers, réapparitions, navigation de l'adversaire, distance du HUD, anneaux et palettes d'équipe des panneaux modulaires suivent ce changement, sans permuter les scores ni les équipes du classement. Un but qui provoque la mi-temps partage ses10secondes d'annonce avec la transition, puis attend25secondes ; l'ancien enchaînement10+35secondes ajoutait une attente. Les deux groupes de quatre marqueurs `alpha_spawn_pos_*`/`beta_spawn_pos_*` sont extraits du même SCN protégé et vérifiés horizontalement contre les positions natives des deux périodes. Beta utilise son propre groupe source, au lieu d'un miroir d'Alpha. Le placement vertical conserve la résolution S5 contre les surfaces réelles ; il ne certifie pas encore la marge exacte du solveur natif. Les textures décoratives fixes ne deviennent pas automatiquement des matériaux natifs à palette dynamique.

## Fumbi : ressource native et adaptation

Source `model/etc/ball.scn`, archive `package/76.xs`, CRC `bc73440a`, 159821 octets décodés, SHA-256 `659a517301bb53d9f18eb30bbdf746455950d40788ea29faa78bfaea39a3dd4a`. Preuves et extraction reproductible : `work/touchdown/sources.json`, `extract.py`, `prepare-fumbi.mjs`. L'installation S5Runtime n'est pas modifiée.

Le JSON public conserve désormais squelette, skinning, modèles rigides attachés aux os, textures, pistes de transformation et pistes natives de morphing/UV/alpha. Les cinq clips `base`, `mas_000`, `mas_001`, `mas_002`, `mas_003` sont disponibles et leurs poses sont testées. Le mixer applique les pistes visuelles et le rendu additif des matériaux concernés.

Correctif du 4 octobre : les animations ne sont plus remplacées partout par la danse. `mas_000` reste la danse au repos et en portage ; `mas_001` joue une fois à la prise, puis revient à la danse ; `mas_003` joue une fois à la perte/au retour, puis revient à la danse. Le but retrouve `mas_002`, joué une fois et maintenu jusqu'à la reprise. Les transitions de disparition/réapparition sont déduites des pistes alpha du corps dans `ball.scn` ; leur association précise aux événements S5Runtime n'a pas été retrouvée et ce raccordement reste une adaptation S5. Le faisceau conserve ses morphs, UV, alpha et position native, mais son axe est corrigé vers le haut après l'évaluation du squelette, indépendamment du clip. Les anneaux, la montée du Fumbi, la caméra et l'annonce de but restent des animations originales S5. Aucun équivalent natif exact de la célébration entière n'est revendiqué.

Correctifs du 3 octobre : le portage suit la position et l'orientation réellement affichées après interpolation du personnage. Le placement initial derrière le haut du dos a été corrigé le 4 octobre : attache centrée au-dessus de la tête (hauteur 2 ; recul nul). Les pistes de saut/rotation globale du clip natif sont neutralisées pendant le transport ; gestes, morphing et effets restent animés. Les données sources ne sont pas modifiées. L'enveloppe réelle du corps skinné est testée sur plusieurs boucles : dégagement au-dessus de la tête, corps visible et faisceau dirigé vers le haut. Vérification du 4 octobre : 31 tests dans `tests/touchdown.test.mjs` et `tests/touchdown-world.test.mjs`, build réussi et observation dans le jeu principal de la prise (`mas_001`), du retour à la danse (`mas_000`), du retour sur laser allié (`mas_003`) et du but (`mas_002`). Preuves : `work/game-modes/fumbi-states-live.json` et `fumbi-states-goal-upward.png`.

Le but conserve désormais l'identifiant du buteur, distinct de son équipe. Les touches de déplacement maintenues ne sont plus effacées lors de son but. La remise en jeu, la mi-temps et le résultat gardent leurs transitions normales. Vérifications des correctifs : `work/game-modes/touchdown-fixes-tests.log`, `touchdown-fixes-build.log` et captures/scénarios `touchdown-fixes-*` dans le jeu principal.

## Deathmatch

**21 octobre 2026 — reprise de mi-temps :** le décompte conserve désormais la
fraction de temps qui dépasse une frontière de période/pause. À la fin exacte
de la pause, le reset des acteurs a lieu sans avancer le combat ; une frame
qui dépasse la pause ne simule que sa fraction jouable. Auparavant, le combat
recevait aussi le temps de pause de cette frame et le chronomètre perdait son
excédent. Trois régressions reproduisent ces défauts avant correction ; les
155 tests ciblés Deathmatch/Chaser/Battle Royal et parcours de salle, ainsi
que le build existant, passent. Les durées et règles de score restent celles
déjà raccordées. Ce contrôle corrige l'horloge S5 ; il ne constitue pas une
nouvelle mesure du cycle Deathmatch dans S5Runtime. Preuves :
`work/game-modes/lifecycle-agent/DEATHMATCH-CLOCK-20261021.md`.

`combat-mode-state.js` et `combat-match.js` utilisent les contacts réels du moteur de combat existant. Une élimination valide rapporte 1 point à l'équipe et 2 points personnels. Une chute/mort volontaire ne donne pas de point à l'adversaire. Les décès ne sont comptés qu'une fois ; retour après 4 secondes. Limite 80 points ; deux périodes de 10 minutes, mi-temps à 40 points ou au temps, pause 35 secondes, résultat et replay. Référence : règle 1 de `local-modes.mjs`.

Scores d'équipe, compteur d'éliminations/morts, classement personnel, flux d'éliminations, mi-temps et résultat sont exposés dans le jeu principal. Les récompenses monétaires, assists et heal assists de la référence serveur ne sont pas raccordées dans cette session à deux participants.

Correctif du15 octobre : un contact létal entre alliés ne laisse plus le participant vivant dans les règles alors que ses HP sont nuls. Le callback natif3035→EE3BD0→11031F0 utilise les compteurs séparés teamKills(+B4)/teamDeaths(+B8), sans modifier kills/deaths ordinaires. S5 conserve ces catégories et permet le respawn ; aucun point personnel ou d'équipe n'est attribué. Cela ne prouve pas l'activation du tir allié par le serveur original. Preuves : `work/game-modes/lifecycle-agent/native-dm-team-kill.json` et `team-kill-regressions.tap`.

## Battle Royal

**Jouable en essais locaux, fidélité native incomplète.** [Contrat et limites détaillés](BATTLE-ROYAL-S5RUNTIME-CONTRAT.md). Trois acteurs indépendants se combattent sans équipes, y compris bot contre bot, via les contacts et collisions du moteur S5. Les bots poursuivent directement ; cette IA et leurs spawns sont des politiques locales.

La sélection XML native du mode9 donne50 points et10 minutes, sans mi-temps. Le score suit les branches natives retrouvées : élimination ordinaire+2, élimination du leader+5, leader qui élimine un adversaire+2 ; les catégories restent distinctes. Suicide−1 seulement si le score est positif. L'API d'assist native+1 existe, mais ses conditions de qualification automatique ne sont pas inventées ni raccordées à un seuil de dégâts arbitraire.

Le joueur et chacun des deux bots réapparaissent après4 secondes avec santé et actions réinitialisées : timing S5 local, non encore comparé en Battle Royal natif. Le classement est individuel, le leader est marqué, le chronomètre compte une période. Score limite ou temps écoulé bloque les contacts et commandes de combat, affiche10 secondes d'annonce issues de la référence serveur, puis le résultat. Bouton Rejouer et Entrée réinitialisent scores, catégories, acteurs et effets. Gagnant au meilleur score individuel et égalité au sommet sont des politiques S5 explicites. Le choix du leader au meilleur score, ses égalités stables et les spawns ne sont pas certifiés comme décisions du serveur original.

Modules : `battle-royal-state.js`, `battle-royal-combat.js`, `battle-royal-ui.js`, avec routage dans `main.js` et adaptateur `combat-match.js`. Vérification technique du15 octobre :123 tests ciblés réussis, couvrant notamment deux sexes avec vraies entrées Dagger, bot contre bot, obstruction par un mur, cible rifle la plus proche, respawns réels et résultat/replay ; build réussi. Preuves : `work/game-modes/lifecycle-agent/battle-royal-main-regressions.tap`, `battle-royal-main-build.log`, `battle-royal-main-report.json`. Le jeu principal passe24 scénarios/90contrôles navigateur, deux sexes : vraie attaque Dagger, leader, suicide, retour, limite de score, résultats victoire/défaite/égalité et clic réel Rejouer. Comparateur : `tools/compare-battle-royal-browser.mjs`, preuve `work/game-modes/battle-royal-browser-v1/comparison.json`. Les cartes BR natives, sons/UI spécifiques, règles serveur inconnues et une partie comparative S5Runtime restent ouverts.

## Captain

**Intégré en essais locaux ; parcours navigateur M/F vérifié, nouvelle UI à recapturer.**
[Contrat de preuve, sources et limites](CAPTAIN-S5RUNTIME-CONTRAT.md).
`/?mode=captain&weapon=dagger` ou le menu expose deux équipes et trois acteurs.
Une élimination de captain rapporte5points, une élimination ordinaire2points,
une manche gagnée5points personnels ; les compteurs restent séparés. Les
notifications d'assist/heal-assist natives donnent1point, sans qualification
automatique inventée. Suicide−1 uniquement si le score est positif.

La santé équilibrée de référence donne1000HP au joueur contre deux captains
à500HP. Un captain mort peut revenir à100HP comme combattant ordinaire après4s,
tant qu'un autre captain maintient la manche. Santé ordinaire/délai sont S5.
Manche180s, intermission5s, score limite5, neuf manches terminées au maximum,
annonce10s puis résultat et relance. Le contrat distingue les paramètres de
référence, le départage timeout Beta et l'ambiguïté de frontière ROUND_9.

`captain-state.js`, `captain-combat.js`, `captain-match.js` et `captain-ui.js`
sont raccordés dans le jeu principal et le menu ; santé, morts et contacts
utilisent le moteur réel. Tests après raccordement51/51 et build réussis dans
`work/game-modes/lifecycle-agent/captain-main-initial.tap` et
`captain-main-build.log`. Les136régressions de cœur précèdent le raccordement
final. Le parcours principal M/F passe26scénarios/128contrôles dans
`work/game-modes/captain-browser-v3/comparison.json`, dont Dagger et vrai Rejouer.
Le nouveau classement XUI/fonts/sprites est raccordé, avec catégories conservées,
40tests du lot et build réussis ; sa recapture reste ouverte. Cartes/UI animée/
audio Captain natifs et comparaison à une partie S5Runtime restent à faire.

## Siege : Iron Heart d'origine raccordée, mode complet encore partiel

Siege est raccordé au jeu principal et au menu. Le17octobre, Iron Heart151
rejoint le sélecteur avec ses neuf scènes d'origine et48textures DDS visibles.
Les trois OBB et leurs orientations ont été relus dans S5Runtime ; leurs slots
réels3/1/2 sont reliés au HUD1/2/3. Femme/Alpha capture3 et homme/Beta capture2
pour5points, par des déplacements et sauts normaux dans le build principal.
Spawns opposés, retour salle, redémarrage et respawn sont raccordés.
Preuves : `work/ironheart-main-integration-20261017/DELIVERY.md`.
[Contrat, sources et limites](SIEGE-S5RUNTIME-CONTRAT.md).
`siege-state/combat/match/ui` relient les vrais déplacements, contacts, HP,
jauges et récompenses. Le prédicat de présence est le SAT OBB/OBB natif retrouvé,
avec dimensions de capture/assist et acteur du point3 IronHeart historique.
La translation des volumes sur les autres cartes reste une politique locale.
Sur Iron Heart, les trois couples core/assist utilisent directement les
centres, dimensions et axes du relevé natif. La carte est chargée dans S5 ;
shader, animations de décor, masques natifs exhaustifs et sélection serveur
des spawns ne sont pas certifiés.

109régressions modes passent, build réussi ;70champs entiers et ownership
des anciennes captures natives sont comparés avec les fixtures S5. La première
comparaison a révélé la neutralisation manquante des points au résultat ; elle
est corrigée, et l'échec est conservé. Rapports sous
`work/game-modes/siege-recovery/`. Ce sous-ensemble n'est pas une nouvelle partie
native comparée. Le navigateur principal passe24scénarios/116contrôles M/F,
avec Dagger, présences OBB et vrais Rejouer, dans siege-browser-v1/comparison.json.
Le nouveau classement XUI conserve les colonnes/catégories et affiche Point1
avec drapeaux natifs aux UV vérifiés ; sa recapture reste à faire. Upkeep/
time_bonus, vrais buffs, présentation animée et match multiclient restent ouverts.

## Practice : diagnostic principal sur cartes originales partielles

Le mode natif4 est distinct de l'entraînement libre. État du code relu le
17 octobre : le menu principal expose Practice comme diagnostic partiel et
charge `practice-session.js` sur les cartes originales récupérées52/54. Les
vrais Sentry, leurs contacts/HP diagnostiques, sons et effets raccordés sont
utilisés. Les options254/50/75/100 conservent les couples durée/attributs source ;
254 signifie points illimités. Les scènes absentes restent déclarées.

L'ancien `practice-state/combat/match/ui` à cibles S5 ne constitue pas le mode
actif. La session principale ne produit ni score natif ni victoire/résultat,
et la santé du joueur reste inconnue. Le temps expiré reste un état diagnostique,
avec sortie/reprise manuelles. Ne pas raccorder la conclusion du prototype à
la place des producteurs natifs absents.

Lire [PRACTICE-S5RUNTIME-CONTRAT.md](PRACTICE-S5RUNTIME-CONTRAT.md) et
`work/practice-playability/DELIVERY.md` pour les observations acquises et les
limites de rendu/performances. Une comparaison native complète et le mode
terminé restent à livrer ; aucun gate de fidélité n'est ouvert par ce raccordement.

## Chaser

**Adaptation locale en cours, non validée comme reproduction complète de S5Runtime.** [Contrat natif, corrections et limites](CHASER-S5RUNTIME-CONTRAT.md). Vision rouge, cible bonus, auras, ventilation du score, classement des dégâts, paramètres Devil adaptés et audio sont maintenant raccordés. Les points d'attaque/soin natifs, clips MD événementiels et caméras restent non établis ; les tests valident les éléments présents uniquement.

Durée d'une manche : 60 secondes + 10 secondes par participant au-delà de six ; préparation initiale 7 secondes, suivantes 4 secondes. Sources : `native-mode-protocol.mjs`, fonction `chaserNativeRoundTiming` (0x1094530), et `native-chaser-round.mjs`.

Correctif du15 octobre : préparation et jeu consomment la même échéance, comme le scalaire initial durée+préparation de1094530. Les fractions de tick dépassant une transition ne sont plus perdues ; le moteur de combat reçoit seulement le temps jouable restant. L'horloge pure sait répartir8,25s en7s de préparation et1,25s de jeu ; cela n'autorise pas un appel Controller de1,25s, dont le maximum est1/30s. Le jeu principal et les fixtures navigateur avancent donc par petits pas. Le premier scénario QA à grand delta direct a échoué et sa preuve reste conservée ; le coordinateur l'a corrigé sans modifier les règles. Le calcul ne prouve pas la politique du serveur original lorsque la limite globale tombe pendant une préparation. Preuves : `work/game-modes/lifecycle-agent/report.json`, `tests.tap` et série navigateur consolidée par le coordinateur.

Le rôle tourne entre les participants. Un Chaser gagne 2 points par survivant ordinaire éliminé, 4 pour la cible bonus, y compris en cas de chute/suicide du poursuivi. Après élimination de la cible, une autre cible vivante est désignée. Si le Chaser est vaincu ou si le temps de manche expire, chaque poursuivi initial reçoit 5 points et chaque survivant encore vivant 10 points supplémentaires (15 au total pour un survivant des deux groupes). Pas de respawn pendant une manche. Fin de manche, nouvelle préparation, rotation, résultat au temps global et replay sont raccordés.

Politiques locales déclarées : rotation déterministe, match de 20 minutes, intermission de 5 secondes, cible bonus choisie parmi les survivants au plus haut score (départage stable), aucune pondération par familier. Le preset 1000 HP/dégâts ×3 est remplacé par la baseline S5 100 HP et une adaptation des paramètres Devil de `slaughtertagattribindexer.lua` : attaque `(dégâts+3)×4`, dégâts reçus `(dégâts+2)×0.1`, récupération `(récupération+2)×3`, vitesse ×1.3, rechargement −40 %. Les valeurs d'armes et d'énergie restent S5 ; application native complète et HP natifs restent à établir. Le changement de rôle et la sortie du mode retirent ces modificateurs.

Chaser est sélectionnable sur Circle 2 Azure, Circle 2 classique et l'arène. Deux bots sont ajoutés automatiquement : trois participants avec contrôleurs, HP et mixers distincts. Le rôle tourne entre Toi, Bot 1 et Bot 2. Les survivants ne se blessent pas entre eux ; le Chaser peut toucher chacun des deux adversaires, y compris bot contre bot. Les balles choisissent la cible la plus proche sur leur rayon et restent bloquées par les murs. Les bots poursuivent ou fuient directement, sans planification de chemin à la demande de l'utilisateur : ils peuvent rester bloqués ou tomber sur les cartes à étages. L'interface affiche les deux bots et leurs rôles dans le classement, leurs barres de vie, le meilleur score adverse et les deux chronomètres.

Présentation Chaser : le monde 3D passe en noir et blanc à fort contraste lorsque le joueur local possède le rôle (préparation et jeu), et les ennemis vivants apparaissent en rouge. Un masque des personnages conserve la profondeur du décor. Retour à la couleur à sa mort, entre les manches, dans le menu ou après un changement de mode. Le filtre s'applique après le rendu de la scène ; l'UI S5 garde ses couleurs. Le contraste 1,85 et le shader sont S5.

Les deux auras natives de cible et l'effet de présence `ggrim` suivent les personnages affichés ; marqueur S5 au-dessus de la cible bonus et indication sur sa barre de vie. Sons natifs de rôle, cible, kill, préparation et manche raccordés à des événements S5. HUD original : identité de cible, avertissement personnel, gains séparés, classement des dégâts et bilan de manche. Les dégâts affichés sont les HP réellement retirés ; leur conversion en points d'attaque n'est pas inventée. Assists comptées par contributeur vivant sans bonus de score non établi.

La caméra locale recule à 6,5 pendant ce rôle. La faucheuse est translucide (50 % pour le joueur, 75 % pour un bot) et se dissipe davantage si un mur rapproche la caméra, pour garder le personnage et le terrain lisibles. Ces réglages sont des adaptations S5.

L'entité visible est le modèle natif `model/slaughter/grimreaper.scn` : squelette de 82 os, six modèles dont corps skinné, faux et éventail, textures natives `grimreaper`, `scythe`, `fan`. Extraction authentifiée par longueur, CRC et SHA-256 dans `work/chaser-visuals/sources.json` ; conversion reproductible via `extract.py`, `prepare.mjs`, `prepare-textures.py`. Le modèle remplace le simple anneau et suit le personnage réellement affiché, joueur ou bot, après interpolation. Il est réutilisé lors des rotations et changements de map. Le clip natif `base` boucle ; les neuf clips MD sont conservés mais leur mapping aux événements n'est pas établi. L'échelle `.006` et l'offset d'attache sont une adaptation S5, sans revendication d'égalité exacte avec le client natif. Tests et contrôles visuels : `tests/chaser-presentation.test.mjs`, `work/chaser-visuals/tests.log`, `checks.json`, `local-chaser.png` et `bot-chaser.png`.

## Chargement et changement de carte

Le menu change maintenant la carte, le mode et l'équipe sans recharger la page. `MapSession` conserve les mondes complets visités dans l'onglet : géométrie, textures, collisions, animations et présentation. Seul le monde actif est attaché à la scène. La première visite charge la nouvelle carte ; un retour réutilise son instance. Le contrôleur reconstruit sa collision et revient au spawn de la carte, avec annulation des anciennes attaques et effets. Les personnages de l'arsenal, sons décodés, effets et textures partagées restent dans la session ; les règles du match sont réinitialisées.

Les JSON partagés et textures de personnages dédupliquent aussi les chargements concurrents. Un chargement refusé peut être retenté ; une erreur de nouvelle carte conserve la carte courante. Le cache est en mémoire pour la durée de l'onglet ; actualiser la page ou changer le corps/la tenue reconstruit la session. Les cartes visitées restent en mémoire pour permettre le retour rapide.

Vérification : aller-retour Azure → classique → Azure via le menu, sans navigation de document, avec identifiants DOM d'avatar et de carte identiques au retour. Tests dédiés : `tests/map-session.test.mjs`, `tests/avatar-cached-rig.test.mjs`, `tests/chaser-combat.test.mjs` ; rapports `work/game-modes/session-loading-*`.

## Vérification et limites

Tests ciblés : `work/game-modes/mode-tests.log`, 34 tests passés. Ils couvrent scoring, doublons, possession, retour, lasers des deux équipes, modules déplacés/tournés, animations finies, morphing/UV/alpha et orientation du Fumbi, navigation jusqu'au Fumbi, hooks de dégâts réels, préparation Chaser, rotation, suicide et nettoyage des adaptateurs. Les tests purement temporels ne remplacent pas le contrôle visuel.

Jeu principal : `work/game-modes/*-checks.json` conserve les scénarios contrôlés ; captures `touchdown-goal.png`, `deathmatch-playing.png`, `chaser-preparation.png`, `chaser-rotation.png`. Les fixtures positionnent les acteurs et raccourcissent les timers ; la fixture d'élimination immobilise le rival, baisse ses HP à 1 puis utilise une vraie entrée d'attaque et le solveur de contact. Ce sont des contrôles du raccordement, pas une partie réseau ni une comparaison visuelle avec S5Runtime.

Lancement normal Touchdown vérifié depuis le menu, sans `qa` : chronomètre actif, bot porteur, chute/retour du Fumbi et retour au menu par Échap ; capture `work/game-modes/touchdown-live.png`.

Build : `work/game-modes/build.log`, réussi. Régression générale : `work/game-modes/tests.log`, 1702/1706 tests passés avant les derniers contrôles supplémentaires. Quatre échecs restent dans les contrôles de staging Breaker/Revolver : tailles/manifeste des animations Breaker, modèle Breaker, séquence d'effet Breaker et statut d'import Revolver. Les assets et gates concernés ne sont pas modifiés dans cette tâche pour faire passer ces contrôles.

**Multijoueur non raccordé** : aucune salle réseau, autorité serveur, synchronisation entre clients, matchmaking ou authentification de score. Touchdown et Deathmatch utilisent un bot local ; Chaser et Battle Royal en utilisent deux. Les codecs et preuves S5Runtime local ne deviennent pas automatiquement un protocole S5. La physique, les dégâts d'armes et les réactions restent ceux du moteur S5 existant et de ses fiches d'import.
