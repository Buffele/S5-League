# Submachine Gun — reprise du 14 octobre 2026

**23 octobre — raccord Conquest :** capture par sous-pas du vrai Controller,
rayon après dispersion et livraison vers la Health de l'acteur, notification
King unique et changement d'arme conservant la même cible. Test du main réel,
profils source et régressions passent. Contrôle navigateur : deux balles réelles,
30→2PV, attribut8,14 dégâts/balle sous politique S5 plain-item/FREE2 explicite.
Ne pas confondre avec le profil legacy destructible2010000/3.5 : item courant
2010001/7. Aucun Push ajouté ; admission PartialAnim et comparaison native restent
ouvertes. Voir `work/game-modes/conquest-recovery/conquest-smg-npc-shots-20261023/HANDOFF.md`
et `work/game-modes/conquest-recovery/pawn-finalization-20261023/smg-real-browser-shots.json`.

**21 octobre2026 — interaction Shield :** le rayon primaire définitif utilise
désormais le masque MAKERAY authentifié et le cutoff Shield avant dégâts/VFX.
315tests/build passent ; gates DAMAGEMOVING/PartialAnim et comparaison vivante
S5Runtime toujours ouverts. [Livraison commune](../../work/shield-ranged-integration-20261021/DELIVERY.md).

18 octobre — réception à distance : le script actuel et son helper de motif ne déclarent pas de Push/Blow/Stun, mais ATTACKATTRIB_SUBMACHINE_GUN active DAMAGEMOVING et PartialAnim00016. La nouvelle chaîne typée du registre établit une lecture exacte ENABLE1 vers la locomotion inférieure de l'état dommage ; elle ne définit pas une impulsion de recul. Le consommateur d'animation partielle est retrouvé séparément, avec mélange variable et remplacement au nouveau déclenchement. Son masque de onze nœuds, son activation au chargement frais/cache et sa porte de distance à la caméra sont établis statiquement. La durée0 saute le changement d'état dommage complet mais conserve ce chemin partiel. L'admission contextuelle du record reste à qualifier avant raccordement. S5 accepte actuellement les PV sans déplacer une cible passive ; cette baseline ne prouve pas la fidélité native. Voir [reprise et preuves actuelles](../../work/automatic-rifle-reactions-20261017/FOLLOWUP.md). Ne pas ajouter une poussée arbitraire ni considérer le recul comme validé sur la seule absence d'AddPushCondition.

Statut au15 octobre : runtime expérimental raccordé au jeu principal ; fidélité native non certifiée.
Item2010001, type natif2. Aucun gate de fidélité déclaré prêt.

## Sources et ressources vérifiées

L'extraction depuis `work/s5runtime-local/private/client/package` et son index
actuel a retrouvé neuf ressources, toutes conformes aux CRC de l'archive :
les deux modèles gun_r/gun_l, handle2.dds, bar_gun3.dds et cinq sons,
dont smg_reload.ogg. Les deux rigs principaux ont aussi été extraits avec
leur CRC ; le décodage CC01 emploie le module natif fingerprinté déjà utilisé
pour les autres armes, sans exécution native dans le convertisseur.

`tools/restore-submachine-gun-assets.mjs` reconstruit les modèles et textures
pour le navigateur, les sons et les deltas de37 clips directs par sexe.
Chaque scène atteint EOF, les parents et matrices correspondent au rig S5,
et aucun alias d'animation n'est créé. Le manifeste des sorties est
`public/assets/s5runtime/weapons/submachine-gun/runtime-manifest.json`.
Les CRC/SHA bruts sont dans `work/submachine-gun-recovery/source/manifest.json`
et `rig-source/manifest.json`.

Les anciens chemins de travail d'un autre PC ne sont pas utilisés. Les anciens
statuts « textures indisponibles » et « son de recharge absent » sont levés
par ces extractions ; ils ne validaient pas le comportement du jeu.

## Contrat à raccorder

Les fonctions ont été lues séparément dans les Lua de la copie actuelle :

- NormalState_SubMachineGun : D0026, boucle, vitesse1.
- RunState_SubMachineGun : D0027–D0034 pour le haut et00008–00015 pour le bas,
  selon les huit clés sémantiques. Courbes de locomotion vérifiées sur les deux rigs.
- UseWeapon1State_SubMachineGunAttack : blends D0000/D0001/D0002 au repos et
  en l'air, D0004–D0011 avec leurs variantes _1/_2 en déplacement.
- ReloadState_SubMachineGun : D0003 ; couche basse directionnelle distincte
  pendant le déplacement. Durée Lua2000ms ; fitting natif à comparer.

Les corps et empreintes de ces fonctions sont référencés dans le manifeste.
L'ancien désaccord des courbes D0009–D0011 homme/femme n'est pas corrigé par
un échange arbitraire de clips. Il reste à observer les sélections natives.
L'ability du catalogue actuel indique chargeur30, cadence8, puissance7,
move_speed_rate1.05 ; ces valeurs ne remplacent pas la lecture de leurs
conditions de combat, dispersion, critiques et interactions.

## Vérifications réalisées

`node --test tests/submachine-gun-assets.test.mjs` :3 tests réussis.
Les textures sont réellement décodées en PNG et tous les fichiers publics
correspondent à leurs empreintes. Le chargeur d'avatar S5 lit les37 clips
sur les deux personnages. Les quatre maillages sont présents et les dummies
restent attachés à la main droite et à la main gauche après le mixer,
sur le repos, les huit courses, la recharge, le tir neutre et les fondus.

## Raccordement au jeu principal — 15 octobre

`src/submachine-gun-runtime.js` conserve les clés sémantiques Lua, puis adapte
une fois les côtés au repère S5. La source weapon_attach.x7 type2 indique
R_Hand_Dummy pour la scène0 et L_Hand_Dummy pour la scène1, avec link0.
L'ancienne attache avant-bras gauche provenait d'une mauvaise association ;
elle a été corrigée après inspection visuelle. Le générateur lit maintenant
ces entrées et en conserve l'empreinte ; le test compare sorties et source.
Le chargeur principal sélectionne les modèles
et deltas sans paramètre de prévisualisation. L'arme est dans le menu,
l'inventaire, le HUD et la touche U ; tir automatique125ms, chargeur30,
recharge2000ms et déplacement1.05 sont raccordés. La réserve illimitée
représente les valeurs max_ammo/max_ammo_limit=-1 ; leur sémantique complète
reste à comparer au compteur natif.

Les triplets de tir sont des poses **haut/centre/bas**, pas des couches
haut/bas du corps : D0001 au centre, D0000/D0002 selon le pitch, et variantes
directionnelles D0004–D0011 avec _1 au centre et _2 vers le bas. Le canal
inférieur source utilise D0002 à l'arrêt et les _1 en mouvement. Recharge :
D0003,10800ticks sur chaque sexe, ajustés à2000ms ; jambes D0027–D0034
ajustées à800ms, distinctes des jambes ordinaires00008–00015.

`prepare-submachine-gun-effects.mjs` vérifie16 ressources réextraites avec
leurs CRC/SHA, dont attackattribindexer.lua et les dépendances des effets.
Les séquences actuelles sont identiques aux séquences converties partagées :
gun_blast1_1, gun_hit4, gun_hit. Chaque tir joue **les deux flashes**,
mais une seule balle/consommation depuis Gun_L_Fire_Dummy, conformément à
l'attribut. Les cinq sons sont branchés. Le motif API>=2 de32 points est
comparé directement au Lua. Dégâts7 et déclin4000→8000 jusqu'à20% sont
raccordés ; les balles ordinaires ne figent pas la cible.

Preuves : `work/submachine-gun-recovery/runtime-regressions.tap` :40 tests
réussis, dont les deux rigs, huit directions à plusieurs orientations,
attaches après mixer, visée haut/centre/bas, recharge mobile, impacts depuis
le canon gauche, annulation/changement et cadence30/60/120Hz.
`central-contract.tap` :12 réussites ; `build.log` : build réussi.
Le gate `native-gate.json` demeure non prêt, y compris pour cette famille.

Captures du **jeu principal compilé** : `main-game/*.jpg`, avec sélection
effective de D0026, D0027–D0034, D0003 et D0009_1. Le scénario rifle-contact
fait désormais converger le tir vers la cible comme la visée normale :
quatre tirs donnent ammo26 et HP72, réaction nulle. Sans cible explicite,
son ancien rayon horizontal partait du canon haut et ratait la boîte.
Les captures antérieures à la correction de main sont conservées séparément
dans `main-game-before-hand-correction/` ; elles ne prouvent pas le rendu
après correction.

`capture_smg_reference.py` a rejoué une entrée native avec sélection vérifiée
sur chaque sexe et capturé repos/tir avec déplacement demandé.
`native-hand-correction-v2/` montre les deux canons en mains, le flash natif,
la réserve∞ et une consommation29→20. Le v1 capturait trop tôt le backbuffer
précédent, dont START ; il ne prouve pas les poses annoncées. Le v2 laisse
stabiliser et jette une capture de chauffe, puis garde l'état des entrées.
Ces vues sont exploitables pour revue qualitative, sans mesure automatique
d'angle ni certification des IDs de clips mobiles.

## Portée configurée — comparaison du15 octobre

L'ancienne coupure d'arène8000 unités natives était confondue avec la fin
du déclin des dégâts. Elle est retirée. Le moteur charge RayDistanceLimit
depuis le minimum de FogMaxDist, CullDist et de l'option33. Le PE contient
25000 avant chargement ; la portée devient15000 sur Station-2 et20000
sur Circle-2 avec l'option native observée28000. L'inspecteur refuse le
lobby, où les champs graphiques peuvent déjà différer de la portée retenue.

`range-analysis/native-map-cases-v2.json` :12 actions natives réussies,
SMG/Revolver/Semi Rifle × deux corps × deux cartes. Le minimum et son carré
float32 sont comparés aux globals natifs, après les gates de partie,
d'équipement et de consommation réelle de munitions. Le v2 rejoue ces cas
avec empreintes de huit outils, identiques avant/après capture ; le v1 reste
archivé. Les INI courants
réextraits concordent avec les champs mémoire. Le code S5 utilise les mêmes
profils sur les cartes classiques et leurs variantes visuelles ; changer
de carte ou d'arme recalcule le plafond, sans utiliser le brouillard visuel.
L'arène S5 sans carte native garde la constante initiale25000 explicitement.

`tests/native-rifle-range.test.mjs` compare les12 plafonds au contrôleur S5
et teste ses surfaces cibles immédiatement de part et d'autre du plafond,
les projectiles du Revolver, les changements de carte et la persistance
du minimum20% des dégâts SMG au-delà de8000. Cela ne remplace pas un tir
sur cible native distante : HP, volumes et collision native restent ouverts.
`range-analysis/regressions.tap` :54 tests JS ; trois tests Python du lecteur
et build réussis.

Restent : angles/positions comparés au natif, sélections de tir mobile
arrière/diagonales sur les deux corps, blend de pitch et récupération de
dispersion, collisions/HP natifs à la limite de portée, volumes critiques/parties du corps,
armure/garde/conditions, transitions aériennes et equip/stow, comparaison
quantitative des effets et sons. L'objectif global reste ouvert.

### Reprise des mesures d'angles

La mesure quantitative des poses mobiles reste bloquée pour ce passage.
Dernière avancée sur ce point : captures natives du14 octobre22:28:58UTC
(15 octobre00:28:58Paris). À00:59Paris, trente minutes se sont écoulées sans
nouvelle mesure d'angle/clip native ; le travail indépendant sur les portées
ne constitue pas une preuve de pose. Les vecteurs des SCN distinguent les
poses de pitch mais pas la sélection live ; le v1 capturait un backbuffer
précédent, le v2 apporte une revue qualitative sans ID de clip ni matrice.
Condition de reprise : lecture validée des canaux/clips actifs et des matrices
évaluées main/arme dans la copie native, pour les mêmes entrées et horloges.
Conserver les écarts arrière/diagonaux ouverts ; prochaine famille à raccorder :
Cannonade, sans attendre une confirmation entre armes.
