# Air Dagger — direction et critères de réalisation

## Priorité actuelle : reproduction 1:1 de S5Runtime Melee

La demande actuelle remplace les réglages de confort historiques du prototype. La fidélité comprend les règles physiques, les entrées, les transitions et les collisions, pas seulement les animations. Les paragraphes de versions antérieures restent un historique et ne doivent pas être traités comme la spécification native.

Travail 03.8 en cours : rigs S5Runtime masculin/féminin déchiffrés, deux tenues par corps, dague/Plasma Sword/Counter Sword et variantes de skins intégrés. Les nouveaux équipements ne sont pas tous validés visuellement et leur gameplay reste à vérifier contre le client.

Le 23 septembre, lecture en mémoire de 35 paramètres du profil FREE actif et 159 constantes flottantes. Les valeurs du contrôleur viennent désormais de `src/s5runtime-native-physics-data.js`. Corrections : esquive 15 SP, sprint 9,34 SP/s, réserve SP de base 100, hors bonus d’équipement. Les 200 SP de la version 03.6 ne sont plus la référence.

Le saut et l’intégrateur physique du joueur ont été localisés. S5Runtime remplace la conversion entière de durée du tick par une durée en double précision, tout en conservant des accumulateurs de 16 ms. Le contrôleur et l’horloge du projet doivent encore être portés : ne pas déclarer le 1:1 terminé. Analyse, preuves et pistes de reprise : `outputs/analyse-s5runtime/physique-native/RESULTAT.md` à la racine de cette conversation. 165 tests passent et build réussi pour les corrections de paramètres.

Projet de jeu Three.js desktop. Première étape du jeu complet : arène de test consacrée aux sensations de déplacement et à la Spy Dagger, sans modes de jeu supplémentaires.

## Données retrouvées le 23 septembre 2026 — intégration à venir

Les SCN principaux S5Runtime sont maintenant déchiffrés dans `outputs/extracteur-s5runtime/S5Runtime-SCN-dechiffres` à la racine de cette conversation. Lecture complète jusqu’à EOF : male_bip (107 éléments, 777 noms de clips), female_bip (108 éléments, 734 noms), basic_walljump (28 éléments). Rapport : `outputs/analyse-s5runtime/dechiffrement-scn/RESULTAT.md`. Exports sélectionnés pour les mouvements dans `outputs/analyse-s5runtime/animations-dechiffrees` (159 clips masculins, 149 féminins). Les 1 682 SCN protégés sont décodés ; 202 passent le lecteur historique, 1 480 demandent la prise en charge du format 0.3. Le runtime 03.7 n’a pas été modifié : utiliser ces nouvelles données pour la prochaine intégration sans affirmer une fidélité 1:1 déjà obtenue. Les limitations de chiffrement mentionnées dans l’historique ci-dessous décrivent l’état antérieur.

## Dernière livraison : 03.7 — premier import S5Runtime

Tenue S5Runtime classique en six pièces, sons OGG et volume, viseur/icône de dague, traînée texturée, scène de wall jump et impact importés. Station 2 classique sélectionnable, contrôleur connecté à 5 486 triangles, départ central et respawn. Sources et limitations : outputs/analyse-s5runtime/IMPORT-03.7.md à la racine de la conversation.

19 entrées de clips S5Runtime supplémentaires inspectables dans F2, issues de bip_male/male_bip_0000.scn ; 97 bind matrices communes vérifiées. Les mouvements actifs et préférences 03.6 sont conservés. IMPORTANT : les SCN principaux S5Runtime marqués 01CC restent protégés après extraction XS. Station 2 utilise la variante lisible ds5_station.scn de S5Runtime, complétée par octadd/ciel de la référence S4 ; l’effet mural utilise le SCN S4 de référence. Provenances dans public/assets/s5runtime/manifest.json. Ne pas affirmer un décodage complet des SCN ni un remplacement des animations de locomotion S5Runtime.

162 tests et build passent. Vérification visuelle de la tenue, de Station 2, du clip S5RUNTIME/SN001_2 et du wall jump. Le refus de pointer lock du navigateur intégré est géré : caméra au clic molette glissé et Échap pour revenir au menu. Rendu et collisions de toute la carte restent à affiner en jeu.

## Livraison précédente : 03.6

Retours utilisateur prioritaires : énergie doublée à 200 ; vrai saut annule sprint/animation ; air dash courbe vers le bas après sa phase active ; cancel aérien sans impulsion de saut ; déplacement léger pendant le flottement du clic gauche ; aucun déclenchement de dash avec Z maintenu.

`TUNING.maxEnergy=200` remplace les plafonds 100 du contrôleur ; le HUD normalise sa largeur. Coûts et régénération conservés. Le saut normal ou cancel au sol remet airLocomotion à faux et bloque une demande de sprint restée vraie. `MovementInput.consumeEvents` remet le latch de double appui à zéro uniquement sur l'événement jump, pas sur Espace brut : aircancel ne doit pas empêcher la reprise du sprint. Reprise par nouvel appui / double appui aérien conservée.

Le cancel aérien supprime le déplacement horizontal et les chronomètres du dash, conserve la vitesse verticale, vide le buffer de saut et émet aircancel (pas jump). La gravité s'applique dès le cancel. Contact mural valide prioritaire ; règles d'énergie et quota d'air dash non réinitialisés. Sans cancel, gravité reprise au premier tick de récupération, à 256 ms. La limitation Z concerne le déclenchement, pas l'annulation d'un dash déjà actif ; utilise forwardHeld depuis les touches physiques avec repli vectoriel pour replays.

La frappe aérienne flottante utilise une petite vitesse contrôlée (30 % de marche pendant 176 ms, paramètres provisoires de sensation), sans élan automatique ni inertie du sprint. Arrêt au relâchement de direction ; collisions réelles et mêmes clips d'attaque conservés. Tests dédiés : air-control-feedback.test.mjs, plus mise à jour des anciens contrats contradictoires. Scénarios visuels ajoutés : sprint-jump et air-dash-cancel-sprint ; air-dash part de y=8 pour voir toute la chute.

Validation : 158 tests passent, build de production réussi (~657 Ko, avertissement taille non bloquant). Rendu navigateur : air-dash-cancel-sprint à 400 ms joue 00068 en chute à y=6.24, x=1.73 sans poursuite latérale ; jauge 177 pour 88.64 % sur capacité 200. Air-attack à 144 ms joue SN013/00002 à y=3 et z=8.66 (départ z=9), vitesse 2.4 : flottement et petite avance visibles. Aucune erreur console relevée. Fidélité ressentie à comparer par l'utilisateur, pas certifiée 1:1.

## Livraison précédente : 03.5.1

Dash synchronisé sur deux phases distinctes : `src/dash-motion.js` remplace l'intégration analytique continue par l'ordre identifié dans CDodgeState::Tick (0x553680). Vitesse constante en phase active, puis décrément de vitesse avant déplacement en récupération. Seuils stricts, pas de report du dépassement du premier timer. À 16 ms : 240 + 384 = 624 ms, portée libre 6.3504 unités. Ces valeurs décrivent notre reconstruction en unités de scène, pas une mesure du client original. Gravité supprimée pendant le tick actif, rétablie au tick de récupération suivant : convention encore à vérifier.

Clip latéral unique durant les deux phases ; vitesse ajustée `float32(1499/600)` à partir des 7200 ticks SCN et de la durée nominale cumulée, conformément au chemin 0x554110 → CAnimParam. Aucun redémarrage à la transition. Cancels saut sol/air, frappe lourde, reset suppriment les nouveaux compteurs. Sprint aérien, appui Z aérien et liberté 360° conservés. 145 tests passent et build réussi. Source 03.5 sauvegardée dans work/air-dagger-source-03.5. Références détaillées : outputs/S4-CLIENT-TIMING.md.

Pas de courbe MoveBox ajoutée au dash : les clips latéraux masculins exportés n'en contiennent pas. Le terme animé générique existe dans le binaire ; son effet effectif et le mélange d'entrée restent à vérifier avant toute extrapolation. Les sections ci-dessous sont historiques.

## Livraison précédente : 03.5

Demandes successives utilisateur : enchaîner les wall jumps par Espace au contact pendant la fenêtre de rebond sans dépendre de la caméra ; dash/air dash annulables par un saut avec arrêt du déplacement ; effets de dash ; corps libre à 360° dans les airs ; sprint aérien avec animation immédiate ; nouvel appui simple Z en l'air remplace le saut par la marche sans couper la gravité.

Intégré : suppression du verrou mural global 500 ms. Premier appui encore face au mur ; rebonds pendant wallAction.flight utilisent la normale physique et la direction d'arrivée sauvegardée avant résolution des collisions, jamais la caméra. Fenêtre 500 ms conservée, nouveau contact requis, nouvel appui clavier (pas l'auto-repeat). Trois rebonds réels testés entre deux murs sans toucher le sol. La rotation souris est libre après l'appui et pendant l'air dash, sans modifier le vecteur de dash ni l'impulsion murale engagée. Les variantes directionnelles de saut changent sans redémarrer leur curseur.

Nouveau saut pendant dash au sol OU en l'air : annule la phase, remet vitesse X/Z à zéro et applique l'impulsion de saut, sans restaurer la ressource d'air dash. Le tick de cancel n'applique aucun déplacement horizontal ; les touches maintenues reprennent leur déplacement normal aux ticks suivants. Tests des deux cancels à 4 moments du dash, sans queue de déplacement résiduelle.

Sprint droit autorisé dans les airs avec coût en énergie, gravité inchangée, animation 00068 immédiate et effets FOV. MovementInput.forwardPressed identifie un nouvel appui W physique/Z AZERTY (ou flèche haut), pas une répétition clavier. En l'air il active airLocomotion : marche selon l'intention dès ce tick, même à vitesse nulle au moment d'un cancel. L'appui annule également la pose de vol mural sans effacer sa fenêtre de rebond. Tenir Z avant le saut ne compte pas comme un nouvel appui. L'atterrissage remet ce mode à zéro. Les attaques et le dash actif gardent leur priorité d'animation.

Dash : CDodgeState vtable 0xf1a43c, Tick 0x553680, phase 0 vitesse constante ; phase 1 soustrait dodge_decel*dt à partir de 0x5538f3, applique le déplacement, puis avance le timer de récupération. Correction du freinage trop précoce : vitesse 13.5 pendant 225 ms, freinage ensuite, durée totale 600 ms, déplacement analytique 6.2015625 unités au lieu de 3.375. Différences connues : intégration analytique / seuils continus au lieu des ticks stricts originaux, terme de déplacement animé en fin de Tick non reproduit. Ne pas annoncer parité bit-à-bit ou distance originale certifiée.

DashEffect : pool de 3 silhouettes cyan figées, squelettes indépendants clonés, géométrie partagée ; captures toutes les 48 ms pendant la phase active, durée 180 ms, anneau de départ sol/air. Arrêt d'émission lors du cancel et de la récupération, pause en temps simulation, nettoyage au reset. Effet original-inspiré, pas conversion .seq. Inspection navigateur : silhouettes, sprint animé en vol avec FOV51, cancel air dash avec vitesse latérale nulle. Build réussi ; 140 tests passent.

Source 03.4 conservée dans work/air-dagger-source-03.4. Notes d'analyse supplémentaires non intégrées : CBoundJumpState Tick 0x54b380 choisit 00067/00067_2 selon un produit scalaire absolu comparé à .75 (constante 0xf14888), puis phases 4/5 et timer de réorientation 500 ms (s32 index0x36). Identification complète de la direction globale manquante. La dernière demande explicite de liberté 360° prime sur l'ajout d'un verrou de réorientation supposé original. Conditions fines/contacts et fidélité visuelle au client encore à comparer.

## Livraison précédente : 03.4

Retours utilisateur intégrés : diagonales gauche/droite permutées dans les tables de clips de course et de jambes d'attaque, table partagée avec les sauts adaptés ; vecteurs de commande inchangés. Sprint uniquement vers l'avant sans composante latérale, y compris après un strafe ou une rotation souris. Clic gauche maintenu répété, relâchement/focus perdu arrêtent la répétition, clic droit prioritaire à l'entrée et verrouillage conservé. Frappe aérienne SN013/SN014 comme au sol pour le haut du corps, jambes en pose aérienne 00002. SN003 reste inspectable mais n'est plus sélectionné par le gameplay à la demande utilisateur.

Flottement aérien provisoire : chaque nouvelle frappe en l'air annule la vitesse verticale et suspend la gravité 176 ms, puis la chute reprend. Pas de redémarrage avant la fin de la frappe (550 ms) ; tenir le clic ne permet pas de voler indéfiniment. Ce comportement n'a PAS été retrouvé/validé dans le runtime original.

Wall jump : lecture statique CBoundJumpState::SetSubState à 0x54c100, addition vectorielle confirmée à 0x42fef0, constantes float indices 0x26=.75 et 0x2f=1 dans constant_info.x7. Direction réfléchie par rapport à la normale au lieu d'un lancement systématiquement perpendiculaire ; impulsion horizontale 14.0625, verticale 18.75 (échelle .006 toujours candidate). Cap d'entrée utilisé comme direction incidente, figé à l'appui ; orientation vers le mur puis opposée au rebond pour le clip de saut arrière. Préparation >200 ms et phase de vol 500 ms conservées. Clip 00066 lu à vitesse native, sans comprimer 333 ms dans 200 ms. Effet de cercle cyan procédural 380 ms ancré au contact réel, pas une conversion du basic_wall_jump.seq original. Conditions exactes de déclenchement, contrôle pendant le vol et placement des pieds encore à valider contre le client original.

Caméra : distance 4.2, épaule .65, cible à 1.75 au-dessus de l'origine ; cadrage comparé visuellement à la capture utilisateur, personnage en bas à gauche du viseur. FOV 60 / sprint 51 conservé, aucun FOV original déduit de la capture. Test de mur latéral ajouté pour empêcher le décalage d'épaule de placer la caméra dans le mur.

118 tests passent et build réussi. Inspection navigateur : cadrage au repos, frappe aérienne et effet mural ; aucune erreur console relevée. Le test du jeu original en parallèle reste nécessaire pour affirmer une fidélité 1:1. Source 03.3 sauvegardée dans work/air-dagger-source-03.3 ; le lien de comparaison compilée reste 03.2.1. Les paragraphes de versions antérieures ci-dessous sont historiques.

## Direction validée

- Référence graphique : `../ingame-e-retro-cel.png`, E / Rétro cel 2000.
- Arène futuriste lumineuse sur les toits, obstacles, rampes, murs pour les wall jumps.
- Personnage anime, contours nets, couleurs franches.
- Animations prioritaires : articulation, poses, transitions, timing des contacts et des interruptions.
- Marche, sprint, saut, wall jump, dash, air dash et air cancel via le dash ; sensations de S4 League.
- Une arme : Spy Dagger. Pas de progression, boutique, modes d'équipe ni multijoueur pour cette étape.

## Étapes et preuves attendues

1. Lire les ressources du client S4 et identifier la Spy Dagger, ses paramètres et les animations associées.
2. Valider la lecture des squelettes et animations dans Three.js : poses et mouvements corrects, aucune approximation silencieuse de format.
3. Construire contrôleur et arène ; vérifier les enchaînements, collisions et comportement à différents pas de temps.
4. Créer le personnage anime et le rendu cel-shading, avec les animations intégrées et une caméra troisième personne.
5. Vérifier visuellement et en interaction : démarrage local reproductible, commandes, mouvements, attaques, transitions et effets.

Le client Season 1 / Patch 26 sert de référence initiale. Les détails non confirmés par les ressources ou une comparaison jouable doivent rester explicitement identifiés comme provisoires.

## État

Version de travail 03.3, servie sur 127.0.0.1:5174. Versions compilées conservées : /comparison-03.2.1/index.html, /comparison-03.0/index.html et /comparison-02.3/index.html. Documentation : outputs/S4-COLLISIONS-03.3.md pour les contacts, outputs/S4-FIDELITE-03.1.md pour la locomotion, outputs/S4-CLIENT-TIMING.md pour les chronomètres et l'ajustement des clips. S4-FIDELITE-03.md conserve l'état historique précédent.

Correctif 03.2.1 : utilisateur confirme rotation horizontale bloquée au-delà d'environ 90°, puis tremblement et perte de cadrage. Reproduction numérique exacte : après PoseBuffer.beginTick(), l'Euler XYZ d'une rotation Y de 100° devient X=-pi, Y=80°, Z=-pi. Réassigner rotation.y=100° garde les autres axes et produit un cap de 80°. setAvatarFacing réécrit désormais tout le quaternion. Régression couvrant les transforms réels avec PoseBuffer sur plusieurs tours, plus tests du module caméra effectivement utilisé (-720° à +720° et obstacle). 101 tests passent, dont 94 pour la version active et 7 pour le futur solveur non activé. Build réussi.

Collisions 03.3 intégrées : src/collision.js remplace la résolution X/Z AABB du contrôleur par un swept ellipsoid contre triangles. Dimensions .32/.9/.32 provisoires ; paramètres numériques et appui centralisés dans COLLISION_SETTINGS. Séparation mouvement horizontal / gravité, arrêt de la gravité sur pente praticable, sonde d'accrochage au sol seulement si déjà posé et non ascendant. RampGeometry commune rendu/collision, côtés et dessous solides. Le wall jump sonde les triangles réels, y compris murs tournés. 106 tests passent, build réussi, navigateur sans erreur sur arrêt en pente et appui mural. Tests supplémentaires : 5000 sweeps candidats autour d'une boîte, coins, faces/arêtes/sommets, murs fins, plafond, rampe aller/retour, arrêt à quatre hauteurs, descente de plateforme. Approche documentée par Zin / Fauerby, pas une copie ni validation bit-à-bit du solveur original. Initialisation profondément à l'intérieur d'un obstacle non corrigée ; cache de géométrie statique à reconstruire si coordonnées modifiées en place. Source 03.2.1 sauvegardée dans work/air-dagger-source-03.2.1, comparaison compilée publiée dans public/comparison-03.2.1. Le dossier work/air-dagger-collision-candidate n'est plus autoritatif.

Inspection visuelle restante importante : pieds encore dans le mur pendant 00066 et pied avant dans la pente pendant SN002. Ce sont des problèmes d'ajustement de pose/volume, non une pénétration du volume physique. Ne pas affirmer que les contacts visuels sont résolus ; prochaine priorité de fidélité à examiner avec les données source avant compensation procédurale.

La simulation et l'AnimationMixer avancent sur un même pas de 16 ms ; un buffer de poses interpole seulement la présentation. Le clic droit utilise les 61 clés de MoveBox SN001, un facteur 2 lu dans le Lua et les collisions existantes. L'échelle commune rig/mouvement reste 0,006, non certifiée comme conversion originale. Les replays de ruée et déplacement sont invariants à 30/60/120/144/240 FPS. Pas de parité S4 revendiquée.

La 03.2 utilise deux chronomètres indépendants pour la ruée et la récupération, seuils stricts >1000 et >1500 ms, sans report de dépassement. SN001/SN012 utilisent une vitesse ajustée selon le calcul identifié dans le client local (lecture seule, aucun lancement). Construction MAKEBOX/MAKEFAN identifiée mais conventions/test de contact encore inconnus : ne pas inventer de volumes certifiés.

Signalement utilisateur : tremblement/clignotement à l'arrêt, peut-être lié à l'orientation souris. La boucle SN002 passe 20 cycles interpolés sans saut ; la rotation souris seule conserve position et animation idle. Correction de présentation : orientation visuelle immédiate au même angle souris que la caméra, hors actions verrouillées ; suppression du lerp supplémentaire sur l'orbite caméra. Visuel navigateur et build vérifiés, disparition du symptôme utilisateur à confirmer. Source 03.1 sauvegardée dans work/air-dagger-source-03.1 avant ces changements.

La 03.1 centralise un profil FREE vérifié contre les XML locaux, avec ses hypothèses explicitement isolées. Déplacement avant 7,92 unités/s, sprint 11,88, côtés 95 %, arrière 90 %, saut 16,2, gravité 45. Dash : décélération dès l'entrée, 3,375 unités sans obstacle, action 600 ms, gravité reprise après 225 ms. Wall jump : état d'appui immobile, lancement après strictement plus de 200 ms, animation liée au même curseur, impulsion horizontale provisoire à 50 % de la verticale. Le contact visuel au mur reste imparfait et doit être recalibré avec les volumes de collision. Ne pas présenter ces choix runtime comme décodés ou validés 1:1.

Le modèle S4 de référence joue les clips extraits dans Three.js. Les clips de course à huit directions et les jambes pendant les frappes sont reliés aux tables Lua originales. Les alias de clips sont résolus avec leur durée effective.

Corrections demandées et intégrées : dash exclusivement latéral avec gauche/droite + Espace, 0,60 seconde ; wall jump uniquement face au mur ; frappe aérienne ; déplacement et orientation verrouillés pendant le clic droit, sa ruée propre étant conservée ; sprint par double appui avant, FOV 60° → 51°, effets périphériques.

Les sources extraites distinguent saut immobile / en mouvement / chute, sans table à huit directions. Les variantes AIR_RISE, AIR_STAND et AIR_FALL sont des adaptations de jambes à partir des différences entre les courses directionnelles. Elles ne sont pas présentées comme des clips originaux retrouvés. La rotation du saut en mouvement continue après l'apex pour éviter une coupure au milieu du clip.

Vérifications visuelles locales : frappe en déplacement, frappe aérienne, sprint avec FOV 51°, saut arrière, wall jump et dash gauche. Ces instantanés et les tests ne prouvent pas la fidélité complète au client S4 jouable. Vitesses, dash et durées de récupération restent à comparer et affiner avec les essais utilisateur.

La version 02.2 ajoute un éclairage moins surexposé, des panneaux de wall jump, des façades, des passerelles et tours en arrière-plan, de la végétation extérieure et un mannequin plus lisible. Les 15 obstacles physiques sont conservés. Un test sur l'arène complète a trouvé puis validé la correction du raccord entre rampe et plateforme : la surface de support considère la largeur du personnage.

Le personnage anime original est accessible en aperçu par le lien de l'accueil ou ?character=anime. La géométrie est créée en code, articulée sur les animations de référence et regroupée en au plus 12 meshes par matériau. Visage, costume et transitions aux épaules / hanches restent à raffiner. Le squelette, les mouvements et la dague affichée proviennent encore de la référence S4 ; ne pas présenter l'ensemble comme des assets originaux ou comme prêt à redistribuer.

Toujours incomplet : personnage anime final, environnement au niveau de la référence graphique, validation exhaustive des transitions en interaction, attache/orientation et effets de la dague, comparaison temporelle avec le client original. Objectif global non terminé.
