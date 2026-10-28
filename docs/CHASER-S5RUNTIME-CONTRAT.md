# Chaser : contrat S5Runtime et écarts S5

Audit du 3 octobre 2026, demandé après les omissions signalées par l'utilisateur, puis corrections autorisées. **L'intégration S5 reste une adaptation locale, pas une reproduction native certifiée.** La matrice ci-dessous conserve l'état au moment de l'audit ; les corrections suivantes donnent l'état actuel.

## Corrections réalisées après l'audit

**Désignation du Chaser — précision du 4 octobre :** `0x0BC7` fournit le compte Chaser sélectionné et une liste de comptes. Le trajet client stocke le rôle dans `+20/+24`, assigne la liste à `+4c` et la recopie dans `+50`. La taille de `+4c` est celle lue par les facteurs de combat déjà établis. Le traceur `work/chaser-visuals/trace-role-notification.py` et son rapport `audit/native-role-notification.json` passent ; ils établissent la réception et le stockage, sans prouver le tirage serveur ni la construction de la liste. La rotation S5 reste adaptée, et aucune distribution aléatoire native n'est inventée.

**Son de changement de cible — contrôle complémentaire :** le fichier `5_target change.ogg` utilisé dans S5 est identique aux octets décodés et authentifiés de l'archive S5Runtime `package/61.xs`. Toutefois, le trajet audio du callback demande `change_bonus_target.ogg`, absent de l'index local consulté. La réécriture régionale `feff00` conserve ce chemin, sans alias vers le fichier S5. Les étapes de chargement en aval et l'écoute en partie restent nécessaires pour établir l'équivalence. Le rapport `native-target-notification.json` conserve les instructions, empreintes, CRC et cette limite ; aucune substitution de fichier n'a été faite.

**Désignation de la cible bonus — précision du 4 octobre :** le message reçu `0x0BF1` transporte le compte sélectionné (huit octets), puis appelle `ee7150` → `dda490` → `1094510`. Le compte est stocké dans le briefing `+28/+2c`. `b17690` actualise le marqueur de l'acteur correspondant et retire celui des autres acteurs. Le client reçoit donc une désignation ; ce trajet ne prouve pas le calcul serveur du meilleur score ni le départage des égalités. La règle indiquée par l'utilisateur (plus grand score hors Chaser) est déjà appliquée dans S5 aux joueurs vivants. Trace reproductible : `work/chaser-visuals/trace-target-notification.py`, rapport `audit/native-target-notification.json` dans le même dossier. Le callback référence exactement `Resources/Sound/slaughter/change_bonus_target.ogg`, sous condition d'acteur local présent et d'état virtuel `+210` différent de 4. L'équivalence avec le fichier récupéré `5_target change.ogg` utilisé dans S5 reste non vérifiée.

**Compteur H reçu — précision du 4 octobre :** le décodeur client du message `0x0BF0` lit un identifiant de huit octets et un float de quatre octets, puis appelle `ee70f0`, qui transmet ce float sans conversion au virtuel de règle `+e0`. Le binding est vérifié par le constructeur, les tables et les instructions dans `native-capped-combat-notification.json`. L’unité du float, sa production serveur et son association à la requête sortante `0x7e4` restent à établir ; aucun barème de soin n’est inféré.

**Compteurs A/B reçus — précision suivante :** le message `0x0BEF` fournit un identifiant puis deux floats à `ee6f60`, qui transmet A complet à la règle `+d8` et B complet à `+dc`. Pour le compte local, l’extraction séparée de la fraction `A - trunc(A)` alimente le trajet de jauge ; elle ne tronque pas A accumulé. Les bindings et les traceurs du score/classement passent. La conversion serveur dégâts→A/B et les unités ne sont toujours pas établies.

**Preuve statique du 4 octobre :** `dda4f0` calcule les facteurs d'attaque, dégâts reçus et récupération en fonction du nombre initial de poursuivis (`1094e50`, vecteur `+4c`). Pour Devil : `s/(s+3)*4`, `0.1/(s+2)`, `s/(s+2)*3`. Les consommateurs de dégâts `9817e0`/`51e710`, `5737d0`, `601870` et `570890`, ainsi que le getter MP `51e8e0` et la récupération `52b110`, sont désormais tracés. S5 applique les facteurs multiplicatifs et n'ajoute plus les arguments Lua aux dégâts ou à la récupération. La chaîne complète jusqu'aux HP finaux, les modificateurs restants et leur équivalence en partie demeurent à vérifier. Rapports reproductibles : `work/chaser-visuals/audit/native-combat-factors.json`, `native-combat-consumers.json` et `native-mp-consumer.json` dans le même dossier ; détail dans [CHASER-EVENEMENTS-NATIFS.md](CHASER-EVENEMENTS-NATIFS.md). Le meilleur score hors Chaser est confirmé par le retour utilisateur ; le départage à égalité et le tirage du Chaser restent ouverts.

**Points et jauge — état actuel :** le getter natif de score calcule `I + 2 × trunc(A)`. Les incréments A/B/H reçus sont accumulés sans conversion dans les callbacks client ; la formule serveur depuis les dégâts/soins n'est pas retrouvée. Les deux métriques de classement sont `trunc(B)` et `trunc(A)-trunc(B)`, précédées de priorités de catégories encore non interprétées. `ProgressBar_bs_damage` reçoit la fraction de l'incrément A local, avec maintien 3000 puis fondu 500 ; ses setters limitent les valeurs finies à `[0,1]`. **S5 y affiche encore les HP du Chaser : cette jauge est une adaptation connue, pas un raccordement natif fidèle.** Rapports `native-score-pipeline.json`, `native-rank-pipeline.json`, `native-attack-gauge.json` dans `work/chaser-visuals/audit/`. L'outil de lecture relève désormais tous les participants ; ses tests de mémoire synthétique ne remplacent pas une comparaison S5Runtime réelle.

**Précisions suivantes :** les badges du classement en partie relient le rang B à la catégorie d'attaque courte et le rang `trunc(A)-trunc(B)` à la catégorie longue (`native-rank-icons.json`). La règle serveur de catégorisation et les unités restent à établir. Le fond de résultats propre au Chaser est `inter_match_stop`, maintenant raccordé et observé dans S5 (`native-result-background.json`, capture `result-match-background.png`). L'observateur accepte une installation explicitement désignée avec `--client`, exige le chemin du processus et le SHA-256 de la build vérifiée, et reste en lecture seule. Les anciens relevés de laboratoire et les tests synthétiques ne constituent pas une partie S5Runtime originale.

**Passage goal événements/HUD du 3 octobre** : mapping natif des clips démontré puis raccordé (transformation MD006/007, normal MD001, attaque MD002, élimination MD003, victoire MD009, défaite MD008). `ggrim_kill` est désormais parsé, ses dépendances authentifiées et son runtime raccordé à la faucheuse. Défaite, +5/+15 et scènes de résultats natifs décodés, textures fermées et raccordement réalisés. Le reste de cette section décrit les passages antérieurs ; les anciennes mentions « non raccordé » sur ces trois sujets sont dépassées. Preuves, orchestration S5 et limites actuelles : [CHASER-EVENEMENTS-NATIFS.md](CHASER-EVENEMENTS-NATIFS.md). Les points d'attaque/soin, politiques serveur, formule de combat complète et comparaison en vraie partie S5Runtime restent ouverts.

**Mise à jour UI/pose/spawn** : l'utilisateur a ensuite demandé l'UI d'origine globalisée à S5. Le panneau Traque ci-dessous décrit le passage précédent et est désormais remplacé par `native-chaser-ui.js`. Police, chiffres, silhouettes et textures originales sont importés ; détails et limites dans [UI-S5RUNTIME-S5.md](UI-S5RUNTIME-S5.md). La faucheuse joue désormais `MD001` comme boucle de présence S5 plutôt que la pose `base`. Le détenteur du rôle apparaît au centre des collisions à chaque manche, sur un sol praticable.

- **Correction du 17 octobre :** vision réservée au Chaser local vivant, désormais fondée sur les paramètres `SHADERPARAM_S` et la formule HLSL récupérés du client S5Runtime. Contraste/saturation Circle 2 : 0,5/0,5 ; Alice House : 0,2/0,8. La courbe native est cubique, suivie d'une désaturation partielle ; l'ancien gris intégral, contraste linéaire 1,85 et vignette S5 sont retirés. Les ennemis gardent leurs textures et reçoivent la rampe native `image/redshade.dds` selon leur normale et la lumière, sans recoloration uniforme depuis une luminance. Profondeur du décor et restauration des matériaux conservées. Il s'agit d'un port GLSL dans le moteur S5, pas d'une égalité pixel à pixel avec l'éclairage S5Runtime. Source, CRC/SHA et instructions contrôlées : `work/chaser-native-vision/recovery.json` ; livraison et limites : `work/chaser-native-vision/DELIVERY.md`.
- État de cible bonus, renouvellement après élimination et notification du joueur ciblé. **Politique S5 déclarée : survivant vivant ayant le plus haut score, départage stable**. La politique serveur S5Runtime demeure inconnue.
- Barème 2/4, y compris suicide/chute ; catégories de points séparées, détail des gains, récapitulatif de manche et victoires. Récompenses +5/+10 conservées ; aucun bonus inventé pour le dernier coup sur le Chaser.
- Dégâts réellement retirés des HP (sur-dégâts exclus), dégâts reçus, classement des dégâts de manche et total, compteurs d'assists par contributeur vivant. Ce suivi des assists est une politique S5 ; il n'ajoute pas de points non prouvés. Hook `recordHeal` disponible, sans arme de soin nouvellement importée.
- UI S5 originale : panneau Traque, identité de la cible, avertissement personnel, ventilation élimination/bonus/victoire/survie, classement et résultat. Les textes natifs servent à établir l'information nécessaire ; aucun écran natif copié.
- Auras natives ordinaire et bonus importées, avec les huit contrôles d'héritage de l'aura bonus, textures et attaches au personnage affiché. Marqueur géométrique S5 supplémentaire au-dessus de la cible bonus. Effet de présence `ggrim` raccordé. Son ancien TGA étant non décodé, le DDS natif authentifié de même nom est utilisé ; équivalence visuelle à comparer.
- Paramètres Devil adaptés depuis les commentaires du script : attaque `(dégâts S5 + 3) × 4`, dégâts reçus `(dégâts S5 + 2) × 0.1`, récupération `(récupération S5 + 2) × 3`, vitesse ×1.3, rechargement réduit de 40 %. Valeurs locales normalisées, application native non observée : **cela ne certifie pas la formule de combat complète S5Runtime**. Baseline S5 100 HP ; suppression du cumul artificiel 1000 HP / dégâts ×3.
- Modificateurs limités au détenteur du rôle, transférés à la rotation et retirés à la sortie du mode. Le rechargement accéléré ne multiplie ni la simulation entière ni la cadence de tir.
- Sons natifs de rôle, cible, élimination normale/bonus, création longue/courte, compte à rebours et début/prochaine manche raccordés à des événements S5. Buffers partagés avec le contexte audio existant ; volume utilisateur suivi, sources arrêtées à la sortie et au reset.
- Apparition progressive de la faucheuse pendant la préparation, par échelle et opacité : animation S5. **Les clips MD événementiels et les chemins de caméra natifs restent non raccordés**, sans attribution d'un clip par simple ressemblance de durée.

Preuves de cette correction : `tests/chaser-contract.test.mjs`, `chaser-presentation.test.mjs`, `chaser-combat.test.mjs`, `combat-match.test.mjs`, logs `work/chaser-visuals/corrections-tests.log` (140 tests réussis) et `corrections-build.log` (build réussi), captures `corrections-azure.png`, `corrections-target-local.png`, `corrections-bot2.png`, `corrections-classic.png`, `corrections-classic-bot2.png` et scénarios DOM `corrections-azure-checks.json` / `corrections-classic-checks.json`. Sur Azure et classique : monochrome/rouge, cible personnelle, +2/+4, renouvellement et rotations vers les deux bots vérifiés. Les fixtures QA raccourcissent les pauses et déplacent les acteurs ; le scénario « Élimination » utilise l'entrée d'arme et le solveur de contact réels. L'écoute des sons en partie normale reste à vérifier ; le test audio couvre notamment la sortie du mode pendant le chargement asynchrone.

Restent non résolus : formule native des points d'attaque/soin et rang→score/EXP, tirage pondéré du rôle, politique native de cible, clips MD/caméras, effet `ggrim_kill` (NodeLoader non supporté), validation multi-client S5Runtime, variantes de familiers, économie et réseau. Ces éléments ne sont pas annoncés corrigés.

## Périmètre et niveau de preuve

Sources consultées : scripts et XML extraits de la copie locale S5Runtime, fonctions décompilées de `s5runtimegame.exe`, codecs et observations du laboratoire local, puis `src/combat-mode-state.js`, `combat-match.js`, `chaser-combat.js`, `chaser-presentation.js` et `match-ui.js`.

Les noms des fonctions décompilées sont des hypothèses d'analyste : les branches, constantes et appels font preuve, pas le nom donné à une fonction. Les codecs du serveur local et ses politiques ne prouvent pas ceux du serveur S5Runtime original. Les observations mémoire mono-client ne constituent pas une partie native complète.

Extraction reproductible : `python work/chaser-visuals/audit-native.py`. Après fermeture des textures et sons : **89 ressources authentifiées par longueur, CRC et SHA-256**, deux ressources non décodées (`effects/ophelia_all.seq`, `effects/d100_st_boss_fog01.tga`), 110 entrées inventoriées. Manifestes dans `work/chaser-visuals/audit/sources.json` et `resource-index.json`. Préparation runtime : `node work/chaser-visuals/prepare-mode.mjs` ; assets dans `public/assets/s5runtime/chaser`, preuves de séquences et limites dans `mode-manifest.json`.

## Matrice fonctionnelle au moment de l'audit, avant corrections

| Élément | Ce qui est établi dans S5Runtime | État S5 / travail restant |
| --- | --- | --- |
| Vision du Chaser | Monde monochrome contrasté et ennemis rouges décrits par l'utilisateur. Le code précis de rendu n'est pas encore identifié. | Filtre monochrome seulement ; ennemis rouges absents. Ne pas déclarer une visibilité à travers les murs sans preuve. |
| Cible désignée | Compte bonus distinct du compte Chaser dans le briefing ; callback `00ee7150` → `00dda490`, message 3057. | Aucun état de cible bonus. |
| Changement de cible | Callback dédié et annonce sonore `5_target change.ogg` indexée. Mort de la cible bonus déclenche un callback distinct dans `010d8230`. | Aucun renouvellement ni annonce. Politique native de choix et cadence à retrouver. |
| Marqueurs dans le monde | Deux ressources distinctes `slaughter_target_aura.seq` et `slaughter_bonus_target_aura.seq`, authentifiées et parsées. | Aucun des deux marqueurs ; leurs points d'attache et règles de visibilité restent à tracer. |
| Informations de cible | Textes 497–499 : notification personnelle, identité de la cible, cible éliminée. | HUD absent pour ces événements ; créer des composants S5 originaux. |
| Élimination ordinaire | Chaser : **+2 au score personnel**, compteurs dédiés, vecteur de manche reçoit 0 (`010d8230`). | +2 présent ; ventilation et historique par catégorie absents. |
| Élimination bonus | Chaser : **+4 au score personnel**, compteurs distincts, vecteur reçoit 1 (`010d8230`). C'est 4 au total, pas 2+4. | Absente. |
| Suicide/chute | `010d8840` : un poursuivi qui se suicide crédite le Chaser de 2 ou 4 selon la cible ; suicide du Chaser déclenche sa défaite. | +2 et défaite présents ; distinction bonus absente. |
| Élimination du Chaser | La branche du tueur non-Chaser incrémente son compteur d'éliminations sans ajouter de score direct dans `010d8230`, puis déclenche la défaite du Chaser. | Défaite et récompenses présentes ; ne pas inventer un bonus fixe pour le dernier coup. |
| Événement avec assist | Chemin natif dédié `010d84e0` ; mêmes branches 2/4 et mort dans cette fonction. Aucun bonus numérique autonome pour l'assistant établi dans son corps. | Pas de suivi d'assists. Montant et attribution éventuels à établir dans les autres fonctions. |
| Victoire des poursuivis | `010d8c60` : **+5** à chaque membre du groupe initial et **+10 supplémentaires** au groupe survivant. Un survivant appartenant aux deux groupes reçoit donc 15. | Addition +5/+10 présente ; détails et annonces manquent. Appartenance exacte des groupes aux arrivées/départs à vérifier. |
| Victoire du Chaser | `010d8d80` incrémente un compteur de victoire et conserve le total existant. | Fin lorsque tous les poursuivis sont éliminés ; statistiques de victoire absentes. Aucun bonus de score supplémentaire prouvé ici. |
| Points d'attaque | Texte 530 et callback de dégâts `00ee6f60` ; message 3055 transporte deux floats distincts. | Pas de points d'attaque ni d'affichage. Conversion dégâts → points inconnue ; ne pas confondre ces floats avec le score entier. |
| Dégâts infligés/reçus | `010d8df0` cumule le champ dégâts du participant et celui reçu par le Chaser. Observation `chaser-damage-observations.json` : 12,5 dégâts, 100 points injectés, 12,5 reçus. | Pas de statistiques de mode. Cette injection valide le stockage, pas une formule de calcul. |
| Soins | Message 3056, callback `00ee70f0`, accumulation flottante `010d8e90`. | Aucun suivi Chaser des soins ; barème de points à établir. |
| Rang de dégâts | Ressources audio `damage_rank`, `damage_rank_1..3`. `experience_bonus.x7` configure `damageranking_1st_point=5`, deuxième 3, troisième 2. | Classement de dégâts absent. Ces valeurs appartiennent au fichier d'expérience : elles ne prouvent pas à elles seules +5/+3/+2 au score de match. |
| Résumé des points | Textes 528–532 distinguent éliminations, bonus, attaque, victoire, survie ; textes 503–505 annoncent les gains. | Seulement total, kills et morts ; catégories et récapitulatif de manche manquent. |
| Durée de manche | `01094530` : 60 s minimum, +10 s par participant au-delà de six, à partir du groupe natif ; préparation 7 s initiale, 4 s ensuite. | Présente pour les trois participants fixes ; arrivées/départs non implémentés. |
| Mort et reprise | Liste initiale distincte des survivants ; retrait du survivant, callbacks de résultat, reset de manche ; texte 506 attente du respawn. | Pas de respawn durant la manche et reset présents. Observation d'une reprise native complète avec plusieurs vrais clients encore manquante. |
| Tirage du rôle | Texte 487 signale une probabilité réduite après arrivée en cours de partie ; effets d'item `chaser_cast_rate` et `chaser_movespeed`. | Rotation déterministe. Tirage natif, pondération et règle de non-répétition à retrouver. |
| Attributs de combat | Paramètres par entité dans `slaughtertagattribindexer.lua` : attaque, dégâts reçus, récupération MP, rechargement, vitesse, stun et garde Counter Sword. | Preset 1000 HP / dégâts ×3 incomplet ; vitesse, réduction des dégâts, récupération et reload natifs absents. |
| Entité et variantes | Sept tags déclarés : Devil, Pierrot, Alice, Asteroid, Ophelia, Lilit, Fallen ; scènes et effets propres. | Une seule faucheuse. Variantes identifiées, pas une demande d'import immédiat des sept. |
| Animation de transformation | Deux caméras natives par tag, événements de création avec musique longue/courte, durées déclarées. | Caméra fixe reculée, aucune véritable séquence de transformation. |
| Animation de l'entité | Événements séparés : présence, normal, attaque, élimination, victoire, défaite et parfois aléatoires. | Clip `base` en boucle seulement ; MD001–MD009 non raccordés aux événements. |
| Effets de la faucheuse | Script Devil : `ggrim.seq` en présence et `ggrim_kill.seq` à l'élimination. | Effets absents malgré le modèle importé. `ggrim` parsé, `ggrim_kill` rencontre une sous-structure NodeLoader non prise en charge. |
| Audio de partie | Index : changement du Chaser, cible normale/bonus, changement de cible, approche, scores, rang, mort, compte à rebours, début/prochaine manche et BGM. | Audio spécifique non raccordé ; nom de ressource seul insuffisant pour certifier le déclenchement. |
| Interface des résultats | `sequenceobjecthelper.lua` distingue victoire/défaite du Chaser et des innocents, plus deux annonces Chaser. | Annonce générique. Réinventer l'UI S5 en conservant les informations et événements utiles, sans importer les écrans S5Runtime. |
| Récompenses de compte | XML séparés pour EXP et points/PEN ; paramètres Chaser présents. | Aucune économie/persistance ; séparer récompenses de compte et score de match. |
| Réseau/autorité | Messages de rôle, cible, dégâts, soins, briefing et résultats identifiés. | Session locale avec deux bots uniquement ; aucun multijoueur S5. |

## Attributs natifs retrouvés : correction du constat précédent

Source authentifiée : `work/chaser-visuals/audit/source/script/slaughtertagattribindexer.lua`, constantes dans le fichier voisin. Le précédent constat « attributs natifs non établis » était trop général : **les paramètres sont retrouvés ; leurs fonctions d'application et certaines unités restent à tracer**.

| Tag | Modèle | AttackConst | DamageConst | MPRecoveryConst | ReloadTimeConst | MoveSpeedConst | EmuneStunConst | EmuneCounterSwordGuard |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 Devil | grimreaper.scn | 3, 4 | 2, 0.1 | 2, 3 | 0.4 | 1.3 | 0 | 0 |
| 2 Pierrot | card_slaughter.scn | 3, 4 | 2, 0.1 | 2, 3 | 0.5 | 1.2 | 0 | 0 |
| 3 Alice | alice.scn | 3, 4 | 2, 0.1 | 2, 3 | 0.4 | 1.3 | 0 | 0 |
| 4 Asteroid | asteroid.scn | 3, 4 | 2, 0.1 | 2, 3 | 0.4 | 1.3 | 0 | 1 |
| 5 Ophelia | ophelia.scn | 3, 4 | 2, 0.1 | 2, 3 | 0.4 | 1.3 | 0 | 0 |
| 6 Lilit | lilit.scn | 3, 4 | 2, 0.1 | 2, 3 | 0.4 | 1.3 | 0 | 0 |
| 7 Fallen | grimreaper_goth.scn | 3, 4 | 2, 0.1 | 2, 3 | 0.4 | 1.3 | 0 | 0 |

Les setters à deux arguments ne se résument pas à un multiplicateur ×3. Le script comporte des commentaires de formule ; confirmer leur usage dans le code natif avant de les appliquer au moteur S5. Aucun setter de HP n'est déclaré ici : **1000 HP reste un choix S5**, pas une valeur native validée.

Pour Devil : caméra 1, plage 0–6333 ; caméra 2, 0–3300 ; `SetTime(6300,3300,2083)` avec commentaire CreationTime/Creation2Time/SlayTime. Les pistes des caméras et la correspondance MD/événements doivent être lues avant toute revendication de fidélité.

## Ressources inspectées et limites de conversion

`node work/chaser-visuals/audit-sequences.mjs` produit les inspections et `sequence-summary.json` :

- Aura ordinaire : 2 nœuds, durée d'en-tête 4000, texture `effects/aura_03.dds`.
- Aura bonus : 16 nœuds, durée d'en-tête 2000, 8 références de dépendance. Ce n'est pas simplement la même aura recolorée.
- Présence Devil `ggrim` : 4 nœuds, durée d'en-tête 5000, 4 références de dépendance.
- Élimination Devil `ggrim_kill` : extraction authentifiée ; parseur bloqué par une sous-structure NodeLoader non vide à l'offset 141.
- Présence Ophelia `ophelia_all` : entrée retrouvée mais décodage CRC non résolu. Aucune conversion réussie revendiquée.

Les trois parsings réussis atteignent la fin exacte du fichier. **Ni le rendu de ces effets, ni toutes les dépendances, ni les conditions d'attache et de boucle ne sont validés par ce parsing.** Aucun nouvel effet n'est prétendu intégré dans le jeu.

## Points encore inconnus à résoudre explicitement

1. Rendu rouge exact : silhouettes/matériaux, masquage par le décor, portée et interactions avec le filtre monochrome. La demande utilisateur constitue la référence de comportement, pas une récupération du shader natif.
2. Politique serveur de cible bonus : critères, première désignation, changement après élimination, fréquence et arrivée/départ d'un participant.
3. Tirage du rôle et probabilités corrigées par les items ; rotation déterministe S5 ne remplace pas cette règle.
4. Formule des points d'attaque/soin et du rang de dégâts ; attribution des assists hors du corps de `010d84e0`, articulation avec total/EXP/PEN.
5. Application des constantes de combat, HP natifs, résistances, SP/MP, stun et garde ; variantes et éventuelles interactions d'équipement.
6. Mapping des clips MD, attaches, caméras et déclenchements VFX/audio. La boucle `base` ne couvre pas la transformation et les événements de combat.
7. Déclencheur serveur natif du motif 1 de défaite, durée globale et intermission : 20 min et 5 s sont des politiques S5 actuelles.
8. Validation d'une manche complète dans S5Runtime avec plusieurs vrais participants : dégâts, mort, cible renouvelée, scoring, reprise et fin de partie. Les preuves locales portent encore `nativeGameplayVerified:false`.

## Ordre de correction S5

1. Contrat de cible et barème : état bonus, 2/4 points, suicide bonus, changement de cible avec politique explicitement documentée tant que l'originale reste inconnue.
2. Vision rouge, deux marqueurs et HUD original : identité de la cible, notification du joueur ciblé, gains ventilés, dégâts et classements dès que leur calcul est établi.
3. Attributs de combat réellement appliqués, puis transformation, clips événementiels, effets et sons.
4. Vérifier toute la boucle sur Circle 2 Azure et classique avec deux bots : joueur Chaser, chaque bot Chaser, élimination normale/bonus, chute, victoire, timeout, reprise et changement de carte. Garder l'IA directe demandée, sans path planning.

Ce document conserve la base de complétude et les limites natives ; seuls les éléments explicitement listés dans « Corrections réalisées » sont raccordés.
# Résultats — raccordement visuel du 4 octobre 2026

Le tableau utilise désormais les coordonnées, fonds et surbrillance locale natifs : deux blocs de huit lignes, Name/Points/EXP/PEN. Capture S5 : `work/chaser-visuals/result-native-table.png`. Détails et Rejouer vérifiés dans le jeu principal. Les points et leur ordre restent S5 ; le classement natif complet, EXP/PEN, niveaux, indicateurs et transitions ne sont pas certifiés. EXP/PEN sont affichés « — ». Voir [CHASER-EVENEMENTS-NATIFS.md](CHASER-EVENEMENTS-NATIFS.md) pour les sources et limites.

