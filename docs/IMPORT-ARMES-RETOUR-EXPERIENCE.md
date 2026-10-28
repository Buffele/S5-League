# Import des armes — procédure et retours d’expérience Air Gun, Smash Rifle et Revolver

## Une flamme permanente doit être indépendante des attaques — 28 octobre 2026

Une nouvelle variante F ajoute le feu à l'arme sans remplacer les séquences,
traînées, sons et contacts d'origine. Le mode permanent ne doit pas simuler une
attaque pour rester actif : couche et horloge séparées, sélection partagée,
nettoyage pour arme non équipée/avatar masqué/mort/laboratoire. Ne pas empiler
deux enveloppes pendant le maintien Counter/Plasma.

Le skin Iron Boots contient aussi des surfaces de jambes. Même un bon nom
de mesh ne suffit donc pas : sélectionner les triangles pondérés Foot/Toe0 et
masquer aussi la surface incandescente selon ces poids. Sinon la flamme peut
être au bon pied tout en éclairant les vêtements. Rapport groupé :
`work/weapon-flames-all-20261028/README.md`.

## Une aura de maintien doit rester attachée à l'arme — 27 octobre 2026

Les premiers filaments puis quads de flamme laissaient leurs racines en monde :
pendant le mouvement de charge, ils devenaient des formes translucides éparses
autour du personnage. Même attachés aux sommets, ces petits plans restaient
des ornements ; l'utilisateur demande que **l'arme elle-même brûle**. Cette
approche est remplacée par un champ3D de distance aux vrais triangles, du feu
continu autour de toute la surface et une matière incandescente partageant le
même bruit. Les volumes suivent chaque mesh après mixer, jusque dans le
fondu de sortie ; aucune particule de flamme détachée. Un shader auto-éclairé ne reçoit pas
les ombres : durcir les ombres du décor ne corrigerait pas cette matière.

Ne pas confondre l'aura ajoutée avec le déploiement OG Counter : ce dernier
reste présent pour les trois styles. Taille/intensité doivent pouvoir être
réglées sans réinitialiser ses événements ni son audio. Contrôles partagés
inventaire/Échap/paramètres ; rapport `work/counter-effects-menu-20261027/README.md`.

## Annulation d'esquive et direction longitudinale — 27 octobre 2026

La restriction demandée sur Espace seul ne doit pas bloquer S + Espace quand
Q/D reste maintenu. Distinguer la demande longitudinale de la répétition du
saut latéral ; conserver aussi la sortie avant/sprint déjà couverte. Garder
la vitesse verticale existante en l'air et les droits de walljump inchangés.
Les fusions manette/tactile doivent préserver un vrai relâchement suivi d'une
nouvelle pression entre deux étapes, sans l'inventer quand une autre source
maintient la direction. Cas utilisateur et474contrôles groupés :
`work/weapon-polish-20261025/dodge-backward-cancel/README.md`.

## Un modèle d'effet peut être une partie essentielle de l'attaque —27octobre2026

Le masquage global des modèles lors d'une variante avait supprimé le double
déployé du clic maintenu Counter. Les particules et l'audio présents ne
compensaient pas cette perte. La politique de remplacement est désormais
explicite : le modèle Counter upper02 reste déclenché à250ms ; les nouvelles
familles conservent leurs chaînes, lames projetées, transformation, charges et
impacts. Seul un composant ayant une substitution définie doit être masqué.

L'utilisateur exige aussi trois effets propres à chaque arme : la même base
ruban/échos/filets avec d'autres couleurs ne suffit pas. Les neuf nouvelles
familles disposent de27motifs distincts, testés par leur géométrie et observés
dans la scène principale. Les bounds de la Scythe englobent le manche : son
Line01 localise la lame. Breaker emploie son socket de tête qualifié ; Boots
les sommets Foot/Toe0 réellement skinnés. Preuves :
`work/melee-art-expansion-20261027/README.md`.

## Variantes visuelles et retours d'impact —26octobre2026

Changer l'habillage d'une attaque ne doit pas couper sa voie de contact ni
son audio. Le premier raccordement des variantes pouvait masquer aussi les
étincelles de la séquence d'origine. Les alternatives gardent maintenant les
particules source ; seuls les anciens modèles d'attaque sont masqués quand
une variante est choisie. Les impacts conservent leur point réel et leur son,
avec le complément visuel artistique demandé.

Ne pas déduire un son manquant depuis un événement arbitraire : SpyDaggerStab
porte SetPlaySound(false) sur les contacts1/3, tandis que le contact2 émet
spydagger_poke_hit. Tester la clé sur le bon contact. Dans une page QA sans
geste, vérifier ensuite le décodage et une vraie source WebAudio active ; un
appel play sur un contexte fermé ne suffit pas à prouver la lecture.

Une phase de récupération peut commencer avant l'événement d'impact aérien.
Arrêter le ruban à la sortie d'action ne doit pas supprimer l'impulsion au
sol qui suit : conserver le seuil de frappe et vérifier un vrai sol atteint.
Pour la garde Counter, le plan de l'acteur ne remplace pas le plan de la
protection évaluée : les premières plaques restaient visuellement dans le
modèle, bien que leurs matrices soient finies.

Enfin, l'inventaire peut être caché par un parent ajouté après l'installation
de son observateur. Après rechargement, observer la révélation de ces parents
pour synchroniser les sélecteurs sans exiger un nouvel événement d'équipement.
Preuves et687contrôles couverts : work/weapon-effect-variants-20261026/README.md.

## Effacer l'entrée ne termine pas l'action — 26 octobre 2026

F2 appelait controls.cancelAttacks mais conservait controller.attack. Les deux
handles de charge restaient actifs pendant l'aperçu et l'action pouvait reprendre
à sa fermeture. Le changement de présentation annule désormais l'action locale
par le chemin de combat existant, ou son nettoyage explicite en exploration.
Les effets d'un autre acteur ne sont pas effacés ; le personnage n'est pas
reset. Deux cas réels Katana/charge, avec et sans propriétaire combat, échouent
avant et passent après. Régressions/cycle de protection dans
`animation-lab-melee-exit` ; les quinze échecs indépendants de la suite d'entrée
sont reproduits sans le changement et ne sont pas annoncés réussis.

## Préparer le brouillard de la carte — 26 octobre 2026

Twin, Sigma et Demonic forçaient fog=false et un seul préchauffage par renderer.
Le producteur XML commun prouve FogEnable=true pour leurs bindings. Le matériau
hérite maintenant du brouillard de la scène ; le helper partagé garde une
préparation distincte none/linear/exp2, sans toucher aux historiques et avec
reprise après compilation échouée. Les anciens montages VM ont reçu le port
art séparé nullable manquant ; les assertions Twin suivent le brouillard source
en gardant les contrôles de publication/nettoyage. Preuve statique authentifiée
sur dix fonctions/six bindings : `melee-trail-fog`. Paramètres et pixels natifs
restent distincts de cette preuve de FogEnable.

## Deux exemplaires globaux ne couvrent pas trois porteurs — 26 octobre 2026

Le cache préparait deux instances de chaque séquence, puis en construisait
pendant le coup au-delà. Trois spéciales Scythe déclarent six appels de la
même séquence : la préparation antérieure doit donc s'étendre au combat.
L'entrée réserve désormais les deux activations existantes par participant
et attend le préchauffage des exemplaires ajoutés. La capacité est conservée
et propagée aux familles ajoutées plus tard. Les rafales supérieures gardent
l'extension existante pour préserver les effets ; aucun gain de FPS global
n'est déduit de la seule absence de construction sur le burst testé.
Lot `melee-participant-effect-reserve`, 29 contrôles groupés.

## Recaler un émetteur ne corrige pas ses particules déjà nées — 26 octobre 2026

Le combat avançait les particules avant la nouvelle pose. Le recalage suivant
corrigeait leur émetteur mais laissait les nouvelles particules monde à l'ancien
socket. Pour les séquences suivies du chantier, calculer le nombre à émettre
pendant l'update puis effectuer la naissance après le mixer du propriétaire.
Conserver la trajectoire des particules antérieures ; consommer la réservation
une seule fois et l'effacer à l'annulation/réutilisation. Les pauses restent
immédiates et les recalages de rendu ne consomment pas cette réservation.
Contrôles avec les vrais runtimes Training/Chaser/Battle Royal, un personnage
sélectionné : `melee-post-pose-emission`. Espaces source et gates conservés.

## Déclencher chaque effet après la pose de son propriétaire — 26 octobre 2026

En Chaser et Battle Royal, les cues pouvaient lire la pose précédente avant
que le mixer de l'acteur soit évalué. Une fois l'effet figé déclenché, le
passage ultérieur ne le corrigeait pas. Le joueur reste pris en charge après
sa pose dans `animateAvatar` et chaque adversaire est déclenché après sa
propre pose. Les tests utilisent des avatars et le répartiteur réels, avec une
fabrique d'effets simulée pour mesurer la matrice. Cela ne prouve pas encore
la fidélité visuelle des effets. Voir `multi-combat-effect-pose`.

## Un alias de coup peut garder un index de combo différent — 26 octobre 2026

Le fort Twin réutilise le premier profil et son attribut ATTACK1, mais le
sélecteur audio lisait l'index sans tenir compte du type d'action. Sélectionner
le son depuis le profil effectivement utilisé, plutôt que déduire un second
coup de l'index seul. Le contrôle commun compare les attributs et les silences
aux sources authentifiées ; les variantes de données non atteignables ne sont
pas présentées comme des gestes observés. Voir `melee-activation-audio-audit`.

## Un échec audio transitoire ne doit pas empoisonner le cache — 26 octobre 2026

Une requête ou un décodage audio en échec restait mémorisé pour le contexte
entier, et la banque conservait son premier lot terminé. Une préparation
ultérieure ne pouvait donc pas récupérer le son. Retirer seulement la promesse
échouée et recharger seulement les clés encore absentes ; garder les buffers
réussis et fusionner les demandes simultanées. Aucun chargement n'est lancé
par une frappe. Voir `weapon-audio-retry`.

## Les sons de volume sont séparés des sons d'état — 26 octobre 2026

Demonic déclarait des voix et un son aérien dans ses états, mais aussi
`bsword_s` dans trois attributs de contact. Neutraliser tous les sons de volume
parce que les sons d'état sont raccordés fait disparaître cette couche.
Lire `SetAttackSequence` dans le script d'attributs effectif, ici un script
appelé depuis l'indexeur, et respecter les chaînes vides. Les sons de volume,
de contact et de voix restent indépendants. Voir `demonic-activation-audio`.

## Un coup reçu sans nouvelle réaction doit garder son impact — 26 octobre 2026

La réception pouvait accepter les PV et conserver la réaction de la cible,
puis sortir avant de présenter l'effet de mêlée. La protection Demonic pendant
une réaction en fournit un cas réel. Présenter le composant d'impact même si
l'état et le mouvement restent inchangés ; ne pas ajouter de pause, d'impulsion
ou de voix de réaction. Les projectiles conservent leur propre présentation.
Preuve : `work/weapon-polish-20261025/melee-retained-impact/README.md`.

## Une normale de sol ne se réduit pas à un angle horizontal — 26 octobre 2026

Les impacts de décor utilisaient atan2 sur X/Z : pour un sol horizontal,
cette valeur n'encode aucune inclinaison. Le raccordement des armes non
validées conserve l'axe local -Z déjà utilisé pour les murs et l'aligne sur
la normale 3D au contact, sans déplacer le point ni modifier les particules
déjà émises. Le repère natif propre à chaque effet et la géométrie exacte des
sondes ne sont pas établis par ce choix. Voir `melee-surface-orientation`.

## Un modèle peut rester figé alors que les particules suivent la main — 26 octobre 2026

Le secondaire Demonic suivait déjà la main pour 13 émetteurs, mais son loader
séparé conservait un modèle plat. Les deux dummies du SCN portent pourtant des
pistes de mouvement et d'échelle importantes. Rétablir leur hiérarchie interne
sans changer la racine externe, les ancrages des particules ou leurs horloges.
Le pack et le manifeste concordent ; contrôle regroupé et preuve dans
`melee-secondary-hierarchy`.

## Un modèle transparent peut rester un masque de profondeur — 26 octobre 2026

Vital/Iron dash et quatre couches Scythe avaient alpha0 avec depthWrite actif.
Changer opacity ne supprimait pas leur dessin. La garde ModelData doit agir
sur la soumission du matériau, sans couper le nœud animé ou ses enfants.
L'égalité exacte à zéro ne couvre pas les résidus d'interpolation : réutiliser
le seuil source partagé. Conserver les matériaux réels pendant compileAsync ;
Three prépare aussi les matériaux invisibles et leur programme reste associé
à leur identité. Lot `melee-zero-draw-batch`, 54 contrôles et un build.

## Un seuil d'événement n'est pas une simple égalité — 26 octobre 2026

Le consommateur commun franchit strictement le seuil, pour les sons comme
pour les séquences d'état qualifiées. Utiliser une seule unité par dispatcher,
avec conversion explicite si seuls les temps en secondes sont disponibles.
Une horloge absente ne doit pas rendre une comparaison fausse et ainsi lancer
tous les effets futurs. Conserver l'identité de chaque déclaration : deux
appels source identiques ne sont pas automatiquement un doublon à supprimer.
Lot `melee-event-clock-batch`, 68 contrôles groupés et un build.

## Qualifier le suivi externe sans écraser les parents internes — 26 octobre 2026

Les racines des deux griffures Demonic et du porteur aérien suivent la scène
évaluée de leur acteur, contrairement au secondaire. Les actions aériennes
parentées au dummy restent internes. Exiger l'identité du parent, pas son seul
nom ; conserver les matrices brutes et séparer stabilité de lecture et preuve
de rendu. L'hypothèse initiale « toute matrice interne égale celle du parent »
était trop forte : les phases d'initialisation/dessin restent à qualifier.
Ne pas transformer une séquence non capturée sur une autre arme en preuve
d'absence ni lui appliquer ce suivi par analogie. Lot `melee-root-follow-batch`.

## Le nom d’un ModelData n’est pas son identité — 25 octobre 2026

Les12couches équipées Sigma homonymes étaient écrasées dans un Map : leurs
positions/rotations distinctes devenaient celles du dernier modèle. Pour ces
feuilles rigides qualifiées, conserver une clé par objet/index, leurs propres
pistes et un bone interne par pièce. Les noms publics restent ceux des assets.
Refuser un parent ou un poids qui rendrait le nom ambigu plutôt que choisir
premier/dernier. Le renderer doit reconnaître l’attache par objet avant son
transform résiduel, sinon la pose s’applique deux fois. Publier les matrices
après mixer avant de mesurer, comme le renderer réel. Preuves : lot
`sigma-equipped-model-indices` et sa série finale commune avec Scythe.

## Piste vide sérialisée et objet de clés vide sont distincts — 25 octobre 2026

Le reader SCN count0 renvoie NULL : aucune entrée Visibility n'est créée pour
les GR de l'auxiliaire Scythe. La sélection réutilise son premier succès, ici
BASE alpha0 après l'initialisation du SCN. Le sampler d'un véritable objet
FloatKeyData vide retournerait1, mais cet objet n'existe pas dans ce parcours.
Qualifier séparément reader, insertion, sélection et sample avant de fabriquer
un défaut. Masquer le dessin local du modèle ne doit pas masquer son enfant
ni arrêter ses transformations. Preuves : lot `scythe-equipped-visibility`.

## Capturer les paramètres ensemble, séparer les acteurs — 25 octobre2026

Le même lecteur borné peut couvrir les132 entiers et159 floats déjà authentifiés,
sans ajouter de pointeur ni d'appel cible. Cela évite les relances par index.
Le nouveau Float60 vaut2,5, pas le2,3 historique : garder les observations datées.
Ces constantes ne remplacent pas la gravité/limite propres à chaque acteur.

Dans le chemin lourd170, actor+FC est F0.Y ; le facteur de déplacement agit
sur XYZ et se choisit avant l'incrément du timer. Dans le chemin reçu171, une
rotation globaleX et une réflexion produisent un déplacement supplémentaire ;
ce n'est pas le gel StaySky500ms de l'attaquant. Garder ces calculs séparés et
exiger leurs entrées. Un getter réécrit exige une preuve complète de variante :
la copie bootstrap14octets retrouvée ne suffit pas à expliquer les NOP adjacents.
Preuves : `work/melee-pvp-comparison-20261017/capture-expansion-v2/scythe-victim-kernels-20261025/REPORT.md`.

## Un modèle opaque peut être masqué par son animation — 25 octobre 2026

Les lames Twin tenues devaient disparaître pendant SG012/SG014 ; leurs alpha0
étaient perdus à l'import. ModelDataDraw teste le produit des alphas avant de
lire les propriétés du matériau. Ne pas réserver les courbes alpha aux seuls
modèles transparents. Pour ce cas binaire, le mixer conserve les valeurs source
et une garde post-pose évite de modifier les mélanges/alpha-tests du matériau
ou de voler mesh.visible aux autres présentations. Respecter le retour alpha1.
Preuves statiques et raccordement : lot `equipped-binary-opacity`.

## Le bon mélange ne remplace pas les courbes alpha — 25 octobre 2026

Sigma avait ses matériaux additifs, mais ses 15 couches équipées restaient à
opacité1. Les courbes floatKeys avaient disparu de la conversion d'équipement.
Les récupérer dans un complément authentifié et les binder au mixer existant,
par index de modèle, sans créer un tick indépendant ni allonger les clips.
Le clip borne parfois le temps demandé : comparer à son vrai temps évalué,
pas seulement au paramètre du scénario. Les homonymes restent indépendants.
Preuves : `work/weapon-polish-20261025/equipped-opacity/README.md`.

## Une exception d'attaque n'exclut pas toute une famille — 25 octobre2026

Blow16 utilise deux exceptions Death Scythe différentes :170 à l'entrée et171
pendant le Tick. Le troisième léger173 évite les deux et peut utiliser le cycle
commun. Exiger un contact source résolu ; un index hors plage ne devient pas
qualifié simplement parce que son attribut manque.

Le type42 est lu sur l'équipement courant de l'acteur source du dernier dommage,
pas sur la victime ni sur un tag d'attaque conservé.6054E0 modifie un timer de
physique de la victime ; le confondre avec l'UpperCut de l'attaquant ferait
perdre des facteurs de gravité/déplacement. Bloquer le seul chemin inconnu,
enregistrer sa condition de reprise et conserver les corrections établies.
Preuves : `work/melee-pvp-comparison-20261017/capture-expansion-v2/scythe-ordinary-blow-20261025/REPORT.md`.

## Sans éclairage ne signifie pas transparent — 25 octobre 2026

Les 26 inserts Demonic déclarés renderState1 étaient éclairés comme le métal.
Le correctif qualifie ces pièces depuis les deux SCN authentifiés, sans
inventer du mélange additif. Un solide sans éclairage garde ses ombres et son
contour : la politique d'overlay ne s'applique qu'aux couches transparentes.
Le corps du personnage et les pièces non qualifiées gardent leur matériau.
Preuves : `work/weapon-polish-20261025/demonic-equipped-materials/README.md`.

## Deux scènes proches exigent leurs propres pistes — 25 octobre 2026

La chaîne aérienne Twin partage la structure du lourd, mais pas ses helpers :
Box02/Box01 et clip `base`, contre Box02/Box06 et `BASE`. Ses quatre ModelData
sans sommets ont aussi d'autres noms. Qualifier chaque profil contre son SCN
et son graphe actif ; ne pas copier les attentes d'une variante dans l'autre.
Six graphes aériens confirment le suivi de racine après le saut. Le test groupé
couvre maintenant les deux profils, y compris la sélection du complément.
Preuves : `work/weapon-polish-20261025/twin-air-chain/README.md`.

## Projection : séparer phases, physique et durée du relevé — 25 octobre2026

Blow16 n'est pas un verrou universel de1,2s : son début dépend du clip, son
milieu du mode physique, sa fin a un timer1000ms, puis viennent Down et Standup.
Leur durée S32[88] a été lue1000 dans la session réservée17, sans certifier
les timers copiés de tous les acteurs. Un contact S5 après move est une entrée
explicite du raccord, pas une mesure implicite du mode natif114.

Préserver les arrondis source : float32(3840)/float32(4,8) tronque à799ms,
pas800. Le relevé doit ajuster le clip à la durée demandée via le helper commun.
Donner aussi les intentions de relevé aux adversaires verrouillés. Si l'horloge
avance pendant le hit-stop, recaler leur curseur comme celui du joueur ; ne pas
réutiliser un ancien contact sol. Le Push indépendant peut continuer pendant
cette pause, même si la physique de projection est arrêtée.

Preuves et limites : `work/melee-pvp-comparison-20261017/capture-expansion-v2/blow-lifecycle-integration-20261025/REPORT.md`.

## Une entrée native n'est pas un numéro d'état — 25 octobre2026

Blow demande l'entrée47 via currentState.virtual34 ; la configuration Damage18
la résout vers le vrai Blow16. Push Enter initialise uniquement sa direction et
son horloge. Ne pas déduire «dernier type de condition = dernier état», ni
supprimer Blow(0,0) : il garde ses opérations d'état et peut effacer une vitesse.
La réception ordinaire précède ici l'admission des conditions. Chaque condition
reste indépendante, sous ses gardes et les substitutions du commit.

Le gate de518E20 lit MP/SP, pas HP ; actor+6C n'est pas une preuve de décès.
Pour Blow16, propriété2 est initialisée0 ; SetSpendSp désigne propriété3 et
n'est pas interchangeable. Enfin, les modificateurs Blow164/25C/165 ne sont pas
qualifiés par une lecture Push162/166. La durée/phases de Blow reste un sujet
distinct du simple port de vecteur et de la durée DamageData.
Preuves : `work/melee-pvp-comparison-20261017/capture-expansion-v2/iron-boots-mixed-condition-20261025/REPORT.md`.

## Effet articulé : conserver les nœuds invisibles et les poids — 25 octobre2026

La chaîne Twin n'était pas un simple modèle d'effet rigide. Deux meshes ont
six liaisons de skin chacun, et six ModelData invisibles portent des repères
animés : quatre sans sommets et deux dont la texture vide avait provoqué le
filtrage. Les ignorer casse l'animation même si les modèles visibles existent.
Restaurer leurs pistes depuis le SCN authentifié, préserver les indices source,
puis animer les bones et binder les poids/inverses ; ne pas inventer des axes.

Pour ce seul chain_test, une seconde résolution des noms sur le graphe complet
reproduit les parents natifs observés et leur ordre. C'est une reconstruction
qualifiée par les captures, pas une preuve du code de clonage universel.
Le premier Bone09 final est différent du premier Bone09 sérialisé. Les index
restent internes ; ne pas renommer les ressources visibles pour contourner cela.

Chaque copie du pool doit rebinder son propre squelette à ses propres os.
Un clone de SkinnedMesh peut conserver un squelette partagé silencieusement.
La préparation GPU doit aussi conserver le type SkinnedMesh : un proxy Mesh
simple compile uniquement le shader rigide et laisse le skinning au premier coup.
Preuves : `work/weapon-polish-20261025/twin-chain-node-mapping/README.md`.

## Suivre le conteneur personnage demande sa matrice, pas seulement sa position — 25 octobre2026

Les graphes actifs Twin lourd, Sigma fort et Scythe première spéciale montrent
leur racine égale à la racine SCN du personnage, avec échelle1.3 et déplacement
réel. S5 gardait une origine figée et une échelle d'effet générique. Le mode
qualifié actorSceneRoot utilise maintenant avatar.rig.matrixWorld après mixer
et présentation ; il reste distinct d'un os animé, d'un socket d'arme et d'une
normale de surface. Ne pas remplacer ce parent par Bip01.

Un lien de parent seul n'est pas une preuve d'héritage actif : Twin montre une
pose identité à0ms avant ses premiers updates positifs. Garder cette limite,
mesurer des poses stables et ne pas généraliser aux autres séquences. Le
recalage rafraîchit les ancres sans réécrire les positions des particules,
avancer l'horloge ou émettre une seconde fois. Preuves : lot `melee-actor-scene-follow`.

## Le modèle d'arme peut contenir des effets permanents — 25 octobre2026

Les couches lumineuses ne sont pas toutes dans des SEQ. Vital Shock embarque
une couche additive et une couche alpha sur ses doigts ; l'importeur d'avatar
les rendait comme de la géométrie opaque. Ses13pièces nolight recevaient aussi
l'éclairage toon. Lire renderState dans le SCN authentifié puis qualifier
l'usage du matériau source sur la famille : ne pas inférer les flags des noms
et ne pas modifier les textures pour masquer une erreur de shader.

Les overlays ne participent pas aux ombres ni au masque d'encre selon la
politique de présentation existante des équipements ; les solides et le corps
gardent leurs rôles séparés. Préserver aussi les poids et l'animation pendant
le changement de matériau. Test après mixer sur le personnage sélectionné,
repos/huit déplacements/attaques ; régressions des familles déjà qualifiées.
Preuves : `work/weapon-polish-20261025/vital-equipment-materials/README.md`.

## Sons d'état, volumes et impacts sont trois horloges — 25 octobre2026

Le contact acteur et le contact décor peuvent aussi différer au sein d'un
même SetDamageSequence : Bat aérien demande bat_hit1 puis bat_hit. Respecter
damageObjectSound quand ce champ est explicite, même s'il vaut null ; sa
présence n'autorise pas un fallback vers le son acteur. L'audit partagé lit
les déclarations actives et leurs quatre arguments (deux séquences/deux sons),
applique séparément les silences de volume et nomme les alias de ressources.
Ne pas transformer des attributs commentés en entrées vérifiées ni supposer
que tous sont déclarés dans attackattribindexer : Demonic les définit dans
son propre script. Preuve : lot `melee-contact-presentation`,43combinaisons
contrôlées et6attributs Vital explicitement hors déclaration active.

Le son d'un AddSequence sans cible ne doit pas être déclenché par chaque hit.
Twin lourd/aérien et les rotations Bat jouaient trop tard ou plusieurs fois.
Conserver séparément SetAttackSequence à l'activation des volumes et
SetDamageSequence au contact confirmé, acteur comme décor. La recherche
initiale Twin n'avait pas fermé les dépendances de l'attribut spark_hit :
un son existant et authentifié était donc silencieux malgré le texte source.
Ne pas déduire non plus un son de charge du nom d'un fichier disponible :
le catalogue Twin actuel laisse ses champs de charge vides.

Une séquence visuelle absente n'annule pas son argument sonore indépendant :
sword_power300ms sur Bat/Breaker est maintenant raccordé sans VFX substitué.
Tester de vrais cycles Controller et des contacts confirmés ; conserver
distinctes la preuve de dispatch WebAudio et une écoute comparative native.
Preuves : `work/weapon-polish-20261025/melee-audio-events/README.md`.

## Un nom de parent peut désigner le conteneur — 25 octobre2026

Vérifier aussi le graphe réellement produit par S5 avant d'annoncer «déjà
plat». Sigma n'avait pas d'os omis, mais son pré-raccordement attachait11des
12maillages au dernier homonyme. Leurs pistes locales étaient ensuite
réévaluées sous le mauvais parent. Le profil qualifié et son alias d'en-tête
corrigent ce cas pour le joueur et les copies réutilisées. Un test rejoue la
topologie native capturée et mesure les sommets contre les pistes indépendantes,
au lieu de constater seulement que chaque maillage existe.
Preuves : `work/weapon-polish-20261025/sigma-power-hierarchy/README.md`.

Ne pas déduire une ambiguïté de parent uniquement des noms des modèles.
Le nom d'en-tête SCN peut être identique à plusieurs enfants ; la recherche
native visite le conteneur avant ses enfants. Sigma l'illustre dans son
graphe actif. Les en-têtes authentifiés des deux scènes Death Scythe ont
permis de restaurer leurs dummies sans renommer les ressources source.
Éviter aussi le pré-raccordement générique par nom avant l'évaluateur qualifié :
il créait une boucle mesh→dummy→mesh avant la restauration correcte.
Les copies du pool doivent suivre le même chemin. Les vrais doublons d'os,
comme Twin, restent distincts de ce cas et demandent leur propre preuve.
Lot : `work/weapon-polish-20261025/melee-active-hierarchies/README.md`.

## Le graphe actif peut ajouter un conteneur — 25 octobre2026

Le SCN aérien Bat ne contient qu'un Shape. L'ancien fixture en déduisait une
racine active directe, ce qui rendait le reset de sa pose ambigu. La lecture
des objets actifs a établi Bat → conteneur a0015 identité → Shape chargé →
Ghost identité. Le reset du conteneur n'efface donc pas la pose du Shape enfant.
Le ruban SEQ est maintenant raccordé au joueur et à l'adversaire, avec comparaison
des extrémités à43 poses natives enrichies,31 contrôles groupés et build final.
Sur Breaker, la même observation montre le conteneur sans parent : ne pas
réutiliser une matrice Shape périmée du cache comme preuve d'attache à l'arme.
Preuve, incident de vecteur/list corrigé, capture S5 et limites :
`work/weapon-polish-20261025/bat-aerial-integration/README.md`.

## Annulation tardive et réutilisation du pool — 25 octobre2026

L'ancienne attaque gardait une référence au pool après son nettoyage. Une fois
l'instance réattribuée, sa sortie pouvait couper l'effet du nouvel acteur.
Le runtime vérifie désormais une identité par activation et retire les registres
au nettoyage local/global. Tester les mêmes objets réellement réutilisés, pas
deux faux effets indépendants. Le lot prépare aussi toutes les images d'un
NodeLoader animé avant usage, sans lancer son RNG.47 contrôles groupés et build :
`work/weapon-polish-20261025/effect-pool-lifecycle-batch/README.md`.

## Recalage après la pose affichée — 25 octobre2026

Le suivi de main Demonic était correct si le test posait l'avatar avant le
tick des effets. Le vrai recalage ne traitait pourtant que follow, pas followBones,
et le rendu pouvait encore interpoler la pose après ce point. Le runtime traite
maintenant les os seuls sans déplacer leur racine ; main recale après la dernière
modification de pose, sans tick supplémentaire. Le nouveau test reproduit l'ordre
effets → mixer → interpolation, avec le vrai rig sélectionné et des particules
vivantes. Le même lot prépare les matériaux/textures par proxies, pour conserver
la visibilité du pool pendant deux compilations concurrentes et leurs échecs.
46 contrôles et build réussis, capture principale et limites :
`work/weapon-polish-20261025/effect-presentation-batch/README.md`.

## Traînée préparée dans toutes les routes — 25 octobre2026

La préparation du joueur ne suffit pas à celle du bot : Assassin Claw restait
sur le ruban générique non préparé et ne pouvait pas être choisi comme adversaire.
Le lot claw-main-batch raccorde son adaptateur aux trois routes joueur, au cache
adverse et au préchauffage GPU. Vital Shock rejoint aussi la sélection adverse
avec ses effets/sons existants. La fenêtre Assassin est délai50 + durée350,
pas une fin absolue350.50 contrôles groupés, un build, sélection/combat/retour
salle observés. Le modèle converti sans Line01 impose de conserver explicitement
la limite de géométrie reconstruite. Voir
`work/weapon-polish-20261025/claw-main-batch/README.md`.

## Breaker : effets chargés mais mal ancrés — 25 octobre 2026

Le retour utilisateur a révélé un impact lourd au repère acteur et un effet
aérien détaché de l'arme malgré les tests verts. Les particules du lourd
gardaient -600 en Z, les modèles aériens des pivots éloignés et leurs pistes
alpha n'étaient pas raccordées. Le test d'ordre regardait la pose adverse,
alors que la pose du joueur était exécutée ensuite dans main.

Correction : socket `HM_DMGeffect_Dummy` évalué sur le propriétaire réel,
impact figé sur la surface sous l'arme avec sa normale (aucun choc si le sol
n'est pas touché), aérien suivi, recentrage explicite, courbes de rendu récupérées,
rotation des particules locales et recalage après pose sans double émission.
Le [contrat des effets](CONTRAT-EFFETS-ARMES.md) fixe les règles à réutiliser.
Régression : `tests/breaker-effect-attachment.test.mjs`. Un effet doit être
mesuré contre l'arme/contact attendu puis observé ; sa présence dans une
hiérarchie ne suffit pas. Les limites natives et branches manquantes restent
ouvertes dans la fiche Breaker.

La traînée fournissait un autre faux positif : les tests reproduisaient le
même produit de matrices que le renderer. La paire source correspond aux
coins de la tête du marteau dans le repère du maillage ; une transformation
Shape supplémentaire déplaçait le ruban vers le manche. Le rendu lit le
maillage évalué et le test vérifie désormais les vrais sommets, sur les deux
rigs pendant les actions. Ne pas valider un parent à partir de son seul nom.

Dernière mise à jour : 30 septembre 2026. Référence de travail pour les prochains imports.

## Réactions reçues : séparer phases et durées —25octobre2026

La garde Counter en Deathmatch utilise la réaction19 : total3000ms,
préfixe700ms inclus puis boucle, alors que ses effets déclarent2500ms.
Le précédent switch générique180ms coupait00006. Les timers entiers évitent
de franchir700/3000ms à l'égalité avec les pasQA10ms.14tests ciblés,
125régressions, source et lecture native du registre sont archivés dans
`work/melee-pvp-comparison-20261017/capture-expansion-v2/counter-guard-received-animation-fix-20261025/`.
Pour Stun13, le timer de condition et la durée transmise à l'acteur diffèrent :
distance/modificateurs et coexistence restent à raccorder séparément.
Ne pas confondre un numéro d'attribut avec un état : le record Bound17 désigne
ATTACKATTRIB_BOUND_BLOW, pas une transition vers l'état17.

## Adversaires automatiques et rechargement — 21 octobre2026

Les huit familles à rayons déjà exposées sont sélectionnables pour l'adversaire
de Free training. Maintenir le tir d'un automatique exige de laisser son runtime
gérer la rafale ; un clic isolé ne vérifie pas le cycle. Ne pas relancer le délai
d'attaque de l'AI pendant reload : cela retardait la reprise de Smash Rifle.
Les scénarios doivent exercer un vrai chargeur entier, sa recharge et sa reprise,
et regarder tous les shot.contacts des volées.344tests/build passent, avec les
limites source/navigateur distinctes dans
`work/training-ranged-roster-20261021/DELIVERY.md`.

## Vérifier les rayons définitifs — 21 octobre2026

Un test de rifleContact seul manquait la seconde requête après dispersion.
HMG et Revolver remplaçaient ce contact sans transmettre Shield ; Semi Rifle,
SMG et Smash Rifle étaient écartés faute de profil source. Tester le vrai
resolveRifleShots avec chaque rayon, les sources MAKERAY exactes et le même
record reçu par dégâts/VFX. Pour HMG, Attack est recréé à chaque itération,
pas une variable Lua Attack1..20 ni vingt projectiles simultanés.
Voir `work/shield-ranged-integration-20261021/DELIVERY.md`.

## Recharge : séparer durée demandée et fondu — 21 octobre2026

Lire les opérandes exacts de SetAnim avant de comparer la longueur du clip.
Assault Rifle utilise AS004,2000,500,500 : le clip14800ticks reste ajusté à2s.
HMG utilise F0006,0,1000,0 : la durée0 conserve le clip5s,1000 est un fondu.
La correction HMG ne justifie donc pas de remplacer toutes les durées de
recharge par la longueur brute des assets. Vérification et sources :
`work/parallel-gameplay-reference/armes/heavy-machine-gun/SOURCE-ROTATIONS-20261021.md`.

## Fondus des modèles d'effets — 20 octobre2026

Ne pas lire les champs versionnés +8C/+90 de CActNodeLoader comme des fades :
ce sont TexAnimType/TexAnimDelay. FadeInTime/FadeOutTime sont +84/+88,
confirmés par labels115EFF0, lecteur115F8B0 et consommateur1160160 du PE actuel.
Le fondu de sortie commence **après** end. La courbe alpha du SCN est un canal
supplémentaire : elle peut déjà être à zéro pendant cette queue.
Utiliser `tools/s5runtime-arsenal/node-loader-fades.mjs` dans les générateurs ;
tests source/rendu et réparation documentée dans
`tests/node-loader-fades.test.mjs` et `work/node-loader-fades-20261020/DELIVERY.md`.
Conserver la distinction entre correction depuis le code natif et comparaison
visuelle dans S5Runtime, ainsi que les gates des autres branches d'effets.

## Katana : corrections demandées pendant la reprise du 30 septembre

L'utilisateur conserve le skin classique. Deux défauts ont échappé aux premiers contrôles : fourreau fixé dans le dos au lieu de la hanche, bandes/cadres noirs sur la lame. Les anciens résultats « validé » ne prouvaient pas ces points.

- **Arme équipée et arme rangée sont deux situations différentes.** `weapon_attach.x7`, type 39, scène 0 : `attackAttach="R_Hand_Dummy"`, `idleAttach="Spine_Dummy"`. Le fourreau équipé suit la main au niveau de la hanche, y compris en `NormalState KT004`. `idleAttach` décrit son rangement quand l'arme est déséquipée ; le lire comme l'attache de l'animation de repos avait placé tout le fourreau dans le dos. Scène 1 : lame sur `L_Hand_Dummy`. Vérifier chaque scène et comparer l'emplacement visible : une matrice de dummy identité peut réussir même sous le **mauvais parent**.
- **Respecter les flags de matériaux et les passes de rendu.** Le modèle `light_nocull_alphablend2_nodepthwrite_as uvani` porte `renderState=104` : double face, mélange additif, aucune écriture de profondeur. Un matériau opaque toon dessine le noir du quad. La passe de contours peut ensuite dessiner un cadre noir même avec le bon matériau : marquer les couches lumineuses `excludeInkOutline`, les exclure du masque/depth du contour et restaurer leur visibilité ensuite. Garder le contour de la lame solide. Contrôler avec les contours activés, pendant une attaque et au repos, sur les deux sexes.
- **Ne pas forcer la visibilité des proxies d'un fourreau.** Les pistes de modèles ramènent la lame tenue à une échelle de 0,01 au repos et affichent le double `hideblade` dans le fourreau. Un `mesh.visible=false` permanent retire aussi la poignée rangée. Conserver les échelles natives ; mesurer la pièce réellement déployée, pas un marqueur réduit à 1 %.
- **Séparer vitesse Lua et fitting natif.** Correction du 4 octobre : CAttackStateEx demande 300 ms pour le recul KT006_1. Les 2400 ticks donnent 499 ms après conversion float32/troncature ; le moteur ajuste donc la vitesse à 499/300. Animation et MoveBox suivent ce même curseur. L'ancienne consigne de lire seulement 300 ms à vitesse 1 était une hypothèse erronée, remplacée par `work/melee-batch-5/katana-backdash-speed.md`. `KT006_2` est maintenu non bouclé, puis `KT007`/`KT008` sont déclenchés à la libération dans S5. Routage exact des entrées, fitting charge/libération, SP, charge maximale et volumes critiques restent non certifiés ; ne pas les masquer.
- **Rechercher aussi les extractions sauvegardées hors du dossier de travail.** Les porteurs Katana homme/femme ont été retrouvés dans l'extraction du 23 septembre. SHA bruts conformes et toutes les pistes directes régénérées identiques, après normalisation JSON des zéros signés. `tools/verify-katana-sources.mjs` les vérifie et les copie dans le workspace ; ce succès de provenance ne valide pas le placement en jeu.

Régressions actuelles : `tests/katana-post-mixer.test.mjs` (23 clips, puis plus de 800 ticks de fondus via Controller/MotionGraph/AnimationPlayer par sexe), `tests/katana-gameplay.test.mjs` (huit directions à trois orientations, maintien/libération à 30/60/120 Hz, murs, changement d'arme), `tests/katana-material.test.mjs` (flags et masque de contour), `tests/katana-effects.test.mjs`. Les contrôles numériques de proximité ne constituent pas une comparaison d'angle avec S5Runtime. Captures du jeu principal : `work/katana-restoration/*idle-waist-050.png` et `*secondary-no-black-170.png`.

## Point d’entrée opérationnel

### Rocket Launcher — vitesse, copies natives et maintien,15 octobre2026

Ne pas renommer un argument Lua en durée selon une ancienne fiche :7500 dans
InitStandardRocket est une vitesse,5000 dans RocketInit est le timeout.
Lire aussi le catalogue actuel : capacité1 confirmée dans S5Runtime, alors que
l’ancien export EU avait3. Le secondaire prépare2500ms et lance3 roquettes
pour1munition ; relâché avant la préparation il s’annule sans débit.
Preuves : work/rocket-launcher-recovery/native-states-v1/v2.json.

Une copie d’animation présente dans le SCN n’est pas un alias inventé pour
masquer une piste manquante. Les249 liens du secondaire par sexe sont résolus
vers leurs données exactes, chaînes conservées ; cycles/cibles absentes refusés.
Ne pas les déclarer « directes » pour satisfaire le gate. Les rigs de base ne
contiennent pas RL014 ; utiliser les porteurs bip_*0000 authentifiés.

Conserver les courbes d’asset. Le grip link0 Rocket est traité dans le rig
hiérarchique ; la première correction sur la seule branche aplatie n’avait
aucun effet. Vérifier le chemin réellement emprunté. Poignée→muzzle n’est pas
toujours l’axe du canon ; ici son axe est le−X du dummy, poignée décalée dessous.

Une roquette déjà lancée possède sa durée et son audio indépendamment de
l’arme tenue. Annuler une charge ne doit pas effacer les tirs en vol. Le reset
de partie les efface explicitement ; conserver ammo/réserve au changement.

### Cannonade — route d’attaque et nombres protégés,15 octobre2026

Un binding partagé ne prouve pas que toutes ses branches s’appliquent à l’arme.
InitStandardRocket appartient au Rocket Launcher ; les deux noms de roquette
restent vides dans Cannonade. Celle-ci actualise CExplosionAttack au point visé,
avec délai100ms. Le prototype mobile60unités/s est supprimé. La récupération
500ms de l’état doit rester distincte du fitting SetAnim1500ms.
Preuves : native-engine-v3.json, engine-comparison.json dans work/cannonade-recovery/.

Le wrapper de classe13B6500 reste identique au repos : vérifier son enfant,
pas seulement le wrapper. De même, un XOR du stockage protégé ne garantit pas
la valeur logique quand le getter natif live est redirigé. L’uptime système
ne peut pas remplacer une horloge de jeu redirigée. Ne pas qualifier7.20339
de dégâts effectifs ni comparer des clocks de domaines différents.

Trois essais de mesure logique infructueux sont conservés et arrêtés pour ce
passage selon AGENTS.md. Une lecture réussie de l’enfant Normal n’est pas une
mesure de charge : attendre l’entrée native de l’action après disponibilité
du tir précédent. Reprise exacte : cannonade-recovery/logical-values-blocker.json.

### Cannonade — recharge progressive et transport du labo,15 octobre2026

Ne pas transformer une constante de recharge en durée du chargeur complet.
Le binding Cannonade emploie1000ms et le client natif insère une munition vers1s,
puis la suivante vers2s. Le premier adaptateur remplissait tout après1s ; les
relevés intermédiaires d’ammo sur les deux sexes ont révélé et corrigé l’erreur.
Conserver la boucle d’animation séparée de l’insertion des munitions.
Preuve : work/cannonade-recovery/native-states-v2.json.

Une erreur HTTP10053 après une longue observation mémoire n’indique pas que le
jeu est mort : vérifier d’abord le PID et les services. Ici le keep-alive admin
Node expirait après5s, tandis que le client restait vivant. Le helper reconnecte
avant un nouveau POST après4s d’inactivité, sans rejouer une mutation dont
l’issue est inconnue. Reprise observée sur le même PID avec le cas masculin
conservé, puis le cas féminin passé ; reconnexion finale contrôlée après6.2s.
Preuve : work/cannonade-recovery/admin-idle-recovery.json.

### Submachine Gun — correction du15 octobre2026

L'extraction initiale avait lié gun_l.scn à `Bip01 L Forearm`, en confondant
les entrées voisines de weapon_attach.x7. Le type2 déclare explicitement
scène0→R_Hand_Dummy et scène1→L_Hand_Dummy, toutes deux link0. Un contrôle
de proximité passé avec le parent supposé ne détectait pas cette erreur ;
le canon gauche pointait vers le haut pendant le tir. Le générateur lit
maintenant les entrées exactes du type et le test vérifie leur empreinte et
leur correspondance aux sorties. Ne pas déduire une attache de la position
approximative du modèle ou d'une autre famille. Captures avant/après et
référence native sont dans work/submachine-gun-recovery/ ; le v1 natif montre
parfois le backbuffer précédent, donc seul le v2 est exploitable pour cette
revue qualitative. Mesures d'angle et fidélité complète restent ouvertes.

Suivre le [guide court](IMPORT-ARMES-GUIDE.md), remplir une [fiche par arme](imports/MODELE.md)
et joindre les preuves des [contrôles obligatoires](IMPORT-ARMES-CONTROLES.md).
La [fiche Katana](imports/katana.md) suit l'import expérimental en cours dans le jeu principal.
Ce REX conserve les causes et l’historique ; ses diagnostics datés ne remplacent
pas le statut courant de la fiche et de ARMES.md. Le guide fixe aussi la règle
des trois tentatives infructueuses ou 30 minutes sans progrès sur un même blocage.



## Parcours rapide pour la prochaine arme



1. Choisir une famille dans `ARMES.md` et l'inventaire ; retrouver son item exact, ses fragments de code et ses ressources sauvegardées. Le tableau ancien donne des pistes, pas la preuve d'un blocage toujours présent. Travailler sur cette seule famille.

2. Lire ses états de repos, déplacement, tir/attaque et recharge, puis `weapon_attach.x7` et son entrée dans `attackattribindexer.lua`. Écrire le mapping sémantique, le socket et les événements attendus avant de copier du code.

3. Préparer les assets avec un script propre à l'arme. Réutiliser les modèles/deltas déjà convertis ; récupérer seulement les dépendances manquantes. Vérifier CRC à l'extraction, SHA et fin de fichier au décodage. Un ancien manifeste « absent » doit être revérifié dans l'installation locale.

4. Raccorder au moteur actuel en conservant ses corrections. Réutiliser la visée, le mixer, les contacts et le moteur de particules ; garder les règles propres à l'arme dans un petit adaptateur. Ne pas restaurer un ancien contrôleur entier.

5. Tester immédiatement attache après mixer, visée haut/centre/bas, huit directions et recharge mobile sur les deux corps. Ajouter la sélection, l'inventaire, les raccourcis, le HUD et les sons dans le même passage. Ne pas repousser l'inventaire à la fin de la série d'imports.

6. Vérifier en arène les dégâts, impacts, murs, annulations et changement d'arme, puis les régressions et le build. Actualiser contrat, manifestes et `ARMES.md` avec la distinction entre jouable en essais et fidélité native vérifiée.

7. Si une dépendance reste réellement bloquante, noter son chemin exact, les recherches/extractions tentées et le résultat, puis passer à la famille suivante. Ne pas refaire l'audit global.



## Ce que signifie « import terminé »



Une arme n’est pas terminée parce que le modèle s’affiche, qu’un script la déclare ou que le build passe. Il faut vérifier ensemble : sélection dans le jeu principal, déplacement, attache animée, actions, effets, sons, dégâts et déplacements de la cible. Une arme accessible avec la mention « essais » reste une intégration en cours tant que les comparaisons natives manquent.



Séparer les niveaux de preuve : données extraites ; comportement raccordé au moteur ; tests automatisés ; observation visuelle dans notre jeu ; comparaison directe avec S5Runtime. Ne jamais remplacer l’un par l’autre.

**Position des armes :** une ancienne mention « validé » dans un contrat ou une galerie QA ne vaut pas validation dans le jeu principal actuel. Tester le *maillage visible* et ses points caractéristiques (poignée, garde, canon, lame), pas seulement la matrice du dummy. Contrôler après le mixer sur les deux corps au repos, dans les huit déplacements, pendant chaque phase d'attaque/charge/maintien/relâchement et pendant les fondus ; relever position **et** orientation, avec captures profil et trois-quarts. Comparer séparément aux clips et sockets S5Runtime, puis à une capture S5Runtime exploitable si disponible. Si la sonde live ne voit pas la main ou l'arme, noter « comparaison S5Runtime non établie », jamais « position validée ».

**Nouvelle vérification Katana (30 septembre) :** les dummies de main et de fourreau restent alignés après mixer sur 23 clips homme/femme. Le test contrôle aussi la géométrie de la lame : `KT004` la garde compacte, `KT000` la déploie, et des sommets restent près de la main. Des captures du jeu principal couvrent repos, une diagonale opposée par corps, première frappe et contact. Ces preuves ne valident pas encore l'angle exact en huit directions, tous les fondus ni la comparaison S5Runtime. La capture S5Runtime Katana du 27 septembre avait échoué pour `player.position` et ne possédait pas de sonde main/arme ; elle ne peut servir de mesure d'attache.

**Séquences avec nœud sans texture :** deux nœuds `CActParticle` des attaques Katana 2/3 n'ont aucune entrée de texture. Les transmettre tels quels à `Particles` casse le chargement du jeu entier (`config.uv` absent). Vérifier les dépendances *par nœud* avant d'activer une séquence ; omettre explicitement les nœuds non rendables et conserver cette limite dans le manifeste runtime. Une séquence structurée n'implique pas que chaque nœud soit visuellement exploitable.



## Les erreurs signalées par l’utilisateur et leurs causes



| Retour utilisateur | Cause trouvée | Correction / règle durable |

| --- | --- | --- |

| Les armes présentes sur l’autre PC manquent après le pull. | Le dépôt contient des inventaires et fragments d’intégration qui ne correspondent pas aux modules et ressources effectivement disponibles. | Vérifier l’intégration depuis un checkout complet : menus, imports, chemins publics et ressources. Un inventaire de 32 armes ne prouve pas 32 armes jouables. |

| L’arme doit être sélectionnable directement en jeu. | Une page QA ou des fichiers convertis seuls ne satisfont pas ce besoin. | Ajouter le chargement, le choix dans le menu, le raccourci, le changement à chaud, le HUD, les sons et les ressources au jeu principal. Air Gun : touche 5. |

| Gauche/droite et les diagonales sont inversées. | Les noms sémantiques du Lua ont été repris directement dans un système de présentation qui utilise l’autre convention latérale. Le contrôle des courbes dans le seul repère source ne détectait pas cette erreur d’intégration. | Conserver le mapping source et adapter à une frontière explicite. Comparer les courbes Bip01 et les clips des jambes à une arme validée, pour plusieurs orientations du personnage. Ne pas inverser les commandes ni le monde. |

| Repos et relâchement corrects, maintien incorrect. | Pour Air Gun, BASE du point Revolver_Wea_Dummy01 contient une pose de scène ; ses pistes explicites de charge sont déjà locales à l’attache. L’inverse de BASE était appliqué à toutes les pistes. | Normaliser BASE uniquement dans ce cas documenté ; conserver les pistes explicites et la hiérarchie des enfants. Ne pas ajouter une rotation globale qui casserait les poses déjà validées. |

| Effets visuels absents. | Les séquences et ressources étaient partiellement extraites mais sans déclenchement dans le jeu. Un fichier présent n’est pas un effet actif. | Brancher les événements, le socket, la durée, le suivi et l’arrêt. Vérifier charge, tir, impact et annulation séparément. |

| Impact Air Gun visible mais ennemi immobile. | Le code retirait des PV et activait la réaction, sans passer par l’application d’une vitesse physique à la cible. | Pour une arme qui pousse, utiliser le chemin complet de réception du coup : dégâts, réaction, interruption, impulsion, intégration physique et collisions. Un test doit constater un changement de position. Ne pas appliquer cette règle aux balles ordinaires, qui gardent seulement dégâts et effets visuels. |

| Recharge correcte en haut, jambes figées. | AW007 jouait sur tout le corps. Le Lua ne précise explicitement que les jambes à l’arrêt ; cela avait été interprété comme une absence de locomotion pendant la recharge. | L’observation de l’utilisateur dans S5Runtime confirme la marche. Jouer AW007 sur le haut et les clips ordinaires directionnels sur le bas en mouvement ; conserver AW007 en bas à l’arrêt et la continuité de l’horloge de marche. |



Ces retours sont des cas de régression à conserver, pas seulement des remarques esthétiques.



## 1. Identifier exactement les sources



Enregistrer la famille, l’item XBN, le type d’arme, le modèle, le skin, les deux rigs, les fichiers Lua/X7/XML et leurs empreintes. Pour Air Gun classique : item 2010016, type 27, airgun.scn.



Lire séparément NormalState, RunState, les états d’attaque et ReloadState. Lire aussi weapon_attach.x7 et les champs other_effects de weapon.xml. Les tables weapon.xml et weapon_ref.xml peuvent diverger : conserver la divergence et ne pas affirmer une priorité non démontrée.



Un ancien index XS peut pointer vers de mauvais offsets sur une autre installation. Nous l’avons rencontré en récupérant smoke.tga : la ressource avait changé d’archive locale. Réindexer avant extraction, vérifier longueur, CRC et SHA. Ne pas modifier l’installation S5Runtime.



## 2. Écrire le contrat d’intégration avant le raccordement



Pour chaque état, consigner : clip supérieur, clip inférieur, boucle, vitesse, durée, mélange entrant/sortant, redémarrage, mobilité permise, moment de l’effet et moment de l’impact. Les valeurs absentes restent « à établir ».



Air Gun actuellement :



| État | Haut | Bas |

| --- | --- | --- |

| Repos | AW000 | AW000 |

| Marche | AW019–AW026 selon direction | 00008–00015 selon direction |

| Charge horizontale | AW002 | E0001 à l’arrêt ; E0008–E0015 en mouvement |

| Relâchement/tir horizontal | AW005 | mêmes jambes que la charge |

| Recharge | AW007 | AW007 à l’arrêt ; marche ordinaire en mouvement |



AW001/AW002/AW003 constituent le triplet de visée de charge ; AW004/AW005/AW006 celui du tir. AW003 n’est pas une animation de jambes. La visée verticale complète n’est pas encore branchée dans cette intégration.



Mettre à jour work/arsenal-integration/weapon-integration-contracts.json. Le contrat source et les adaptations du runtime doivent être distingués.



## 3. Vérifier les huit directions dans le repère final



Utiliser directionalMapping pour produire les tableaux, jamais un tableau positionnel recopié à la main. Garder deux ensembles nommés : source et présentation.



Tester avant, arrière, gauche, droite et les quatre diagonales ; répéter avec le personnage tourné à 0°, 90°, 180° et un angle quelconque. Vérifier le haut ET les jambes, la trajectoire effective, l’orientation des pieds et le retour à l’arrêt. Répéter pendant charge, tir et recharge.



Le Breaker validé par l’utilisateur sert ici de référence du jeu principal. Les tests Air Gun comparent les directions réelles de ses courbes à celles du Breaker, pas seulement les noms des clips. La référence Twin Blade du validateur historique reste une référence du repère source ; elle ne suffit pas à valider la présentation de ce runtime.



## 4. Définir les repères et l’attache, sans correction arbitraire



Distinguer : espace de la scène source, espace du personnage, espace du parent, espace du socket, espace de la carte et espace caméra.



Le personnage source regarde -Z ; le contrôleur regarde +Z à facing=0. La conversion utilise une rotation de π autour de Y, pas un miroir. Le miroir Z de certaines cartes ne doit pas intervenir dans une transformation arme/main.



Les matrices de bind et les pistes animées n’ont pas nécessairement le même rôle. Pour Air Gun, BASE du dummy a une translation voisine de [24.93, 0, -51.39], alors que les pistes explicites concernées ont une translation nulle. Cette différence explique pourquoi une correction uniforme échouait pendant le maintien.



Conserver les nœuds Bone ET ModelData, leurs parents, les pièces mobiles et les sockets d’effets. Un modèle non skinné peut tout de même être un nœud animé. Ne pas aplatir sa hiérarchie.



Mesurer après le mixer : matrice arme relative à la main, orientation, échelle et dérive. Examiner plusieurs instants du clip et les fondus, avec personnage masculin et féminin. Une pose de bind correcte ne suffit pas.



## 5. Préserver les actions simultanées



Ne pas supposer qu’une action supérieure bloque les jambes. Tester les combinaisons autorisées : marche + charge, marche + tir, marche + recharge, arrêt pendant recharge, reprise de marche, changement de direction sans redémarrage de la recharge.



Conserver les deux canaux d’animation et leurs horloges. Le chronomètre de recharge ne doit pas recommencer à chaque changement de clip inférieur. Vérifier les munitions séparément : consommation une seule fois au tir, charge sans consommation anticipée, recharge au bon moment, comportement à vide.



Tester aussi interruption par esquive, coup reçu, mort, changement d’arme, retour au menu et réapparition. Ne pas laisser un état de charge ou un effet attaché survivre à un changement d’arme.



## 6. Importer et déclencher tous les effets



Faire un inventaire par événement : début de charge, charge maximale, tir, impact sur cible, impact mur, expiration, recharge et annulation. Pour chaque effet, relever séquence, modèles dépendants, textures, socket, temps de départ, durée, suivi ou détachement.



La résolution native des textures peut préférer le DDS de même nom à une référence TGA. Dans ce chantier, blue_beam.tga avait été déclaré absent alors que blue_beam.dds existait. Utiliser les règles documentées du chargeur et une résolution traçable, jamais une texture choisie à l’œil.



Le modèle d’un effet doit conserver ses courbes d’alpha, les déformations de sommets, les UV animés, le billboard et les modes de fusion. L’ancien convertisseur consommait certains champs sans les conserver : l’option captureEffectAnimation sauvegarde maintenant ces données pour les effets Air Gun. Un flash ne doit pas devenir un mesh opaque permanent.



Attention aux champs binaires : la durée de vie de particule vient ici de la clé émetteur object+58, la variation de durée d’un autre champ. Les confondre réduisait la fumée de charge à quelques millisecondes. Un test fixe désormais 900 ms et 20 ms de variation pour cette fumée.



Raccorder les sockets après évaluation de l’animation. La charge suit le canon ; le tir détaché conserve son point d’émission. Vérifier que l’effet sort du canon, dans le bon sens, lorsque le personnage tourne ou marche. Vérifier aussi qu’il s’arrête réellement.



## 7. Relier le coup à un résultat physique



Distinguer quatre choses : volume de contact, dégâts, animation de réaction et mouvement physique. Aucun de ces éléments ne prouve les trois autres.



Pour une poussée, appliquer une vitesse à la cible, puis la faire passer par le contrôleur et les collisions. Tester cible immobile, proche, à portée limite, hors du cône, derrière un mur, devant un mur et près d’un bord. Vérifier qu’un seul tir ne frappe pas à chaque frame.



Pour Air Gun, le Lua déclare AddBlowCondition(2500,2500) et (3000,3000). Le runtime d’entraînement emploie actuellement 15/18 unités par seconde horizontalement et une petite impulsion verticale de 3. Le rapport normal/chargé est conservé, mais cette calibration n’est PAS une mesure native validée. Le test en jeu chargé a déplacé la cible de z=2 à z≈5.65.



Ne pas appeler cela une reproduction exacte du knockback S5Runtime avant d’avoir comparé distance, durée, hauteur, récupération et interactions avec les murs.



## 8. Vérifier dans le jeu principal



L’arme doit être sélectionnable dans le menu, au clavier et pendant une partie. Vérifier HUD, munitions, contrôles, chargement des deux sexes et retour vers les armes existantes. Une galerie QA ne remplace pas ce parcours.



Les scénarios déterministes utilisent le vrai contrôleur et le vrai mixer du jeu principal :

- airgun-charge : maintien et socket.

- airgun-fire : relâchement, recul de l’arme et effets.

- airgun-reload-walk : recharge et marche diagonale.

- airgun-push : tir chargé contre une cible passive, recul mesurable.

- idle, front, back, left, right et les quatre diagonales : locomotion ordinaire.



Les captures fixes vérifient la pose et l’effet à un instant ; elles ne suffisent pas à prouver la continuité du mouvement. Compléter avec une séquence de frames et des mesures.



## 9. Validation et sauvegarde



Exécuter les tests de mappings, les mesures après mixer, les tests de combat et de collisions, ceux des effets, les changements d’arme et le build. Garder les tests de régression du Breaker, de la Plasma Sword et de la Spy Dagger.



Les tests ajoutés vérifient notamment : huit directions sur deux sexes et plusieurs orientations ; attache BASE/charge/tir/recharge ; fondu sans réapparition du décalage ; recharge mobile ; impulsion et murs à 30/60/120 Hz ; alpha et morphs des effets ; présence des dépendances ; extinction des effets.



Historique Air Gun : le groupe ciblé comportait 48 tests réussis et le contrat 8 tests réussis. Les ressources Revolver alors absentes ont depuis été récupérées : cet ancien blocage ne doit plus servir de diagnostic actuel. Dernière validation sauvegardée du Revolver : 60/60 tests ciblés, compilation réussie ; preuves dans `work/revolver-restoration/regressions.tap` et `build.log`. Ces résultats concernent cette étape sauvegardée, pas automatiquement les modifications ultérieures ni toute la suite. Recontrôler les échecs préexistants de manifestes et les dépendances des tests de décodage avant de les réannoncer.



La validation native globale reste non prête : mesures natives quantitatives d’attaches manquantes, saut spécifique non établi et synchronisation native des effets non mesurée. Cela n’empêche pas le test explicite de l’arme en mode « essais ».



Sauvegarder ensemble code, ressources publiques, scripts reproductibles, contrats, tests et notes. Vérifier git status, les fichiers ignorés et LFS. Refaire un chargement depuis les fichiers sauvegardés. Un script qui ne fonctionne que grâce à un fichier ignoré sur un PC doit le déclarer ; les ressources nécessaires au jeu doivent être livrées.



## Comparaison S5Runtime encore utile pour Air Gun



Une courte séquence au même équipement et avec une cible immobile permettra de préciser :

1. Charge courte puis charge complète : aspect, intensité et durée des fumées.

2. Relâchement : instant du souffle, du flash et du contact.

3. Recul de la cible : distance au sol, hauteur, temps avant reprise, comparaison normal/chargé.

4. Recharge en marche gauche, droite et diagonales, puis arrêt et reprise.

5. Vues de profil et de face pour confirmer le grip pendant toute la charge.



Les effets emploient les textures et modèles décodés ; la géométrie procédurale du faisceau reste une approximation déclarée. La visée verticale, l’arme rangée, les effets spécifiques non prouvés et le comportement aérien complet restent à établir.



## Checklist de livraison réutilisable



- [ ] Identité exacte, sources, empreintes et ressources réellement disponibles.

- [ ] Menu du jeu principal, raccourci et changement d’arme fonctionnels.

- [ ] Repos distinct des attaques ; huit directions correctes, haut et bas.

- [ ] Repères explicités ; hiérarchie et pièces mobiles conservées.

- [ ] Attache vérifiée après mixer et pendant les transitions, deux sexes.

- [ ] Marche pendant charge, tir et recharge selon le comportement attendu.

- [ ] Effets ET sons inventoriés, chargés, déclenchés et arrêtés.

- [ ] Alpha, morphs, UV, textures, sockets, direction et durée des effets vérifiés.

- [ ] Dégâts, réaction et déplacement réel de la cible testés séparément.

- [ ] Balles ordinaires : dégâts et VFX sans animation de douleur, interruption, poussée ni pause d’impact ; projection/stun uniquement si prévus pour cette arme. Mort et stun déjà en cours vérifiés séparément.

- [ ] Murs, portée, répétition des coups, interruption et changement d’arme testés.

- [ ] Validation visuelle dans le jeu principal ; comparaison S5Runtime ciblée si nécessaire.

- [ ] Tests et build exécutés ; échecs préexistants et approximations explicités.

- [ ] Contrat, documentation, code et assets sauvegardés ensemble.







## REX Smash Rifle — réintégration du 29 septembre 2026



### Dégâts d'arme à feu : ne pas inventer de réaction physique

Correction demandée en jeu : les balles ordinaires du Smash Rifle diminuent les PV et affichent les effets de contact, **sans animation de douleur, recul, arrêt de locomotion, annulation d'attaque ou pause d'impact**. Les dégâts, les effets visuels et la réaction de la victime sont trois décisions séparées.



Pour les prochains imports d'armes à feu, choisir explicitement un profil sans réaction par défaut. Une projection, poussée ou animation de stun exige le comportement spécifique de l'arme. L'Air Gun conserve ainsi sa projection réelle ; les armes qui étourdissent conservent leur stun. Une balle ordinaire ne doit pas non plus réinitialiser ou prolonger un stun déjà en cours. La mort reste traitée normalement.



Validation obligatoire : toucher une cible au repos, en déplacement et en attaque ; vérifier PV + VFX, absence de flinch/annulation/impulsion, puis vérifier séparément les exceptions Air Gun/stun. Le Smash passe par `reaction:'none'` dans son profil et conserve le socket/traceur/impact visuel.



### Visée, trajectoire et ressources

- **Ne pas recopier une erreur des sauvegardes.** La QA sauvegardée déclarait DD003 « horizontal » : c'est la visée basse. DD001/DD002/DD003 sont haut/centre/bas. Les mêmes erreurs que sur Air Gun se reproduisent si on ne regarde que les noms des canaux Lua.

- **Centre seul ne suffit pas.** Le pointeur doit piloter le mélange continu des trois poses. Les canaux de jambes restent indépendants. Tester haut, centre, bas, déplacement, recharge et retour au repos, pour les deux corps.

- **Un seul résultat de tir.** Résoudre le rayon du réticule depuis la caméra, puis depuis le socket du canon vers ce point. La caméra est décalée sur l'épaule : tirer simplement suivant facing/pitch donne une erreur de parallaxe. Recontrôler les murs depuis le canon.

- **Évaluer après le mixer.** L'origine du traceur, les impacts et les dégâts partagent le même contact calculé après la pose du canon. Ne pas déclencher seulement les particules de bouche en oubliant le trajet.

- **Traceur natif.** weapon_smashgun_rail.seq référence green_beam ; durée du nœud 100 ms. Texture récupérée, ruban rendu en arène. Sa géométrie procédurale native reste une approximation explicite.

- **Cadence et recharge.** Conserver le reliquat de cooldown à 60 Hz (125 ms ne divise pas 16,67 ms). DD004 fait 11200 ticks / 4800 Hz, ajustés à la fenêtre de recharge de 2000 ms. Garder les jambes en marche ; ne pas conclure qu'une ligne Lua commentée immobilise le joueur.

- **Ne pas réappliquer les anciens patches en bloc.** Ils supposent ranged-weapons.js et breaker-effects.js absents, et écraseraient les corrections présentes. Restaurer les seuls assets nécessaires et porter les raccordements.

- Vérifications exécutables : tests/smash-restoration.test.mjs. La certification native reste bloquée par les états/stow non mesurés et le secondaire non réintégré.



## REX Revolver — méthode réutilisable du 30 septembre 2026



### Retrouver une ressource avant de la déclarer absente



La texture `model/weapon/revolver_01.dds` manquait dans les anciens payloads. Elle a été récupérée dans le `49.xs` local, CRC `8fb4aec0`, puis convertie en PNG. Les effets d'impact ont aussi fourni un cas concret d'index périmé : les dépendances recherchées n'étaient plus toutes aux emplacements de l'ancien index.



Utiliser `tools/s5runtime-arsenal/index-selected.py` avec `--packages`, `--output` et un ou plusieurs `--path` pour retrouver les offsets actuels des seuls fichiers requis. Puis exécuter `tools/s5runtime-arsenal/xs_decode.py` avec cet index et les mêmes chemins. Écrire dans `work/s5runtime-decoder/<arme>-...`, jamais dans l'installation S5Runtime. Le premier outil parcourt les tables locales ; il ne lance ni audit des armes ni extraction globale.



Conserver les avertissements d'archives non prises en charge : lors de ce passage, `81.xs`, `82.xs` et `83.xs` n'ont pas été indexées par ce lecteur. L'absence d'un chemin dans son résultat ne prouve donc pas son absence de toute l'installation. Les fichiers trouvés, eux, passent encore le contrôle CRC du décodeur.



Vérifier le format réel du SCN extrait avant d'ajouter une étape de déchiffrement. `gun_hit_hexa.scn` et `mapeff_gun_ricochet.scn` ont été parsés directement jusqu'à leur fin exacte. Ne pas leur appliquer automatiquement le décodeur des SCN protégés.



Un JSON structuré ne suffit pas à valider sa source. Contre-exemple relevé pendant cette reprise : `katanaa_strong.seq` sauvegardé se parse, mais son CRC calculé `4d54751b` diffère de `9c0e5a85` dans l'index de référence. Il reste à résoudre ; ne pas le promouvoir grâce à son seul JSON. La séquence `katanaa_s_atk02_line01.seq`, elle, correspond au CRC `d31f0de7`.



### Réutiliser les bons modules



| Besoin | Point de départ actuel | À adapter pour chaque arme |

| --- | --- | --- |

| Préparer modèle, texture, sons et deltas | `tools/restore-revolver-assets.mjs` | Chemins et empreintes ; ne jamais remplacer les rigs partagés. |

| Préparer impacts avec modèles animés | `tools/prepare-revolver-effects-runtime.mjs` | Séquences, textures récursives, alpha/morphs, socket et timing. |

| État de l'arme | `src/revolver-gameplay.js`, `src/smash-rifle-runtime.js` | Semi-auto/auto, capacité, réserve, cadence, délai de départ, recharge et annulation. |

| Visée et contact | `src/rifle-contact.js` | Socket, portée, nombre de rayons, dispersion et décroissance ; garder une seule résolution pour dégâts et VFX. |

| Mélange vertical et jambes | `src/avatar.js`, `src/motion-graph.js` | Triplet de visée et clips inférieurs propres à l'état. |

| Particules natives | `src/native-particle-sequence.js`, `src/combat-effects.js` | Types de nœuds et champs ; ne pas ignorer silencieusement les nœuds non gérés. |

| Sélection et exposition | `src/loadout.js`, `src/weapon-slots.js`, `src/main.js`, `src/weapon-inventory.js` | Clé de famille/alias, chargement, menu, HUD, raccourci, absence de doublons. |



Le moteur de tirs partagé peut servir à un Revolver : son nom `rifle-contact.js` n'impose pas de créer une seconde chaîne de visée. L'adaptateur conserve ici le runtime semi-auto sauvegardé, tandis que la présentation et les événements utilisent le moteur actuel.



### Attache : ne jamais calibrer une rotation globale sur une seule pose



La sauvegarde du Revolver contenait une correction quaternion calculée sur Q0001. Avec Q0002, le canon pointait presque verticalement vers le bas au début du tir sur les deux corps. La suppression de cette correction, en conservant l'inverse du grip source `Revolver_Wea_Dummy`, rétablit la présentation de tir observée. Ne pas recopier ce quaternion sur les futures armes.



Comparer au minimum repos, marche, début de tir, instant effectif de départ, récupération et recharge. Mesurer le grip relatif à la main après mixer et pendant les fondus. Vérifier séparément l'axe visuel : le vecteur grip→socket peut inclure la hauteur du canon au-dessus de la poignée, et n'est pas nécessairement l'axe géométrique exact du canon. La pose peut aussi changer pendant le recul ; une mesure isolée à 0,3 s n'est pas une référence de visée neutre.



Ne pas confondre `idleAttach` dans la table d'attaches avec une instruction de reparentage à chaque repos du contrôleur. Pour le Revolver, `R_Hand_Dummy` porte l'arme tenue ; le rôle et le moment exacts du relink `Gun_Dummy` restent à comparer dans S5Runtime. Ne pas inventer une transition vers ce socket pour faire disparaître un avertissement de contrat. Garder stow/equip explicitement non certifiés.



### Tir : état, visée, jambes et départ sont distincts



Q0001/Q0002/Q0003 sont les poses haut/centre/bas. Les paramètres nommés « Upper/Lower » du blender de visée ne prouvent pas une séparation torse/jambes. Lire le bloc `LowerPart` séparément : pour le Revolver, il indique E0008–E0015 en déplacement et Q0002 à l'arrêt pendant le tir. Le repos ordinaire reste Q0000 et la marche Q0014–Q0021 avec les jambes 00008–00015.



Construire les directions avec `directionalMapping`, puis appliquer une seule fois l'adaptation latérale validée contre le Breaker. Le mapping source et la présentation doivent rester identifiables. Tester également les courbes réelles sur les deux corps et plusieurs orientations du personnage.



Le Revolver consomme une munition par tir, mais résout quatre rayons : la consommation ne doit pas être multipliée par le nombre d'impacts. Son départ est différé de 150 ms dans le raccordement actuel, d'après `InitAttack1`. Le socket doit être évalué après mixer à ce moment-là. Ne pas résoudre une seconde fois le même tir lors de la mise à jour des effets.



Les tirs différés ajoutent un cas d'annulation : vider la file lors du changement d'arme, de la mort, d'une interruption ou d'une esquive qui annule l'action. Un tir en attente ne doit pas ressortir après la récupération du personnage. Tester aussi les impacts multiples, la portée, la décroissance et le mur rencontré depuis le canon.



Appliquer la règle demandée par l'utilisateur : balles ordinaires = dégâts + VFX, sans douleur/stun/interruption de l'ennemi. La présence de `AddPushCondition` dans un ancien Lua ne justifie pas à elle seule une projection improvisée ; noter la divergence et vérifier son comportement natif si nécessaire. Ne pas toucher à la projection déjà validée de l'Air Gun.



### Effets : suivre les dépendances jusqu'au dernier modèle et à sa texture



L'entrée `ATTACKATTRIB_REVOLVER` nomme `weapon_revolver_fire.seq`, `gun_hit4.seq`, `gun_hit.seq`, le socket `Revolver_Fire_Dummy` et les sons `revo_blast`, `player_attack`, `wall_attack`. La texture du modèle et le flash ne suffisent donc pas.



Les deux impacts mélangent particules et `CActNodeLoader`. Leurs modèles `gun_hit_hexa.scn` et `mapeff_gun_ricochet.scn` ajoutent encore `effect_forcefield2` et `tick2_blue`. Ces dépendances ont été récupérées et converties ; les animations d'alpha et de géométrie sont conservées avec `captureEffectAnimation:true`. Ne pas filtrer les nœuds de modèles pour obtenir artificiellement un effet « chargé sans erreur ».



Les chemins source absolus d'un ancien poste, parfois avec `resourcePath:null`, ne sont pas des chemins locaux à ouvrir tels quels. Résoudre leur nom de ressource, rechercher sa variante DDS selon les règles du chargeur, puis consigner la correspondance. Échouer explicitement si la dépendance demeure inconnue.



### Vérifications qui évitent de perdre du temps



- Employer un vrai sol dans les tests de recharge/déplacement de plusieurs secondes : dans un monde vide, le personnage tombe puis se réinitialise. Ce reset peut donner l'impression que la recharge se termine trop tôt.

- Ne pas tester une échelle constante avec la diagonale d'une boîte englobante alignée sur les axes du monde : elle varie avec l'orientation d'un objet non sphérique. Pour détecter une dérive d'échelle entre poses, comparer une mesure indépendante de la rotation ; garder séparément les contrôles de proportions natives et de distance main/grip.

- Vérifier les huit directions, le triplet de visée, les transitions du grip, les quatre rayons, les PV sans réaction, les munitions, la recharge mobile et le switch avec `tests/revolver-gameplay.test.mjs` ; les ressources et empreintes avec `tests/revolver-assets-restored.test.mjs`.

- Dans le jeu principal, utiliser les scénarios existants `idle`, `left-front`, `right-back`, `rifle-fire`, `rifle-aim-up`, `rifle-aim-down`, `rifle-reload-walk` et `rifle-contact`, pour les deux sexes. Compléter les captures fixes par des mesures temporelles et un essai via l'inventaire.

- Faire des modifications ciblées. Une substitution globale de `$('play').disabled=true` a ajouté le choix Revolver à plusieurs endroits ; ce doublon a été corrigé. Contrôler le nombre d'options après chargement et entrée en partie.

- Actualiser les anciens indicateurs « texture absente », « son manquant », « effets désactivés » et les assertions qui les figent. Garder les vraies limites natives ; ne pas confondre la mise à jour d'un statut périmé avec l'assouplissement d'un test de comportement.

- Les scripts de préparation peuvent réécrire leurs manifestes statiques. Après régénération, refaire les étapes d'effets/runtime et réconcilier leurs statuts ; ne pas lancer un générateur ancien à l'aveugle sur des ressources validées.



Demander une comparaison S5Runtime uniquement pour une incertitude précise : comportement du relink, éventuelle poussée native du Revolver, chronologie ou amplitude d'un effet. Les ressources absentes du checkout et les erreurs locales d'attache doivent d'abord être traitées ici.



## Fiche courte à remplir pour chaque prochain import



Cette fiche évite de redécouvrir les mêmes informations entre deux sessions. La conserver avec les preuves de l'arme, puis résumer son statut dans `ARMES.md`.



| Champ | Information attendue |

| --- | --- |

| Identité | Clé runtime, alias inventaire, item/type natif, skin et chemins source. |

| Réemploi | Fragment sauvegardé retenu, adaptateur actuel réutilisé, différences à porter ; pas de remplacement des modules partagés. |

| Animations | Pour repos, marche, attaque, recharge : haut/bas, horloges, durée, boucle et transitions ; triplet de visée et huit directions. |

| Attache | Parent, grip, canon, conversion de repère, BASE/pistes explicites, mesure après mixer sur les deux corps. |

| Tir et combat | Auto/semi-auto, délai, cadence, consommation, nombre de rayons, portée, dispersion, dégâts, critique, décroissance, réaction explicitement choisie. Valeurs inconnues signalées. |

| Secondaire | Clic droit, zoom ou attaque spéciale, règles de maintien/relâchement et annulation ; noter explicitement tout secondaire non raccordé. |

| Effets et sons | Événement → séquence → modèles → textures → socket → instant → arrêt ; impacts ennemi et mur distincts. |

| Exposition | Chargement, inventaire, menu, raccourci, HUD, contrôles, changement à chaud et URL de test. |

| Preuves | Commandes exécutées, résultats, captures, sexe/scénario/instant, erreurs navigateur, limites et comparaison S5Runtime restante. |

| Blocage | Chemin ou comportement exact, tentative et résultat, impact sur le jeu, prochaine action ciblée. |



### Ordre de raccordement pour gagner du temps



1. Faire charger modèle et deltas sur les deux corps ; vérifier les imports JavaScript et exports avant d'ajouter l'option au menu. Un asset converti ou un adaptateur présent ne signifie pas que le chargement complet fonctionne.

2. Valider repos, marche et grip ; brancher ensuite visée, tir et recharge. Réutiliser les tests de comportement existants avec les constantes de la nouvelle arme, sans recopier leurs attentes propres au Revolver ou au Smash.

3. Raccorder ensemble contact, dégâts, effets et sons. Un éventuel délai de départ appartient à la même file de tirs ; les effets ne doivent ni recalculer le contact ni consommer les tirs d'une autre arme.

4. Exposer immédiatement l'arme en essais dans le jeu principal dès que ce parcours fonctionne. Vérifier la sélection réelle et le changement vers une arme déjà validée, puis compléter les cas limites.

5. Terminer par les tests ciblés, le contrat, le build et le contrôle navigateur. Après une modification partagée, inclure les armes qui utilisent ce chemin ; une simple modification de cette note n'exige pas de relancer tous les tests.



Pour les vérifications communes, depuis la racine du dépôt :



```powershell

node --test tests/revolver-gameplay.test.mjs tests/revolver-assets-restored.test.mjs tests/smash-restoration.test.mjs tests/airgun-runtime.test.mjs tests/airgun-effects.test.mjs tests/weapon-switch.test.mjs tests/melee-contact.test.mjs

node --test work/arsenal-integration/weapon-integration-contract.test.mjs

node work/arsenal-integration/verify-weapon-integration.mjs

npm run build

```



Ajouter les tests de la nouvelle arme à cette sélection. Lire le résultat et le code de sortie de chaque commande ; un affichage de log réussi ne prouve pas que la commande précédente a réussi. Un gate natif non prêt reste documenté, même si le parcours de jeu en essais passe.



### Ressources partagées et reprise sur un autre PC



Les impacts déjà convertis peuvent être réutilisés si la référence source est la même. Enregistrer cette dépendance dans le manifeste de l'arme : une ressource située dans le dossier du Revolver mais utilisée ailleurs doit voyager avec les deux intégrations. Ne pas remplacer un effet spécifique par un effet ressemblant uniquement pour accélérer.



Avant livraison, vérifier que code, ressources publiques et références de manifestes sont réellement suivis ou prêts à être ajoutés à Git. Documenter séparément les chemins locaux d'extraction S5Runtime, qui servent à régénérer les assets et ne doivent pas être nécessaires au chargement du jeu. Cette vérification répond directement au problème des armes présentes sur un PC mais absentes après le pull.



### Quand solliciter l'utilisateur dans S5Runtime



Formuler une demande précise : arme/skin, état, direction, vue et séquence à observer, avec le doute à trancher. Par exemple : « recharge en marche latérale, puis arrêt/reprise » ou « tir haut/centre/bas de profil ». Préparer d'abord le même scénario dans notre jeu. Conserver la réponse comme preuve de comportement, sans en déduire des constantes physiques non mesurées.





## Complément Semi Rifle — 30 septembre 2026



- Mesurer la durée des clips sur **chaque rig** avant de caler une action : W0004 fait 14720 ticks côté masculin, 15200 côté féminin, à 4800 Hz ; les deux sont ajustés à 2000 ms. Ne pas recopier la durée du Smash. W0001–W0003 font seulement 640 ticks ; le Lua demande une vitesse 2.

- `loadGunParticleEffects` dans `src/revolver-effects.js` prend désormais `weapon`, `muzzle` et `root`. Il réutilise le moteur validé sans consommer les tirs d'une autre famille. Garder le wrapper Revolver pour préserver ses raccordements.

- Le canon provient d'`attackattribindexer.lua` : **Smg_02_Fire_Dummy**, pas le générique Gun_Fire_Dummy de l'ancien contrat. Corriger la source du contrat avant les tests ; ne pas créer un faux socket pour satisfaire une vieille valeur.

- Les impacts gun_hit4/gun_hit partagés gardent leurs chemins vers les assets Revolver ; le manifeste indique cette dépendance. Le flash gun_blast1_1 a demandé son SCN et ses textures 0008/0009/flash. `tools/restore-semi-rifle.mjs` prépare ces éléments sans écraser les rigs.

- Ne pas confondre fin de décroissance et portée maximale native : 24000 unités source ne prouve pas RayDistanceLimit. Le plafond d'entraînement actuel et les différences EU/XBN sont explicités dans ARMES.md.

- Correction utilisateur après cet import : l'entrée de traceur vide ne suffit pas à conclure que le trajet doit rester invisible. Le Revolver et le Semi Rifle doivent montrer les balles allant vers le point visé. Le module partagé `src/bullet-tracers.js` ajoute ce rendu ; sa géométrie, sa couleur et sa vitesse sont une adaptation de présentation, pas une séquence S5Runtime décodée.

- Vérifier aussi le secondaire : le zoom 25° est raccordé et observé dans le scénario `rifle-zoom`. Les tests `tests/semi-rifle-gameplay.test.mjs` couvrent cadence, délai, directions, grip/visée, recharge mobile par sexe, portée, murs, dégâts sans réaction et changement d'arme.

## Balles visibles sur tout le trajet — correction utilisateur du 30 septembre 2026

**Flash au canon + impact sur la cible ne suffisent pas.** Cette omission s'est reproduite après le Smash sur le Revolver et le Semi Rifle. Pour chaque arme à feu, vérifier séparément le flash, le déplacement visible de la balle/traînée et l'impact. Ne pas déclarer les effets complets sur la seule présence de particules aux deux extrémités.

- Départ au socket évalué après mixer, à l'instant réel du tir. Destination issue du même contact que les dégâts ; aucun second rayon visuel indépendant.
- La traînée progresse vers le contact et s'arrête au premier mur ou à la cible. Un tir manqué reste visible jusqu'à sa limite. Pour un tir à plusieurs rayons, suivre chaque contact effectivement résolu.
- Conserver les dégâts instantanés du système hitscan : la vitesse de la traînée est une présentation, pas une nouvelle simulation balistique. Les impacts existants ne servent pas à infliger une deuxième fois les dégâts.
- Contrôler en jeu haut/centre/bas, cible proche/lointaine, mur, déplacement et changement d'arme. Comparer plusieurs instants pour prouver le déplacement ; une capture de flash seule ne prouve rien sur le trajet.
- Utiliser `createBulletTracers` via `loadGunParticleEffects` pour les prochaines armes compatibles. Nettoyer les traînées au changement d'avatar/arme et à la remise à zéro. Préserver le traceur spécifique du Smash.
- Tests de régression : `tests/bullet-tracers.test.mjs` (progression, arrêt au contact, extinction, plusieurs rayons et caméra dans l'axe), puis tests de combat des armes concernées.

## Accélérer par préparation parallèle

Préparer plusieurs armes en parallèle est possible avec des fichiers propres à chaque famille : sources, récupération/conversion d'assets, adaptateur, tests et fiche de preuves. Chaque lot suit toutes les exigences du REX, y compris les traînées de balles et la recharge mobile.

Un seul intégrateur modifie les fichiers communs (`controller`, `avatar`, `main`, combat, inventaire et contrat central), raccorde chaque lot, lance les régressions et valide le jeu. Éviter les écritures concurrentes dans ces modules et dans les rigs partagés. Publier les armes dans l'inventaire au fur et à mesure de leur validation. Commencer par un lot de trois armes ; mesurer le gain réel avant d'augmenter la taille du lot.

## Dispersion — diagnostic demandé par l'utilisateur, 30 septembre 2026

Les traînées visibles ne prouvent pas que la dispersion est appliquée. Les données étaient en partie extraites, mais leur raccordement au combat reste incomplet. Ne pas confondre trois mécanismes : précision de la fiche (`accuracy`), directions/motif des tirs dans le Lua, et décroissance des dégâts (`ApplyLinearDamageDropoff`). Cette dernière ne disperse pas les balles.

| Arme classique | Fiche `_eu_weapon.x7` | Source Lua | État au diagnostic, avant correction |
| --- | --- | --- | --- |
| Revolver, item 2010002 | `accuracy="0.08"`, ligne 252 | `weapon_revolver.lua`, `StandardRevolver` : quatre attaques simultanées, directions `(0,0,-1)`, `(0,-0.046188,-1)`, `(0.04,0.023094,-1)`, `(-0.04,0.023094,-1)` | Les quatre directions sont appliquées dans `rifle-contact.js`. Le champ accuracy est conservé dans le profil mais n'ajoute pas de dispersion au calcul. Le handler Lua classique reçoit Accuracy sans l'utiliser explicitement : ne pas lui inventer un cône aléatoire supplémentaire. |
| Semi Rifle, item 2010004 | `accuracy="0.01"`, ligne 260 | `weapon_smg2.lua`, `StandardSmg2_Pattern` : centre puis `(-0.0057,-0.0057,-1)`, `(0,0.008,-1)`, `(0.0057,-0.0057,-1)` ; `SetPatternRegression(0.5,0.01)` pour API >= 2 | Cycle fixe de quatre directions appliqué. Régression temporelle native non implémentée, accuracy non raccordé ; le handler classique emploie une direction de base `(0,0,-1)`. |
| Smash Rifle, item 2010006 | `accuracy="0.025"`, ligne 268 | `weapon_smg3gun.lua`, `StandardSmg3gun_Pattern` : 40 points (motif de 10 répété), `SetPatternRegression(0.5,0.01)` ; `StandardSmg3gun` ligne 319 fournit `(0,Accuracy,-1)` à MAKERAY | Aucun motif appliqué : le contact suit actuellement exactement la visée. Accuracy et régression ne sont pas raccordés. |
| Hand Gun, item 2010007, import en préparation | `accuracy="0.03"`, ligne 276 | `weapon_revolver2.lua` : une attaque, quatre points de motif, régression `(0.5,0.01)`, base `(0,Accuracy,-1)` | Ne pas transformer ces quatre points en quatre attaques simultanées comme sur le Revolver. |

Avec un vecteur `(x,y,-1)`, l'écart sur un plan à distance axiale D vaut `D * sqrt(x*x + y*y)` avant tout autre traitement. L'augmentation avec la distance découle donc déjà de la divergence angulaire. Exemple géométrique du Revolver : rayon excentré à environ 0,231 unité du centre à D=5, contre 0,924 à D=20. Ce sont des calculs sur les vecteurs extraits, pas des mesures S5Runtime. Ne pas multiplier une seconde fois l'angle par la distance.

Les sources examinées exposent les arguments de `SetPatternRegression`, pas son implémentation moteur : unités, remise à zéro entre rafales et interaction avec accuracy restent à établir. Ne pas interpréter 0,08 comme 8 %, comme des degrés ou comme un angle en radians sans preuve. Vérifier la branche API réellement active et la priorité des tables EU/XBN. Si le moteur n'est pas décodable ici, demander une comparaison S5Runtime ciblée de séries d'impacts sur un mur, à trois distances, puis après une pause, avec et sans zoom.

Avant validation d'une prochaine arme : relever ces champs, appliquer la dispersion à la direction du contact **avant** le test de mur/cible, puis utiliser ce résultat pour les dégâts, les traînées et l'impact. Tester tir isolé, rafale, relâchement/reprise et plusieurs distances. Ne pas modifier seulement les traînées : elles doivent montrer les vrais tirs. Le diagnostic ci-dessus n'est pas une annonce de correction complète de la dispersion native.

## Fumée du Revolver — nouvelle omission signalée par l'utilisateur

La présence de `smoke4.png` et des nœuds correspondants dans le JSON n'avait pas suffi : le contrôle visuel avait été fait pendant le flash, sans vérifier la fumée après le recul. À 0,6 s, le rendu montrait un petit point blanc détaché dans le décor, tandis que le canon était déjà remonté.

`weapon_revolver_fire.seq` contient un émetteur continu de fumée (nœud 1), actif de 100 à 1000 ms, 40 particules/s, vie de 700 ms, taille 20→40 unités source, ainsi qu'une bouffée initiale distincte (nœud 2). L'intégration figeait toute la séquence au socket du départ (`follow:false`).

Correction : `splitMuzzleSmoke` isole l'émetteur continu, qui suit désormais le canon animé. Ses particules déjà émises restent dans l'espace du monde et se dissipent ; la bouffée, le flash et les traînées conservent leur départ détaché. Aucun gonflement arbitraire ni remplacement de texture. Le suivi est une correction de présentation demandée ; sa correspondance quantitative avec S5Runtime reste à comparer.

Contrôle obligatoire pour les prochains imports : inspecter chaque composant nommé de l'effet **avant, pendant et après** le tir, y compris pendant recul, déplacement et retour au repos. Distinguer le suivi de l'émetteur de celui des particules. Tester apparition différée, émission depuis le socket courant, persistance des particules anciennes, extinction et changement d'arme. Régression : `tests/revolver-smoke.test.mjs`.



## Dispersion raccordée au combat — 30 septembre 2026

Le Smash utilise désormais les 40 points du Lua et le Semi Rifle ses quatre points via `rifle-dispersion-data.js`. `controller.js` capture le point à chaque déclenchement, avant le délai du tir ; `rifle-contact.js` applique la direction dispersée depuis le canon évalué après mixer, puis teste murs et cible. Les dégâts, traînées et impacts partagent ce contact. Les quatre attaques simultanées du Revolver restent inchangées.

Réutiliser `advanceDispersion` et `takeShotDispersion` pour les armes à motif compatibles. Ne jamais calculer le motif depuis le nombre global de tirs ni modifier seulement les VFX. La divergence augmente naturellement avec la distance, sans multiplicateur supplémentaire. Le changement d’arme réinitialise le motif et les tirs déjà programmés gardent leur point.

Limite explicite : la récupération après 0,5 seconde sans tir est une politique provisoire, pas un décodage de `SetPatternRegression(0.5,0.01)`. Les champs accuracy sont conservés comme données source ; leur traitement moteur exact et leur interaction avec les motifs restent non certifiés. Ne pas annoncer une dispersion native entièrement reproduite.

Tests : `tests/rifle-dispersion.test.mjs` compare tous les points aux Lua, vérifie la croissance géométrique des écarts, les contacts mur/cible, les tirs qui manquent une cible éloignée, la reprise après pause à 30/60/120 Hz et la conservation des tirs différés. Exécuter aussi les régressions de combat, traînées et fumée ; comparer dans S5Runtime les rafales et reprises sur un mur avant de certifier la récupération native.

## Katana — mobilité, esquive et chute : nouveaux retours du 30 septembre

L’utilisateur a signalé trois défauts supplémentaires : chute finale encore contrôlable, attaque gauche maintenue perdue pendant l’esquive, et déplacement libre appliqué aux trois coups du combo.

1. **Distinguer déplacement au clavier, MoveBox et orientation.** StandardKatana_A_SwordAfterDash1 impose MoveBox ×0 et MoveSpeedRate 2 : seul ce premier coup autorise la marche libre. AfterDash2/3 et Strong imposent MoveBox ×1 : brancher les courbes extraites au déplacement collisionné et bloquer le clavier, sans bloquer la rotation souris. Ne pas traiter « locked » comme « ne peut pas tourner ». Vérifier qu’un coup avance aussi sans aucune touche directionnelle, qu’une touche opposée n’ajoute aucun déplacement, et que tourner la souris oriente pose ET trajectoire. AfterDash2 contient deux contacts, 300/700 ms.
2. **Ne pas confondre durée d’état et vitesse du clip.** KT001/KT026, KT002/KT027 et KT009/KT010 lisent les pistes à vitesse Lua 1,0 ; le MoveBox suit cette même horloge dans chaque phase. Préserver séparément l’ajustement KT000/KT025 historiquement demandé par l’utilisateur. Une courbe de récupération peut repartir à zéro ; l’absence de courbe ne doit pas fabriquer une vitesse persistante.
3. **Tester les actions depuis l’esquive réelle.** MovementInput émet lightLong une seule fois après 200 ms de maintien gauche. Le rejeter parce qu’un dash est actif perd définitivement l’attaque. Raccorder la transition Katana vers Strong depuis les deux phases de l’esquive latérale, au sol/en l’air, et arrêter son ancienne horloge/vitesse. Tester gauche ET droite avec le vrai MovementInput, pas seulement injecter un état final d’attaque.
4. **Lire SetDrop ET SetDelayDrop.** JumpDash indique SetDrop(1,(0,-1000,-3000)), puis SetDelayDrop(1,(0,-5000,0)). Le premier argument est un délai en ms, pas l’instant du contact : l’ancien dropMs=200 venait d’une confusion avec InitAttack1. Appliquer une assignation unique de vitesse, puis remplacer le glissement avant par la chute verticale en récupération. Ne pas garder la première vitesse terminale pour la seconde phase.
5. **Fin d’animation et fin de chute sont distinctes.** À la demande de l’utilisateur, le Katana ne rend pas le déplacement clavier avant le sol durant la chute finale, même si le timer de récupération a expiré. Le canal natif persistant est documenté par l’analyse SetDrop existante ; l’équivalence précise de son signal de sortie avec grounded n’est pas prouvée. Documenter cette partie comme reconstruction fondée sur l’observation utilisateur. Nettoyer ce mode au changement d’arme, à l’atterrissage et lorsqu’une nouvelle action le remplace. Ne pas modifier la gravité globale pour compenser un défaut de contrôle horizontal.

Preuves : tests/katana-movement.test.mjs sur les deux corps à 30/60/120 Hz ; 227 tests ciblés passent avec les régressions des modules partagés et le contrat, build réussi. Scénarios dans le jeu principal : katana-combo-turn, katana-dash-strong, katana-air-fall. La comparaison quantitative avec S5Runtime et le gate natif restent ouverts.


## Correction du diagnostic de provenance Katana — flux chiffré et décodé

Le diagnostic historique « CRC incohérent » de katanaa_strong.seq est résolu : le CRC 9c0e5a85 s’applique au flux protégé provenant de l’archive. Après déchiffrement avec la clé de ressource sauvegardée, le SHA 1dc9de3ef97adc137af03664fa94d78fe52c09fff159a2d63dec00631bb54999 reproduit exactement le fichier déjà structuré. Ne jamais comparer le CRC d’une couche décodée au CRC de la couche externe. Conserver séparément archive, CRC externe, SHA externe, SHA décodé et preuve de parsing exact EOF. Le décodeur accepte désormais --key-file lorsque le dump des sections moteur manque.

L’effet fort est raccordé via le moteur de séquences existant (sept émetteurs et modèle de 25 maillages). Pour les modèles d’effets, activer captureEffectAnimation et transmettre les pistes effectAnimation : importer seulement la géométrie perd morphing, alpha et UV animés. Vérifier ces pistes et l’extinction. La ligne du secondaire est une ressource d’interface : ses CActNodeLoader_IF et CActParticle_IF portent ScreenPosX/Y/Depth et un parent de type 3. Ses fichiers sont maintenant présents ; le blocage est le rendu écran, pas une ressource absente. Ne pas convertir silencieusement ces nœuds en effets monde.


### Scénarios QA : vérifier aussi la boucle des effets

Le 30 septembre, le scénario Katana fort exécutait Controller/MotionGraph directement sans TrainingCombat.tick : l’animation et la traînée apparaissaient, mais aucun événement de séquence de mêlée. Avant de conclure à un effet absent, contrôler que le scénario avance les instances et déclenche le même cue que le jeu. src/main.js corrige ce chemin pour les scénarios visuels. Captures homme/femme strong-effects-065, sans erreur console. Une capture prouve la visibilité ; elle ne certifie pas les sockets, dimensions, axes ou suivi par rapport à S5Runtime.

### Effet partiellement exploitable — Katana aérien

Le 1er octobre : distinguer une dépendance manquante de toute la séquence. katanaa_jump contient trois émetteurs exploitables et un SCN de six maillages : deux utilisent slash03.dds disponible, quatre slash06_1.dds absent de l’extraction et de l’index. Le staging conserve les deux premiers et énumère précisément les quatre omissions ; il refuse toute autre texture manquante inattendue. Aucun remplacement visuel silencieux. Vérifier les pistes effectAnimation, le socket par nœud, le début/fin Lua et l’extinction, puis cadrer l’effet entier dans le jeu principal sur les deux corps. Un effet partiel visible ne devient pas « import complet ».

### Rocket Launcher — cadence et spirale,15 octobre2026

Une vitesse et une fréquence de rotation correctes ne suffisent pas à reproduire
la spirale. F61210 avance un centre float32, applique la phase puis l'expansion
selon le délai restant AVANT décrément.5805F0 prend le haut de caméra comme
décalage initial. Le solveur retire aussi une marge en vol libre. Garder les
unités natives jusqu'à la frontière du rendu et comparer des états successifs,
pas uniquement une capture de trois projectiles séparés.

La normalisation et la transformation D3DX peuvent passer par des implémentations
CPU différentes. Le chemin natif observé emploie RSQRTSS/RCPPS avec une itération
Newton ; un réciproque mathématiquement exact crée déjà des écarts. Conserver
un oracle DLL authentifié et une tolérance explicite. PowerShell peut envelopper
Single[] en objets value/Count et raccourcir les nombres : exporter les floats
comme tableaux de doubles avant JSON, puis valider effectivement le format.

F61210 appelle le collider pointé par projectile+30. Lire projectile+690 comme
s'il contenait directement le collider donne des nombres plausibles mais faux.
Vérifier l'ECX du call en assembleur lorsque le décompilateur perd le this.
Lire les compteurs de contact pour distinguer vol libre et impact :22 positions
libres comparées ne certifient pas les2 contacts relevés. Réutiliser les rapports
`work/rocket-launcher-recovery/native-motion-comparison.json` et sa fiche.

### Bonus aléatoire Rocket —15 octobre2026

Le nom SetGaussRandomDamage ne prouve pas une distribution normale standard.
573B60 effectue un gate de probabilité puis5763D0 moyenne N rand()/32767 en
float64 ;549E70 fait le chemin uniforme avec ses propres arrondis float32.
56D320 ajoute le bonus une fois au début de l'attaque, avant les multiplicateurs
et les bandes. Ne pas tirer de nouveau pour chaque acteur touché par la même
explosion. Le générateur MSVCR120 et les tirages intercalés sont une dépendance
distincte de la formule ;48 cas isolés et8 streams comparés ne valident pas les
PV natifs ou le seed global. Conserver cette séparation dans les rapports.

Une lecture tardive qui retrouve le child Normal ne prouve pas la valeur de
charge maximale. Après3 essais distincts, conserver les lectures précoces et
le détail des tentatives, puis déplacer le travail sur une autre arme. Pour
reprendre, établir touches maintenues, phases et resets d'horloge native avant
de refaire le même scénario. Ne pas remplacer l'horloge interceptée par uptime.

Le décompilateur peut créer une pseudo-fonction en plein milieu d'une instruction
et lui donner un en-tête où l'adresse demandée est égale à l'entrée. L'égalité
des adresses ne suffit donc pas. ExportFunctions refuse désormais la création
d'une fonction inconnue sans prologue standard vérifié ; les fonctions feuilles
non standard nécessitent une preuve d'entrée séparée. Vérification négative
573B6E et constructeur réel6012C0 dans damage-export-guard.log.

### Cannonade — entrée réelle avant lecture, puissance et zoom, 15 octobre 2026

Après le tir initial du worker, attendre un délai arbitraire ne prouve pas que
le maintien suivant a commencé. La reprise exige Normal et ammo>0 avant la
commande, puis le child13AD264 en phase1 avant la lecture. Six cas réussis
sur deux sexes sont conservés dans native-logical-values-v4/v5.json ; les trois
échecs antérieurs restent dans logical-values-blocker.json. La stabilisation
est passée de700 à1800ms, sans attribuer l'échec ancien à un timer précis.

Un getter natif encadré par deux lectures de l'horloge gameplay permet une
comparaison indépendante :49 valeurs en charge,48 au même instant et une
dans une fenêtre de1ms. Ne pas déduire le temps depuis la puissance mesurée
pour ensuite annoncer que la formule retrouve cette puissance. Les six valeurs
libérées utilisent des bornes temporelles plus larges, déclarées séparément.

Le profil équipé observé donne7.203390121459961–36.01695251464844 alors que le
catalogue déclare8.5. Conserver les deux faits ; ne pas inventer une règle
globale de normalisation. Arrondir chaque extrémité en float32 avant la
soustraction ; le maximum natif est indépendamment arrondi. Ni cette courbe
ni les PV de la cible S5 ne prouvent encore les PV natifs, l'armure ou le critique.

Le champ sniper_mode_fov=15 ne suffisait pas : la caméra native observée donne
90→45°, avec bascule au clic droit. Le relâchement et le tir conservent le zoom,
le second clic/changement d'arme le quittent. S5 reprend ces commandes et la
cible45° ; sa transition était immédiate lors de ce premier raccordement.
Le contrôleur766000 interpole l'angle. Ne pas
copier la réponse du sprint. Les24 contrôles natifs du zoom et18 scénarios
principaux/40 contrôles navigateur passent, sans ouvrir le gate de fidélité.

Pour observer le zoom, ne pas employer qaView=profile-wide : ce cadrage fixe
lui-même FOV45 et masquerait une absence de zoom. Utiliser les scénarios
cannonade-zoom et cannonade-zoom-off sans cadrage forcé, puis inspecter les
captures. Preuves actuelles : work/cannonade-recovery/browser-v3/ et les rapports
logical-comparison.json/zoom-comparison.json.141 tests JS et build passent.

### Cannonade — transition de caméra comparée, 15 octobre 2026

Les captures native-zoom-transition-v1/v2.json montrent l'owner1644AC8,
classe13C26D8, puis FPS+C (753E70), classe13C2AD4, alias actif+2C selon51A860.
753F10 renvoie l'objet d'entrée+20 ;765780 un descripteur de type. Un nom de
décompilation hypothétique ne suffit pas à identifier une instance live.

La première cible est bien le catalogue15, avec réponse1.5. Après le premier
angle, la cible exposée devient45. La sortie7681E0 restaure90 avec réponse1.75.
Ne pas reprendre la réponse0.5 du sprint, ni supprimer la première étape15
parce que le zoom stable est45. Le hook externe15→45 reste non décodé ; le
port reprend le profil mesuré, sans généralisation à d'autres armes/équipements.

Le PE76620D convertit un entier en delta ; le code live charge un float64 de
millisecondes. Les sources statiques seules auraient perdu les fractions de ms.
Le bloc SSE d'interpolation et les stores d'entrée/sortie sont inchangés.
Comparer le code réellement chargé aux plages statiques pertinentes et garder
les bytes live/PE séparés.162 changements d'angle échantillonnés sont identiques
au calcul float32 ET au pipeline S5. Les8 changements de paramètres avec angle
inchangé ne sont pas des preuves de frames rendues ; tous les changements
d'angle et les compteurs de lectures incohérentes restent conservés. Le polling
n'est pas un frame hook.

Les rendus QA continuaient d'avancer la caméra après le temps demandé. Pour
tester une transition, initialiser l'angle de référence, avancer la caméra dans
les mêmes ticks que le Controller, puis figer l'angle. Sinon un contrôle à16ms
observerait seulement le résultat final après le chargement.16 captures/112
contrôles browser-camera passent, deux sexes, sans qaView forcé. Le vrai clic
droit normal active/quitte aussi le HUD Zoom ; le Semi Rifle conserve25°.
La sortie de caméra se libère au point fixe float32 pour laisser reprendre le
sprint ; une égalité stricte avec90 ne suffit pas à haut FPS.146 tests JS et
build passent. Gate natif inchangé, toujours non prêt.

### Cannonade — Lightning et mode flottant,15 octobre2026

La précision de l’hôte de l’oracle ne prouve pas celle du jeu. Six requêtes
_controlfp(0,0) sur l’owner de frame natif observent24 bits nearest ; le helper
isolé doit imposer ce mode puis restaurer son contrôle initial.156 updates
scalaires sont alors exacts. Ne pas généraliser aux workers, aux calculs SSE
ou au GPU. La géométrie de l’oracle est stubée : seules les scalaires sont prouvées.

Les champs source donnent3 points, largeur80, jitter0, tiles4, scroll4/s, rise0
et fall500ms. Le muzzle figé au tir dérivait visuellement pendant le recul :
utiliser l’Object3D vivant après mixer. Le point de destination snapshot reste
une politique à comparer au natif. Le state blend6/1 n’a pas encore été traduit
et comparé aux facteurs GPU. Ne pas annoncer le rendu natif certifié.

Un helper CUA fermait sur l’ancien dossier malgré une variable réaffectée :
quatre images historiques ont été remplacées. Conserver les données initiales,
nommer les exclusions et isoler la nouvelle série avec dossier et tableau passés
explicitement au helper ; ne pas prétendre avoir préservé les images remplacées.

## 22 octobre 2026 — gel au contact et faux retard visuel

La Plasma aérienne gelait au stun parce que la pause générique45ms de TrainingCombat.receive arrêtait les contrôleurs tandis que les effets continuaient. Ne pas traiter ce symptôme uniquement en décalant un flash : contrôler l'horloge de l'attaquant lors d'un vrai contact. Pour plasma/air, source sans SetHitStop, cette pause est supprimée ; le stun de la victime reste présent. Les tests vérifient la progression des os après réception du coup sur les deux rigs.

Avec SetDrop et durée d'action tous deux à400ms, lire les branches du tick avant de décider de leur ordre. Le client observé applique l'impulsion, intègre un déplacement, puis remet F0 à zéro au tick de récupération suivant. Effacer la vitesse avant le premier déplacement supprime la descente ; la garder pendant toute la récupération la prolonge indûment. Ne pas confondre ces deux erreurs.

La Spy Dagger illustre un autre décalage : démarrer shortknife01 à0 n'affiche pas son grand modèle immédiatement. Le node commence à200ms et ses clés alpha retardent sa visibilité. Corriger l'ancrage au personnage avancé, sans déplacer deux fois les horloges d'apparition. Rapport et limites : work/spy-plasma-fixes-20261022/analysis.md ;381 tests ciblés et build passent, gates natifs inchangés.

### Plasma, précision du22 octobre : freeze de préparation

Ne pas confondre le gel avant chute avec la pause au contact. Le paramétrage précédent de Plasma utilisait le troisième nombre de SetAnim comme durée substituée. Le setter natif b77990 stocke le PREMIER nombre à+4c ; le troisième va à+3c et sert au padding de transition sortante. Pour A0018,300 et non1000 ; A0019,1000 et non500. Le mauvais calcul terminait le clip après149ms, puis le clamp figeait la pose jusqu'au drop400ms. Tester les vrais os entre160 et400ms, pas seulement l'horloge ni l'animation après le contact. Voir work/plasma-air-freeze-20261022/analysis.md. Cette passe corrige uniquement Plasma ; ne pas déduire la conformité des autres adaptateurs sans examiner leurs propres appels.


## 26 octobre 2026 — égalité du timer Damage18

Séparer l’âge de présentation du compteur de réaction : vingt pas de10ms donnent0.20000000000000004 en secondes JavaScript, ce qui peut libérer trop tôt un verrou200ms. Damage18 ajoute des millisecondes entières et compare sans signe avec un dépassement strict ; transmettre la durée source positive et conserver un compteur propre à chaque entrée admise. Les contacts source0 gardent ce compteur. Les gates actor.virtual3C/F4 restent distincts de cette correction arithmétique. Validation groupée :42 fichiers/299 tests et build ; preuve dans work/melee-pvp-comparison-20261017/capture-expansion-v2/damage18-integer-clock-20261026/.


## 26 octobre 2026 — maintien Dagger et pause partagée

INPUT4 maintenu peut être réévalué ; ne pas effacer lightHeld ni exiger un nouveau clic pour corriger la prise en compte d’une entrée pendant Damage18. La phase de réaction engagée en début d’image empêche l’attaque sur son pas d’expiration. En traitement multi-acteurs, un contact exempté de pause ne doit pas effacer une pause déjà déclenchée par un autre contact. Vérification groupée :50 fichiers/348 tests et build ; portée source conditionnelle documentée dans work/melee-pvp-comparison-20261017/capture-expansion-v2/dagger-received-phase-and-pause-20261026/.
