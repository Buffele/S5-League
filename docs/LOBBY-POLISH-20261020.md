# S5 — polish du lobby, 20 octobre 2026

Cette passe conserve la composition retenue et utilise le décor existant. Le HUD reste du DOM, du CSS et du SVG interactifs. Aucun nouvel import d'arme, aucune animation de locomotion ni ressource de rig n'a été modifié.

## Parcours et hiérarchie

- Navigation principale simplifiée : Play, Inventory, puis Shop / Clan / Social verrouillés. Match settings ouvre les vrais réglages locaux depuis la fiche de partie.
- Fiche locale : aperçu correspondant à la variante réelle de carte, mode, règles et équipe sélectionnés. Suppression du faux tableau réseau et des lignes fantômes permanentes.
- L'action principale reste visible en petite hauteur ; seules les informations de la fiche défilent. Sur les écrans plus hauts, la fiche conserve sa taille utile.
- Groupe et social plus compacts ; monnaies affichées une seule fois ; équipement plus large. Neuf contrôles de service indisponible remplacent les vingt contrôles verrouillés du précédent lobby.
- Une seule action Enter room visible dans les réglages. Les états Enter room / Return to room / Resume / View results restent ceux du runtime.
- Textes, tailles et effets harmonisés entre lobby, inventaire, réglages de partie, transitions et commandes de la salle d'attente. Les graphiques des équipes de la salle sont conservés.

## Interactions demandées

- Aucun bouton Activate dans l'inventaire : cliquer sur une arme équipée la sélectionne réellement. Le même comportement s'applique au clic sur une arme déjà équipée dans le catalogue ou le HUD. Les emplacements vides ouvrent le choix sans équiper implicitement une arme.
- Le clic du HUD transmet le bon emplacement à l'inventaire. La fenêtre d'équipement place son focus initial sur cet emplacement. Retour au lobby : focus rendu à l'arme d'origine.
- Croix de retrait dans l'inventaire et sur les armes du HUD. Le retrait ne déclenche pas aussi la sélection. Le snapshot confirmé reste affiché pendant la demande ; un refus conserve l'équipement existant.
- La dernière arme reste requise par la politique existante du jeu. Sa croix est désactivée, avec une explication. Retirer l'arme active parmi plusieurs sélectionne le premier emplacement restant selon le modèle existant.
- Rotation par glisser horizontal sur le personnage, flèches gauche/droite, boutons dédiés et réinitialisation par Home ou le bouton de reset. Disponibles dans le lobby et l'inventaire ; le portrait reste fixe. Seule la racine clonée de prévisualisation tourne.
- Échap retourne au lobby après les dialogues et la capture des touches. Les gardes des réglages continuent d'être respectées.

## Présentation et accessibilité

Surfaces ardoise translucides, traits de sélection cuivre, ombres internes, reflet discret du bouton principal, états de chargement et focus clavier visibles. Éclairage de présentation plus doux pour le clone du lobby. Trois tailles de texte de menu mémorisées, et respect du mouvement réduit. Le blanc du bouton principal a un contraste supérieur à 4,5:1 contre les deux extrémités du dégradé cuivré ; ce n'est pas une certification globale d'accessibilité.

Les sons de survol/clic des nouveaux contrôles sont des adaptations S5 explicites, réutilisant les échantillons de base authentifiés et le bus SFX du jeu. Ils ne prétendent pas être de nouveaux raccordements natifs. Un survol ne déverrouille pas l'audio et n'est pas mis en attente. Les trois contrôles déjà raccordés gardent leur chemin audio sans doublage. Aucun son de succès d'équipement ou de transition non établi n'est inventé.

## Vérification

- 231 tests ciblés passent : navigation, équipement confirmé/refusé/en attente, retrait, sélection directe, rotation et indépendance du clone, son/muet, inventaire, cartes, salle, reprise/résultats, cycle de session et réglages. Journal : `work/lobby-polish-20261020/regression.log`.
- Build de production vérifié ; journal : `work/lobby-polish-20261020/build.log`.
- Contrôles navigateur : 1280 × 720, 1920 × 1080, 2560 × 1440 et 3440 × 1440 sans débordement horizontal. Agrandissement du texte vérifié en 720p. Action de lancement toujours visible en petite hauteur.
- Inspection visuelle des personnages masculin et féminin. Équipement partiel et complet ; ajout réel à l'emplacement 3, retour du focus, retrait confirmé. Entrée dans la salle, passage par l'inventaire et retour à la même salle.
- Captures dans `work/lobby-polish-20261020/`. Les captures antérieures aux dernières commandes de rotation/retrait restent des étapes de contrôle, et non la preuve de l'état final.

## Limites

Les systèmes en ligne, comptes, progression, monnaies et presets restent indisponibles et signalés. Pas de fausses statistiques ni de faux salons. Cette passe n'implémente pas un loadout entièrement vide. Pas d'étude utilisateurs ni de benchmark FPS comparatif : aucun gain de performance n'est revendiqué. La rotation et l'éclairage sont une présentation S5 adaptée ; ils ne certifient pas une caméra ou un éclairage natifs récupérés.
