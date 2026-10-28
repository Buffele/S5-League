# Laboratoire S5Runtime local piloté par script

Depuis `C:/Users/newpc/Desktop/S5 league`, le lancement ci-dessous utilise
uniquement la copie privée et les services de boucle locale. Le launcher
original n'est pas nécessaire.

## Inventaire pour équiper manuellement le personnage

```powershell
.\tools\s5runtime-local\start-inventory.ps1
```

Cette commande ouvre une nouvelle session locale avec les 794 armes
(2 954 items avec couleurs) et les 3 051 clés de costumes
(18 684 items avec couleurs). Entrer dans Unlimited puis ouvrir Inventory.
Elle ne démarre pas de partie automatiquement. Les équipements utilisent les
boutons Equip habituels ; les deux personnages partagent l'inventaire.
Les sessions restent limitées à 1 700 secondes, soit environ 28 minutes.
Le catalogue est recréé à chaque lancement ; les choix d'équipement de la
session ne sont pas encore enregistrés entre deux lancements.

Le 3 octobre, ces deux catalogues ont été vérifiés intégralement dans
l'inventaire natif du PID22868 : rapports `user-inventory-weapons-20261003.json`
et `user-inventory-appearance-20261003.json`. L'écran Inventory a été observé.
Les objets dont les ressources sont absentes restent des entrées du catalogue,
sans promesse de modèle ou de texture visible. `-GeminiOverlay` active les
quatre corrections privées Gemini ; leurs couleurs0 ont été observées, les
couleurs1 manquent encore de textures. La correction Claude nécessite encore
`appearance_fix_claude.py --instance 0 --apply` pour chaque nouvelle copie ;
elle a été appliquée à cette session. L'installation originale reste intacte.

```powershell
.\tools\s5runtime-local\start-local.ps1 -Seconds 1700 -Instance 0 `
  -BackgroundInput -AutoPlay -NativeWeaponData `
  -AllWeapons -AllWeaponColors -AllSkins -AllSkinColors -RenderDiagnostic
```

`-BackgroundInput` conserve la lecture native des commandes sans exiger le
premier plan. `-AutoPlay` attend la demande native du canal, le joueur joint
et la fin native du chargement avant d'entrer en partie. Il ne force pas ces
états. Les touches et boutons se relâchent automatiquement.

Pour choisir un autre mode dès le lancement, utiliser `-AutoPlayMode` et
`-AutoPlayMap` ; les couples sont validés contre les XML. Par exemple,
`-AutoPlayMode 8 -AutoPlayMap 91` démarre le laboratoire Chaser directement.
Une seule personne reste en attente d'adversaires : cette entrée ne valide
pas une partie Chaser complète.

Le Python disponible sur ce PC est
`C:/Users/newpc/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe`.
Les exemples utilisent `python` lorsqu'il est disponible dans le terminal.

```powershell
python tools/s5runtime-local/s5runtime_control.py --instance 0 state
python tools/s5runtime-local/s5runtime_control.py --instance 0 move forward --ms 500
python tools/s5runtime-local/s5runtime_control.py --instance 0 jump
python tools/s5runtime-local/s5runtime_control.py --instance 0 look --dx 80
python tools/s5runtime-local/s5runtime_control.py --instance 0 attack --ms 100
python tools/s5runtime-local/s5runtime_control.py --instance 0 stop
python tools/s5runtime-local/capture_native.py --instance 0 --output work/s5runtime-local/reports/frame.png
```

`stop` relâche les commandes ; il ne ferme pas le client. Le lancement borné
nettoie uniquement ses propres processus. Chaque session a ses ports,
profil, répertoire temporaire et jeton éphémère.

## Débit et instances

Les outils `lab_sessions.py`, `lab_runner.py` et `lab_pipeline.py` pilotent
maintenant le lancement et les essais sans naviguer dans les menus. Exécuter
les commandes depuis la racine active du dépôt. La copie privée, le bootstrap
mis en cache et les catalogues utilisés par `start-local.ps1` doivent déjà être
préparés sur ce PC ; ces outils ne téléchargent pas une installation S5Runtime.

```powershell
python tools/s5runtime-local/lab_runner.py plan --output work/s5runtime-local/private/plan.json
python tools/s5runtime-local/lab_pipeline.py --manifest work/s5runtime-local/private/plan.json --instances 1 2 3 --output work/s5runtime-local/private/lot-001
```

La seconde commande prépare les clients simultanément, réutilise les clients
déjà prêts, exécute les scénarios et sauvegarde chaque résultat dans
`lot-001/batch.json`. `pipeline.json` conserve les cycles, leurs durées et les
identités des processus. Le plan par défaut comprend 20 essais : tirs des
trois armes 2010001/2010002/2010004 et déplacements avant/arrière, sur les
deux personnages, en Touchdown/Station-2. Un plan personnalisé doit conserver
des IDs uniques, expliciter mode, map, personnage, trois clés, slot et action
(`fire`, ou `move` avec touche physique AZERTY `z/s/q/d`). Les couples mode/map
restent validés contre les sources ; le mode Deathmatch utilise par exemple
la map2, pas la map66 de ce plan Touchdown.

Après interruption, relancer la même commande avec `--resume`. Les essais
réussis sont conservés par ID et empreintes des sources. Un changement de
plan, de sources ou de politique impose un nouveau rapport. Une commande
native dont la réponse expire n'est jamais rejouée aveuglément : l'instance
est mise à l'écart. Le pipeline peut recycler les clients qu'il a créés et
reprendre les IDs restants, avec au plus trois cycles par invocation. Il
préserve les clients empruntés à une autre session ; leur perte est signalée
dans `stopped_reason`. Un essai qui échoue ses contrôles sans perte de client
est retenté entièrement au plus deux fois, puis reste en attente de correction.

Pour préparer un pool sans lancer de lot, puis fermer uniquement les clients
créés par cette commande :

```powershell
python tools/s5runtime-local/lab_sessions.py start --instances 1 2 3 --output work/s5runtime-local/private/pool-001.json
python tools/s5runtime-local/lab_sessions.py stop --sessions work/s5runtime-local/private/pool-001.json
```

Un numéro d'instance possède ses ports, profil et jetons. Les verrous Windows
empêchent deux runners de piloter le même numéro ou d'écrire le même rapport ;
ils sont libérés par le système après un crash. Les sessions restent bornées
à 1700 secondes. Les rapports contiennent les PID et identités de création,
jamais les jetons des API.

**Correction du 14 octobre :** le client natif pouvait conserver le port
relais28065 de l'instance0, malgré le port correct dans le DTO de room. Le
guard redirige désormais tous les ports de service par défaut vers l'instance
sélectionnée et rejette les ports déjà attribués à une autre instance.
`network_scope.py` vérifie en plus les connexions TCP réellement établies,
avec le PID propriétaire, vers le serveur de jeu et le relais propres au
client. Les anciens rapports de statut et les benchmarks v3/v4 ne prouvent
pas cette isolation complète et ne constituent pas la mesure finale.

Pour les grands lots d'équipement, ajouter `-NoEquipmentObservers` et utiliser
les lecteurs de mémoire et l'API admin directe des runners. Ne pas demander
une RPC d'observation désactivée. Les reprises identifient source, personnage,
item et couleur ; un résultat d'une ancienne copie garde son PID d'origine.

Le transport utilise maintenant TCP_NODELAY. Le 2 octobre, le même lot de
couleurs est passé d'environ 4,4 à 18,5 équipements/s sur une copie fraîche.
Les requêtes de statut de trois copies ont une médiane d'environ 1 ms
(`automation-parallel-current.json`, 50 appels par copie, jetons croisés rejetés).
Le passage sur quatre copies, avec validation des métadonnées à chaque
commande, mesure environ 2,4 ms de médiane.
Ce sont des mesures de commandes/équipement, pas une accélération du temps
de simulation.

Le compte à rebours du lancement manuel reste de 4 secondes. Le laboratoire
rapide utilise250ms, après la confirmation native du chargement. Les tirs et
déplacements sont contrôlés dans la mémoire du client. Les durées d'entrée
restent identiques :100ms pour le tir,200ms pour le déplacement. Les deux
politiques observent le résultat après le relâchement des entrées, avant la
pause supplémentaire du baseline. Le temps de simulation n'est pas modifié.

Pour refaire une comparaison avec le même plan :

```powershell
python tools/s5runtime-local/lab_runner.py run --manifest work/s5runtime-local/private/plan.json --instances 4 --policy baseline --output work/s5runtime-local/private/baseline.json
python tools/s5runtime-local/lab_runner.py run --manifest work/s5runtime-local/private/plan.json --instances 1 2 3 --policy fast --output work/s5runtime-local/private/rapide.json
python tools/s5runtime-local/lab_runner.py compare work/s5runtime-local/private/baseline.json work/s5runtime-local/private/rapide.json --output work/s5runtime-local/reports/comparaison.json
```

Préparer aussi l'instance4 avant cette comparaison. Le baseline recrée la
room à chaque scénario, conserve les pauses de l'ancien parcours et un
compte à rebours de4s. La politique rapide réutilise la room pour un même
personnage/mode/map et attend les observations natives au lieu de pauses
fixes. Un changement de personnage ou de mode recrée la room après le retour
natif dans la liste des rooms. La comparaison refuse une couverture différente,
une reprise partielle, des sources modifiées, une observation native absente
ou des connexions de service partagées entre instances.

Le statut lit seulement la dernière instance d'entrée observée par les
commandes ; `nativeActive: null` signifie qu'aucune commande ne l'a encore
observée. Les RPC d'entrée ont un délai de 8 secondes. Un appel bloqué
empêche l'empilement de nouvelles commandes et n'est jamais rejoué ; une
commande expirée ne déclenche pas d'entrée tardive.

Les métadonnées de session exposent `startup_observers_released`. Attendre
ce champ vrai avant une RPC native, y compris `state` et `stop`, puis vérifier
le premier acteur vivant avant de quitter la salle initiale. L'API admin
reste lisible pendant cette attente. Une reprise trop précoce a interrompu
le chargement automatique ; les nouveaux contrôles rejettent cette course.

Les hooks de démarrage sont retirés après le délai configuré et l'acceptation
native de l'entrée locale. Leur conservation permanente a bloqué les RPC
sur deux copies d'essai ; elle a été retirée. Un nouveau déplacement en
arrière-plan et cent statuts par copie ont passé après cette correction.

## Portée des preuves

Mesure du14 octobre avec le routage des relais corrigé et le gate de fin de
compte à rebours natif :20 scénarios identiques,186,344s en séquentiel contre
13,844s sur trois clients, soit un débit×13,46. Chaque essai vérifie ses
connexions TCP jeu/relais propres, l'acteur vivant, la sélection/inventaire,
le type et le chargeur source, le tir ou le déplacement réel et la libération
des entrées. Rapport :`work/s5runtime-local/reports/lab-comparison-20-v7.json`.
Ce gain exclut le démarrage : quatre clients neufs ont été préparés ensemble
en53,125s (`lab-sessions-isolated-v6.json`, sous le dossier privé).

Le gate ajouté lit le widget natif : remainingMs=0 ne suffit pas quand
intervalMs=1000. EF35C0 termine son démarrage en appelant8E7790, qui met aussi
intervalMs à0. Le runner attend cette observation avant la sélection et avant
l'action. Un lot Deathmatch de20 essais avec les deux personnages a terminé
sans échec après cette correction (`lab-dm-20-start-gate-v7.json`). Cela
n'exclut pas d'autres causes d'entrée ignorée sur des scénarios non couverts.

Une perte volontaire de client isolé a été détectée après trois succès. Le
pipeline a démarré une nouvelle copie et fini les17 IDs restants :20 succès
uniques, un essai interrompu, aucun doublon, connexions isolées vérifiées
(`lab-pipeline-isolated-recovery-v6/recovery-check.json`). Les rapports anciens
gardent leur version et ne deviennent pas des preuves du nouveau gate.

Les 794 définitions d'armes actuelles sont retrouvées et chargées, et les 41
types ont été sélectionnés sur les deux personnages. Le catalogue de costumes
contient 3 051 clés et 18 684 items avec leurs couleurs. Les balayages natifs
vérifient les propriétaires, emplacements, couleurs et modèles effectivement
chargés ; ils ne transforment pas les ressources absentes en équipements prêts.
Les 19 107 combinaisons personnage/item/couleur des costumes ont toutes été
essayées : 19 099 parties correspondantes et 18 932 modèles non vides,
sans erreur RAM. Les huit échecs de partie sont les quatre Gemini aux deux
couleurs ; les autres modèles absents ont des ressources ou définitions
graphiques manquantes. Le détail figure dans `appearance-native-final-summary.json`.

Les modes restent en cours : l'entrée native est distincte d'une boucle
complète de scores, objectifs, victoire et résultats. Une capture réelle de
point Siege et son score ont été observés sans ACK synthétique d'objectif.
La route a été rejouée sur une copie fraîche ; un bonus de score déposé par
l'API locale a ensuite été ramassé par collision native. Le client a envoyé
lui-même C2S2047 et son score, ainsi que celui de son équipe, est passé de 5 à 6.
Le dépôt reste une commande de diagnostic : la sélection automatique des
bonus, les adversaires et la victoire Siege ne sont pas encore validés.

Le pantalon Claude peut être corrigé par `appearance_fix_claude.py --apply`
sur une session choisie : seule la terminaison `.scn` du chemin natif change.
Deux couleurs ont chargé le modèle après correction. `-GeminiOverlay` est
un essai séparé, encore expérimental, limité à quatre scènes authentifiées.
Il substitue leurs candidats plus courts dans les buffers privés après
décodage ; les archives et le fichier exécutable ne changent pas.

Les captures de fenêtre Windows sont noires, avec le curseur seulement.
Le chemin natif est maintenant vérifié : `-RenderDiagnostic` puis
`capture_native.py` invoquent la fonction originale de capture sur le thread
du jeu, après les gates de démarrage. Un BMP neuf est décodé en PNG ; une
ancienne image est refusée si la méthode ne l'a pas remplacée. Le personnage,
Plasma Sword, Station-2 et le HUD sont visibles sur la preuve datée du 2 octobre.
Cette capture fonctionne en arrière-plan. Chaque arme, skin, animation et
interface de résultat demande encore son propre contrôle visuel.
Le lecteur `inspect_rifle_range.py` vérifie maintenant la portée configurée
après entrée native en partie : minimum FogMaxDist/CullDist/option33, plus
son carréfloat32. Douze essais SMG/Revolver/Semi Rifle, deux sexes et cartes
Station-2/Circle-2 concordent avec les INI actuels réextraits. Les propriétés
graphiques du lobby ne doivent pas être comparées à la portée conservée de
la partie précédente ; le lecteur refuse ce cas. Rapports et contrat :
`work/submachine-gun-recovery/range-analysis/`. La consommation native et les
paramètres sont vérifiés ; une cible distante et ses PV natifs restent à tester.

L'installation originale
n'est pas modifiée et ce laboratoire ne constitue pas un import dans S5 League.

Rapports : `work/s5runtime-local/reports/automation-reentry.json`,
`automation-parallel-readiness-audit.json`, `weapon-native-definition-preflight.json`,
`appearance-native-color-coverage.json` et `modes-native-evidence.json`.

## Mode partagé natif —15 octobre2026

Le chemin isolé historique reste le défaut. Le serveur explicite `--shared-server`
raccorde `native-shared-session.mjs`, `native-shared-room.mjs` et
`proud-shared-relay.mjs` : comptes/sessions distincts issus de la vraie
authentification, une room, deux équipes, slots et hosts relais uniques.
Le démarrage exige les deux RoomEnterPlayer natifs, les ACKs de membership
dans les deux directions, puis les deux fins de chargement natives.
Les messages DATA des pairs sont retransmis opaques ; aucun avatar, impact
ou PV de cible n’est fabriqué par le serveur.

Validation reproductible depuis la racine active :

```powershell
python tools/s5runtime-local/capture_shared_room.py --output work/s5runtime-local/shared-room-recovery/nouveau-rapport.json
```

Le fichier de sortie doit être neuf. Le script réserve le serveur instance0 et
les bootstraps/contrôles instances1/2, utilise une sonde originale par client,
conserve les identités de processus et vérifie leur arrêt. Le client peut viser
un serveur partagé uniquement via `--shared-server-admin` pointant sur ses
métadonnées privées actives. Les commandes admin partagées exigent accountId ;
`shared-state` donne uniquement les identités et compteurs, jamais les credentials.
Les autres services d’instances restent refusés par le routage.

`native-v3.json` prouve deux logins natifs, deux joueurs nommés Local1/Local2,
les hosts3/4, les ACKs dans les deux directions et les deux chargements. Chaque
client expose le mode Touchdown actif et deux entrées de briefing ;19 messages
fiables et5 non fiables étaient déjà retransmis à l’entrée en partie. Cela ne
prouve pas encore la réplication des avatars distants ni les PV reçus.

Deux diagnostics sont conservés : native-v1 demandait2 places non déclarées
par le XML ; le scénario utilise désormais les12 places source avec deux clients.
Native-v2 observait la localisation100001 (canal0), différente du101001 supposé.
Le mode partagé publie explicitement le canal0 observé et garde la correspondance
exacte compte/pseudo/room. Les scénarios isolés gardent leur configuration.
Aucun gate de fidélité n’est ouvert par la seule entrée multijoueur.

`native-v4.json` ajoute deux acteurs locaux collisionnés réellement déplacés
par input natif500ms, relâchement vérifié et captures natives des deux clients
(native-v4-client1.bmp / client2.bmp). Les images montrent Station-2, Cannonade,
les deux HUDs d’équipes et la partie en cours. La réplication distante reste
non certifiée ; le mouvement propre de deux acteurs ne suffit pas à la prouver.
Les sources exactes de ce passage sont archivées sous native-v4-sources/.
Les54 tests JS ciblés et37 tests Python pertinents passent.

Le parcours isolé est revérifié après raccordement : isolated-regression-v1.json
(lancement neuf instance3, AutoPlay, préparation et tir Cannonade, scénario
NativeWorker réussi). L’arrêt des trois clients de la validation v4/isolée est
vérifié par leur identité de processus, sans toucher aux autres sessions.
S5 est laissé dans l’arène normale avec Cannonade, sans scénario QA figé.

### Ready/start natif vérifié — 15 octobre 2026

Le run `work/s5runtime-local/shared-room-recovery/native-v13-ready-profile.json`
utilise le dispatcher UI natif, sur son thread de frame original : non-maître
ready2059, émission serveur3016, maître start2060, deux ACK2045 puis playing.
Le profil bootstrap0 authentifie le patch intérieur DBBC29 et son résolveur
complet avant tout appel. Aucun remplacement de flag UI ni force-start admin.

`tools/s5runtime-local/verify_shared_native_ready.py` valide33 contrôles indépendants,
les sources archivées et l’arrêt des deux copies. Préparation→playing47,187s ;
aucun gain global×10 établi. Le run complet reste en échec sur le prérequis
d’acteurs distants : chaque client ne contient que son acteur local. Ready/start
ne prouve ni la réplication, ni les collisions entre pairs, ni les PV reçus.

Le dispatch HP dynamique a été lu en VM_READ, sans nouvelle attache/appel. Les
deux callees privés recopient le prologue HP puis reviennent à51E856 ; le corps
live, les dépendances du getter et son contrôle d’intégrité restent à établir
avant une mesure logique. `nativeHpCompared` et les gates natifs restent faux.
