# Essai local AI4Animation

## Statut : essai de mélange écarté par l'utilisateur

L'utilisateur veut conserver les animations et la gestuelle S5Runtime, en améliorant
la qualité du mouvement entre leurs poses, la coordination des membres et la
crédibilité des appuis. Il ne souhaite ni le style de marche du modèle 100STYLE,
ni une interpolation pondérée entre deux animations qui introduit du clipping.
Le curseur de fusion documenté plus bas ne répond donc pas à son objectif.
Les contrôles de finitude et de retargeting réussis ne démontrent pas cette
amélioration qualitative. Ne pas présenter cet essai comme une solution validée.

Sur la marche avant masculine `E0019`, les rotations de certaines articulations
(mollet et pied notamment) ont 15 clés sur 3200 ticks, soit environ 0,667 seconde.
Le moteur interpole déjà les rotations entre ces clés. Rééchantillonner les mêmes
courbes à 60/120 Hz ne crée pas de nouvelles trajectoires crédibles.

La piste correspondant au besoin est la génération conditionnée de poses
intermédiaires (motion in-betweening) à partir de poses S5Runtime imposées, avec
contraintes d'appui, proportions, boucle et contrôle des auto-intersections.
PhaseBetweener, référencé par AI4Animation, fournit un outil et des modèles
préentraînés : <https://github.com/paulstarke/PhaseBetweener>.
CondMDI est une autre piste à contraintes de poses :
<https://github.com/setarehc/diffusion-motion-inbetweening>.
La compatibilité et la qualité sur S5Runtime ne sont pas encore démontrées.
Le bon périmètre d'un prochain essai est un seul cycle natif de marche avant,
ses poses caractéristiques imposées et un comparatif original / reconstruction,
avant d'étendre aux huit directions. Un premier port NoPhases de PhaseBetweener
a depuis été exécuté : voir [l'essai de cadence](TEST-PHASEBETWEENER.md).
Son amélioration qualitative n'est pas démontrée ; CondMDI n'a pas été exécuté.

Les paragraphes suivants décrivent le prototype historique uniquement.

Cet essai lance le réseau préentraîné de la démo bipède officielle dans Python
et affiche ses poses en direct dans une page Three.js séparée du jeu.
Il ne remplace aucune animation S5Runtime et ne modifie pas les réglages de déplacement.

Source : <https://github.com/facebookresearch/ai4animationpy>
Révision utilisée : `bfb5866681f7ea6dac9984be05181de5955eb48b`.
Auteurs : Paul Starke, Sebastian Starke / Meta. Licence annoncée du dépôt :
CC BY-NC 4.0. Les sources et poids restent dans le répertoire de travail local.

## Lancer

Avec le serveur Vite habituel sur 127.0.0.1:5174, lancer depuis la racine :

```powershell
& 'work/ai4animation-trial/.venv/Scripts/python.exe' tools/ai4animation-preview.py
```

Ouvrir <http://127.0.0.1:5174/ai4animation-trial.html?character=s5runtime&sex=male>.
Le moteur Python écoute uniquement sur 127.0.0.1:5176.
Arrêter ce processus suffit à arrêter l'essai. Aucune sélection dans le jeu
principal ne pointe vers cette expérimentation.

## Commandes

- ZQSD, WASD ou flèches : mouvement ; Maj : accélérer.
- Boutons de direction : déplacement continu jusqu'au bouton Arrêt.
- Tour automatique : parcours des directions, regard vers l'avant par défaut.
- Style : sélection des guidages livrés par le projet, dont Neutral / BigSteps.
- Personnage : Geno (démo originale), S5Runtime homme ou S5Runtime femme.
- Fusion : 0 % restitue les poses S5Runtime originales, 100 % les poses du réseau
  transférées sur S5Runtime. 50 % est le dosage initial. Les cycles S5Runtime utilisent
  les canaux upper/lower explicites de `RunState_SpyDagger`, repos `SN002` de
  `NormalState_SpyDagger` ; voir `src/spy-dagger-data.js` pour les sources.
- Les directions sont relatives au personnage comme dans S5. La caméra démarre
  derrière lui. Droite donne monde -X quand il regarde vers +Z.
- Souris : caméra orbitale ; Pause : arrêter la simulation.

## Portée

Le premier essai utilisait Geno, le personnage fourni par le projet. `Predict`,
`Animate`, le post-traitement des contacts et l'IK restent ceux de la démo.
L'adaptateur remplace uniquement les entrées utilisateur et le rendu.
Le réseau prédit des séquences de 16 poses sur 0,5 seconde, avec une nouvelle
prédiction environ 10 fois par seconde, et animation évaluée à 30 Hz.
Le temps de prédiction affiché est mesuré localement, pas une estimation.

Le transfert vers S5Runtime utilise des repères anatomiques pour les membres et une
rotation relative à la pose de référence pour les chaussures. Utiliser directement
la direction cheville-vers-orteil de Geno relevait les chaussures S5Runtime d'environ
30 degrés : la géométrie des articulations diffère entre les deux squelettes.
Les semelles réellement déformées servent à corriger la hauteur au sol.

La fusion est un mélange de poses, avec recherche d'une phase proche du pas
neuronal dans le cycle S5Runtime. Ce n'est pas un entraînement sur les animations
S5Runtime. Les animations sources ne sont pas modifiées. Les poses d'armes, les
performances dans le jeu, le rythme à vitesse S5 et les transitions de combat
restent à vérifier. Ce n'est pas encore une option du jeu principal.

## Vérification isolée

Le lien jouable a été donné avant ces vérifications. Les contrôles suivants
s'exécutent dans un processus distinct et ne pilotent pas la démo de l'utilisateur :

```powershell
& 'work/ai4animation-trial/.venv/Scripts/python.exe' tools/verify-ai4animation-trial.py
node tools/verify-ai4animation-s5runtime.mjs
```

Le premier script exécute le vrai modèle préentraîné dans les huit directions,
au repos et pour tous les styles livrés, puis sauvegarde des poses mesurées.
Le second utilise ces poses sur les deux vrais squelettes et les chaussures
skinnées. Il vérifie les rotations originales à 0 %, une fusion effectivement
différente des deux extrémités, les longueurs de jambes, les neuf états
directionnels, la cohérence des commandes avec S5 et l'inclinaison des semelles
au repos après stabilisation. Rapports locaux dans `work/ai4animation-trial/`.

## Préparation des dépendances locales

Le checkout local utilise un clone partiel avec `ai4animation`,
`Demos/Locomotion/Biped` et `Demos/_ASSETS_/Geno`. L'environnement virtuel
Python 3.12 est isolé dans `work/ai4animation-trial/.venv`.
Les poids livrés sont `Network.pt` et `PostProcessor.pt` : aucun entraînement
n'est nécessaire pour cette démo. Le chargement impose CPU pour cet essai.
Le dossier de travail est exclu localement de Git ; ne pas versionner le venv,
le clone imbriqué ou les paquets téléchargés.
