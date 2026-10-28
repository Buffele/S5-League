# Locomotion AI4Animation libre sur S5Runtime

21 octobre 2026. Prototype séparé, priorité utilisateur à la crédibilité du
mouvement et de la tenue d'arme, fidélité à la gestuelle S5 facultative.

<http://127.0.0.1:5174/neural-locomotion.html?sex=male>

## Évolution : demande de véritable sprint S5, 21 octobre

L'utilisateur a demandé de commencer par le sprint, sans comparaison avec la
marche, puis a rejeté la course rapide Neutral : il veut un vrai sprint à la S5.
Le passage de la commande source de vitesse1 à vitesse2 ne répond pas à sa
demande de gestuelle et d'énergie. Ne pas le présenter comme un sprint réussi.

La page ci-dessus affiche maintenant **la base originale du sprint S5**, dans
une seule vue S5Runtime. Entrée `src/s5-sprint-trial.js`. L'ancien contrôleur neural
`src/neural-locomotion.js` est conservé, mais n'est plus l'entrée de cette page.

- Classique : clip `00068`, facteur d'animation0,5, lu depuis
  `SPRINT_ANIMATION_SPEED` dans `src/motion-graph.js`, preuve CFastRunState.
- Alternative source `R0024`, facteur1, comme l'option sprint correspondante du
  jeu. Les deux choix sont des sprints/courses S5 ; pas de comparaison marche.
- Déplacement : `TUNING.sprint`, soit11,88 unités/s au profil courant dagger.
  Le rythme de l'animation reste distinct de cette vitesse, comme dans le jeu.
- Repos SN002, arrêt/départ et virage en sprint avant. Le parcours circulaire
  fait tourner le personnage dans sa direction de déplacement ; ce n'est pas
  un sprint strafe dans huit directions avec regard fixe.
- Attache du dagger conservée par le vrai mixer. Correction après mixer des
  semelles qui pénètrent le sol, via l'IK à deux segments déjà vérifiée.

**Pas de reconstruction IA du sprint réalisée.** Cette page rend visible la
bonne base S5 pour la suite ; elle ne démontre pas une amélioration du sprint
source par AI4Animation. Le port précédent était une locomotion Neutral et
ne doit pas être renommé pour masquer cette différence. Le modèle approprié,
son éventuel entraînement à la course et la qualité du nouveau sprint restent
à établir. Glissement des pieds et collisions du corps non validés.

Vérification de syntaxe et compilation isolée Vite de cette nouvelle entrée
réussies. Régressions `tests/sprint-animation.test.mjs`2/2 : clip classique,
facteur0,5 et vitesse de déplacement indépendants, au sol/en l'air et lors du
landing. L'aperçu masculin affiche00068 et11,88 unités/s. Le jeu principal,
les clips source et les réglages globaux ne sont pas modifiés.

Les sections suivantes documentent le prototype neural précédent.

## Ce que fait cet essai

Le moteur local AI4AnimationPy existant sur 127.0.0.1:5176 génère sa locomotion
Neutral et ses contacts, avec son post-traitement d'origine. Les deux vues
emploient les mêmes prédictions et le même rythme. Les poses affichées sont
interpolées entre deux échantillons réseau pour limiter les marches d'escalier
à l'affichage ; cette interpolation d'affichage n'est pas un nouveau réseau.

À gauche : Geno, référence du réseau. À droite : S5Runtime avec ses longueurs d'os.
**Aucune animation de marche S5 ni pose complète S5 n'est imposée au réseau.**
Il ne s'agit ni du mélange S5Runtime/IA abandonné, ni de PhaseBetweener.

Le retarget transfère des directions anatomiques et des orientations relatives
au bind. Les pieds reprennent les rotations relatives du pied source, plutôt
que son angle absolu cheville/orteil qui faisait lever les chaussures de S5Runtime.
L'option Appuis adapte les positions des chevilles à la taille de S5Runtime par IK
à deux segments, avec légère descente du bassin si les cibles sont hors de
portée. Les semelles skinnées sont échantillonnées pour corriger la pénétration
résiduelle. Les longueurs des jambes ne changent pas.

L'option Dagger place le poignet droit devant et à l'extérieur du bassin,
résout épaule/coude/poignet par IK et conserve une orientation de prise relative
au buste. **Seul SN002 statique** sert pour les doigts, le dummy et l'orientation
de prise du poignet. Aucune courbe de locomotion native n'est jouée.

Source de l'arme : `docs/imports/spy-dagger.md`, type24 scène0
`R_Hand_Dummy`, modèle classique inchangé. Source explicite des états natifs
relue dans `work/melee-batch/dagger/source-contract.json` :
NormalState SN002, RunState SN004–SN011 haut/E0019–E0026 bas, boucles et
vitesse1 ; les attaques restent séparées. Ce nouveau prototype ne prétend pas
reproduire ces gestes natifs et ne modifie pas leur mapping dans le jeu.

## Preuves et limites

- Premier rendu fourni à l'utilisateur avant les vérifications.
- `tests/neural-locomotion-fit.test.mjs` : 3/3, dont les deux vrais avatars,
  leurs semelles skinnées et l'attache du dagger. 36 poses réseau enregistrées
  couvrant repos et huit directions, en versions équipée/libre : 72 évaluations
  par sexe. Transformations finies, longueurs conservées, cibles de main et
  pieds atteintes dans cet échantillon, absence de pénétration des semelles
  échantillonnées, matrice arme/main stable après posing.
- Une première mesure a détecté 5,7 mm/7,6 mm de pénétration M/F ; la correction
  bassin et les itérations de semelle les résolvent sur ces poses. Ne pas
  transformer ce résultat échantillonné en garantie générale de contact.
- Compilation isolée Vite réussie (49 modules). Aucun branchement à l'entrée
  du jeu principal ni changement de vitesse de déplacement du jeu.
- Aperçu masculin observé en navigateur, réseau environ17–18 ms/prédiction.
  Le mouvement libre, le dagger et le contrôle des appuis sont sélectionnables.
  Observation féminine continue et comparaison perceptuelle restent à faire.

Pas de solveur global d'auto-collision ni de preuve d'absence de traversée de
l'arme avec chaque partie du corps. L'IK du bras est une contrainte ajoutée
après génération, pas un comportement d'arme appris. Dagger classique seulement.
Attaques, dash, sauts, changement d'armes, autres armes, contacts physiques et
intégration au jeu ne sont pas couverts. Aucun statut « arme prête » n'est changé.

## Dash : distinction importante

Ce checkpoint expose locomotion/style, trajectoire et accélération, pas une
commande de dash entraînée. Un premier dash peut utiliser un clip de bonne
qualité adapté à S5Runtime et une trajectoire de gameplay séparée, raccordés à la
locomotion avec appuis et prise. Cela ne doit pas être annoncé comme un dash
généré par le réseau. Un dash appris demande des exemples et un entraînement
approprié ; accélérer la marche ne suffit pas.

## Reprise et retrait

Le backend existant se lance avec le Python préparé pour AI4Animation et
`tools/ai4animation-preview.py`. Sources et poids de la démo dans
`work/ai4animation-trial/upstream` ; provenance, révision et conditions dans
`docs/TEST-AI4ANIMATION.md`. Les fichiers tiers restent locaux.

Périmètre de ce nouvel essai : `neural-locomotion.html`,
`src/neural-locomotion.js`, `src/neural-locomotion-fit.js`,
`tests/neural-locomotion-fit.test.mjs`, ce document et les rapports sous
`work/neural-locomotion-trial/`. Le module ne dépend pas de la fusion abandonnée.
Le retrait de ces fichiers ne nécessite aucune restauration des assets S5Runtime.
