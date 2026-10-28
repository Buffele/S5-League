# Fiche d’import — Spy Dagger classique

28 octobre2026 — choix F · Flame ajouté par attaque, couleur réglable et option globale
Keep flames active hors attaque, sauvegardés dans inventaire/Échap/paramètres.
Effets/impacts/audio existants conservés ; ancrages post-mixer, limites et
preuves groupées : `work/weapon-flames-all-20261028/README.md`.

26 octobre2026 — variantes artistiques D1/D2 A/B/C sélectionnables séparément
dans l'inventaire, avec conservation de l'origine et sauvegarde locale. Fil
mesuré sur la lame, échos main/arme/corps post-mixer, vent courbe et dissolution
stylisée. La réplique de dague D2-B démarre au premier seuil de frappe180ms,
pas au bouton. L'ancien gros modèle est masqué seulement pour ces variantes ;
les particules source de ruée, les impacts, les étincelles et l'audio restent
actifs. Les contacts rush1/3 gardent leur silence source, le contact2 son
spydagger_poke_hit ; le cut garde spydagger_cut_hit. Ni timing ni dégâts changés.
Gates natifs inchangés. Preuves groupées :
`work/weapon-effect-variants-20261026/README.md`.

23 octobre2026 — **Conquest : primaire raccordé en essais**. Le cut peut toucher
plusieurs NPC via le vrai FAN, le monde source et leurs Health, sans répétition
au rendu. Deux sexes testés dans le raccord principal, et baisse30→8PV observée
dans le navigateur avec les deux personnages. Rush fermé, Shield non qualifié,
politiques équipement/tempo/maths explicites ; l'arme entière et la fidélité
native restent non prêtes.80cas ciblés réussis après correction d'un scénario
de sprint ; build réussi. [Livraison et limites](../../work/game-modes/conquest-recovery/conquest-dagger-20261023/MAIN-DELIVERY.md).

Date : 3 octobre 2026. Statut : intégration en cours, essais conservés ; repos, marche et contacts observés dans le jeu principal sur les deux sexes. Fidélité native et suivi complet des effets non certifiés, gate non prêt.

Le lot mêlée est autorisé. L’adaptateur `src/spy-dagger-data.js` sépare locomotion, gestes, formes de contact, paramètres de canal et événements. Le raccordement commun est réalisé par l’intégrateur ; les comportements aériens et de changement Counter → Dagger déjà corrigés sont conservés.

## Sources et interface

- Item classique **2000006**, type 24, modèle `model/weapon/shortknife.scn`, socket `R_Hand_Dummy`, `weapon_attach.x7` scène 0. La scène 1, avant-bras droit, n’est pas un deuxième modèle du classique.
- `work/melee-batch/dagger/extract_sources.py` relit les archives actuelles privées, vérifie leur CRC indépendant et conserve SHA/longueur/archive dans `source-contract.json` : neuf sources, dix fonctions. Neuf fichiers extraits sous `source/` ; aucune exécution Lua ni modification du client.
- Catalogue XBN actuel : range **250**, power **12,2**, move/attack rate **1,2**. Ce sont les valeurs explicites du preset d’essais, pas une preuve de la priorité équipements/overrides en partie native.
- `getSpyDaggerAttackProfile(kind,{channel,range,power})` fournit les activations indexées, formes en unités source, durée d’état et mobilité. `SPY_DAGGER_LOCOMOTION`, `spyDaggerLocomotionPose` et `spyDaggerAttackPose` sont directement raccordables. `SPY_DAGGER_EFFECTS` conserve les événements exacts sans inventer un effet absent.

## Contrat de comportement

| État | Source actuelle | Clips deux sexes | Horloge / blend / boucle | Mobilité et contacts |
| --- | --- | --- | --- | --- |
| Repos | `NormalState_SpyDagger`, ligne 309 | SN002 | vitesse 1 ; blend 1000 ticks ; loop true ; reset false | Aucun contact |
| Marche | `RunState_SpyDagger`, ligne 1060 | Haut SN004–SN011, bas E0019–E0026 | vitesse 1 ; blend 1000 ticks ; loop true ; reset false | Huit mappings sémantiques explicites ; séparation haut/bas |
| Cut | `UseWeapon1State_SpyDagger`, `StandardSpyDaggerAttack1` → `SpyDaggerCut` | Haut SN013/SN014 ; bas DD005–DD012/A0024 | état 550 ms + recovery 0 consommée au tick suivant ; fit de clip ; blend haut 50 ticks, bas 500 ticks ; bas repos padding 300 ticks | contact 260 ms, MAKEFAN ; move rate Lua 0,5 mais politique de marche S5 déjà validée conservée |
| Rush | `UseWeapon2State_SpyDagger`, `StandardSpyDaggerAttack2` → `SpyDaggerStab` | SN001 puis SN012 | 1000 + 1500 ms, timers stricts sans report d’excédent ; SN012 M=6960 ticks, F=6000 | MoveBox ×2 MELEE, ×2,18 else ; stop movement on damage ; 3 objets indépendants à 180/360/540 ms |
| Aérien déclaré | `SwordJumpAtkState_SpyDagger` | SN003/SN000 | non bouclé, vitesse 1 | **Aucun binding left_jump du classique dans weapon_lua** ; ne remplace pas le cut aérien existant |

Mapping de présentation conservé : front SN004/E0019 ; droite-avant SN005/E0020 ; droite SN008/E0023 ; droite-arrière SN010/E0025 ; arrière SN009/E0024 ; gauche-arrière SN011/E0026 ; gauche SN006/E0021 ; gauche-avant SN007/E0022. Les noms natifs gauche/droite des diagonales passent par `SPY_DAGGER_DIRECTIONAL_MAPPING`. Les aliases G0018/G0019/G0021/G0023/G0024/G0025 du cut actuel produisent les mêmes poses DD sur les os bas des deux sexes, vérifié avec fallback BASE féminin ; aucune raison de les remplacer.

Rush : ancre (0,180,100), direction (0,0,-1), dimensions complètes (125,250,462,5), (125,250,462,5), (125,250,562,5). Cut : ancre (0,140,-50), direction (0,-1), paramètres MAKEFAN (200,50,325,120). La conversion scène ×0,006 appartient uniquement au moteur commun.

Facteurs rush MELEE **1,958 / 0,516 / 2,216**, else **1,80328 / 0,45082 / 2,25410** ; cut **0,979 / 0,90164**. Rush contacts 0/1 fixent CONDITION_ACTOR ; contact 2 ne le fixe pas. Sons d’attaque explicitement désactivés pour rush 0/2. Aucun `AlwaysCritical`, `DependOn`, blow ou stun explicite. Attributs : middle/front, POWER_STRONG, counter possible, guard crush désactivé, damage moving/by part activés, délai 200. La formule finale des critiques, les réactions physiques et l’orthographe Lua `AddtionalPower` restent ouvertes. Le moteur d’essais adopte explicitement dégâts de base, supplémentaire zéro, contact normal uniquement ; ne pas annoncer ces valeurs comme pertes HP natives mesurées.

## Ressources et événements

| Événement | Ressource source | État |
| --- | --- | --- |
| Modèle | `public/assets/s5runtime/weapon-dagger-classic.json` | Présent, socket source et transformée animée vérifiés après mixer |
| Clips M/F | `public/assets/s5runtime/rig-male.json`, `rig-female.json` | Tous clips contractuels présents ; sélection réelle des huit directions testée |
| Cut, 50–300 ms | GhostTrail_SpyDagger_01, Line01, scène0, image/gi.dds, blend0 | Déclaration authentifiée ; rendu natif à observer |
| Rush, appel Lua 0–5000 ms | Effects/shortknife01.seq | Séquence source de **1,5 s** restaurée sous `public/assets/s5runtime/effects/spy-dagger/` : cinq émetteurs, cinq textures, un modèle animé, aucune omission ; CRC/SHA dans `manifest.json`. Raccordée à `combat-effects`/`weapon-cues`. Effet bleu visible au pied lors du contact masculin ; suivi/placement pendant le rush mobile non certifiés. Ghost trail source commenté : ruban de rush non déclaré supprimé |
| Voix | voice_man/girl_attack_2 cut, attack_3 rush | Fichiers runtime existants, déclaration authentifiée ; écoute nouvelle non effectuée |
| Attaque / impact | blank_1sec.seq / weapon_mindshock_body.seq ; spydagger_cut/poke et cut_hit/poke_hit | Sons présents ; exactitude des effets natifs non certifiée |

La fermeture des ressources de `shortknife01` est établie, y compris `smog.png`, les autres textures et `spy_dagger_effect.json`. Elle ne prouve pas la fidélité du placement ni de chaque branche de particules. `tests/spy-dagger-effects.test.mjs` et le raccordement commun sont inclus dans `work/melee-batch/effects-integration.tap` : **28/28**. Le manifeste décrit la provenance ; son ancien libellé d’observation en attente est complété par les observations ci-dessous.

## Validation du passage

`node --test tests/spy-dagger-source.test.mjs tests/spy-dagger-timing.test.mjs tests/spy-dagger-transitions.test.mjs tests/dagger-air-momentum.test.mjs tests/dagger-stationary-air-pose.test.mjs tests/dagger-switch-rush.test.mjs tests/player-feedback.test.mjs tests/weapon-attachment.test.mjs` : **113/113**, journal `work/melee-batch/dagger/tests.log`.

Sept nouveaux tests contrôlent provenance, mappings et paramètres ; Controller → MotionGraph sur deux sexes, huit directions, trois orientations, retour repos et changement d’arme ; matrices arme/main post-mixer sur 27 poses ×3 temps ×2 sexes, y compris rotations animées du modèle. Tests numériques : ils ne remplacent ni observation du jeu principal, ni comparaison S5Runtime.

Une régression du lot a été reproduite puis corrigée : appliquer le nouveau bas E0019 à `airLocomotion` rompait la continuité du canal SN004 entre vol et cut aérien. Le mapping RunState E reste au sol ; le chemin aérien existant conserve SN. `diagnose-air-regression.mjs` compare deux copies isolées du même graphe : courant **réussit**, suppression de la seule exception Dagger **échoue** dans le test original `spy-avatar-integration.test.mjs`. Preuves `air-isolation.json`, `air-current.log`, `air-regression.log`. Contrôle supplémentaire `spy-avatar-integration` + `landing-animation` : **9/9** ; le retour de landing vers RunState utilise désormais le blend source 1000/4800 et E0019, intention confirmée par Lua.

Observations du jeu principal avec deux personnages, réalisées par l’intégrateur : `work/melee-batch/visual/dagger-male-idle.png`, `dagger-male-walk.png`, `dagger-male-rush-contact.png`, puis `dagger-female-idle.png`, `dagger-female-walk.png`, `dagger-female-cut-contact.png`. Le rush masculin déclenche trois contacts et laisse **42,782 HP** à la cible du preset S5 ; effet bleu au pied et impact rouge visibles. Cela confirme le scénario S5, pas les dégâts ou couleurs natifs S5Runtime. Pour le rush féminin en déplacement, `dagger-female-rush-effect-020.png` (0,2 s) et `dagger-female-rush-effect-045.png` (0,45 s) ne rendent pas la séquence clairement visible. Le réglage `follow:false` l’ancre au départ, potentiellement hors caméra : hypothèse de placement, pas une validation du suivi. `dagger-female-rush-after-200.png` (2 s) ne montre plus d’effet. La visibilité complète pendant le déplacement reste donc à vérifier.

Bilan technique du lot : `regressions-final.tap` **1428/1432**, quatre échecs sur trois manifestes immuables Breaker et un ancien statut de staging Revolver, fichiers non modifiés par ce lot ; suite globale toujours en échec. `contract.tap` **10/10** ; `build.log` build réussi, code 0. `central-gate.json` et `scoped-gate.json` restent **ready=false** ; aucune réduction des exigences.

| Contrôle | Résultat / preuve / limite |
| --- | --- |
| C01 accès et changement | Jeu principal chargé et observé M/F ; changement automatisé réussi ; aucune certification de tous les parcours UI |
| C02 directions | Deux sexes ×8 ×3 orientations, IDs upper/lower exacts réussis ; repos/marche observés M/F dans les captures, huit directions non toutes certifiées visuellement |
| C03 attache | Matrices source après mixer réussies ; arme visible au repos, marche et contact M/F ; comparaison quantitative d’orientation avec S5Runtime à faire ; pas de charge classique déclarée |
| C04 visée | Sans objet : gestes mêlée sans canon/visée directionnelle déclarée |
| C05 jambes mobiles | Run haut/bas raccordé et testé ; aliases cut préservés ; float aérien/récupération sans régression |
| C06 effets | shortknife01 restauré et raccordé, bleu au pied observé en rush masculin ; rush féminin mobile à 0,2/0,45 s non concluant, aucun effet visible à 2 s ; suivi/placement et exactitude des impacts encore ouverts |
| C07 balles | Sans objet : aucun projectile déclaré |
| C08 fumée | shortknife01 contient deux émetteurs smog, désormais restaurés ; observation séparée et espace de suivi à confirmer pendant le rush mobile |
| C09 poussée | `DAMAGEMOVING_ENABLE` source ; physique exacte non certifiée, aucun blow/stun ajouté depuis une supposition |
| C10 impact injustifié | Sans objet balles ; réactions mêlée native à confirmer |
| C11 dispersion | Sans objet : attaques volumes, accuracy inutilisée dans ces fonctions |
| C12 sons / secondaire | Rush et voix raccordés historiquement ; nouvel inventaire sourcé ; écoute du passage à faire |
| C13 contacts / combos | Trois activations rush indépendantes + cut ; horloges/air/switch régressions réussies ; BOX/FAN et consommation raccordés et testés ; trois contacts rush masculins et cut féminin observés |
| C14 commun | Tests propres réussis, effets28/28, contrat10/10 ; build réussi ; suite globale1428/1432 avec quatre échecs externes documentés ; gates non prêts |

## Incertitudes et reprise

Polishing des contacts multiples : le troisième impact du rush redémarrait
le premier à cause du pool de deux instances. Correction raccordée au moteur
de particules ; trois impacts indépendants, deux acteurs, M/F × huit caps
via le vrai receive, positions et dégâts conservés. **128 tests ciblés passent,
build réussi**. [Preuve](../../work/melee-batch-5/dagger-multi-impact.md).
La correction couvre désormais aussi les séquences contenant un modèle,
dont shortknife01 : six déclenchements indépendants, géométries/matériaux et
horloges séparés, extinction et réemploi contrôlés. **63 régressions passent,
build réussi**. [Preuve](../../work/melee-batch-5/effect-instance-factory.md).
Suivi/rendu natif non certifié par ces tests numériques.

Observation suivante : effet clair visible au point de départ à 200/450 ms
pour M/F, extinction discernable à 2 s ; vue QA `rush-origin` ajoutée pour
garder départ et personnage dans le cadre. Cible distante intacte, impacts
de surface distingués. Cela vérifie le rendu actuel ancré, pas le suivi
natif ni chaque émetteur. [Captures et limites](../../work/melee-batch-5/dagger-rush-origin-visual.md).

Progrès vérifiable : extraction CRC des sources actuelles, raccordement au jeu principal, tests rigs/graph/attache passés, restauration complète des ressources shortknife01, observations repos/marche/contacts M/F ; aucun seuil d’abandon atteint pour cette arme. Suite : départager placement ancré et suivi pendant un rush mobile avec vue du point de départ et du personnage, observer séparément les émetteurs smog et l’impact, puis calibrer corps de contact et règles natives critiques/réactions. Le port statique booléen MAKEFAN commun existe ; point de contact, filtrage natif et calibration du corps cible restent non certifiés. Les observations actuelles ne suffisent pas à ouvrir le gate natif.

## 22 octobre 2026 — fantôme de la ruée

Le contrôle dans la copie privée S5Runtime montre le grand modèle translucide près du personnage avancé dans la ruée. Le rendu S5 le laissait au départ. Le cue shortknife01 suit maintenant l'acteur, avec rafraîchissement du modèle après évaluation du mixer. Les horloges source restent intactes : séquence à0, modèle à200ms, visibilité retardée par ses clés alpha jusqu'à environ367ms. Le modèle n'est pas rejoué au contact et les assets source restent inchangés.

Tests avec les vrais rigs M/F : absence pendant la préparation, apparition retardée, matrice du modèle à la position et orientation courantes après la pose. Observations dans le jeu principal M/F à550ms : fantôme devant l'arme avancée, pas au départ. **381/381 régressions ciblées passent**, build réussi, en commun avec les corrections Plasma. [Captures natives/S5 et limites](../../work/spy-plasma-fixes-20261022/analysis.md). Le mapping de chaque particule et l'alignement natif quantitatif complet restent ouverts ; ready=false.

### 22 octobre2026 — cut + saut simultanés

Le client S5Runtime copié accepte clic gauche+Space dans la même séquence sur les deux sexes ; Space120ms après le clic est refusé dans les deux essais. S5 créait le cut avant de traiter le saut, puis le bloquait parce qu'une attaque était déjà présente. Un témoin local au pas de création garde le saut simultané éligible. Aucun saut tardif pendant un cut actif, double saut ou saut de rush ajouté ; physique et clips de cut existants conservés.

Vrais MovementInput/Controller/MotionGraph testés : deux ordres d'événements, repos/avant/arrière/diagonale avant, M/F, pas8/16/33,33ms. Reproduction2/8 avant ;9/9 après ;411/411 régressions ciblées passent, build réussi. [Sources, relevés natifs et limites](../../work/dagger-jump-cut-20261022/analysis.md). Gate natif toujours non prêt.

### Fenêtre d'entrée — vérification étendue et correction de frontière

66 essais dans la copie S5Runtime, départ Normal/sol stable vérifié avant chaque essai, deux sexes, trois répétitions par décalage et heures réelles de dispatch enregistrées. Clic puis saut :8ms demandé accepté6/6,16ms2/6,24ms0/6 ; saut puis clic40/100ms accepté12/12. La limite native dépend donc de la cadence, pas d'un timer strict16ms démontré.

S5 imposait le même tick16ms, ce qui refusait parfois deux vrais appuis8ms espacés. Les événements d'entrée transportent maintenant leurs heures physiques ; le cut garde l'heure de son clic et accepte le saut jusqu'à16ms d'écart réel, même entre deux pas. Cette borne fixe est une adaptation S5 documentée, pas une identité exacte avec S5Runtime. Les vrais fronts trop espacés restent rejetés même s'ils sont traités dans un seul pas long. Ruée, double saut, contacts et physique inchangés.

Tests sur toutes les phases de tick à8/16/33,33ms, clic tenu ou relâché, deux sexes. [Mesures, différence assumée et résultats](../../work/dagger-jump-window-20261022/analysis.md). Le gate natif reste fermé.

### 22 octobre 2026 — orientation du vent et des étincelles

La capture utilisateur montre les étincelles de `shortknife01` décalées à gauche indépendamment de l'orientation du personnage. Le nœud 5 porte un décalage source `[50,200,-350]` ; le rendu ajoutait ce décalage à la position du personnage sans le tourner. Les particules de vent émises dans le monde conservaient également la direction initiale.

La présentation S5 de cette seule séquence garde maintenant positions et vitesses dans le repère courant de l'acteur. Le rendu applique sa rotation et sa translation, sans multiplier une deuxième fois l'échelle source. Le suivi est actualisé après la pose et à l'interpolation, sans avancer les horloges ni réémettre de particules. Les autres séquences conservent leur politique d'espace. C'est le suivi demandé pour S5, pas une nouvelle certification du comportement S5Runtime ; les fichiers source et leurs timings restent intacts.

Vérifications : **48/48 tests ciblés**, dont positions et axes des vrais émetteurs 0 (vent) et 5 (étincelles) à cinq orientations, contrôle des horloges pendant les rotations au rendu, rigs M/F, pool et régressions partagées ; build réussi. Journaux : `work/rush-particle-orientation-tests.log` et `work/rush-particle-orientation-build.log`. Vue principale de ruée tournante à 450 ms inspectée : étincelles devant le personnage. Gate natif toujours fermé.

Retour utilisateur suivant : étincelles validées, vent encore incorrect. Le premier test omettait l'émetteur 2, dont les traits ont une vitesse nulle. Le fallback du rendu les orientait selon leur position radiale, donc sur les côtés plutôt que dans l'axe de la ruée. Les particules attachées conservent maintenant la direction d'émission, y compris son spread, pour orienter ces traits à vitesse nulle. Le test inclut désormais cet émetteur : échec reproduit avant correction, réussite après. Les paramètres source, la vitesse et les étincelles restent inchangés. Journaux de ce complément : `work/rush-wind-axis-tests.log` et `work/rush-wind-axis-build.log`.
