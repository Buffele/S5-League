# Katon — boule de feu suprême

Mise à jour du 1er octobre 2026. Attaque originale S5, indépendante des imports S5Runtime.
La spécification utilisateur conservée dans `work/katon/specification-utilisateur.txt`
remplace le premier lancer mobile depuis la main.

## Utilisation

Appuyer sur **²** (`Backquote`). Animation de **3 secondes**, 30 poses par seconde,
91 poses de 0 à 90, jouée une seule fois. Exécution au sol, sur place, direction
initiale verrouillée : signes devant la poitrine, inspiration, expiration depuis
la bouche avec main droite au visage, puis relâchement. Arme masquée puis restaurée.

- Signes : frames 0–34 ; inspiration : 34–43 ; expiration : 43–66 ; retour : 66–90.
- Émission visuelle : montée 43–45, maintien 45–62, extinction 62–66.
- Un projectile émis à la frame 43 ; 30 PV, poussée, 18 unités/s, portée 42 unités.
- Coût 25 SP ; recharge de 3 s depuis le déclenchement. Maintenir ² ne répète pas.
- Les actions d’arme en cours empêchent le sort. Les dégâts interrompent le geste.
  Une interruption avant émission ne peut pas créer un projectile ultérieur.

## Animation et calibration

`src/katon-spec.js` contient les clés de la spécification. `src/fireball-animation.js`
les convertit en rotations sur les 21 os autorisés. Aucune piste de doigts,
mâchoire, échelle ou os supplémentaire. Les mains restent rigides. Les longueurs
natives des membres sont conservées ; appuis résolus par cinématique inverse.

La bouche et les semelles sont mesurées sur la tenue 01. Le point d’émission est
recalculé sur `Bip01 Head` après le mixer. Le projectile part horizontalement dans
la direction initiale ; il ne poursuit pas la cible.

Particularité du rig : Pelvis et Spine sont frères. Les orientations anatomiques
cumulées sont donc converties en rotations locales, au lieu d’additionner des
angles supposant une hiérarchie différente. Seul Pelvis reçoit une translation
animée. La translation de Bip01 corrige une seule fois la hauteur des semelles.

Corrections fixes de faisabilité, détaillées dans `work/katon/calibration.json` :

- Paumes au repos remontées à −0,215 H (masculin) / −0,18 H (féminin), car les
  cibles à −0,25 H dépassaient la longueur disponible des bras.
- Quelques cibles basses féminines remontées de la même manière.
- Signes S1/S6 : séparation latérale ±0,027 H.
- Signes S1 à S6 : profondeur corrigée de −0,065 H à gauche et +0,045 H à droite,
  pour laisser passer les volumes des gants et des doigts rigides.

Ces corrections sont constantes, sans aléatoire ni étirement du squelette.
`tools/verify-katon-volumes.mjs` contrôle les boîtes orientées conservatrices des
vrais sommets des gants à 361 instants par sexe : aucune intersection entre mains.
Ce contrôle ne constitue pas une certification de toutes les collisions entre
vêtements et corps. Les autres tenues héritent du même calibrage anatomique.

## Effets de feu

`src/stylized-fire.js` et `src/fireball-effects.js` produisent des volumes 3D en
aplats crème, jaune, orange et rouge, inspirés de la lisibilité de la référence
Spellbreak fournie. Aucun asset de ce jeu n’est utilisé.

Le cœur se déforme en continu, ses lobes tournent et pulsent. Huit rubans courbes
avec bords découpés forment les langues de feu. Le souffle suit la bouche ; des
braises avancent avec le flux. L’impact disperse 46 volumes animés et un anneau
qui s’élargit. Les fragments refroidissent et disparaissent progressivement.

Pool borné à 128 particules et quatre anneaux, géométries partagées, une lumière.
Shaders précompilés au chargement ; pause, reset et sortie du mode nettoient ou
suspendent les effets. Sons synthétisés d’inspiration, envoi et impact, réglés par
le volume du jeu. Aucun outil externe ni téléchargement nécessaire.

## Validation

- `tests/fireball.test.mjs` : 19 tests (9 armes, entrée clavier, phases, direction
  et appuis fixes, SP, annulation, 30/60/120 Hz, collisions, portée, pause,
  dégâts uniques, rigs masculin/féminin, émission bouche, volumes des gants,
  mouvement des VFX et nettoyage).
- `work/katon/tests-focused.log` : 76/76, tests du sort et régressions des modules partagés.
- `work/katon/calibration.json` : 91 poses par sexe ; erreur des appuis inférieure
  à 0,001 unité source. Interpolation à mi-frame vérifiée sous 1 mm dans le jeu.
- `work/katon/glove-clearance.json` : 361 poses par sexe, aucun croisement des gants.
- `work/katon/build.log` : build Vite.
- `work/katon/tests-all.log` : 1381/1385 réussis avant les deux tests de volume
  supplémentaires. Quatre échecs déjà relevés avant ce Katon : manifestes Breaker
  (taille animation, modèle, effets), ancien statut attendu du Revolver.
- Jeu principal : souffle masculin et féminin, signes féminins, impact masculin
  avec adversaire à **70 PV**, projectile consommé, aucune erreur console relevée.
  Captures dans `work/katon/`.

Scénarios : `?qa=fireball&t=0.47`, `?qa=fireball&t=1.27`,
`?qa=fireball&t=1.55`, `?qa=fireball&t=2.85`,
`?qa=fireball-contact&t=1.73`. Ajouter `sex=female`,
`qaView=profile` (geste) ou `qaView=profile-wide` (effets).

## Limites

Le contact décor utilise cinq segments autour du rayon, pas un balayage sphérique
exact. Les dégâts concernent la cible d’entraînement : pas de brûlure persistante
ni de dégâts de zone. L’audio est raccordé, sans validation d’écoute subjective.
