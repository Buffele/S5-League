# Interface S5Runtime dans S5

**18 octobre — points de combat Touchdown :** classification native retrouvée
par5556F0→requêtes2014/2016/2018, crédits2/4/4. S5 les attribue avant le lâcher
du porteur défait et affiche « Recorded points » (objectifs+éliminations), avec
détail attaque/défense. Assists explicitement exclues, total natif complet
non revendiqué. Vrai Play puis QA de récepteur :2,6,4 ; vrai maintien Tab
1280×720/390×844 sans débordement horizontal. HUD personnalisé inchangé.
Contrat, limites et reçu : work/touchdown-combat-points-20261018/COMBAT-RESULT.md.
548tests/66fichiers et build existant passent ; sources surveillées stables.

**18 octobre — lecture compacte du tableau Touchdown :** les deux équipes et
leurs métriques sont visibles ensemble à1280×720 sans geste de souris pendant
Tab. À390px, les quatre colonnes utiles prennent la place des six colonnes qui
incluaient emblème/ping sans données ; aucun débordement horizontal mesuré.
Le style S5 et le HUD personnalisé sont conservés.37tests ciblés et build passent.
Les points de combat/assistance n'ont pas été promus en données vérifiées.

**18 octobre — ramassage et but Touchdown comparés à S5Runtime local :** les valeurs
0→2→12 sont maintenant capturées dans le briefing natif, avec ramassage normal
puis but marqué par l'utilisateur. Le détail S5 « Objective points (pickups +
goals) » raccorde ces contributions. Le score complet de combat/assistance reste
distinct et non validé. Le laboratoire réactive désormais le gestionnaire
d'entrée resté inactif avant l'installation silencieuse ; le mouvement réel en
arrière-plan est mesuré avant/après.533 tests et build passent.

**18 octobre 2026 — statistiques Touchdown de session :** les détails du tableau
S5 affichent les événements mesurés du match : Fumbi, éliminations, morts et HP
de combat. Les points pondérés S5Runtime restent inconnus.529 tests et build passent ;
voir `docs/TOUCHDOWN-TABLEAU-SCORES.md` et `work/touchdown-statistics-20261018/`.

**18 octobre 2026 — nouvelle consigne prioritaire :** le tableau maintenu avec
Tab doit avoir une identité graphique S5, sans reproduction 1:1 de S5Runtime.
La fidélité concerne les règles, les données et le comportement d'ouverture ;
la présentation utilise une composition originale, une typographie système et
des éléments CSS sans bandeaux ni textures S5Runtime. Le HUD personnalisé HP/SP,
compétence, arme et score/chrono reste conservé. Fireball reste retiré.
Cette consigne remplace l'alignement visuel du tableau décrit ci-dessous.

**18octobre2026 — tableau Touchdown comparé en vraie partie S5Runtime :** le maintien
de Tab puis son relâchement sont maintenant capturés dans le client natif.
Le panneau S5 desktop reprend sa disposition haute à deux équipes et ses
bandeaux d'origine. Le contrôle clavier S5 final passe par Lobby→Room→Start,
sans QA de gameplay. La lecture étroite reste sans débordement horizontal.
Les statistiques sans producteur restent inconnues. Notre HUD personnalisé
est conservé.526tests Node,7tests Python et un build passent. Voir
`docs/TOUCHDOWN-TABLEAU-SCORES.md` et `work/native-render-activity-20261018/`.

**18octobre2026 — aperçus du catalogue préparés à l'entrée dans l'écran :**
la visibilité du panneau seul ne déclenche plus les12 aperçus de sa page.
Chaque carte attend son intersection réelle avec la zone visible ; le résumé
de l'arme équipée reste immédiat. Les deux surfaces partagent leur cache.
Défilement, retour, changement de catégorie, invalidation d'une apparence,
résultats tardifs et destruction conservent les contrôles d'équipement réels.
Sans IntersectionObserver, le parcours existant reste disponible. Dans le
navigateur1280×720,8 cartes sont prêtes et4 restent en attente à l'ouverture ;
le défilement prépare ces4 cartes. Ce constat ne mesure pas un gain de temps
ou de trafic compressé. Preuves : `work/inventory-viewport-previews-20261018/`.
Le HUD personnalisé et le retrait de Fireball sont conservés.

**18octobre2026 — boucliers préparés à la demande :** les modèles, textures,
collisions et son de Shield/Powers' Shield ne bloquent plus le démarrage
quand aucune de ces compétences n'est équipée. Le chargeur commun représente
15fichiers,5 406 739octets bruts ; ce chiffre n'est pas une mesure de trafic
réseau compressé/cache ni un facteur d'accélération chronométré. Les deltas
d'animation nécessaires aux rigs et les icônes/catalogue restent séparés.

Le premier équipement confirme la compétence seulement après préparation.
Les sélections concurrentes partagent le chargement ; seule la dernière
intention peut être confirmée. Retrait, échec/retry, verrou de session acquis
entre-temps et fermeture pendant le chargement sont vérifiés. Les ressources
sont réutilisées entre les deux boucliers, sans recréer carte/personnage ni
recharger la page. Un bouclier demandé par URL est toujours préparé avant Ready.
Le HUD personnalisé, les animations et règles expérimentales existantes sont
conservés.354tests ciblés et un build réussissent. Preuves :
`work/main-flow-regression-20261018/` ; ce lot n'annonce aucune nouvelle
fidélité native du bouclier et n'ouvre aucun item supplémentaire.

**Consigne actuelle,18octobre2026 : restaurer et conserver le HUD personnalisé
S5**, explicitement demandé par l'utilisateur : HP/SP, compétence équipée,
arme/munitions, score et chrono. La fidélité à S5Runtime porte sur les règles,
valeurs, interactions et parcours ; elle ne doit plus remplacer cet habillage
choisi par l'interface native. `src/s5-custom-hud.css` restaure la version CSS
conservée dans le build du17octobre, après les feuilles historiques. Les
images d'armes/compétences et les ports de valeurs restent inchangés.
Fireball est retiré du jeu principal : raccourci, réservation de touche,
affichage, effets/chargement et scénario QA dédié. Les anciens modules restent
hors du parcours principal pour conserver l'historique, sans activation clavier.
Les comparaisons et changements natifs ci-dessous sont historiques et ne
remplacent pas cette consigne. Origine de restauration :
`work/hud-custom-restoration/source.json`.

**18 octobre2026 — lisibilité du score Touchdown comparée à S5Runtime :** à
1440×1080, le cadre conserve les299×119px de score.xui. La police du score,
du libellé de période et du chronomètre est agrandie de4/3 dans Touchdown
uniquement. Dans la même zone de capture, le zéro cyan mesure désormais
15×24px contre12×17 avant et15×23 dans S5Runtime ; ce rapprochement visuel ne
constitue pas une identité de rasterisation. La seconde période reste lisible
à390px. Les autres modes conservent leur réglage tant qu'ils ne sont pas
comparés séparément. Preuves : `native-radar/td-hud-{before,after}-1440.png`,
`td-hud-after-390.png` et `td-font-pixel-measurements.json` sous hud-modes.

L'assemblage du radar Touchdown existe maintenant dans
`src/native-radar-touchdown.js` : carte, Fumbi, acteurs, joueur puis cadre,
cache et destruction/chargements tardifs. Il reste hors du parcours principal.
L'API de résolution des ressources réellement utilisées reste à identifier ;
les objets observés sont des composants de lecture et des chaînes par langue,
pas l'arbre de noms précédemment supposé. Aucun résultat « absent » issu de
ce parcours invalide n'est utilisé. Le raccord des acteurs et du viewport
doit également être qualifié. La suite élargie passe264tests, puis le build
réussit dans le répertoire existant, sans copie des assets publics.

**18 octobre2026 — Touchdown sur Station2 Classic :** la carte originale est
maintenant jouable depuis le parcours principal. La demande explicite Classic
n'est plus remplacée par Modular ; les deux choix sont disponibles dans les
réglages de Touchdown, avec Modular conservé par défaut. Le profil Classic
reprend les buts/spawns des vrais nœuds SCN et normalise les lasers en unités
du jeu, sans modifier les géométries rendues. Le Fumbi déjà importé est raccordé
à la session.242 tests et un build réussissent dans le répertoire existant.

Dans le navigateur : salle/Start féminin Alpha, retour salle et deuxième
démarrage ; puis scénario de contrôle masculin Beta avec pickup, but, remise
en jeu, seconde période, lasers allié/adverse et réapparition. Les résultats
affichent le décompte15s puis reviennent automatiquement à la même salle.
Les commandes QA arrangent les positions/horloges : ce n'est pas une partie
native complète ni une validation du multijoueur. Le passage Classic→Modular
→Classic réutilise le cache et conserve l'équipement. Preuves :
`hud-modes/native-radar/classic-touchdown-browser-20261018.json` et
`classic-touchdown-receipt-20261018.json` dans la livraison principale.

Le port radar comprend désormais le vrai sprite star du Fumbi et le gate
d'identité64/position courante. Le radar complet reste hors du jeu principal :
la structure VFS active ne correspond pas au contenant statique attendu et
la lecture est refusée. Aucun aliasTGA→PNG n'est inventé. Une observation native
du Fumbi au repos constate aussi une position physique distincte du spawnSCN ;
sa physique complète reste à comparer, sans correction verticale arbitraire.

**18 octobre2026 — reprise de la mini-carte native :** capture réelle de
Touchdown sur Station2 et lecture des six textures effectivement sélectionnées
dans le client. La factory d'activation, le chemin UI, l'exclusion par groupes
et le changement d'image entre périodes sont maintenant qualifiés. Le renderer
de carte ne peut plus être réactivé après destruction et libère ses ressources
une seule fois.48tests et build réussis. **Le radar n'est pas encore activé dans
le jeu principal** : restent les raccordements des couches de mode, dont le
Fumbi, et l'identité du contenu derrière les nomsTGA de carte. Contrat actuel :
`work/s5-main-delivery-20261017/hud-modes/RADAR-CONTRACT.md`.

**18 octobre2026 — classement de fin accessible au clavier :** Tab permet
d'atteindre la liste quand elle déborde ; End/Home et les flèches la font
défiler, tout en gardant le focus dans le dialogue. Un nouveau résultat remet
la liste en haut ; le décompte du résultat courant conserve son défilement.
Le vrai parcours salle/Start/résultat/retour automatique est observé avec une
fixture explicite de16lignes, à390px et sur desktop. Les scènes et décorations
originales, scores enregistrés et délai de15secondes sont conservés. La fixture
ne certifie pas une capacité native de16joueurs. Preuves :
`work/s5-main-delivery-20261017/hud-modes/ROOM-RESULTS-KEYBOARD-BROWSER.json`.

**État vérifié,17 octobre2026 :** le lobby conserve l'identité S5 et réutilise
les boutons natifs récupérés. L'inventaire dispose d'un aperçu du personnage,
de trois slots sous cet aperçu, du catalogue par catégories, d'une recherche
par nom et des icônes natives authentifiées d'armes et de compétences. Les
disponibilités expérimentales restent explicites. Le HUD commun et les cadres
de modes sont possédés par leurs composants ; `s5-minimal-hud.css` conserve les
compléments S5 sans recouvrir leurs cadres, chiffres ou jauges natives. Le radar
générique de collisions est désormais un diagnostic facultatif désactivé par
défaut ; il ne remplace pas le radar natif encore à raccorder. Les étapes du
16 octobre ci-dessous décrivent l'historique de l'habillage.

Le parcours normal passe par la salle d'attente3D, Start, la partie et un écran
de meilleurs scores de15 secondes avant retour automatique à la même salle.
Les scènes natives de victoire/défaite jouent cinq secondes puis conservent
leur dernière pose ; un résultat nul n'emprunte pas une victoire. Les preuves
actuelles et limites visuelles sont regroupées dans
`work/s5-main-delivery-20261017/PRIMARY-STATUS.md`. La présence des ressources et
ces contrôles du parcours ne certifient ni toutes les règles natives ni la
fidélité de tous les modes.

**17 octobre 2026 — sons du Start de salle :** l'identité exacte du bouton
déjà affiché (`start_blue_Button`) raccorde désormais les sons natifs de survol
et relâchement via le contexte audio et le volume SFX existants. Un aller-retour
salle/partie vérifie la lecture WebAudio et le cache au deuxième Start, sans
navigation. 184 tests et build passent. Ce son n'annonce pas l'acceptation du
démarrage et ne certifie pas la logique réseau native. Preuves :
`work/waiting-room-20261017/START-AUDIO-DELIVERY.md`.

**17 octobre 2026 — saut visible dans la salle :** le personnage ne conserve
plus sa pose d'attente pendant un saut physique. Le graphe commun raccorde
vol et réception, puis revient aux poses sans arme existantes au sol. Rigs
masculin/féminin et compilation observés, 107 tests passent ; la physique est
inchangée. L'éligibilité et la sélection de ces actions dans la salle S5Runtime
restent non comparées. Preuves :
`work/waiting-room-20261017/JUMP-DELIVERY.md`.

**17 octobre 2026 — effets d'armes à la demande :** le démarrage ne prépare
plus les dix familles d'effets distants pour une Dagger seule. Le premier
équipement prépare ses effets avant validation ; les retours et les apparences
partagent le même cache par famille. Inventaire féminin Dagger → Hand Gun →
Dagger → Hand Gun sans navigation ni nouvelle requête FX au retour, puis tir
réel ; Cannonade masculin vérifié sur la compilation finale. 503 tests passent.
Les effets partagés de mêlée restent préparés au démarrage ; aucun facteur ×10
ni nouveau comportement natif n'est certifié. Preuves et limites :
`work/inventory-weapon-switch-20261017/EFFECTS-DELIVERY.md`.

**17 octobre 2026 — Siege sur Iron Heart :** la carte originale est sélectionnable
dans le jeu principal, avec ses trois objectifs mesurés dans S5Runtime. Le raccordement
corrige aussi la numérotation du HUD : les `seize_slot` source sont3/1/2 pour
les Box01/02/03 ; afficher l'ordre du gestionnaire numérotait une capture3 comme1.
Le HUD reçoit maintenant ses slots1/2/3. Le build est observé sur les deux
personnages : point3 capturé par Alpha et point2 par Beta,5points et bonne
icône, puis retour salle/redémarrage/respawn.316tests passent. Les limites
de shader et de règles natives demeurent explicites dans
`work/ironheart-main-integration-20261017/DELIVERY.md`.

**17 octobre 2026 — caméra de salle contre les murs :** reculer jusqu'à la
paroi opposée plaçait la caméra derrière le décor et masquait le personnage.
La caméra utilise maintenant le segment de collision de la salle pour
limiter son recul. Le cadrage remonte en vue rapprochée pour éviter le torse,
avec un contrôle du plafond ; la composition libre revient dès qu'on s'éloigne.
Le maintien du clic droit et les menus gardent leurs branchements. Le build
principal est observé sur les deux personnages, avec démarrage et retour à
la salle sur le personnage féminin ; 157 tests ciblés passent. Cette politique
de caméra est S5, sans nouvelle certification du balayage natif de standby.
Preuves : `work/camera-obstruction-20261017/ROOM-DELIVERY.md`.

**17 octobre 2026 — vision Chaser récupérée :** le rendu ne force plus tout le décor en noir et blanc. La formule cubique de contraste et la saturation partielle viennent du shader embarqué S5Runtime ; les valeurs sont celles des sections `SHADERPARAM_S` authentifiées de Circle 2 et Alice House. Les ennemis utilisent les couleurs de leurs textures avec la rampe native `redshade.dds` (256 × 1), suivant la normale et la position de lumière du profil de map. Le filtre gris/rouge uniforme et la vignette approximative sont remplacés dans les deux présentations du jeu. Voir `work/chaser-native-vision/DELIVERY.md` pour les preuves et la distinction entre paramètres natifs récupérés et rendu S5.

**17 octobre 2026 — préparation après défaite et participants :** l’inventaire de la salle peut désormais préparer une autre arme même si le personnage du match terminé est éliminé ou conserve une action figée. Le résultat, les HP et les scores restent inchangés ; les verrous en partie restent actifs. Le Rival réel des modes à adversaire unique apparaît aussi dans la salle. Vérifications : 233 régressions réussies, trois contrôles supplémentaires du roster, 18 cas de résultat sur six modes au niveau du consommateur principal, et parcours du navigateur intégré avec changement d’arme puis tir réel. Les preuves et limites de ces périmètres distincts sont dans `work/waiting-room-20261017/CONTINUATION.md`.

**17 octobre 2026 — cible Chaser sur l'adversaire :** l'animation native `bs_bonus_target` est désormais projetée sur le torse animé de la cible vivante, avec compensation du cadrage du HUD. Elle n'apparaît plus à une position fixe de l'écran. Le marqueur de chasse exclut le joueur local et le Chaser ; le score cible reste celui du meilleur survivant vivant hors Chaser. L'ancien carré noir était l'atlas `bs-bonus.png` affiché entier en fond DOM : ce fond est supprimé, les UV de la scène animée conservent leur découpage. L'anneau de remplacement en 3D est retiré pour éviter les doubles marqueurs. Preuves : `work/chaser-target-fix/DELIVERY.md`.

**17 octobre 2026 — cycle de salle corrigé selon S5Runtime :** une salle d’attente 3D utilise les géométries et textures du standby natif. Le personnage peut s’y déplacer ; la souris reste libre pour les menus et l’inventaire, et la caméra ne tourne qu’au maintien clic droit. Start lance explicitement la partie. À sa conclusion, un écran des meilleurs scores reste 15 secondes puis retourne automatiquement à la même salle, sans validation ni Play again. La partie suivante ne se réinitialise que sur Start. Un cycle Captain naturel et des cycles par commandes normales sont observés ; 160 tests ciblés passent et le build est vérifié. Ce raccordement local ne certifie ni le multijoueur réseau, ni la caméra/animation native complète, ni tous les modes de bout en bout. Preuves et limites : `work/waiting-room-20261017/DELIVERY.md`.

**17 octobre 2026 — menu Échap, consigne clarifiée :** l'utilisateur précise qu'il veut voir la vraie partie derrière le menu. Toute image de remplacement est donc retirée du menu actif ; le canvas reste visible sous un voile bleu nuit translucide à 46 %. Une nouvelle maquette imagegen (`work/escape-menu-redesign/imagegen-compact-v2.png`) guide le rendu : logo S5 et exactement deux boutons biseautés, bords métalliques fins, slash cyan détaché et police condensée italique. Groupe centré de 310 px, sans panneau extérieur, titre ni indication clavier. Le rendu et les survols/focus sont en CSS sur les vrais boutons ; les actions et la simulation gardent leurs branchements. Prompt/provenance : `work/escape-menu-redesign/imagegen-compact-v2.manifest.json`. Les anciens aperçus opaques sont archivés et ne décrivent plus le rendu courant.

**17 octobre 2026 — clic à vide :** l'utilisateur demande désormais la recharge automatique sur tentative de tir avec chargeur vide et réserve disponible (finie ou infinie). `src/empty-magazine-reload.js` demande la recharge existante via le contrôleur commun et retient le clic reçu pendant la récupération du tir. Il ne remplit pas lui-même les munitions et conserve les durées de chaque adaptateur, dont la recharge progressive Cannonade. Air Gun et Cannonade ont un remplissage sans compteur de réserve séparé ; cette autorisation est explicite et n'est pas déduite d'une réserve inconnue. Le tir secondaire du Rocket Launcher est couvert ; les zooms et actions de mêlée secondaires ne déclenchent pas une recharge. C'est une règle S5 demandée ici, pas une nouvelle revendication de fidélité native.

**17 octobre 2026 — HUD dessiné et animé par le jeu :** à la demande de l'utilisateur, les PNG générés des cadres, jauges, témoins et réticule ne sont plus chargés par le HUD actif. `src/s5-minimal-hud.css` dessine ces éléments en CSS ; `src/s5-hud-feedback.js` pilote les traînées HP/SP, les retours de tir/recharge, les changements de score et l'urgence du chrono depuis les données et libellés réels. Les icônes d'équipement conservent leurs images d'origine. Les anciennes images restent archivées pour référence. Les animations respectent la préférence de réduction des mouvements et sont annulées au nettoyage du HUD.

**Consigne actuelle, 16 octobre 2026 :** l'utilisateur a choisi puis autorisé l'intégration du HUD S5 épuré modulaire généré dans ce chat. Cette consigne remplace l'exigence historique ci-dessous d'employer uniquement l'habillage S4 en partie. `src/s5-minimal-hud.css` est chargé après les styles historiques ; ses PNG sont conservés dans `public/assets/s5/hud-minimal/`. Les données HP/SP, score, chrono, phases et munitions gardent leurs branchements existants. Les icônes d'armes et de skills restent les ressources originales correspondant à l'équipement réel. Aucune icône HP +30 n'est affichée si ce skill n'est pas équipé. Le radar ajouté est une projection locale S5 des collisions, nord fixe, portée 64 unités ; il ne prétend pas reproduire le radar natif ni afficher des ennemis. Les paragraphs suivants décrivent les étapes historiques.

**État courant, 16 octobre 2026 :** la dernière consigne humaine exige les vrais assets S4 League pour l’UI **en partie de tous les modes**, actuels et futurs. Le chargement, le lobby et la préparation conservent l’identité S5 League anglaise. Une première intégration commune est livrée dans `src/s4-ingame-hud.css`, `src/s4-team-mode-ui.css`, `src/s4-secondary-mode-ui.css`, les interfaces de modes et `src/s5runtime-crosshair.js`. Les polices Netsphimere/2002 sont utilisées selon les ressources concernées, sans police 2002 globale pour les menus.

Voir [objectif commun](../work/parallel-coordination/objective.md) et [dernière livraison vérifiée](../work/s5-interface/s4-ui-polish/DELIVERY.md) pour les preuves et limites actuelles. Les paragraphes du 3 octobre ci-dessous décrivent la récupération historique ; ils ne prouvent pas que tous les layouts ou animations natifs soient aujourd’hui reproduits. Practice reste partiel et sa santé non raccordée affiche « — ».

Le lot de polish du 16 octobre ajoute les ressources authentifiées d’équipement et de santé adverse, les notifications mesurées et les tableaux/scènes de modes. Validation : 1210 tests, build réussi et observations du jeu principal sur écran standard et mobile. Les compositions natives incomplètes et les comparaisons S5Runtime restent explicitement ouvertes dans le rapport.

## HUD modulaire validé le16 octobre2026

L'utilisateur a ensuite explicitement demandé d'utiliser le nouveau HUD modulaire
présenté dans la conversation `01a14695-59fb-71d3-a479-db6e0ae2e835`, avec ses
jauges HP/SP, score, timer et munitions reliés au jeu. Cette préférence récente
s'applique à l'habillage du HUD en partie ; les ressources et tableaux natifs
déjà intégrés restent utilisés par leurs composants.

Le17 octobre, l'intégration des modes corrige la priorité des anciens styles,
le positionnement des deux compteurs Battle Royal et le chevauchement de la
mini-carte sur320px. Les détails Captain passent dans Tab et la manche courante
reste dans le HUD. Six modes ouverts normalement, tirs/rechargement/SP/dégâts
observés,57 tests actuels et build réussi. Preuves et limites :
`work/hud-mode-integration-20261017/DELIVERY.md` et `runtime-receipt.json`.
Ce choix graphique validé ne constitue pas une certification des mécaniques natives.

3 octobre 2026. Demande historique : importer l'interface d'origine et appliquer les ressources communes à tout S5, au-delà du Chaser. Cette demande remplaçait alors la consigne précédente de réinventer l'UI ; la préférence HUD plus récente ci-dessus est conservée.

## Sources importées

`work/chaser-visuals/ui-source/sources.json` contient les CRC, tailles, archives et SHA-256 des fichiers extraits. Chaque extraction vérifie le CRC complet ; aucune ressource candidate non authentifiée n'est publiée. Les scripts `extract-ui.py`, `prepare-ui.py` et `prepare-global-ui.py` sont reproductibles depuis la copie privée S5Runtime.

- `gui/new/maingame_ingame.xui` : groupe Chaser `GroupBox_bsmode`, rectangles 1024×768, trois chiffres du chronomètre, scores verts/blancs, silhouettes ordinaires/bonus et fond de jauge.
- `gui/new/score_board_ingame.xui` : intitulés et textures du classement Chaser.
- `gui/2002.ttf` : police native extraite et authentifiée, utilisée globalement.
- `xui2/layout/ingame/hud/metabolism.xui`, `equipment.xui`, `score.xui` : ressources du HUD commun ; textures HP/SP héritées, fond d'équipement et compteur Alpha/Beta.
- `xui2/layout/ingame/escape/buttons.xui` et sprites associés : boutons natifs, survols et fond de panneaux utilisés par les menus S5.
- `uieffect/_eu_inter_bs_chaser_1.tga` et `_eu_inter_bs_chaser_2.dds` : annonces « You are the chaser!! » et « WARNING!! » ; `win_source.dds` / `defeat_source.dds` : glyphes de résultat découpés dans leurs atlas natifs.

Les textures sont converties en PNG sans redessin. `public/assets/s5runtime/chaser/ui/layout.json` conserve noms, rectangles, parents, couleurs et découpes ; `public/assets/s5runtime/ui/manifest.json` décrit les ressources communes publiées.

## Raccordement

`src/native-ui.css` s'applique à l'entraînement, Deathmatch, Touchdown et Chaser : HUD HP/SP, équipement/sélection, compteurs, annonces/résultats, classement et menus. Le contenu et la navigation de préparation, réglages et inventaire demeurent ceux de S5 ; leur habillage emploie les ressources natives. Ce n'est pas une copie du lobby réseau S5Runtime.

`src/native-chaser-ui.js` remplace le panneau Traque réinventé. Les chiffres et silhouettes utilisent les découpes originales ; cible, score, dégâts, classement, récompenses et rejeu sont liés à l'état de match existant. L'interface de référence 1024×768 est ajustée uniformément à la fenêtre. Certains blocs sont repositionnés pour le format de S5. La jauge native affiche ici les HP réels du Chaser avec un libellé explicite, car le seuil natif « Win score » et sa conversion dégâts→points restent inconnus.

Limites de fidélité : quatre scènes animées d'interface `.scn` sont désormais exécutées par le moteur de rendu (voir le passage suivant) ; les autres transitions, dispositions et contrôles de configuration restent adaptés à S5. Le lobby natif n'est pas annoncé reproduit. `uieffect/result_bs_01.tga` n'a pas pu être authentifié/décodé et n'est pas utilisé. Les modes supplémentaires, l'économie et les commandes de serveur absentes de S5 ne sont pas créés par cet import visuel.

## Chaser animé et spawn central

Mise à jour du goal du 3 octobre : les animations événementielles, `ggrim_kill`, la défaite animée du HUD, +5/+15 et les scènes de résultats détaillés sont maintenant raccordés. Les limites de clips MD et de scènes protégées décrites plus bas sont historiques. État courant et preuves : [CHASER-EVENEMENTS-NATIFS.md](CHASER-EVENEMENTS-NATIFS.md).

L'ancien clip `base` ne comportait des mouvements que sur sept canaux et laissait les bras en pose de référence. Le clip natif `MD001` anime le corps entier ; S5 l'utilise explicitement comme boucle de présence, évaluée immédiatement puis chaque frame visible. Son association exacte à un événement S5Runtime demeure non certifiée. Les autres événements MD/caméras restent dans le contrat Chaser.

`src/chaser-spawn.js` projette le centre des collisions sur un sol orienté vers le haut, à partir du niveau de jeu. Cela évite les dessous de plafonds et les ponts au-dessus de la cour Azure. Une vérification de dégagement vertical et latéral contourne les obstacles centraux : Azure utilise `(1, 0.52, 0)`, juste à côté du phare, au lieu de faire apparaître le personnage dans celui-ci. Le détenteur local ou bot reçoit cette position à chaque préparation/rotation. Les poursuivis gardent leurs points de départ. Le cas d'arène sans `world.spawn` utilise la position initiale du contrôleur pour les homes des bots, afin d'éviter des coordonnées NaN. La racine de l'animation de la faucheuse reste stationnaire pour que les gestes ne déplacent pas son attachement.

## Vérifications

Tests : `tests/chaser-spawn.test.mjs`, `chaser-presentation.test.mjs`, `chaser-combat.test.mjs`, régressions des modes et du contrôleur ; logs `work/chaser-visuals/ui-tests.log` et `ui-build.log`. Le test d'animation mesure un changement réel de quaternion du bras dans la présentation affichée. Les tests de spawn utilisent les collisions Azure et Circle 2 classique, et couvrent les rotations locales/bots ainsi que l'arène sans spawn déclaré.

Les scénarios navigateur et captures de ce passage sont conservés sous `work/chaser-visuals/ui-*`. Les fixtures QA peuvent raccourcir les phases et déplacer les acteurs ; les contrôles « Spawn central » préservent la position de préparation du Chaser. Résultat final : 146/146 tests, build réussi. Azure : spawn local et rotations vers Bot 1/Bot 2 observés au point dégagé ; vision rouge, HUD natif et faucheuse animée observés. Deathmatch : HUD commun, résultat et rejeu contrôlés dans le jeu principal.

Circle 2 classique : spawn initial et rotations locales/bots enregistrés dans ui-classic-spawn-checks.json, faucheuse et vision observées dans ui-classic.png. HUD Touchdown et menus Réglages/Inventaire contrôlés, captures ui-touchdown.png, ui-menu-settings.png et ui-menu-inventory.png. Les contrastes des cartes de réglage ont été corrigés après inspection.

## Ajustements demandés après la première intégration

La faucheuse est placée à `(-0.35, 0.12, 1.25)` dans le repère de l'avatar : son +Z local est derrière le personnage, qui regarde vers -Z. Ce décalage S5 suit la rotation du porteur, sans modifier les données natives. Le cadrage et le FOV restent ceux du mode normal. Une vignette assombrit progressivement les coins jusqu'à 32 %, en conservant la vision contrastée et les ennemis rouges.

Après une victoire par élimination de tous les poursuivis, le Chaser conserve son entité, sa vision et le déplacement pendant les cinq secondes d'intermission. Marcher, sauter, sprinter et esquiver passent par le contrôleur normal. Les attaques en cours sont annulées et le score reste fermé. La préparation du prochain Chaser reprend son verrouillage habituel.

Les lignes ajoutées « Cible bonus », « Survivors win », rangs/dégâts permanents et résumé textuel de manche sont retirées. Le HUD garde les noms, glyphes originaux, chiffres, classement et commandes utiles. Les gains s'affichent en glyphes natifs animés. Le cadre de boule de feu est retiré globalement, son état reste lisible.

`prepare-hud-effects.mjs` publie quatre scènes SCN authentifiées : annonces `inter_bs_chaser_1` / `inter_bs_chaser_2` (4 s), cible `bs_bonus_target` (15 couches, 1.3 s), fond de victoire `win` (3 s). Transformations, alpha, morphs et UV sont évalués par `effect-scene.js`, avec le renderer existant et une projection HUD indépendante : aucun changement de FOV de jeu ni contexte WebGL supplémentaire. Les textures anglaises authentifiées remplacent les références d'édition `_rc_` des annonces. Placement dans le HUD et associations aux événements : adaptations S5 explicites. Le mot WIN provient de l'atlas natif déjà importé. Les éclats des chiffres/gains, annonces communes et glyphes de résultat utilisent des transitions CSS S5, sans prétendre récupérer leur chronologie native complète.

Limites précises : `lose.scn` et `score_+5/score_+15.scn` possèdent encore une couche protégée `0xCC01` ; les scènes de résultat fragmentées dépendent de `result_01.tga` et `result_03.tga`, non authentifiés. Elles ne sont pas publiées. On ne substitue pas un gain natif +5 à une élimination qui rapporte +2/+4 dans le contrat courant.

Validation : `refinements-tests.log` (151 tests), `refinements-build.log`, test de mouvement après deux contacts létaux, pose arrière sous rotation, restauration du renderer et évolution des pistes HUD natives. Les captures/scénarios `refinements-*` couvrent la victoire et le déplacement en intermission dans le jeu principal.

Démarrage à froid : correction d'une régression du clonage des effets partagés, apparue pendant les validations. Une traversée de la hiérarchie clonée inversait l'ordre source de modèles homonymes dans sigma_power_att ; la résolution du parent pouvait donc créer une boucle. Les clones conservent désormais l'ordre sourceModelIndex. Test sur le fichier natif, chargement complet de loadCombatEffects et suite élargie : 151/151 tests, build réussi.

## Captain : comparaison du panneau score/temps — 18 octobre 2026

Une copie S5Runtime neuve a accepté Captain10 sur Old Moon131. Les captures de
fenêtre Windows étaient noires ; la méthode originale de capture du moteur
a livré des images1440×1080 avec scène, couronne, HUD et horloge visibles.
La salle de référence n'avait qu'un joueur : les PV équilibrés, le combat,
les annonces WIN/LOSE et une manche complète ne sont pas validés par ce passage.

La comparaison au même format a révélé le panneau S5 trop grand et trop haut.
`src/captain-hud.css` applique maintenant le cadre598×238 du score.xui, sur
le canevas2880×2160 à66 unités du haut : dans les deux captures, le cadre
mesure299×119 ày33. Scores cyan/rose, polices source et libellés correspondent
à cette présentation ; les noms d'équipes et limites restent accessibles
sans ajouter de texte visible au cadre. La barre source272×4 suit le temps
restant de la manche et se réinitialise avec elle. La conversion typographique
4/3 est un ajustement navigateur mesuré sur les glyphes capturés, pas une
preuve du moteur de polices natif. Le redimensionnement sur d'autres formats
et l'agrandissement mobile restent des adaptations S5.

Le jeu principal a été démarré par Enter room/Start ; contrôles1440×1080 et
390×844, sans débordement horizontal ni message console capturé.134 tests
passent et un seul build a réussi dans le build-release existant, sans copie
du public ni effacement de répertoire. Captures, mesures et reçus :
`work/s5-main-delivery-20261017/hud-modes/captain-native-*20261018.*`.
La fidélité globale de Captain et les déclenchements natifs WIN/LOSE restent
ouverts. Aucune autre conversation n'a reçu de message.

Le même18 octobre, une transition serveur explicitement contrôlée a livré
seize captures du moteur natif : WIN apparaît sur les images de0,5/1,5s,
disparaît sur celle de2,1s, et le décompte5→1 occupe la voie supérieure.
Ces instants sont des fenêtres de requête/retour de capture, pas des temps
de frame exacts. La fixture ne simule ni dégâts ni PV natifs. L'essai LOSE
avec équipe gagnante vide n'a produit aucun bandeau : le consommateur3067
exige un membre gagnant admissible avant d'émettre65(victoire locale) ou
66(autre équipe). La défaite visuelle reste donc à comparer avec des
participants adverses présents.

Les cinq ressources originales `inter_count_1..5` sont maintenant raccordées
au rendu principal Captain. Leurs fenêtres IF durent1s et leurs pistes COUNT
4s sont évaluées uniquement dans cette fenêtre ; géométrie, UV, position et
échelle animée restent celles de la source. Le PNG natif1536×768 nommé
`_eu_interface_effect.dds` dans l'archive est copié sans changement d'octets.
Le mécanisme régional conditionnel et une lecture stable du manager du client
sélectionné confirment regionIndex1/`eu` avant sa publication. L'ancien index
d'archives avait des offsets périmés : la récupération utilise un index ciblé
rafraîchi sur la copie actuellement exécutée.

L'intermission S5 sélectionne les chiffres avec son temps restant. Ils restent
visibles après l'expiration de WIN, et le prochain numéro de manche apparaît
dès le début de la pause. La carte textuelle de remplacement reste accessible
aux lecteurs d'écran et visible si l'effet n'est pas disponible. Autres durées
de pause, countdown de résultat et triggers non établis ne reçoivent pas de
chiffres inventés. Revue indépendante du cycle réel CaptainState, projection,
textures et nettoyage ;170 tests passent, un build dans le répertoire existant.
Preuves : `captain-countdown-source/`, `captain-native-win-series-20261018/`,
`captain-native-lose-series-20261018/`, `captain-countdown-receipt-20261018.json`
dans le même dossier hud-modes. La reproduction complète du jeu reste ouverte.

Vérification navigateur terminée : les cinq chiffres s'affichent dans le rendu
principal à 1440×1080, avec leurs pistes évaluées à mi-seconde. Le décompte
reste visible après WIN, puis disparaît lors du retour à `playing` sans ajouter
une manche au compteur. À 390×844, aucun débordement horizontal ; capture
enregistrée après stabilisation du redimensionnement et masquage des commandes
QA. Aucune erreur console sur le nouvel onglet. Le temps a été avancé par le
bouton QA existant, sans injection d'état. Preuves supplémentaires :
`captain-countdown-browser-20261018.json`, `captain-countdown-s5-after-20261018.png`
et `captain-countdown-s5-mobile-clean-20261018.png`. L'onglet de test a été fermé
et le viewport temporaire réinitialisé ; l'onglet de l'utilisateur est conservé.
