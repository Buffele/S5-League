# Rendu et chargement — 20 octobre 2026

## Diagnostic et changements

Le pipeline de contours redessinait le décor dans une passe de profondeur, puis la sélection, avant une copie et plusieurs filtres plein écran. Le shader d'encre S5 n'utilisait pourtant pas les deux flous de glow. Le nouveau chemin réutilise la profondeur de l'image principale : une passe de sélection et quatre filtres/compositions remplacent deux passes 3D et sept filtres/compositions. Le chemin de secours conserve sa propre profondeur lorsqu'aucun tampon partagé n'est disponible. Les IDs distincts des personnages/décors, l'occultation par les murs et les exclusions des effets transparents sont conservés.

Les passes de contours réutilisent les matrices et les ombres de l'image principale, sur toutes les cartes. Elles ne peuvent plus recalculer une ombre avec une sélection temporairement masquée. La variante atmosphérique actuelle de Station-2 avait **déjà** des ombres 2048 et un compositeur limité au DPR 1,25 avec MSAA 4 ; la variante antérieure sans atmosphère montait à 4096. Il ne faut pas attribuer le 4096 à toutes les sessions Station-2.

Les profils s'appliquent immédiatement dans Settings → Graphics → Render quality :

| Profil | DPR maximal | Budget de pixels avant facteur d'échelle | Échelle | Ombres | MSAA du compositeur | Bloom |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Performance | 1 | 1920 × 1080 | 80 % | 1024² | 0 | Non |
| Balanced, défaut | 1,25 | 2560 × 1440 | 100 % | 2048² | 2 | Oui |
| High | 2 | 3840 × 2160 | 100 % | 4096² | 4 | Oui |

Les limites tiennent compte de la surface de la fenêtre. Les textes/HUD DOM gardent la résolution de l'écran. Les contours ont un budget distinct : 75 %, 100 % ou 150 % de la plus grande dimension CSS selon le profil. Leur profondeur et leurs IDs restent à la même résolution entre eux. Les ombres des personnages restent dynamiques à chaque frame ; aucune réutilisation d'une pose d'ombre périmée n'a été ajoutée. Le réglage Shadows On/Off reste indépendant et est réappliqué après activation d'une carte. Les changements d'ombres n'invalident plus artificiellement tous les matériaux des personnages non équipés.

Le rendu 3D complet n'est plus dessiné derrière le lobby opaque, qui possède ses propres aperçus. Un premier rendu de la carte et des aperçus est effectué sous l'écran de chargement pour payer les premières allocations/compilations avant l'arrivée au lobby. Sur les présentations génériques, Outlines Off sans vision Chaser utilise directement le renderer. La vision Chaser conserve son propre chemin. Les aperçus limitent aussi leur DPR à 1,25.

Les textures secondaires calculées par `enhanceStationMaterials` sont limitées à 512 pixels sur leur plus grand côté. Les couleurs originales restent intactes. Cette fonction concerne le chemin de modernisation historique, pas tous les matériaux Blender de la Station-2 atmosphérique.

## Textures : ce qui est réellement gros

`tools/audit-texture-sizes.py` lit les images publiques et celles embarquées dans les GLB, sans réécrire les assets. Audit : **1 587 images, aucune erreur, 78 d'au moins 2K**, dont **7 panoramas de ciel en 3840 × 1920**. Les variantes de fichiers de travail/export sont comptées séparément ; ce total n'est pas un chargement simultané.

Les plus grosses textures d'armes Meshy sont en **2048 × 2048**, ainsi que certaines textures de personnages. Les matériaux de la session Station-2 examinée ne référencent pas de texture 4K. L'audit DOM exclut volontairement les ciels, environnements et render targets de ce comptage de matériaux ; l'inventaire source traite les ciels séparément. Les estimations de mémoire des objets Texture ne sont pas une mesure VRAM : clones, stockage partagé, compression, allocations du pilote et autres contextes changent le résultat.

Artefact : `work/graphics-20261020/texture-sources.json`.

## Chargement : correction des freezes

Le premier essai préparait trente personnages complets avant le lobby, puis a essayé de déplacer cette préparation en arrière-plan. Les retours utilisateur montrent que ce déplacement provoquait encore des freezes. **Cette construction automatique du catalogue a été retirée.** Un `setTimeout` ou un callback idle ne rend pas la génération de géométrie, d'animations et de shaders parallèle au jeu.

Le comportement actuel est :

1. Les armes des slots sont construites avant de jouer. Elles changent immédiatement en partie.
2. Un **worker dédié** récupère les autres modèles, animations et textures et met les JSON décodés en IndexedDB. Il ne crée aucun personnage, mixer, matériau Three ou contexte WebGL, et ne transmet pas les gros JSON à l'interface.
3. Ce worker se met en pause quand l'onglet est masqué, pendant une entrée en salle ou pendant le jeu. Une requête déjà lancée peut finir ; elle reste dans le worker. Il se ferme après avoir fini le catalogue.
4. Une arme/variante nouvellement choisie dans l'inventaire est construite à la demande, puis conservée dans `weaponResourceCache`. Sa première sélection peut donc demander une préparation ; ses sélections suivantes réutilisent le bundle. Les gates natifs et les tags expérimentaux restent inchangés.
5. Les retours au menu et changements de carte conservent ce cache RAM. Un rechargement du navigateur conserve les JSON décodés sur disque, **pas** les objets GPU ou les personnages JavaScript. Les réponses sont validées par ETag/Last-Modified avant réutilisation : un asset modifié doit être relu. Stockage indisponible/quota dépassé : le chargement normal reste utilisable. La limite est de 512 entrées JSON.

Vérification réelle : **41/41 préparations de sources, 130 fichiers parcourus, aucun échec**, avec seulement **deux bundles construits**, Dagger Classic et Plasma Classic. La préparation précédente en construisait trente. Un rechargement examiné indique **50 réutilisations de JSON validés, zéro manque** dans le compteur du thread principal. Un temps observé de 9,8 secondes jusqu'à la disponibilité était sur cache chaud et n'est pas une comparaison contrôlée de démarrages à froid.

Artefacts : `work/graphics-20261020/worker-startup.json`, puis `worker-startup-final.json` après préchauffage du premier rendu. Cette dernière session atteint la disponibilité à 10,8 secondes sur cache chaud, confirme 50 hits JSON/0 manque, 41 préparations de sources et 2 bundles. Les longues tâches du diagnostic incluent les interactions/outils de contrôle et la concurrence du banc GPU exécuté dans un autre onglet ; elles ne prouvent pas à elles seules la causalité d'un freeze. Aucun résultat « zéro freeze garanti » n'est revendiqué.

## Validation

- 124 tests ciblés passés sur rendu, restauration d'état, budget de résolution, rigs/aperçus, Chaser, cache, pause du worker et entrée en partie.
- Fixture WebGL des contours : **6 scénarios, 24 positions** passent, avec profondeur dédiée et partagée : superposition, effet transparent, occultation par mur opaque.
- Build Vite réussi, worker inclus. Les avertissements de taille de chunk/imports dynamiques existants restent présents.
- Comparaison GPU reproductible : `tests/fixtures/graphics-performance.html`. Vraie Station-2 et Meshy Male, caméra fixe, 20 frames de chauffe puis 60 mesures par configuration. Requête GPU `EXT_disjoint_timer_query_webgl2` ; les mesures CPU de soumission et intervalles rAF sont distingués. Ce banc n'inclut pas toute la simulation d'une partie et ne prédit pas son FPS.

Les rapports sont dans `work/graphics-20261020/`. Le snapshot de l'ancien algorithme dans `tests/fixtures/legacy-outline-pass.js` sert uniquement au banc comparatif.

### Comparaison conservant les paramètres de l'ancien pipeline

`comparison-original-settings.json` contient 18 configurations sur RTX 3070, viewport CSS 1280 × 720 et DPR de référence forcé à 2. L'ancien compositeur utilise bien son plafond 1,25 et son MSAA 4. Pour la caméra fixe, avec contours « objects » et ombres actives :

| Pipeline | Dessins par frame | Soumission CPU médiane | GPU médian |
| --- | ---: | ---: | ---: |
| Ancien | 862 | 17,0 ms | 5,69 ms |
| Balanced | 662 | 13,1 ms | 4,11 ms |
| Performance | 649 | 14,0 ms | 3,28 ms |

Sur ce point : environ **23 % de dessins en moins**, **28 % de temps GPU en moins** en Balanced et **42 % en moins** en Performance. Les résultats des autres modes sont aussi conservés ; ils varient avec la charge concurrente et ne donnent pas tous le même gain. Le profil Performance réduit volontairement la résolution et les effets. Ces durées GPU ne sont pas des promesses de FPS pour une partie complète.
