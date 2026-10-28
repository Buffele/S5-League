# Atelier de réglage des armes Meshy

17 octobre 2026. Ouvrir `/weapon-fitting.html` sur le serveur S5. Lien disponible
également dans les réglages graphiques du jeu : « Atelier de réglage des armes
Meshy ». Les trois familles proposées sont Plasma Sword, Counter Sword et
Spy Dagger, uniquement pour leurs nouveaux skins Meshy.

L’originale est à gauche, le modèle à régler à droite. Les deux personnages
utilisent le même chargeur que le jeu, la même pose, le même temps et des
caméras synchronisées. Choisir homme/femme, skin classique/Meshy, repos,
huit directions ou une action. Les états d’action et les retours sont
des poses que l’on peut examiner, et non une simulation des délais de combat.
Les mappings repos/marche viennent des données NormalState/RunState existantes ;
les attaques sont lues séparément dans MELEE et les profils Spy.

Les contrôles proposent translation en cm, rotations Euler XYZ en degrés et
taille uniforme autour de l’attache native évaluée au repos. Les axes 3D
permettent aussi de déplacer/tourner la pièce. La lecture se met en pause
pendant une manipulation. La Counter propose lame et gantelet indépendamment.
Annuler/rétablir et réinitialiser une pièce restent disponibles.

Les brouillons sont conservés par arme dans `sessionStorage`, y compris lors
d’un rechargement de développement. Le bouton **Enregistrer pour S5** écrit
le profil de l’arme dans `localStorage`, clé `s5.weapon-fitting.v1.<arme>`.
Une partie ouverte dans le même navigateur, avec la même origine (hôte et
port), récupère ces corrections en cours de jeu. Le navigateur ou le port
différent possède un stockage distinct. « Ouvrir dans S5 » utilise le profil
enregistré, et non un brouillon. Le JSON peut être exporté/importé pour
transmettre ou conserver un réglage ; un fichier d’une autre arme est refusé.

Les corrections portent sur une copie des surfaces et se recalculent à partir
des coordonnées initiales à chaque changement. Elles ne s’accumulent pas et
ne changent ni les os, ni les pistes natives, ni le classique, ni les dégâts,
contacts ou effets. Les limites des imports restent documentées dans les fiches
`docs/imports/*-meshy.md`. Aucun gate de fidélité native n’est ouvert par cet
atelier.

La main Counter articulée utilise une surface skinnée séparée. Le réglage
« Gantelet » déplace aussi cette main après skinning, via des copies privées
des os de rendu dans la hiérarchie de l’avatar ; les os animés natifs restent
inchangés. Cette hiérarchie et les matrices manuelles sont conservées dans les
aperçus d’inventaire. Les coordonnées des surfaces corrigées se synchronisent
également dans l’aperçu sans partage de géométrie mutable.

Pour une capture QA reproductible indépendante des réglages personnels,
ajouter `weaponFit=default` à une URL de scénario `qa`. Ce paramètre ne change
pas le stockage ; les parties ordinaires utilisent les réglages enregistrés.

`tests/weapon-fitting.test.mjs` vérifie validation/sauvegarde, isolation des
armes et du classique, application dans les avatars réels homme/femme,
absence de dérive, retour exact aux coordonnées initiales et persistance
après le mixer sur les poses proposées. Les preuves visuelles et le build
sont conservés dans `work/weapon-fitting/`.
