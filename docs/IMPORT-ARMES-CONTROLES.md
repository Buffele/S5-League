# Contrôles obligatoires — erreurs déjà signalées

30 septembre 2026. À reporter dans la fiche avec résultat et preuve.
Valeurs : **à faire**, **réussi**, **échec**, **bloqué**, **sans objet justifié**.
Les tests cités sont des exemples existants à réutiliser selon leur périmètre ; leur présence ne prouve pas la nouvelle arme.

Consigne utilisateur du25octobre2026 : un seul personnage pour les contrôles
de ce chantier. Les anciennes mentions «deux sexes» ne demandent plus de
doublonner les essais/captures. Les tests de régression existants sont conservés.

Pour C03/C06/C08/C12, appliquer aussi le [contrat des effets](CONTRAT-EFFETS-ARMES.md).
Mesurer l'effet contre son socket/contact attendu après la pose de son propre
avatar, et vérifier la rotation, le pivot source et l'espace des particules.

| ID | Risque à contrôler | Critère observable / test |
| --- | --- | --- |
| C01 | Arme annoncée mais inaccessible | Choix actif dans l’inventaire, chargement réel, entrée en arène et changement aller/retour sans erreur ni effet résiduel. Vérifier chemins publics et dépendances partagées transportables sur un autre PC. |
| C02 | Gauche/droite ou diagonales inversées | Huit directions, personnage sélectionné, plusieurs orientations ; comparer signes Bip01/MoveBox et rendu à la référence validée. Ne pas inverser les commandes pour compenser. Exemples : `tests/breaker-locomotion.test.mjs`, `tests/smash-restoration.test.mjs`. |
| C03 | Repos correct, maintien incorrect | Attache après mixer au repos, attaque, charge/maintien, relâchement et transitions. Vérifier position, échelle, orientation et dérive, BASE distinct des pistes explicites. Exemple : `tests/equipment-rig.test.mjs`. |
| C04 | Arme pointant toujours bas ou devant | Si visée directionnelle : haut/centre/bas selon pointeur, en mouvement, deux sexes ; vérifier le canon réel et non seulement les IDs de clips. Exemple : `tests/semi-rifle-gameplay.test.mjs`. |
| C05 | Jambes figées pendant une action mobile | Attaque/charge/recharge selon comportement source : haut/bas distincts, huit directions, arrêt/reprise sans reset intempestif de marche. Durée mesurée pour chaque sexe. Exemples : `tests/airgun-runtime.test.mjs`, `tests/melee-lower-body.test.mjs`. |
| C06 | Effets présents dans les fichiers mais absents en jeu | Liste exhaustive des événements et dépendances : apparition, charge, maintien, attaque, traînée, impact, fin et annulation si applicables. Observer chaque composant et son extinction ; aucune substitution visuelle silencieuse. |
| C07 | Balles invisibles entre canon et impact | Mouvement visible sur plusieurs instants, départ au socket post-mixer, destination du même contact que les dégâts, arrêt au premier obstacle. Tous les rayons concernés visibles. Exemple : `tests/bullet-tracers.test.mjs`. |
| C08 | Fumée oubliée ou suspendue au mauvais endroit | Contrôler après le flash et pendant le recul. Séparer suivi de l’émetteur et espace des particules ; émission différée, anciennes particules et nettoyage vérifiés. Exemple : `tests/revolver-smoke.test.mjs`. |
| C09 | Impact sans véritable poussée | Si push/projection prévu : changement réel de position/vitesse, collisions du déplacement, réaction et fin d’état. Exemple : `tests/airgun-effects.test.mjs`. Un nom de réaction ne prouve pas une impulsion. |
| C10 | Animation d’impact ou interruption injustifiée | Séparer état de dommage, pose partielle et condition Push. Ne pas ajouter de stun, pause, interruption ou déplacement générique aux balles. Une pose partielle exige son consommateur natif, ses nœuds, son mélange et ses portes de réception ; elle ne se remplace pas par une réaction verrouillant tout le corps. Vérifier aussi l'ennemi en attaque/garde et conserver la mort normale. Exemple de baseline S5 : `tests/revolver-gameplay.test.mjs`, sans en déduire la fidélité native d'une autre arme. |
| C11 | Dispersion absente ou seulement visuelle | Relever accuracy, motif, nombre d’attaques, régression et branche API. Tester proche/loin, rafale, pause/reprise, zoom si présent ; dispersion avant collision et résultat commun dégâts/VFX. Ne pas confondre motif successif et projectiles simultanés ni dispersion et décroissance. Exemple : `tests/rifle-dispersion.test.mjs`. |
| C12 | Son ou secondaire oublié | Chaque action source a une décision explicite : raccordée, absente justifiée ou limite déclarée. Écouter déclenchement/fin/boucles ; aucune déclaration de validation audio sur seule présence d’un fichier. |
| C13 | Combo ou contact mêlée incomplet | Relever fenêtres, enchaînements, déplacement/root motion, portée, multi-contact et annulation. Vérifier coup raté/touché, mur, changement d’arme, absence de dégâts doublés par frame. Exemples : `tests/melee-contact.test.mjs`, `tests/melee-followups.test.mjs`. |
| C14 | Régression des armes déjà corrigées | Sélectionner les tests des modules partagés touchés, préserver les scénarios validés et exécuter le build. Contrat/gate mis à jour sans seuils assouplis ni faux sockets. |

Pour C09/C10, l'absence d'AddPushCondition ne prouve pas une absence de mouvement natif : relever séparément SetDamageData/DAMAGEMOVING et SetPartialAnim, puis établir leurs consommateurs et leur effet en partie. Une baseline S5 sans déplacement ne valide pas ces branches. Voir work/automatic-rifle-reactions-20261017/source-audit.json pour les quatre fusils qui activent DAMAGEMOVING sans Push explicite.

Reprise du18octobre2026 : les consommateurs statiques typés de ces deux
champs sont retrouvés, séparément. DAMAGEMOVING_ENABLE1 autorise la composante
de locomotion inférieure de l'état dommage ; ce chemin ne définit pas un Push.
PartialAnim mélange des transformations locales sur onze nœuds précis, avec
deux vitesses et une enveloppe, sous des portes de réception et de chargement.
Ce n'est ni une animation upper-only ni un flinch verrouillant le personnage.
Les conditions de raccordement et la comparaison en partie restent ouvertes :
voir work/automatic-rifle-reactions-20261017/FOLLOWUP.md. Une règle universelle
«aucune animation d'impact sur toutes les balles» serait donc également injustifiée.

Pour tous les états applicables : observer les deux sexes dans le jeu principal. Noter URL/scénario, temps de capture, attendu, observé et fichier de preuve. Ne pas rendre obligatoire un comportement qui n’existe pas sur cette arme : justifier « sans objet » depuis la source.
