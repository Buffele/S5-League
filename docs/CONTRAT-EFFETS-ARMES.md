# Contrat de placement et de validation des effets d'armes

## Flammes par attaque et hors attaque — 28 octobre 2026

Demande précisée : les13armes de mêlée. Les138variantes A/B/C restent présentes ;
un choix **F · Flame** est ajouté à chacun des47groupes d'attaques. La ruée
Plasma reçoit uniquement Original/F et conserve son effet spectral. F est une
couche ajoutée : modèles natifs, traînées, particules de contact et audio ne sont
pas masqués. **Keep flames active** est un réglage global sauvegardé avec
Size/Intensity, partagé entre inventaire, Échap et paramètres graphiques.
**Flame color** sélectionne une couleur hexadécimale sauvegardée (bleu par
défaut), appliquée immédiatement à la surface incandescente et au volume, aussi
hors attaque. Le cœur chaud conserve cette teinte ; aucune composante cyan fixe
ne recolore en bleu une flamme choisie rouge/orange/violette.

La couche permanente est indépendante de l'état d'attaque : elle n'en crée
aucun, ne touche pas aux collisions/dégâts et ne déclenche pas de son/impact.
Elle suit uniquement l'arme équipée visible après mixer ; changement d'arme,
avatar masqué, mort et F2 la nettoient. Désactivation normale : fondu550ms.
Avec une ancienne aura Counter/Plasma et le mode permanent, une seule enveloppe
de feu est affichée. Les ressources sont préparées avec le bundle, champs3D
réutilisés par géométrie, surfaces/skins/buffers propres libérés à la sortie.

| Arme | Ancre, pivot et sélection de surface |
| --- | --- |
| Spy Dagger, Bat | Meshes rigides équipés marqués weapon, matrices réelles après mixer |
| Counter | Toutes les pièces des deux scènes counter_sword_r/l ; déploiement OG250ms conservé |
| Plasma | Lame sword ; ruée spectrale conservée, feu ajouté sur la lame |
| Katana | Trois pièces matérielles de katana_a.scn (corps/lame, baem, part1), fourreau case et plans light/uvani exclus |
| Twin Blade | twinsword_r/l indépendants ; respect des alpha source, pas de lame réapparue pendant son absence |
| Breaker | Corps breaker et sa pièce alphatest dans leur attache gauche évaluée ; champs depuis les triangles réels |
| Assassin Claw | Corps vital_shock et vrais talons de vital_shock_hand skinné ; triangles répartis par os d'équipement de poids dominant, champs en bind-bone local, matrices des segments après mixer ; aucun repli sur l'origine acteur |
| Iron Boots | Triangles du vrai ironBoots_normal_foot dont chaque sommet a un poids cumulé Foot/Toe0 ≥.5 ; repère bind-foot local, deux pivots Bip01 R/L Foot évalués séparément. Surface incandescente skinnée exacte, masquée aux mêmes sommets ; jambes exclues |
| Sigma Blade | Champs sigmabalde / sigma_blade, surface incandescente sur leurs pièces matérielles visibles ; forme inactive et plans UV exclus |
| Vital Shock | Champs des sept pièces rigides (carapace, armure et ongles), matière incandescente aussi sur les pièces de doigt skinnées ; chaînes/plans FX exclus |
| Death Scythe | Pièces normal/unique réellement visibles, sans substituer un grand axe |
| Demonic Knuckle | Champs demonic_knuckle_body des scènes r/l, matrices distinctes ; matière incandescente sur leurs doigts/armures matériels aussi |

Pour les bottes, le volume de chaque pied suit le pivot Foot ; sa petite
déformation Toe0 reste une approximation artistique. La surface incandescente
utilise le skinning réellement évalué ; aucun asset source modifié.
Pour les talons skinnés de la Claw, le volume suit les triangles par os de poids
dominant ; le mélange entre os aux articulations reste une approximation. La
matière de surface conserve le skinning exact.
Volumes suivis dans les repères source ; montée du feu verticale monde ; aucun
émetteur de flamme détaché. Le bruit est continu et le rendu ne réémet rien.
Preuves groupées : `work/weapon-flames-all-20261028/README.md`.

## Auras de maintien Counter / Plasma — 27 octobre 2026

Les trois choix du clic gauche maintenu enveloppent désormais les contours
réels des armes, sans copie agrandie ou vague indépendante. Le déploiement OG
Counter (`weapon_counter_upper02`, modèles et événement à250ms), ses particules
et ses sons restent présents avec **tous** les choix. Le clic droit Plasma
spectral n'est pas modifié. Noms des138variantes et contrôles en anglais ; même
préférence par attaque dans l'inventaire et Échap → Weapon effects.

| Composant | Ancre, orientation et espaces | Sortie |
| --- | --- | --- |
| Surface incandescente et halo léger | Copies masquées aux seuls meshes d'arme, matrices et pose évaluées après mixer, échelle1 ; normales skinnées pour la coque, extrusion monde.004/.018m × Size | Toute la surface brûle, pas seulement un trait de contour ; entrée100ms et sortie550ms, aucune géométrie source modifiée |
| Feu continu en volume | Champ de distance préparé depuis les triangles réels de chaque mesh métallique rigide (neuf Counter, un Plasma), proxy suivant exactement sa matrice après mixer. Échantillonnage du champ en repère source, distances converties en mètres par l'échelle minimale, direction de montée verticale monde | L'ensemble du feu suit l'arme jusqu'au terme du fondu550ms ; aucun sprite, aucune naissance de particule ni racine abandonnée en monde |
| Densité et couleur du feu | Intégration40pas dans le volume, bruit3D advecté à plusieurs échelles, carburant continu sur toute la surface et panaches montants. Surface/volume partagent leur bruit ; cœur bleu clair dense et bord bleu saturé, halo discret séparé | Matériaux/champs3D préchauffés, champs partagés par géométrie et libérés à la dernière référence ; assets source conservés |

Size25–300% agit sur l'épaisseur/hauteur de l'aura, jamais sur l'arme ;
Intensity0–250% agit sur ces seules couches, jamais sur le déploiement OG.
Réglages partagés, sauvegardés, visibles dans Settings → Graphics → Weapon aura
et les sélecteurs d'effets. Ils s'appliquent sans redémarrer l'effet source.
Le filtre PCF et les budgets d'ombres globaux restent inchangés : une ombre au
sol plus nette ne change pas la matière de ces flammes auto-éclairées.
Il s'agit d'un champ de feu procédural artistique, pas d'une simulation physique
de combustion. Les volumes utilisent le test de profondeur du proxy et la
surface incandescente couvre le métal ; pas de nouveau tampon de profondeur ou
d'éclairage dynamique global. Échelle minimale : approximation bornée pour les
pièces Counter légèrement anisotropes, placement du proxy exact.
Preuves et limites : `work/counter-effects-menu-20261027/README.md`.

L'entrée dans le laboratoire d'animations F2 est une sortie de l'action locale,
pas une suspension du coup. Annuler l'action et ses handles, vider ses effets
écran, réinitialiser le graphe/pose d'aperçu, puis conserver position, PV, SP,
équipement et effets des autres propriétaires. Fermer l'aperçu ne relance pas
l'ancienne charge. C'est une politique du laboratoire S5, distincte d'un menu
de pause conservant la partie. Preuve : `animation-lab-melee-exit`.

## Variantes artistiques sélectionnables —26octobre2026

**27octobre2026 — correction Counter et extension à neuf familles :** la
suppression globale des CActNodeLoader masquait aussi l'arme bleue déployée du
clic maintenu. `weapon_counter_upper02` garde désormais ses modèles et son
événement250ms, avec les trois habillages. Pour les nouvelles familles,
conserver toutes les séquences structurelles, modèles, particules et sons ;
le ruban d'attaque est remplacé par les nouvelles couches explicites. Aucun
effet déjà présent ne devient absent par simple changement de préférence.

| Nouvelle famille | Ancre / orientation / pivot | Composantes conservées et sortie |
| --- | --- | --- |
| Katana | Mesh exact katana_body, jamais le fourreau ; extrémités locales après mixer, base côté R_Hand_Dummy ; prismes, éventails ou plumes courbes dans ce repère | Deux charges natives, séquences de frappe, effets écran et contacts conservés ; nouvelles couches en fondu |
| Twin Blade | Deux twinsword_r/l évalués séparément ; filets reliant les vraies pointes, copies des deux scènes | Chaînes et lames projetées natives conservées ; respect des alpha0 des lames tenues |
| Breaker | Base L_Hand_Dummy et tête HM_DMGeffect_Dummy résolue dans breaker.scn/model breaker ; plaques/disques/entonnoir centrés côté tête | Séquences aériennes et vrai impact de surface conservés ; aucune surface inventée |
| Assassin Claw | Mesh vital_shock exact, bounds dans sa matrice ; trois talons, cage électrique ou boucles ; approximation S5 explicite, Line01 absente | Contacts et leurs particules/sons conservés |
| Iron Boots | Deux paires Foot/Toe0 de sommets pondérés du modèle de pied exact, getVertexPosition après skinning ; pas le mesh de jambe ni l'origine acteur | Modèles de boost/glissade et leurs horloges conservés ; pieds indépendants |
| Sigma Blade | sigmabalde normal et sigma_blade transformé ; visibilité évaluée par la forme existante ; barres, treillis ou arcs | Transformation et séquences natives conservées ; pas de réapparition de la forme cachée |
| Vital Shock | Mesh rigide vital_shock_hand_cat_nolight exact après mixer ; aiguilles, croissants ou boucles de tension | Séquences de frappe/ruée et contacts conservés |
| Death Scythe | Line01 P/P+V convertie par inverse(ModelData)×Shape vers la vraie lame ; matrice du modèle évalué ; jamais le grand axe du manche | Modèles de spéciale/finition/ascendant et alpha source conservés ; coordonnées locales vérifiées contre l'asset courant |
| Demonic Knuckle | Deux demonic_knuckle_body, chacun dans sa scène r/l après mixer ; arceaux de phalanges, pistons ou volutes | Frappes alternées, protection et séquences des deux bras conservées ; aucune modification d'attache |

Pour les neuf familles : émetteurs suivis dans les repères ci-dessus, anciens
échantillons/échos/fragments en monde, pas de nouvelle naissance au recalage
de rendu. Motifs continus et déterministes ; arrêt d'émission puis fondu300ms,
historique borné, purge au changement/reset/mort. Préchauffage avant exposition,
libération des buffers/copies sans détruire les assets prêtés. Les fenêtres de
dégâts et commandes restent celles du contrôleur existant. Rapport :
`work/melee-art-expansion-20261027/README.md`.

Correction du27octobre2026 pour Counter : une arme composée de deux scènes
doit recevoir le traitement sélectionné sur les deux. Conserver une base/pointe,
un historique monde et un repère après mixer propres à chaque pièce. Les copies
de pose incluent les deux scènes ; garde B/C également représentée sur le plan
de la lame droite, sans recopier la matrice du bras gauche. Les lignes ci-dessous
qui séparent les repères gauche/droite ne limitent plus le rendu à une seule
partie. Preuves : `work/counter-art-both-parts-20261027/README.md`.

Autorisation utilisateur :36variantes S5, par attaque, Dagger → Counter → Plasma
→ Bat. Le clic droit Plasma spectral reste hors de cette sélection. Les sons
de frappe et de contact restent ceux de la banque et des contacts existants,
y compris les SetPlaySound(false) de certains contacts. Ces alternatives ne
constituent pas une restauration/certification native.

| Composant | Ancre, orientation et pivot | Espaces / fin |
| --- | --- | --- |
| Fil / ruban de coupe | Mesh de l'arme équipée après mixer ; Dagger utilise les deux points mesurés du tranchant, autres armes les extrémités de la plus grande dimension du mesh, base départagée par distance à R_Hand_Dummy | Points émis en monde, interpolés Catmull-Rom ; anciens points restent fixes, vie.19–.4s et fondu ; approximation artistique pour les armes hors Dagger |
| Filets et énergie de lame | Même base/pointe évaluées ; courbes continues le long du tranchant, ou remontant depuis la pointe en aérien | Géométrie suivie, variation continue sans hasard par image ; fondu de sortie300ms |
| Échos arme / main / corps | Copie de pose et des matrices après mixer, squelette indépendant, pivot monde capturé ; masque main autour de la base de lame, garde à gauche et lame droite distinguées par scène source | Copies figées dans le monde, géométrie partagée non détruite ; durées.43–.95s, opacité progressive |
| Distorsion Dagger | Surcouche du mesh/pose évalué, déformation et dissolution continues dans le shader | Distorsion stylisée de la silhouette, pas une réfraction du framebuffer ; extinction progressive |
| Garde Counter | Centre du mesh Counter_Sword de counter_sword_l.scn évalué ; grand/deuxième axe du mesh définissent le plan, normale orientée vers l'extérieur, décalage12cm | Plaques/filets suivis de la protection réelle ; toute la scène gauche pour la surcouche, pas la lame droite ; fondu300ms |
| Vent ruée / rotation | Ruée : origine personnage justifiée par le sillage corporel voulu, orientation réelle de l'acteur ; rotation Bat : tourbillon autour de l'acteur | Filets suivis et courbes, points historiques/échos restent monde ; aucune modification du déplacement |
| Fragments de lame | Naissance sur un point interpolé entre base et pointe post-mixer ; vitesse déterministe dans le repère de l'arme/acteur | Fragments en monde détachés, buffers bornés, vie.30–.43s ; le rendu ne réémet pas |
| Contact cible / décor | Même point que le contact existant ; normale du décor quand disponible ; aucun impact artistique à l'origine acteur si le contact manque | Éclats détachés ; durée.42–.65s ; audio existant et étincelles natives conservés |
| Impulsion au sol aérienne | Seulement après le seuil d'activation et si le propriétaire a réellement touché le sol ; raycast borné50cm sous lui, point et normale réellement trouvés | Plan du sol, transformation figée ; anneau bas ou ramifications pour C ; ni cratère ni collision ajoutés |

Tous les effets sont préparés et précompilés avec le bundle de l'arme avant le
combat. Le rendu interpolé recale les couches suivies sans capture de fantôme
ni émission supplémentaire. Annulation : émission stoppée et fondu ; changement,
mort et reset nettoient le propriétaire. Libération du bundle détruit les
buffers/matériaux/skins des copies sans détruire les géométries de l'avatar.
Les banques audio ne sont jamais remplacées par les préférences visuelles.
Catalogue et limites : `work/weapon-effect-variants-20261026/README.md`.

Ne pas désactiver le brouillard d'une traînée acteur par défaut. Le producteur
XML générique B94D60 → 982170 conserve FogEnable=true depuis112AEA0 ; le
contrôleur le transmet au preset puis au périphérique. Les bindings Twin
type26, Sigma type38 et Demonic type47 suivent ce chemin. Leur matériau S5
hérite du brouillard de la carte et prépare les variantes none/linear/exp2.
Cela ne qualifie ni les paramètres natifs du brouillard ni la seconde passe
flag22. Preuves : `melee-trail-fog`.

La réserve d'effets doit tenir compte des participants, pas seulement de la
présence d'une arme dans le cache. L'entrée en combat S5 réserve deux
activations simultanées par participant et prépare les exemplaires ajoutés
avant de créer le combat. Les familles chargées ensuite héritent de cette
capacité ; les relances ne la reconstruisent pas. Ce budget de préparation
n'est pas un maximum natif : une rafale supérieure reste affichée par le
chemin d'extension existant, sans voler une instance active. Cas réel de
déclarations : trois Scythe peuvent lancer six appels de spéciale identiques.
Preuves et limites : `melee-participant-effect-reserve`.

Pour les séquences suivies des armes de ce chantier, séparer l'avancement des
particules existantes et la naissance des nouvelles. Lorsque le combat avance
avant le mixer, réserver le nombre d'émissions puis les créer au socket évalué
de leur propriétaire. Le passage post-pose consomme cette réservation une seule
fois ; le recalage de présentation ne doit ni émettre ni déplacer les anciennes
particules monde. Les pauses gardent l'émission immédiate sur la pose figée.
Lot `melee-post-pose-emission` ; aucun espace local/monde ni suivi natif nouveau
n'est déduit de cette correction d'ordre.

En combat multi-acteurs, déclencher les effets de chaque personnage après
l'évaluation de sa propre pose et de ses équipements. Le joueur local est
traité par `animateAvatar` ; les adversaires Chaser et Battle Royal le sont
après leur mixer dans la boucle de combat. Une séquence figée déclenchée avant
la pose peut conserver les matrices de l'image précédente et ne sera pas
repositionnée par un second appel. Preuve : `multi-combat-effect-pose` ; ce
contrôle d'ordre ne valide pas à lui seul le rendu ou la fidélité au jeu de
référence.

La décision de ne pas réentrer dans une réaction de victime ne doit pas
supprimer l'effet déclaré d'un coup de mêlée accepté. Utiliser le même point
de contact que la branche réactive, sans provoquer de nouveau mouvement,
son de réaction ou pause. Les effets des projectiles gardent leur voie propre.
Voir `melee-retained-impact` pour le cas de protection Demonic.

Pour les impacts de décor des armes de mêlée encore en finition, l'orientation
S5 conserve la convention existante « axe local -Z vers la normale » et la
prolonge aux sols et pentes, au lieu de ne conserver que l'angle horizontal.
Le point reste celui de la collision et la matrice est figée au déclenchement.
Cette convention est une politique de présentation S5, pas une preuve du
repère natif de chaque ressource ; les sondes de collision restent approchées.
Les profils Plasma, Spy Dagger et Counter validés par l'utilisateur gardent
leur chemin précédent. Preuves et limites : `melee-surface-orientation`.

Une séquence peut associer des particules directement à une main et un modèle
séparé à deux parents animés internes. Qualifier le modèle et chaque émetteur
indépendamment : le suivi de la main ne restaure pas automatiquement le clip
du modèle. Cas Demonic secondaire, action12 : `Cs_Wea_Dummy` puis
`demonic_knuckle_body_Dummy` ; racine externe conservée séparément. Pivots,
espace de particules et sortie sont documentés dans `melee-secondary-hierarchy`.

Un alpha nul ne suffit pas à supprimer une soumission de dessin : un matériau
transparent peut encore écrire la profondeur. Sur les scènes qualifiées,
appliquer la garde ModelData au produit d'alpha représenté par le renderer,
avec la constante partagée `MODEL_ALPHA_DRAW_THRESHOLD`. Supprimer le dessin
du matériau, sans masquer l'objet parent ni arrêter ses descendants. Le
préchauffage conserve le matériau réel pour garder son programme compilé.
Lot `melee-zero-draw-batch` ; les facteurs natifs hérités restent à qualifier.

Pour les événements qualifiés sur l'horloge d'état, déclencher après le seuil
strict et convertir explicitement secondes/millisecondes. Une horloge absente
ne qualifie aucun événement. Garder séparées ces règles et celles des cues de
présentation/contact ; le seuil ne prouve pas tout l'ordonnanceur natif.
Preuves : `melee-event-clock-batch` et consommateur commun des événements.

Une racine externe attachée à la scène du personnage ne remplace pas les
parents internes d'une séquence. Qualifier chaque action par son parent réel,
après association à l'acteur propriétaire. Cas Demonic : les deux griffures
et les actions 1/4 de l'aérien suivent cette scène ; les actions 0/2/3/5 de
l'aérien gardent leur dummy. Une topologie interne mesurée ne prouve pas toute
sa politique de matrices ou de dessin. Preuves : lot `melee-root-follow-batch`.

Les modèles équipés peuvent avoir les mêmes noms sans être le même nœud.
Conserver les couches d’effet par index/identité de ModelData et leur pose propre.
Un matériau et une courbe alpha indépendants ne corrigent pas une attache
encore partagée par nom. Cas Sigma :12feuilles sous des parents uniques,
repères propres et absence de double transform contrôlés après mixer.
Preuves : `sigma-equipped-model-indices`.

Une pièce invisible peut rester le parent animé d'une lame ou d'un effet.
Séparer la garde de son dessin de l'activation de ses descendants. Sur Scythe,
la pièce deathscythe_unique a alpha0 tandis que deathscythe_normal doit rester
visible et animé. Une liste floatKeys vide peut signifier une entrée absente
du catalogue natif, pas la valeur1 ; qualifier la sélection avant de la remplir.
Preuves : lot `scythe-equipped-visibility` et son contrôle statique indépendant.

Vérifier aussi l'effacement du modèle équipé pendant un effet de remplacement.
Twin SG012/SG014 masque ses lames tenues avec alpha0 pendant que les chaînes
portent leurs propres lames. La garde native précède le dessin, y compris pour
un matériau opaque. Préserver séparément alpha animé et visibilité gérée par
le jeu, puis restaurer BASE à la sortie. Preuves : lot `equipped-binary-opacity`.

Les couches intégrées au modèle peuvent également avoir leurs propres
courbes alpha. Un matériau additif correct à opacité fixe ne restitue pas les
fondus source. Conserver ces pistes par index de modèle, même si plusieurs
pièces ont le même nom, et les raccorder au temps évalué de l'équipement.
Cas Sigma : 15 couches, complément authentifié, lot `equipped-opacity`.
Un nom uvani ne prouve pas qu'un bloc morph possède des UV animées.

Extension du 25 octobre 2026 : la chaîne aérienne Twin est qualifiée
séparément du lourd, par six graphes actifs. Même contrat de suivi de racine,
mais clip `base` et helpers Box02/Box01 propres à sa source. Ne pas réutiliser
les pistes du lourd par ressemblance. Preuves : lot `twin-air-chain`.

Référence opérationnelle, 25 octobre 2026. À lire avant toute correction ou
intégration d'effets. Ce contrat complète C03/C06/C08/C12 du contrôle d'import.
Il capitalise les retours en jeu ; une présence dans les assets, une matrice
finie ou un build réussi ne suffit pas à valider le rendu.

Mise à jour utilisateur du25octobre2026 : effectuer les nouveaux contrôles sur
un seul personnage, sans doublonner les captures/essais par sexe. Les anciennes
preuves M/F restent valides dans leur périmètre ; conserver les tests existants.

## 1. Décrire chaque composant de chaque action

Inclure les composants permanents intégrés au modèle équipé : plans lumineux,
pointes transparentes et autres couches régies par renderState, même sans
événement SEQ. Qualifier leurs matériaux, éclairage, ombres et contours depuis
le SCN authentifié. Cas Vital Shock : lot `vital-equipment-materials`.

Pour un effet articulé, inventorier aussi les nœuds invisibles, ModelData
sans sommets et modèles sans texture qui portent pourtant une animation.
Conserver poids et matrices de bind ; chaque copie du pool possède ses os
et son squelette. Précompiler la variante de shader skinnée, sans la remplacer
par un proxy rigide. Cas livré : lourd Twin, lot `twin-chain-node-mapping`.

Créer une ligne distincte pour charge, maintien, libération, chaque coup de
combo, aérien, traînée, contact cible, contact décor et extinction, lorsqu'ils
existent. Une attaque peut combiner plusieurs séquences et plusieurs repères.

| Champ obligatoire | Ce qu'il faut établir |
| --- | --- |
| Événement et source | État, fonction, appel, dépendances récursives et décision de raccordement |
| Départ et fin | Instant de l'événement ET délai interne de chaque nœud ; durée et fondu séparés |
| Ancre | Scène équipée, modèle et socket exact, contact réel, surface ou acteur explicitement justifié |
| Repère source | Pivot exporté, transformations parent/enfant, unités et axes |
| Orientation | Arme animée, normale de surface, direction du tir, acteur ou billboard selon le composant |
| Suivi | Position/orientation figées à l'émission ou suivies à chaque pose |
| Particules | Émetteur suivi/détaché et particules locales/monde décrits séparément |
| Sortie | Fin normale, interruption, changement d'arme, mort et reset |
| Preuves | Résultat numérique, observation homme/femme dans le jeu principal, comparaison au Jeu référence |

Un événement absent doit avoir une raison sourcée. Un événement non résolu
reste ouvert avec son blocage précis. Une indication générale « effets présents »
ne remplace pas cet inventaire.

## 2. Choisir le bon repère

Une racine SCN de personnage est distincte de sa position logique et de Bip01.
Pour les seuls cas observés, actorSceneRoot reprend la matrice du rig après
évaluation, y compris l'échelle du modèle. Preuves du lot `melee-actor-scene-follow` :
14poses actives Twin/Sigma/Scythe. Un parent déclaré ou une pose initiale non
évaluée ne suffit pas à autoriser cette politique sur d'autres effets.

| Composant | Règle de positionnement |
| --- | --- |
| Effet attaché à l'arme / charge / énergie aérienne | Socket ou nœud de l'arme équipée, évalué après le mixer ; suit la pose et les rotations prévues |
| Traînée d'arme | Forme ou extrémités réelles de la pièce animée ; échantillonner le mouvement courant, conserver puis dissiper les anciens segments |
| Impact d'arme | Point d'impact de l'arme ou contact établi ; figer la transformation au déclenchement pour que l'impact ne parte pas avec la main |
| Impact de projectile | Même contact que celui des dégâts ; orientation tir/surface établie, pas un second calcul divergent |
| Fumée ou étincelles émises en mouvement | L'émetteur peut suivre le socket tandis que les particules déjà émises restent dans le monde |
| Effet de sol | Point de contact et normale de la surface si ce comportement est établi ; ne pas confondre origine du personnage et contact au sol |
| Aura centrée sur le personnage | Origine acteur admise seulement si c'est bien le comportement attendu de ce composant |

Ces règles n'imposent pas un socket d'arme aux explosions, auras et effets de
surface. Elles imposent une décision explicite et vérifiée pour chacun.
L'absence de socket requis doit provoquer une erreur localisable ; ne jamais
revenir silencieusement à la position du personnage ou à une main voisine.

## 3. Conserver la transformation complète

Évaluer l'animation du propriétaire de l'effet avant de lire son socket.
Poser l'adversaire ne signifie pas que le joueur est posé. Les deux ont leur
propre ordre d'évaluation. Après interpolation ou modification de pose, recaler
les effets suivis sans avancer leur horloge ni émettre une seconde fois.

Le suivi des os (`followBones`) et celui de la racine (`follow`) sont distincts.
Recaler aussi une main suivie avec racine figée. Le recalage final doit passer
après PoseBuffer, orientation de présentation et transitions d'équipement,
avant le rendu. Un test qui pose systématiquement l'avatar avant le tick des
effets peut manquer ce défaut d'ordre. Preuve groupée :
`work/weapon-polish-20261025/effect-presentation-batch/README.md`.

Contrôler séparément les routes joueur et adversaire : sélection réelle de
l'arme, préparation de son rig/effet, mise à jour et publication du rendu. Un
adaptateur chargé pour le joueur ne remplace pas automatiquement le ruban
générique construit dans le combat adverse. Quand le renderer a un `render`
séparé, `update` seul ne publie pas sa géométrie. Pour un avatar en cache, la
vue de combat emprunte le ruban : elle nettoie/détache lors de sa destruction,
tandis que le propriétaire du cache dispose les ressources à la fermeture.
Vérifier une réattache et une préparation qui finit après fermeture.
Pour les traînées constituées de plusieurs maillages masqués, ne pas compiler
uniquement l'avatar : préparer chaque matériau/buffer via un proxy visible,
sans rendre les instances actives ni avancer leurs horloges. Le lot de six
adversaires et `trail-mesh-warmup.js` réutilisent cette préparation côté joueur.
Ne pas confondre destruction de vue et retour manuel à la salle d'attente :
ce dernier peut conserver la session et sa vue. Tester le parcours réel en
plus du test `dispose`/réattache ; ne pas en déduire un reset des HP ou du match.
Arrêter aussi la boucle de présentation avant la destruction des rigs : une
frame déjà planifiée peut sinon réactiver une animation mise en cache sur un
mixer libéré. Distinguer fermeture terminale et cache arrière du navigateur,
où la page et ses ressources sont conservées. Tester le callback réel après
l'événement de fermeture, pas seulement le nombre d'appels à `dispose`.

Résoudre la hiérarchie réelle, y compris les ModelData animés et les dummies
sans maillage. Un parent présent dans les données peut manquer au renderer.
Un nom de nœud ne prouve ni son propriétaire ni son repère.

Une racine typée SCN ne prouve pas le graphe complet d'un NodeLoader actif.
Sur Bat, la lecture native montre un conteneur a0015 à identité au-dessus du
Shape chargé : le reset du conteneur n'efface pas la pose du Shape enfant.
Comparer le parent réel, les flags, la matrice du Ghost et la matrice du Shape
pendant l'activation. Un Shape conservé dans un cache sans parent valide peut
garder une ancienne matrice ; elle ne prouve pas un suivi. Preuve et raccordement :
`work/weapon-polish-20261025/bat-active-sequence-native/README.md`.

Cas Storm Bat : les chargeurs de modèles existaient, mais leurs dummies sans
maillage n'étaient pas construits. Les particules ne trouvaient donc pas leur
parent et revenaient à la racine du chargeur. Vérifier aussi les dummies qui
ne rendent aucun pixel et leurs pistes animées. Pour une séquence qualifiée,
refuser explicitement un parent nommé absent ; tester le mouvement réel de
l'émetteur avec un interpolateur indépendant du renderer.

Même défaut rencontré sur cinq scènes Vital Shock, Demonic Knuckle, Iron Boots
et Death Scythe : les modèles portaient leurs pistes, mais leurs parents Bone
étaient omis. Le lot `melee-effect-hierarchy.js` restaure explicitement les
hiérarchies uniques sélectionnées et leurs clips, sans modifier les sources.
Ne pas l'activer sur tous les SCN : certains ont des noms de modèles dupliqués.
Leurs indices source doivent rester distincts ; un dictionnaire par nom peut
fusionner des pièces ou créer un cycle. Le présent lot les laisse inchangés.

La suite du lot utilise des clés internes fondées sur l'index source pour six
scènes dont seuls les noms de modèles feuilles sont répétés. Les objets visibles
gardent leur nom, leur géométrie et leur piste par index ; seuls les identifiants
privés de l'évaluateur changent. Un parent désigné par un nom répété reste refusé.
Ne pas confondre «deux feuilles portent le même nom» et «le parent est ambigu».
Preuves : `tests/melee-effect-hierarchy-batch.test.mjs`, lot `indexed-melee-effects`.

Un pivot de modèle exporté à plusieurs centaines d'unités et un décalage déjà
inscrit dans l'émetteur doivent être pris en compte lors du raccordement au
socket. Appliquer une seule conversion d'origine et d'unités. Conserver les
assets source et exprimer l'adaptation dans un consommateur identifiable.
Ne pas cumuler le décalage acteur et le placement d'impact de l'arme.

Pour un impact détaché différé, prélever sa transformation au véritable départ
visuel. Un AddSequence à 500 ms avec un émetteur à +100 ms ne signifie pas
que l'arme frappe à 500 ms. On peut reporter le snapshot à 600 ms et retirer
100 ms aux fenêtres de la séquence, avec un test prouvant que les temps
absolus de tous les départs/fins sont inchangés.

Pour les traînées, vérifier les points contre la pièce visible : des coordonnées
déjà exprimées dans le repère de la lame ne doivent pas recevoir une seconde
matrice de placement du Shape. Le Breaker en a fourni le contre-exemple : les
points correspondaient aux coins de la tête, puis la transformation superflue
les ramenait vers le manche. Tester cette relation sur le maillage après pose.

Ne pas transformer ce constat en règle universelle « ignorer Shape.matrix ».
Le Katana classique exige au contraire cette matrice : appliquée à P/P+V,
elle place les extrémités à moins de 4,5 unités des vrais sommets de la lame.
La paire brute et inverse(ModelData.matrix) × Shape.matrix échouent à ce
contrôle. Le consommateur utilise le maillage de lame évalué, jamais le premier
maillage d'équipement (qui peut être le fourreau). Preuve numérique M/F et
captures : `work/weapon-polish-20261025/katana-actor-trails/`.
Ce contrôle géométrique ne certifie pas l'ordre interne des matrices natives.

Pour AddGhostTrail, distinguer délai et durée après activation : le second
entier ne constitue pas une date de fin absolue. Tester le franchissement strict,
la durée depuis le tick d'activation et la sortie. Un départ à délai zéro doit
recevoir une histoire initialisée sur la lame évaluée ; aucun ruban vers l'origine
du monde après changement de salle. Documenter cette initialisation S5 lorsque
le constructeur natif n'est pas établi.

Régression concrète Iron Boots/Demonic Knuckle : `600,600` signifie attendre
600ms puis émettre durant600ms, pas une fenêtre vide. L'ancien consommateur
supprimait ainsi le pied gauche du premier coup ; il raccourcissait aussi les
traînées aériennes Demonic. Les adaptateurs de rubans reconstruits utilisent
désormais une même requête nominale délai+durée. Cette requête en temps écoulé
ne certifie pas la cadence du wrapper natif uint32, contrairement aux adaptateurs
natifs qui possèdent leur propre timer. Ne pas confondre ces deux niveaux.

Contrôler aussi la rotation des positions ET des vitesses locales des
particules. Une translation correcte avec une émission encore en axes monde
reste un défaut. Les billboards et les plans de surface conservent toutefois
leur convention propre. Tester plusieurs orientations, pas seulement face caméra.

## 4. Préserver le rendu et le cycle de vie

Charger modèles, textures et pistes de transformation, alpha, morphing et UV.
Respecter billboard, fusion et profondeur. Un rectangle lumineux peut venir
de pistes alpha perdues, même si la texture a été chargée.

Un panneau sombre peut aussi provenir du mélange : une texture RGB émissive
à fond noir ne devient pas transparente en activant seulement `transparent`.
Isoler le ruban de la séquence avant de changer les modèles ou leurs pistes.
Respecter les facteurs établis par la source ; ne pas appliquer un mélange
universel à toutes les armes. Lot Iron Boots/Demonic/Assassin Claw :
`work/weapon-polish-20261025/ironboots-dark-panels/README.md`. Le choix additif
Iron Boots corrige une reconstruction S5 ; ses bindings natifs restent ouverts.

Préparer les effets avant de publier le bundle de l'arme, partager les
ressources immuables, réutiliser les buffers et éviter les chargements au
premier contact. Chaque instance garde son horloge et ses particules propres.

Préparer les textures des matériaux sur le GPU, et compiler avec des proxies
visibles dans le contexte de la scène cible. Ne pas rendre visibles les
instances du pool pour les compiler : des préparations concurrentes peuvent
restaurer des états différents. Retirer les proxies en sortie normale ou en
échec, sans disposer les géométries, matériaux ou textures empruntés.

Un nom de forme déclaré dans le XML ne prouve pas sa présence dans le modèle.
Assassin Claw type20 annonce Line01, absent du modèle converti courant : le
ruban S5 existant reste explicitement approximatif, même après préparation,
correction délai50 + durée350 et raccordement à l'adversaire. Ne pas présenter
les extrêmes du volume du mesh comme une forme native récupérée.

Interrompre l'émission ou détruire l'instance selon son contrat de sortie.
Ne pas appliquer la durée d'une traînée à toute une séquence aérienne, ni
effacer automatiquement les projectiles détachés lors d'un changement d'arme.

Une référence au pool ne suffit pas à posséder une activation : après nettoyage
ou expiration, la même instance peut appartenir à un autre acteur. Vérifier
l'identité de l'activation avant une annulation tardive et retirer les registres
locaux/globaux lors des nettoyages. Pour les textures animées, préparer toutes
les images, pas seulement celle présente sur le matériau au préchauffage ;
ne pas démarrer le contrôleur aléatoire pour les parcourir. Lot et preuves :
`work/weapon-polish-20261025/effect-pool-lifecycle-batch/README.md`.

## 5. Vérification exigée avant validation

**Audio,25octobre2026 :** séparer son d'état (AddSound/AddSequence), son
d'activation de volume (SetAttackSequence) et impact confirmé (SetDamageSequence).
Ne pas rejouer un son d'état à chaque volume ; conserver chaque argument
sonore déclaré même si sa séquence visuelle manque. Fermer aussi les ressources
des attributs de dégâts acteur/décor, pas seulement celles des états. Les
fichiers de charge disponibles sans événement actif ne doivent pas jouer par
déduction. Lot exécuté : `melee-audio-events`, Twin/Bat/Breaker/Iron Boots.

Comparer les quatre arguments de SetDamageSequence : effet acteur, effet
décor, son acteur et son décor. Un champ damageObjectSound explicite prime
sur damageSound, y compris null. Cas livré : Bat aérien bat_hit1/bat_hit.
Le contrôle partagé `tests/melee-contact-presentation-batch.test.mjs` couvre
les déclarations actives et distingue alias/silences/exclusions ; il ne
certifie ni les pixels, ni le placement, ni le consommateur natif des flags.

**Parents homonymes,25octobre2026 :** distinguer le conteneur SCN des modèles
et os nommés. Un parent égal au nom d'en-tête peut viser ce conteneur avant
les enfants homonymes (observé sur Sigma). Qualifier l'alias depuis les sources
authentifiées, préserver les index des modèles, et ne pas exécuter un premier
raccordement générique qui pourrait créer un cycle avant l'évaluateur qualifié.
Death Scythe applique ce cas à deux scènes, Sigma à son fort transformé.
Contrôler le graphe S5 réel : même sans Bone, ses maillages peuvent avoir été
reparentés par nom avant l'animation (cas des11enfants erronés sur Sigma).
Les doublons d'os de Twin ne sont
pas résolus par cette règle. Preuves : lot `melee-active-hierarchies`.

Observer chaque composant avant, pendant et après son événement, sur homme
et femme, à plusieurs orientations et en déplacement. Exercer contact et coup
raté, maintien/libération, interruption et changement d'arme selon applicabilité.
Vérifier que le scénario passe par la boucle d'effets du jeu principal.

Les tests numériques doivent mesurer une relation utile : centre de l'impact
contre socket/contact attendu, distance au socket pendant le mouvement,
rotation de l'émission, stabilité de l'impact après départ de l'arme,
persistance des particules monde et extinction. Comparer une formule à sa
copie ou vérifier seulement l'absence de NaN ne prouve pas le placement.

Consigner séparément source, adaptation demandée, test automatique, observation
dans S5 et comparaison au Jeu référence. Une correction utilisateur invalide
la conclusion précédente sur le point concerné, même si ses tests passaient.

Comparer des états initiaux équivalents : hauteur des pieds, phase du saut,
orientation et instant depuis l'attaque. Un scénario QA qui démarre directement
à4m ne représente pas automatiquement un saut ordinaire. Un effet hors champ
ne prouve pas son absence ni un défaut d'ancrage. Lors d'une capture native,
enregistrer la fenêtre réellement mesurée, pas seulement le temps demandé.
Pour distinguer snapshot et suivi, exiger un déplacement réel mesuré pendant
la visibilité de l'effet ; une animation de marche ou une entrée acceptée ne
suffit pas. Cas : `work/weapon-polish-20261025/bat-reference-comparison/README.md`.

## Cas capitalisé : Breaker, 25 octobre 2026

Pour les gants Demonic, deux Line01 et deux fenêtres ne doivent pas partager
une seule horloge d'émission : en aérien, la droite et la gauche ont des
durées différentes. Évaluer chaque forme après le mixer de son propriétaire,
enregistrer ses anciens échantillons dans le monde et arrêter l'émission sans
effacer brutalement le fondu lors d'une sortie ordinaire. Le reset et le
changement d'arme effacent les deux historiques. Le profil du producteur XML
commun ne prouve ni la matrice native exacte, ni une seconde passe GPU.
Preuves : `work/weapon-polish-20261025/demonic-native-trails/README.md`.

Le premier raccordement avait conservé une origine acteur générique. Le lourd
émettait avec son décalage source de -600 en Z ; l'aérien gardait les pivots
éloignés de ses modèles et perdait ses pistes alpha. Les tests vérifiaient
l'existence de la hiérarchie sans mesurer sa relation à l'arme. Le test d'ordre
confondait aussi la pose de l'adversaire avec celle du joueur.

La correction demandée utilise `HM_DMGeffect_Dummy` de la scène équipée
Breaker. Le lourd interroge la surface sous ce socket sur une portée de 3 unités
(portée d'arme source 500 × 0,006), puis fige le point et la normale touchés à
l'événement, avec origine d'émission recentrée. Aucun choc de sol n'est créé
si cette requête ne touche aucune surface. L'aérien suit le socket, ses modèles sont recentrés et
ses courbes de rendu sont récupérées. Le suivi est recalé après la pose sans
faire progresser deux fois la simulation. Cette politique de présentation est
une correction utilisateur ; elle n'est pas présentée comme une preuve du
consommateur natif de l'appel de séquence.

Régression : `tests/breaker-effect-attachment.test.mjs` (vrais rigs M/F,
quatre orientations, impact sur une plateforme surélevée, normale de pente,
absence de sol, impact figé, suivi animé, rotation des particules, alpha,
nettoyage et reproduction des pistes décodées). Les branches encore absentes
restent listées dans `docs/imports/breaker.md`.
