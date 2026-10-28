# Bilan des captures S5Runtime et des tests

État au **25 septembre 2026**, après correction walljump → dash à la dague.
Client étudié : **S5Runtime 0.8.32.92531**, Windows, processus 32 bits.

## À retenir pour reprendre

- Le captureur **S5RuntimeTrace** a été reconstruit dans `tools/s5runtime-trace/`.
  C'est de la télémétrie en lecture seule, pas un enregistreur vidéo.
- Les captures ont permis d'identifier les HP, des états de mouvement et une
  différence concrète dans l'enchaînement walljump → dash.
- **Cette différence est corrigée dans notre jeu pour la dague.** La gravité
  générale n'a pas été changée. Le ressenti après correction reste à essayer en jeu.
- La fidélité complète des trajectoires de saut, dash et walljump n'est pas
  encore validée. Un test automatique passant n'est pas une preuve de fidélité 1:1.
- **Ne plus poursuivre la recherche des contacts sol/mur sans besoin concret.**
  L'utilisateur a demandé d'exploiter les mesures pour reproduire les mouvements,
  pas de retrouver toutes les variables internes ni d'inventer des restrictions.
- Aucune nouvelle manipulation de l'utilisateur n'est nécessaire pour commencer
  les comparaisons sur les captures existantes.

## Ce qui est mesuré, et ce qui ne l'est pas

| Sujet | Résultat exploitable | Limite |
| --- | --- | --- |
| Position et déplacement | Trajectoires horodatées, entrée native de mouvement | Vérifier l'identité de l'acteur et le terrain ; ne pas mélanger toutes les anciennes prises |
| SP | Lecture des SP courants/maximaux et variations pendant les actions | Les capacités dépendent de l'équipement ; validation globale des coûts/récupérations encore à consolider |
| HP | 120 → 69,85 → 19,70 ; clé 22 de la table acteur +0x2C | Les quelque 50,15 HP par coup concernent cet essai, pas toutes les armes |
| HP maximaux | Clé 11 stable à 120 | Reste un candidat, pas testé avec un changement de capacité |
| Saut | ID 8, trois répétitions propres et autres prises | L'état inclut la montée et la descente, voire un délai après réception |
| Chute sans saut | ID 10 sur les sorties de rebord | Ne signifie pas toute vitesse verticale négative |
| Dash | ID 11/12, durée d'état proche de 0,60 s | Directions/variantes non toutes attribuées ; distance et profil de vitesse à comparer |
| Walljump | ID 9 et nouvelle impulsion ; propulsion confirmée par l'utilisateur | La trajectoire complète et le contrôle aérien ne sont pas encore comparés au jeu |
| Contact sol/mur | Aucun booléen natif fiable validé | Recherche mise de côté ; utiliser les collisions de notre moteur |
| Impact d'arme | L'utilisateur confirme effet + son uniquement en frappant le mur | Ce n'est pas un indicateur de contact du personnage |
| Caméra/orientation | Champs candidats présents dans l'ancien profil | Orientation non validée par un essai de rotation ; ne pas l'annoncer calibrée |
| Touches Windows | Anciennes captures avec entrées booléennes toutes fausses | Cause non démontrée ; utiliser l'entrée native, ne pas déduire « aucune action » |

## Correction effectivement appliquée

Dans `src/controller.js`, au démarrage d'un dash **accepté** :

- si l'arme est la dague et qu'un walljump est encore actif (`flight` ou `fall`),
  la vitesse verticale est remise à zéro ;
- la gravité normale reprend dès ce pas de simulation ;
- les dashs ordinaires, les autres armes, les attaques et les coûts SP restent
  inchangés ; un dash refusé faute de SP ne remet rien à zéro.

Preuve S5Runtime sur la prise aérienne : à **48,663 s**, état 9 et vitesse verticale
**−1 831,22 u/s** ; à **48,679 s**, état 12 et vitesse **0** ; puis la vitesse
redevient négative. Notre simulation conservait auparavant la chute.
L'accélération mesurée à partir de la vitesse pendant les dashs reste proche de
**−7 500 u/s²**, donc aucune réduction générale de gravité n'a été justifiée.

Les trois dashs après saut normal ont en réalité été déclenchés pendant la montée,
pas au sommet. Ils conservent leur vitesse ascendante à l'entrée. Le dernier
walljump → dash dans le vide est un essai séparé : ne pas généraliser son reset
à tous les dashs ou à toutes les armes.

Fichiers de régression : `tests/wall-dash-vertical.test.mjs` et
`tests/wall-height-cancel.test.mjs`. L'ancienne attente de conservation de la chute
pour ce dash a été remplacée par le comportement capturé.

## Inventaire des prises utiles

Les identifiants de dossier utilisent l'UTC : `20260924-23xxxx` correspond ici
au **25 septembre après 1 h**, heure de Paris. Racine locale :
`tools/s5runtime-trace/calibration/`.

| Sous-dossier / identifiant | Contenu et qualité |
| --- | --- |
| `captures/capture-20260924-230046-341262` | Déplacements latéraux, 3 057 échantillons sur environ 30 s ; variation de hauteur notable, ne pas traiter toute la prise comme un sol plat |
| `hp-captures/capture-20260924-232030-625859` | HP : 69,85 → respawn 120 → 69,85 → 19,70 ; transitions à 33,197 / 36,949 / 40,353 s |
| `movement-captures/capture-20260924-232635-789815` | Sauts, chute, trois dashs, walljump ; 17 969 échantillons, 300 s, 59,89 Hz réels, aucune erreur de lecture |
| `contact-captures/capture-20260924-233444-868080` | Trois approches du mur, trois sauts, chute ; 17 357 échantillons, 300 s, 57,85 Hz réels, aucune erreur de lecture |
| `airdash-captures/capture-20260924-234804-861723` | Trois sauts, trois dashs pendant la montée, walljump + dash dans le vide ; 9 197 échantillons, 180 s, 51,09 Hz réels, aucune erreur de lecture |

Dans la prise de contacts, un clic droit accidentel de la dague est signalé par
l'utilisateur. État 40 à environ 179,42–181,52 s ; la fenêtre **179,40–185,30 s**,
incluant le repositionnement, est exclue de l'analyse des contacts :
**355 échantillons**, sans supprimer les données brutes. Les annotations sont
dans `annotations.json` à côté de la capture. Les éventuels effets persistants
de l'attaque ne sont pas supposés connus.

Les captures, annotations et rapports détaillés sous `calibration/` sont
**locaux et ignorés par Git**. Un `git pull` sur un autre ordinateur ne les
récupère pas. Les bilans de calibration et les analyseurs sont versionnés.
Pour reprendre une analyse ailleurs, transférer séparément les dossiers utiles,
sans publier aveuglément les blocs mémoire bruts.

## Limites techniques importantes

- Le profil principal trouve la première instance `CRunState` : cela peut être
  un bot. **Il n'est pas fiable automatiquement après changement de salle.**
- Les prises récentes utilisent un acteur vérifié manuellement et une garde de
  vtable. Celle-ci détecte certains objets remplacés, mais pas deux objets du même
  type. Les adresses absolues de session ne sont pas portables.
- Ancien acteur `0x615DCD00` remplacé ; acteur des prises de mouvement récentes :
  `0x1D82AB00`. Ne pas réutiliser ces adresses sans validation.
- Une lecture sans erreur ne prouve ni l'identité de l'acteur, ni le sens du champ.
- Les prélèvements ne sont pas atomiques et la fréquence réelle peut être sous
  les 60 Hz demandés. Les horodatages réels doivent servir aux calculs.
- Un ajustement de position seul et la pente de vitesse native ne donnent pas
  exactement la même accélération apparente ; ne pas modifier la gravité sur la
  base d'un ajustement unique. Écarter collisions, morts, respawns et transitions.

## Vérifications réalisées après correction

- **571 tests JavaScript réussis**, aucun échec.
- **Build Vite réussi**.
- **57 tests ciblés** dash/walljump/enchaînements réussis, inclus dans les 571.
- Analyseurs Python : **5 tests mouvement/contacts** et **3 tests balistiques**
  réussis lors de leur dernière exécution.
- Captureur C# : dernier build Release réussi, zéro avertissement/erreur.
- Pas encore de validation visuelle utilisateur du correctif walljump → dash.

Les 571 tests et le build ont été exécutés sur l'espace de travail courant,
qui comporte aussi des travaux d'interface/animation non inclus dans le commit
de ce bilan. Ce nombre ne désigne donc pas nécessairement la suite d'un clone
propre du commit ; les tests ciblés de la correction sont versionnés avec elle.

Commandes depuis la racine du dépôt :

```powershell
npm test
npm run build
dotnet build tools/s5runtime-trace/S5RuntimeTrace.csproj -c Release
python tools/s5runtime-trace/test_movement_analysis.py
python tools/s5runtime-trace/test_ballistics_analysis.py
```

Si `npm` n'est pas dans le PATH mais `node` l'est :

```powershell
node --test tests/*.test.mjs
node node_modules/vite/bin/vite.js build
```

Les analyseurs `analyze-movement.py`, `analyze-contacts.py` et
`analyze-ballistics.py` relisent les captures, sans refaire jouer l'utilisateur.
Voir leur option `--help`, ainsi que le README de S5RuntimeTrace pour la capture.

## Suite recommandée

1. Vérifier le ressenti du correctif à la dague dans notre jeu.
2. Extraire les passages propres et aligner départ, temps, axes et unités.
3. Comparer **saut simple → dash → walljump**, puis déplacement/sprint/SP.
   Le facteur de conversion utilisé par le jeu est **0,006** ; vérifier son
   application plutôt que comparer directement les coordonnées brutes.
4. Ajuster uniquement les paramètres responsables d'écarts mesurés, conserver
   les traces de référence et ajouter un test automatique pour chaque correction.
5. Ne demander une nouvelle prise que pour une question précise non couverte.

## Détails complémentaires

- [Captureur et utilisation](../tools/s5runtime-trace/README.md)
- [Calibration HP](../tools/s5runtime-trace/HP-CALIBRATION.md)
- [États de mouvement](../tools/s5runtime-trace/MOVEMENT-CALIBRATION.md)
- [Essais de contacts et limites](../tools/s5runtime-trace/CONTACT-CALIBRATION.md)
- [Dash aérien et correction](../tools/s5runtime-trace/AIRDASH-CALIBRATION.md)
