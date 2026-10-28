# Essai de reconstruction S5Runtime et de cadence

Statut : **prototype de comparaison, amélioration qualitative non démontrée**.
Le premier résultat a été écarté par l'utilisateur. L'essai actuel teste son
hypothèse d'un mouvement trop rapide et conserve le temps physique du réseau.
Il ne faut pas présenter la finitude ou le respect des repères comme une
validation de fluidité, d'appui ou d'absence de clipping.

## Tester pendant les vérifications

Serveur Vite habituel, puis
<http://127.0.0.1:5174/phasebetweener-compare.html?sex=male&cadence=40>.

Cadences disponibles : 32, 40 et 48 intervalles à 30 Hz, soit 1,067, 1,333 et
1,600 seconde par cycle. La sélection recalcule les conditions temporelles lors
de la génération hors ligne ; elle ne change pas seulement la vitesse du même
résultat. L'option Lecture sert au ralenti d'inspection.

À gauche : les courbes S5Runtime originales avec une durée étirée au tempo choisi.
À droite : reconstruction entre les quatre repères du cycle S5Runtime à ce même
tempo. Phase et caméra identiques. Le défilement du sol est une estimation tirée
des pieds bas de la source, convertie selon l'échelle du personnage ; ce n'est
pas un déplacement physique du joueur et ce n'est pas une mesure du glissement.

Le premier port calculait un cycle sur 1,333 s puis compressait son export sur
les 0,667 s de S5Runtime. Cela réaccélérait tout le résultat par deux. Cet essai
supprime cette compression. À 1,333 s, les poses calculées sont donc les mêmes
que dans ce premier port corrigé de ses repères, jouées à leur temps physique.
Les variantes 1,067 et 1,600 s ont des inférences distinctes.

## Source et méthode

- Source native : `SPY_DAGGER_LOCOMOTION`, explicitement `RunState_SpyDagger`,
  `SN004:upper` et `E0019:lower`. Durée native 2/3 seconde. Aucune déduction
  depuis les attaques. Il s'agit de la locomotion avant au dagger ; les autres
  armes et les sept autres directions ne sont pas couvertes.
- Original échantillonné dans Three.AnimationMixer ; repères de cycle
  0, 25, 50, 75 et 100 % (ce dernier referme sur le début).
  Les propriétés locales réelles du mixer sont copiées aux repères, sans
  redécomposer des matrices globales susceptibles de perdre des conventions.
- Réseau réel : [PhaseBetweener](https://github.com/paulstarke/PhaseBetweener),
  checkpoint officiel `LaFAN1_150_NoPhases.onnx` issu du
  [paquet officiel](https://starke-consult.de/PhaseBetweener/Model.zip).
  Le SHA-256 est inscrit dans chaque animation générée.
- Port Python/ONNX : entrée 654, sortie 617, 22 articulations du prefab LaFAN1,
  positions/directions/vitesses et contacts. Décodage bidirectionnel,
  réalignement des os et contraintes terminales. Aucune animation 100STYLE
  ou Geno n'est mélangée avec S5Runtime.
- Rotations prédites transférées sur le squelette S5Runtime ; longueurs natives
  conservées. Doigts et nœuds non modélisés interpolent leurs repères locaux.
- Limites importantes : modèle **NoPhases**, trajectoire racine prescrite,
  sorties de trajectoire future non réinjectées, IK de contact Unity pas porté,
  contraintes de collision corporelle absentes. Quatre repères imposés ne
  signifient pas conservation de toutes les clés de l'animation source.

Les poids, dépendances et fichiers tiers restent dans `work/phasebetweener-trial`
et `work/ai4animation-trial`, exclus localement de Git. Vérifier les conditions
de recherche/éducation du dépôt avant toute diffusion commerciale des modèles.
Seules les poses générées sont servies par la page locale.

## Vérification du 20 octobre 2026

`tools/measure-phasebetweener-walk.mjs` évalue deux mixers réels, aux mêmes
phases, avec les pistes d'échelle natives. Les trois variantes passent les
contrôles de finitude et de repères : erreur maximale < 0,0004 mm en position,
< 0,000001 rad en orientation. La dernière pose est comparée au début de boucle.

**Cela ne valide pas le mouvement entre repères.** Sur les huit articulations
suivies, l'écart intermédiaire maximal atteint 36,0 à 42,3 cm selon la cadence.
La différence seconde des positions, mesurée sur 81 phases également espacées,
est supérieure à celle de l'original au même tempo (environ 1,67 à 2,17 fois).
Cet indicateur simple n'est pas un score perceptuel, mais interdit de déclarer
une amélioration générale de régularité sur cette base. Les ralentissements
peuvent aider la lecture sans résoudre les défauts du modèle ou du port.

Compilation isolée Vite de `phasebetweener-compare.html` réussie (45 modules),
vérification de syntaxe JS réussie. Aperçu navigateur visible, sélection 1,60 s,
caméra de face et absence d'erreur console constatés. Aucun test de gameplay,
aucune validation d'arme, aucune validation féminine ou des huit directions.

## Reproduire / retirer

Préparation locale requise : venv Python avec numpy/scipy/onnxruntime,
checkpoint NoPhases et `prefab-data.json` décodé du prefab officiel LaFAN1.
Ils se trouvent dans le répertoire de travail ignoré mentionné plus haut.

```powershell
node tools/prepare-phasebetweener-walk.mjs
& work/ai4animation-trial/.venv/Scripts/python.exe tools/author-phasebetweener-walk.py --cycle-seconds 1.3333333
node tools/measure-phasebetweener-walk.mjs --cadence=40
```

Les deux autres durées se génèrent avec `--cycle-seconds 1.0666667` et `1.6`
et se mesurent avec `--cadence=32` et `--cadence=48`.

Essai séparé du jeu : `phasebetweener-compare.html`,
`src/phasebetweener-compare.js`, les trois outils `*phasebetweener-walk*`
et `public/assets/animations/phasebetweener-trial/` constituent son périmètre.
Pas de branchement à la locomotion principale ni de changement de vitesse
globale du joueur. Le retirer ne nécessite aucune restauration d'asset S5Runtime.

Avant toute intégration : démontrer le bénéfice visuel face à S5Runtime simplement
retimé, traiter contacts/boucle/collisions, puis seulement tester les directions,
les deux sexes, équipements et comportement dans le jeu principal.
