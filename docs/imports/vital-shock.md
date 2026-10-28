# Vital Shock — reprise des attaques manquantes, 3 octobre 2026

28 octobre2026 — choix F · Flame ajouté par attaque, couleur réglable et option globale
Keep flames active hors attaque, sauvegardés dans inventaire/Échap/paramètres.
Effets/impacts/audio existants conservés ; ancrages post-mixer, limites et
preuves groupées : `work/weapon-flames-all-20261028/README.md`.

27 octobre2026 — trois directions artistiques propres à cette arme, déclinées
par attaque et sélectionnables dans l'inventaire. Géométries distinctes ;
séquences structurelles, particules d'impact et audio existants conservés.
Mécaniques et gates natifs inchangés. Sources, ancrages et contrôles :
[lot artistique](../../work/melee-art-expansion-20261027/README.md).

26 octobre 2026 — la sphère du dash à alpha nul ne dessine plus un masque de
profondeur invisible. Courbe confirmée dans le pack ; animations et hiérarchie
conservées. 54 contrôles groupés et un build. Les limites d'entrée/physique
restent distinctes. [Lot](../../work/weapon-polish-20261025/melee-zero-draw-batch/README.md).

26 octobre 2026 — événements d'état visuels/sonores : seuil strict et horloge
ms/s harmonisés. 68 contrôles groupés et un build ; factory, Pull et autres
limites natives restent ouverts.
[Lot](../../work/weapon-polish-20261025/melee-event-clock-batch/README.md).

25 octobre2026 — matériaux équipés corrigés dans le renderer commun joueur /
adversaires. Les19pièces Black Cat utilisent leurs flags source :13pièces
sans éclairage,4solides éclairées,1couche alpha et1couche additive sans
éclairage. Les pointes transparentes ne sont plus des surfaces opaques ;
elles sont exclues des ombres et du masque d'encre selon la politique S5
déjà utilisée pour les overlays équipés. Les autres pièces gardent leurs
ombres/contours ; le personnage conserve son matériau précédent.
SCN brut authentifié et parseEOF, assets inchangés,29régressions groupées
et un build commun. Repos et attaque observés dans le jeu principal sur un
personnage ; comparaison visuelle native distincte, gates inchangés.
[Lot](../../work/weapon-polish-20261025/vital-equipment-materials/README.md).

25 octobre2026 — sélection de Vital Shock ajoutée aux adversaires Free training.
Le parcours prépare le modèle, les animations, les effets et les sons existants
avant exposition ; aucune nouvelle traînée n'est inventée pour les sources
non résolues.50 contrôles groupés et un build commun avec Assassin Claw :
`work/weapon-polish-20261025/claw-main-batch/README.md`. Les politiques d'entrée,
réactions et limites natives des cinq actions restent celles détaillées ici.

25 octobre2026 — suite du lot : hiérarchies `vital_claw_01/02` restaurées,
avec pièces homonymes conservées par index. Bilan :
`work/weapon-polish-20261025/indexed-melee-effects/README.md`.

25 octobre2026 — hiérarchie interne du dash `vt_dashatk_01` restaurée avec
le dummy animé et le clip vtdash ; les trois loaders en profitent. Lot partagé :
`work/weapon-polish-20261025/melee-effect-hierarchy-batch/README.md`.
Les effets de contact commentés et les attaches externes restent inchangés.

Statut : **cinq actions raccordées au jeu principal en essais ; non prêt natif**. Le Vital Shock moderne est sélectionnable séparément de l'ancien Assassin Claw, au menu et dans l'inventaire.

## Pourquoi l'ancien raccordement ne suffisait pas

La page demandée [Vital Shock](https://s4league.fandom.com/wiki/Vital_Shock) est inaccessible via l'outil web (URL restreinte/robots). L'index consultable de [Comparison of sword weapons](https://s4league.fandom.com/wiki/Comparison_of_sword_weapons) énumère cinq mouvements : gauche, saut, droit, fort après droit, fort. Cette liste a servi à chercher les actions ; ses dégâts et délais ne remplacent pas les sources locales actuelles.

L'ancien item **2000005**, modèle `vital_shock.scn`, n'a qu'un binding `left_attack → StandardAssassinclaw` et neuf contacts. L'item actuel **2000065**, modèle `vital_shock_blackcat.scn`, possède cinq bindings distincts. Son XBN annonce **type 20, Power 5, range 250**, mais les fonctions Lua utilisent **WEAPONTYPE_VITAL_SHOCK = 54**. Les sockets XML des types 20 et 54 sont tous deux `ber_arm_R`, link 1. Cette divergence de type est exposée par `nativeType:20`, `scriptWeaponType:54`, `typeConflict:true` ; la factory native moderne n'est pas certifiée. Ne pas transférer silencieusement les cinq attaques au contrat de 2000005.

`work/melee-batch-3/vital-shock/source-contract.json` conserve onze fichiers actuels avec CRC/SHA et treize fonctions complètes. Extraction depuis la copie des archives, jamais l'installation originale. Le manifeste d'assets conserve 34 ressources brutes authentifiées. Les scripts `extract_sources.py`, `extract_assets.py`, `stage.mjs` sont reproductibles.

## Code directement raccordable

`src/vital-shock-data.js` expose définition, aptitude, contacts, paramètres, locomotion, jambes, événements et ressources. `src/vital-shock-motion-data.js` conserve les durées et courbes MoveBox réelles par sexe. `src/vital-shock-input.js`, livré par l'agent natif, résout les cinq noms XML via `vitalShockActionFromBinding` et refuse l'ancien item. Il n'invente pas de fenêtres clavier.

| Binding et genre S5 | Fonction actuelle | Clips action / délai | Contacts, Power = 5 |
| --- | --- | --- | --- |
| left_weak / light | StandardVitalShock_Attack | C0001 | BOX à 250 ms : 5 ; RAY critique à 250 ms opt-in : 5 avant multiplicateur natif inconnu |
| left_jump / air | StandardVitalShock_JumpAttack | DC001 | BOX à 200 ms : 5 ; Blow `[0,-1500]` |
| right_attack / rush | StandardVitalShock_Dash | R0001 / R0026 | Quatre BOX à 200/300/400/500 ms : 2,5 chacune ; succès CONDITION_ACTOR |
| left_strong1 / strong | StandardVitalShock_Strong | C0000 / C0021_1 | FAN à 350/550 ms : 4 puis 6 ; Pull `[200,0,825,5000,100]` au second |
| left_strong2 / strongFollow | StandardVitalShock_Strong1 | C0000 / C0021 | BOX à 250 ms : 5 ; **27** FAN de 300 à 1210 ms, pas 35 ms : 0,6 chacun ; FAN final à 1240 ms : 10 |

La boucle Lua `for index=1,14,0.5` crée **27 objets indépendants**, chacun avec Blow `[0,500]` et Pull `[200,0,275,500,100]`. Le dernier Blow vaut `[3500,1500]`. Le total est 37 contacts actifs hors RAY, 38 déclarations avec lui. Les puissances du tableau sont les quatrièmes arguments d'InitAttack1, pas des HP finaux certifiés. Chaque objet garde son identité, ses conditions, la forme entière et les effets de caméra. Le cinquième `AddtionalPower` mal orthographié reste inconnu.

Contrairement à la formule combo du wiki, `Strong1` a ici un nombre fixe d'objets. Aucun `DependOn` n'est déclaré. Le rayon léger appelle réellement `SetAlwaysCritical(true)` mais son cumul avec la BOX et le multiplicateur sont inconnus : option `includeUnverifiedRay`, désactivée par défaut. Le second fort utilise un attribut nommé CRITICAL sans appeler AlwaysCritical ; le nom ne suffit pas à fabriquer un critique.

## Horloges et mobilité

Les `InitLua` de rush, strong et strongFollow déclarent respectivement action/récupération **650/1000**, **550/150**, **1300/300 ms**. Le troisième argument **40** est la fréquence minimale de mise à jour de scène, pas une phase ajoutée. Toutes les vitesses SetAnim de ces actions/récupérations valent 1. Le rush déclare MoveBox × 2,5 ; les multiplicateurs 1,5 et 5 des deux forts sont commentés et restent inactifs.

Le léger déclare SetAnim C0001 avec premier argument 600. Son état n'a pas de durée finale prouvée ; la durée S5 de 600 ms est une politique déclarée. L'aérien utilise provisoirement la durée du clip DC001, **3120 ticks / 4800 = 650 ms**, identique M/F. Il coûte 10 SP ; strong coûte 15 SP. Le Lua aérien ne déclare **ni staySky ni impulsion de déplacement de l'attaquant**. Le Blow vise la cible, il ne faut pas le transformer en impulsion du joueur.

Le mapping « droit = rush ; gauche long = strong ; gauche après rush = strongFollow » et sa fenêtre de fin d'action sont des règles d'arène choisies par l'intégrateur. L'XML prouve les noms d'actions mais pas ces fenêtres ni l'exigence éventuelle d'un contact réussi. `automaticStrongFollow:false`. La force Pull est exposée mais sa consommation physique native n'est pas établie.

## Repos, marche, attache et ressources

NormalState_VitalShock déclare C0011. RunState_VitalShock déclare les huit hauts `C0012 C0013 C0014 C0018 C0017 C0019 C0016 C0015` et bas `00008 00009 00010 00014 00013 00015 00012 00011`, dans la même frontière de coordonnées que les rigs existants. Les jambes de light/air viennent séparément de leurs états : `DD005 DD006 DD007 DD011 DD010 DD012 DD009 DD008`, immobile C0001. Les tableaux conservent boucles, vitesse et blends source.

Les 24 clips réels nécessaires sont présents pour M/F : les carriers racines fournissent les locomotions, C0000, DD et R ; les carriers `bip_<sexe>/<sexe>_bip_0000.scn` fournissent C0001, C0021, C0021_1 et DC001. Aucun renommage de clip. R0001/R0026 existent déjà dans le rig partagé ; leurs pistes sont comparées aux sources avec tolérance d'arrondi puis réutilisées, plutôt que dupliquées dans le delta. Les courbes MoveBox restent issues de la source à pleine précision.

`public/assets/s5runtime/vital-shock/model.json` est un **tableau** de scènes compatible loader, avec les 19 meshes et la hiérarchie/skinning actuels. La texture source est PNG, pas DDS. L'attache `ber_arm_R`, link 1 est conservée, sans nouvelle rotation de prise. Le mixer ne fait pas sortir le dummy de sa région d'attache sur les deux sexes ; l'angle et l'apparence exacts nécessitent l'observation en jeu principal.

Six séquences actives restaurées : vital_claw_01, vital_claw_02, vt_dashatk_01 et weapon_vitalshock_strong_01/02/03. Elles comportent trois modèles animés et leurs textures ; les quatre sons existent. `VITAL_SHOCK_SOURCE_EVENTS` conserve les délais, slot 0 et arguments de durée 5000/700/0 ainsi que AddSoundBySex. Un nœud vt_dashatk_01 sans texture est omis avec preuve. Émission/suivi/extinction ne sont pas certifiés par la fermeture des ressources.

**Tous les blocs ATTACKATTRIB_VITAL_SHOCK du fichier actuel attackattribindexer.lua sont commentés.** L'adaptateur ne réactive donc pas leurs sons ou séquences d'impact, contre, garde, hit reaction ou multiplicateurs. `counterable:null`, `attributeVerified:false`, effets d'impact null. Les séquences d'action ci-dessus sont bien actives dans actorstates_vitalshock.lua et ne sont pas concernées par cette limite.

## Vérification courte et prochain blocage

**10/10 tests passent** : `node --test tests/vital-shock-source.test.mjs tests/vital-shock-input.test.mjs`. Sources/empreintes, identité, cinq bindings, contacts et boucle, paramètres commentés, ressources fermées, 24 clips, huit directions haut/bas et attache évaluée après mixer M/F. Les captures, interactions avec le contrôleur, changement d'arme, régressions partagées et build appartiennent au raccordement de l'intégrateur ; aucun résultat S5Runtime direct n'est revendiqué.

Prochain blocage natif : **résoudre item/type/factory et les attributs d'impact actifs**. Les trois pistes de recherche du graphe moderne dans le PE/modules sont conservées par l'agent natif dans `work/vital-shock-input-native/README.md` ; elles n'ont pas justifié d'inventer des transitions. Le reste de la préparation a progressé jusqu'au code et aux assets utilisables. Gate **ready=false**.

## Raccordement principal et preuve, 3 octobre 2026

Commandes S5 explicites : clic gauche bref = light ; maintien gauche = strong ; gauche en hauteur = air ; droit au sol = rush ; gauche pendant la ruée mémorise strongFollow après la phase650ms. Cette dernière fenêtre, le blocage du déplacement clavier pendant rush/strong/strongFollow et les sorties600/650ms sont des politiques d'arène, pas des fenêtres natives certifiées. Le follow n'est jamais automatique. Coûts source air10SP et strong15SP raccordés, minimum vérifié avant entrée. Rush multiplie la courbe source par2.5 et s'arrête sur contact selon SetMoveStopWhenDamage(true).

Les cinq actions consomment leurs37 volumes non critiques indépendants, sans doublons par victime. Les29 contacts de strongFollow proviennent du premier objet, des27 passages de la boucle Lua et du dernier objet. Effets et sons suivent les événements d'action actifs ; aucun impact commenté n'est réactivé. La récupération R0026 n'a aucune piste MoveBox : delta nul, sans emprunt d'une autre arme. Le plantage dû à sa courbe vide a été reproduit et corrigé.

15/15 tests Vital passent, dont chargement par défaut, mixer et déplacement M/F×8directions, cinq actions, SP, contacts à trois pas de simulation et changement d'arme. Preuves : `work/melee-batch-4/vital-shock/integration-tests.tap`, `work/vital-shock-gameplay/README.md`. 99/99 régressions ciblées avec Sigma/moteur commun passent ; build réussi, contrat central10/10. Gate central toujours non prêt (92erreurs/22avertissements historiques), aucun gate assoupli. Captures principales dans `work/melee-batch-4/visual/vital-*` ; comparaison visuelle directe S5Runtime encore à établir.

## Nouvelle vérification des commandes réelles

La nouvelle demande d'attaques manquantes a été vérifiée avec `MovementInput`, pressions/relâchements/maintien réels, sur les deux sexes : les cinq actions sont accessibles. Un gauche bref se déclenche au relâchement, un maintien à 200 ms ; en l'air les deux donnent l'aérien. Pour la rafale, gauche doit être demandé **pendant la ruée ou sa récupération** ; après la sortie complète, gauche produit une frappe ordinaire. Le HUD « gauche après ruée » expliquait mal cette distinction. Les helpers dédiés et le libellé précis sont livrés dans `src/vital-shock-input.js`, à raccorder par l'intégrateur dans les fichiers partagés. La politique est inchangée et n'est pas une preuve du graphe natif. **19/19 tests Vital passent avant ce raccordement**, preuve `work/melee-batch-4/vital-shock/real-input-tests.tap`. La comparaison demandée et les limites sont détaillées dans [missing-attacks-recheck.md](../../work/melee-batch-4/vital-shock/missing-attacks-recheck.md). Aucune attaque supplémentaire n'a été inventée.

Raccordement réalisé par l'intégrateur dans `controller.js`, `melee-weapons.js` et `main.js` : helpers et commandes précises consommés. **80/80 régressions ciblées passent après raccordement**, dont les 19 Vital ; **build réussi**, avertissement dynamic import connu. Preuves `work/melee-batch-4/vital-shock/input-fix-regressions.tap` et `input-fix-build.log`. Les anciennes limites et le gate natif non prêt sont conservés.

## Réexamen des effets de la rafale

Le nouvel agent livre `src/vital-shock-effects.js` : le cinquième argument AddSequence reste `sourceEndMs`, sans être interprété en durée du SEQ. L'ancien mapping étirait les séquences light/air1s à5s et coupait `weapon_vitalshock_strong_03`1s à700ms. **Suppression d'une interprétation non prouvée**, sans prétendre résoudre les paramètres natifs de suivi/annulation. Trois tests reproduisent la coupe et vérifient les fenêtres auteur ; **22/22 tests Vital passent avant raccordement partagé**. Raccordement et observation M/F confiés à l'intégrateur. [Preuve et limites](../../work/vital-shock-attack-fixes/README.md) : aucun sixième binding source retrouvé, graphe moderne et physique Pull restent à établir.

L'intégrateur a raccordé le helper dans weapon-cues et le loader commun.
Le vrai chemin playAttackEffects conserve les deux événements de rafale
sans déformer leur SEQ ; tests de raccordement9/9. Rafale et effets observés
sur les deux corps à800ms d'attaque avant le correctif d'impulsion ci-dessous,
captures `work/melee-batch-5/visual/vital-*-rafale-080.png`, sans erreur console.

## Impulsions et coups perdus pendant la rafale

Défaut reproduit : les contacts `[0,500]` appliquaient la poussée S5 générique
12/18 et expulsaient immédiatement la cible hors portée. Le calcul Blow natif
est désormais raccordé : intermédiaires0/3, aérien0/-9, final21/9 en unités
S5. La réception réelle est testée M/F×8orientations ; la cible reste sur
son axe horizontal pendant la rafale rejouée. **311/311 régressions ciblées,
contrat11/11 et build réussis** après effets/impacts/Blow. Preuve détaillée :
[`blow-native.md`](../../work/melee-batch-5/blow-native.md).

Pull reste sans consommateur physique ; le cap natif des impulsions non
nulles, l'intégration physique finale et le graphe des commandes restent à
établir. Aucun sixième mouvement n'est annoncé et aucune comparaison complète
avec le wiki inaccessible n'est revendiquée. Gate ready=false conservé.

Contrôle aérien principal M/F à distance1.5 : DC001, HP95, réactionBlow,
vitesse verticale cible-11.7 après gravité S5, sans erreur console.
Captures `work/melee-batch-5/visual/vital-{female,male}-air-contact-native-blow.png`.
Le scénario à distance2 était hors de portée et ne constituait pas un test
de réception. Le paramètre QA targetDistance a été généralisé sans modifier
la portée source ; build après QA réussi. Complément de régressions autres
armes225/225, périmètre partiellement recoupé, preuve dans blow-native.md.

Reprise ciblée de la demande d'attaques manquantes : **22/22 tests actuels
passent**, `work/melee-batch-5/vital-latest-recheck.tap`. Les cinq callbacks
restent raccordés ; aucun nouveau mouvement absent n'est confirmé. Recherche
supplémentaire Pull dans le bundle natif local décodé sans résultat ; ce
constat ne prouve pas une absence native. **Pull non consommé** demeure la
limite exacte des deux fortes. La condition de reprise et les commandes
actuelles sont consignées dans
[`README`](../../work/vital-shock-attack-fixes/README.md).

4 octobre2026 : le lecteur commun respecte maintenant le playSound=false
déclaré sur le deuxième contact strong pour toutes les armes. Vital garde ses
impacts null (attributs commentés) ; le son d'action shockwave_hit à300ms reste
indépendant et testé.58 régressions ciblées passent, build réussi ; preuve
`work/melee-batch-5/melee-impact-silence.md`. Aucun nouveau binding ni Pull ajouté.
