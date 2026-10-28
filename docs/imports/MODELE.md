# Fiche d’import — NOM

Date : À RENSEIGNER.
Statut : préparée / non démarrée.
Prochaine action : À RENSEIGNER.
Guide : [procédure](../IMPORT-ARMES-GUIDE.md), [contrôles](../IMPORT-ARMES-CONTROLES.md).

## Identité et sources

| Élément | Valeur / chemin / fonction / empreinte | Niveau de preuve |
| --- | --- | --- |
| Famille, clé runtime, item, skin | À établir | Non vérifié |
| Installation, archives, index | À établir | Non vérifié |
| Implémentation sauvegardée | À retrouver | Piste seulement |
| NormalState / RunState | À lire séparément | Non vérifié |
| Attaques / secondaire / charge / combo / aérien | À inventorier | Non vérifié |
| Attache / attributs / tables de statistiques | À établir ; noter divergences et priorité inconnue | Non vérifié |

## Contrat de comportement

Créer une ligne par état et par action réellement recensée, y compris transitions et annulations.
Ne pas supposer qu’une arme possède une charge, une recharge ou un secondaire.

| État / entrée | Source précise | Clips haut/bas M et F | Durée, vitesse, boucle, blend | Mobilité / root motion | Contact, VFX et audio aux instants prévus |
| --- | --- | --- | --- | --- | --- |
| Repos | À établir | À établir | À établir | À établir | À établir |
| Huit directions | Clés sémantiques et signes à vérifier | À établir | À établir | À établir | À établir |
| Actions recensées | À établir | À établir | À établir | À établir | À établir |

Combat : portée/volumes, fenêtres, cadence/délai, dégâts, critique, décroissance, nombre de contacts et répétition, consommation, réaction/interruption/impulsion, collisions. Pour les tirs : visée, motifs, accuracy, récupération, zoom. Toute valeur inconnue reste marquée.

## Ressources et événements

Une ligne par modèle, clip, effet/sous-effet/texture et son ; lister les dépendances partagées.
| Ressource / événement | Source et CRC/empreinte | Chemin runtime | Socket, début/fin, suivi et espace | Extraction / raccordement / observation |
| --- | --- | --- | --- | --- |
| À inventorier | Non vérifié | Non vérifié | Non vérifié | Non vérifié |

## Validation

Pour chaque contrôle C01 à C14 : résultat, source d’applicabilité, test et résultat daté, observation en jeu, comparaison S5Runtime si disponible.
Une ligne « réussi » sans preuve n’est pas validée.

| ID | Applicable / raison | Résultat | Test / rapport | Observation M et F : scénario, instant, capture | Comparaison S5Runtime / limites |
| --- | --- | --- | --- | --- | --- |
| C01–C14 : créer une ligne par contrôle | À établir | À faire | Aucune | Aucune | Non comparé |

Contrat central : non actualisé. Gate : non exécuté. Build : non exécuté.
Régressions des modules partagés : à choisir selon les modifications.
Transport Git des assets et dépendances : non vérifié.

## Blocages et reprises

| Problème / dépendance exacte | Début / dernière avancée vérifiable | Tentative distincte et résultat | Conséquence | Condition de reprise |
| --- | --- | --- | --- | --- |
| Aucun problème investigué à ce stade | — | — | — | — |

Seuil : trois tentatives infructueuses ou 30 minutes sans progrès sur le même problème. Journal conservé entre reprises ; ne pas recommencer les mêmes recherches sans donnée nouvelle.

Demande S5Runtime éventuelle : question à trancher, arme/skin, commandes/état/direction/vue, scénario local déjà préparé. Ne rien déclarer demandé ou observé avant de l’avoir fait.

## Bilan du passage

- Statut final et fonctions réellement utilisables :
- Limites essentielles / mineures et approximations :
- Tests/build/gate et observations réellement effectués :
- Fichiers modifiés, ressources partagées et preuves :
- ARMES et manifeste actualisés :
- Prochaine arme / condition de retour :
