# Lobby S5 — intégration du concept retenu

Le lobby reprend la composition du concept validé le 18 octobre 2026 : navigation sombre, groupe à gauche, personnage au centre, salons à droite, profil et configuration en bas. La marque reste S5 League.

Le décor seul a été généré avec imagegen intégré. Le HUD est composé de vrais éléments HTML/CSS et d’icônes SVG : surfaces translucides, reflets, ombres internes, traits lumineux discrets, sélection cuivre, transitions de survol, déplacement des armes et balayage du bouton principal. Les animations respectent la préférence de mouvement réduit. Aucun contrôle n’est intégré dans l’image de fond.

## Ports actifs

- Inventaire et personnalisation : navigation existante, trois emplacements confirmés par l’événement `s5:weapon-loadout-changed` et icônes de l’apparence réellement équipée. Un emplacement vide reste vide. Un clic ouvre l’inventaire existant.
- Partie locale : carte et mode lus via le port de session, aperçu d’origine quand le nativeMapId est connu, repli explicite « Aperçu de carte indisponible » sinon. Aucun salon réseau inventé.
- Créer : ouvre les réglages locaux existants. Entrer / reprendre / revenir au salon conserve les contrôles de disponibilité et le cycle de salle existants.
- Personnage et portrait : clones en lecture seule de la pose après évaluation du mixer, avec cadrage de portrait optionnel. Aucun changement des animations, des armes ou des ressources de personnage.
- Réglages et outil d’animations : routes existantes conservées.

## Systèmes visibles mais verrouillés

Boutique, clans, social, amis, messagerie, invitations, réseau, actualisation des salons, monnaies, expérience et préréglages supplémentaires restent affichés avec cadenas ou état indisponible. Les commandes verrouillées sont désactivées et n’émettent aucune navigation. Les valeurs de compte manquantes sont affichées « — », sans niveau, solde, messages ni progression fictifs. Le profil est « Joueur local ».

## Vérification

- 178 tests ciblés passent : lobby, ports de session et équipement, navigation, récupération après erreur, disponibilités, sons, inventaire, prévisualisations M/F, cycle des salles et intégration réelle des actions Play/Resume.
- Build Vite réussi. Avertissements préexistants : gros chunks et import dynamique également statique.
- Contrôle visuel dans le jeu à 1672×941, 1280×720 et 390×844. Aucun débordement horizontal des actions à 390px ni action coupée à 1280×720.
- Parcours manuels : création/réglages, changement de mode, inventaire, assignation de Plasma Sword au deuxième emplacement, confirmation dans le bandeau, personnages masculin et féminin, entrée dans la salle d’attente puis retour au lobby. Console sans erreur lors de ces contrôles.
- Référence, captures et journaux : `work/lobby-redesign-20261018/`. Prompt du décor : `public/assets/s5/lobby/generation.json`.

## Limites de présentation

Le décor de lobby est une image d’environnement, pas un nouvel espace navigable. Le personnage reste celui équipé dans S5 ; le costume rose à tête de chat du concept ne constitue pas un nouvel import. Les miniatures de cartes proviennent des ressources déjà disponibles, et peuvent différer des variantes graphiques de ces cartes. La liste en ligne reste une zone verrouillée, en attente d’un véritable service réseau.
