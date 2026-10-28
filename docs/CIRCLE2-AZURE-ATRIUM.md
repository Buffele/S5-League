# Circle 2 · Azure Atrium

## Version détaillée — 25 septembre 2026

### Ciel anime haute résolution

Après autorisation explicite, le workflow ImageGen CLI/API a produit un
panorama natif **3840 × 1920** avec `gpt-image-2`, qualité haute, à partir
du ciel anime v2. Le fichier de 9,36 Mo conserve les cités flottantes et
la palette d'origine ; aucun agrandissement local n'a été effectué.
Ne pas réintroduire le panorama photographique rejeté. Aucune clé API
n'est enregistrée dans le projet.

### Contenu intégré

- 8 arbres, 16 buissons fleuris, 8 fougères et 5 masses rocheuses importés
  depuis le Stylized Nature MegaKit de Quaternius (CC0), avec leurs textures.
- Une sonde sphérique téléchargée chez 3D Assets (CC0), adaptée en ivoire/cyan
  et instanciée trois fois. Routes continues à 38, 54 et 70 unités du centre,
  hors de l'aire jouable de rayon 26 ; pas de collisions ni d'ombres de drone.
- Ciel anime régénéré à partir de la direction originale : cités flottantes
  ivoire/cyan, mer de nuages et lumière chaude. ImageGen CLI/API, contours
  et détails redessinés. Fichier natif **3840 × 1920**, 9,36 Mo.
- Le panorama photographique Poly Haven 8K a été explicitement rejeté par
  l'utilisateur pour rupture de direction artistique. Il n'est plus chargé
  ni distribué ; sa copie locale est archivée et ignorée par Git.
- Voile de brume animé, pollen, léger vent dans les feuilles, trois anneaux
  lumineux et faisceau autour de la balise. Aucun nouvel objet créé par frame.
- 48 inscriptions physiques, 16 emblèmes originaux, dallage céramique texturé
  en deux teintes, panneaux contrastants, grilles et marquages corail.
- Îlots lointains avec rochers texturés, tours vitrées à étages, couronnes
  arrondies et terrasses plantées. Volumes, jardinières et couvertures adoucis.

Le Space Kit de Kenney est **exclu** : aucun modèle intégré, téléchargement
local ignoré par Git. Les sondes ne proviennent pas de ce kit.

### Sources et reproductibilité

- `art/circle2-imports/sources.json` : sources Quaternius et SHA-256.
- `art/circle2-imports/probe-source.json` : source de la sonde, SHA-256,
  provenance assistée par IA déclarée par son éditeur et adaptations.
- `art/circle2-atlas/sky-anime-4k-provenance.json` et
  `sky-anime-4k-prompt.txt` : prompt exact, référence, modèle et dimensions
  réelles du ciel courant. La provenance v2 reste conservée pour l'historique.
- `art/circle2-atlas/sky-8k-source.json` : historique du fond photo rejeté.
- `public/assets/circle2-atlas/CREDITS.md` : crédits distribués avec le jeu.
- `tools/circle2-import-library.py` : imports réels ; un fichier absent
  fait échouer la construction, sans remplacement procédural silencieux.
- Source Blender : 938 meshes éditables, textures incorporées, deux caméras.
  Export : 33 modules, 136 220 triangles, 13 matériaux, 9 images incorporées,
  environ 14,63 Mo, plus le panorama externe.

Le rendu noir des imports a été corrigé en liant explicitement l'attribut de
couleur `Color` lors du regroupement. Les feuilles utilisent une découpe alpha
double face, sans tri transparent. Le verre de la sonde reste opaque pour
éviter une passe de transmission coûteuse.

### Contrôles

- 16 tests Circle 2/atmosphère : provenance et hashes, panorama anime, budgets,
  feuilles, routes et partage des meshes des sondes, buffers d'effets.
- 3 160 triangles de collision inchangés ; spawn et sols, 16 parcours
  montée/descente, tour complet, huit murs et huit walljumps, chute/respawn.
- Suite complète : 605 tests réussis. Build Vite réussi.
- Contrôle dans la visite et le jeu complet : jardins, sol, panneaux,
  sondes et panorama visibles. Vérification des logs navigateur.
- Le ciel utilise une texture sans mipmaps : environ 28,1 Mio de mémoire GPU
  en RGBA8, au lieu de 6 Mio pour la v2 et 128 Mio pour le fond photo retiré.
  La résolution est plus que doublée par axe sans passe de rendu ajoutée.
  Un panorama 360° conserve une netteté limitée à fort zoom.
- La vue d'ensemble compte environ 175 appels et 260 224 triangles avec
  ombres, selon le cadrage et la position des sondes. Pas un benchmark
  universel ; les contours et la résolution restent déterminants.

Les travaux locaux d'animation, de combat, de menu et de Station 2 sont
préservés. Aucun commit ou push automatique pour cette passe.

## Historique — version initiale, avant la passe de détails

Reconstruction originale réalisée dans Blender le 25 septembre 2026.
La nouvelle carte est chargée par `/?scene=circle2`, ou `/circle2` avec le
serveur Vite. Le menu la présente sous **Circle 2 · Azure Atrium**.
L'ancienne carte reste disponible sous **Circle 2 · S5Runtime classique**
(`/?scene=circle2-classic`). Ses assets et tests n'ont pas été remplacés.

## Direction artistique et référence

La référence a été générée **avant la modélisation**, avec l'outil intégré
ImageGen, sans CLI/API externe. Elle est conservée dans
[`art/circle2-atlas/reference.png`](../art/circle2-atlas/reference.png).
Le fichier [`overview.png`](../art/circle2-atlas/overview.png) est, lui, un
véritable rendu Blender de la géométrie exportée, pas une image générée.

Brief de génération (reformulation du prompt employé) :

> Stylized-concept : référence de production pour reconstruire Circle 2 dans
> Blender. Arène circulaire de parkour anime sci-fi, lumineuse et moderne,
> dans la famille architecturale d'une station modulaire claire. Passerelles
> annulaires ivoire, secteurs surélevés, rampes, escaliers, arène centrale
> ouverte avec balise élancée, ponts radiaux et surfaces de walljump.
> Palette ardoise, cyan, corail et végétation menthe ; textures atlas et
> formes low-poly. Lumière de jour, mer de nuages et cités flottantes au loin.
> Vue trois-quarts en hauteur, large, à échelle humaine et constructible.
> Sans personnages, HUD, logos ni surfaces PBR sales.

La référence ImageGen a guidé la palette, les deux niveaux, la balise et le
fond suspendu. La construction conserve une identité circulaire mais assume
une **nouvelle disposition** ; ce n'est pas une reproduction métrique du
Circle 2 de S5Runtime. Aucun mesh de la carte originale n'est réutilisé.
Les modèles étant créés ici, aucun téléchargement tiers ni licence de props
supplémentaire n'a été nécessaire.

## Source Blender et exports

- [`circle2-azure-atrium.blend`](../art/circle2-atlas/circle2-azure-atrium.blend) :
  source éditable, 679 objets mesh répartis en 32 collections de modules,
  UV et atlas 256 × 256 incorporé, lumières et deux caméras.
- [`tools/blender-circle2-atlas.py`](../tools/blender-circle2-atlas.py) :
  génération déterministe, sauvegarde de la source avant regroupement,
  export GLB et triangles de collision, puis rendu de présentation.
- `public/assets/circle2-atlas/circle2-azure-atrium.glb` : export d'environ
  2,36 Mo ; 32 modules regroupés et un matériau à atlas partagé.
- `public/assets/circle2-atlas/world.json` : 3 160 triangles de collision,
  spawn, cible, huit accès et limite de chute.
- `public/assets/circle2-atlas/circle2-atlas.png` : atlas également fourni
  séparément ; la copie utilisée par le GLB et le `.blend` est incorporée.
- [`src/circle2-atlas.js`](../src/circle2-atlas.js) : chargement, ciel en dégradé,
  brouillard, cible d'entraînement et collision de caméra.
- [`circle2-preview.html`](../circle2-preview.html) : visite orbitale avec
  vue d'ensemble et vue à hauteur de joueur ; incluse dans le build Vite.

Régénérer depuis la racine du dépôt (PowerShell) :

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --python tools/blender-circle2-atlas.py
node --test tests/circle2-atlas.test.mjs
node node_modules/vite/bin/vite.js build
```

**Attention : la régénération remplace la source et ses exports.** Sauvegarder
les retouches manuelles sous un autre nom avant de relancer le générateur,
ou reporter les changements dans ce script. Les `.blend1` sont des sauvegardes
locales Blender ignorées par Git. Les `.blend` et `.glb` passent par Git LFS.

## Architecture jouable

Arène basse de rayon 16, à Y=0 ; promenade annulaire de rayon 19 à 26, à Y=4.
Quatre rampes et quatre escaliers relient les deux niveaux. Les escaliers
ont une collision inclinée continue pour éviter les secousses à chaque marche
(marches visuelles de 0,20 unité). Les rampes rejoignent le bord de la promenade
à leur hauteur finale : le premier export créait un rebord bloquant, corrigé
avant livraison et couvert par un test de parcours dans les deux sens.

Huit monolithes servent au walljump. Des couvertures basses occupent le centre,
sans couper les axes des ponts. Jardinières et parapets matérialisent les bords.
La balise centrale est solide. Onze îles lointaines et leurs bâtiments,
cascades stylisées et bancs de nuages constituent le nouveau fond 3D avec
parallaxe ; ils n'ajoutent pas de collisions ni d'ombres de décor lointain.
Les vides entre les ponts sont intentionnels ; une chute sous Y=-18 respawn
sur la promenade. Les règles de mouvement et de combat n'ont pas changé.

## Vérification

- Réouverture effective du `.blend` dans Blender 5.2.2 : 679 meshes éditables,
  UV présents, un matériau par mesh, atlas incorporé et deux caméras.
- Huit tests spécifiques : manifeste invalide, contenu GLB/atlas, stabilité
  du spawn et des sols, 16 parcours montant/descendant, tour complet de la
  promenade, collisions des huit murs, huit walljumps et respawn après chute.
- Suite générale : 579 tests réussis après ajout de cette carte.
- Build Vite réussi, avec la page de visite et les assets de la carte.
- Inspection visuelle dans le navigateur : vue d'ensemble, hauteur du joueur
  et partie avec le personnage, HUD et ombres. Aucune erreur ni alerte dans
  les logs navigateur lors du contrôle.
- La visite affichait 64 appels de rendu et 54 040 triangles en vue d'ensemble
  (ombres incluses), moins selon le cadrage. Ce n'est pas un benchmark FPS
  universel : la résolution, les contours et la machine restent déterminants.

Les autres travaux locaux d'animation, de menu et de Station 2 ont été
préservés. Ce travail Circle 2 n'a pas été commité ni poussé automatiquement.
