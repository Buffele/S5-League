# Conquest — checkpoint du 24 octobre : correction Dagger et contacts optimisés

Les huit vagues restent raccordées au jeu principal. Le lecteur des enables des
contacts statiques passe désormais directement la clé au seul callback privé
authentifié du compilateur Conquest. Le callback générique conserve ses objets
metadata et tableaux frais. Les lectures `active`, identités, enables courants,
ordre et révocation restent actifs ; aucune physique de surface n'est activée.

Le comparatif CPU qualifié conserve 48 ennemis et des états exactement égaux aux
cinq checkpoints. La médiane des paires baisse de **13,6 %**, avec 14/16 paires
plus rapides. Le total baisse de 29,1 %, mais comprend un bloc baseline atypique
dont la cause n'est pas mesurée ; il ne remplace pas la médiane. Cette fixture
sans rendu ne mesure ni le GPU ni un gain FPS. Preuves :
`work/conquest-perf-20261024/keyed-enables/RESULT.md` et `delivery.json`.

La correction Dagger distingue un service Shield enregistré mais vide d'un
bouclier présent. Après le vrai cycle équipement/activation/déséquipement, elle
conserve le profil acteur et compose son drapeau154 courant, sans supprimer le
propriétaire ni modifier Controller, Shield ou le PvP. Les 65 contrôles distincts
du lot passent ; l'ancien garde reproduit le refus sur les deux sexes. Rush et
contact mêlée contre Shield restent indisponibles. La texture XML exacte du
Bishop Snipe1314 est appliquée avant la chauffe des modèles ; ses 15 meshes la
conservent sur les poses testées, sans changer Bishop1303. Les huit contrôles
texture/résultats passent. Rapports : `work/conquest-perf-20261024/gameplay/`
et `work/conquest-perf-20261024/verification/`.

Le contrôle final des huit vagues utilise désormais les vrais octets Wasm et
vérifie explicitement le backend. Le premier passage forcé par une fixture
JSON-only sur le repli JavaScript a été interrompu **sans verdict**. Le build
regroupé, la nouvelle observation après optimisation dans le jeu principal et
les effets encore manquants restent suivis dans
`work/conquest-perf-20261024/secondary-progress.json`. `nativeReady` et
`fullGoalComplete` restent faux ; la fidélité complète au Jeu référence et la
fluidité en combat mobile ne sont pas acquises.

Les checkpoints ci-dessous sont historiques.

# Conquest — huit vagues intégrées ; armes et polish en cours

**Retour utilisateur avec capture :** le gel restant affiche une erreur de
provenance locomotion, distincte de la particule. Le saut→sprint aérien et sa
chute relâchée sont reproduits avec le vrai Controller, puis raccordés aux
classes source FastRun/Fall déjà qualifiées, sans changement de physique.
21 tests de profils passent ; le scénario réel Dagger/déplacements/sprint en
rencontre et les deux scénarios SMG/main passent3/3. Les barres de vie lisent
maintenant les vrais PV/maxPV et positions des monstres. Dagger et les armes
non raccordées restent explicitement indisponibles pour les dégâts Conquest ;
un garde d'entrée évite que leur attaque interrompe la simulation. Cela ne
constitue PAS une livraison de leurs attaques. Le pool partagé retire les
particules cosmétiques invalides, avec limites S5 explicites. Compilation finale
réussie ; validation visuelle utilisateur encore ouverte. Performances en combat
remises en priorité à un sous-agent sur demande explicite de l'utilisateur.

**Correction de jouabilité du23octobre :** mode Conquest dédié dans la liste,
normalisation des anciens liens training/map46. Un nouveau test sans téléportation
ni HP0, avec tirs sur les apparitions source normales, a reproduit un gel :
la particule de mort Pawn4/life171 atteint exactement sa clé à133ms ; le calcul
source produit des taux nonfinis et la garde suivante arrêtait toute la partie.
Le calcul natif est conservé. Une politique S5 de présentation retire uniquement
la particule invalide après retarget, sans modifier les PV, les acteurs, les
commandes ni les tirages effectués. Le test naturel qui échouait passe après
correction ; ce résultat ne constitue pas encore une réobservation de la partie
utilisateur, l'accès navigateur étant désactivé. Preuves :
`work/game-modes/conquest-recovery/pawn-finalization-20261023/playable-freeze-checkpoint.json`.

**Dernier raccord joueur (23 octobre) :** Semi Rifle et Assault Rifle sont
maintenant branchés dans le main, avec capture par sous-pas et résolution après
mixer, vrais PV usine et conservation au changement d'arme. Les tests du main
passent sur les deux sexes : Semi attribut34/11PV, Assault attribut85/13PV,
sous politiques S5 plain-item/FREE2 explicites. Semi observé dans le navigateur :
deux balles,30→8PV. Le contrôle visuel Assault reste ouvert car l'accès local au
navigateur a été désactivé. Les identités équipement34/attaque2 de l'Assault sont
établies séparément ; aucune poussée ajoutée. Compilation finale réussie.

L'optimisation des contacts base ne relit plus le JSON source gelé à chaque
acteur ; les contrôles du volume, des descripteurs et des propriétaires mutables
restent actifs. Réduction53% de la phase mesurée, gain FPS global non qualifié.
Preuve courante : `pawn-finalization-20261023/rifle-delivery-checkpoint.json`
sous `work/game-modes/conquest-recovery/`. Le masque HUD s'applique désormais
dès la frame terminale, avant le rafraîchissement périodique50ms.

**Checkpoint du 23 octobre 2026.** Le jeu principal expose les huit vagues,
325 modèles et le King final. Le test de composition complet avec les effets
Queen/King, le tri Rook corrigé et le raccord SMG passe1/1 en290s : source
AI→attaques→PV, morts, retraite des acteurs et libération des effets/modèles,
puis snapshot terminal de victoire locale. Les fins de vague utilisent un
arrangement HP0 déclaré, sans créditer d'élimination fictive : ce test ne prouve
pas une victoire naturelle du joueur ni une comparaison vivante à S5Runtime.

- **Queen :** trois lumières animées et18 meshes, effets d'attaque et de mort
  raccordés aux vrais nœuds après pose. Ses effets de mort survivent au retrait
  de l'acteur jusqu'à leur expiration. Plusieurs profils restent explicitement
  indisponibles ; aucune substitution silencieuse.
- **King :** effets source et vraie couronne animée raccordés ; nettoyage réel
  runtime/baseExit4 à5001ms puis expiration de la couronne à5201ms.23 tests
  ciblés et1485 comparaisons CPU passent. Le littéral Resourcewws manquant et
  certaines limites matériau/fade/refcount restent ouverts.
- **Rook :** le blocage de vague3 sur distances égales est corrigé avec le tri
  qsort du runtime natif authentifié, testé sur633 cas ; le nouveau parcours
  navigateur atteint la vague8 sans ce défaut.
- **Armes joueur :** Handgun et Submachine Gun sont raccordés. La SMG conserve
  un reçu par balle, le vrai rayon après dispersion, les obstacles/Shield et
  la Health de l'acteur. Dans le navigateur, deux balles ont retiré28PV
  (30→2), avec l'attribut8 et aucun défaut.14 dégâts par balle avant
  modificateurs relèvent de la politique S5 explicite plain-item/FREE2 ; cela
  ne valide pas le record final natif. Semi Rifle et Assault Rifle sont les
  raccords suivants, en préparation séparée.
- **Cycle et UI :** bilan local,15s puis retour automatique à la salle ; aucune
  récompense ni classement inventés. Le HUD Conquest est masqué pendant les
  résultats. Le lobby et la salle Battle Royal affichent Free for all et les
  participants, en conservant les placements3D. Le HUD personnalisé reste actif.

La compilation finale passe dans le dossier release existant, sans copie des
assets. Les23 tests lobby/salle passent. Les passages navigateur précédents
ont mesuré15,016s et15,023s entre résultats et salle ; les transitions restent
vérifiées sur la version finale.

Preuves : `work/game-modes/conquest-recovery/pawn-finalization-20261023/`
(`eight-round-final-authored-effects.tap`, `eight-round-build.log`,
`smg-real-browser-shots.json`, `final-eight-queen-rook-browser.json`,
`lobby-room-final-tests.tap`) et les handoffs Queen/King/SMG/Rook datés du23.

**Encore ouvert :** autres armes et compétences contre les monstres, effets
manquants, réactions physiques/partielles source, fidélité des dégâts et de la
sélection des cibles, mesures de performance en combat, comparaison équivalente
avec S5Runtime local et polish visuel. `nativeReady` et `fullGoalComplete` restent
faux. La correction du coût des gardes CPU ne constitue pas un gain FPS mesuré.

Les checkpoints ci-dessous sont historiques et ne remplacent pas cet état.

# Conquest — sept vagues intégrées, huitième en cours

**23 octobre, checkpoint courant :** le jeu principal expose les sept premières
vagues source (268 modèles préparés), avec RookExplode1110 et Queen1403.
Le test de composition traverse réellement les sept cycles, attaques→PV,
commandes de mort, retrait et finalisation. Les passages HP0 des tests sont
des arrangements explicites, jamais des éliminations joueur créditées.
Le navigateur confirme58 apparitions dans la septième vague et31 retraits
naturels sans faute de l'orchestrateur. La parité visuelle native et la fluidité
en combat complet restent non validées.

Preuves : `pawn-finalization-20261023/seven-round-integration-tests.tap`
(1/1), `seven-round-release-tests.tap` (15/15), `seven-round-browser.json`
et `seven-round-build.log`, sous `work/game-modes/conquest-recovery/`.
King1500 et la huitième vague sont encore en raccord. L'adaptateur de résultat
local (bilan15s puis salle automatiquement) passe38 tests avec ses régressions,
mais attend la composition réelle de huit vagues. Le combat joueur reste limité
au Handgun sous politiques S5 déclarées ; Push/Blow/effets et plusieurs
présentations source restent incomplets. `nativeReady` reste faux.

Les checkpoints ci-dessous documentent les étapes antérieures ; leurs nombres
de vagues et leurs états ne remplacent pas ce checkpoint courant.

# Conquest12 : intégration en cours, partie complète non validée

**Raccord au jeu principal — 22 octobre 2026 :** la carte46 lance désormais
la première vague depuis la salle d'attente. L'orchestrateur
`src/conquest-encounter.js` compose les48 Pawn source, navigation, collisions,
attaques contre le joueur, tirs Handgun post-mixer, base30000, morts,
effets et retrait différé. Le HUD personnalisé HP/SP/arme/skill est conservé ;
un panneau distinct montre la défense de la base et les apparitions.
La préparation précède le démarrage de l'horloge de vague.

Cette première exposition utilise une politique S5 déclarée pour la puissance
Handgun sans usure/dropoff1, les identités/flux aléatoires locaux, la visibilité
à demi-hauteur et une reprise joueur provisoire à5secondes. Elle ne ferme pas
les gates natifs du record50. Les autres armes/compétences, les sept rounds
suivants, la conclusion complète et la comparaison visuelle native restent
à livrer. Aucun succès global n'est déduit de la disparition des48 Pawn.

Le test réel de composition couvre les48 naissances, les deux sens du combat,
le changement d'avatar, le nettoyage, le reset physique après une mort et
une nouvelle partie sur la même carte précédemment endommagée. Les tests
antérieurs au scellement statique passent6/6 ; le contrôle groupé du raccord
et la vérification navigateur sont encore en cours. Le scellement porte
uniquement sur le JSON statique, avec reçu privé ; acteurs, portes et leurs
PV restent dynamiques. Sur64 pas de8ms avec48 Pawn, médiane22→5,9ms et coût
total−24%. Un second gain est désormais activé : le cache exact des segments
statiques, limité aux faces source immuables, conserve toutes les requêtes et
les résultats. Sur le même test48 Pawn/64pas, coût total3827,7→1779,7ms
(×2,15), pic1349→605ms. Positions, orientations et434 tirages aléatoires sont
strictement identiques ;2338 des3073 requêtes réutilisent un résultat exact.
Les pauses à froid subsistent et la fluidité navigateur n'est pas encore
validée. Preuve : `work/conquest-perf-20261022/static-cache-comparison.json`.

**23 octobre — descente et contacts naturels corrigés :** le défaut où les48
Pawn restaient à22,691m est reproduit dans
`main-encounter-20261022/browser-actor-positions.json`, puis corrigé par le
préfixe vertical A031D0/A033D0 placé avant le tick des états. Le même corps
physique et la phase114 sont partagés avec les réactions. Le test depuis un
vrai spawn, sans repositionnement, traverse les plateformes, rejoint le sol
Y266,484 natif et touche la base à30301ms : événement12, HP0 et33C2.
Le profil FREE de S5 applique les valeurs source−7500/−7500 ; le choix de
GameTempo du Conquest natif reste explicitement non qualifié.

Le navigateur confirme48 apparitions, une descente réelle, des attaques
naturelles sur le joueur (jusqu'à HP0 et reprise) et14 contacts de base,
avec PV28600 et14 retraits. Preuves :
`main-encounter-20261022/vertical-browser-natural-combat.json` et
`main-encounter-20261022/vertical-wave-hud.png`. Les six contrôles de composition
repassent après le raccord vertical ; le test isolé de combat suit maintenant
la vraie hauteur du Pawn pendant son attaque en chute.

**Performance encore insuffisante :** le navigateur reste à1–2FPS avec48
ennemis. Le profil a d'abord identifié les assertions d'effets qui recalculaient
toute la scène. Leur correction ciblée conserve matrices, bones et particules
strictement identiques ; sur48 modèles et8 effets,25696,5→668,6ms (×38,4).
Le profil suivant montre que les contacts avec les triangles du décor dominent
désormais. La première vague reste impropre à une livraison fluide et le mode
complet reste incomplet. Preuves : `work/conquest-perf-20261022/matrices/` et
`work/conquest-perf-20261022/browser-after-matrices-summary.json`.
Le nouveau groupe de121fichiers termine avec696réussites et trois anciennes
préparations de contact incorrectes : elles écrivaient directement la position
du modèle sans déplacer son corps physique. Après correction du seul fichier
de test, les trois cas repassent et le build réussit. Les empreintes prouvent
que les autres sources et tests sont identiques au groupe initial, puis stables
pendant le contrôle et la compilation. Cela forme699contrôles validés sur les
deux passages ; aucune vérification de fluidité n'en est déduite. Rapport :
`vertical-contact-repair-checks-20261023.json`. La compatibilité de la salle
d'attente avait également passé98/98 après le changement parallèle de décor.

**Checkpoint précédent et preuves de récupération :**

**22 octobre 2026 — état courant :** la carte46 est accessible dans le jeu
principal en exploration. Le décor animé conserve sa hiérarchie SCN, le ciel
est visible et la musique source `battle2.ogg` est raccordée. Les ombres du
personnage et du décor ont maintenant leur cadrage propre à cette carte ;
deux vues navigateur confirment l'ombre au sol sans les bandes du premier
réglage. Preuve : `map-shadows-20261022/browser-verification.json`.
L'écoute physique du son et la parité du rendu natif restent distinctes.

Le scénario d'intégration conserve le premier groupe réel de huit Pawn :
création, IA, commandes différées, Run, collisions des1601 faces source,
positions des modèles et animation BASE demandée explicitement par Run.
Le volume de base et le compteur distinct sont raccordés à ConquestSession :
initialisation30000, contact, événement natif12 différé, dégâts de défense
et de porte. Le contact King arrangé à30000 prouve le préfixe de défaite
local, pas son IA ni sa vague. Aucun rapport serveur2030 n'est inventé.

La mort ordinaire d'un Pawn passe désormais par sa véritable réaction Death
et un service retenu : capture de position, cinq actions/ six textures,
fenêtres d'émission source, durée1000, réinitialisation du contrôleur et
retrait de l'effet au poll suivant. Le rendu utilise les géométries source
et une politique S5 explicite pour caméra, visibilité et mélange GPU.
Les références JavaScript réelles ne constituent pas une preuve des comptes
natifs globaux. Modules : `conquest-pawn-death-sequence.js` et
`conquest-pawn-death-effects.js`. Les tests passent par une vraie réaction
avec son propriétaire de santé ; ils n'exposent pas encore une vague dans
le jeu principal.

La branche d'arrivée à la base a son propre runtime préparé : séquence
`Resources/Effects/enter_base.seq`, sept actions, huit textures, émission
continue, fenêtres retardées et fin stricte2500/2501ms. Elle est désormais
raccordée au service partagé et au contact de base de ConquestSession :
la vraie commande différée déclenche Death33C2, puis le service scène avance
une seule fois par image. Les quatorze images décodées des deux effets
restent préparées pendant la session, sans nouveau chargement par mort.
Le retrait de l'acteur après2000ms ne coupe pas l'effet capturé à2500ms ;
les comptes de références natifs et l'ordre complet du frame restent non
qualifiés. Elle n'est jamais remplacée par l'effet ordinaire à cinq actions.
La fermeture d'une animation terminée conserve sa vitesse stockée sans
relancer le clip ; le son de destruction est arrêté et déconnecté.

Le nettoyage différé est maintenant raccordé à cette même session : le vrai
champ359 autorise un ticket de retrait global après2000ms, sans assimiler
ce retrait à un destructeur. Les huit sous-propriétaires Pawn sont libérés
avec un reçu privé vérifiable, puis leurs références IA/runtime/autorité sont
retirées. Le passage précède les contacts de base, comme dans le flux source.
Les modèles sont détachés de la scène pour éviter leur réapparition après
la restauration des matériaux. Ils restent réservés par la session et sont libérés
à sa fermeture ; leur finalisation individuelle et le compteur de destruction
restent des étapes distinctes. Un booléen `nativeCleanupPermitted` seul est
désormais refusé par ConquestSession.

Le consommateur des huit rounds est préparé séparément : comptes attendus
48/15/40/1/59/47/58/57, égalité exacte sur les destructions et démarrage source.
Ce kernel ne reçoit encore aucun compteur de destruction de la session et
ne fabrique ni victoire, ni réponse serveur, ni retour au lobby.

Le profil joueur distingue tir/rechargement Handgun, marche, saut/chute,
esquive et walljump par leurs actions source et leurs corps respectifs.
L'adaptateur de tir post-mixer conserve une préparation des étapes finales ;
aucun dégât50 n'est livré sans la puissance et les champs finaux qualifiés.
Le combat peut désormais emprunter le même receiver de santé que les
réactions Pawn : le record158 reçu reste le même objet, sans seconde santé
ni recopie de record. La liaison empruntée est retirée avant le runtime et
refuse les contacts invalidés par un unbind/rebind.

Une nouvelle copie locale230746/PID33608, configurée Conquest12/map46,
confirme le Handgun2010007 dans l'équipement et sa durée. Les lectures
cohérentes de l'item réel donnent Power8,25 et Accuracy0,03 ; le getter
GameTempo courant donne row2/colonne34/propriété4=2. Les1920cas CPU des
variantes observées et les288cas du relais entier qualifient cette lecture
logique bornée ; les overrides des index17/21 ne s'appliquent pas à34.
Ce sont des scalaires observés, pas encore un workingPower, un record50 ou
une preuve de l'identité de la room native. Reçus :
`handgun-dispatch-context-20261022/native-handgun-item-power-230746.json`
et `native-tempo34-230746.json`. Le tier de durée, les mutations de l'attaque,
le dropoff et les gates de livraison restent à fermer.

Checkpoint antérieur : la copie locale PID33072 / lancement221808 s'est arrêtée
normalement après900secondes. Une lecture cohérente bornée a identifié le
Handgun2010007 dans l'équipement courant et son record de durée :
`handgun-dispatch-context-20261022/native-current-equipment-qualified-221808.json`
(91lectures,1986octets, aucune écriture ni appel natif). Le filtre4C du
wrapperB99 et son trampoline sont qualifiés pour ce cas non nul ; le getter
de clé est admis par un profil distinct de84octets complets et256cas CPU,
sans relâcher le contrat HP général. La puissance de l'item reste à lire.
Le handler tempo courant retourne bien1642F30 dans la branche qualifiée,
mais le getter1053CF0 est remplacé par un relais du module1 susceptible de
multiplier son résultat. Aucun multiplicateur numérique ni dégât final
n'est donc déduit. L'ancienne capture module1 a lu vtable+24 ; la cible
réelle est service+24 et demande une nouvelle lecture avec le lecteur corrigé.

Le lancement privé suivant224042 a rencontré le mutex applicatif existant
`s5runtimeclient_gl`, puis s'est terminé avant la lecture (zéro octet lus).
Un correctif limité à cette copie, au nom exact, à l'appelant et aux octets
source qualifiés est préparé et testé ; son nouveau lancement reste à vérifier.
L'instance originale de l'utilisateur est conservée intacte.

Le nouveau contrôle groupé `--enter-base-session` passe617tests sur106fichiers,
avec compilation réussie dans le dossier existant et tous les fichiers
surveillés stables. Reçu : `enter-base-session-checks-20261022.json`.
Les checkpoints historiques597 et500 sont conservés, y compris l'écart
Python et la revalidation du précédent contrôle597. Les résultats de composants,
les tests arrangés et les captures du décor ne prouvent ni une partie
Conquest complète ni la fidélité de tous les modes.

Restent à livrer : finalisation individuelle distincte du retrait global typé,
durée/workingPower/dégât50 Handgun, véritable rencontre autonome du jeu principal, autres espèces,
huit vagues, scores, rapport final et retour au lobby, puis comparaison
jouable équivalente avec S5Runtime. L'objectif global reste entier et actif.

Les paragraphes datés ci-dessous sont des checkpoints historiques.
**21 octobre 2026 — commandes d'attaque raccordées :** l'IA Pawn alimente
la file avec le vrai type4/CreateAttackCommand9FCAD0. La sortie transmet
l'input et sépare direction XYZ de l'état et facing horizontal, sans déplacer
l'acteur.96cas des méthodes x86 concordent ;84tests/build passent.
Le consommateur de la file d'inputs, les animations et dégâts restent à
raccorder avant une attaque jouable. Aucun nouveau match principal/natif validé.
Détails : `work/game-modes/conquest-recovery/ATTACK-COMMAND-20261021.md`.

**21 octobre 2026 — file de commandes raccordée :** l'IA Pawn peut fournir
une commande de déplacement à la file native portée, puis à son véritable
acteur/modèle. Le gestionnaire exécute les commandes actives avant d'admettre
les commandes dues et respecte les égalités de durée et les clocks uint32.
28cas des algorithmes x86 originaux concordent ;80tests/build passent.
Navigation/collision, états/attaques, autres IA, ressources et conclusions
restent ouverts. Aucun mode principal jouable ou nouvelle validation navigateur.
Détails : `work/game-modes/conquest-recovery/COMMAND-QUEUE-20261021.md`.

**21 octobre 2026 — orientation visuelle raccordée :** le tick transmet
le quaternion source de97EC00 au modèle. Le calcul utilise −Z comme avant et
le demi-tour natif près de+Z, sans yaw/mirroir humanoïde ajouté.56cas avec le
véritable D3DX29 dans quatre profils CPU concordent ; la branche3DNow/FEMMS
reste non vérifiée. Les six modèles et tous leurs sommets sont testés ; Pawn,
Knight et Queen sont inspectés dans le navigateur sur une page isolée.
75tests et build existant passent. Direction initiale de spawn, collisions,
navigation, ordonnancement, AI/animations, ressources et serveur restent à
raccorder ; Conquest est toujours non jouable dans le jeu principal.
Détails : `work/game-modes/conquest-recovery/MONSTER-FACING-20261021.md`.

**21 octobre 2026 — commandes de déplacement et calcul de course raccordés :**
la commande native utilise la position courante en XZ, avec arrêt à20unités,
et conserve ses compteurs/multiplicateurs source. La vitesse de course garde
les arrondis float32, le delta en millisecondes et le modificateur de statut.
Le bridge applique uniquement le résultat d'un port de collision explicite.
56cas des méthodes/blocs originaux en CPU isolé concordent ;72tests et build
passent. Le solveur de collision, la navigation, l'orientation visuelle, les
ticks communs/animations et l'ordonnancement natif restent à raccorder.
Conquest reste non jouable et non comparé dans une partie native vivante.
Détails : `work/game-modes/conquest-recovery/MONSTER-MOVEMENT-20261021.md`.

**21 octobre 2026 — PV de création raccordés :** la formule native est
signed16(HP)×(1+(défenseurs−1)×0,75), avec arrondi float32 à chaque opération.
Le nombre vient des entrées d'équipe1 du briefing, sans filtre de vie/host/ready.
Les constantes1/38 sont vérifiées dans les deux ressources d'archive ; le setter
maximum puis la copie vers les PV courants sont identifiés. L'acteur calcule
maintenant ses deux valeurs et le bridge vérifie leur application au spawn.
114cas des blocs originaux exécutés en CPU isolé concordent ;69tests et build
existant passent. Cela ferme le calcul auparavant inconnu, sans capture native
vivante. Conquest reste non jouable ; RNG, AI/commandes, ressources, serveur et
jeu principal restent ouverts. Détails :
`work/game-modes/conquest-recovery/MONSTER-HEALTH-20261021.md`.

**21 octobre 2026 — acteur monstre et contact de base raccordés :**
le producteur de l'octet de contact est maintenant identifié : c'est le record
d'équipe choisi par la création native. Les dimensions source multipliées par
la taille et la mise à jour du corps sont portées ;30cas des blocs originaux
exécutés en CPU isolé concordent pour les dix types. L'orientation du modèle
ne tourne pas cette boîte. La neutralisation de l'acteur précède réellement
la recherche d'IA et la mise en file des dégâts dans le nouveau raccord.

Correction : record+19C contient Resources.ai_lua, pas une base cible. Une
ressource non enregistrée laisse le monstre neutralisé sans événement.
Autre dépendance explicite : la création règle12 ajuste les PV avec le nombre
de participants et des constantes encore à qualifier ; aucun fallback depuis
healthRaw16 n'est fourni.65tests et build existant passent. Conquest reste
non jouable : santé effective, RNG, AI/commandes, ressources, serveur et jeu
principal restent à terminer. Les anciens statuts ci-dessous sont historiques
sur ces points. Détails : `work/game-modes/conquest-recovery/MONSTER-ACTOR-20261021.md`.

**21 octobre 2026 — statistiques des dix types raccordées à la création :**
les noms de champs sont assemblés caractère par caractère par49F890. Le
chargeur XML A0BAD0 et le chargeur binaire A0E940 écrivent `base_attack` à+150,
reliant enfin cette propriété au contact71EB00. Les quatre tirages natifs se
font dans l'ordre taille/vitesse/attaque/HP, y compris pour un intervalle fixe.
Le Pawn1013 conserve son intervalle d'attaque15→5 ; les HP sont tronqués en
paramètre16bits. ConquestRuntimeBridge exige désormais les quatre valeurs
rand explicites par monstre et transmet les statistiques au factory, qui doit
les conserver et appliquer la taille source au vrai modèle.

Le modèle Queen refusait sa taille float32 native1,600000023841858 contre
une borne double1,6 : la validation et l'échelle utilisent maintenant la
précision native. Les dix variantes chargent leurs vrais modèles ;70scénarios
de statistiques concordent avec le bloc original exécuté en CPU isolé.
59tests et build existant passent. Le producteur de `base_attack` n'est donc
plus un blocage ; RNG/identité/volumes de monstre, AI/commandes, ressources et
conclusion serveur restent à finir. Aucune partie S5Runtime vivante ou intégration
Conquest jouable n'est revendiquée. Détails :
`work/game-modes/conquest-recovery/MONSTER-STATS-20261021.md`.

**21 octobre 2026 — création et santé de la base raccordées :** la factory
708770 reconnaît alpha/red_safezone→1 et beta/blue_safezone→2, dans cet ordre.
Le constructeur71EA50 place ce sélecteur dans gate+28/+2C et initialise
gate+30 à0. Le loader707C40 y écrit ensuite `PVE_RULE/base_object_*_hp`.
`createConquestWorld` fournit maintenant la vraie base beta_safezone_00,
son volume source, son sélecteur2 et sa santé30000 ; ConquestRuntimeBridge
peut consommer ses événements de dégâts. La soustraction32bits du gate reste
distincte de la conversion16bits du contrôleur.35cas correspondent à
l'instruction x86 originale exécutée en CPU isolé ;53tests et build passent.
La vérification complète des quatre chaînes a fermé la discordance de noms
suspectée pendant la recherche : aucune substitution de nom n'est ajoutée.
Pas de partie native observée ni de nouveau mode jouable. Les producteurs
d'identité du monstre/attribut150, l'IA et les réponses serveur restent ouverts.
Détails : `work/game-modes/conquest-recovery/BASE-GATE-20261021.md`.

**21 octobre 2026 — prérequis de contact corrigés :** le consommateur71EB00
ne compare pas gate+28 à l'identifiant de mode12. Il lit l'octet protégé à+8
du résultat de monster.virtual38, puis compare sa valeur décodée élargie à64bits
avec gate+28/+2C. Le raccord et les fixtures sont corrigés ; la signification
du producteur de cet octet reste explicitement inconnue.

Le parseur conservant les volumes récupère maintenant la vraie Box
`beta_safezone_00` dans `wave_d_sp.scn` : demi-dimensions natives245/290/85,0000076,
rotation d'environ45° et centre source exact. Le chargeur Conquest expose
séparément cette boîte native et sa conversion en scène, et vérifie l'ancrage
dans la carte chargée. Cela ferme l'absence des données géométriques source,
sans certifier le futur rattachement au gate vivant.48 tests et build existant
passent. **Conquest reste absent du menu et non jouable** : commandes/AI,
paramètres natifs, ressources manquantes et conclusions serveur restent ouverts.
Preuves et reprise : `work/game-modes/conquest-recovery/BASE-CONTACT-20261021.md`.

15 octobre2026. Source, données, consommateurs et ressources préparées ; aucun
mode local de remplacement ni nouveau runtime importé. NativeReady=false.

## Objectif et paramètres réels

Le mode12 du XML est Conquest, dev=true/use=false,1–4participants. Carte46 :
Cube Defence, INI`mapinfo/bginfo-wave_middle.ini`. Son groupe PVE_RULE déclare
type=defense, base`beta_safezone_00`, HP30000 et fichier explicite
`xml/monster_wave/monster_map_middle.xml`. La carte200 Puzzle Defence est
déclarée séparément ; son INI/volumes ne sont pas récupérés dans ce lot.

Le XML sélectionne score0/time200. Le commentaire source de la famille Arcade
emploie score pour les scènes d’événement et time pour la difficulté. **Les
valeurs brutes ne sont pas une limite de0points ni200minutes** ; le sens exact
de200 est inconnu. Le catalogue générique existant emploie encore ces noms
scoreLimit/timeLimitMinutes : ne pas brancher ces deux nombres au gameplay.

Les94lignes du fichier donnent8rounds,10types de monstres et45sections de
spawn nommées dans l’INI. Les attributs recall1–4, monster_increase,
recall_time, waypoints, événements et unités sont conservés tels quels.
`monster_status.x7` lie chaque type à HP/attributs, scène et script AI. Le Pawn
normal cible explicitement beta_safezone_00 ; les scripts contiennent leurs
vrais volumes/attaques. Leur présence ne vaut pas un port de l’AI ou des dégâts.

Les textes du checkout étaient convertis LF→CRLF. La copie locale authentifiée
retire CR uniquement si **longueur, CRC et SHA complets** retrouvent exactement
le manifeste d’archive. Le source original reste intact ; copies et rapports
sous `work/game-modes/conquest-recovery/authenticated/`.

## Contrôleur et cycle natifs retrouvés

PE copié SHA256`6bea9d8cc2503a1e660c1d8a9dfd1241f394207c4f1cb84a9d4a1fea3d3c8017`.
7F0FD0 choisit le contrôleur selon type : defense→A1D0B0/vtable13F0E00,
stocké dans gameManager+230. Genocide est une branche distincte, pas un alias.
DD67C0 entre dans l’état playing de Conquest et initialise ses horloges.

A1D670 consomme uniquement la règle12 active. A1CFD0 compare sequence+4 à
attachedRound+24 lorsque sequence+C est actif ; l’égalité efface le flag et
permet l’avance. Le contrôleur incrémente alors round+78, sélectionne la
suivante, réinitialise la séquence et l’active. Absence de round suivant appelle
vtable+48→A1DFC0 : fin arrêtée, report flag1 et envoi hôte RMI2029(7ED).
La branche+4C→A1E1E0 arrête, met report flag2/baseHP+80=0 et envoie hôte
RMI2030(7EE). Ce sont les producteurs clients de rapports, **pas la preuve
d’une réponse serveur/result observée**. Le lot upstream décrit ci-dessous
établit maintenant sequence+4 et deux appels distincts de+4C.

A1E6B0/A1EDC0 chargent les vagues. Ils lisent aussi un champ optionnel wave,
absent des94lignes ; A1F910 refuse les index négatifs et le loader construit
alors un nouveau sous-groupe. Ne pas inventer une colonne wave ni conclure
que le fichier est invalide. Les consommateurs recall/count/timing sont
maintenant retrouvés ; leur port ne produit encore aucun monstre en jeu.

## Producteurs upstream et forme des rapports

`trace-upstream.py` et `upstream-source.json` vérifient les nouvelles traces
alignées, sans exécuter S5Runtime. Les exports Ghidrav5–v10 sont terminés.

**Le compteur de fin de vague est un compteur de destructions d’objets** :
destructeur de monstre A016B0→manager+230/vtable+20→A1DC00→sequence+68,
A1D010 incrémente+4 et borne au nombre attendu positif round+24. La destruction
peut également venir du nettoyage : ce n’est pas un simple événement kill
réseau. Le reset coupe l’activation du contrôleur avant de vider les objets.

A21730 choisit rand()%4 une fois par round. Cela sélectionne recall1–4,
**pas le nombre de participants**. A21FB0→A22190→A1C410 fait avancer les
timers entiers en millisecondes, avec déclenchement strict elapsed>recall_time,
une seule fois par record. Le rôle host1644AE0+20 conditionne les vrais spawns.
Le nombre est monster_increase tronqué à l’octet ; le recall choisi est
l’index de spawn. Les variantes de waypoint restent les flags source.
Le client tire aussi deux offsets X/Z rand()%200−100 autour du spawn.
`conquest-wave-schedule.js` porte les échéances/demandes typées et le gate host,
avec sélection explicite0–3 ; aucun PRNG arbitraire, NPC ou coordonnées fictives.

Le retrait de santé de base est A1DCF0 : argument signé16bits, base+80 moins
damage ; valeur<1 appelle+4C. Son appel direct9FF9BD dans9FF8D0 est un executor
d’événement de portail de base, après contrôle d’appartenance au contrôleur.
La mise en file et le déclencheur contact sont maintenant retrouvés dans le lot
base-contact-source.json décrit ci-dessous. Le candidat9FF7E0 de v10 est un
destructeur ; le vrai constructeur9FF810 utilise la vtable13EFD50.

Un autre appel de+4C, A1FAF0, parcourt les acteurs type1 et échoue lorsque tous
satisfont la comparaison d’éligibilité de registry4EA430 avec virtual44=false.
Pour l’avatar local virtual44=5192B0 dépend d’un flag protégé+154 et du state
virtualB0. Ce test complet ne doit pas être réduit à un simple check HP==0.

Correction des hypothèses : A1DC20/+24 et A041F0 **ne retirent pas lesHP de
base** : receiver de dégâts du monstre, ledger des dégâts infligés par un
joueur type1, compteur+60. A1E410/+58 conserve des tallies de dégâts par
map/spawn ; lui non plus n’est pas la santé de base. Les anciens noms des
exports restent archivés et ne font pas autorité sur leur sémantique.

F01D30 itère des records alignés24octets en mémoire, mais F169E0 écrit
exactement20octets sur le fil : accountIdU64 et3entiers32 signés. Préfixe nombre
de records sur4octets. Les deux premiers champs restent opaques ; le troisième
vient de A1E630, total de dégâts du ledger joueur. `conquest-stage-report.js`
décode ces seules données avec limite4participants, comptes uniques et longueur
exacte ; serverAccepted restefalse.

**Le serveur de référence ne fournit pas ces réponses.** Netsphere possède
les classes/opcodes ArcadeStageClearReq/FailedReq2029/2030, mais aucun handler
dans son projet Server.Game. Sa création Arcade retourne explicitement un
TODO/échec. Le labo local n’a pas de LocalRound12 ; le room partagé refuse
tout mode hors1/2. Il ne faut pas fabriquer une acceptation ou un résultat pour
présenter une comparaison réussie. Empreintes et inventaire sont dans
upstream-source.json. Condition de reprise : contrat serveur original récupéré
ou capture native contrôlée des demandes et réponses réelles.

## Score consommable séparément

Règle vtable1443B5C : kill+88→DD5960→1105C70 ; kill-assist+8C→DD5A10→1105D80.
55DC50 exige objectType6 sur le LongPeerId de la victime. Une élimination
d’avatar type1 ne produit pas ces points objectifs. Victime valide : killer
A4+1 et total+18+2, équipe+4+1, victimeB0+1 si elle existe dans le briefing.
Assist distincte du killer par identité48bits : A8+1 et total+1. Même identité
avec bits de slot différents ne donne pas d’assist supplémentaire.

Heal-assist+90→1105F00 donneAC+1/total+1. Suicide+B0→1105F80 n’accepte que
type1 et incrémenteBC, sans retrait de score dans cette fonction. Team-kill
+B4→1105FE0 : victime type1, killerB4+1/victimeB8+1, sans attribution de score.
Les sept mots du décodeur1115770 restent A4/A8/AC/B0/B4/B8/BC. Le total commun
est distinct ; il ne doit pas être recalculé depuis l’extension28octets.

`src/conquest-native-ledger.js` porte uniquement ces notifications et leur
extension. L’appelant doit authentifier/dédupliquer les événements et établir
leurs vrais producteurs ; le module ne génère pas de kills, mobs ou résultats.
`src/conquest-source-data.js` conserve les données authentifiées sans effet de
bord. Ces fichiers ne sont importés par aucun mode principal.

## Validation et reprise précise

`trace-source.py` reproduit CRC/longueur/SHA, choix, données et assertions
d’assembly à entrées/prologues alignées. Les exports Ghidra de quatre lots sont
terminés et leurs empreintes archivées. Le nom initial
conquest_playing_enter_candidate àDD67A0 est **un destructeur**, pas l’entrée
playing ; l’entrée validée estDD67C0 du lotv2. Les labels restent hypothèses.

13tests vérifient sources complètes, lignes/options sans normalisation
sémantique, anomalies d’attributs conservées, gate type6, identité d’assist,
catégories/score et round-trip28octets, échéances strictes des8rounds, rôle host,
sélection recall, format20octets et paquets malformés. Aucun rendu ni exécution
native. Rapport : upstream-tests.tap.

Prochaine piste bornée : producteurs des champs de gate/Box et loader de l’attribut150, port
des vrais monstres/AI/carte46 et contrat serveur de stage2029/2030. Les derniers
producteurs manquants restent précis ; le lot ne se transforme pas en faux match
PvE. Rendu des modèles/scènes/cartes, port AI/UI/audio, collision de base, parties M/F et
comparaison native restent absents. Aucun gate de fidélité n’est modifié.

## Lot ressources et positions natives

`recover-render-sources.py` authentifie82ressources depuis les chemins du XML,
les appels Lua actifs et les candidats uniques de basename de l’INI. Les
résolutions par basename restent qualifiées : répertoire effectif du loader
non observé. `render-resource-proof.json` valide54parses stricts EOF, dont les
sixmodèles de monstres et les scènes de carte. Les sixmodèles couvrent les
10types réels ; attributs, AI et clips originaux sont conservés dans
`conquest-render-data.js`. Aucun de ces fichiers n’est publié/importé en jeu.

`wave_d_sp.scn` établit les45transforms racines nommées par les sections
MONSTER_REGEN, ainsi que le transform `beta_safezone_00`. Le parser partagé
discarde les extents des Box : ce transform ne prouve pas un volume de collision.
`conquest-spawn-location.js` raccorde l’index source à cette matrice et applique
les deux tirages X/Z explicites[-100,99] du producteurA22190 ; il ne crée pas
de PRNG, conversion d’axes ni NPC.

Le CSV `mapinfo/waypointset/middle/complete_waypoint.csv` est désormais décodé :
1003octets, CRC226ac43b, SHA97d657f190825ee773bacc035858b95ce857e67881da701be23255a73ec64a2b.
Après l’échec du décodeur standard, les domaines de caractères CSV donnent
une clé XOR unique et le CRC intégral exact (`waypoint-source/lane-recovery.json`).
Les69lignes numériques brutes et54transforms `waypoint_NNN` sont conservées ;
tous les index référencés possèdent un transform. Aucune sélection de chemin
ou interprétation du lecteur natif n’est substituée.

SixSEQ restent bloquées après trois approches distinctes (headers/fréquences,
corpus82sources, résolution GF2 des deuxoctets header inconnus) : knight_death,
knight_death2, mon_hit, mon_hit_near, mon_hit_small, set_num3. Reprise avec vrai
préfixe/format source ou nouvelle archive authentifiée, pas une relance identique.
Un littéral Lua `resourcewws/effects/pve_mon_king_attack01.seq` est absent de
l’index : la typo reste conservée, aucun alias automatique ne la corrige.

Quatretests nouveaux vérifient ces jonctions, hashes, tirages et CSV ; total
Conquest17tests. Le lot commun Practice/Conquest/rigs passe36tests et le build.
La condition serveur2029/2030, les volumes/champs de gate, le port AI/rendu et le
comparatif natif restent ouverts. Voir `work/game-modes/conquest-recovery/INTEGRATION.md`.

## Contact réel de base et événement retrouvés

71EB00 est appelé par71EAC0. Il exige état playing2, host, champ gate30>0,
gate28 égal à l'octet décodé du résultat de monster.virtual38 à+8 et gate2C==0.
L'ancienne qualification « ruleId » était erronée et est corrigée le21octobre.
Il parcourt les monstres dont virtual44 est éligible,
teste le vrai overlap11B4BF0 (primitive OBB également utilisée par Siege) et HP>0.
Il neutralise le monstre (HP0, champ33C=2) AVANT lookup de sa base cible ; si
la lookup échoue, aucun événement n’est produit, mais la neutralisation demeure.

A04560 retourne monster+2D0, ses attributs ; nom de base cible à+19C, dommage
DWORD à+150. Le nom envoyé vient du gate+8.7EF870 fournit le compteur courant
moins gameManager+188.9FFCE0 construit9FF810, pose ce token et les paramètres
via9FFB10, puis A23F80 met l’événement dans la file locale et la file host.
Le receiver9FF8D0/A1DCF0 est celui déjà retrouvé, avec troncature signed16.
Le loader exact XML base_attack→champ150 n’est pas encore authentifié.

`conquest-base-contact.js` fournit un intent pur, sans muter des avatars/NPCs
substituts ni envoyer un ACK. Les OBBs/champs/predicates réels doivent être
fournis par le futur loader/acteur. La primitive partagée est réutilisée sans
modifier Siege. Cinqtests nouveaux couvrent les gates, overlap inclusif,
neutralisation avant lookup, bits signés et absence de réponse inventée.
Total Conquest22tests ; lot commun47PASS/build PASS. Preuve primaire :
trace-base-contact.py/base-contact-source.json,14fonctions PE et16exports.
Sixsessions Ghidra sont terminales ;9FFBC0a été rejeté sans prologue et n’est
pas utilisé. Aucun lancement natif/browser, aucune clôture serveur récupérée.

## 15 October — actual source assets/renderers and runtime AI seam

See `work/game-modes/conquest-recovery/RUNTIME-HANDOFF.md` and `runtime-proof.json`.
31 outputs staged:24 PNG textures,6 authentic models and map46/10scenes. Actual
map46 collision2meshes/857triangles and source spawn floor load. Two unresolved
texture references rechecked170actualarchives/111312records+3indices, no matches
or read failures; default loader rejects, diagnostic hides exact missing models.
Actual rigid Pawn/Rook/Bishop and weighted Queen/King load. Queen/King all vertices
at native bind within0.00025units, no influences discarded, all clips finite.
Knight source duplicate names remain blocked pending native parent/animation lookup.
Pawn normal Lua branches/commands and source wave->actual actor/contact/report
consumers implemented; real utility/path/clock bindings still required, no fake
route/ACK/winner. Pawn clips00005/00006 absent from model; no substituted animations.
64 combined tests/build PASS (33Practice,30Conquest,1real-rig replay), includes fresh
SCN EOF/data comparisons. Assets under work only, main/public/browser/native
comparison incomplete. Alpha/morph/FX/audio/otherAI/native producers/server replies
still open; nativeReady=false and global objective remains in progress.

## 15 October — native SCN name binding closed; Knight unlocked

The previous Knight duplicate-name blocker above is superseded by `work/game-modes/conquest-recovery/SCN-BINDING-HANDOFF.md`. Native SceneGroupRead lookup uses self-first insertion-order DFS among already inserted nodes; missing/forward parents fall back to the current root. Serialization ordinals preserve all131Knight nodes and24meshes, including13weighted meshes. All six actual source models now load; Knight/Queen/King all weighted vertices at bind and all clip samples pass. No aliases are inserted.

Pawn00005/00006 are absent. Native request failure and explicit internal fallback lookup are established; the initial fallback-key producer remains unknown. `sourceStateRequest` requires an explicit per-node Map and does not choose BASE. The legacy-bone raw duration path0x1154A60 ->0x1158F00 ->data+38 ->component virtual44 ->channel+2C is established, but Shield model/component-type join and collection-index/channel-mask mapping remain open.

68 combined tests PASS (33Practice,34Conquest,1real-rig replay) and build PASS; `scn-binding-proof.json` records current file hashes. Nineteen Ghidra jobs terminal,73exports pinned; root verified no live Ghidra and released reservation. No new main/public/browser/native actions. Practice diagnostic is the largest new integration seam, not a complete native mission; Conquest still needs real AI utility/command bindings, base gates/OBB, missing-resource behavior and authentic2029/2030 server replies. NativeReady remains false.


## 23 octobre — finalisation raccordée à la première vague

Le jeu principal observe maintenant le vrai ticket de retrait avant de libérer
les propriétaires de l'acteur. Le finaliseur S5 attend les commandes restantes
et les effets réels encore vivants, puis détruit les ressources du modèle et
libère son emplacement réservé. Le compteur n'avance qu'à cette étape. Les
effets exposent des identités opaques stables, sans divulguer leur état privé.
Cette étape se déroule après le nettoyage des acteurs et avant les contacts de
base. Les références natives et l'ordre de frame complet restent non qualifiés.

Le contrôle du raccord fait réellement mourir et finaliser48 Pawn. L'effet
enter-base, plus long, conserve le modèle retiré jusqu'à sa propre libération.
Les PV endommagés de la base sont conservés ; aucun nouveau match ni round2
n'est créé artificiellement. Le snapshot annonce completedRounds1 seulement
après48 finalisations ; nextRoundReady reste false en attendant le vrai1013.

Validation :23 tests de composition/session/finalisation/effets, puis4 tests
des leases d'effets, et compilation réussie dans le dossier existant.
Preuves : work/game-modes/conquest-recovery/pawn-finalization-20261023/
main-integration-tests.tap, effect-leases-tests.tap et main-integration-build.log.
La fin de vague dans un navigateur contrôlé reste à observer. Ce lot ne valide
ni les huit rounds ni la fluidité : dernier relevé en contrôle autour de7FPS,
contre37 avec le menu ouvert ; l'analyse caméra est en cours.


## 23 octobre — raccord du corps1013 et commandes, avant le round2 principal

Le constructeur source du vrai groupe1000/key1013 sélectionne le CMonster
final13F0244, avec les mêmes getters physiques et le préfixe verticalA033D0.
La variante conserve son script Explode, ses dimensions et ses statistiques.
Le lecteur physique, le corps, le chemin et la navigation communs acceptent
uniquement les couples1003/1013 authentifiés ; le runtime normal reste1003.
Un test fait chuter le vrai1013 avec le corps/map46, puis vérifie l'atterrissage
et l'écriture commandée des deux ancres sans créer un second corps.

MovementOwner.attachExplodeRuntime relie le nouveau runtime typé au vrai
executeRunMovement et au préfixe vertical. Le bridge admet SelfBomb11 via la
vraie classe et ses ports de timer ; Death2 accepte le reçu privé1013, sans
accepter un objet cloné. Le test AI→bridge→timer vérifie admission, expiration
stricte et destruction unique. Le nouvel AIHost1013 existe mais attend encore
son test de composition et le raccord à la factory/main ; il ne vaut pas une
vague jouable livrée.

23 tests corps/physique/path/navigation,16 commandes/AI/timer, puis58 contrôles
caméra/owners/navigation passent sur leurs périmètres respectifs ; ces groupes
se recoupent. Compilation camera-variant-build.log réussie. Preuves sous
pawn-finalization-20261023 ; constructeur souspawn-explode-sphere-20261023.
Le cache caméra conserve les mêmes requêtes et ne sert que les poses répétées.
Les nouvelles poses conservent le chemin d'origine sans audit supplémentaire.
Le profil navigateur continu pointe maintenant surtout le rendu ; aucun gain
FPS global n'est encore revendiqué pour ce cache.

## 23 octobre — deux vagues raccordées dans le même match

Les étapes précédentes sur le round2 sont désormais dépassées : la composition
principale prépare48 Pawn1003 et15 PawnExplode1013, puis passe effectivement
de la première à la deuxième vague après les48 finalisations. Elle conserve
les mêmes propriétaires de monde, de base, de registres et de commandes, ainsi
que les PV endommagés de la base. Le vrai type12 persiste jusqu'au nettoyage
de son gestionnaire ; on ne le détruit pas artificiellement pour avancer.

Le test de composition utilise le vrai modèle1013, ses trois effets persistants,
son AI, la commande SelfBomb11, le timer, la requête sphérique et le destinataire
joueur : une explosion retire effectivement des PV. Un tir Handgun atteint
également ce modèle après évaluation de la pose. La finalisation réelle des15
acteurs clôt la deuxième vague, sans déclarer les six suivantes terminées.
Les arrangements de test déclenchent certaines morts via les propriétaires de
PV ; ils ne créditent jamais directement le compteur de vague.

Preuves : pawn-finalization-20261023/two-round-integration-tests.tap (1 test
complet), two-round-regressions.tap (65 réussites et3 fichiers en erreur
d'import), puis round-import-cycle-repair.tap (39 réussites après correction
de l'initialisation cyclique), et two-round-build.log (compilation réussie).
Ces groupes se recoupent. Le compteur numérique set_num3, les autres armes,
les réactions non qualifiées, les huit vagues et la comparaison jouable native
restent ouverts ; nativeReady=false.

Le contrôle navigateur séparé a mesuré34 Pawn vivants, menu fermé :84,75 puis
91,76FPS avec le rendu d'origine, contre79,57 avec le prototype de regroupement.
Les appels graphiques d'une frame complète passent400→136, avec141769
triangles et7 passes dans les deux cas. Aucun gain FPS n'est démontré : ce
prototype reste hors production. Les conditions diffèrent des anciens relevés
7–12FPS ; ces chiffres ne prouvent donc pas un gain global attribuable aux
correctifs. Le joueur était dans une boucle de réapparition : la fluidité d'une
partie complète en déplacement et combat reste à valider.
Preuves navigateur : work/conquest-perf-20261022/pawn-batching/browser-*.json
et browser-batched.png. L'onglet de test a été fermé et l'instrumentation retirée.

Le champ de défense208/4C est maintenant conservé par le propriétaire réel de
l'ennemi, plutôt que recréé lors de chaque raccord du tireur. Un test livre
les vrais tirs16,5, puis12,375 avec défense0,25 après déconnexion/reconnexion
du tireur, puis16,5 après retrait. Les clones d'état et les registres remplacés
sont refusés. Le producteur d'aura Rook n'est pas encore activé dans le jeu.
18 contrôles ciblés passent, puis le parcours des deux vagues repasse et la
compilation réussit : target-defense-lifetime-validation.json,
two-round-target-state-regression.tap et target-state-build.log dans le même
dossier pawn-finalization-20261023. Il ne s'agit pas de tests uniques à ajouter
aux groupes précédents ; les périmètres se recoupent.

## 23 octobre — prérequis de troisième vague, encore hors activation

Les vrais Rook1100 et Knight1203 sont admis dans le corps/path/navigation
commun après qualification de leurs constructeurs, getters et préfixe vertical.
Le Rook utilise aussi son propre runtime sur ce corps et reçoit le vrai contact
ellipsoïde puis le record joueur. Les tests du Knight travaillent son MoveBox
sur le même solveur ; une pose de nœud manquante reste une politique S5
explicite, jamais un alias de clip ni une fidélité native déclarée.

La collection de collision1000 du principal lit le vrai Controller, ses rayons,
sa position, son équipe et son état mort. Elle ne transforme pas les monstres
en joueurs et refuse les propriétaires/rosters inconnus. Un contact réel du
noyau source puis son exclusion après mort passent. Cette adaptation utilise
le corps S5 courant ; la sélection du corps natif reste non qualifiée.

Un écart de composition de l'aura Rook a été trouvé avant activation : le
snapshot d'attaque56E870 exclut le troisième registre pour un source kind6,
alors que l'appel direct de sphère548AE0 dépend d'un global distinct. Le test
plaçait les monstres dans un premier pool ; le principal les conserve dans le
troisième. Ce test ne prouve donc pas encore le buff dans le jeu. L'énumération
du vrai caller est en cours de qualification ; aucun déplacement artificiel
des monstres entre registres n'est accepté comme correction.

20 contrôles ciblés passent, dont le parcours complet des deux vagues, et la
compilation réussit : round3-prerequisite-regressions.tap et
round3-prerequisite-build.log. Ces contrôles se recoupent avec les précédents.
La troisième vague n'est pas activée et la livraison complète reste ouverte.


## 23 octobre — raccord principal des trois premières vagues

Ce point remplace le statut de préparation ci-dessus. Le principal prépare
103 modèles :48 Pawn,15 ExplodePawn, puis40 ennemis de troisième vague
(32 Pawn1003,2 Rook1100,6 Knight1203). Le lobby annonce trois vagues,
pas le mode complet de huit vagues. Le même état de base, ses HP endommagés,
les registres, la file et les propriétaires restent conservés entre vagues.

L’énumération directe548AE0 est désormais distincte du snapshot d’attaque
56E870. Le vrai troisième registre participe à l’aura Rook selon la politique
explicite de global courant ; les conditions208 sont produites, appliquées,
puis retirées sur les vrais propriétaires de dégâts et déplacement. Le test
principal vérifie aussi l’IA du Knight, sa commande différée, ses attaques,
son MoveBox/corps et une baisse réelle des HP du joueur.

Le scénario complet des trois vagues passe, avec HP0 uniquement comme
arrangement de terminaison : les commandes, Death, retrait différé et
finalisation des ressources s’exécutent réellement avant comptabilisation.
35 contrôles ciblés passent et la compilation réussit ; ces groupes se
recoupent avec les précédents. Preuves dans pawn-finalization-20261023 :
three-round-integration-tests.tap, three-round-regressions.tap,
three-round-build.log.

Les cinq vagues restantes, la conclusion complète, les effets encore sous
politique partielle et la fidélité native restent ouverts. Le KnightCharge1204
est préparé séparément pour la quatrième vague ; aucune assimilation à1203.
Le contrôle visuel principal de la troisième vague n’est pas encore établi.
La mesure de fluidité complète en mouvement/combat reste également ouverte.


Contrôle navigateur effectué ensuite : lobby → salle → Start → première
vague48, puis passage aux vagues2/3 avec HP0 comme arrangement des deux
premières, sans modifier les compteurs ni la finalisation. Troisième vague
réelle40, deux vagues terminées, base29800, aucune faute ; le screenshot
principal montre le Knight au contact et le HUD personnalisé. Aucun warning
ou error dans la console. Preuves browser-round3-transition.json et
browser-round3.png dans le même dossier. Ce parcours accéléré ne qualifie
ni la fluidité d’une partie complète ni une comparaison visuelle S5Runtime.
L’onglet et le seul serveur5340 de test ont été fermés ; le serveur5174 utilisateur
reste intact. Le chargement froid du serveur de test était lent mais a abouti.


## 23 octobre — quatrième vague raccordée

Le principal prépare maintenant104 modèles et expose quatre vagues.
La quatrième contient un vrai KnightCharge1204 de1500HP : script Charge,
Normal00000_1, attaque5/sixBOX, sons doubles, armure et corps distincts.
Le parcours complet1→2→3→4, les dégâts réels IA→joueur, puis Death et
finalisation passent dans conquest-encounter-round4.test.mjs. Compilation
réussie : four-round-integration-tests.tap / four-round-build.log.

Les cinq requêtes persistantes et Knight_death2 restent explicitement en
attente de rendu, sans faux effets substitués. La politique MoveBox Charge
est stricte ; le clip d’attaque5 existe réellement. Le raccord des vraies
particules Rook est aussi présent, avec service global retenant ses Death
après la durée de vie de l’acteur ; son contrôle final est en cours.
Quatre vagues source et la conclusion restent à livrer. NativeReady=false.


Controle navigateur quatre vagues effectue : passage reel jusqu'a1204 seul,
1500HP, sans faute ni consolewarning/error, puis entree dans la base et
quatrieme vague terminee. HP0 des vagues1-3 est un arrangement de test,
pas une validation des combats naturels. Preuves browser-round4-transition.json
et browser-round4.png ; onglet et serveur QA5340 ensuite fermes.
Le serveur de test herite maintenant des exclusions et entrees finies de
vite.config.js : son ancien fichier autonome scannait501HTML archives et
perdait les exclusions work/art/dist/docs. Le serveur utilisateur5174 reste
intact. Ce correctif QA ne constitue pas une mesure de FPS en partie.


Raccord Rook final :18 profils persistants,9 buff destinataire,9 DeathRook
et7 EnterBase authentiques. Le service global retient les effets3500/2500ms
apres retrait de l'acteur et fournit de vrais leases au finaliseur.15 tests
cibles passent, ainsi que la composition3 deja etablie et13 controles finaux
parent (quatre vagues, factories et UI). La compilation finale apres gel des
sources passe dans four-round-build.log. Ces groupes se recoupent ; aucun
total cumule de tests uniques n'est revendique. GPU/refcounts/attache native
du buff restent non qualifies. Les5 effets Charge et Knight_death2 sont la
suite visuelle, sans substitution quand un payload source reste non qualifie.


## 23 octobre — cinquième vague, effets et préparation

Le jeu principal prépare163 modèles et expose cinq vagues. La cinquième
contient59 ennemis source :24 Pawn1003,3 Rook1100,8 Knight1203 et24 Bishop1303.
Le parcours CPU conserve la vraie base, la file de commandes et les propriétaires
jusqu'à la conclusion provisoire5/8. Le Bishop inflige des dégâts au joueur par
sa vraie IA, son état5 retardé et son volume type7 suivi en3D ; aucun projectile
mobile de remplacement. Les19 profils de particules Bishop sont raccordés,
avec sortie d'attaque et rétention des effets Death après retrait de l'acteur.
Ses NodeLoader animés, LINK et EnterBase restent explicitement en attente.
Les cinq effets persistants Charge sont aussi raccordés ; Knight_death2 reste
bloqué sur le payload authentifié CRC a1d5bd70, sans effet emprunté.

Le navigateur a révélé une faute buff Rook→Death absente du scénario court.
Le contrôle de graphe Pawn/Knight distingue maintenant les vrais effets du
propriétaire208 par reçus privés, sans accepter d'enfant inconnu ni effacer
le buff comme s'il appartenait à344. Les tests d'émission réelle800ms→Death→
retrait passent. Le parcours navigateur corrigé atteint59 naissances en vague5,
22 finalisations naturelles et5 effets d'attaque Bishop actifs, faute nulle.
HP0 sur les vagues1–4 reste un arrangement de transition. Le menu de l'IAB
empêche ici une capture propre du HUD sans pause : fidélité visuelle non validée.
Preuves : pawn-finalization-20261023/five-round-browser-after-buff-fix.json,
five-round-full-fx-buff-tests.tap, buff-death-and-bishop-full-tests.tap et
five-round-build.log dans work/game-modes/conquest-recovery.

La préparation CPU du scénario104 modèles passe de20,7849s à10,6595s (-48,7%)
en partageant seulement l'arbre géométrique statique immuable entre trois
services distincts. Les contrôles vivants et les données de contact restent
indépendants. Ce gain de préparation ne prouve aucun gain de FPS en combat.
La sixième vague est en raccord ; les vagues7–8 et la conclusion complète
restent à livrer. NativeReady=false ; l'objectif global S5 reste ouvert.


## 23 octobre — sixième vague raccordée au principal

Le défaut de préparation et les libellés du lobby/salle passent à6 vagues,
210 modèles source préparés. La sixième comporte36 Pawn1003,8 Knight1203,
3 BishopSnipe1314. Le Snipe conserve son vrai corps700×1000/size2,250HP,
immune0, cadence4000ms et aucun AddSound. Sa visée utilise les deux tirages
CRT authentifiés de6C5320 et l'orientation du vrai joueur ; l'adaptation
Controller→direction8C est explicitement S5, sans parité native revendiquée.
Son état5 suit le vrai corps à hauteur/2, soit+500, et produit le volume type7
800/801ms vers le vrai receveur HP. Aucun missile ou son du Bishop1303
n'est substitué. Les effets Snipe et le consumer HP_recovery0.5 restent
explicitement non livrés ; aucune régénération n'a été inventée.

Le test complet1→6 passe avec files/base/Death/retrait/finalisation réels ;
les14 contrôles de livraison ciblés et3 tests du receveur/obstacle passent,
ainsi que la compilation six-round-build.log. Les12 tests dédiés source/IA/
corps/runtime/host de l'agent sont consignés séparément et se recoupent avec
ces validations : aucun total artificiel n'est additionné.

Le navigateur atteint les47 naissances de la vague6, puis18 finalisations
naturelles sans faute ; les contrôleurs de visée et d'attaque Snipe sont
échantillonnés. Le retour dans la salle fonctionne, journaux warning/error
vides pour cet onglet. HP0 sur les cinq vagues antérieures reste un arrangement
de transition, pas une victoire naturelle. Preuves six-round-browser.json,
six-round-browser-logs.json et six-round-room.png sous
work/game-modes/conquest-recovery/pawn-finalization-20261023.
Le serveur et les onglets QA5340 sont fermés ; serveur utilisateur5174 intact.
Restent les vagues7–8, les manques de présentation et la comparaison native
complète. L'objectif global reste actif, nativeReady=false.

## 23 octobre — état courant après huit vagues et raccord Dagger primaire

Les notes de sixième vague ci-dessus décrivent un passage antérieur. Le jeu
principal prépare désormais les huit vagues/325NPC, avec Queen/King et conclusion
locale. Handgun, SMG, Semi Rifle et Assault Rifle livrent leurs records aux vrais
NPC ; le cut primaire Dagger les rejoint en essais. Rush et Shield Dagger restent
fermés. Baisse30→8PV observée dans le navigateur sur les deux personnages,
contacts multiples/dédoublonnage/Health vérifiés dans le raccord principal.
[Livraison et80contrôles ciblés](../work/game-modes/conquest-recovery/conquest-dagger-20261023/MAIN-DELIVERY.md).

L'annonce ready2 est préchargée et raccordée aux événements des huit vagues.
Les passages CPU/QA arrangés de vagues ne valent toujours pas une victoire
naturelle complète. L'optimisation réduit du travail validé mais les performances
sur toute une partie mobile ne sont pas garanties. Les manques de présentation,
de gameplay et la comparaison native complète restent ouverts ; nativeReady=false.
