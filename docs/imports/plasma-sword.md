# Plasma Sword — reprise à partir du code

28 octobre2026 — choix F · Flame ajouté par attaque, couleur réglable et option globale
Keep flames active hors attaque, sauvegardés dans inventaire/Échap/paramètres.
Effets/impacts/audio existants conservés ; ancrages post-mixer, limites et
preuves groupées : `work/weapon-flames-all-20261028/README.md`.

27 octobre2026 — maintien gauche : Plasma Edge, Astral Flame et Living Current
remplacent les projections par une aura sur les contours de la lame réelle.
Feu continu en volume autour des vrais triangles et surface incandescente,
suivis après mixer, sortie en fondu550ms et réglages Size/Intensity sauvegardés.
Les petits plans/filaments ont été retirés. Sélection partagée entre
inventaire et Échap → Weapon effects ; réglages aussi dans Settings → Graphics.
Le clic droit spectral, les sons et les mécaniques restent inchangés. Rapport :
`work/counter-effects-menu-20261027/README.md`.

26 octobre2026 —9variantes artistiques par attaque dans l'inventaire : combo,
puissant et aérien, chacun A/B/C ou origine. Rubans bleus, rémanences et filets
courbes suivent le mesh évalué. L'impulsion au sol utilise un contact réel et
le seuil de frappe ; les impacts et sons existants restent actifs. Le clic
droit spectral du22octobre est explicitement exclu du catalogue et garde sa
présentation. Aucune mécanique, durée, dégâts ou locomotion modifiés.
Gates natifs inchangés. Preuves : `work/weapon-effect-variants-20261026/README.md`.

**Clics simples,25octobre2026 :** les trois légers conservent500ms d'action et lisent désormais leurs animations à1,2× (override source600/500). Les impacts ordinaires non létaux ne suspendent plus artificiellement le gameplay45ms. La classification relâchement court/long reste inchangée ; aucun buffer ajouté.127tests ciblés et observations M/F dans le jeu principal ; preuves et limites dans le [rapport](../../work/melee-pvp-comparison-20261017/capture-expansion-v2/plasma-light-cadence-fix-20261025/REPORT.txt). Les512ms observées au pas16ms ne constituent pas un minimum absolu natif de riposte.

**Récupération reçue, 24 octobre 2026 :** pour le contact normal du premier léger, S5 utilise désormais les300ms déclarées, avec expiration stricte `elapsed > duration`, au lieu de250ms. Le consommateur binaire Damage18 et cinq essais natifs Plasma/Plasma étayent ce paramètre ; le minimum absolu d'un clic reste dépendant du cycle d'entrée.11nouveaux tests,107régressions, build et six contrôles rendus dans le Deathmatch principal sont archivés dans la [vérification finale](../../work/melee-pvp-comparison-20261017/capture-expansion-v2/s5-recovery-duration-v1/verification-final.json). Les autres combos, les réactions spéciales et la physique ne sont pas recalibrés par ce correctif.

Date : 3 octobre 2026. Statut : **en cours**, adaptateur de contacts livré pour le lot mêlée ; fidélité native non certifiée.
Autorisation : après la Plasma Sword, l'utilisateur a lancé la série des armes de mêlée avec agents par arme et intégrateur seul sur les fichiers partagés.
Guide : [procédure](../IMPORT-ARMES-GUIDE.md), [contrôles](../IMPORT-ARMES-CONTROLES.md).

## Clic droit : aura spectrale — 22 octobre 2026

Direction retenue par l'utilisateur après les concepts ImageGen : aura bleue
proche du personnage, rémanences du personnage comme le dodge, et énergie sur
la lame. Le premier raccordement a été jugé « très propre » par l'utilisateur ;
son retour suivant demande des fantômes plus espacés et durables, et des fils
d'air plus courbes. Les propositions antérieures de vague/comète et de volutes
indépendantes sont abandonnées, pas des couches supplémentaires.

`plasma_rush_spectral` remplace uniquement le VFX du clic droit Plasma. Début
visuel à **50 ms au lieu de 500 ms**. Le son `stance` reste sur la déclaration
source à 500 ms (`UseWeapon2State_PlasmaSword`). Délai visuel et rendu sont une
adaptation artistique demandée, pas une mesure comparative actuelle dans S5Runtime.

- Aura : surcouche bleue suivant la pose, six filets autour du torse, ondes
  courbes se propageant vers l'arrière sans tirage aléatoire entre frames.
- Rémanences : quatre copies de géométrie et de squelette indépendantes,
  capturées après mixer ; géométrie source partagée, matériaux propres. Intervalle
  minimal **105 ms** (contre 65 ms au premier raccordement), distance minimale
  **0,42 unité S5**, durée **520 ms** (contre 320 ms), opacité initiale 0,64
  (contre 0,42). Les anciennes poses restent dans le monde, sans suivre le joueur.
- Lame : surcouche lumineuse et filet bleu sur les extrémités mesurées après
  mixer. Le centre de la plus grande dimension du maillage fournit les deux
  extrémités ; la plus proche de `R_Hand_Dummy` est la base. C'est un choix de
  présentation S5, pas une certification de la Shape native `Line01`.
- Fin : fondu naturel de l'aura entre 560 et 1040 ms après son déclenchement ;
  interruption avec fondu de 300 ms, rémanences conservant leur durée. Nettoyage
  par avatar au changement d'arme et au reset, maximum 1,3 s par instance.

Implémentation : `src/plasma-rush-effect.js`, cue dans `weapon-cues.js`, pool et
échantillonnage dans `combat-effects.js`, appels après pose dans `main.js` et
`training-combat.js`. Le render actualise l'aura/lame à la pose interpolée sans
émettre de nouvelles rémanences. Pool réutilisé ; les ressources du personnage
ne sont ni modifiées ni détruites. Le dodge existant reste inchangé.

Les animations, locomotion, contacts, dégâts et assets S5Runtime restent ceux du
passage précédent. Les 60 définitions d'effets natives gardent leur test de
non-régression. Il ne s'agit pas d'une nouvelle exposition d'arme ni d'une
certification native. Les limitations historiques et le gate **ready=false**
restent ouverts.

Vérifications : **146/146 tests ciblés**, build réussi. Tests des deux vrais rigs,
attache de lame après mixer, squelettes indépendants, maintien des poses
historiques, espacement, persistance au-delà de l'ancienne durée, courbure et
continuité du vent, fondus, pool, pause, changement/nettoyage, dodge et effets
partagés. Quatre cas navigateur passent : action homme/femme à 380 ms, fondu
féminin à 880 ms (aura d'opacité 0,274 et copies encore visibles), extinction à
1400 ms ; aucune erreur/warning console dans ces cas. Le cadrage QA a été
décalé en X pour éviter que la rampe ne masque la récupération ; aucun spawn
normal du jeu n'est modifié. Preuves : `work/plasma-rush-spectral-20261022/`.
Scénario principal
`?weapon=plasma&qa=plasma-rush&t=.38&qaView=profile-wide`, variante `sex=female`.

Les rapports précédents sous `work/plasma-rush-chakra-20261022/` restent
historiques : leurs captures et les 126 tests d'alors ne valident pas ce nouveau
rendu. Les trois échecs élargis antérieurs de `weapon-effect-cache.test.mjs`
portent sur un délimiteur d'extraction obsolète dans `main.js` ; ce défaut
préexistant ne fait pas partie de ce changement.

## Adaptateur de contacts — lot mêlée du 3 octobre

`src/plasma-combat-data.js` fournit `PLASMA_ABILITY` (item **2000001**, Power **17**, range **500**) et `plasmaAttackContacts(kind, comboIndex, options)`. Les options exposent `channel: 'melee' | 'unlimited'`, `power`, `range` et `additionalPower`. L'adaptateur restitue chaque création CAttack avec sa forme, son instant, son quatrième argument de dégâts, ses conditions et dépendances, ses attributs et ses ressources acteur/décor. Il ne change aucune horloge, animation, attache ou locomotion validée. Le raccordement au solver partagé appartient à l'intégrateur du lot.

Les relevés antérieurs sont réutilisés sans nouvelle enquête : [parallel-pass.json](../../work/plasma-restoration/parallel-pass.json), [contact-analysis.json](../../work/plasma-restoration/contact-analysis.json), [effects-analysis.json](../../work/plasma-restoration/effects-analysis.json). Leurs empreintes, celles du contrat et des sources Lua actuelles sont vérifiées dans `tests/plasma-source-data.test.mjs`. Les mentions `runtimePatched:false` et les limites du rapport historique restent le témoignage du passage antérieur.

| Action S5 / fonction source | Contacts normaux MELEE | Critique dépendant MELEE | Condition explicite |
| --- | --- | --- | --- |
| Légère, trois clips / `PlasmaSwordLight` | 200 ms, Power × 0,497 ; FAN `[250,100,350,120]` au range 500 | 200 ms, Power × 0,373, BOX profondeur fixe 215,189786 | Aucune |
| Forte / `PlasmaSwordHeavy` | 400 ms, Power × 0,994 ; BOX `[225,225,450]` | 400 ms, Power × 0,746, BOX `[1,100,317.025]` | Blow `[3000,2000]` |
| Continuation / `PlasmaSwordHeavy2` | Même contact normal que forte | Bloc commenté : **aucun** en MELEE ; présent dans ELSE | Blow `[3000,2000]` |
| Rush / `PlasmaSwordDash` | **6 objets** à 200/266/332/400/450/500 ms ; facteurs 0,187 × 3 puis 0,094 × 3 ; BOX `[300,187.5,375]` | Aucun objet actif | `CONDITION_ACTOR`, aucune déclaration Push/Blow/Stun |
| Aérienne / `PlasmaSwordJumpAttack` | 500 ms, Power × 0,28 ; BOX `[300,750,700]` | 500 ms, Power × 0,684, BOX `[1,85,317]` | Stun `[1000,2500,0,1000]`, non contrable |

Les branches ELSE sont conservées distinctement : légère 0,5/0,5 ; forte et continuation 1/1 ; rush 0,17648/0,17648/0,14706/0,14706/0,17648/0,17648 ; aérienne 0,5/0,5. Les formes fixes des critiques ne sont pas rescalées avec la portée. Le Lua réutilise les noms locaux `Attack2` et `Attack3` du rush ; les identifiants runtime portent un index de création pour empêcher la fusion accidentelle des six objets.

Les attributs relient normale légère/forte à `backattack_sword_s`, rush à `skill_gunner_chargeshot_hit`, critique générique à `blank_1sec`. L'aérien n'a **aucune** `SetDamageSequence`, ni son d'impact associé ; le son de stun de la victime reste un événement séparé. `damageObjectSequence` est conservé. L'alias `lightHit` résout le `sound/sword_attack.ogg` déclaré pour les autres contacts.

**Vérification : 100/100 tests ciblés passent**, dont les sept nouveaux tests de sources et géométrie, les deux rigs/huit directions, la continuité des jambes, les mouvements sol/air, les annulations, les frontières du dash, la forte et les effets. Commande : `node --test tests/plasma-source-data.test.mjs tests/plasma-locomotion-source.test.mjs tests/plasma-effects-source.test.mjs tests/plasma-strong-animation.test.mjs tests/plasma-lower-history.test.mjs tests/plasma-ground-movement.test.mjs tests/plasma-air-movement.test.mjs tests/plasma-dash-boundary.test.mjs tests/plasma-dash-cancel.test.mjs tests/plasma-capture-20260924.test.mjs`. Le build et la vérification visuelle du raccordement final relèvent du lot commun ; les captures historiques ci-dessous ne certifient pas ces nouveaux contacts.

Limites conservées : priorité équipement/Power, cinématique de réaction et pipeline de HP final non certifiés ; `AdditionalPower` du quatrième argument et `AddtionalPower` mal orthographié du cinquième ne sont pas confondus. `AlwaysCritical`/`DependOn` exigent une politique explicite, sans addition automatique. Le moteur commun porte maintenant la géométrie booléenne MakeBox/MakeFan, mais corps cible, impact précis et filtres natifs restent à calibrer. Utiliser 2,5 s pour le stun à partir du second argument est une politique d'arène explicite, pas la preuve du rôle des quatre arguments. Prochain blocage de fidélité : sélection critique/défense et comparaison des contacts/réactions au runtime S5Runtime. Le gate reste **ready=false**.

Les sections suivantes conservent les preuves et résultats des deux passages précédents.

## Sources et périmètre

Clé S5 `plasma`, item classique S5Runtime **2000001**, type natif **0**. L'installation originale n'a pas été modifiée. Les extractions et la décompilation utilisent la copie privée sous `work/s5runtime-local/private`.

Le contrat [plasma-source-contract.json](../../tests/fixtures/native/plasma-source-contract.json) conserve les corps de 18 fonctions issues de six Lua actuels : `actorstates_normalstates.lua`, `actorstates_runstates.lua`, `actorstates_plasmasword.lua`, `actorstates_damagestates.lua`, `weapon_plasmasword.lua` et `attack/weapon_plasmasword_attack.lua`. Les sources sont contrôlées par CRC et SHA-256. Le générateur est `tools/s5runtime-local/build_plasma_source_contract.py` : il extrait les déclarations sans exécuter Lua. Une déclaration ne prouve pas son invocation par le moteur.

Le script d'attaque courant extrait de `package/67.xs` a le CRC `6a2e38ca`, 35 637 octets et le SHA-256 `9b5f8d321766084c65fc7b334a2135b9906997f7f551b6facc516a8c1079b24f`. Il correspond à la fixture d'attaque actuelle. L'ancienne copie de 36 292 octets sous `work/s5runtime-decoder/game-data` diffère et ne sert pas de référence à ce passage.

Quatre fonctions de l'exécutable ont été décompilées avec Ghidra en lecture seule ; les noms ci-dessous sont des étiquettes d'analyse, pas des symboles originaux :

| Adresse | Étiquette | Résultat et limite |
| --- | --- | --- |
| `0062b710` | `plasma_lower_walk_tick` | Choix directionnel, animation et application du déplacement ; getters de vitesse encore à typer. |
| `00628be0` | `plasma_lower_air_tick` | Mise à jour aérienne et transitions ; sémantique complète encore à résoudre. |
| `0062a270` | `plasma_lower_enter` | Sélection entre trois branches ; leur nom exact reste à établir. |
| `0062a300` | `plasma_lower_exit` | Appel de sortie sans remise à zéro du pointeur sélectionné. |

Les quatre adresses d'entrée exportées correspondent exactement aux adresses demandées. Sorties privées : `work/s5runtime-local/private/decompiled-plasma/*.c`. Log : `work/plasma-restoration/decompile.log`. Il reste des appels non nommés et des types reconstruits : ces sorties ne constituent pas le projet source complet.

## Correction raccordée dans S5

`NormalState_PlasmaSword` et `RunState_PlasmaSword` ont été lus séparément des attaques. Dans l'ordre de présentation S5 (avant, avant-droite, droite, arrière-droite, arrière, arrière-gauche, gauche, avant-gauche) :

| État | Haut | Bas | Paramètres source |
| --- | --- | --- | --- |
| Repos | `A0013` | Pose de repos existante | Boucle, pas de reset, blend `1000/4800` s. |
| Marche | `A0005 A0006 A0007 A0011 A0010 A0012 A0009 A0008` | `00008 00009 00010 00014 00013 00015 00012 00011` | Boucle, vitesse 1, pas de reset, blend `1000/4800` s. |

Le rig importé conserve sa conversion gauche/droite à la frontière des coordonnées. Le test compare les clés sémantiques Lua indépendamment des tableaux runtime. Avant cette correction, le bas du corps utilisait les clips `A0005..A0012` du haut faute de tableau `runLower`. Le repos employait le fondu générique de 0,1 s.

Modifications : `src/plasma-locomotion-data.js`, `src/melee-weapons.js`, `src/motion-graph.js`. Aucun réglage général de déplacement ni paramètre d'attaque n'a été changé dans ce passage.

## Attaques au premier passage : fidélité encore à résoudre

Les sources recensent attaques légères/combo, forte et continuation, secondaire au sol et attaque aérienne. Ce premier passage conservait le runtime existant. Les fonctions natives d'attaque et leurs dépendances doivent encore préciser la signification complète des durées et délais ; l'adaptateur de contacts livré dans le lot courant est décrit en tête de fiche.

Points explicites à résoudre : `InitLua(750,1250,40,true)` du secondaire, `InitLua(400,1000,40,false)` de l'aérien, vitesse déclarée `0.85` de `A0018`, relation entre durée d'animation et durée d'état, impulsions et volumes `MakeFan`/`MakeBox`. Les branches MELEE et UNLIMITED n'ont pas toujours les mêmes multiplicateurs ; choisir le canal de référence avant une modification. Le combat d'entraînement actuel ne constitue pas une reproduction exacte des volumes natifs.

## Vérifications du passage

Rapports et captures : [work/plasma-restoration](../../work/plasma-restoration/).

| Contrôle | Résultat actuel | Preuve / limite |
| --- | --- | --- |
| C01 — accès/changement | Régressions de changement passées ; accès principal existant | `tests/weapon-switch.test.mjs`, ouverture du jeu avec `?weapon=plasma`. Inventaire et dépendances exhaustifs non réaudités. |
| C02 — directions | Clips haut/bas testés, 8 directions × 4 orientations × 2 sexes | `tests/plasma-locomotion-source.test.mjs`, vrais rigs. Comparaison visuelle exhaustive S5Runtime encore ouverte. |
| C03 — attache | Arme visible pendant la marche M/F | Captures `male-front-060.png`, `female-front-060.png`. Mesures quantitatives après mixer et toutes les attaques non certifiées. |
| C04 — visée | Applicabilité à établir pour les actions | Pas de certification de visée à partir de la seule locomotion. |
| C05 — jambes mobiles | Passage marche → légère → marche → repos testé | Vrais mixers M/F ; clips E des jambes d'attaque puis clips 000 de marche. Le test ne certifie pas une horloge native continue sur toutes les transitions. |
| C06 — effets | Non réévalué | Catalogue et rendu exhaustifs encore à vérifier. |
| C07 — trajectoires | Applicabilité à établir selon les effets d'attaque | Aucun traceur déclaré validé dans ce passage. |
| C08 — fumée | Applicabilité à établir depuis les événements | Aucun rendu déclaré validé dans ce passage. |
| C09 — poussée | Tests de combat existants passent | Impulsions natives et collisions de déplacement non certifiées. |
| C10 — réaction | Applicabilité distincte des armes à balles | Réactions propres à la Plasma à comparer au code natif. |
| C11 — dispersion | Aucune dispersion de tir validée | Applicabilité à confirmer depuis les volumes d'attaque. |
| C12 — sons/secondaire | Actions recensées dans les Lua | Écoute exhaustive et fidélité du secondaire non vérifiées. |
| C13 — combo/contact | Régressions existantes passées | Durées, volumes, dégâts et annulations exacts encore ouverts. |
| C14 — régressions/build | **138/138 tests ciblés**, build réussi | `tests.log`, `build.log`. Aucune certification native complète déduite. |

Marche observée dans le jeu principal à `qa=front&t=0.6`, sur les deux sexes. Les captures ne constituent pas une observation de toutes les attaques. Aucune nouvelle mesure ni comparaison en direct avec S5Runtime n'a été effectuée dans ce passage.

Le contrat central enregistre ce passage dans `sourceComparisons.plasma`, sans promouvoir une douzième famille comme prête. Ses **9/9 tests passent**, dont le contrôle du mapping Plasma et du statut non prêt. Le gate spécifique reste **ready=false**. Le vérificateur central a été exécuté : code de sortie **1**, onze familles recensées, aucune prête ; rapport `work/plasma-restoration/central-gate.json`. Ces limites préexistantes ne constituent pas une validation complète de la Plasma. Les seuils ne sont pas assouplis. Les nouveaux fichiers runtime, fixtures et fiche ne sont pas ignorés par Git ; les ressources de locomotion utilisent les bundles déjà présents.

## Suite du travail

### Second passage avec agents — 3 octobre 2026

Deux lots parallèles terminés : [contacts/dégâts](../../work/plasma-restoration/contact-analysis.md) et [effets/sons](../../work/plasma-restoration/effects-analysis.md). L'agent horloges n'a pas démarré après deux indisponibilités du modèle ; l'intégrateur a repris l'analyse [des fonctions natives](../../work/plasma-restoration/timing-analysis.md).

- Contacts : 27 constructions CAttack actuelles recensées, huit fonctions natives fingerprintées. Les paramètres de formes, dépendances et branches sont conservés ; aucune perte de HP finale ou priorité normale/critique n'est inventée. Une perte de contacts S5 dans un tick long est reproduite (3 événements → 1 réception), sans changer le solver dans ce passage.
- Ressources : 17 extractions CRC/SHA, cinq séquences parsées jusqu'à EOF, neuf sons publics identiques aux archives. La présence ne certifie pas la fidélité visuelle.
- Raccordement réalisé : `src/plasma-effects-data.js` appelé depuis `weapon-trail.js` et `weapon-cues.js`. **Traînée aérienne corrigée de 300–500 à 50–350 ms**. Déclaration active du cue aérien dans le wrapper correctement documentée ; timing de 500 ms et politiques de suivi existantes conservés.
- Pas encore raccordé : sélection des effets de contact normaux/critiques/aériens de l'adaptateur. Suppression de l'impact générique et de son audio de secours à traiter ensemble, en préservant le stun de la victime. Dégâts, formes, conditions physiques et horloges d'attaque restent non certifiés.
- **158 tests passent** (155 régressions et 3 tests du relevé de contacts), build réussi. Captures aériennes M/F à `qa=air-attack&t=0.2` conservées ; aucune erreur navigateur relevée sur le contrôle féminin. Elles ne certifient pas la géométrie native du ruban. Rapports : `parallel-pass.json`, `parallel-tests.log`, `contact-tests.log`, `parallel-build.log`. Les contrôles C05/C06/C12/C13 progressent ; aucune déclaration « prêt » n'est ajoutée. Gate central réexécuté : code 1, statut toujours non prêt.

Prochaine action : remonter les appels natifs des états d'attaque pour résoudre horloges, déplacement et contacts, puis appliquer les corrections justifiées dans S5. Les captures comparatives serviront à contrôler le résultat et les ambiguïtés restantes.

Aucun blocage arrivé au seuil de trois échecs ou 30 minutes sans progrès n'était déclaré lors de ce passage. La récupération des sources, la décompilation et la correction du mapping étaient des avancées vérifiables. Ce passage historique portait uniquement sur la Plasma ; la série mêlée a depuis été autorisée, avec le complément de contacts décrit en tête de fiche.

Raccordement commun lot2 : plasma-combat-data consommé par melee-runtime ; six contacts rush indexés, formes natives et dégâts presetPower17. Aérien damage4,76 et stun2,5s politique arène explicite ; mouvement et animation existants conservés. Suite globale1474/1478, quatre échecs préexistants, buildcode0. Les tests de stun attendent désormais le coefficient source.

## 22 octobre 2026 — attaque sautée et gel au stun

Comparaison dans une copie privée du client S5Runtime : classe CAttackState13B1E88, timer action400/récupération1000, impulsion physique-50000 puis resetXYZ. Le tick SetDrop et le tick de récupération sont deux branches successives : S5 laisse désormais l'impulsion contribuer à un pas avant le reset, au lieu de conserver cette vitesse pendant toute la récupération ou de l'annuler avant le déplacement. Les paramètres propres A0018/A0019 remplacent leur simple fitting à la durée de l'état.

Le retour utilisateur « freeze au moment où je stun » révèle aussi une pause générique45ms dans TrainingCombat.receive. Elle est supprimée uniquement pour plasma/air ; PlasmaSwordJumpAttack ne déclare pas SetHitStop. Le stun2,5s de la victime, les dégâts, le contact500ms et le cue source500ms sont conservés. Un test avec vrai combat et rigs M/F vérifie que l'horloge et les rotations des os de l'attaquant continuent après le contact.

**381/381 tests ciblés passent**, build réussi. Dans le jeu principal, M/F à620ms avec cible à1,5 : attaque620ms, récupération200ms, clip A0019, playback.1s, cible95,24HP et réaction stun. Le scénario melee-contact&action=air est désormais disponible pour Plasma. Captures, lectures natives brutes, essais intermédiaires et limites : [rapport](../../work/spy-plasma-fixes-20261022/analysis.md). La dépendance au pas physique et la calibration de toutes les hauteurs ne constituent pas une fidélité native complète ; gate ready=false maintenu. Aucun réglage général de mouvement changé.

### Rectification — gel avant la chute après le clic aérien

Le dernier retour utilisateur concerne la préparation, avant le contact. Le premier correctif avait mal positionné les arguments SetAnim : +4c reçoit le premier nombre,300 pour A0018 et1000 pour A0019, pas le troisième1000/500. Vérification directe du setter b77990 dans le binaire copié. L'ancienne vitesse2,125 terminait A0018 vers149ms, laissant sa dernière pose figée jusqu'au drop400ms. Vitesse corrigée≈0,6375 : geste encore animé jusqu'à la chute ; A0019 revient à1 au lieu de.5. Les captures précédentes à620ms restent historiques.

Nouveau test : vrais os M/F animés continûment entre160 et400ms, bon argument Lua, clip non terminé et drop préservé. Reproduction0/3 avant,15/15 après avec les tests de contact ;384/384 régressions ciblées passent. [Preuve et captures](../../work/plasma-air-freeze-20261022/analysis.md). Aucune modification supplémentaire des délais physiques, du contact ou des effets ; gate natif inchangé.

## 25 octobre 2026 — réaction reçue tronquée après le clic droit

Le rush Plasma (`heavy`, `PlasmaSwordDash`) conservait les six contacts mais leur réaction reçue utilisait le repli S5 de250ms. Les six attributs source déclarent `SetDamageData(1000, ...)`. Le consommateur Damage18 transmet aussi cette durée au lecteur d'animationB77CB0 : il adapte la vitesse du clip à la durée reçue, avec redémarrage au nouvel impact admis. La source et ses21ancres sont conservées dans [la preuve](../../work/melee-pvp-comparison-20261017/capture-expansion-v2/plasma-rush-received-animation-source-20261024/source-proof.json).

Le correctif consomme1000ms uniquement pour ce rush, ajuste la réaction normale avec la durée du vrai clip de la victime selon sexe/direction et synchronise sa lecture sur l'âge de réaction, y compris pendant les pauses d'impact. Il conserve les redémarrages par contact et les300/200ms déjà établis pour les premières légères Plasma/Counter. Les réactions Blow/Stun/Death suivent leur chemin existant. Ce passage corrige la réaction reçue ; il ne certifie ni les poussées natives ni l'intégralité de l'arme. Vérifications et captures : [rapport du correctif](../../work/melee-pvp-comparison-20261017/capture-expansion-v2/plasma-rush-received-animation-fix-20261024/REPORT.md).
