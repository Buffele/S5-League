# Contacts physiques entre personnages — S5Runtime / S5

23 octobre 2026. Périmètre : contacts entre alliés et ennemis, au sol, en l’air,
pendant les attaques et les projections. Le saut sur un adversaire après une
esquive est un exemple. Reproduction des règles établies dans le client.

## Résultat intégré

La correction est active dans le jeu principal. Training, Chaser et ses variantes
Captain, Siege et Battle Royal n’exécutent plus l’ancien blocage horizontal de
cylindres ni la séparation résiduelle qui déplaçait uniquement l’ennemi.

- src/actor-body-contact.js fournit les corps vivants indépendamment de
  opponents(). Un allié demeure physique quand les dégâts alliés sont refusés.
  L’invincibilité ne supprime pas le corps. Mort, réapparition et changement de
  monde utilisent la présence et les poses courantes ; la destruction du combat
  retire les liaisons.
- queryNativeActorContacts consomme les centres et rayons des solveurs, dans
  l’ordre du roster, avec exclusion de soi. La réponse corporelle source est
  partagée dans nativeActorContactContinuation : appui descendant, arrêt,
  projection et glissement. La marge source vaut .015 en espace normalisé.
- static-contact-movement réunit décor et corps dans la même requête et le même
  accumulateur du contact le plus proche. V2 TEST reçoit aussi les corps du combat
  courant ; ses autres collections expérimentales conservent leurs limites.
- Sur les autres cartes, EllipsoidWorld conserve sa réponse au décor et applique
  la branche source lorsque le contact corporel gagne. Les rayons de caméra/tir
  et les sondes de walljump gardent leur politique de décor : un joueur ne devient
  pas un mur de walljump.
- Au repos sur un corps, le contrôleur utilise la sonde descendante source à
  vitesse terminale, ce qui évite l’enfoncement avec la petite gravité de l’ancien
  solveur. Un corps déplacé ou mort libère la chute ; sauter depuis cet appui reste
  possible. Ce chemin particulier ne retune pas la gravité ordinaire des cartes.

Le producteur préparatoire src/native-player-contact-collection.js reste utilisable
avec des lecteurs natifs explicites. Une donnée inconnue refuse sa qualification.
La liaison du roster S5 ne prétend pas être un lecteur de mémoire native.

## Méthode PvP retrouvée et exécutée

Le blocage initial « un seul acteur disponible » a été levé avec la méthode du
chat Comparer le PvP mêlée S5 et S5Runtime : création d’un véritable acteur joueur par
la factory du tutoriel, dans une partie Deathmatch privée. Ce banc est une
référence native locale ; il ne prouve pas la réplication entre deux clients.

Session dédiée : instance15, PID1600, identité de création conservée. Un premier
préflight a refusé l’ancienne empreinte Python avant tout lancement natif.
Le wrapper native_worker.py qualifie explicitement Python3.12.14 et Frida17.19,
épingle leurs empreintes et conserve les gates du banc existant.

Les commandes utilisent son bail exclusif existant. Le collecteur ne crée aucun
attachement Frida supplémentaire et n’écrit ni HP, ni vitesse, ni état. Les
placements contrôlés passent par l’API native existante ; marche, sauts et attaque
utilisent de vraies entrées avec horodatages et réponses conservés.

Preuves sous work/player-body-contact-20261023 : native-movement-01.json, les deux
scripts native_worker.py/native_contact_capture.py et les journaux de validation.
Le résumé versionné player-body-contact-observations.json, dans tests/fixtures/native,
conserve l’empreinte SHA-256 du brut. Le contrat player-body-contact-source.json
conserve les petites plages du PE et leurs empreintes.

Le propriétaire a fermé uniquement sa session. Son worker-state.json dans
work/melee-pvp-comparison-20261017/capture-expansion-v2/parallel/actor-contact-20261023-02
confirme client, launcher et serveur terminés, six ports libérés et sources
inchangées pendant la session. Aucune instance humaine n’a été remplacée.

## Mesures et sources

Client SHA-256 :
6bea9d8cc2503a1e660c1d8a9dfd1241f394207c4f1cb84a9d4a1fea3d3c8017.

| Cas natif | Distance horizontale finale | Hauteur sur l’adversaire |
| --- | ---: | ---: |
| Marche maintenue700ms | 201,49999 | 0 |
| Saut + avant100ms | 192,36033 | 89,99942 |
| Saut + avant160ms | 120,99960 | 257,19266 |
| Saut + avant220ms | 74,55005 | 299,33804 |

Unités natives. Rayons observés [100,160,100], décalage [0,160,0], masques
2B17BF et FFFFFFFF. Les deux acteurs conservent100HP pendant les déplacements.
Une véritable attaque suivante fait passer l’adversaire à88,056198HP.

Le corps est arrondi : la hauteur d’appui dépend du décalage horizontal. Les tests
rejouent chacun des trois points mesurés au même décalage, avec les contrôleurs
S5 masculin/féminin et les trois chemins de collision. Tolérance sur la hauteur :
.00005 unité de scène. Ce contrôle compare les appuis, sans déclarer identiques
les trajectoires complètes de saut ou les cadences d’entrée.

7B251D..7B25FA parcourt les pools du manager1644AA4, lit leur champ protégé+8,
appelle virtual44 et exclut le solveur source. Le champ du pool est l’identifiant
d’équipe, pas un interrupteur autonome : le test non nul ignore0 et inclut1/2.
Il ne compare pas les affiliations du mobile et de la cible.

Le virtual44 du joueur, 13AAFDC+44 →5192B0, exige actor154, le composant1C et
son virtualB0. Dans la session, B0=B4A300 renvoie vrai pour Normal5, Run6, Jump8,
dégâts/attaques et les autres états actifs lus. Spectate/Ghost/Respawn/Wait0..3
et Death/Idle/Destruction28..30 utilisent C13D20, retour faux. Les noms sont
contrôlés dans actorstates_constants.lua. Le producteur préparatoire conserve
ces courts-circuits sans substituer la santé S5 à une donnée native inconnue.

## Régressions et contrôle visuel

Les tests couvrent appui centré/décentré, maintien au repos, saut, libération du
support, montée sans mise au sol, passage au-dessus, traversée rapide, vraie
boucle Captain avec allié exclu des dégâts, invincibilité, projections, priorité
d’un mur plus proche, mort, changement de monde et destruction du combat.

Les anciens tests d’escalier imposaient une position X/Z fixe et la hauteur
initiale du cylindre. Le corps arrondi autorise l’acteur situé plus haut à monter
sur l’autre puis à quitter l’escalier. Les attentes sont remplacées par le
dégagement réel des triangles et la séparation des volumes, sans supprimer les
contrôles de pénétration du décor. Les attaques/réactions en portée sont testées
séparément sur un vrai sol plat. Rejeu : stair-probe.json dans le dossier de travail.

Journaux : integration-final.tap, native-endpoint-regression.tap,
mode-movement-regression.tap et final-body-wall.tap. Les lots se recouvrent :
ne pas additionner leurs totaux aveuglément.

Le scénario explicite ?qa=body-contact utilise la boucle combat/contrôleur,
l’animation et le rendu du jeu principal. Inspection homme/femme : appui, marche
au contact et attaque. La marche donne1.20900043 unité de scène, soit201,50007
unités natives. Captures et mesures male-*/female-* dans le dossier de travail.
Les captures d’attaque à250ms vérifient la pose ; leurs100HP ne prouvent pas un impact.

## Portée de qualification

La correction des corps des personnages est active. Les constantes, armes,
équipements et réglages généraux de déplacement ne sont pas retunés.
Le moteur complet reste qualifié séparément : nativeReady=false, sans promesse
de parité x87 bit à bit, de trajectoires complètes pour chaque arme, de tous les
volumes transformés/compétences ou de toutes les interactions réseau.
Les branches natives10000/200000 gardent leurs contrats propres.

Validation finale de ce passage : 693 noms de tests distincts réussis dans les
lots référencés (comptage dédupliqué dans delivery.json). Dernier lot de modes :
54/54 après la séparation des contacts corporels et des murs de walljump.
Build Vite réussi : 797 modules, sans effacement d’un build existant ni copie des
ressources publiques ; avertissements connus d’import dynamique et de taille
uniquement. Journal : build-final.log. La mesure Station2/source est également
conservée dans station2-source-land.json ; la caméra au spawn masquait les rigs,
donc cette vue n’est pas comptée comme inspection visuelle des corps.
