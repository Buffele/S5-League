# Siege : contrat source et raccordement S5

**21 octobre 2026 — conclusion naturelle observée dans le jeu principal :**
la partie Iron Heart/Beta/femme/Handgun atteint00:00 sans accélération QA,
affiche victoire97–0, joueur7points, puis revient automatiquement dans la
même salle. Start remet effectivement les scores à0–0 et les trois zones au
neutre. L'écran final est capturé pendant sa dernière seconde ; les15secondes
entières et l'animation d'ouverture ne sont pas directement chronométrées dans
ce relevé. Aucun nouveau code/build. Voir [preuve et limites](../work/siege-room-cycle-20261018/NATURAL-CYCLE-20261021.md).

**21 octobre 2026 — retours de capture et maintien :** le fil d'événements S5
annonce les captures et les gains collectifs de maintien à partir des vrais
événements du match. Il évite doublons et historique de la salle précédente.
191 tests ciblés et build existant réussis ; les huit échecs préexistants du
calculateur CSS mobile restent consignés séparément. Ce retour visuel est une
présentation S5, sans qualification de l'annonce native. Voir
[livraison et limites](../work/siege-objective-notices-20261021/DELIVERY.md).

**21 octobre 2026 — bonus retenus au plafond corrigés :** un parcours réel
sur Iron Heart a révélé que les objets franchissaient le plafond après un
contact tangent arrondi en float32. Le monde des bonus applique désormais la
marge pré-contact et la continuation source, sur sa requête de terrain S5.
Les collisions des personnages restent inchangées. Les714transitions natives
exploitables passent à la tolérance d'origine de0.01unité native (erreur maximale
0.00293), sans certification du solveur complet ou des durées de frame ajustées.
Le parcours principal confirme capture, maintien collectif, ramassage score et
chargeur14→15 sans rechargement ;240tests et build existant passent.
Cette livraison remplace l'ancien écart de position de contact décrit ci-dessous
pour ces714pas. Voir [preuves et limites](../work/siege-bonuses-20261018/SUPPLY-SLIDE-20261021.md).

**21 octobre 2026 — présentation Iron Heart :** les dix `indi_flagsign` portant
le flag source billboard sont raccordés à la caméra de rendu ; leur face de
texte est sélectionnée dans la base XZ d'origine. Les matériaux sont réservés
à ces panneaux, sans édition des ressources ou collisions. 54 tests et build
existant passent ; vue isolée tournée et parcours principal inspectés avec leurs
limites distinctes. La matrice native n'est pas comparée et les autres panneaux
DOWN ne sont pas modifiés. Voir
[preuves et limites](../work/ironheart-main-integration-20261017/BILLBOARDS-20261021.md).

**21 octobre 2026 — application du bonus sur chargeur vide raccordée :**
le profil ordinaire conserve le bonus jusqu'à un rechargement effectivement
accepté, y compris s'il est déjà en cours. Il remplit alors le chargeur et
termine le rechargement sans débiter de réserve. Le gain suit l'arme lors
d'un changement d'équipement et disparaît à la mort ou au reset. Le source
B8FC40 et ses consommateurs Enter/Tick de CReloadState sont qualifiés ; les
deux entrées brutes de leur condition ne sont pas des horloges démontrées.
298 tests dans 38 fichiers et build existant réussis, HUD personnalisé inchangé.
Cette livraison remplace la politique immédiate sur chargeur vide décrite
dans l'entrée précédente. La collecte vivante entièrement comparée, les
modificateurs dynamiques et la parité complète des animations/sons restent
ouverts. Les points de maintien restent **uniquement au score de l'équipe**.
Preuves et limites : `work/siege-bonuses-20261018/DEFERRED-MAGAZINE.md`.

**21 octobre 2026 — compteur du bonus de munitions corrigé :** nouvelles
lectures passives des clés globales et relecture des corps B90AB0/B901D0 :
l'effet9 ordinaire `reloadmmo` cible le chargeur de l'arme tenue. La politique
S5 de réserve a été remplacée ; le bonus remplit maintenant le chargeur fini,
sans augmenter ni consommer de réserve. Le libellé visible est corrigé aussi.
184tests ciblés et build existant réussis. Le cas natif d'écriture différée
sur chargeur vide, les modificateurs de capacité et la collecte vivante
entièrement comparée restent ouverts ; le remplissage immédiat S5 demeure
une politique déclarée pour ce cas. Cette livraison remplace les statuts
antérieurs ci-dessous sur le compteur de réserve.
Preuves et limites : `work/siege-bonuses-20261018/MAGAZINE-BONUS.md`.

**21 octobre 2026 — limite de la comparaison du bonus de munitions :** le
comportement S5 décrit ci-dessous reste une politique locale testée. Une
première lecture réelle de grenade donne4/1 via les deux globals de composants,
alors que la sonde les avait nommés chargeur/réserve sans qualification.
La preuve de sélection de l'arme tenue ne suffit pas à qualifier le compteur
modifié par l'effet9. Deux autres essais n'ont pas franchi le démarrage de la
sonde ou sa libération initiale ; toutes les copies propres sont arrêtées.
Aucune parité native de ce bonus n'est annoncée. Reprise bornée et preuves :
`work/siege-bonuses-20261018/NATIVE-AMMO-ATTEMPTS.md`.

**21 octobre 2026 — bonus de munitions et grenades :** la collecte considérait
seulement les runtimes de fusil et de lance-roquettes. Elle traite maintenant
aussi le runtime de l'arme de soutien ou de lancer équipée : la réserve de
grenades épuisée peut être restaurée jusqu'à4, sans remplir le chargeur,
annuler le lancer ou changer les munitions rangées. Le consommateur source
524217→B99E00 sélectionne le slot actuel sans filtre réservé aux fusils.
Six régressions homme/femme couvrent le lancer en cours, le changement d'arme
et le vrai chemin de collecte du monde S5.166tests ciblés et build existant
réussis. La collecte d'un bonus de munitions dans un client S5Runtime vivant n'a
pas été mesurée dans ce passage ; les modificateurs natifs de réserve et la
validation complète de Grenade restent ouverts. Détails :
`work/siege-bonuses-20261018/AMMO-PICKUP.md`.

**21 octobre 2026 — nouvelle comparaison géométrique dans S5Runtime :** trois
bonus réellement créés sur les trois points Iron Heart donnent1745lectures
avec normale, ancre et catégories du solveur.714transitions exploitables
confirment la présence/absence de contact S5 ; les450normales de contact
concordent. Les positions de contact dépassent cependant le seuil existant
de.01unité native, avec un écart3D maximal d'environ1,61mm en scène.
Les264pas libres restent sous le seuil. Trois transitions non expliquées
sont explicitement exclues ; le delta est ajusté, pas directement mesuré.
Ces mesures isolent un écart de résolution, sans certifier le solveur natif
complet ni introduire de réglage arbitraire. Copie dédiée arrêtée et vérifiée.
Preuves et limites : `work/siege-bonuses-20261018/CONTACT-GEOMETRY.md`.

**21 octobre 2026 — réponse de vitesse au contact vérifiée :** 416 cas du
calcul S5 correspondent bit à bit à l'exécution des instructions originales
7D8140/100AF90/100AE40 dans un CPU isolé, avec axes, plans obliques et deux
sens d'approche. Le parcours testé est celui d'un objet ayant déjà touché le
décor ; les effets du premier contact ne sont pas exécutés. Les trois relevés
natifs historiques donnent en complément 262 paires de vitesses compatibles
avec cette réponse et 92 avec le vol libre après un premier contact.
Les deltas et axes sont ajustés parmi des candidats, pas lus dans ces captures.
Cette preuve qualifie l'arithmétique avec une normale fournie, **pas la détection
géométrique, les positions résolues ni le solveur natif complet**. Le calcul du
jeu était déjà conforme et n'est pas modifié. Tests et limites :
`work/siege-bonuses-20261018/CONTACT-RESPONSE.md`.

**20 octobre 2026 — dispersion des bonus corrigée :** les deux angles
d'éjection sont désormais calculés depuis l'identifiant de l'objet par le
générateur source, au lieu de deux appels `Math.random`. Le calcul des vitesses
utilise bien `cos` pourX et `sin` pourZ : l'ancienne association était inversée.
Les imports MSVCR120 du client confirment cette association.266paires d'angles
correspondent à l'exécution du code x86 original dans un émulateur CPU isolé ;
226vitesses issues de trois captures historiques réelles concordent sur la
direction horizontale corrigée, dans une tolérance explicite. Ces captures
ne contiennent pas la toute première frame : vitesse initiale complète,
solveur de contact et RNG serveur de sélection des récompenses restent ouverts.
Détails et preuves : `work/siege-bonuses-20261018/LAUNCH-RNG.md`.

**20 octobre 2026 — volume de ramassage :** la boîte locale autour des bonus
est remplacée par la requête source `7D8490 → 53E240 → 119C230` : sphère de
rayon100 autour de l'objet, distance au segment vertical du corps et comparaison
strictement inférieure à la portée cumulée. Les six familles ordinaires
partagent cette requête. Un contact juste tangent ne ramasse pas ; la portée
latérale et les coins suivent désormais cette forme arrondie dans le jeu.
L'adaptateur utilise encore le corps ordinaire S5 de140×320 issu des dimensions
déjà relevées. Les getters natifs dynamiques68/6C, leurs variations et l'admission
complète par état restent à comparer ; aucune fidélité globale de collecte
n'est déclarée. Sources, validation et limites :
`work/siege-bonuses-20261018/PICKUP-GEOMETRY.md`.

Contrôle navigateur complémentaire : vraie entrée lobby/salle/Start avec les
deux sexes, puis approches arrangées par QA. Le coin conserve les5objets ;
l'approche latérale retire exactement l'objet ciblé et déclenche l'effet de
collecte. Le bonus score observé donne équipe/personnel5→6 ; le bonus HP est
plafonné à100. Après conservation : équipe15, personnel5,10modèles chargés
au sol sans erreur.153tests ciblés et build existant réussis. Ce contrôle
ne compare pas les frontières ni les états de corps avec un client S5Runtime vivant.
Preuves `pickup-browser-*.json/png` et `pickup-contact-browser-delivery.json`
dans le même dossier.

**18octobre2026 — comparaison native du ramassage :** nouvelle capture réelle
du point3 IronHeart, puis bonus score1 ramassé par déplacement natif. Une seule
requête client2047 ; équipe/personnel5→6, capture5inchangée et buff0→1.
Six images du véritable client montrent l'effet de gain puis sa disparition.
Le chemin S5 de collecte admise reproduit ces compteurs (15tests ciblés passent).
L'incertitude des temps de capture et la caméra différente ne qualifient pas
le rendu précis des particules. Détails/limites :
`work/siege-pickup-effects-20261018/NATIVE-REVIEW.md`.

**18octobre2026 — retour des bonus :** effet original `item_get.seq` complet
(8couches/6textures) au ramassage local, placé à la position réelle de l'objet
avec le décalage sourceY+80. Sons originaux `item_drop.ogg` au premier contact
et `item_gain.ogg` à la collecte admise.9fichiers récupérés avec CRC/hashes,
raccord main/salle/Start et nettoyage sur reset/fin/sortie. Navigateur M/F :
les8couches ont été effectivement dessinées sur leurs fenêtres respectives,
5impacts/5objets puis1son de collecte, expiration et reset propres.
689tests/85fichiers et build existant réussis. Rendu natif complet des particules
et spatialisation restent non certifiés ; aucune nouvelle comparaison vidéo
native. `work/siege-pickup-effects-20261018/DELIVERY.md` et `browser-summary.json`.

**18octobre2026 — bonus dans les résultats :** les compteurs de collecte
EXP/PEN démarrent à0 et sont transmis au classement final. L'écran les désigne
comme bonus ramassés uniquement ; aucune récompense complète de match ni
progression persistante n'est calculée. Le résumé personnel reste visible sur
petit écran, même lorsque les colonnes EXP/PEN sont masquées. Les points de
conservation restent réservés à l'équipe, sans crédit personnel ni conversion
en monnaie. Tests et limites : `work/siege-bonuses-20261018/RESULTS-DELIVERY.md`.

**18octobre2026 — chute des objets :** l'anneau de placement provisoire est
remplacé par une file d'émission180ms, l'impulsion native depuis le core,
gravité/freinage et modèles fast→slow au premier contact. Trois vrais objets
relevés dans deux copies privées donnent109transitions de vitesse reproduites
bit à bit ; positions libres comparées avec une tolérance explicite et la marge
qualifiée du solveur. Iron Heart : objets en vol puis au sol, PEN/score ramassés
dans le jeu principal.669tests/82fichiers et build existant passent. Le RNG par
ID et le solveur de contact natif complet restent non certifiés, ainsi que
sons/compositionSEQ, fever et time_bonus. Détails et limites :
`work/siege-bonuses-20261018/FLIGHT-RESULT.md`.

**18octobre2026 — objets et conservation raccordés dans S5 :** les apparitions
ordinaires suivent `seize_mode_newinfo.x7` :5objets à la capture, puis1 toutes
les10s, plafond10 ; modèles et textures d'origine récupérés. HP30, SP200 et
score1 sont reliés aux ressources/compteurs réels, avec les autres entrées
ordinaires de la table. La conservation donne10points par60s à l'équipe
uniquement, attribution explicitement confirmée par l'utilisateur. Ce total
est séparé des scores personnels et visible dans le tableau S5.
666tests/81fichiers et build existant passent. Navigateur : équipe5→15 pendant
le maintien, personnel5inchangé ; objet score→équipe16/personnel6.
La dispersion au sol et le volume de collecte restent des politiques locales ;
trajectoires natives, fever et time_bonus restent ouverts. Aucune nouvelle
mesure native des timings automatiques ni validation complète du mode.
Détails/preuves : `work/siege-bonuses-20261018/DELIVERY.md`.
Ce statut remplace les mentions antérieures « upkeep/buffs non raccordés »
pour S5 ; l'adaptateur de serveur privé S5Runtime reste un sous-ensemble distinct.

**18octobre2026 — fin de partie :** le délai local supplémentaire de10s
« Match Over » est retiré du parcours standard. Siege passe directement en
résultat à la limite de score ou de temps ; le composant commun affiche les
meilleurs scores pendant15s, puis retourne automatiquement dans la même
salle. Cela suit l'observation explicitement fournie par l'utilisateur ;
aucun producteur natif d'un délai supplémentaire de10s n'était établi.
`resultAnnouncementSeconds` reste configurable pour les fixtures isolées.
Les tests du vrai raccord main couvrent l'entrée immédiate, le classement
figé, les deux bornes du délai15s et le retour sans relance de match.
Le HUD personnalisé S5 reste conservé selon la dernière consigne.

17 octobre2026. **Iron Heart151 est maintenant jouable dans le parcours
principal Siege**, avec ses scènes/textures d'origine, les spawns des deux
camps et les trois volumes relevés dans S5Runtime. Captures observées sans QA :
femme/Alpha point3 et homme/Beta point2, chacune à5points, avec le bon slot HUD.
Retour salle, redémarrage et respawn Beta vérifiés.316tests ciblés et build
passent. **Mode natif complet toujours non prêt.**

Livraison et limites actuelles :
`work/ironheart-main-integration-20261017/DELIVERY.md` et `receipt.json`.
`src/ironheart-world.js` charge neuf scènes authentifiées et48DDS visibles,
sans déplacer/recentrer le décor. Le déplacement utilise1896triangles de
terrain retenus, les tirs le maillage `oct_weapon` séparé de1992triangles.
La sélection des masques et le solveur natifs complets restent non certifiés.

La nouvelle lecture native appartient à la session
`local-launch-20261017-155159-514c9f`, un seul joueur réel. Les six OBB des
trois points comprennent maintenant leurs neuf floats d'orientation ; leurs
centres/dimensions correspondent aux Box source. Le fichier BGINFO déclare
explicitement `SEIZE_01→seize_slot3`, `SEIZE_02→1`, `SEIZE_03→2`, confirmé par
la mémoire native. Le HUD reçoit l'ordre des slots1/2/3, indépendamment de
l'ordre3/1/2 du gestionnaire. La copie a été arrêtée par sa session exacte.

## Capture et scores

`seize_mode_newinfo.x7` fixe gauge30000, tick1000ms, core+3000/helper+1000
par tick, remise à zéro à sortie/mort du core, récompense capture5/helper1.
Le premier choix de `_eu_gameinfo.x7` mode11 est200points/10minutes.
Ces paramètres sont vérifiés par `work/game-modes/siege-recovery/trace-source.py`.

Le PE authentifié SHA-256
`6bea9d8cc2503a1e660c1d8a9dfd1241f394207c4f1cb84a9d4a1fea3d3c8017`
confirme1099220→captureScoreC0/countCC,10992A0→captureAssistScoreC4/countD0,
1099320→buffScoreC8/countD8 ;10993E0→killA4/2points.
Assist/heal-assist natifs valent1point chacun. Les ledgers d'équipe conservent
objectif(capture/aide/buff) et combat(2/1/1) séparément.
B0/B4/B8/BC etD4 sont opaques pour Siege et restent0 ; les morts/suicides
locaux S5 sont des champs séparés et ne reçoivent aucune sémantique native.

La capture native du2octobre, IronHeart151/point3, conserve5points/count1,
puis un buffscore1. Le résultat recharge les scores mais pasCC/D0/D8 : ces
counts restent0 après le reset préalable du full briefing. Le résultat
neutralise également l'ownership des points. S5 conserve son ledger d'événements
pour l'affichage, et `nativeCounters()` projette les counts0 au résultat.
`tools/compare-siege-historical-scores.mjs` compare70champs entiers/ownership
des phases capture, buff, résultat, reset et nouvelle capture. Sa première
exécution a détecté l'ownership S5 restéAlpha en résultat ; preuve rejetée
conservée, comportement corrigé puis70/70 réussis. Ce comparateur utilise les
captures historiques, sans nouvelle partie native ni comparaison de trajectoire.

## Volumes réellement consommés

AEF290 etAED920 appellent11B4BF0 contre `actor[0x48]` (+120). Le prédicat
est une intersection **OBB/OBB par SAT**, pas un test du centre ni un rayon.
Six axes de face et neuf axes croisés ; contacts tangents inclus par≤.
Le seuil parallèle global149F250 vaut0.9999989867210388, relu dans le PE.
`siege-zone.js` porte cette forme et le court-circuit des axes parallèles.

La capture authentifiée `siege-fresh-waypoint-replay-c2926e.json` contient les
bounds réellement consommés de point3 : core demi-extents500/450/500,
assist1250/450/1225.125, actor70/160/70, unités natives. Le centre assist est
décalé de+36.205078125 enZ par rapport au core. `siege-zone-data.js` ne conserve
que ces nombres. Ils sont convertis à.006 une seule fois.

La capture historique du2octobre omettait les neuf floats des bases OBB.
Cette limite est levée **pour Iron Heart** par le relevé complet du17octobre,
conservé aussi dans `tests/fixtures/native/ironheart-layout-20261017.json`.
Pour les autres cartes, les dimensions, forme et overlap restent portés depuis
ce sous-ensemble historique ; l'orientation identity des points et leur
translation sur la carte S5 restent déclarées locales. Le
centre vertical du core est placé à son demi-height au-dessus du sol S5 ; le
centre de l'acteur est à160unités au-dessus de ses pieds avec son yaw courant.
Ce chemin de placement local n'est pas utilisé sur Iron Heart, qui fournit
directement les trois couples core/assist relevés dans le client natif.
Tests : faces/coins tangents, centre acteur extérieur mais corps chevauchant,
horsX/Z/Y, offset assist et500cas orientés comparés au SAT OBB indépendant Three.
Les limites float32/FPU sur une frontière native live restent à vérifier.

## Raccordement disponible

`SiegeState` gère présences, jauges, catégories, capture/recapture, morts,
respawn, temps, limite, résultat et reset. `SiegeCombat` réutilise les contacts
opposant les équipes et fait avancer ses bots par les vrais Controllers jusqu'à
un point non allié. `createSiegeMatch` relie les positions effectives aux OBB,
HP/morts, reset d'actions/effets, verrouillage et UI. Les bornes de pas sont≤1/30s.
Les indicateurs de monde sources sont raccordés depuis le16octobre2026 :
`siege-indicator-policy.js` porte paliers/choix de modèle et ancrage OBB,
`siege-indicator-scene.js` conserve racine, instances par index et bones,
`siege-zone-effects.js` suit l'état réel et le cycle de vie du match. Le contour
rectangulaire reste un secours pendant le chargement ou un échec explicite.
Les consommateurs natifs AEDFD0/AEE3F0/AEF850 établissent cinq paliers,
rouge/vert relatifs, transitions et position ; la projection des états S5 reste
déclarée locale. Sources et limites : `work/mode-world-effects-20261016/DELIVERY.md`.
Les overlays auxiliaires `indicator_base_red/green` sont également raccordés,
avec clips exacts in00/in20/.../in100, mémorisation du palier et nettoyage des
chargements asynchrones. Depuis la preuve de sélection nommée115D0A0→1152DC0→
7C7B00, leur horloge commune est conservée au changement de palier : les12
modèles qui possèdent le clip ne repartent plus à zéro face aux27autres.
L'absence de clip de transformation résout le clip initial in00 ; la durée
commune des sources est9600ticks. L'horloge dédiée `scn-controller-clock.js`
sert aux socles et aux rôles, en conservant la clé finale à égalité.

La transition SRT native7C9BA0/7C97E0 utilise un paramètre2000 **ticks**, soit
environ0,417s, avec horloge de piste précédente et synthèse lors d'une nouvelle
transition interrompue. `scn-transform-transition.js` porte désormais cette
transition pour les deux socles : ancienne piste mobile, interpolation SRT,
boucle stricte et synthèse constante7C9EC0 lors d'une interruption. Le delta
de cette horloge utilise le produit **MULSS arrondi en float32** avant
troncature, séparément du produit x87 du contrôleur commun. Une sélection
entre évaluations conserve l'ordre natif : échantillon de la piste courante
à l'ancien temps, puis avancement de l'ancienne piste avant mélange.
Le constructeur active le mélange par défaut ; la rotation appelle
D3DXQuaternionSlerp. L'arithmétique Three.js n'est pas annoncée identique
bit à bit aux floats D3DX. La planification des scènes masquées et la transition
visuelle dans une véritable zone Siege native restent à comparer. Preuves et limites :
`work/siege-base-transitions-20261017/source-proof.json` (horloge commune) et
`work/siege-base-transitions-20261017/blend-proof.json` (transition SRT).

Les propriétés scalar/UV ont maintenant leur sélection indépendante dans
`siege-base-properties.js`. Les lecteurs1155690/1159970 ne créent pas de piste
pour un compte sérialisé nul.12579A0/1256FD0 ignorent les arguments de mélange
et mémorisent leur première sélection réussie pour les noms absents. Le modèle11
n'a ainsi pas de scalar in00 : après in20, le retour in00 retrouve sa piste
scalar0,7, au lieu de restaurer artificiellement1. Les lecteurs source
`anchoring-scn-scalar-source.js` et `anchoring-scn-morph-source.js` sont réutilisés
sans modification : valeur1 avant la première clé scalar, interpolation source,
écritures morph absolues et maintien des attributs non écrits. Les deux sources
de socle n'ont aucun morph de position ; chacune possède six pistes UV.
La correspondance node+C4→opacité Three.js reste l'adaptation S5 déjà utilisée ;
le multiplicateur shader natif, le layout GPU et l'ordonnancement du rendu ne
sont pas annoncés vérifiés. Preuve :
`work/siege-base-transitions-20261017/properties-proof.json`.
AED920 établit que les fichiers d'acteur
`seize_flag_in/out` désignent les rôles core/helper, pas l'entrée/sortie.
Depuis le17octobre, `siege-role-effects.js` raccorde leurs quatre variantes
allié/adversaire à la racine du rig, sans deuxième échelle ni bone inventé.
Le choix suit le core sélectionné, son équipe et les présences OBB déjà
consommées par le match. Sortie, mort, capture, résultat, reset, changement de
rig et chargements tardifs sont gérés par un propriétaire par acteur.

La nouvelle preuve `work/siege-scn-defaults-20261017/controller-proof.json`
relie le vtable SCN observé au constructeur concret de CAnimationController :
activé1/boucle1/vitesse1. Le clone du chargeur11B3840 lie les pistes, sélectionne
le premier clip non vide et remet le temps à0 ; chacun des quatre fichiers
de rôle possède un seul clip de4800ticks.1153A30 tronque le delta entier enms
multiplié par4.800000190734863 et boucle seulement si temps>durée, en gardant
la clé finale à égalité. Le port utilise cette horloge pour les rôles et les
socles ; la phase et la cadence du navigateur restent locales.

La lecture VM_READ de25échantillons dans S5Runtime a observé ce contrôleur actif et
une boucle sur la couronne Captain, avec fermeture vérifiée de la copie dédiée.
Ce contrôle commun et la chaîne statique ne sont **pas** une observation de
rôle Siege dans une zone native. La comparaison visuelle native des rôles,
les Shape emitters et l'arbitrage natif complet restent ouverts. Aucune durée
ou émission de la SEQ voisine n'est déduite de cette preuve SCN. Si plusieurs
points S5 se chevauchent, le premier rôle éligible suit l'ordre local des points.

Le parent a raccordé `SiegeCombat`, `createSiegeMatch` et le choix de menu/URL
dans main. `installSiegeQA` fournit des fixtures séparées, en utilisant le helper
small-step du parent. Il n'agit jamais en partie normale.
Les tests exercent vraies entrées Dagger homme/femme, déplacement Controller
jusqu'au point, bot capture/helper, obstruction friendly-fire, mort/respawn,
résultat et nettoyage. La série principale
`work/game-modes/siege-browser-v1/comparison.json` réussit24scénarios/
116contrôles M/F : vraies présences OBB, Dagger, mort/respawn et bouton Rejouer.
Les autres fixtures repositionnent les acteurs/raccourcissent les délais ou
préparent le score de résultat. Cette preuve précède le nouveau layout XUI
et ne remplace ni sa recapture ni une partie native IronHeart comparée.

## Présentation XUI Siege raccordée

`siege-ui.js` utilise désormais deux panneaux Alpha/Beta et les colonnes
du XUI2 Siege, dont **captures** à la place des morts Captain. Fonts originales,
sprites de panneaux/bannières et ping local viennent du lot public authentifié
de l’agent Interface. Les détails conservent captures/aides/buffs/combat/morts
locales séparés ; aucun score ou compteur de règles n’est changé.

Le HUD affiche Point1/2... plutôt que l’identifiant technique local-center.
Les drapeaux sont découpés par UV exacts dans siege_ui_dummy : Alpha, Gamma
neutre et Beta correspondent aux équipes littérales, sans prétendre établir
une couleur relative allié/ennemi pour le joueur. L’ID interne du point et ses
volumes restent inchangés. Contestation et progression sont toujours lisibles.

Le helper `mode-native-scoreboard.js` conserve header rects et marges contenu
31/40 du panneau1287 ; adaptation de petite fenêtre par empilement/scroll,
minimum de font et hauteur de ligne déclarés. Aucun seize_ok.seq de substitution
ni autre effet manquant ajouté. Style partagé sans duplication,40tests et build
réussis ; HANDOFF/proof sous `work/game-modes/native-ui-recovery/`.
Recapture M/F de cette présentation et comparaison visuelle S5Runtime restent ouvertes.

## Politiques et limites maintenues

Sur les cartes S5 autres qu'Iron Heart, le point par défaut est placé à4unités
du spawn et projeté sur un sol disponible ; ses volumes sont adaptés localement.
Iron Heart utilise les trois paires core/assist mesurées dans S5Runtime et les
marqueurs de spawn source, avec une sélection et une projection locales.
L'AI reste locale. La contestation met la jauge en pause, premier core déterministe,
HP100/respawn4s, dégâts alliés bloqués, gagnant au plus
grand total objectif+combat et égalité neutre : politiques S5 explicites.

Le maintien et les drops ordinaires sont maintenant raccordés dans S5, selon
les livraisons du18octobre ci-dessus. Le maintien récompense l'équipe seule,
suivant la confirmation utilisateur ; son planning serveur original n'est pas
mesuré. `time_bonus` et la sélection des tables fever restent **non implémentés**,
car leur déclenchement serveur original n'est pas établi. Autres effets de buffs, vrais
coéquipiers/contestation native, qualification d'assist, compétences complètes,
comparaison exhaustive d'Iron Heart, scènes UI/audio et match multiclient
comparable restent ouverts.
`receiveBuffScore` est utilisé par la collecte admise dans S5 ; l'adaptateur de
serveur privé S5Runtime reste un sous-ensemble distinct. Aucun gate de fidélité
globale n'a été ouvert.
