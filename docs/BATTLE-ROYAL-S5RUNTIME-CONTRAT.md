# Battle Royal — contrat S5Runtime et intégration S5

15 octobre2026. Mode9 accessible dans le jeu principal sous `/?mode=battleroyal`,
avec l'étiquette « essais locaux ». **L'intégration n'est pas native certifiée.**

La source XML `_eu_gameinfo.x7`, game_mode9, score_time select1 donne50points et
10minutes. Le contrat statique lit la copie authentifiée de s5runtimegame.exe,
SHA256 `6bea9d8cc2503a1e660c1d8a9dfd1241f394207c4f1cb84a9d4a1fea3d3c8017`.
Script reproductible : `work/game-modes/lifecycle-agent/trace-battle-royal.py` ;
rapport : `native-battle-royal.json` dans le même dossier.

## Règles et compteurs établis statiquement

Les fonctions11052E0,11054D0 et1105800, reliées à la table native du mode9,
distinguent les catégories ci-dessous. Le score total stocké reste indépendant
des agrégats d'affichage ; le suicide utilise un plancher à zéro.

| Champs | Événement | Points |
| --- | --- | --- |
| A4/A8 | Élimination ordinaire / assist | +2 / +1 |
| AC/B0 | Leader éliminé / assist | +5 / +1 |
| B4/B8 | Mort ordinaire / suicide ordinaire | 0 / −1 si score positif |
| BC/C0 | Élimination du leader comme attaquant / assist | +2 / +1 |
| C4/C8 | Mort du leader / suicide du leader | 0 / −1 si score positif |
| CC | Désignations du leader reçues | 0 |

Le message3061 désigne explicitement un compte : EE7D80→DD4FE0→10D1200 écrit
le compte dans+20/+24. Chaque désignation valide incrémente le participant+CC,
même si le compte reçu est identique au précédent. Cela prouve réception et
stockage, sans établir le choix ni le départage du serveur original.

## Jeu principal raccordé

`battle-royal-state.js` conserve les onze catégories, la possession du statut
leader, les doublons, scores et phases. `battle-royal-combat.js` utilise les
contrôleurs, HP et solveurs de contact existants : toutes les autres cibles
vivantes sont adversaires, y compris entre bots. Les murs continuent d'obstruer
les contacts et rayons. Le même callback traite élimination, mort et retour.

Deux bots poursuivent directement avec contrôleurs et santé indépendants.
Après4secondes, acteur, actions, effets de mort et santé sont réinitialisés.
L'UI affiche score personnel, meilleur rival, leader, période, classement et
résultat. Le leader porte un marqueur S5 ; ses compteurs natifs restent séparés.
Le mode se choisit dans le menu, sur arène/Circle2Azure/Circle2classique.

Score limite ou fin du temps verrouille le combat pendant l'annonce10secondes,
puis affiche victoire, défaite ou égalité. Entrée ou Rejouer remet scores,
catégories, santé, acteurs et effets à zéro. Le changement de mode retire les
callbacks et ne conserve aucun modificateur ni filtre Chaser.

## Politiques et limites conservées

- Le leader local est le meilleur score après un kill, avec égalités dans
  l'ordre stable des participants ; aucun changement automatique sur suicide.
  C'est une politique S5/de la référence serveur. L'API accepte aussi une
  désignation externe explicite pour les comparaisons.
- Meilleur score individuel gagnant et égalité au sommet restent des choix
  S5. Le winner-team de la référence BR est un placeholder de protocole,
  insuffisant pour prétendre connaître le résultat individuel original.
- Annonce10secondes : référence serveur ; respawn4secondes, IA, spawns,
  marqueur et agrégats UI : adaptations S5. Mesures natives de partie à faire.
- L'API peut recevoir un assist validé, mais le seuil/temps de qualification
  automatique demeure inconnu. Aucun barème de dégâts n'est inventé.
- Les cartes BR originales, sons/scènes UI propres au mode et comportement
  des flags weapon_drop/weapon_unlimit ne sont pas livrés par ce raccordement.
- Le score natif et les HP finaux n'ont pas encore été comparés en vraie partie
  Battle Royal avec plusieurs clients. Les tests S5 ne remplacent pas cela.

## Preuves

123tests ciblés passent, dont de vraies entrées Dagger des deux sexes,
bot↔bot, mur, rayon rifle, respawn et résultat/replay ; build réussi, avec
l'avertissement préexistant INEFFECTIVE_DYNAMIC_IMPORT.
Rapports `battle-royal-main-regressions.tap`, `battle-royal-main-build.log` et
`battle-royal-main-report.json` sous `work/game-modes/lifecycle-agent/`.

`qa=modes` ajoute des fixtures explicites. Les boutons BR de receiver létal
contrôlé prouvent le raccordement HP/callback/règles ; le bouton générique
Élimination utilise la vraie entrée d'arme et le solveur de contact. La
consolidation navigateur des deux sexes passe24scénarios et90contrôles dans
`work/game-modes/battle-royal-browser-v1/comparison.json` ; comparateur
`tools/compare-battle-royal-browser.mjs`. Sont observés l'attaque Dagger réelle,
les catégories de score, les retours, les trois résultats et le clic réel
Rejouer. Ces contrôles navigateur S5 ne sont pas une partie native comparative.
