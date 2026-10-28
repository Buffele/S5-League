# Touchdown : comparaison réelle du tableau des scores

**18 octobre — crédits de combat raccordés :** le sélecteur natif5556F0
retrouvé distingue victime porteuse (défense4points), attaquant porteur
(attaque4points), élimination ordinaire (2points). Les deux mots du LongPeerId
sont comparés dans cet ordre. Les crédits1103610/11038A0/1103B30 sont qualifiés
contre le PE épinglé :22instructions et11fenêtres. Preuve de code, pas capture
d'un combat natif. Le choix de l'assistant reste à établir.

S5 prend la possession avant le lâcher sur mort. « Recorded points » compte
objectifs + éliminations admises, avec détail attaque/défense. La légende dit
que les assists ne sont pas comptées. Aucun total natif complet revendiqué.
Renderer historique des résultats partagé ; HUD personnalisé inchangé.

Navigateur : vrai Play, trois réceptions létales arrangées dans S5→2,6,4.
Vrai Tab1280×720 sans défilement ni légende coupée ;390×844 sans débordement
horizontal, défilement vertical conservé. Relâchement ferme le panneau.
Preuves et reçu : work/touchdown-combat-points-20261018/COMBAT-RESULT.md.
Sélection finale :548tests/66fichiers et build réussi, sources stables.
Les mentions de classification inconnue ci-dessous sont désormais historiques ;
combat natif partagé et assistances restent ouverts.

**18 octobre — tableau compact lisible pendant Tab :** à1280×720, la capture
en partie ordinaire montre les deux équipes et les six métriques de chacun
des deux participants sans défilement. Le titre est compacté et les métriques
sont disposées en colonnes. Pour un ou deux acteurs, leurs détails sont ouverts
par défaut ; pour un groupe plus grand, le joueur local reste ouvert par défaut.
Une fermeture choisie par l'utilisateur est conservée lors d'une mise à jour.
Le renderer de détails est partagé avec le roster de résultat historique ;
la nouvelle feuille compacte reste limitée au panneau maintenu avec Tab.

À390px, les colonnes emblème/ping sans producteur sont masquées ; les métriques
passent sur trois colonnes et le défilement vertical reste disponible. Géométrie
mesurée pendant une ouverture diagnostique temporaire : panneau350px sans
débordement, tables321px et métriques322px, chacune sans débordement horizontal.
La visibilité et la taille du navigateur ont ensuite été restaurées.

37 tests ciblés et build passent ; HUD personnalisé inchangé. Preuves :
`work/touchdown-combat-points-20261018/`. La capture desktop montre réellement
l'ouverture Tab ; la lecture DOM suivante était déjà après son relâchement
et ne sert pas de mesure géométrique du panneau. La classification native des
éliminations/assistances reste ouverte, comme décrit dans `HANDOFF.md`.

**18 octobre — contributions d'objectif comparées en jeu :** la copie privée
S5Runtime a maintenant produit un ramassage spatial réel, puis un but marqué par
l'utilisateur. Briefing natif :0point, puis2, puis12 ; ramassage1, but1, autres
champs de l'extension nuls. La capture du ramassage montre aussi Acquired Fumbi
Score. S5 calcule désormais ces contributions dans les détails sous le libellé
« Objective points (pickups + goals) ». Cette valeur exclut explicitement combat
et assistances ; la colonne du score individuel complet reste inconnue.
La formule n'est donc pas promue en total natif complet. Source et témoin :
`docs/S5RUNTIME-LAB-ENTREES-ARRIERE-PLAN.md` et
`tests/fixtures/native/touchdown-objective-points-20261018.json`.

**18 octobre 2026 — détails de session raccordés :** le tableau reçoit désormais
les ramassages du Fumbi, éliminations, morts et HP de combat réellement perdus
par les acteurs S5. Ces valeurs sont présentées sous « Recorded S5 statistics ».
Les HP de combat ne sont pas appelés Damage Done/Taken natifs : leur unité et
la prise en compte des dégâts d'environnement natifs ne sont pas établies.
Le score individuel pondéré et les assistances restent inconnus.

`TrainingCombat.receive` transmet les HP après admission et écrêtage ; un impact
refusé ou une victime déjà morte n'ajoute rien. Les lasers et chutes ajoutent une
mort sans créditer un attaquant. Les réapparitions conservent l'historique du
match ; une réinitialisation efface les compteurs. Les détails utilisent des
copies, sans permettre à l'UI de modifier le registre. Les équipes conservent
leur identité à la mi-temps. Le style S5 et le HUD personnalisé sont conservés.

Preuves : `work/touchdown-statistics-20261018/`.529 tests et build passent.
Le navigateur montre un ramassage dans le scénario QA S5. La capture lisible des
détails est une inspection de mise en page par ouverture temporaire du panneau,
annulée ensuite ; elle ne vaut pas preuve clavier. Une première capture avec Tab
maintenu montrait déjà ce compteur, avec le panneau QA visible. Les tentatives
de défilement simultané via l'outil ont refermé le tableau ; elles ne valident pas
le défilement pendant un maintien physique. La comparaison native de ramassage
reste ouverte, voir `NATIVE-HANDOFF.md` dans le dossier de preuves.

**Mise à jour prioritaire du 18 octobre 2026 :** à la demande de l'utilisateur,
la disposition native présentée dans ce compte rendu est désormais une preuve
historique, pas une cible graphique. Le menu Tab utilise une présentation S5
originale (`src/s5-match-roster.css`) : panneau central, résumé latéral par équipe,
équipes empilées, dessins CSS et typographie système. Les éléments graphiques
S5Runtime sont écartés du tableau ouvert avec Tab, pour les modes qui utilisent les
rosters communs. Les écrans de résultats restent hors de cette modification.
Les statistiques disponibles, les inconnues et les règles de gameplay restent
identiques. Une différence visuelle ne constitue pas une garantie juridique.

Validation de cette nouvelle présentation : `work/s5-tab-alternative-20261018/`.
42 tests ciblés et build dans le répertoire existant. En partie ordinaire S5,
Tab ouvre le tableau puis le relâchement le ferme. Touchdown contrôlé à1280px
et390px : aucun débordement horizontal, y compris dans les deux tables. Siege
contrôlé à1280px : les deux équipes sont visibles ensemble ; les statistiques
détaillées restent accessibles par défilement. Les bandeaux et fonds de cellules
hérités sont masqués dans ce panneau. Les autres rosters communs reçoivent la
même feuille CSS et leurs tests passent ; aucune vérification visuelle exhaustive
de tous les modes n'est déduite de ces deux contrôles. Le HUD conserve son hash.

18octobre2026. Référence : copie privée du client épinglé, mode2/carte66,
personnage local Alpha. `work/native-render-activity-20261018/` conserve les
captures, lectures et commandes ; le S5Runtime original ouvert par l'utilisateur
n'a pas été modifié ni arrêté.

## Ce qui est observé

Le décor et la position physique changent après un déplacement natif contrôlé.
Les images de la nouvelle session montrent réellement Station2 en partie.
Le maintien de Tab2s ouvre les panneaux Alpha/Beta ; son relâchement les ferme.
Colonnes affichées : Emblem, Name, Score, Goals, State, Ping. L'équipe Beta vide
reste vide. Les détails visibles sont Damage Done/Taken, Total Kills/Deaths,
Fumbi Picks et Goal Assists. Les zéros observés appartiennent à cette session.

Le premier essai RAWINPUT seul n'avait pas montré le tableau à l'instant de sa
capture. Le chemin final ajoute les messages Tab de la fenêtre privée au même
RAWINPUT, avec contrôle du PID et relâchement automatique, puis laisse150ms au
traitement de l'événement. Cela prouve le fonctionnement du chemin final ; ce
n'est pas une comparaison isolée de l'effet des messages et de ce délai.
Aucune fonction d'affichage du tableau n'est appelée directement dans S5Runtime.

## Changement S5 livré

Sur desktop, le tableau est maintenant disposé en deux panneaux en haut de
l'écran, avec les bandeaux Alpha/Beta récupérés, plutôt que dans une fenêtre
centrale. Les colonnes sont réparties d'après la référence observée. À1440×1080,
l'en-tête Alpha S5 est àx60/y195, largeur600px. Le fond est atténué pendant
l'ouverture ; l'objectif est masqué temporairement pour dégager les en-têtes.
Le parcours compact reste une adaptation S5 à390px. À1024px, une marge minimale
sous le score personnalisé évite son chevauchement avec les bandeaux.

Le HUD personnalisé HP/SP, compétence, arme et score/chrono est conservé.
Sa feuille CSS et main gardent leurs empreintes précédentes ; aucun réglage
de jeu, compteur, attribution de score ou identité de participant n'a changé.
Le scoreboard affiche toujours les acteurs réels de la session S5 et leurs
buts comptabilisés. Score individuel, emblème et ping sans producteur restent
des tirets ; aucune valeur native observée n'est recopiée comme donnée S5.

Le contrôle final utilise le parcours ordinaire Lobby→Room→Start, puis un vrai
maintien CUA de Tab2s après attente d'ouverture du panneau. Ouverture, capture
pendant le maintien et fermeture au relâchement sont confirmées. Une ouverture
DOM diagnostique a servi au travail de mise en page, puis a été annulée avant
ce contrôle clavier final. Aucun scénario de gameplay QA n'était actif.

## Limites conservées

Les statistiques détaillées et les points individuels TD restent à produire
fidèlement. Les panneaux de résultats ne sont pas modifiés. La comparaison
native documentée porte sur Alpha ; aucune validation native Beta, autre mode,
classement complet ou récompense réseau n'en découle.

Un fichier BMP récent ne garantit pas un backbuffer récent : capture_native.py
refuse maintenant une copie non prête ou inactive sans option d'arrière-plan.
Il continue de déclarer la fraîcheur par frame non prouvée automatiquement.
La nouvelle copie était aussi au premier plan lors des lectures ; l'option
BackgroundInput seule n'est donc pas établie comme cause de reprise du rendu.
Les anciennes captures de lobby restent impropres à valider une scène en jeu.

Validation finale :526tests Node,7tests Python, un build dans le répertoire
existant sans copie/vidage des assets. Aucun constat de cette page ne clôt
l'objectif global S5.

Validation navigateur de cette contribution : scénario S5 qa=modes, vraie action Play puis positions arrangées par les contrôles QA. Les détails passent de0 à2 après prise, puis12 après but ; la remise en jeu garde12. La capture s5-objective-points-diagnostic.png utilise une ouverture temporaire du panneau pour inspecter sa mise en page, restaurée ensuite. Le scénario natif est distinct : parcours clavier normal et but marqué par l'utilisateur.533tests et build passent. Aucun de ces contrôles ne clôt le total combat/assistances.
