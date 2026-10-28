# Captain : contrat de preuve S5Runtime/S5

15 octobre 2026. **Intégré au jeu principal en essais locaux ; parcours M/F
vérifiés. Nouvelle présentation XUI à recapturer. Fidélité native complète
non établie.**

Accès : `/?mode=captain&weapon=dagger`, équipe Alpha/Beta dans le menu ou
`team=beta`. Trois acteurs, deux équipes, santé réelle, contacts, manches,
résultat et relance utilisent les adaptateurs S5. Les cartes proposées sont
l'arène et les Circle2 déjà chargées ; leur autorisation native Captain n'est
pas démontrée.

## Sources séparées

Contrôle audio du17octobre : les SEQ captain_win/captain_rose examinées n'ont
pas de nœud son. Les références PE de round_win_01, round_lose_01 et
cpt_kill_02 appartiennent à l'état actif Arena20, pas au Start/fin de manche
Captain10. Les noms de fichiers ne ferment donc pas le mapping audio Captain.
Le code et les sons de ce mode ne sont pas modifiés sur cette base. Preuve :
`work/game-modes/captain-recovery/audio-source-owner.json` ; contexte et limites :
`work/waiting-room-20261017/START-AUDIO-DELIVERY.md`.

La preuve statique `work/game-modes/lifecycle-agent/native-captain.json` est
produite par `trace-captain.py` depuis le PE SHA-256
`6bea9d8cc2503a1e660c1d8a9dfd1241f394207c4f1cb84a9d4a1fea3d3c8017`.
Elle vérifie les consommateurs, sans exécuter une partie Captain native.

| Catégorie | Source client | Raccordement S5 |
| --- | --- | --- |
| Élimination ordinaire | 1104480, A4/B0, +2 | Callback réel de mort, catégories distinctes |
| Élimination d'un captain | 1104480, C0/C8, +5, flag CC | Perte du rôle à la mort ; aucun double comptage |
| Assist | 1104550, A8, +1 | Notification explicite ; qualification automatique inconnue |
| Heal-assist reçu | 1104660, AC, +1 | Notification explicite ; aucun seuil HP inventé |
| Suicide | 11046A0, BC, −1 si score signé positif | Mort volontaire/chute, plancher zéro |
| Manche gagnée | 1442660+A4→DD1970→1104790→1090720, C4, +5 | Récompense du groupe gagnant selon référence |
| Team kill/death | B4/B8 séparés | Champs conservés ; dégâts alliés bloqués localement |
| Rôle | CC byte | Réinitialisé captain au début de chaque manche |
| Champ inconnu | D0 | Zéro, aucune sémantique inventée |

Le slot dérivé de récompense comporte un override. Le premier script attendait
à tort un pointeur direct ; son rejet est conservé dans
`trace-captain-before-vtable-correction.py`.

La référence C# incrémente `Deaths` à chaque mort et n'incrémente `Suicides`
que si le total de points est positif. Ce stockage diffère des callbacks
client retrouvés (B0/C8/BC séparés, BC même à score0). S5 suit ici les branches
client authentifiées ; la référence d'orchestration ne remplace pas ce contrat
de compteurs. La réception heal-assist est une notification, sans quantité HP.

Le XML `_eu_gameinfo.x7` sélectionne score5 et label ROUND_9. La référence C#
`Netsphere.Server.Game/GameRules/Captain.cs` donne500HP par captain sur l'équipe
la plus nombreuse/égale et compense l'équipe minoritaire par
`maxEffectif*500/effectifMinoritaire`, arrondi à100 : vers le bas si elle mène,
sinon vers le haut. Le défaut local1v2 produit1000/500/500HP. Il s'agit d'une
équation de référence serveur, pas d'une mesure live de HP S5Runtime.

## Politiques et limites explicites

Manche180s, intermission5s et annonce de résultat10s proviennent de la référence.
À temps écoulé, le plus grand nombre de captains vivants gagne ; égalité→Beta
est la politique de référence déclarée (`timeoutTie:'draw'` est optionnel).
La référence teste `CurrentRound=sum(scores)+1` après incrément de score,
créant une ambiguïté de frontière. S5 compte9 manches terminées ; la frontière
du serveur original reste à mesurer.

Un captain éliminé revient après4s à100HP comme combattant ordinaire tant que
d'autres captains maintiennent la manche : délai et santé ordinaires S5.
Poursuite directe des bots, spawns et absence de dégâts alliés sont aussi locaux.
L'UI Captain adapte les composants S5 communs ; aucune scène UI Captain native,
carte native spécifique, formule finale d'équipement/HP, qualification d'assist,
interaction complète des compétences ou partie multiclient native n'est validée.

## Raccordement et vérification

Modules : `captain-state.js`, `captain-combat.js`, `captain-match.js`,
`captain-ui.js`, routés dans `main.js`, menu et fixtures `modes-qa.js`.
Le match impose des pas de simulation ≤1/30s, verrouille combat/résultat et
réinitialise acteurs, rôles, scores et effets à la relance.

Le classement Captain affiche désormais chaque catégorie : éliminations de
captains/combattants, assists, notifications de heal-assist reçu, morts de
captains/combattants, suicides et manches gagnées. Les totaux lisibles
`éliminations=kills+captainKills` et `morts=deaths+captainDeaths+suicides`
sont des agrégats d'affichage S5 ; les champs natifs ne sont pas fusionnés.
Un suicide au score0 compte donc bien dans les morts affichées sans modifier
le plancher du score. Les assists restent des notifications explicites.
Le panneau est borné à la fenêtre et défile verticalement si nécessaire.
Tests ciblés et build : `work/game-modes/captain-recovery/roster-tests.tap`
et `roster-build.log`. Le parcours navigateur précédent réussit26scénarios/
128contrôles M/F dans `work/game-modes/captain-browser-v3/comparison.json`,
y compris vraie entrée Dagger et vrai bouton Rejouer. Les autres fixtures
raccourcissent temps/score ou utilisent les receivers. Cette preuve précède
le nouveau layout décrit ci-dessous et ne valide pas ses pixels.

| Niveau de preuve | Statut au15 octobre2026 |
| --- | --- |
| Source client retrouvée | Branches de score et champs vérifiés statiquement |
| Référence serveur | Santé et orchestration identifiées, frontière signalée |
| Implémentation et intégration principale | Réalisées, choix de mode/équipe et deux bots |
| Tests après raccordement | 51/51, `captain-main-initial.tap` |
| Régressions de cœur avant raccordement final | 136/136, `captain-regressions.tap` |
| Build après raccordement | Réussi, `captain-main-build.log` |
| Parcours navigateur M/F avant nouvelle UI | 26scénarios/128contrôles réussis, browser-v3 |
| Nouvelle présentation XUI M/F | Recapture par coordinateur en attente |
| Comparaison à une partie S5Runtime Captain | Non réalisée |

Rapports sous `work/game-modes/lifecycle-agent/`. Les fixtures de réception
contrôlent HP/hooks/règles ; une élimination par vraie entrée Dagger est prévue
séparément sur chaque sexe. Les captures doivent couvrir santé/rôles,
catégories, respawn ordinaire, manches, suicide, timeout, limite, victoire,
défaite et bouton Rejouer. Aucun gate natif n'est assoupli.

## Présentation XUI Captain raccordée

`captain-ui.js` utilise désormais le helper `mode-native-scoreboard.js` :
deux panneaux Alpha/Beta, rects de colonnes du XUI2 Captain, marges contenu
31/40, fonts Netsphimere/Static/CondensedItalic/Ace originales et sprites
de panneaux, bannières, couronne et ping local authentifiés. Morts demeure
la colonne Captain ; les catégories détaillées et agrégats S5 existants
restent séparés et inchangés. Niveau/clan/ping réseau non connus n’ont pas
de valeur fabriquée. Les dégâts non mesurés restent—.

Géométrie header/content dérivée du panneau1287, chevauchements conservés.
Adaptations de lisibilité déclarées : panneaux empilés et défilables en
petite fenêtre, minimums de font et hauteur des lignes, détails consultables.
Le style DOM partagé est nettoyé à dispose, sans duplication à recréation.

La jauge Captain prototype hors écran et les jauges PVE homonymes ne sont
pas exposées comme HUD Captain. Aucune SEQ/SCN d’annonce ou chronologie
manquante n’est substituée ; les cinq séquences bloquées restent dans le
diagnostic Interface. Tests/build du lot :40tests réussis sous
`work/game-modes/native-ui-recovery/`. Sources, hashes et critères de recapture
sont dans HANDOFF.md/proof.json. Pas de comparaison visuelle native annoncée.

## Couronnes de monde raccordées le16 octobre2026

Les trois SCN sources self/atex/etex sont raccordés dans `captain-match.js`
via `captain-world-effects.js`. Le consommateur natif983BD0 recherche
**Bip01 Head** et y attache la couronne ; aucune hauteur procédurale ni
seconde conversion d'échelle n'est ajoutée. Les pistes sont constantes et
égales aux poses de bind ; la couronne self conserve sa taille source0.5,
les autres1.0, sans hypothèse de boucle SCN.

Les rôles existants CaptainState pilotent apparition/retrait ; la géométrie
suit la tête du nouvel avatar après changement d'arme. Chargements obsolètes,
masquage au lobby, relance et sortie appartiennent au contrôleur d'effets.
Une tête manquante produit un diagnostic, sans attache arbitraire.

143 contrôles ciblés Captain/Siege/main réussis. Partie normale M/F observée
sur une compilation isolée, ainsi qu'Inventory→slot2→Digit2 Dagger/Counter :
même couronne réattachée au nouveau Head, aucune conservée sur l'ancien.
Référence native fraîche Captain/Old Moon : capture masculine self et lecture
des objets couronne/séquence. La comparaison visuelle est qualitative et
limitée à la forme et au placement de cette couronne ; les particules, le
rendu exact et les transitions natives ne sont pas certifiés.

Le raccordement suivant ajoute les deux couches des SEQ de scintillement
originales, avec les vitesses/accélérations consommées par1136C50/1135880.
Une acquisition native passive observe65 échantillons et cinq boucles
de2000ms, rate1, mêmes objets et attaches Head/Dummy. Le paramètre7500
est réservé à une branche audio inactive pour cet appel, pas à sa durée visuelle.

Particules M/F observées dans le jeu principal : six meshes, textures décodées,
positions finies, sortie/relance féminine et changement Dagger→Counter masculin
conservant la même couronne et les mêmes émetteurs sur la nouvelle tête.
0 erreur console.152 contrôles sur la compilation isolée, puis19 contrôles
ciblés après les modifications parallèles Controller/mêlée ; ne pas confondre
ces périmètres. Build isolé6.63s. Héritage exact des tailles billboard,
intégration/RNG et rendu natif demeurent non certifiés.

Le lecteur1240320 et les consommateurs de taille établissent ensuite la
variation commune10/20, ignorée par le premier port. Elle est maintenant
raccordée aux deux axes, aux naissances et aux cibles suivantes. L'ordre
d'intégration position/vitesse est confirmé par1168F90 ; l'identité numérique
x87/CRT reste non certifiée. Contrôle actuel :20 tests ciblés,622 fichiers
inchangés pendant les tests, build5.17s et nouvelles observations M/F.
La densité adaptée à qualité/distance native reste à reproduire/vérifier.

La visibilité alliée atex et les retraits au fil d'une partie native
multiclient restent à observer. Preuves et limites :
`work/mode-world-effects-20261016/DELIVERY.md`, `native/CONTRACT.md` et
`captain-runtime-receipt.json`. Le mode complet reste en cours.
