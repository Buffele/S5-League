# Catalogue S5Runtime — état et prochaines actions

État au 26 septembre 2026. Le catalogue inspecte les sources sans modifier le jeu ;
les corrections de présentation S5 validées sont détaillées séparément ci-dessous.

## Ce qui est disponible

Ouvrir `/animation-catalog.html`, ou le lien **Catalogue S5Runtime** dans l’atelier.
Les aperçus utilisent les pistes originales chargées par le jeu, sans copie à
15 poses/s, sans fondu entre clips et sans changement des fichiers d’animation.
Deux personnages maximum sont chargés : A et B. Lecture normale/ralentie,
repères temporels indépendants, pas de 1/60 s, face/profil, squelette,
comparaison **fin A / début B**, filtres et références sont disponibles.
Le pas de 1/60 s est un outil d’inspection, pas une affirmation sur le tick S5Runtime.

| Inventaire | Résultat |
|---|---:|
| Entrées masculin | 223 |
| Entrées féminin | 212 |
| Total (identité = sexe + clip) | 435 |
| Appels SetAnim relevés dans les 3 scripts d’armes | 3936 |
| Entrées possédant au moins une référence de script | 114 |
| Entrées avec associations natives sourcées (5 clips × 2 rigs) | 10 |
| Entrées annotées en priorité déplacements | 39 |
| Gestes candidats / contestés / non identifiés | 37 / 2 / 396 |

Les nombreux appels incluent les variantes et skins : ce ne sont pas 3936 animations
distinctes. Les 4 références non résolues correspondent à deux appels vers
`SN001_2`, absent des deux rigs importés. Le catalogue les conserve explicitement.
`00054` est absent du rig féminin. Les durées peuvent différer entre sexes :
`R0024` dure 0,500 s sur le rig masculin et environ 1,033 s sur le féminin.

## Ce qui est identifié — et ce qui ne l’est pas

Deux statuts distincts existent par fiche : **geste visible** et **usage S5Runtime**.
Un usage « confirmé » par script signifie seulement que l’association apparaît
dans un fichier S5Runtime : ni le déclenchement réel, ni la vitesse en session, ni le
contexte de sélection ne sont automatiquement confirmés.

Les gestes de déplacement restent des candidats issus des mappings S5 et observations
déjà disponibles. Aucun nouveau geste n’a été déclaré confirmé par simple
ressemblance. `00003` conserve une attribution contestée : les essais successifs
ne permettent pas de conclure qu’il est le relevé avant.

Les aperçus de profil vérifiés montrent notamment : `00000` passe par une posture
regroupée et finit bas sur les mains ; `00003` commence dans une posture de réception
bras levés. Ces observations seules ne prouvent pas ce que S5Runtime joue à cet instant.
Les paramètres natifs ont ensuite permis la correction ciblée décrite ci-dessous,
sans remplacer les fichiers d'animation d'origine.

Complément natif : l'usage de `00000` en réception (sous-état 6) est désormais
confirmé par le code et les paramètres chargés, avec vitesse 0,8 et sortie après
300 ms. Le chemin normal vers l'attente dague `SN002` utilise un fondu de 1 000
ticks (~208 ms), source toujours en mouvement. Les vidéos ne sont pas synchronisées
avec cette lecture : le statut du geste visible reste candidat. Voir
`S5RUNTIME-FORWARD-JUMP-VIDEO.md` et `s5runtime-landing-animation-evidence.json`.

## Réutilisation des captures

Un audit local a relu entièrement les archives de quatre prises, sans erreur de
décompression/JSON. Il inventorie les canaux, sans publier de valeurs mémoire ou
de pointeurs. Voir `animation-capture-coverage.json`.

| Prise | Segments | Mesures |
|---|---:|---:|
| Flottement dague | 6 | 6117 |
| Double sprint | 6 | 3575 |
| Garde → dodge → changement d’arme | 4 | 2393 |
| Walljump vers le train | 6 | 6092 |
| Total | 22 | 18177 |

Aucun canal **explicitement nommé** clip, animation, blend ou playback dans ces
prises. Cela ne prouve pas qu’aucune information d’animation n’existe dans les blocs
bruts ; elle n’est pas encore décodée/validée. Les tableaux d’entrées Windows sont
vides ; certaines sondes natives de commandes sont néanmoins stockées dans les
valeurs. Ne pas confondre ces deux mécanismes.

Les rapports existants restent les références pour les déplacements et états :
`DAGGER-FLOAT-ANALYSIS.md`, `DOUBLE-SPRINT-ANALYSIS.md`,
`ORDERED-DODGE-SWITCH-ANALYSIS.md`, `TRAIN-WALLJUMP-ANALYSIS.md` dans
`tools/s5runtime-trace/`. Le HAR Project Zin ne constitue pas une mesure S5Runtime.

## Ce qu’il reste à faire

Mise à jour : une première vidéo Game Bar de saut avant a été reçue et décomposée.
Voir `S5RUNTIME-FORWARD-JUMP-VIDEO.md` pour les repères visuels et leurs limites.
Une seconde prise 1080p/~60 images/s complète l'étude. L'écart entre les anciennes
500 ms S5 et la réception native de 300 ms est corrigé. Le chemin normal et ses
paramètres de mélange sont confirmés par les sources natives, mais n'ont pas été
mesurés simultanément à la vidéo. **Ne pas refaire toutes les prises** : ce sont
les variantes encore ambiguës et les délais de cancels qui restent à vérifier.

### Travail technique restant

1. Compléter l’identification des gestes à partir du catalogue, en gardant les
   preuves et les désaccords plutôt qu’en modifiant directement le gameplay.
2. Valider une sonde du clip actif et du temps de lecture dans S5Runtime, ou disposer
   d’une vidéo synchronisée pour les gestes qui restent ambigus. La sonde actuelle
   valide des paramètres chargés, pas le clip et son temps de lecture à chaque image.
3. Mesurer les transitions/cancels et comparer avec S5 une fois les séquences
   identifiées. La durée d’un fichier animation n’est pas sa durée effective en jeu.

### Ce que l’utilisateur doit faire

**Rien à rejouer immédiatement. Aucune capture n’est active.** S5Runtime n’a reçu aucune
commande pendant cette livraison ; le fait qu’il soit ouvert ne signifie pas qu’il
est enregistré. Les tests précédents n’ont pas besoin d’être refaits en bloc.

Le relevé avant normal ne nécessite plus de nouvelle vidéo pour identifier son
mélange. Si une validation visuelle des variantes devient nécessaire : terrain plat,
personnage et arme précisés, témoin arrière et réception avant interrompue par un
sprint, avec trois répétitions séparées. Ne commencer que sur demande et quand
l'enregistrement est effectivement lancé ; le code natif reste exploitable entre-temps.

## Maintenance / reproductibilité

- `node tools/build-animation-catalog.mjs` régénère uniquement l’inventaire.
- `public/assets/animation-catalog-annotations.json` contient les annotations
  séparées et n’est jamais écrasé par cette génération ; une clé sexe:clip permet
  de remplacer une annotation commune à un numéro.
- `node tools/audit-animation-captures.mjs` refait l’audit des quatre prises locales.
  Leur absence dans un autre checkout est signalée, pas masquée.
- Les empreintes des rigs et scripts sont conservées dans l’inventaire pour
  rattacher les conclusions aux fichiers exacts.

Les exports générés ne publient pas les blocs mémoire des captures. Les scripts
Lua sont lus comme texte, jamais exécutés. Les animations additionnelles Mixamo,
les adaptations S5 et les rigs d’autres versions S4 ne sont pas mélangés aux 435
entrées des deux rigs S5Runtime de cette première version.

## Vérification de cette livraison

735 tests réussis, build Vite réussi. Vérification dans le navigateur : chargement
des deux sexes, comparaison de profil début/milieu/fin, changement de clip,
recherche SN013 et affichage de ses références, lecture à un quart de vitesse.
Les poses ont été examinées dans le catalogue, pas dans le client S5Runtime ouvert.

## Mise à jour : raccord de réception avant

Le chemin normal `00000 → SN002` est désormais établi par le code natif et les
paramètres chargés en lecture seule, puis implémenté dans S5 : réception à 0,8,
sortie après 300 ms, fondu à source animée de 208,3 ms. Le supplément du prochain
fondu après `00003` est également identifié. Voir
`S5RUNTIME-FORWARD-JUMP-VIDEO.md` et `s5runtime-landing-animation-evidence.json` pour les preuves,
les limites et la distinction entre réglage natif et observation vidéo.

Validation actuelle : 740 tests réussis, build réussi, intégration sur les deux
rigs à 30/60/144 images/s et contrôle visuel du relevé masculin. Les anciennes
demandes de capture ci-dessus sont historiques : aucune nouvelle capture n'est
nécessaire pour établir ce chemin normal. Les variantes ambiguës et les timings
exacts de cancels restent à valider, sans refaire tous les tests antérieurs.

### Complément : interruptions et changement d'arme

Le mélange de changement d'arme applique maintenant la même distinction native :
source animée pour un raccord ordinaire, transformations instantanées conservées
si un fondu était déjà en cours. Les os non concernés (ex. jambes en marche)
continuent leur animation. Un changement d'arme pendant le relevé ne prolonge plus
artificiellement les deux anciennes animations à poids constants.

Validation la plus récente : **755 tests réussis**, build réussi. Tests sur les
vrais rigs masculin et féminin : interruption du relevé par sprint, attaque et
passage dague → plasma, sans saut de position/rotation à l'instant du raccord,
sans reprise de roulade et sans transformations invalides. Il s'agit de tests
S5, pas d'une mesure des délais de cancel S5Runtime.

### Paramètres natifs consultables dans le catalogue

Les cinq clips `00000` à `00004` affichent maintenant leurs associations aux
paramètres natifs, les sites d'appel, le fondu entrant de base, le supplément au
prochain fondu, la vitesse stockée et l'éventuelle durée imposée. La génération
lit `docs/s5runtime-landing-animation-evidence.json` et conserve son empreinte ; elle
n'exécute pas S5Runtime et ne réinterprète pas les noms de fichiers comme des gestes.

Points importants : `00000` a deux rôles/réglages distincts ; les sous-états 2 et 4
ne sélectionnent pas directement un nouveau clip à leur entrée ; le paramètre 5
(`00002`) est sélectionné au dépassement du timer de saut dans plusieurs branches.
Les appels des paramètres 0/1/2 transmettent une durée depuis l'état : leur vitesse
effective ne se déduit donc pas de la seule vitesse stockée. La signification de
chaque branche par rapport aux touches reste à valider avant de modifier S5.

Les dix entrées ne constituent pas dix gestes nouvellement validés en vidéo.
Le désaccord visuel sur `00003` est conservé. Vérification ciblée : 8 tests du
catalogue réussis, compilation réussie ; aucun changement de gameplay dans cette étape.
