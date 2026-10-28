# Station 2 : rendu modernisé

Activé par défaut sur `?scene=station2-modular`. Le menu propose Modernisé / Classique ; `&visuals=classic` restaure le rendu précédent. La carte importée de référence et les autres terrains sont inchangés.

Le module `src/station2-visuals.js` ajoute des matériaux physiques, des cartes de rugosité et de relief fin dérivées des textures originales, un masque lumineux cyan, un environnement de réflexion diffus, des ombres filtrées 4096, une lumière de remplissage et un bloom HDR modéré. Les textures couleur gardent leur résolution et leurs motifs originaux : ce n'est pas un pack de textures entièrement repeintes en haute définition. Le relief reste apparent, sans déplacement des sommets.

Les surfaces transparentes animées, lasers, ciel et décalques conservent leurs matériaux et animations. Le traitement ne modifie ni les transformations ni les géométries ni les tableaux de collision. La nouvelle lumière et le tone mapping s'appliquent également au personnage dans cette scène.

Les ombres et le post-traitement augmentent le coût GPU. Le rendu classique permet de revenir au coût antérieur. Les reflets utilisent un environnement générique de studio filtré, pas des réflexions temps réel de la station. Aucun ray tracing n'est utilisé.

Validation : test d'invariance des géométries/transforms/collisions et préservation des matériaux animés dans `tests/station2-visuals.test.mjs`, suites cartes et animations, build Vite, inspection visuelle dans le navigateur.
