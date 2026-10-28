# Comportements des maps S5Runtime dans S5

Consigne utilisateur du 17 octobre 2026 : reprendre les maps S5Runtime existantes,
leurs collisions et leurs comportements. Les visuels approuvés guident
l'adaptation Blender ; ils ne remplacent pas les données de jeu natives.

## Points obligatoires avant validation d'une map

- Conserver les identités des objets, les groupes de collision, leurs paramètres
  et leurs liens dans le graphe. Une fusion visuelle ne doit pas effacer une
  frontière de comportement.
- Importer les éléments destructibles : groupes réellement concernés, HP,
  dommages applicables, disparition visuelle, retrait des collisions, effets,
  sons, récupération et réapparition selon les preuves sources disponibles.
- Conserver les passages particuliers et la sélection de collision par acteur,
  rôle, équipe, type de requête et état de l'objet. Ne pas transformer tous les
  candidats `oct_` en une collision universelle.
- Vérifier séparément déplacement, caméra et armes. Une requête de sol ne prouve
  pas les masques d'impact ou le comportement des objets cassables.
- Tester les transitions : changement de rôle, destruction et réapparition,
  nouvelle manche, sortie/reprise et changement de map. Les sources doivent
  rester intactes ; les dérivés S5 et leurs limites doivent être documentés.
- Les repères de camps Alpha/Bêta concernent seulement les variantes Touchdown.
  Un groupe natif nommé `alpha` ou `beta` ne suffit pas à imposer cette décoration.

## Alice House, map225, Chaser

Retour humain explicite : le Chaser peut traverser certaines faces des murs du
spawn ; les autres joueurs ne peuvent pas les traverser. Cette permission ne
s'applique pas à tous les murs.

La prévisualisation du port5190 a été compilée avant ce raccordement dynamique.
Elle permet déjà de tester le rendu et les collisions statiques importées, mais
ne certifie pas encore ce passage par rôle ni les destructibles.

Le raccord de rôle est ensuite implémenté dans la révision du port5191 :
`Controller` peut demander une vue de collision propre à l'acteur et
`combat-match` lui transmet explicitement son rôle à chaque préparation de
manche, puis l'efface à la fermeture. Alice conserve1513faces dans la vue
survivant et1505 dans la vue Chaser. Le solveur et les sources sont inchangés.

Les premières preuves statiques identifient `oct_block_alpha` (modèle11,
nœud25, huit triangles, catégorie0x80000), quatre panneaux verticaux proches
des quatre `chaser_door_Dummy_01..04`. Leur existence et leur catégorie ne
certifient pas à elles seules le masque natif appliqué à chaque acteur.

La condition native a depuis été établie : mode8, comparaison du compte de
l'acteur avec celui du Chaser à0x62FD9C, sélection1/2, retrait de0x180000 à
0x62FEE6, réactivation de0x80000 pour les autres acteurs à0x62FF5E et de
0x100000 pour le Chaser à0x62FFC1. Contrat et fenêtres binaires dans
`work/s5runtime-map-native-adaptation/alice-house-role-destruction-audit/`.
Les quatre panneaux sont testés dans les deux sens, avec retour au rôle
survivant, rotation réelle des manches et conservation du sol/mur ordinaire.

Correction utilisateur suivante : les non-Chaser apparaissent ailleurs sur la
map. Les six marqueurs `alpha_spawn_pos_01..06` doivent rester distincts du
point `beta_spawn_pos_01` du Chaser. Le port5205 remplace les anciens offsets
du centre par ces marqueurs et leur direction Box-Z. La position Y source est
conservée avant la gravité S5. L'ordinal des survivants est une attribution
déterministe S5 modulo six ; le producteur de l'index natif reste inconnu.
Les tests de rotation, rejeu, préparation et retour de map passent. La revue
navigateur du build figé valide aussi Start, déplacement clavier et passage
réservé au Chaser. L'essai S5Runtime local est resté bloqué avant la partie : aucune
capture en jeu native ne certifie encore la parité complète.

BGINFO déclare trois familles `blast2_box`, `blast2_win`, `blast2_door` avec
HP40/10/10 et délais de réapparition10000/7000/30000ms. Les liens du graphe
identifient27instances indépendantes et27modèles de collision,406triangles.
`box02` à la racine n'en fait pas partie. Le lecteur natif utilise `material`
et ignore la faute source `mterial` : valeur par défaut1 conservée.

L'adaptateur local `alice-house-destructibles.js` et ses tests vérifient le
registre de dommages, la suppression des seules faces concernées, les jetons
périmés, la restauration différée si un acteur occupe le volume et le fondu
de500ms sur des matériaux clonés par instance. Le temps doit dépasser
strictement les délais natifs. Le nouveau match local réinitialise les objets ;
la préparation d'une manche Chaser ne force pas leur réparation.

Le raccord aux vraies attaques et la nouvelle revue navigateur sont en cours ;
la version actuellement servie sur5205 ne contient pas encore ces destructibles.
La qualification ne doit être mise à jour qu'après compilation et revue du
nouveau build. Le solveur de sécurité de restauration et l'horloge restent
ceux de S5 ; l'autorité réseau native n'est pas reproduite.

Preuves et audit : `work/s5runtime-map-native-adaptation/collision-audit/README.md`,
`source-pipeline/source/mapinfo/bginfo-alicehouse.ini`, et les rapports dédiés
produits après la consigne dans `work/s5runtime-map-native-adaptation/`.
