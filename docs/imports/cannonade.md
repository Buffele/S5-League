# Cannonade — reprise du 15 octobre 2026

Statut : **jouable en essais dans le jeu principal ; fidélité native incomplète**.
Item2030002, type7. Sélection par menu, inventaire et touche **J**.
Le gate natif reste non prêt.

## Sources et ressources

`tools/prepare-cannonade-source-contract.mjs` extrait séparément NormalState,
RunState, ReloadState, UseWeapon1State et StandardCannonade depuis les Lua
actuels authentifiés : `work/cannonade-recovery/source-contract.json`.
`work/cannonade-recovery/source/manifest.json` contient48 ressources récupérées
avec CRC/SHA, sans échec. `tools/restore-cannonade-assets.mjs` régénère le modèle
de9 maillages, les textures,6 sons,7 séquences et leurs4 modèles d’effets.
Les deux nœuds CActLightning sont désormais raccordés ; aucune omission de nœud
n’est déclarée dans le manifeste public. Leur fidélité GPU reste à vérifier.

Les24 clips sélectionnés existent déjà dans chacun des rigs de base. Les pistes
directes sont contrôlées contre le SCN actuel, à une tolérance native de0.00002
(écart maximal observé inférieur à0.000008 dû à la sérialisation décimale).
Les bundles `*-source.json` conservent ces pistes ; les deltas runtime vides
réutilisent les clips existants sans alias ni doublon. Le merge vérifie leurs
noms, durées et nombres de pistes. L’extraction/parsing prouve EOF exact.

## Contrat d’animation

| État | Torse | Jambes |
| --- | --- | --- |
| Repos | E0018 | même clip |
| Course | E0019 dans les huit directions | E0019–E0026 selon les clés Lua |
| Charge | E0002, blend E0001 haut/E0003 bas | E0001 arrêt, E0008–E0015 mobile |
| Tir | E0005_C, blend E0004_C haut/E0006_C bas,1500ms demandés | mêmes jambes d’action, fitting800ms mobile |
| Recharge | E0007, boucle native4800ticks/1000ms | E0007 arrêt, course mobile conservée dans S5 |

Le tableau de staging ancien affectait huit clips au torse et employait E0004–6
sans suffixe `_C` : il est remplacé par les sources actuelles. Les courbes E ont
une handedness+1 ; le mapping sémantique est conservé. Le contrôle générique
attend−1 selon Twin Blade et reste en échec, sans miroir ni gate assoupli.
Le choix natif effectif des clips et les huit directions doivent encore être
observés dans S5Runtime. Les tests S5 seuls ne les certifient pas.

Attache équipée R_Hand_Dummy, link0 ; rangement Spine_Dummy selon
weapon_attach.x7 type7. Ne pas utiliser le socket de rangement au repos équipé.

## Raccordement au jeu

`src/cannonade-runtime.js` gère maintien/libération, munition unique par tir,
charge maximale, recharge progressive et annulations dash/mur/changement d’arme.
`src/cannonade-contact.js` attend100ms après le relâchement, puis résout le point
visé jusqu’au premier mur ou acteur et applique une explosion unique par cible.
Il n’existe plus de projectile mobile inventé. Le rayon vient
du Lua :400×0.7 ou400×1.2 unités natives. Une impulsion AddPushCondition
(100,2500,−5000) ou(200,5000,−5000) déplace réellement la cible via les collisions,
avec l’intégrateur float32 existant ; aucune vitesse Blow générique n’est ajoutée.
Correctif physique du15 octobre : `native-push-collision.js` applique le cap
avant collision et, pour une descente, soumet XZ puis Y en relisant la position
résolue. Cet ordre est vérifié dans le PE actuel51C2F0→7B0180. Le cap180unités
provient des indices108×42 du snapshot de registre FREE du23 septembre ; son
genre/état n'est pas renseigné et le raw original n'a pas été retrouvé dans ce
passage. Il ne constitue pas une mesure d'acteur Cannonade du15 octobre.
Les gates actor1/400 et le modifier+40 restent une politique locale neutre,
et le skin/solveur natif n'est pas porté. Les collisions réelles arête/mur/sol
sont couvertes dans `tests/native-push-collision.test.mjs` ; sources et rapport
dans `work/game-modes/captain-recovery/push-collision-source.json`.
Les munitions restantes sont conservées lors d’un changement d’arme ; un reset
de partie réinitialise le chargeur.

`src/cannonade-effects.js` suit le socket après mixer pendant la charge, fixe
la séquence de tir au canon, déclenche l’impact au point du même calcul différé
et nettoie les instances au reset/changement d’arme. Les6 sons récupérés
sont référencés sous sound/cannonade. Présence/routage vérifiés ; écoute native
et bouclage restent à comparer.

`src/cannonade-charge.js` porte l’interpolation float32 de57DE20, continue
entre les puissances minimale et maximale avec les bonus plat/taux de condition
et clamp supérieur. Le profil natif équipé observé donne7.203390121459961 à
36.01695251464844 ; S5 utilise désormais ces deux extrémités arrondies
indépendamment. Le catalogue8.5 reste conservé comme donnée source, sans règle
de normalisation inventée pour les autres équipements. Les PV finaux,
l’armure, les volumes de cible, l’occlusion centrale, la direction de Push et
la politique de réception restent des reconstructions non certifiées.
La récupération de l’état est **500ms**, distincte des1500ms demandés à SetAnim.

## Route native et limites de la lecture de puissance

`work/cannonade-recovery/native-engine-v3.json` conserve huit cas réussis,
deux sexes × quatre maintiens. Le wrapper13B6500 est partagé avec Normal ;
son enfant13AD264 identifie la Cannonade active,13B5DC4 son retour au repos.
Les deux attaques sont CExplosionAttack13B3668, avec délai100ms ; les champs
de charge/récupération valent2000/500ms. Le retour à Normal est observé
500–563ms après la détection du relâchement, polling/transport inclus.

Les deux noms d’initialisation de roquette sont vides dans l’instance native.
581B70 ne crée une roquette que si l’un de ces noms est renseigné ; ce chemin
appartient au Rocket Launcher.57CC67 actualise ici CExplosionAttack et57EB39
place son origine une unité native avant la destination visée. L’ancien
prototype à vitesse60 et limite150 est archivé dans obsolete-prototype-projectiles.js.

`tools/compare-cannonade-engine.mjs` vérifie62 points contre ces huit cas,
incluant le retour S5 à500ms à30/60/120Hz : engine-comparison.json.
Cela compare la **valeur du paramètre d’activation**, pas encore l’instant
d’un véritable dégât natif sur une cible.

Les getters natifs4AD540 et l’horlogeFF7E40 sont redirigés dans le client live.
Les floats protégés décodés par simple XOR et l’uptime système ne sont donc
pas assimilés à une puissance logique ou à l’horloge du gameplay.
Une valeur protégée décodée seule ne prouve pas les dégâts effectifs.
La sonde opt-in Cannonade emploie les getters sur le thread de frame
de la sonde originale, sans deuxième attache Frida.

La mesure logique avait été bloquée après trois essais distincts :
ABI cdecl invalide corrigée en mscdecl, mauvais accessor d’acteur corrigé selon
AppearanceMemory, puis lecture réussie mais enfant Normal observé après le tir
initial du worker. Aucun échantillon de puissance logique n’avait été obtenu.
Les rapports v1–v3 sont conservés dans native-logical-values-v*.json.
La reprise est maintenant vérifiée : après1.8s de stabilisation, le scénario
exige Normal et une munition disponible AVANT la commande, puis l’entrée réelle
de13AD264 en phase1 AVANT toute lecture. L’ancien délai700ms ne prouvait pas
cette entrée ; la cause exacte de son échec n’est pas attribuée à un timer précis.
`native-logical-values-v4.json` conserve six cas réussis (deux sexes × trois
maintiens), les extrémités et les puissances libérées. Les trois sources de
cette capture sont archivées sous native-logical-values-v4-* avec leurs hashes
originaux vérifiés. Le blocage historique est conservé dans logical-values-blocker.json.

`native-logical-values-v5.json` ajoute le getter natif57DE20, sur le même thread
et avec prologue vérifié. Il est encadré par deux lectures de l’horloge native.
`tools/compare-cannonade-logical.mjs` compare49 puissances pendant la charge :
48 exactement à la même horloge, une encadrée par un intervalle de1ms ;52
contrôles de paramètres/disponibilité passent. Six puissances libérées sont
dans leurs bornes temporelles indépendantes, plus larges. Aucun temps de
libération n’est déduit à rebours des dégâts pour fabriquer une comparaison.
Ces preuves établissent la courbe logique du profil observé, pas les PV reçus,
l’armure, le critique ou les autres équipements. Les sessions privées v4/v5
ont été arrêtées avec shutdown_verified=true.
Les copies privées ont été arrêtées avec identité et nettoyage vérifiés.
Le démarrage vérifie maintenant tous les exports requis avant de reprendre le
client ; une sonde chargée partiellement ne peut plus être annoncée prête.
Trois tests de ce contrôle et deux de BoundedScriptRpc passent. Une nouvelle
session a vérifié les sept exports et une lecture frame de l’acteur au repos :
probe-initialization-recovery.json. Ce test ne certifie pas à lui seul la charge logique.

Les deux Lightning de tir partagent le hash source et yellow_beam, fenêtre
SEQ0–100ms. Le lecteur natif établit trois points, largeur80 unités, jitter0,
répétition UV4, scroll4/s, montée0ms et extinction500ms. Le port utilise le
socket vivant après mixer ; la destination est le premier contact visé figé.
Cette politique de destination attend encore la comparaison aux matrices natives.

L’oracle isolé de1290270 reproduit exactement156 mises à jour scalaires.
Six requêtes sur le thread de frame natif, deux sexes et trois phases, observent
x87 en précision24 bits, arrondi au plus proche. L’oracle sauvegarde/restaure
ce mode explicitement ; son ancien résultat avec le mode hôte est historique.
La construction de géométrie est stubée dans cet oracle : les vertices évalués,
le mélange GPU et l’entrelacement global RNG ne sont pas certifiés par ce test.
Preuves : native-lightning/frame-fpu-v1.json, scalar-oracle-v2.json et
lightning-scalar-comparison.json.

## Comparaisons natives et correction de la recharge

`tools/s5runtime-local/capture_cannonade_states.py` utilise le client privé et la sonde
existante, sans nouvelle attache Frida ni écriture mémoire. Le rapport
`work/cannonade-recovery/native-states-v2.json` est complet pour les deux sexes,
avec gates natifs équipement/démarrage/ammo/TCP et empreintes de sources.

La constante88=1000 ne désigne pas la durée d’un chargeur complet : avec deux
munitions manquantes, S5Runtime insère la troisième vers1031–1032ms et la quatrième
vers2047ms après la requête clavier. L’incertitude inclut transport, tick natif
et polling. S5 insère donc **une munition toutes les1000ms** au lieu de remplir
tout le chargeur après1s. La boucle E0007 reste séparée de cette mécanique.

Le getter natif1027930 expose la matrice évaluée node+34 ;1155C00 expose le
parent+8C. Empreintes vérifiées par `weapon_node_memory.py`. Dix observations
(repos après tir, maintien, libération, recharge et remplissage, deux sexes)
sont comparées après mixer par `tools/compare-cannonade-states.mjs` :
position maximale0.000292 unité native, orientation maximale0.00439°, échelle
dans la tolérance0.00001. Rapport : `native-attachment-states.json`.

**Périmètre limité : racine visible AreaRailgun_Parts03 relative à sa main.**
Cela ne prouve ni les IDs natifs de clips corporels, ni les positions absolues,
ni tous les sommets, ni le socket du canon. Lecture cohérente avant/après,
non atomique ; aucune observation de corps n’est fabriquée pour le gate.

La première série a conservé son cas masculin réussi puis rencontré une
connexion HTTP admin expirée, tandis que le PID22972 était toujours vivant.
Node utilise un keep-alive de5000ms. `appearance_server_control.py` réouvre le
transport avant un POST après4s d’inactivité, avec TCP_NODELAY, et ferme après
une erreur **sans rejouer un POST dont l’issue est inconnue**. La reprise v2
conserve le résultat masculin authentifié et exécute le cas féminin sur le
même client. Aucun redémarrage du jeu ni perte du résultat validé.

## Zoom natif et raccordement

`tools/s5runtime-local/capture_cannonade_zoom.py` lit la caméra native (singleton
16ED578, classe149B6B4, angle vertical à+434) sans écriture mémoire et pilote
les entrées avec la sonde originale. `native-zoom-v1.json` conserve l’hypothèse
d’angle stable15 rejetée ; `native-zoom-v2.json` est complet sur les deux sexes.
L’angle observé passe de90° à45° au clic droit, reste à45° après relâchement,
charge et tir, puis revient à90° au second clic ou au changement d’arme.
Le zoom seul ne consomme aucune munition. Le catalogue sniper_mode_fov=15
ne donne donc pas directement l’angle de cette caméra.

S5 reproduit cette bascule et sa cible45° dans le jeu principal, avec état HUD
Zoom. `tools/compare-cannonade-zoom.mjs` passe24 contrôles.

La transition immédiate du premier raccordement est remplacée par
`src/cannonade-camera.js`. L’owner natif est donné par1644AC8 (classe13C26D8),
son contrôleur FPS à+C par753E70 ; l’alias actif+2C est vérifié selon51A860.
Classe FPS13C2AD4.753F10 retourne l’objet d’entrée+20, pas ce contrôleur ;
765780 retourne un descripteur de type, pas une instance de caméra.

`native-zoom-transition-v1/v2.json` conserve deux captures complètes sur les
deux sexes.768140 demande d’abord15°, réponse1.5 ; les lectures voient un
premier changement d’angle vers15°, puis une cible45°.7681E0 restaure90° avec
réponse1.75. Le hook externe qui ramène la cible à45° n’est pas décodé : S5
reproduit ce profil observé, sans inventer une règle universelle pour les armes.
Le coefficient0.5 du sprint n’est pas réutilisé.

Le code live diffère du PE à76620D : chargement d’un delta float64 en
millisecondes, puis conversion float32 et multiplication par float32(0.01),
clamp1. Le bloc SSE766622–766672 et les stores d’entrée/sortie sont identiques
au PE. Preuve bornée en lecture seule : native-zoom/live-camera-code-v1.json.
`tools/compare-cannonade-camera.mjs` passe32 contrôles et compare exactement
162 changements d’angle (erreur0), y compris le pipeline S5 avec ses transitions
de cible. Les8 changements de paramètres sans variation d’angle sont exclus du
compte des angles, conservés séparément. Le polling cohérent n’est pas une
preuve d’échantillonnage de toutes les frames. La source exacte de la première
capture est archivée sous native-zoom-transition-v1-capture.py.

La caméra avance une fois par rendu en partie normale et une fois par tick
du scénario QA. Le temps QA est figé après simulation : les rendus suivants
ne terminent plus la transition à la place du scénario. À16/64/192/800ms,
l’entrée S5 donne72/56.85/46.32/45°. Seize captures des deux corps et112
contrôles passent dans browser-camera/. Le Semi Rifle conserve25° ; un vrai
clic droit dans l’arène normale active/quitte le HUD Zoom sans munition perdue.
Translation, réticule, visibilité du corps, autres profils et politique du zoom
pendant dash/impact/recharge/sprint restent non certifiés.

## Vérifications et limites

- `tests/cannonade-gameplay.test.mjs` : deux corps, huit directions à trois
  orientations, grip après mixer, visée haut/centre/bas, mobilité et recharge,
  charge/libération à30/60/120Hz, contact unique, murs et poussée réelle.
- `tests/cannonade-effects.test.mjs` : dépendances, charge au socket animé,
  attente100ms, impact au même contact et nettoyage. Les Lightning sont inclus.
- `tests/native-lightning.test.mjs` et contrôles de rendu associés : paramètres
  source, scalar clock, dépendances et géométrie S5 ; aucune certification GPU native.
- `tests/cannonade-native-logical.test.mjs` et `tests/cannonade-zoom.test.mjs`
  vérifient les nouvelles comparaisons, arrondis float32, commandes réelles
  MovementInput, maintien/relâchement, charge/tir et changement d’arme.
- `tests/cannonade-camera.test.mjs` :162 comparaisons natives, première cible,
  coefficients distincts, float32, projection et entrées réelles des deux corps.
  La sortie libère le contrôle de caméra au point fixe float32, même lorsque
  l’angle reste quelques ULPs sous90° ; le sprint ne reste pas bloqué indéfiniment.
- Régressions ciblées actuelles :166 tests JS passent, build réussi.
  Cinq tests Python de sonde/RPC passent dans ce passage. Rapports
  lightning-regressions.tap, lightning-build.log et lightning-native-gate.json.
  Les146 tests du passage caméra restent une preuve historique.
  Les28 tests Python du précédent passage restent historiques, pas réexécutés
  comme preuve de la nouvelle sonde. Rapports camera-regressions.tap et
  camera-build.log dans
  work/cannonade-recovery/. La reconnexion du transport final est aussi observée
  après6.2s d’inactivité sur le même client : admin-idle-recovery.json.
- Les captures browser/ et browser-v2/ sont historiques : ancien projectile,
  puis ancienne puissance catalogue. Les18 scénarios actuels sont dans
  work/cannonade-recovery/browser-v3/results.json : repos/course, avant/après
  contact, récupération, charge maximale, recharge mobile et zoom on/off,
  deux sexes, avant la nouvelle transition de caméra. HP100 avant contact,
  puis87.03389739990234 après charge400ms ;
  charge maximale S5 : HP63.98304748535156. Les PV natifs correspondants restent
  à mesurer. Les captures montrent l’arme au repos, en course et pendant le tir
  sur les deux corps ; le zoom change effectivement le cadrage. Les40 contrôles
  de tools/compare-cannonade-browser.mjs passent. Ces scénarios figés ne mesurent
  pas les performances en jeu normal ni toute la fidélité visuelle native.
- camera-native-gate.json reste non prêt :0 familles prêtes sur13,
  109 erreurs et26 avertissements ; seuils inchangés.

Reste à établir : dégâts reçus/crit/armure/autres équipements, politiques actor
et conditions, animations corporelles natives et huit directions, transitions,
recharge mobile native propre à cette arme, matrices/vertices/GPU des Lightning, dimensions VFX et
écoute, hook externe de cible, translation/réticule/corps et interruptions du zoom natif.
Aucun import complet ni fidélité native complète n’est annoncé.

Régénération : restore-cannonade-assets, puis register-cannonade-contract.
Ce dernier remplace l’ancien contrat et conserve les observations manquantes,
sans reprendre les anciennes métriques nulles du staging comme preuve.

### Dernières captures Lightning

`browser-lightning-v2/` conserve16 scénarios,298 contrôles passés, deux sexes,
tir normal/maximal, apparition, extinction et fin. Le départ suit le canon
post-mixer pendant le recul. Les buffers S5 sont contrôlés ; aucune comparaison
de pixels ou de vertices natifs n’est revendiquée. Dans l’ancienne série, quatre
fichiers image ont été remplacés à cause d’un helper fermant sur l’ancien dossier.
Ils sont exclus de la preuve historique dans browser-lightning/diagnosis.json ;
les11 mesures initiales et15 lignes mixtes restent archivées séparément.
