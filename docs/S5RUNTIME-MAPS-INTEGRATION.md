# Intégration des cartes S5Runtime

Consignes de production révisées le 20 octobre 2026 :
[objectif de la série](OBJECTIF-CARTES-S5RUNTIME.txt). Pour les prochaines adaptations,
aucun recours à Meshy ; textures détaillées et variées via ImageGen, panoramas
via l'API OpenAI avec la configuration Windows existante. Cette révision prévaut
sur les anciennes consignes de génération et de production décrites ci-dessous.
Les bilans suivants restent les preuves historiques des lots déjà réalisés.

## Azit — reconstruction Blender demandée le 23 octobre 2026

La nouvelle demande Azit porte sur une reconstruction visuelle modulaire dans
Blender, après inventaire détaillé, et remplace la limitation à une réfection
des atlas sur les seuls modèles visibles existants. Voir le complément Azit au
début de `OBJECTIF-CARTES-S5RUNTIME.txt` ; les autorités de gameplay restent protégées.

Le dossier de préparation se trouve dans
`Documents/Codex/2026-10-16/station2-modular-optimization/outputs/Azit-Reconstruction-Blender/`.
`index.html` réunit les vues, régions d'atlas annotées et fiches de conception.
`Azit-SOURCE-REFERENCE.blend` reste la référence source contrôlée et découpée.
La première reconstruction éditable est désormais dans
`Azit-REFUGE-SOLAIRE-Reconstruction-v2.blend` : architecture, mobilier et
équipements sont séparés des autorités protégées. Les 514 partitions visuelles
possèdent un remplacement, soit 396 058 triangles artistiques regroupés en
158 groupes de matériau/propriétaire dans les trois GLB livrés à S5.

La première passe est activée pour l'exploration libre d'Azit. Le contrôle dans
le jeu complet couvre marche, saut, atterrissage, reset et sept destructions
suivies de restaurations avec l'horloge réelle. Les contacts de dégâts sont
des fixtures ciblant les faces source, pas une validation de chaque arme.
Les 6 404 faces de collision et les autorités S5Runtime sont inchangées. Sur ce PC
(RTX 3070), la séquence mesurée atteint environ 130 images/s ; cette mesure ne
certifie pas toutes les configurations. Les preuves sont dans
`work/azit-blender-reconstruction/build/main-game-review/verification.json`.

La finition des matières, de la signalétique et des effets ainsi que les règles
natives et la qualification des poses des machines restent en cours.
`nativeReady` et `gameplayReady` restent faux : première passe intégrée ne veut
pas dire carte finale validée. La v2 ajoute des détails de capsule et de sol, une signalétique ImageGen lisible et des ombres. Les PNG identiques sont mutualisés : 14,38 Mo économisés (21,46 %), et quatre allocations de texture en moins dans la revue Three. Le soleil partagé d'intensité nulle ne lance plus une passe d'ombre inutile. La preuve finale sans surcharge de configuration est dans `build/main-game-review/production-default/verification.json` ; 44 contrôles ciblés passent. Aucun build S5 supplémentaire n'a été lancé.

Les données reproductibles sont dans `work/azit-blender-reconstruction/` :
65 modèles, 96 nœuds, 514 partitions diagnostiques couvrant exactement les
14 928 triangles visibles, 20 atlas, 150 régions et 581 observations de texture,
18 groupes rapprochés visuellement et 77 observations géométriques. Les 61
familles de conception ne désignent pas 61 objets source certifiés. Les comptes
de partitions, d'objets, de régions d'atlas et de propositions restent distincts.

Les vues ont notamment confirmé six robinets, douze pots de nouilles et deux
volumes imprimés. Seules cinq évacuations sont identifiées. La séparation du
corps et du socle d'un pad dans la pose statique source reste à qualifier avant
son assemblage artistique ; ne pas la corriger par un déplacement supposé.

Reprise demandée le17octobre2026 : priorité aux cartes après le pilote Alice.
Les48 choix artistiques et les exclusions utilisateur restent ceux de
`work/s5runtime-map-native-adaptation/approved-directions.json` et de la sélection
validée. Aucune génération artistique ni géométrie n'est recommencée.

## Lot Bio Lab19 et Blade City158

| Carte | Direction | Blender retenu | S5 |
|---|---|---|---|
| Bio Lab19 | C, Laboratoire abyssal | `bio-lab-refinement/bio-lab-c-v3.blend` | Exploration libre |
| Blade City158 | B, Manufacture électrique | `blade-city-refinement/blade-city-b-refined-v3.blend` | Exploration libre |

Les chemins Blender sont relatifs à `work/s5runtime-map-native-adaptation/`.
Les maîtres, textures et copies d'autorités restent conservés. La nouvelle
apparence est exportée depuis ces `.blend` en tuiles de couleur sans modifier
les UV natifs. Le fond choisi3840×1920 est copié avec empreinte identique.
L'émission Bio utilise la même tuile que BaseColor, conformément au graphe
Blender. L'éclairage de Blade emploie une approximation Three explicite du
ciel neutre, distincte de son panorama orange conservé côté caméra.

Les235modèles Blade et131modèles Bio des projets sont contrôlés après
réouverture Blender : sommets, indices, UV, matrices et autorités exacts.
Le runtime conserve les scènes et leurs parents DFS en ordre d'insertion,
avec frontière unique.006, Yvertical et aucun miroir Z. Aucun sol ni mur de
remplacement n'est ajouté. Bio garde6199triangles de mouvement source et6186
dans la vue compatible avec le solveur S5 ; les13rejets documentés restent
dans les buffers. Blade conserve1761faces sans rejet. Les candidats d'armes
restent séparés :7217Bio et1856Blade.

Les contrats de50apparitions sur quatre variantes passent les simulations de
stabilité. Le point de chaque prévisualisation est explicitement sélectionné,
projeté sur un vrai sol source, contrôlé avec le corps S5 et orienté selon
l'axe Z du marqueur. Cela ne certifie pas l'attribution native des joueurs.

Les nouvelles cartes sont limitées à l'exploration libre. `nativeReady` et
`gameplayReady` restent faux. Bio garde30objets destructibles identifiés,
une zone DOT poison et ses références FX à raccorder. Blade déclare un groupe
de fenêtres dans BGINFO mais aucune instance correspondante dans les scènes
chargées ; aucune fenêtre de remplacement n'est inventée. Les règles de
match et animations natives restent des étapes distinctes. Aucune de ces deux
variantes n'est Touchdown : aucun repère de camp Alpha/Bêta n'est ajouté.

## Preuves et reproduction

- `next-maps-runtime-audit/README.md`, quatre contrats et rapports : sources,
  modes, catégories, comportements,50apparitions et comparaison indépendante
  de tous les points monde, écart maximal0.
- `tests/native-source-map-world.test.mjs` :6contrôles des vrais buffers,
  déplacements/sauts du vrai Controller et refus des contrats altérés.
- `next-maps-runtime-audit/artist-loader-qa.json` :8contrôles des vrais PNG,
  matériaux, nettoyage et restauration complète de scène.
- `alice-runtime-game/maps-browser/verification.json` : revue navigateur du
  build figé, lobby/Start et vrais mouvements clavier, portée explicite.
- `runtime-art/export_runtime_art.py` : export des graphes Blender ;
  `apply-blade-runtime-lighting.py` : adaptation lumineuse déclarée.
- `publish-next-map-sources.py` : publication byte-identique des autorités.

Le port5207 sert le lot de cartes depuis `alice-runtime-game/build-maps`.
Le port5205 conserve la précédente prévisualisation Alice du pilote.
Les ports5192/5206 appartiennent à l'autre travail de l'utilisateur.

Le raccordement étendu des armes aux destructibles a été interrompu lors de
ce changement de priorité. Les ajouts Cannonade non validés ont été retirés
du runtime actif et archivés dans `alice-destructibles-qa/cannonade-prototype-shelved/`.
Les lots mêlée/rayons déjà testés restent conservés avec leur handoff ; aucun
état partiel n'est annoncé comme fidélité native complète.

## Alice : correction du rendu des textures dans S5, 17 octobre

Audit des 122 slots : UV et PNG couleur/transparence corrects. Le rendu S5
ometait les ombres locales et utilisait une anisotropie de 1, avec un éclairage
RectArea trop fort par rapport à la référence Blender. La correction Alice
active une ombre solaire 2048 ajustée aux seules géométries visibles, préserve
sa direction et son intensité, réduit les RectArea à 0,35 et applique une
anisotropie maximale de 8 selon le GPU. Les vitrages transparents ne deviennent
pas des parois opaques dans le calcul d'ombre ; les découpes alpha sont conservées.

Une AO neutre 512 calculée dans Blender est reliée uniquement aux 15 slots
du sol via les UV1 natifs inchangés. Les 27 destructibles sont exclus de ses
occluders. Les autres atlas sont omis à cause de chevauchements UV réels.
Les 19 PNG couleur/alpha, champs originaux des matériaux, buffers, collisions,
apparitions et .blend source sont conservés. Il s'agit d'une adaptation raster,
sans revendication de parité Cycles ou shader S5Runtime.

Le build corrigé isolé est servi sur le port5323 ; le port5322 est le diagnostic
du vrai loader. `alice-texture-fix/after-5323/report.json` enregistre une entrée
par lobby/salle/Start dans le jeu principal et trois vues identiques à l'audit,
sans erreur page/HTTP. SwiftShader sert au contrôle visuel, pas à mesurer les FPS
matériels. `tests/alice-house-texture-rendering.test.mjs` couvre les ombres,
UV/buffers, alpha, AO, filtrage et libération des ressources.

### Régression personnage noir et fond sombre, corrigée le même jour

Le premier contrôle visuel avait manqué le personnage noir sous le plafond du
spawn. Les matériaux toon des acteurs n'utilisent ni l'environnement PBR ni les
RectArea ; annuler le Hemisphere global sans remplacement les laissait sans
lumière diffuse lorsque le soleil était masqué. Une Hemisphere locale à Alice,
intensité 0,9, rétablit cette lumière. Elle appartient à la racine de la carte :
les autres cartes retrouvent leurs lumières globales sans conserver ce remplissage.
Les textures et matériaux des personnages ne sont pas modifiés.

Le fond utilisait aussi la faible contribution PBR 0,32 comme luminosité visible.
`background.displayIntensity=1` est désormais indépendant de `background.intensity`.
La première source Alice 3840x1920 était un agrandissement du maître 1774x887 ;
il ne faut pas la présenter comme une génération native 4K. Après autorisation
API explicite et configuration locale par l'utilisateur, un nouveau panorama
3840x1920 a été livré directement par l'API ImageGen gpt-image-2, qualité high,
sans redimensionnement local. Il conserve la composition Alice avec Azure en
référence de finition. `textures/alice-house-a-sky-native4k-v2.png` remplace le
fond initial dans le runtime. SHA256 :
`564b9cb0c7856633277b416ad7edfffdb26c2920fe4bd0e5ce8cbdd877151373`.
Le prompt et `alice-texture-fix/native4k-provenance.json` documentent cette
révision ; le .blend v3 et son ancienne image sont conservés. Un réexport
artistique depuis ce .blend doit préserver ce nouveau choix de fond runtime.

`alice-texture-fix/character-background-qa/report.json` conserve deux sessions
réelles lobby/salle/Start, masculin et féminin, captures avant/après du remplissage
au même endroit couvert, vues avant/arrière et comparaison de luminosité du fond.
Zéro erreur page/HTTP. Les 47 contrôles ciblés incluent le nouvel invariant de
lumière diffuse et la restauration de scène. Le build corrigé est publié sur5323,
avec le candidat identique testé sur5324. Les anciennes captures/47 tests ne
doivent pas servir de preuve de validation du personnage.
