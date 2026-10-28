# Fiche d’import — Twin Blade classique

28 octobre2026 — choix F · Flame ajouté par attaque, couleur réglable et option globale
Keep flames active hors attaque, sauvegardés dans inventaire/Échap/paramètres.
Effets/impacts/audio existants conservés ; ancrages post-mixer, limites et
preuves groupées : `work/weapon-flames-all-20261028/README.md`.

27 octobre2026 — trois directions artistiques propres à cette arme, déclinées
par attaque et sélectionnables dans l'inventaire. Géométries distinctes ;
séquences structurelles, particules d'impact et audio existants conservés.
Mécaniques et gates natifs inchangés. Sources, ancrages et contrôles :
[lot artistique](../../work/melee-art-expansion-20261027/README.md).

26 octobre 2026 — les deux traînées acteur héritent maintenant du brouillard
de la carte, selon FogEnable=true du producteur XML générique. Préparation
none/linear/exp2 avant publication et reprise sur échec. Ce réglage est livré ;
paramètres/pixels natifs et seconde passe restent des vérifications distinctes.
[Lot](../../work/weapon-polish-20261025/melee-trail-fog/README.md).

26 octobre 2026 — le profil `strong` réutilise le premier coup Twin, y compris
son attribut sonore. Avec un index de combo à1, le résolveur choisissait à
tort le son du coup suivant ; il utilise désormais `twinsword_cut_2`.
Le scénario d'index1 est un contrôle du profil, pas une commande ordinaire
dont l'accessibilité native est revendiquée. Vérification commune :
`work/weapon-polish-20261025/melee-activation-audio-audit/README.md`.

25 octobre 2026 — doublon de lames corrigé : les quatre modèles équipés
respectent leurs pistes alpha0 pendant SG012/SG014. Les lames d'effets restent
visibles pendant que celles tenues s'effacent ; retour à BASE alpha1 ensuite.
La garde de dessin native est prouvée même pour renderState0, indépendamment
du matériau. Sources immuables, préparation/cache et raccordement post-mixer.
19 régressions groupées et un build commun réussis ; fondus/parents alpha
natifs et fidélité globale restent distincts.
[Lot](../../work/weapon-polish-20261025/equipped-binary-opacity/README.md).

25 octobre 2026 — aérien `chain_12` raccordé à son tour : six graphes actifs
natifs de 114 nœuds qualifient parents/ordre et suivi de la racine personnage.
Deux chaînes skinnées, clip propre `base`, helpers Box02/Box01 et quatre modèles
vides conservés. Les mentions historiques « aérien non observé » ci-dessous
sont dépassées pour ce périmètre. 24 régressions groupées, un build commun,
deux poses SG012 dans le jeu principal ; comparaison des pixels et autres
gates toujours ouverts. [Lot](../../work/weapon-polish-20261025/twin-air-chain/README.md).

25 octobre2026 — hiérarchie interne du lourd `chain_test` raccordée : une
seconde résolution qualifiée des parents reproduit les114nœuds des cinq
graphes actifs positifs, noms/ordre/parents compris. Dummy04, ExposeTransform04
et Bone12 passent sous le premier Bone09 final, index source45. Les noms
originaux restent inchangés ; cette reconstruction n'est pas généralisée.
Les deux chaînes sont désormais skinnées sur leurs six os uniques, avec
99repères source et six modèles auxiliaires invisibles animés. Deux pistes
auxiliaires filtrées auparavant sont récupérées dans un JSON complémentaire
authentifié, sans modifier les assets existants. Squelettes privés par slot
du pool et précompilation des shaders de skinning.20régressions groupées,
build commun et deux poses du lourd dans le jeu principal sans erreur console.
Cela lève le blocage de structure du lourd ; clock0, courbes exactes/pixels
natifs et hiérarchie aérienne chain_12 restent distincts et non certifiés.
[Livraison](../../work/weapon-polish-20261025/twin-chain-node-mapping/README.md).

25 octobre2026 — `chain` du lourd suit maintenant la racine SCN évaluée du
personnage, avec son échelle, au lieu d'une origine acteur figée. Cinq relevés
natifs positifs prouvent la copie du parent pendant un déplacement réel.
L'initialisation native à0ms reste distincte. `chain_12` aérien et le strike
différé ne sont pas extrapolés. Cela ne résout pas les os homonymes internes
de chain : ce blocage est conservé.23régressions groupées et build commun.
[Lot](../../work/weapon-polish-20261025/melee-actor-scene-follow/README.md).

25 octobre2026 — sons lourd/aérien raccordés à l'entrée de leurs états,
indépendamment des volumes600/210ms ; les sons cut2/cut3 restent aux activations.
Le son `spark_hit`, déclaré par les attributs de dégâts acteur ET décor, était
ignoré. Il est maintenant préchargé depuis la ressource authentifiée déjà
livrée, sans copie ni chargement pendant l'impact. L'ancienne affirmation
«aucun son de contact Twin» est invalidée par attackattribindexer.
Le son de charge supposé est retiré : champs du catalogue actuel vides,
préparation40ms sans preuve d'une charge sonore. Les fichiers disponibles
ne sont pas des événements.47contrôles groupés et build commun passent.
[Lot audio](../../work/weapon-polish-20261025/melee-audio-events/README.md).

25 octobre2026 — effet `chain.seq` : six graphes actifs de114nœuds observés
sur le personnage sélectionné. Le conteneur s'ajoute aux113nœuds source ;
les os homonymes sont réorganisés dans le graphe actif. Une reconstruction
par recherche récursive des noms conserve six écarts de topologie/ordre :
aucun parent n'est choisi arbitrairement et aucun correctif de production
n'est livré pour cette branche. Reprise : établir la correspondance exacte
entre nœuds source et clones actifs, puis leurs relations de parenté.
Le reste du lot avance ; gates inchangés.
[Preuves](../../work/weapon-polish-20261025/melee-active-hierarchies/README.md).

25 octobre2026 — adversaire Free training exposé avec les deux traînées
`loadTwinBladeActorTrails`, préparées et empruntées au cache. Lot de six armes :
`work/weapon-polish-20261025/melee-opponent-batch/README.md`. Les limites de
fidélité native ci-dessous sont conservées ; aucune arme déclarée prête.

3 octobre 2026. **En cours : adaptateur, ressources et raccordement partagé testés ; aucune certification native ni observation visuelle revendiquée par cet agent.** Intégrateur propriétaire des fichiers partagés. Procédure : [guide](../IMPORT-ARMES-GUIDE.md).

**Mise à jour20 octobre2026 :** les attentes de charge maintenue ci-dessous
décrivent l'ancienne reconstruction. Les captures natives du17octobre
(`work/parallel-gameplay-reference/heavy-primary-transitions/DELIVERY.md`)
établissent deux préparations40ms au sol puis le lourd automatique, même droit
maintenu ; Dodge n'en traverse qu'une. Le Controller avait déjà été corrigé,
mais deux anciens tests Twin attendaient encore SG016 pendant2.5s et une charge
complète au maintien2s. Ils suivent désormais les deux états brefs puis SG014.
La sélection du volume fullCharge reste une donnée source testée séparément,
sans inventer une commande permettant d'y accéder. Les relevés natifs couvrent
ces transitions homme ; les tests S5 couvrent les deux rigs, sans en déduire
une comparaison native femme ni une certification des poses haut/bas.

## Identité et preuves

- Runtime `twinblade`, item **2000010**, type **26**, `xbn/weapon.xml` : power15, range500, déplacement1.1, déplacement attaque1, charge_power_rate3. Le dernier facteur n’est pas automatiquement multiplié dans les dégâts.
- Archives copiées courantes : `work/s5runtime-local/private/client`, index `appearance-copy-resource-index.json`. **40 sources authentifiées** par longueur/CRC d’archive puis SHA256, listées dans `work/melee-batch-2/twin-blade/source-manifest.json`.
- Repos/marche lus séparément : `NormalState_DoubleSword`, `RunState_DoubleSword`. Actions : `weapon_doublesword.lua`, `actorstates_doublesword.lua`, et **`StandardBreakerAfterDash5` de weapon_breakersword.lua**, réellement lié au secondaire dans la table actuelle.
- Scènes `twinsword_r.scn` → `R_Hand_Dummy`, `twinsword_l.scn` → `L_Hand_Dummy`, alignement `Cs_Wea_Dummy`, rangement `Spine_Dummy`. Le code commun d’attache conserve déjà les deux hiérarchies.
- Corps M/F fraîchement décodés CC01 avec le décodeur statique existant, parsing jusqu’à EOF, sélection directe de 27 clips par sexe. Aucun processus natif exécuté.

## Contrat utilisable

| État | Déclarations actuelles | Clips M/F et contacts | Limites |
| --- | --- | --- | --- |
| Repos | NormalState | SG003, boucle, vitesse1, blend1000ticks | Observation principale requise |
| Marche | RunState upper/lower | SG004–SG011 / 00008–00015, clés sémantiques conservées | Conversion présentation alignée sur les jambes Counter actuelles ; huit directions visuelles non comparées |
| Premier coup | AfterDash1, normal800/delay150 | SG000/SG026 ; 100ms power×.5, 350ms power ; BOX .8/.5/.7×range | MoveBox×1.7, arrêt au dommage ; fitting animation natif à confirmer |
| Coup suivant sur clic court | AfterDash3, normal800/delay300 | SG002/SG028 ; 50/400ms power×.4 ; deuxième BOX commence à z+200 ; push(150,2000,-5000) | Passage1→3 établi par82c000→state48→810950→82cc40 ; entrée0..750 différée strict>750,751..max immédiate |
| Critique du coup3 | Attack3,400ms | MAKERAY origine(0,250,-100), longueur range−50 ; power×.6+additionnel | Conservé dans sourceContacts ; exclu par défaut, géométrie/règles critiques non portées |
| Aérien | JumpDash, normal600/delay600 | SG012/SG013 ; BOX210ms, power ; blow(1500,2000) ; drop500ms(0,-10000,0) | MoveBox recule en source ; physique et fitting à observer |
| Relâchement lourd | AfterDash4, normal800/delay600 | SG014/SG015 ; deux BOX **alternatives** à600ms selon SetFullCharge ; chacune power×.5 ; blow(1400,1000) | Seuil2000 déclaré en InitLua, sélection/charge/SP natifs non décodés |
| Secondaire | right_attack → StandardBreakerAfterDash5 | moveRate1, InitLua(40,0,0,false,true,3), upper vide, lower SG016 à l’arrêt / SG018–SG025 en marche | Ne pas remplacer silencieusement par GatherGuage ; SG016 corps complet est une approximation |
| Gather | left_attack5 → StandardDoubleSwordGatherGuage | moveRate.7, mode2, mains R/L, lower SG017 bouclé à l’arrêt | Routage d’entrée exact non établi |

Les sources InitLua40/modes3 et2 et les relevés natifs du17octobre soutiennent les deux préparations brèves au sol, conservées séparément. Les contacts utilisent des activations séparées. `fullCharge` choisit un seul BOX lourd ; sa commande d'accès reste non qualifiée. Les deux dégâts normaux du coup3 ne contiennent pas AdditionalPower dans le Lua. La faute `AddtionalPower`, `GUARDCRUSH_DISENABLE` aérien et l’attribut critique déclarant KATANA_A_SWORD restent signalés.

## Code et ressources

- `src/twin-blade-data.js` : définition MELEE, mapping locomotion, profils/contacts, états sources, poses et incertitudes.
- `src/twin-blade-motion-data.js` : durées et courbes MoveBox M/F régénérées.
- SG026/SG028/SG013/SG015 n’ont pas de piste MoveBox directe ; leur déplacement de récupération nul est marqué `missingNativeTrack:true`, sans prétendre certifier le fallback BASE natif.
- `src/twin-blade-effects.js` : chargement et événements sourcés. Aérien chain_12@0 ; lourd chain@0 et skill_doublesword_strike@500ms.
- `public/assets/s5runtime/twin-blade/` : modèle, animations M/F, textures, six sons, cinq séquences et JSON runtime, environ13.9Mo. Le manifeste fournit les empreintes de chaque fichier.
- **Ancien blocage résolu** : weapon_twinseord_charge.seq et weapon_twinseord_charge_loop.seq sont présents dans les archives actuelles, authentifiés, convertis jusqu’à EOF, textures résolues. Leurs déclenchements/suivi natifs restent non établis.
- Quatre maillages d’effets Box sans texture source sont explicitement omis (chain:Box02/Box06 ; chain_12:Box02/Box01), sans texture de substitution. Les séquences brutes et les limites sont conservées.
- Préparation reproductible : `work/melee-batch-2/twin-blade/extract_current.py`, puis `stage.mjs`. Les données runtime ne dépendent pas des dossiers privés au chargement.

## Vérifications réalisées

`node --test tests/twin-blade-data.test.mjs` : **5/5 réussis**. Sources/contacts/alternatives, BOX dans huit orientations, SHA et fermeture des ressources, skin indices uint32, véritables avatars M/F et mixer pour repos/huit marches/actions/récupération/retour au repos. Les matrices finies ne prouvent pas l’angle ou la position visuelle des lames.

`node --test tests/twin-blade-gameplay.test.mjs tests/twin-blade-data.test.mjs` : **10/10 réussis** après raccordement partagé. Controller/MotionGraph réels : 48 parcours (M/F × huit directions × trois orientations), arrêt/reprise, quatre activations combo1→3 sans ray critique, charge mobile dans huit directions, relâchement simple/complet sélectionnant un seul volume, recul aérien avant drop, changement depuis chaque action et collision murale. La charge utilise encore la décélération S5 générique (arrêt testé dans une fenêtre de320ms), pas une constante native mesurée.

| Contrôle | État de cette livraison |
| --- | --- |
| C01 accès/switch | Assets transportables vérifiés ; menu/controller raccordés par l’intégrateur, observation principale à faire |
| C02 directions | Contrat sémantique et clips évalués M/F ; comparaison visuelle à faire |
| C03 attache | Deux sockets/hiérarchies et indices de skin valides, mixer exécuté ; grip/orientation à observer |
| C04 visée | Sans application démontrée : aucun triplet de visée déclaré dans les états mêlée lus |
| C05 mobilité | Charge lower séparée et mobilité/arrêt/reprise testés ; rendu M/F à observer |
| C06 effets | Cinq séquences/fermeture vérifiées ; déclenchement visuel et extinction à observer |
| C07 projectiles | Sans objet dans les sources : attaques BOX/RAY de contact instantané |
| C08 particules | Champs natifs convertis ; espaces/suivi encore non comparés |
| C09 poussée | Conditions source disponibles ; déplacement réel des victimes à vérifier par intégrateur |
| C10 balles ordinaires | Sans objet : arme mêlée avec réactions explicitement déclarées |
| C11 dispersion | Sans objet : aucune émission de projectile ni appel dispersion dans ces attaques |
| C12 audio/secondaire | Six OGG disponibles, routage secondaire exact consigné ; écoute à faire |
| C13 combos/contacts | Quatre contacts, collisions, changement d’arme et actions testés ; clic court1→3 et seuil750 natifs portés ; clic long, charge et ray critique encore ouverts |
| C14 régressions/build | À exécuter par l’intégrateur après modifications partagées |

Contrat central/gate/ARMES : intégrateur responsable. Aucune comparaison S5Runtime ni capture principale effectuée par cet agent. Aucun blocage de récupération de ressources restant ; priorité suivante : tests gameplay puis observation principale M/F et correction éventuelle des directions/attaches.

## Raccordement du lot

Menu principal, inventaire et touche0 actifs. Loader des deux rigs/modèles, contrôleur, contacts normaux, courbes, audio disponible et deux cues heavy raccordés. Deux WeaponTrail suivent les maillages droite/gauche sur la fenêtre50–600ms ; rendu ruban S5 explicitement approximatif. 1474/1478 tests globaux, quatre échecs préexistants, contrat10/10, buildcode0. Captures main game dans work/melee-batch-2/visual : repos, marche et contact sur les deux sexes (HP77,5 après deux activations), sans erreur console. Les vues restantes sont consignées au fil du contrôle ; aucune certification S5Runtime.

## Correctifs utilisateur : agent Twin dédié

3 octobre2026, suite au retour sur les cinq manques : droit aérien lourd SG014,
charge SG016 avec ses bras animés (curseur1 puis maintien à2.5s), nouveau cap au
démarrage de chaque frappe, rotation des offsets d'émetteur skill_doublesword_strike,
suspension verticale avant SetDrop500/400ms avec recul MoveBox conservé.
Le lookup de durée MoveBox Twin reçoit aussi le paramètre weapon manquant.
`tests/twin-blade-fidelity.test.mjs` reproduit ces cinq défauts et passe après
les raccordements de l'intégrateur : **15/15 tests Twin** avec les deux suites
existantes, ressources/mixer inclus. Contrôles principaux/build de ce correctif
consignés par l'intégrateur.

La pose haute SG016 remplace l'ancien SG003 figé : ses pistes bras sont présentes
dans les deux porteurs actuels, mais la propriété native de l'upper vide/lower
reste une reconstruction explicite. Le routage du clic long, le timer de fullCharge2s,
SP/power3, chargeVFX, ray critique, HitStop exact, follow des séquences et impacts
sur surfaces restent non certifiés. Inventaire précis et causes dans
`work/twin-blade-fidelity/README.md`. Ces correctifs ne transforment pas le gate
natif non prêt en arme certifiée.

## Polishing commun des impacts, 3 octobre 2026

L'origine fixe `victime.y+1` est remplacée dans le résolveur par le point
du record natif BOX/FAN/CYLINDER. Le calcul est testé pour Twin M/F dans
huit orientations ; l'effet de contact apparaît dans le jeu principal sur
les deux personnages, sans erreur console. Les offsets de la séquence et
le lien natif record→VFX restent non certifiés. Preuve et captures :
[`impact-points.md`](../../work/melee-batch-5/impact-points.md).

## Polishing du combo court : transition native

`src/twin-blade-input.js` est consommé par `melee-weapons.js`. Le clic court
du premier coup rejoint bien SG002 : les plages natives corrigent le délai
S5 de800ms en strict>750ms et rendent le clic tardif immédiat à partir de751ms.
81 régressions ciblées passent, build réussi ; Controller M/F × huit caps,
réorientation au lancement et changement d'arme couverts. Preuves détaillées :
[twin-native-combo.md](../../work/melee-batch-5/twin-native-combo.md).
Clic long target44 porté sous forme de demande consommable dans
`twinBladeNativeInputRequests` ; l'adaptateur conserve sa demande non résolue.
L'enfant Twin existe dans le factory, mais le rechargement de configuration
et son Enter/Tick restent ouverts. 83 régressions ciblées et build réussis
après ce port ; aucun rendu de44 inventé.
Ordre événement immédiat→Tick différé corrigé dans l'adaptateur, permission
de cible explicite :85 régressions ciblées et build réussis. Rechargement
Lua conditionné au callback+14c désormais tracé ; comportement renderer des
paramètres d'animation non configurés encore inconnu.
Cette vérification numérique ne remplace pas une nouvelle observation visuelle.

25 octobre2026 — poussées simples raccordées au moteur de déplacement source
commun, avec leurs durées/accélérations propres, sans lift arbitraire. Pour
Iron Boots léger2, DamageData0 conserve désormais l’attaque et les clocks
de réaction en cours tout en appliquant le recul. Les contacts mixtes gardent
leur politique antérieure non certifiée. Lot commun498 contrôles et build :
[rapport](../../work/melee-pvp-comparison-20261017/capture-expansion-v2/source-melee-push-batch-20261025/REPORT.md).
Aucune qualification native complète ni nouveau statut prêt.
