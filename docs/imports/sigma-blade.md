# Sigma Blade classique

28 octobre2026 — choix F · Flame ajouté par attaque, couleur réglable et option globale
Keep flames active hors attaque, sauvegardés dans inventaire/Échap/paramètres.
Effets/impacts/audio existants conservés ; ancrages post-mixer, limites et
preuves groupées : `work/weapon-flames-all-20261028/README.md`.

27 octobre2026 — trois directions artistiques propres à cette arme, déclinées
par attaque et sélectionnables dans l'inventaire. Géométries distinctes ;
séquences structurelles, particules d'impact et audio existants conservés.
Mécaniques et gates natifs inchangés. Sources, ancrages et contrôles :
[lot artistique](../../work/melee-art-expansion-20261027/README.md).

26 octobre 2026 — les traînées des deux formes héritent maintenant du
brouillard de la carte, selon FogEnable=true du producteur XML commun.
Préchauffage none/linear/exp2, coalescence et reprise sur échec partagés ;
horloges, géométrie, formes et mélanges conservés. Paramètres natifs et seconde
passe restent à qualifier. [Lot](../../work/weapon-polish-20261025/melee-trail-fog/README.md).

25 octobre 2026 — placement des couches homonymes corrigé : les deux
modèles6/7 normaux et dix modèles11–20 transformés gardent chacun leur repère
animé et leurs pistes source, au lieu de partager ceux du dernier homonyme.
Assets/noms visibles intacts, parents/poids ambigus refusés, pas de double
transformation résiduelle.208mesures post-mixer sur un personnage ;28contrôles
groupés avec Scythe et un build commun réussis. Rendu principal observé,
comparaison native des pixels et gates toujours distincts.
[Lot](../../work/weapon-polish-20261025/sigma-equipped-model-indices/README.md).

25 octobre 2026 — opacité des modèles équipés raccordée : 15 couches
lumineuses, deux normales et treize transformées, retrouvent leurs 227 pistes
alpha depuis les SCN authentifiés. Index par pièce, sans fusion des homonymes ;
lecture par le mixer existant, préparation et cache avant combat. Aucun UV
animé inventé depuis les noms. 16 régressions groupées et build commun réussis ; rendu principal observé
sur le personnage sélectionné. Horloges natives/pixels et autres gates distincts.
[Lot](../../work/weapon-polish-20261025/equipped-opacity/README.md).

25 octobre2026 — le fort transformé suit maintenant la racine SCN du
personnage, échelle comprise. Trois poses actives du loader de dummy sont
identiques au parent personnage pendant un déplacement réel ; la sous-scène
de puissance reste sous le dummy animé. Le recalage post-pose utilise la même
racine sans second tick ni réémission. Le leg normal n'est pas extrapolé.
23régressions groupées et build commun, observation principale conservée ;
pixels, espaces fins des particules et autres gates restent distincts.
[Lot](../../work/weapon-polish-20261025/melee-actor-scene-follow/README.md).

25 octobre2026 — correction du bilan précédent : la hiérarchie native observée
était bien plate, mais le renderer S5 ne l'était pas. Le pré-raccordement
générique attachait11modèles homonymes au dernier modèle, dont la piste
réduisait/déplaçait les autres pièces de l'effet fort transformé.
`sigma_power_att` est désormais qualifié par son conteneur source authentifié :
douze frères, douze pistes, copies du pool indépendantes. Raccordement commun
joueur/adversaires, rendu observé dans le jeu principal sur un personnage.
26contrôles du lot et un build commun passent ; sources publiques inchangées.
Les matrices/pixels natifs, commandes ordinaires et autres propriétés de la
séquence restent des vérifications distinctes.
[Bilan corrigé](../../work/weapon-polish-20261025/sigma-power-hierarchy/README.md).

25 octobre2026 — graphe actif du modèle `sigmablade_power_att` observé dans
le Jeu référence : un conteneur et douze modèles homonymes, tous enfants
directs de ce conteneur. Le parent déclaré désigne le nom d'en-tête SCN,
pas le dernier modèle homonyme. La conclusion initiale «S5 déjà plat» est
infirmée et corrigée par le passage ci-dessus. Le deuxième loader et les
autres propriétés du rendu ne sont pas certifiés par cette observation.
[Preuve du lot](../../work/weapon-polish-20261025/melee-active-hierarchies/README.md).

25 octobre2026 — raccordement côté adversaire. Sigma est maintenant proposée
dans le choix d'arme de Free training. Le même adaptateur de traînées est
préparé sur le rig adverse avant remplacement, puis emprunté par le combat,
mis à jour après son mixer et publié par son render. Reset/retour lobby
nettoient l'historique ; la ressource reste en cache sans rechargement.
Vrais rigs M/F, deux formes et réattache testés. Deux échecs Plasma du test
de maintien se reproduisent sur la version antérieure du combat et restent
hors de cette correction. [Bilan et preuves](../../work/weapon-polish-20261025/sigma-opponent-trails/README.md).

25 octobre2026 — deux traînées acteur raccordées au joueur principal. Le
ruban générique n'émettait jamais pour Sigma. Le nouvel adaptateur conserve
les deux Line01, leurs parents différents (Bone normal, ModelData transformé),
les textures DDS authentifiées et leurs mélanges distincts. Les fenêtres sont
lues dans les événements source, y compris la durée0 du deuxième coup normal.
Préchargement/précompilation, fondu, changement de forme et buffers stables
sont contrôlés. Le scénario mêlée n'avance plus le ruban deux fois par tick.
Raccordement initial/inventaire/QA effectué ; parité adverse ajoutée au passage
ci-dessus, comparaison native et passes GPU supplémentaires toujours ouvertes.
Preuves, observations et limites :
[`sigma-actor-trails`](../../work/weapon-polish-20261025/sigma-actor-trails/README.md).

25 octobre2026 — fond noir des halos : les quads lumineux de la forme normale
(renderState617) étaient chargés comme des surfaces toon opaques. L'avatar
applique désormais leurs flags additifs, y compris aux couches lumineuses de
la forme transformée. Ces quads ne participent plus aux ombres ni au masque
de contours ; les pièces solides conservent leur matériau précédent.
Les assets, attaches et animations restent inchangés. Régression M/F avec
bascule normale→transformée→normale dans `tests/sigma-blade-material.test.mjs` ;
7 contrôles matériau/gameplay passent. Compilation Vite en mémoire réussie
(sans réécriture du build utilisé par le chantier principal).
Preuves de ce correctif : `work/sigma-black-halo-20261025/`.

25 octobre2026, sélection des effets par forme : le booléen final des
séquences est désormais décodé. L'argument absent de `AddSequenceBySex`
devient exactement `false` via le thunk Lua ; le consommateur compare ce
champ à la forme courante de l'acteur. `sigmablade_leg_eff` du deuxième
coup est donc réservé à la forme normale. S5 l'affichait aussi en forme
transformée : ce défaut est corrigé dans l'adaptateur propre à Sigma.
`sigmablade_power_att` et `sword_power` restent réservés au fort transformé,
comportement maintenant confirmé par la source.

Les tests reproduisent d'abord l'effet indésirable sur M/F, puis passent
avec les vrais Controller, MotionGraph, avatars et moteur de séquence.
22 tests Sigma verts, build réussi sans changement de source pendant la
compilation. Preuve reproductible et limites :
`work/weapon-polish-20261025/sigma-sequence-gate/HANDOFF.md` ; tests
`work/weapon-polish-20261025/sigma-sequence-tests.tap`.
Le consommateur partagé, les horaires, les contacts, les animations et
les trois armes validées par l'utilisateur ne sont pas modifiés.
L'horloge native strictement après le seuil est prouvée ; son alignement
dans le consommateur VFX commun reste distinct de ce correctif de forme.
Placement, suivi, écoute et comparaison visuelle native restent ouverts.
Quatre captures du jeu principal M/F montrent l'arc normal conservé et
son exclusion après transformation, cible distante sans éclat d'impact :
`work/weapon-polish-20261025/sigma-sequence-gate/browser/BROWSER.md`.
Il s'agit de scénarios QA figés, pas d'un contrôle des commandes ordinaires.

4 octobre2026, aérien : les deux clips alternés suivent désormais la
conversion de durée float32 native et la requête550ms de la classe Spy.
Récupération vide continue le clip courant. Vrais rigs M/F×8caps×2formes×
2indices,85 régressions, build et quatre observations du jeu principal.
Preuve et limites : `work/melee-batch-5/sigma-air-speed.md`.

4 octobre2026, transformation : vitesse native500ms et récupération0
distincte raccordées selon la classe659110. Sortie stricte au tick suivant,
bascule et contacts conservés. M/F×8caps×2sens,84 régressions, build et
quatre captures en jeu. Preuve : `work/melee-batch-5/sigma-transform.md`.
Drain, persistance du mode et fondus globaux restent non certifiés.

4 octobre2026, attaque forte : requêtes natives420/300ms normale et700/800ms
transformée raccordées aux clips et au MoveBox après identification de la
factory8576b0/CAttackState. M/F×8caps×2formes,83 régressions, build et quatre
captures en jeu réussis. Preuve : `work/melee-batch-5/sigma-strong.md`.
Fondus et certification globale restent ouverts.

4 octobre2026, combos au sol : vitesse des clips et MoveBox raccordée aux
durées natives InitLua/InitLuaInTrans en formes normale et transformée.
M/F×8caps, contacts, fins et switch testés ;83 régressions et build réussis,
quatre observations dans le jeu principal. Aucun nouvel enchaînement ajouté.
DC018 sans clés ne provoque plus d'exception ; zéro déplacement S5 reste un
fallback non certifié natif. Preuve et limites :
`work/melee-batch-5/sigma-blade-animation-speed.md`.

4 octobre2026, sons d'impact : les deux premiers contacts du fort transformé
(200/400ms) sont désormais muets conformément à SetPlaySound(false). Le
troisième à620ms garde bsword_attack ; forme normale, dégâts et effets
préservés. Vrais consommateurs cible/décor testés M/F×8caps ;58 régressions
et build réussis. Preuve : `work/melee-batch-5/melee-impact-silence.md`.
Correction du lecteur commun, aucune nouvelle validation par écoute native.

3 octobre 2026. **Sélectionnable en essais dans le jeu principal : adaptateur, ressources, entrées/combo et transformation raccordés ; 13/13 tests dédiés et quatre tests gameplay réussis, dont le vrai Controller sur les deux personnages.** Observations M/F et build partagés consignés en fin de fiche. Aucune certification native globale. [Guide](../IMPORT-ARMES-GUIDE.md).

Item2000017, type38, power12.5, range500, déplacement1.1. **41 sources actuelles authentifiées** par longueur/CRC d’archive et SHA256 dans `work/melee-batch-4/sigma-blade/source-manifest.json`. Les anciens aperçus ont servi à retrouver le porteur d’animation, sans reprendre leur contrôleur.

| État | Forme normale | Forme transformée |
| --- | --- | --- |
| Repos | DC000 | DC019 |
| Marche upper / lower | DC029–036 /00008–015 | DC020–027 /00008–015 |
| Coup1 | DC001/DC000 ;420/300ms ; contacts180(.2×power),250(.4×power) | DC009/DC019 ;750/300ms ;100(.6),440(1) |
| Coup2 | DC002/DC005 ;300/300ms ;210(1) | DC011/DC019 ;800/300ms ;470(1) |
| Coup3 | DC003/DC028 ;650/0ms ;300(1), profil disponible sans entrée normale démontrée | DC010/DC016 ;1000/300ms ;500(1.3) |
| Coup4 | État marqué seulement en transformation | DC013/DC018 ;1000/250ms ;200(.2),430(1) |
| Fort / contre | DC001/DC000 ;420/300ms ;180(.2),250(.4) | DC012/DC017 ;700/800ms ;200(.9),400(.7),620(1.1) |
| Aérien | SN013/SN014 déclarés,550ms ; contact200(.45), moveRate.5, MoveBox×2 | Même état source |
| Transformation | DC007/R0031,500ms | Sortie DC008/R0033,500ms |

Repos et marche sont lus séparément dans NormalState/RunState. Les deux channels lower existent explicitement ; boucle/vitesse1, blend1000ticks. La permutation gauche/droite de présentation suit les clips génériques actuellement utilisés dans S5 ; comparaison visuelle Sigma encore requise.

La forme bascule **à l’entrée** de la transformation (`6583f0`), avant les animations. Activation : minimum20 SP, contactCYLINDER à90ms, power×.5, blow1450/2800. Désactivation : aucun contact, aucun minimum SP ; seule cette direction est bloquée tant que `now <= lastTransform +1500`. Ces asymétries viennent de `658130`, `659f00` et `659e90`, pas d’une estimation. La dépense déclarée reste0. Le contre déclare minimum5 SP/dépense0. Drain continu, sortie automatique à0 SP et persistance après changement d’arme restent non établis.

Les tables natives donnent deux coups normaux avec transition après400ms, puis uniquement la transformation après500ms au relâchement droit. Transformée : clics gauches courts vers coups2/3 après610/700ms ; clics longs vers le fort après610/700/900ms. Aucun quatrième coup court n’est inventé. Au repos/marche, l’entrée9 `USE_WEAPON2` tenue demande la transformation ; pendant le combo normal, ce sont les entrées12/13 de relâchement droit. Pendant la transformation, gauche court/long est accepté dans0..20ms (déclenchement strictement après20) ou directement à partir de101ms ; le trou21..100ms est conservé.

## Code livré

- `src/sigma-blade-data.js` : `SIGMA_BLADE_DEFINITION`, `SIGMA_BLADE_TRANSFORMED_DEFINITION`, `sigmaBladeDefinition({transformed})`, `getSigmaBladeAttackProfile(kind,{comboIndex,transformed})`, `sigmaBladeAttackContacts(kind,comboIndex,{transformed,power,range})` et ressources.
- `src/sigma-blade-source-data.js` :17CAttack et paramètres/animations/événements/attributs générés depuis les16fonctions authentifiées, pas de dépendance aux dossiers privés à l’exécution.
- `src/sigma-blade-motion-data.js` :55durées par sexe et courbes MoveBox directesDC001/002/003/009/010/011/012/013/017/018. Les autres courbes absentes sont marquées, sans fallbackBASE inventé.
- `src/sigma-blade-effects.js` : chargement des trois séquences, cues et sons sourcés. La sélection de forme des deux séquences actives est établie ; suivi spatial et rendu restent à comparer.
- `src/sigma-blade-input.js` : tables natives, files d’entrées consommées une fois, `sigmaBladeInputTransition`, `sigmaBladeTransformPermission` et `sigmaBladeTransformEntry`. La permission et l’entrée restent pures ; le Controller conserve le mode précédent dans l’attaque et applique immédiatement le nouveau mode à l’acteur.

## Ressources et limites

`public/assets/s5runtime/sigma-blade/` :34sorties plus manifeste, modèles séparés normal/transformé, textures, icône, neufOGG, trois séquences et leurs dépendances,33nouveaux clips par sexe. **Aucune dépendance manquante à la conversion.** PorteurDC retrouvé dans `model/character/bip_{sex}/{sex}_bip_0000.scn`, absent du porteur principal ; parents normalisés et matrices de bind contrôlées par le sélecteur existant. Les22clips communs déjà présents sont préservés.

Le modèle normal aligne `Sigma_Wea_Dummy` sur `R_Hand_Dummy`, la forme transformée `Sigma2_Wea_Dummy` sur la même main. L’attachement source déclare link0 pour scène0, link2 pour scène1 ; les deux fichiers runtime séparés évitent leur superposition, sans prétendre reproduire le mécanisme natif link2/visibilité. Le normal se range surR_Hand_Dummy, la seconde scène surSpine_Dummy.

Limites bloquant une annonce « prêt » :

- `SetOnlyUseInWeaponChage` est décodé : défautfalse, sélection exclusive à l’entrée de CAttackState par `5e6d80/5e6e00`, consommation de l’activation dans `56d9a3`. La classe aérienne Spy et la transformation possèdent leurs règles séparées. Deux prédicats acteur de l’entrée générique restent non nommés ; la fidélité des états spéciaux hors arène n’est pas annoncée.
- Le troisième coup normal appelle `MAKECYLINDER(anchor,100,range*.6,range*.6,range)`. Le binding natif `583a60` lit uniquement les slots1/2/3, donc les deux derniers scalaires sont ignorés et conservés comme métadonnées. Volume pris en charge ; définition normale limitée à deux coups parce que la table d’entrées ne route pas vers le troisième.
- Aucun `InitAttack1` Sigma n’ajoute AdditionalPower. Le paramètre n’est donc pas ajouté. `SetCritical(1.5,10)` reste une déclaration, sans tirage critique inventé ; un attribut nommé `COUNTER_CRITICAL` n’est pas traité comme `SetAlwaysCritical`.
- Plusieurs contacts empilent Push et Blow. Les deux conditions sont conservées ; le profil arène utilise la dernière déclaration, sans certifier leur composition native.
- L’alternance aérienne locale SN013/SN014 est désormais décodée et raccordée aux entrées acceptées. Le fitting d’animation, trails, suivi/placement des effets, branche répliquée et cycle natif de recréation restent ouverts ; la comparaison visuelle S5Runtime n'est pas effectuée.
- La piste courte sur le drain a identifié les accesseurs du mode acteur (`51ba20/51bae0`, composant `actor+2b8`, booléen `+24`), sans établir sa durée de vie ni un compteur de consommation. Aucune valeur wiki n’est appliquée. Reprise : chaîne d’update de ce composant et changement d’équipement, ou mesure S5Runtime actuelle. La persistance au switch et reset du mode restent une politique S5 explicite.

## Preuves courtes

`node --test tests/sigma-blade-data.test.mjs` : **6/6 passent**. Contrat source, sélection exclusive des contacts, dégâts/conditions/attributs, volumes supportés dans8orientations, vraie horloge commune à30/60/100Hz avec tous les contacts une fois, SHA/fermeture des dépendances, vrais avatars pour2sexes×2formes : repos, huit marches, tous les clips d’action/récupération, retour au repos. Alignement main/dummy après mixer à tolérance3e-5.

`tests/sigma-blade-input.test.mjs` : **7/7 passent**. Frontières strictes, trou d’entrées de transformation, relâchement droit et non répétition de la file ; vrai Controller M/F pour combos normaux/transformés, horodatages des contacts, minimum SP, bascule immédiate, cooldown asymétrique et absence de contact à la désactivation. Ces tests ne remplacent pas l’observation du jeu principal. Les tests d’attache précédents contrôlent les poses échantillonnées ; ils ne certifient pas tous les fondus animés.

Preuves natives : `work/melee-batch-4/sigma-blade/native-input/README.md`, `work/melee-batch-4/sigma-contact-mode-native/README.md`, `work/melee-batch-4/sigma-cylinder-native/README.md`. Préparation reproductible : `extract_current.py`, `build_contract.py`, `build_runtime.py`, `stage.mjs` dans le dossier Sigma. Les vérifications visuelles et les régressions/build partagés restent sous la responsabilité de l’intégrateur.

## Raccordement principal et observations du lot4

Sigma est sélectionnable dans le menu et l'inventaire. L'avatar charge les deux
modèles et ne montre que la forme courante après le mixer. Le contrôleur et
le graphe consomment les idles/marches propres à chaque forme ; transformation,
contacts, effets et sons sont raccordés. Les quatre tests gameplay vérifient
chargement par défaut, attache après mixer, M/F×8directions dans les deux formes,
combos natifs accessibles, SP/cooldown, contacts et changement d'arme.

Observations principales : male normal idle DC000, female transformed idle
DC019, female normal attack DC001 avec un contact (97.5PV), male transformation
DC007 avec bascule immédiate (93.75PV), female normal front DC029 et male
transformed left-back DC027. Aucun message d'erreur navigateur sur ces deux
dernières marches. Captures
dans `work/melee-batch-4/visual/sigma-*`. La capture female normal combo à1.25s
montre le retour au repos après les coups (80PV), pas une phase d'attaque.
Ces contrôles ne certifient pas l'angle de prise ni une comparaison visuelle S5Runtime.
Les régressions ciblées du lot4 incluent Sigma ; build partagé réussi. Drain SP,
sortie automatique, persistance de mode et fidélité native restent ouverts.

## Polishing audio du lot5

Voix Lua manquantes raccordées par `sigmaBladeSoundCues`, avec sélection
exclusive normale/transformée et M/F décodée dans le binaire courant.
Le déclenchement utilise maintenant la borne native stricte (après l'heure,
pas à l'égalité), sans doubler la voix générique à l'entrée. **28 tests
Sigma/audio et 33 régressions passent ; build réussi**.
[Code, fonctions natives et limites](../../work/melee-batch-5/sigma-sound-native.md).
Cela ne constitue pas une écoute comparative S5Runtime et ne résout pas la
spatialisation au bone ni le booléen final du son porté par AddSequence.

## Polishing aérien du lot5

La classe native initialisée pour le type38 dans l'état45 alterne les slots
FIRST/SECOND à l'entrée : SN013 puis SN014. Historique d'acteur raccordé,
clics ignorés et attaques au sol sans consommation, switch et reset contrôlés.
M/F × deux formes × huit caps, contact inchangé à200ms par attaque.
**72 régressions passent ; build réussi**.
[Chaîne native, code et limites](../../work/melee-batch-5/sigma-air-alternation.md).
Observation du jeu principal : second coup SN014 affiché pour M/F, premier
coup féminin SN013 avec une pose distincte ; captures dans la preuve liée.
Formes transformées et huit caps vérifiés ici par les tests, pas visuellement.
# Déplacement aérien — 4 octobre 2026

Correction raccordée depuis la classe native Spy utilisée par Sigma :
pendant l'action en l'air, mouvement direct avec les deux contributions
`actor_speed × 0.5 × (1 + jump_move_rate)` dans S5, sans accélération générique ni
pénalité latérale. Arrêt/inversion au tick suivant vérifiés ; M/F, deux
formes et huit directions couverts numériquement. 62/62 régressions,
build réussi. Preuves et limites :
`work/melee-batch-5/sigma-air-physics.md`.
Rectification : S5Runtime utilise51dae0 pour le déplacement supérieur et51e090
pour celui du bas. Leur égalité actuelle dans S5 est provisoire ; la vitesse
native totale n'est pas certifiée. Le binding de la seconde clé reste à établir.
Observation dans le jeu principal M/F : déplacement, arrêt, inversion et
réception sans direction maintenue, huit captures et relevés DOM dans
`work/melee-batch-5/sigma-air-steer-visual.md`. Build du scénario réussi.
Réception native, phase DELAY vide, effets indirects sur la gravité et
forme transformée mobile restent non certifiés. Gate inchangé.

## Fin de l'aérien — 4 octobre 2026

Récupération de0ms conservée comme phase réelle : dépassement strict de550,
sortie au tick positif suivant. Le paramètre DELAY vide n'applique pas de
nouveau clip ; S5 conserve le curseur du coup. Le déplacement du dernier
tick d'action est conservé avant sa transition. 114/114 régressions,
build réussi et observations M/F à560/570ms dans le jeu principal.
Preuves et limites : `work/melee-batch-5/sigma-air-clock.md`.
Fitting général, canaux inférieurs et gravité indirecte restent non certifiés.

## État inférieur aérien — rectification du 4 octobre 2026

GetLowerPartStateSet renvoie le conteneur. GetWalkAnimParam règle son
enfant sol ; GetJumpAnimParam règle un autre enfant à+3c. Les DD005–012
et A0024 du Lua aérien Sigma sont donc des paramètres **sol**, pas des
clips inférieurs aériens. L'enfant aérien conserve les quatre paramètres
natifs00000/00001/00002/00003. **La commande Spy masque ensuite le
childId et sélectionne le sol : les jambes de marche en l'air ne sont
donc pas un écart prouvé.** Le diagnostic initial est rectifié. La vitesse
de marche et les horloges restent à raccorder ; ne pas déclarer le rendu fidèle.
Preuve reproductible : `work/melee-batch-5/sigma-air-lower-contract.md`.
Adaptateur de transitions livré : `src/native-lower-air-state.js`, entrées
natives explicites et événements à consommer. Trois tests propres passent,
10/10 avec les régressions Sigma aériennes. Le raccordement Controller/
MotionGraph n'est pas justifié pour cet enfant aérien après la preuve
de la commande Spy complète. Port de commande livré dans
`src/native-lower-command.js`, trois tests propres supplémentaires.
La prochaine correction concerne62bd80/62b710 et la clé de vitesse15f4698.

## Vitesse inférieure raccordée — 4 octobre 2026

Clé15f4698 identifiée : parse_string id17, attack_move_speed_rate, archive
actuelle réextraite et CRC vérifié. Le sampler de marche utilise maintenant
le rapport natif1100/915 au lieu du fitting800ms. Controller distingue la
vitesse ordinaire du haut et la vitesse d'attaque du bas, avec coefficients
directionnels sur cette seule contribution inférieure. Pour l'acteur standard
FREE :6.93 avant,6.765 latéral/diagonales,6.6 arrière.
83 tests ciblés et150 régressions passent, build réussi ; quatre captures
du jeu principal M/F avec déplacement/inversion. Voir
`work/melee-batch-5/sigma-lower-speed.md` et ses relevés DOM.
Les mentions « clé inconnue/égalité provisoire » ci-dessus décrivent le
diagnostic antérieur, désormais remplacé pour l'acteur standard sans buffs.
Repos inférieur, reset/blend, réception, mouvement après atterrissage et
branches buffs/rôles restent non certifiés ; gate inchangé.

## Réception pendant l'aérien — 4 octobre 2026

Repos inférieur vérifié : durée copiée0, vitesse Lua1 conservée. Retrait
du filtre !grounded sur le mouvement de la phase action : après réception,
le tick natif garde les contributions supérieure/inférieure.78 tests passent
avec M/F × deux formes × huit directions sur un vrai sol collisionné,
arrêt/inversion au sol, contact et switch ; build réussi. Observations du
jeu principal M/F à500ms avec direction maintenue, vitesse6.765 et DD009.
Preuve : `work/melee-batch-5/sigma-idle-landing.md`.
La sortie/récupération, la remise à zéro de vitesse, reset/blend et buffs
restent à vérifier ; aucun statut prêt revendiqué.

## Vitesse à l'entrée en récupération — 4 octobre 2026

Remise à zéro locale XYZ vérifiée dans Spy5DE490 : vecteur temporaire0
construit par100AD10/52F590 puis copié dans actor+F0 par578580.
Raccordée à Sigma aérien, avec dernière translation directe conservée
séparément et soumise aux collisions.96 tests passent, build réussi,
M/F observés dans le jeu principal à560ms : récupération0, vitesseXYZ0.
Preuve : `work/melee-batch-5/sigma-recovery-velocity.md`.
La mention précédente de reset inconnu est remplacée pour ce chemin local.
Ordre natif de gravité et mapping inférieur en récupération restent à établir ;
reset/blend, buffs/rôles et acteurs distants non certifiés. Gate inchangé.

## Clip inférieur pendant la récupération — 4 octobre 2026

Le mapping inférieur de ce chemin local est maintenant établi : le dernier
tick d'action sélectionne sa phase depuis la commande, puis62B6F0 désactive
l'état sans changer cette phase ni remplacer le clip. Le reset de vitesse
ne doit donc pas forcer A0024. Raccordement corrigé via une pose inférieure
mémorisée par la simulation, conservée en récupération.98 tests passent,
dont M/F × deux formes × huit caps, inversion/libération et continuité de
l'horloge sur les vrais avatars. Build réussi, M/F observés à560ms dans
le jeu principal : vitesseXYZ0 et DD009 conservé, supérieur SN013.
Preuve : `work/melee-batch-5/sigma-recovery-lower.md`.
Remplace l'incertitude précédente sur ce mapping local de récupération.
Ordre natif de gravité, reset/blend, buffs/rôles, child spécial et acteurs
distants restent hors preuve ; aucun statut prêt revendiqué.

