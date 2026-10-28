# Motion Studio — créateur d'animation

Ouvrir `/animation-workshop.html`, ou **Créer mes animations** depuis le menu du
jeu / le laboratoire F2. L'atelier ne remplace aucune animation de gameplay.

## Créer de zéro

1. Choisir le corps et la tenue, puis **Partir de la pose neutre**.
2. Déplacer la tête de lecture avec la timeline ou le champ Temps.
3. Sélectionner une articulation dans la liste ou cliquer sur son point dans la
   vue 3D. Par défaut, seules les 20 articulations principales sont proposées,
   regroupées par corps, bras et jambes avec des noms français. Activer
   **Afficher les articulations avancées** pour les doigts, os secondaires et
   accessoires. Ce filtre masque aussi les points secondaires dans la vue 3D,
   sans supprimer d'os ni modifier les animations enregistrées.
   **Alt + clic sur le personnage** sélectionne l'articulation qui contrôle la
   zone cliquée, même lorsque les points sont masqués. Relâcher Alt pour retrouver
   le manipulateur. Le bouton **Sélection sur le personnage** permet le même
   fonctionnement sans maintenir de touche ; le désactiver pour manipuler.
   La caméra et le manipulateur sont bloqués pendant la sélection directe,
   qui ne crée aucune pose clé. Un clic dans le vide conserve la sélection.
4. Tourner les anneaux du manipulateur, ou saisir les rotations locales X/Y/Z.
   La modification crée automatiquement une pose clé à cet instant.
5. Avancer, créer d'autres poses, puis lire avec Espace ou le bouton Lire.

Le mode Rotation conserve les longueurs des membres. Le mode Déplacer agit
librement sur la position locale et peut donc étirer un membre. Pour déplacer
tout le personnage (saut, chute, glissade…), sélectionner **Bip01**. Les unités
de position sont celles du squelette natif, pas les mètres du monde de jeu.

Les poses clés contiennent le squelette entier. Modifier une articulation sur
une clé conserve les autres articulations dans leur pose à cet instant.
Pour une rotation complète (salto, tour sur soi-même), ajouter des poses
intermédiaires : deux orientations identiques à 0° et 360° ne décrivent pas un tour.

## Partir d'une animation existante

Choisir une source, puis **Créer une copie modifiable**. L'atelier échantillonne
la source à 15 poses/seconde et garde les rotations, translations et échelles du
squelette. La copie peut être moins précise qu'une animation source très rapide.
Les fichiers natifs ne sont jamais modifiés.

## Temps et transitions

- Durée de 0,1 à 60 secondes ; changer la durée retime toutes les clés.
- Cliquer une clé pour la sélectionner, puis changer son temps ou la supprimer.
- L'interpolation d'une clé s'applique au segment qui la suit : Douce, Linéaire
  ou Pose tenue. Les rotations utilisent une interpolation quaternionique.
- **Copier début → fin** ferme la pose d'une boucle ; il reste à soigner le
  rythme près du raccord pour obtenir une boucle artistiquement convaincante.
- Copier/coller une pose fonctionne également à un autre instant.
- Dans **Rotation locale**, **Copier la rotation** mémorise uniquement la rotation
  de l'articulation sélectionnée. Avancer avec **+1 image** (ou choisir un temps),
  puis **Coller la rotation** : une pose clé est créée ou mise à jour à cet instant.
  La position, l'échelle et les autres articulations restent inchangées à cet
  instant. Le collage cible l'articulation actuellement sélectionnée ; sa source
  et sa destination sont indiquées sous les boutons. Il est annulable avec Ctrl+Z.
- Annuler/rétablir : Ctrl+Z / Ctrl+Maj+Z. Espace : lecture. Flèches : pas de 1/30 s.

## Sauvegarder

Un seul brouillon est conservé dans le stockage local du navigateur après chaque
modification. Ctrl+S ou **Sauvegarder le brouillon** renouvelle cet enregistrement.
Le brouillon est restauré au prochain chargement. Si le stockage est plein ou
indisponible, un avertissement demande un export.

**Exporter JSON** produit un fichier `.s5-animation.json`, importable dans cet
atelier. Exporter chaque création à conserver avant de remplacer le brouillon.
L'import valide le format, les temps, le squelette et les transformations. Il ne
charge pas de scripts ni de ressources externes. Format versionné `s5-animation`,
version 1, clés identifiées par les noms d'os plutôt que par les UUID temporaires.

## Périmètre

L'atelier permet de créer librement des animations du squelette S5Runtime masculin ou
féminin : attente, course, danse, saut, attaque, pose de présentation, etc. Les
originaux, collisions et règles de gameplay restent inchangés. Les projets ne
sont pas encore affectés automatiquement à des événements du jeu.

Pas encore d'IK interactif (déplacer la main pour plier automatiquement le coude),
de verrouillage de pieds, d'éditeur de courbes par articulation, de morph targets
du visage, ni d'export FBX/GLB. Le format JSON de l'atelier n'est pas un FBX.
