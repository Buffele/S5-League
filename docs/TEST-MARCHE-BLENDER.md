# Marche avant retravaillée — essai Blender, 20 octobre 2026

## V2 athlétique — essai étendu après le retour « changement trop discret »

L’utilisateur a demandé un changement plus franc. La V1 est conservée. La V2
réécrit les poses des **huit directions** pour les deux corps, à partir de
leurs couples haut/bas RunState explicites. Les assets natifs ne sont pas
remplacés ; aucun réglage physique ou de vitesse n’est changé.

- Comparer : `/locomotion-compare.html?variant=blenderBold`.
- Isoler l’avant de profil au ralenti :
  `/locomotion-compare.html?variant=blenderBold&direction=front&view=side&speed=0.5`.
- Jouer : `?character=s5runtime&weapon=dagger&runStyle=blenderBold`.
- Settings : **V2 athlétique · Blender TEST · 8 directions · Spy Dagger**.
  **V1 légère** conserve le premier essai ; **Classic** revient à l’original.
- Les tours automatiques parcourent maintenant huit cycles modifiés quand
  **V2 athlétique** est sélectionné. Les anciennes limites « avant seulement »
  décrivent la V1 dans les sections suivantes, pas la V2.

La posture vise une ligne bassin/tête autour de 0,20 radian d’inclinaison,
avec correction par rapport à chaque pose source ; les bras sont fléchis vers
l’avant, le bras libre balance davantage que le bras armé. La récupération du
pied haut est réduite à 42 % de son écart avec le pied bas, avec IK hors ligne
et rotation de cheville en récupération. Bassin et épaules contre-tournent.
Ce sont des choix artistiques de prototype, pas un mouvement natif certifié.

Reproduction : `node tools/prepare-walk-authoring.mjs --all-directions`, puis
Blender avec `tools/author-walk-bold.py`. Fichier d’auteur séparé :
`work/blender-walk-experiment/marche-v2-athletique.blend`. Les courbes sont
réévaluées dans Blender puis exportées dans `bold-male.json` et
`bold-female.json` sous le dossier des animations expérimentales.

L’accès à la V2 a de nouveau été communiqué **avant ses tests**. Les résultats
sont conservés dans `bold-regressions.tap`, `bold-build.log`,
`bold-authoring-report.json` et `bold-actual-pose-differences.json`.
Les mesures après le vrai mixer donnent, en marche avant masculine, environ
33,24° → 12,75° d’inclinaison moyenne bassin/tête, 36,7 cm d’écart moyen des
mains et jusqu’à 25,2 cm aux pieds. Elles prouvent une modification de poses,
pas une amélioration artistique ou une validation visuelle complète.

Le premier contrôle de fermeture avait signalé l’arrondi des quaternions
float32 : `angleTo` exige des entrées unitaires. Après normalisation pour la
comparaison, l’écart maximal de rotation aux extrémités est de 6e-8 radian.
Aucun asset n’a été changé pour contourner ce contrôle.

La même constante `BLENDER_WALK_ENABLED=false` retire V1 et V2 du chargement,
du choix dans Settings et de la sélection MotionGraph. La V2 reste un essai
à comparer en jeu, notamment pour les pieds, le style et l’orientation visible
de la dague ; la revue visuelle complète n’est pas annoncée terminée.

L’utilisateur a demandé une version réversible et un accès jouable **avant les
tests**, puis a choisi Blender sans compte à la place de Cascadeur. Aucun
compte, abonnement ni installation Cascadeur n’a été créé. Cet essai est une
retouche de poses réalisée dans Blender 5.2, pas une sortie Cascadeur.

## Tester et revenir à l’original

- Comparaison côte à côte : `/locomotion-compare.html`. Le personnage classique
  et l’essai utilisent les mêmes rig, tenue, position, orientation et horloge.
  Un cercle de 12 s balaie les huit directions sans tourner le regard. La
  caméra suit la position, avec le même cadrage dans les deux vues.
- Les huit boutons maintiennent une direction sur place. Pause, ralenti,
  corps homme/femme, repos et vues face/profil/dos/¾ sont disponibles. Le choix
  « Lissage » permet aussi de comparer le précédent essai de courbes.
- La vue annonce explicitement que seules les poses avant sont retravaillées
  par Blender. Elle utilise les vrais `MotionGraph` et `avatar.motion`, avec une
  position/vitesse analytique pour le parcours ; elle ne simule pas les
  collisions et ne remplace pas la validation dans le jeu principal.
- Jeu : `?character=s5runtime&weapon=dagger&runStyle=blenderTrial` ; ajouter
  `&sex=female` pour l’autre corps.
- Settings → Character animations → Ground movement →
  **Marche retravaillée · Blender TEST · avant · Spy Dagger**.
- Marcher droit avec la Spy Dagger, sans sprint. Les sept autres directions,
  le repos et les actions utilisent leur chemin habituel.
- Choisir **Classic** revient immédiatement aux animations sources.
- Le choix dans Settings est mémorisé sur l’appareil ; l’URL peut imposer une
  variante au prochain chargement.

## Ce qui a été réellement retouché

Point de départ : pose composite SN004 haut + E0019 bas, issue de
`NormalState_SpyDagger` / `RunState_SpyDagger` dans
`work/melee-batch/dagger/source-contract.json` et `src/spy-dagger-data.js`.
Les états d’attaque sont conservés séparément par leurs adaptateurs existants.

- Réduction de 35 % de l’oscillation verticale et latérale du bassin,
  abaissement de 2,5 cm ; légère opposition bassin/épaules.
- Buste redressé de 0,14 radian au niveau de la colonne ; compensation du cou.
- Réduction de 18 % de la différence de hauteur entre les deux chevilles,
  donc une récupération de jambe moins haute. La cheville la plus basse garde
  son trajet source quand il reste atteignable.
- Résolution des jambes par IK hors ligne, sans allonger les segments.
- Boucle native de 2/3 s, échantillonnée en 81 poses incluant la fermeture.
  Ce nombre ne désigne pas la fréquence d’affichage du jeu.

Les valeurs sont des choix artistiques expérimentaux, pas des réglages natifs.
Les mouvements de pied et la sensation en jeu restent à apprécier. La correction
de contact conserve le repère des chevilles ; elle ne constitue pas un solveur
de semelle ou une garantie d’absence de glissement.

Les positions/quaternions du corps seuls sont remplacés dans un clip séparé,
`BLENDER_WALK_FORWARD`. Les pistes de doigts, d’échelle et d’équipement ainsi que
les clips sources sont conservés. Aucun réglage de déplacement n’est changé.

## Reproduction et retrait

1. `node tools/prepare-walk-authoring.mjs` exporte la vraie pose haut/bas sur
   les deux rigs, avec SHA-256 des fichiers de rig sources.
2. Exécuter `tools/author-walk-experiment.py` avec Blender en arrière-plan.
   Il lit le studio existant et sauvegarde une copie séparée dans
   `work/blender-walk-experiment/marche-avant-essai.blend`.
3. Les courbes sont relues sur le rig évalué de Blender, puis exportées dans
   `public/assets/animations/blender-walk-experiment/{male,female}.json`.

Pour désactiver entièrement l’essai, passer `BLENDER_WALK_ENABLED` à `false`
dans `src/blender-walk-experiment.js`. L’option disparaît, les fichiers
expérimentaux ne sont plus chargés et une ancienne sélection enregistrée est
normalisée vers Classic. Les deux JSON et le dossier de travail peuvent alors
être retirés sans modifier les données S5Runtime. Ne pas supprimer le module de
registration sans enlever ses imports.

## État des preuves

L’accès jouable a été communiqué après génération/raccordement, **avant le
lancement des tests**. La version reste un essai, sans déclaration de validation
native ou de supériorité visuelle.

- `work/blender-walk-experiment/authoring-report.json` : export Blender des deux
  corps, 81 poses, retouche maximale des chevilles d’environ 7,8 et 8,6 cm.
- `work/blender-walk-experiment/regressions.tap` : 59 tests, 0 échec. Les nouveaux
  contrôles portent sur provenance, vraies différences de poses, fermeture de
  boucle, huit mappings (un seul remplacé), états exclus, transfert du curseur
  A/B, longueurs des jambes et attache après mixer/fondus sur les deux corps.
- `work/blender-walk-experiment/build.log` : résultat du build.
- Vue de comparaison : `comparator-tests.tap` vérifie le cercle, sa vitesse,
  le regard fixe, huit directions et les sélections haut/bas sur les deux
  corps ; `comparator-build.log` inclut le nouvel écran dans le build.
- `comparator-browser.json` conserve les 16 sélections de direction réelles
  (homme/femme), les identités de clips, horloges et orientations égales. Le
  maintien sur place se vérifie au temps initial. La pause et le passage à
  l’essai de lissage ont aussi été exercés. `comparison-live.png` montre la
  vue en tours automatiques ; `comparison-preview.png` en recadre l’interface.

La revue visuelle complète repos/huit déplacements/attaques/changements
d’arme sur les deux sexes n’est pas déclarée terminée. Le retour du joueur
doit décider si ce style mérite d’être poursuivi avant d’élargir aux diagonales.
