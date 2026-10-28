# ARMES — état de la version jouable

26 octobre 2026 : traînées Twin/Sigma/Demonic raccordées au brouillard de la
carte selon FogEnable du producteur XML commun, avec préparation des variantes
none/linear/exp2. Dix fonctions/six bindings authentifiés, contrôles groupés et
build réussis ; attaque Twin observée dans le jeu principal. Paramètres et
pixels natifs restent à comparer. [Lot](work/weapon-polish-20261025/melee-trail-fog/README.md).

26 octobre 2026 : réserves d'effets dimensionnées aux participants avant le
combat, puis conservées lors des relances et préparations d'autres armes.
Le burst de six effets déclarés par trois Scythe réutilise six instances déjà
préparées ; 29 contrôles groupés et build réussis, combat ordinaire contrôlé.
Le budget de préparation ne limite pas les effets rendus et ne prouve pas un
gain global de FPS. [Lot](work/weapon-polish-20261025/melee-participant-effect-reserve/README.md).

26 octobre 2026 : émissions des séquences suivies de mêlée recalées après la
pose propre de chaque acteur. Les particules existantes continuent leur
trajectoire ; les naissances réservées ne sont consommées qu'une fois, jamais
par le recalage de rendu. 57 contrôles groupés, dont Training/Chaser/Battle Royal
avec avatars et runtime réels, et un build réussis. Gates de fidélité conservés.
[Lot](work/weapon-polish-20261025/melee-post-pose-emission/README.md).

26 octobre 2026 : le modèle lumineux du secondaire Demonic Knuckle retrouve
ses deux parents animés et leur changement de position/échelle. Le suivi
existant des particules de main est conservé. 56 contrôles groupés et un
build réussis ; secondaire observé dans le jeu principal.
[Bilan et limites](work/weapon-polish-20261025/melee-secondary-hierarchy/README.md).

26 octobre 2026 : les modèles d'effets mêlée qualifiés cessent d'être dessinés
sous le seuil alpha source, sans couper leurs animations/enfants. Six modèles
Vital Shock/Iron Boots/Death Scythe à alpha nul pouvaient encore écrire la
profondeur. Pistes confirmées directement dans le pack décodé, 54 contrôles
groupés et un build réussis ; rendu lourd Scythe observé dans le jeu principal.
[Lot et limites](work/weapon-polish-20261025/melee-zero-draw-batch/README.md).

26 octobre 2026 : seuils des événements d'état harmonisés sur Demonic Knuckle,
Death Scythe, Vital Shock et Iron Boots : franchissement strict et horloge ms/s
cohérente. Deux sources de combat trouvées entièrement nulles ont été restaurées
depuis leurs versions/patchs archivés. 68 contrôles groupés et un build réussis ;
griffure droite et effet aérien Demonic observés dans le jeu principal.
[Bilan et limites](work/weapon-polish-20261025/melee-event-clock-batch/README.md).

26 octobre 2026 : les griffures gauche/droite et la racine aérienne Demonic
suivent désormais la scène évaluée du personnage, selon les parents mesurés
dans le Jeu référence. Parents internes conservés, secondaire inchangé.
27 régressions groupées et un build réussis ; contrôle visuel complet ouvert.
[Bilan](work/weapon-polish-20261025/melee-root-follow-batch/README.md).

25 octobre 2026 : lot Scythe/Sigma intégré. Scythe masque le dessin de son
auxiliaire invisible tout en gardant sa lame enfant active ; Sigma retrouve
12repères distincts pour ses couches homonymes.28contrôles groupés et un build
commun réussis, rendus principaux observés ; fidélité globale encore en cours.
[Scythe](work/weapon-polish-20261025/scythe-equipped-visibility/README.md) ·
[Sigma](work/weapon-polish-20261025/sigma-equipped-model-indices/README.md).

25 octobre 2026 : Twin Blade n'affiche plus les lames tenues en doublon
des lames de chaînes sur aérien/lourd. Pistes alpha des modèles équipés
raccordées, garde native de dessin établie, 19 régressions et build commun.
[Bilan et limites](work/weapon-polish-20261025/equipped-binary-opacity/README.md).

25 octobre 2026 : pulsations/fondus des 15 couches équipées Sigma
raccordés depuis les pistes alpha source, au lieu d'une opacité fixe. Mixer
et cache existants réutilisés pour les deux formes, joueur/adversaires.
16 régressions groupées et build commun réussis ; rendu principal observé.
Fidélité globale toujours en cours.
[Bilan](work/weapon-polish-20261025/equipped-opacity/README.md).

25 octobre 2026 : inserts lumineux Demonic Knuckle corrigés sur les deux
gants, dans le loader partagé joueur/adversaires. 26 pièces sans éclairage
retrouvent leur matériau source, sans toucher aux attaches ni aux solides.
28 régressions groupées réussies ; fidélité globale toujours en cours.
[Bilan](work/weapon-polish-20261025/demonic-equipped-materials/README.md).

25 octobre 2026 : chaîne aérienne Twin raccordée avec skinning et suivi
de la racine du personnage, après six graphes natifs concordants. Clip et
helpers propres à l'aérien ; 24 régressions, build commun et rendu principal.
Les anciennes exclusions de chain_12 sont dépassées dans ce périmètre.
[Bilan et limites](work/weapon-polish-20261025/twin-air-chain/README.md).

30 septembre 2026. Suivi de réintégration, sans nouvel audit global.

Procédure : [guide d’import](docs/IMPORT-ARMES-GUIDE.md) et [contrôles](docs/IMPORT-ARMES-CONTROLES.md).
25 octobre2026 : chaîne lourde Twin articulée dans le jeu principal. Graphe
de114nœuds comparé aux cinq captures actives, deux chaînes skinnées, repères
invisibles restaurés et shaders préparés.20régressions et build commun réussis ;
hiérarchie aérienne et comparaison complète de rendu encore ouvertes.
[Bilan](work/weapon-polish-20261025/twin-chain-node-mapping/README.md).
25 octobre2026 : suivi de racine personnage raccordé sur chaîne lourde Twin,
fort transformé Sigma et première spéciale Death Scythe, d'après14poses actives
natives. Échelle du modèle et recalage post-pose conservés ;23régressions et
build commun. Les branches non observées et limites internes restent ouvertes.
[Bilan](work/weapon-polish-20261025/melee-actor-scene-follow/README.md).
25 octobre2026 : matériaux de Vital Shock Black Cat raccordés aux flags SCN :
transparence, mélange additif, pièces sans éclairage, ombres/contours séparés.
Rendu principal observé,29régressions et un build commun réussis ; comparaison
visuelle native encore ouverte.
[Bilan](work/weapon-polish-20261025/vital-equipment-materials/README.md).
25 octobre2026 : son d'impact aérien Bat différencié entre personnage et décor.
Comparaison des déclarations d'effets/sons sur43combinaisons attribut/flag,
9familles ;49régressions et un build commun. Aucune nouvelle certification
de rendu natif ; les attributs Vital inactifs sont explicitement exclus.
[Bilan](work/weapon-polish-20261025/melee-contact-presentation/README.md).
25 octobre2026 : lot audio Twin/Bat/Breaker/Iron Boots. Départs d'état séparés
des volumes d'attaque, impacts Twin spark restaurés, voix manquantes et son
aérien300ms raccordés. Sons préparés/réutilisés ;47contrôles et build commun.
[Bilan et limites](work/weapon-polish-20261025/melee-audio-events/README.md).
25 octobre2026 : effet fort transformé Sigma corrigé. Ses12pièces sont
rattachées au conteneur, au lieu de11pièces sous le dernier modèle homonyme.
Rendu dans le jeu principal,26contrôles groupés et un build commun réussis ;
la conclusion précédente «S5 déjà plat» est rectifiée.
[Bilan](work/weapon-polish-20261025/sigma-power-hierarchy/README.md).
25 octobre2026 : parents animés raccordés aux39modèles du troisième coup et
aux40modèles de finition spéciale Death Scythe. Résolution du conteneur source
homonyme explicite ;31contrôles groupés et un build commun réussis. Sigma
observée sans changement nécessaire de cette hiérarchie ; Twin reste à résoudre.
[Bilan du lot](work/weapon-polish-20261025/melee-active-hierarchies/README.md).
25 octobre2026 : traînée aérienne SEQ Bat raccordée au joueur/adversaire après
lecture des parents/matrices actifs du Jeu référence. Arc visible, préparation
et buffers réutilisés ;31 contrôles groupés et build final, statut essais maintenu.
[Bilan du lot](work/weapon-polish-20261025/bat-aerial-integration/README.md).
25 octobre2026 : une annulation tardive ne peut plus couper une instance
d'effet réattribuée à un autre acteur. Images des textures animées préparées
avant leur sélection ;47 contrôles groupés et un build commun réussis.
[Bilan du lot](work/weapon-polish-20261025/effect-pool-lifecycle-batch/README.md).
25 octobre2026 : effets suivis recalés après la pose affichée ; secondaire
Demonic corrigé pour les os seuls avec racine figée. Préparation GPU des effets
par proxies et textures de matériaux initialisées ;46 tests et un build commun.
[Bilan du lot](work/weapon-polish-20261025/effect-presentation-batch/README.md).
25 octobre2026 : Assassin Claw et Vital Shock sélectionnables pour l'adversaire
Free training. Traînée Assassin Claw préparée côté joueur/adversaire et fenêtre
délai50 + durée350 corrigée ; forme encore reconstruite.50 contrôles et un build.
[Bilan du lot](work/weapon-polish-20261025/claw-main-batch/README.md).
25 octobre2026 : composition additive des rubans Iron Boots, Demonic Knuckle
et Assassin Claw ; panneaux sombres Iron Boots supprimés dans le jeu principal.
33 contrôles et un build commun réussis ; bindings Iron Boots toujours reconstruits.
[Bilan du lot](work/weapon-polish-20261025/ironboots-dark-panels/README.md).
25 octobre2026 : six scènes supplémentaires Vital Shock/Demonic/Iron Boots
restaurent leurs parents animés malgré les noms répétés de modèles feuilles.
Chaque pièce conserve son index et ses pistes ;34contrôles groupés réussis.
[Bilan](work/weapon-polish-20261025/indexed-melee-effects/README.md).
25 octobre2026 : cinq scènes d'effets sur Vital Shock, Demonic Knuckle,
Iron Boots et Death Scythe retrouvent leurs parents Bone et leurs pistes
internes.33contrôles groupés réussis ; attaches externes/gates natifs inchangés.
[Bilan](work/weapon-polish-20261025/melee-effect-hierarchy-batch/README.md).
25 octobre2026 : six adversaires mêlée ajoutés en Free training — Breaker,
Twin Blade, Storm Bat, Death Scythe, Demonic Knuckle, Iron Boots — avec les
mêmes adaptateurs de traînée que le joueur, préparation GPU et cache.
60contrôles groupés réussis ; limites natives des familles conservées.
[Bilan du lot](work/weapon-polish-20261025/melee-opponent-batch/README.md).
25 octobre2026 : lot Iron Boots/Demonic Knuckle, lecture délai+durée corrigée
pour leurs traînées. Le pied gauche retardé du premier Iron Boots n'est plus
supprimé comme fenêtre vide ; les aériennes et light2 Demonic conservent leur
durée déclarée.24régressions et un build commun réussis, rendu toujours en essais.
[Bilan du lot](work/weapon-polish-20261025/dual-trail-duration-fix/README.md).
25 octobre2026 : traînée Katana classique raccordée au joueur et à l'adversaire
sélectionnable en Free training, avec forme de lame évaluée, texture exacte et
fenêtres source. Combos, forte, aérien et secondaire testés sur M/F ; captures
principales et parcours ordinaire de sélection/combat/retour salle conservés.
Fidélité native complète ouverte, statut expérimental maintenu.
[Bilan adverse](work/weapon-polish-20261025/katana-opponent-trails/README.md).
25 octobre2026 : traînées Sigma normale/transformée raccordées au joueur
principal et à l'adversaire sélectionnable en Free training, avec textures
authentifiées, fenêtres source, attaches post-mixer et mélanges distincts.
Préparation adverse en cache et réattache contrôlées ; fidélité native ouverte.
[Bilan](work/weapon-polish-20261025/sigma-actor-trails/README.md).
Série mêlée lancée le 3 octobre 2026 après la Plasma Sword. Premier lot : [Counter Sword](docs/imports/counter-sword.md) et [Spy Dagger](docs/imports/spy-dagger.md), adaptateurs raccordés et mécanismes communs portés. Les gates natifs restent non prêts.

**24 octobre 2026 — priorité actuelle :** l’utilisateur confirme Plasma Sword,
Spy Dagger et Counter Sword déjà validées. Elles sont exclues des corrections
du lot de finition actuel. Celui-ci vise le placement du bras de Metallic Fist
et les effets manquants des autres armes de mêlée, d’abord la charge du Katana.
Le raccordement de cette charge, le trait écran du secondaire et la correction
du suivi de main de l’effet lourd Demonic sont intégrés. Le placement du
gant droit a depuis été corrigé dans la suite du25octobre ci-dessous.
Charge et trait observés sur les deux personnages dans
les scénarios principaux figés ; 74 tests et build passent. Voir le
[bilan du lot](work/weapon-polish-20261024/DELIVERY.md). Les limites historiques
de certification ci-dessous ne constituent pas une demande de reprendre les
trois armes validées.

**Suite du 25 octobre — Storm Bat :** traînée d’acteur raccordée au joueur
local dans le jeu principal, avec le Shape animé, la texture exacte et le
contrôleur d’échantillonnage/fondu sourcé. Préparation GPU avant équipement,
cache conservé et buffers réutilisés. 83 tests du raccordement et du lot
passent ; le scénario principal montre la traînée sur les deux personnages,
et son extinction est observée à1,2s sur femme. Le chargement des scénarios
simples a aussi été limité à l’équipement sélectionné (2 nouvelles régressions,
14 contrôles ciblés verts). Build réussi. La passe GPU native supplémentaire
reste non portée. Un primaire ordinaire et son extinction sont maintenant
observés sur les deux personnages :
[captures ordinaires](work/weapon-polish-20261024/bat-effects/browser/ordinary/HANDOFF-20261025.md).
[Preuves](work/weapon-polish-20261024/bat-effects/HANDOFF.md).

**25 octobre — Sigma Blade :** l'effet de jambe du deuxième coup est réservé
à la forme normale, conformément au booléen absent converti en `false` et
au sélecteur natif de forme. Le fort transformé conserve son effet et son son.
Le vrai contrôleur, les deux rigs et le consommateur d'effets passent les
22 tests ciblés ; build réussi. Comparaison visuelle native et placement
des effets restent ouverts.
[Preuve de sélection](work/weapon-polish-20261025/sigma-sequence-gate/HANDOFF.md).

**25 octobre — gant droit Metallic Fist / Demonic Knuckle :** une capture
réussie du Jeu référence sur M/F montre le body directement sous l'avant-bras.
Le parent intermédiaire conservé dans S5 ajoutait environ90° et18,73unités
natives de décalage. Le seul raccordement droit est corrigé, courbes et
assets intacts ; le gauche reste inchangé. Concordance aux quatre matrices
capturées,37tests ciblés et51régressions verts, build réussi.
[Preuves et limites](work/weapon-polish-20261025/attachment-native-v6/HANDOFF.md).
Clips natifs, déformation des surfaces et fidélité complète restent ouverts.

## Disponibles dans le jeu principal

23 octobre2026 : **Spy Dagger primaire disponible en essais dans Conquest**.
Contacts multiples sur les vrais NPC/Health, blocage par les murs et absence de
dégâts doublés vérifiés ; baisse de PV observée dans le navigateur. Rush fermé,
fidélité native et arme entière non certifiées. [Preuves et limites](work/game-modes/conquest-recovery/conquest-dagger-20261023/MAIN-DELIVERY.md).

18 octobre2026 : Heavy Machine Gun désormais sélectionnable en essais,
avec rigs M/F, recharge5s corroborée dans S5Runtime, impacts/sons disponibles et
icône d'origine. Cadence/débit, dégâts natifs et plusieurs interactions restent
à qualifier ; nativeReadyfalse. [Rapport](work/parallel-gameplay-reference/armes/heavy-machine-gun/MAIN-DELIVERY-20261018.md).
Storm Bat, correction du 4 octobre : l'esquive ne coupe plus BB001 quand
les jambes reprennent après300ms. Le saut inférieur conserve la frappe ;
esquive normale après sortie de l'action. 167 régressions et build passent.
Preuves et limite du routage natif : `work/bat-primary-cancel/README.md`.

**Spy Dagger, Plasma Sword, Counter Sword, Breaker, Katana, Twin Blade, Storm Bat, Assassin Claw, Iron Boots, Sigma Blade, Vital Shock, Death Scythe et Demonic Knuckle** sont sélectionnables côté mêlée. Air Gun, Smash Rifle, Revolver et Semi Rifle restent disponibles. Les nouvelles intégrations restent en essais avec leurs limites natives.

[Ouvrir le Katana](http://127.0.0.1:5174/?weapon=katana&weaponSkin=classic). Touche 9. L'onglet Inventaire active les familles réellement raccordées ; Vital Shock moderne est distinct de l'ancien Assassin Claw.

Suite Katana charge complète, 4 octobre : contacts sélectionnés dès 900 ms
selon le Lua et CAttackStateEx, indépendamment du timer de charge 1000 ms.
160 tests Katana/mêlée, 11 tests d'intégration et build passent ;
seuil 890/900 ms observé en jeu sur les deux personnages.
Interpolation des dégâts, buffs et conditions SP restent ouverts ; gate non prêt.
Preuve : `work/melee-batch-5/katana-full-charge.md`.

Suite Katana charge : délai artificiel40ms retiré au relâchement depuis
l'attente debout (branche native mode3). Cas bref observé M/F ;130
régressions,11 tests du contrat et build passent. SP/éligibilité, full-charge
et phases du composant d'entrée restent ouverts ; gate non prêt.
Preuve : `work/melee-batch-5/katana-standing-release.md`.

Suite Katana aérien,4 octobre : fitting KT029/KT033 aux phases400/450ms
et retrait des40ms ajoutées corrigés depuis CAttackStateKatanaJumpState.
129 régressions,11 tests du contrat et build réussis, M/F observés en jeu.
Physique globale, reset aérien conditionnel, effets et phases de charge
restent ouverts : `work/melee-batch-5/katana-air-speed.md`. Gate non prêt.

Katana, 4 octobre : vitesses natives du combo au sol, forte et recul secondaire
raccordées. Recul KT006_1 demandé sur 300 ms, curseur MoveBox synchronisé,
puis maintien KT006_2 immobile ; deux personnages observés, huit caps/switch
testés, 124 régressions et build réussis. Charge/libération/aérien restent
à établir séparément ; gate non prêt. Preuve :
`work/melee-batch-5/katana-backdash-speed.md`.

Suite Katana : fitting de la libération KT007/KT008 et transition directe
vers récupération corrigés depuis CAttackStateEx ; 125 régressions et build
réussis, frappe/contact/récupération observés M/F. Charge/aérien et limites
physiques restent ouverts : `work/melee-batch-5/katana-release-speed.md`.

Suite Katana : attente initiale à vitesse Lua1 établie dans la classe de
charge, reset physique de récupération raccordé une seule fois. 128 tests
ciblés/11 du contrat et build réussis ; charge ultérieure/aérien restent
ouverts : `work/melee-batch-5/katana-standing-recovery.md`.

## Lot mêlée — Counter Sword et Spy Dagger, 3 octobre 2026

- 4 octobre : freeze Revenge en Chaser corrigé. La recherche de l'attaquant
  ne se rappelle plus elle-même au blocage frontal. 198 régressions et build
  passent ; preuve avant/après : `work/counter-revenge-freeze/README.md`.

- Sources actuelles authentifiées, adaptateurs consommés dans le jeu principal. Jambes de RunState séparées du haut sur les deux armes ; marche aérienne Dagger validée antérieurement préservée.
- Mécanismes communs : BOX/FAN/CYLINDER issus du code natif, horloges strictes, contacts indexés et consommés une fois par cible. Trois contacts du rush Dagger restent trois coups. Counter fort ne se fait plus contrer ; première frappe du finisher sans poussée.
- Counter, correction du 4 octobre : combo, attaque forte et aérien suivent le point actuel du viseur pendant le coup. Le drop réoriente sa vitesse sans prolonger sa portée. 224 tests et build réussis ; [preuves et limite native](work/counter-reticle-follow/README.md).
- Effet rush Dagger shortknife01 restauré intégralement (5 émetteurs, modèle animé, 5 textures), raccordé et nettoyé au changement.
- 1428/1432 tests globaux réussis ; quatre échecs de staging préexistants Breaker/Revolver conservés. Contrat10/10, build réussi. Contrôles détaillés et captures du jeu principal : [bilan du lot](work/melee-batch/README.md).
- Limites : critiques DependOn/équipement/défense, fitting des animations Counter, corps cibles, points d’impact et impulsions natives ; rendu et comparaison S5Runtime non certifiés. Dégâts d’arène explicitement calculés sur preset XBN et contacts normaux.

## Plasma Sword — reprise du code, 3 octobre 2026
- Item classique 2000001 : six sources Lua authentifiées par CRC/SHA, 18 fonctions consignées ; quatre fonctions natives de déplacement des jambes pendant les attaques décompilées en lecture seule.
- Correction S5 : huit clips de jambes explicites du RunState, séparés du haut du corps ; fondu du NormalState repris à 1000/4800 s. Les paramètres généraux de mouvement et les attaques existantes sont conservés.
- 138 tests ciblés passent ; build réussi. Repos, marche dans huit directions, attaque mobile et retour au repos testés sur les deux rigs réels. Marche observée dans le jeu principal sur les deux sexes.
- Fidélité native complète non validée : horloges d'attaque, volumes de contact, dégâts selon canal, effets, attache quantitative et comparaison S5Runtime restent ouverts. Voir la [fiche](docs/imports/plasma-sword.md) et les preuves dans work/plasma-restoration.
- Second passage avec agents : 27 constructions de contacts analysées, 17 ressources effets/sons authentifiées. Traînée aérienne corrigée à 50–350 ms depuis le Lua ; cue aérien actif confirmé. Relevés et limites conservés dans les rapports dédiés, sans certification complète.

[Ouvrir la Plasma Sword](http://127.0.0.1:5174/?weapon=plasma).

## Revolver — raccordé au jeu principal, expérimental
- Sélection et touche 7, clic gauche semi-auto, chargeur 7, réserve 14, recharge de 3 s avec jambes mobiles.
- Texture native récupérée et CRC vérifié ; modèle, deltas homme/femme, sons de tir/recharge/contacts et trois séquences d'effets raccordés. Deux modèles d'impact et leurs textures ont été récupérés dans les archives locales.
- Correction quaternion spécifique à Q0001 supprimée : elle cassait Q0002. Grip source conservé, visée haut/centre/bas mélangée ; mappings latéraux comparés au Breaker.
- Quatre rayons après délai de 150 ms et évaluation du socket par le mixer ; 7,5 dégâts par rayon avant décroissance, murs pris en compte, une seule munition consommée. Pas de douleur/stun/interruption pour les balles ordinaires.
- 17 octobre : les quatre conditions source Push(120,1125,-5000) sont raccordées indépendamment après réception acceptée des PV et contrôle SetImmune. Déplacement horizontal réel soumis aux collisions, sans ajouter de vitesse Blow ni interrompre la cible. Horloge/cap historiques et politique acteur locale restent qualifiés, comparaison S5Runtime ouverte : [preuves du raccordement](work/revolver-victim-push-20261017/DELIVERY.md).
- Repos, marche et tir observés dans le jeu principal sur les deux corps ; flash, recharge mobile et impact observés. Sélection Air Gun → Revolver via l'onglet Inventaire, puis entrée en arène réussies. À t=0,3 s, le scénario réel de contact affiche 70 PV adverses, 6 munitions, 1 tir, aucune réaction et aucun verrouillage de la cible. Aucun message d'erreur navigateur relevé pendant ce contrôle.
- 60/60 tests ciblés passent (Revolver, Smash, Air Gun, contacts, continuité, changements d'arme et contrat). Compilation de production réussie. Rapports : work/revolver-restoration ; captures : work/weapon-checks dans le dossier de la conversation. La validation native exhaustive reste distincte de ce parcours de jeu.
- Limites natives : equip/stow et relink Gun_Dummy, états aériens, sémantique exacte de AddPushCondition, critiques/dispersion et mesures quantitatives comparées à S5Runtime. Ne pas annoncer une reproduction native complète.

## Smash Rifle — jouable en entraînement, expérimental
- Modèle dualgun et texture DDS authentique convertie ; hiérarchie animée et socket Dual_Fire_Dummy conservés.
- Repos DD000, huit directions haut/bas comparées aux courbes du Breaker validé ; rechargement DD004 ajusté à 2 s avec jambes mobiles.
- Correction demandée : DD003 vise **en bas**, DD002 au centre, DD001 en haut. Mélange continu des poses haut/centre/bas selon la direction verticale du pointeur.
- Le rayon du réticule donne la cible. Le tir part du canon évalué **après le mixer**, converge vers cette cible et s'arrête sur un mur. Effets, impact et dégâts utilisent le même contact.
- Balles ordinaires : dégâts et effets visuels sans animation de douleur, interruption, poussée, stun ou pause. Les réactions déjà en cours ne sont pas prolongées ; la mort reste normale. Correction testée avec un ennemi en attaque et en garde. Air Gun conserve sa projection.
- Tir automatique 8 coups/s, chargeur 40, réserve d'entraînement 120, puissance d'entraînement 6. Sons de tir/recharge/impacts/sec restaurés.
- Particules S5Runtime de bouche et impacts, traceur green_beam de 100 ms. Ruban de traceur approximatif, pas une certification du rendu procédural natif.
- Secondaire DD022 raccordée au clic droit : état1000ms, jambes après200ms, contact normal après400ms, dégâts10 et Blow. Munitions inchangées ; fin d’action et déplacements vérifiés sur les deux personnages dans le jeu principal (10 scénarios/68 contrôles, `work/smash-secondary-recovery/browser-v1/comparison.json`).
- Limites : rayon AlwaysCritical et arbitrage entre les deux déclarations non exécutés ; diagnostic des candidats séparé. Ruban/particules du secondaire, dispersion, critiques, décroissance native, stow/equip, états aériens et comparaison des PV logiques restent ouverts. Le gate natif reste non prêt.

## Vérifications de cette reprise
9 tests Smash passent : cadence à 60 Hz, munitions, changements d'arme, directions selon quatre orientations, jambes/recharge, attaches après mixer, inclinaison réelle du canon sur les deux corps, convergence réticule/canon, collision murale, textures/particules.
56/56 tests ciblés passent, dont Air Gun, animation, switch, contact, Smash Rifle et contrat. Compilation de production réussie.
Captures principales et logs : [work/weapon-checks](<C:/Users/newpc/Documents/ChatGPT/s5 league/work/weapon-checks>). Le scénario réel d'arène rifle-contact à 0,4 s a affiché 36 munitions et 82 PV adverses, sans réaction (reaction=null, locked=false, repos R0004 conservé), avec traceur et impact visibles.
Le gate natif est exécuté et conservé dans native-gate.json ; aucune mesure S5Runtime manquante n'a été inventée.

## État des autres familles
Les obstacles non revérifiés individuellement ci-dessous proviennent du [comparatif sauvegardé](<C:/Users/newpc/Documents/ChatGPT/s5 league/audit/ARMES.md>). Ils ne sont pas annoncés comme des armes rejouées ou nouvellement importées. Les sources restent disponibles et ne sont pas écrasées.

| Arme | État dans cette version | Dépendance / travail restant |
|---|---|---|
| Spy Dagger | Raccordée, vérifications du lot mêlée | Run haut/bas au sol corrigé ; FAN/cut, trois BOX/rush, facteurs distincts, effet shortknife01 complet. Critiques/réactions/calibration et comparaison S5Runtime ouverts. |
| Plasma Sword | Sélectionnable ; reprise en cours | RunState haut/bas et fondu du repos corrigés depuis les Lua actuels ; code natif de locomotion extrait. Horloges, contacts et fidélité complète restent à établir. |
| Counter Sword | Raccordée, vérifications du lot mêlée | Run haut/bas corrigé ; BOX et CYLINDER natifs, contacts distincts, heavy non contrable. Critiques/horloges précises/impulsions et comparaison S5Runtime ouverts. |
| Breaker | Jouable · essais | Traînée acteur `Line01` classique raccordée aux chemins réels du jeu, avec texture authentifiée et fenêtres source. Seconde passe native, rendu pixel et fidélité exhaustive restent ouverts. |
| Katana | Sélectionnable en essais ; import incomplet | Skin classique conservé, fourreau équipé à la hanche et cadres noirs corrigés. Porteurs SCN M/F retrouvés et pistes régénérées identiques ; fondus et maillage contrôlés, **position exacte S5Runtime non validée**. Premier coup mobile ; suivants et forte déplacent via MoveBox orientable, maintien gauche pendant esquive et chute aérienne finale sans contrôle jusqu’au sol raccordés. Recul/charge/libération et huit séquences actives, dont les effets fort et aérien (partiel). Texture aérienne slash06_1.dds absente, charge/ligne secondaire, SP/cooldown/critiques et magnitudes natives restent incomplets. 227 tests ciblés et build passent ; gate non prêt. Voir la fiche. |
| Twin Blade | Sélectionnable · essais, touche0 | Modèles et animations M/F, deux lames/traînées, contacts et séquences raccordés. Séquences de charge retrouvées ; routage combo/charge, critique et comparaison S5Runtime restent approximatifs. Voir docs/imports/twin-blade.md. |
| Assassin Claw | Sélectionnable · essais | Sources/ressources actuelles, neuf contacts, sons et effet restaurés. Repos/marche/attaque M/F observés ; durée d'état2s et fidélité link1/trail/follow restent provisoires. Voir docs/imports/assassin-claw.md. |
| Sigma Blade | Sélectionnable · essais | Deux formes, repos/marche M/F×8 directions, combos et transformation raccordés. Entrées natives et cooldown de sortie établis ; consommation continue SP et comparaison S5Runtime ouvertes. Voir docs/imports/sigma-blade.md. |
| Death Scythe | Sélectionnable · essais | Repos spécifique M/F, combo, upper, fort et aérien raccordés. Cylindre Lua, StaySky, phases du spécial et SECOND_IMPACT par angle/invincibilité raccordés. Horloges animation/contact distinctes ; critiques, fitting et rendu natif restent ouverts. Voir docs/imports/death-scythe.md. |
| Demonic Knuckle / Demon’s Fist | Sélectionnable · essais | Item2000036/type47, deux gants, repos/marche/attaques M/F raccordés. Première main gauche puis alternance persistante, durée500ms native, SP40, cooldowns et immunité aux conditions. 38tests dédiés, 253régressions et build passent. Défense HP, flinch natif, critiques et rendu exact des traînées restent à établir. Voir docs/imports/demonic-knuckle.md. |
| Vital Shock moderne | Sélectionnable · essais | Item2000065 distinct de l'ancien2000005 : cinq actions, 37contacts non critiques et ressources raccordés. Rafale demandée pendant ruée/récupération. SEQ conservés sans coupe700ms ; magnitudes Blow natives signées raccordées (rafale0/3, aérien0/-9), ce qui retire l'expulsion générique des coups intermédiaires. 311régressions ciblées et build passent après polishing commun. Pull, graphe/factory, attributs et physique finale restent à établir. Voir docs/imports/vital-shock.md. |
| Iron Boots | Sélectionnable · essais | Bottes actor-skinned correctement aux pieds après mixer ; combo, upper, aérien et boost raccordés. SP/cooldown, récupération upper et rubans S5 explicitement reconstruits ; Boost→dash gauche après100ms raccordé depuis Lua/binaire, 102 régressions et quatre captures M/F ; éligibilité/SP natifs, réorientation et sockets boost ouverts. Voir docs/imports/iron-boots.md. |
| Bat / Storm Bat | Sélectionnable · essais | Frappes/rotations/aérien raccordés ; dummies internes et émission orbitale des effets rétablis. Annulation dodge de première phase bloquée, saut phase2, visée aérienne pointeur et immobilité finale corrigés. Graphe natif de rotations résolu ; repère externe des effets et comparaison au Jeu référence restent ouverts. Voir docs/imports/bat.md. |
| Air Gun | Jouable, conservée | Préserver les corrections ; fidélité native exhaustive non réévaluée. |
| Cannonade | Jouable en essais · fidélité native incomplète | 15 octobre : sélection J/menu/inventaire, charge continue, recharge mobile munition par munition, explosion différée100ms, poussée, séquences et sons raccordés.49 valeurs natives de charge comparées, profil observé7.2033901–36.0169525. Zoom à bascule45° avec première cible15° ; transition float32 comparée exactement sur162 changements d’angle natifs des deux sexes, coefficients1.5/1.75.16 captures/112 contrôles de transition conservés. Deux Lightning raccordés au canon post-mixer,156 calculs scalaires natifs exacts ;16 captures/298 contrôles Lightning,166 tests JS et build passent. PV natifs, autres équipements, corps, matrices/vertices/GPU des Lightning, hook externe de cible et fidélité complète restent ouverts. Voir docs/imports/cannonade.md. |
| Semi Rifle | Jouable · essais | Raccordée au jeu principal : modèles M/F, visée, recharge mobile, effets, sons, traînées et motif de dispersion. Portée configurée par carte comparée à12 cas natifs communs. Accuracy, collision/PV à longue portée, equip/stow et comparaison quantitative restent non certifiés. |
| Rail Gun | Non réintégrée | Aperçu charge ; tests 3/9, gate introuvable au chemin attendu et manifestes incohérents ; directions natives non certifiées |
| Revolver | Jouable · essais | Modèles, visée, quatre rayons, recharge mobile, effets et sons raccordés. Validation visuelle exhaustive et comparaison native encore ouvertes ; voir section dédiée. |
| Smash Rifle | Jouable · essais | Secondaire et certification native encore ouverts. |
| Submachine Gun | Runtime principal expérimental, fidélité native non certifiée | 15 octobre : sélection/inventaire/U/HUD, tir automatique, recharge mobile, visée haut/centre/bas, deux flashes pour une balle, cinq sons et dégâts raccordés. Portée configurée par carte raccordée après12 cas natifs communs ;57 contrôles ciblés et build passent, avec captures du jeu principal. Restent angles/clips mobiles (condition de reprise consignée), critiques/interactions, collisions/PV à longue portée, transitions et effets. Gate non prêt. Voir docs/imports/submachine-gun.md. |
| Hand Gun / Revolver2 | Non réintégrée | Aperçu charge ; 2/6 tests passent, QA commune absente et assertions clips/attaches/audio en échec |
| Assault Rifle | Non réintégrée | Texture décodée et son de recharge absents ; weapon_assultgun_rail.seq incomplet. |
| Heavy Machine Gun | Jouable en essais,18 octobre2026 | Modèle/texture et rigs M/F raccordés ; tirs/impacts/recharge/sons disponibles. Recharge5s corroborée dans S5Runtime. Cadence/débit et fidélité native complète non certifiés ; hmg_hit.ogg absent. Voir docs/imports/heavy-machine-gun.md. |
| Dual Magnum | Non réintégrée | Pas d’aperçu ni runtime complet retrouvés sous ce nom ; générateur exige deux porteurs SCN |
| Homing Rifle | Non réintégrée | 5/5 tests après restauration stage/public ; aperçu charge ; trajectoire homing/effets non validés dans le jeu |
| Machine Gun 2 | Non réintégrée | Aperçu charge avec matériau diagnostic ; textures pending ; 2/3 tests passent |
| Rocket Launcher | Jouable en essais · fidélité native incomplète | 15 octobre : K/menu/inventaire, primaire/triple tir, recharge/réserve, explosions/Push/sons. Spirale :22 déplacements libres comparés,84 rotations. Bonus natif par explosion porté :48 cas de maths et8 streams CRT comparés ;12 nouveaux scénarios navigateur sur les deux corps. Puissance logique/équipement/critique/armure/PV natifs, contacts complets et fidélité corporelle/audio restent ouverts. GhostTrail raccordé (Shape/hiérarchie animée, initialisation native identité/historiques nuls),10 scénarios navigateur/72 contrôles passent ; matrice/horloge/GPU natifs encore à comparer ; lecture tardive secondaire différée avec condition précise de reprise.131 tests ciblés et build passent. Voir docs/imports/rocket-launcher.md. |
| Gauss Rifle Mk2 | Non réintégrée | Aperçu charge et tests passent après assemblage ; secondaire reste pending |
| Grenade / Summer Night Mine Gun | Non réintégrée | Runtime isolé, projectile/fusée présents ; 10/12 tests assemblés, QA commune absente ; pas de rendu en jeu prouvé |
| Sentry Gun | Non réintégrée | 12/12 tests après assemblage ; gate maintient ready=false ; placement, constructeur, LOS et rendu des cycles non prouvés |
| Earth Bomber | Non réintégrée | Aperçu et tests passent ; effets/audio désactivés faute de payloads, combat principal non prouvé |
| Mind Energy | Non réintégrée | Aperçu charge ; cadence/munitions/pulses définis, résultat de soin en jeu non prouvé |
| Lightning Bomber | Non réintégrée | Aperçu et tests passent ; projectile/effets/audio explicitement pending |
| Spark Rifle | Non réintégrée | Aperçu charge après assemblage ; comportement de combat principal non prouvé |

## Prochain passage
Revolver : parcours visuel et inventaire vérifiés. Conserver les limites natives explicites ; les mesures du défaut initial restent dans work/revolver-restoration et les régressions actuelles dans tests/revolver-gameplay.test.mjs.

Semi Rifle : intégration expérimentale réalisée ; l’ancienne note « prochaine famille » est obsolète. Préserver ses corrections, notamment jambes pendant recharge, traînées visibles et dispersion appliquée aux contacts.

Katana et Twin Blade restent exposées en essais avec leurs limites. Bat et Assassin Claw sont raccordées au jeu principal ; Iron Boots a livré son adaptateur, Sigma Blade et Death Scythe sont en préparation.



## Correction des traces de balles - 30 septembre 2026
Revolver et Semi Rifle : traces mobiles visibles du canon au contact, avec arret au mur et extinction au changement d'arme. Rendu procedural partage, non certifie natif ; flashs et impacts S5Runtime conserves. Controle visuel dans le jeu principal avec qaView=trajectory ; 19 tests cibles passes, build reussi.

Correction Revolver : emission continue de smoke4 rattachee au canon anime, anciennes particules conservees dans le monde ; controle visuel apres recul et test revolver-smoke passes. Dispersion raccordée : Smash 40 points et Semi 4 points issus des Lua, appliqués aux vrais contacts et aux traînées ; Revolver quatre rayons conservés. Reprise après 0,5 s provisoire : formule native de régression et accuracy encore à vérifier.

## Lot mêlée suivant — 3 octobre 2026

Breaker/Katana/Plasma consomment les adaptateurs de contacts actuels. Katana : trois contacts aériens et une entrée par saut ; Breaker chargé : réaction conservée, impulsion déclarée nulle respectée. Twin Blade disponible au menu et touche0, deux traînées sur les vrais maillages. 1474/1478 tests passent ; quatre échecs préexistants conservés, contrat10/10 et build réussi. Preuves et limites : work/melee-batch-2/result.json. Gates natifs non prêts.

Lot3 : Bat et Assassin Claw sélectionnables en essais, contacts/sons/effets raccordés.
1499/1503 tests passent, mêmes quatre échecs de staging préexistants ; contrat10/10
et build réussi. Observations repos/marche/attaques des deux sexes dans l'arène.
Preuves et limites : work/melee-batch-3/result.json et README.md. Iron Boots,
Sigma Blade et Death Scythe restent à raccorder ; fidélité native non certifiée.

Mise à jour lot4 (3 octobre2026) : Iron Boots et Sigma Blade sont raccordées en
essais ; Death Scythe est désormais aussi raccordée (passage suivant ci-dessous). Vital Shock actuel2000065 ajouté séparément
de l'ancien Assassin Claw2000005 : cinq actions accessibles, effets/sons actifs,
37contacts, SP et ressources M/F. 15/15 tests Vital et99/99 régressions ciblées
passent ; build réussi, contrat10/10. Enchaînement après ruée et attraction restent
provisoires ; types20/54 et attributs d'impact à résoudre. Preuves :
docs/imports/vital-shock.md, work/melee-batch-4/. Gates natifs non prêts.

Passage Death Scythe : adaptateur principal, idle GR000/GR000_1, combo, upper,
fort et aérien raccordés. Deux mécanismes natifs corrigés : coercition du vec2
Lua donnant un disque de hauteur0/rayon350 ; StaySky avec conservation de
vitesse, contrôle avant Tick et exception pendant la montée. 118/118 tests
d'intégration, 56/56 régressions physique/helpers et build final passent.
La suite globale avant le dernier changement StaySky passe1603/1607, avec
les mêmes quatre échecs de staging. SECOND_IMPACT possède désormais un helper
et des preuves latch/contact/Tick ; sa condition native complète reste à
raccorder, sans déclenchement automatique du coup72. Preuves :
docs/imports/death-scythe.md et work/melee-batch-4/death-scythe/result.json.

Passage suivant Death Scythe : SECOND_IMPACT raccordé après filtre angulaire
natif et invincibilité explicite. Callback consommé au début du Tick suivant,
deux contacts à+350/+450 et horloges d'animation séparées. Les quatre timers
natifs remplacent la sortie900ms exacte ; reset physiqueXYZ unique en phase
finale. 211/211 régressions ciblées et build passent. Fitting, ordre global
de simulation, critiques/dégâts finaux et comparaison S5Runtime restent ouverts.
Adaptateur Demon’s Fist livré avec ressources ; raccordement principal à suivre.
