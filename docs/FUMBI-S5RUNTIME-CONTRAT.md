# Fumbi : chute libre raccordée, contacts encore à comparer

18octobre2026. La chute libre du Fumbi lâché utilise maintenant les valeurs
et l'ordre numérique de F5C830 : gravité native−5000, amortissement.5,
delta en millisecondes×float32.001 plafonné àfloat32.1seconde. La vitesse reste
en unités natives et chaque opération SSE est arrondie en float32 avant la
conversion de déplacement vers S5. Cela remplace la gravité locale18 sans
amortissement. Le module est raccordé à `station2-touchdown.js`, commun aux
cartes Classic et Modular.

Preuves sous `work/fumbi-physics-20261018/` :

- `source.py` vérifie18instructions,4fenêtres PE et5constantes du client épinglé
  SHA256 `6bea9d8cc2503a1e660c1d8a9dfd1241f394207c4f1cb84a9d4a1fea3d3c8017`.
- `native-home.json` lit réellement le record145B948, son contrôleur et les
  constantes flottantes3/23, après libération des observateurs de démarrage.
  `1053900` lit singleton+8 ; le premier essai singleton+4 lisait la table
  des entiers et est conservé dans `native-home-int-table-rejected.json`, rejeté
  comme preuve des constantes flottantes.
- `flight-witnesses.py` calcule séparément la séquence float32 en Python.
  La fixture portable est un calcul source, **pas une trajectoire native filmée**.
- `browser.json` mesure deux lâchers arrangés, puis5pas de16ms dans le vrai
  moteur S5 : déplacementY−0.11306672215461688, calcul source−0.11306672215461731.
  Les prises, buts, lasers, morts/réapparitions et retours restent vérifiés par
  les tests de vrais mondes/contrôleurs. `receipt.json` porte le résultat final.

Le contrôleur natif possède un rayon100×.006=0.6unité S5 et aucun offset678.
La position native au repos mesurée resteY1063.2001953125, soit6.379201171875001.
**Le placement initial, la remise à domicile, le rayon, les contacts, les rebonds
et la friction de contact ne sont pas encore raccordés fidèlement dans S5.**
La sonde verticale de chute et l'arrêt au sol antérieurs restent des politiques
locales. Aucune correction fixe de hauteur ni réglage général de collision
n'a été introduit ; ce lot ne clôt pas la physique du Fumbi.

La nouvelle copie native a effectivement rejoint la règle Touchdown et créé
son record physique ; la capture `native-touchdown.png` montre pourtant le
lobby encore affiché. Elle ne prouve donc pas un parcours natif complet ni une
comparaison visuelle de chute. Cette copie a été arrêtée ; le S5Runtime original
déjà ouvert par l'utilisateur a été conservé.
