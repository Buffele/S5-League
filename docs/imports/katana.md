# Fiche d’import — Katana

28 octobre2026 — choix F · Flame ajouté par attaque, couleur réglable et option globale
Keep flames active hors attaque, sauvegardés dans inventaire/Échap/paramètres.
Effets/impacts/audio existants conservés ; ancrages post-mixer, limites et
preuves groupées : `work/weapon-flames-all-20261028/README.md`.

27 octobre2026 — trois directions artistiques propres à cette arme, déclinées
par attaque et sélectionnables dans l'inventaire. Géométries distinctes ;
séquences structurelles, particules d'impact et audio existants conservés.
Mécaniques et gates natifs inchangés. Sources, ancrages et contrôles :
[lot artistique](../../work/melee-art-expansion-20261027/README.md).

25 octobre2026 — le runtime commun protège la propriété des deux instances de
charge mises en cache : une annulation tardive d'un ancien acteur ne coupe plus
une instance réattribuée. Les cues, durées, racines et sons Katana restent inchangés.
47 contrôles groupés et build :
`work/weapon-polish-20261025/effect-pool-lifecycle-batch/README.md`.
Capture principale `katana-charge-main.png`, sans certification native supplémentaire.

25 octobre2026 — route adverse raccordée : Katana ajouté à la sélection
Free training. La préparation attend son rig, ses effets, son audio et le même
adaptateur de traînée que le joueur, compilé avant exposition. Le cache possède
les ressources ; une vue de combat les emprunte et les détache sans destruction
lors de son remplacement. Tests réels M/F : combo trois coups, forte, aérien,
charge/libération, reset et réattache. Première frappe observée sur les deux
personnages dans le jeu principal ; sélection ordinaire Hand Gun→Katana,
attaques infligeant des HP, changement de slot joueur, retour salle et relance
observés sans erreur navigateur. Le retour manuel en salle conserve la session
d'entraînement ; il ne constitue pas un test de destruction de vue.
Preuves : `work/weapon-polish-20261025/katana-opponent-trails/README.md`.
Ce passage supersède seulement la limite de route adverse du paragraphe suivant.
La comparaison native exhaustive et les autres gates restent ouverts.

25 octobre 2026 — traînée classique : remplacement du ruban générique par
`src/katana-trails.js`, scène1/Line01/katana_body et texture slash01 authentifiée.
Les six fenêtres d'action utilisent les délais et durées du script ; profil
commun XML200/50/50/100, SRCALPHA/ONE, buffers et GPU préparés avant publication.
Le repère propre au Katana conserve Shape.matrix : extrémités contrôlées contre
les vrais sommets de lame après mixer, sur M/F, repos, huit directions et coups.
La paire brute du Breaker ne convient pas ici. Initialisation sur la lame,
fade de sortie, annulation, changement de bundle et warmup testés.
Preuves et limites : `work/weapon-polish-20261025/katana-actor-trails/README.md`.
Le passage concerne la route joueur ; la route adverse reste à raccorder au même
adaptateur. Passes natives supplémentaires, états hérités et comparaison
visuelle complète restent ouverts. Aucun statut « arme prête » revendiqué.

25 octobre 2026 — contrôle des commandes ordinaires terminé dans le jeu
principal, sans paramètre QA : clic droit maintenu et charge visible sur les
deux personnages, puis effets au relâchement. Trait écran très clair sur femme,
composition moins isolable sur la capture masculine. Changement effectif vers
Hand Gun après récupération observé sans charge résiduelle ; la demande durant
le maintien reste différée par le gate existant, sans forçage de slot.
Une source audio active et le contexte running sont observés ; aucune écoute
ni comparaison audiovisuelle au Jeu référence revendiquée. Preuves :
work/katana-charge-effects-20261024/ordinary-input/BROWSER-20261025.md.
Les limites du rendu figé mentionnées dans les anciens passages sont donc
supersédées pour ce parcours ordinaire uniquement, pas pour la fidélité globale.

24 octobre 2026 — relâchement secondaire : `katanaa_s_atk02_line01` est
raccordé au rendu écran du joueur local (`AddSequenceBySelf`), avec modèle,
particules, préchargement et compilation GPU lors de la préparation du Katana.
Les effets monde restent séparés ; les adversaires ne déclenchent pas cette
surimpression. Ressources réelles, fenêtres/queues, portes de visibilité,
changements d’arme, remise à zéro et restauration du renderer testés.
74 tests du lot et build passent. Trait écran observé sur homme/femme dans le
scénario principal `qa=katana-secondary&t=1.75`, distinct des effets monde.
Captures : work/katana-screen-effects-20261024/BROWSER-20261024.md.
Preuves : work/katana-screen-effects-20261024/HANDOFF.md
et work/weapon-polish-20261024/final-tests.tap. Comparaison exécutée au Jeu
référence et fidélité intégrale restent ouvertes.

24 octobre 2026 — charge maintenue : les deux instances de katana_charge2
(main gauche et acteur) et le son catalogue sont raccordés à l’entrée de charge,
après le recul. Les deux effets et le son sont supprimés en sortie ou au seuil
strict >1000 ms du timer normal. Aucun effet de pleine charge vide dans le
catalogue n’est inventé. Ressources réelles, rigs M/F, handles multiples, seuil,
annulation et séparation des acteurs vérifiés par tests. Les deux ensembles
lumineux sont visibles sur homme/femme dans le scénario du jeu principal
figé à t=.6 : work/katana-charge-effects-20261024/BROWSER-20261024.md.
Maintien souris ordinaire, écoute du son et comparaison visuelle/audio au
Jeu référence restent à terminer.
Preuve : work/katana-charge-effects-20261024/HANDOFF.md et
tests/katana-charge-lifecycle.test.mjs. Les autres limites restent ouvertes.


4 octobre 2026, charge complète : seuil natif de 900 ms raccordé à la
sélection des contacts au relâchement, distinct du timer de charge 1000 ms.
890/900/910/990/1000 ms, deux sexes, huit caps et switch testés.
Seuil 890/900 ms observé sur les deux corps dans le jeu principal.
160 tests Katana/mêlée, 11 tests du contrat et build réussis.
Preuve : `work/melee-batch-5/katana-full-charge.md`.
Interpolation des dégâts, buffs, conditions SP et calendrier de validation
des demandes par l'acteur restent non certifiés ; gate non prêt.

4 octobre2026, relâchement bref : attente artificielle40ms retirée depuis
la branche native de l'attente debout. Relâchement après0/10/30ms testé
sur vrais rigs M/F×8caps et switch ; cas10ms observé en jeu M/F.
130 régressions,11 tests du contrat et build réussis.
Preuve : `work/melee-batch-5/katana-standing-release.md`.
Seul le délai de cette branche est établi ; SP/éligibilité, full-charge,
phases du composant d'entrée et effets restent ouverts. Gate non prêt.

4 octobre 2026, aérien : KT029/KT033 ajustés aux demandes natives400/450ms,
transition directe en récupération sans40ms ajoutées. Trois activations,
vrais rigs M/F×8caps et switch testés ; quatre observations en jeu.
129 régressions,11 tests du contrat et build réussis.
Preuve : `work/melee-batch-5/katana-air-speed.md`.
Physique globale, reset aérien conditionnel, effets incomplets et phases
ultérieures de charge restent ouverts ; gate non prêt.

4 octobre 2026, attente/récupération : entrée CAttackChargeMovingState
phase5 établie avec demande d'animation0, KT006_2 à vitesse Lua1 ; aucune
durée1000 n'est transposée à cette attente. La libération efface maintenant
la vitesse physique à l'entrée en récupération, une seule fois. 128 tests
ciblés,11 tests du contrat et build réussis ; M/F×8caps et switch couverts.
Preuve : `work/melee-batch-5/katana-standing-recovery.md`.
Les phases ultérieures de charge restent ouvertes ; fitting aérien établi
dans la suite ci-dessus, autres limites physiques conservées.

4 octobre 2026, libération : KT007/KT008 utilisent les demandes natives
700/900ms et l'override KT008=1000ms. Phase supplémentaire S5 de40ms
retirée : le Tick natif passe directement en récupération. Vrais rigs
M/F×8caps, contacts et switch testés ; captures M/F frappe/récupération,
125 régressions ciblées et build réussis.
Preuve : `work/melee-batch-5/katana-release-speed.md`.
Charge, aérien, usage du paramètre40 et reset physique restent ouverts.

4 octobre 2026, suite : recul secondaire KT006_1 raccordé au fitting
CAttackStateEx natif, demande 300 ms, vitesse float32 499/300.
Animation et MoveBox synchronisés ; recul S5 de 3,093 m puis maintien
KT006_2 immobile. Deux personnages observés dans le jeu ; vrais rigs,
huit caps et switch testés. 124 régressions ciblées et build réussis.
Preuve : `work/melee-batch-5/katana-backdash-speed.md`.
Ce résultat remplace l'ancienne hypothèse de lecture du recul à vitesse 1.
Charge/aérien et les autres limites natives restent ouverts ; la suite
ci-dessus établit séparément le fitting de la libération.

4 octobre2026 : les trois coups au sol et la forte utilisent maintenant
les demandes d'animation natives CAttackState. Overrides KT026=1000ms,
KT027=100ms conservés ; animation et déplacement de courbe utilisent la
même vitesse float32. Tests sur vrais rigs M/F×8caps×4états, contacts et
switch ; 123 régressions ciblées et build réussis.
Preuve : `work/melee-batch-5/katana-ground-speed.md`.
Charge/lourde/aérien sont des classes distinctes : fitting à établir,
aucune durée n'a été transposée sans preuve. Import toujours incomplet.

3 octobre 2026. **Intégration expérimentale en cours**, reprise dans le deuxième lot mêlée. Clé katana, touche 9, skin classique conservé à la demande de l’utilisateur. Inventaire : « essais — import incomplet ». Les observations antérieures ci-dessous restent datées ; ce passage ne certifie pas une nouvelle comparaison S5Runtime.
[Guide](../IMPORT-ARMES-GUIDE.md) · [REX](../IMPORT-ARMES-RETOUR-EXPERIENCE.md).

## Reprise combat — 3 octobre 2026

`src/katana-combat-data.js` fournit `katanaAttackContacts(kind,comboIndex,{channel,range,power,additionalPower,fullCharge})`, `KATANA_ABILITY`, les paramètres d’états et les événements d’animation. Le moteur commun consomme les formes BOX en unités source et choisit explicitement la politique d’arène : contacts normaux, supplément zéro, aucune multiplication critique implicite. Le skin, les sockets, les pistes et les horloges déjà corrigés ne sont pas remplacés.

Provenance actuelle : `work/melee-batch-2/katana/extract_sources.py` relit les archives privées en lecture seule. **10 ressources authentifiées par CRC d’archive et SHA-256**, **19 fonctions** conservées dans `source-contract.json`, incluant les bindings `weapon_lua.x7` et le catalogue **XBN weapon.xml**. Item 2000018 : range **500**, power **10**, charge_power_rate **2**, move **1,1**, attack move **1**. Les valeurs XBN correspondent ici au XML historique, mais la preuve du passage est l’archive actuelle. Le taux de charge catalogue n’est pas multiplié automatiquement aux facteurs Lua : le chemin natif de calcul effectif reste ouvert.

NormalState est lu séparément : KT004, blend **500 ticks**, loop true, reset false, vitesse 1. RunState : KT016–KT023 haut, 00008–00015 bas, blend **1000 ticks**, loop true/reset false/vitesse 1. `KATANA_LOCOMOTION` référence les mappings existants de `katana-data.js`, avec correspondance sémantique explicite. Aucune animation de marche n’est déduite des attaques.

| Action / CAttack normaux MELEE | Instants | Facteur Power | Forme native, range 500 | Conditions source |
| --- | --- | --- | --- | --- |
| Light1 / Attack1 | 225 ms | 0,7 | BOX ancre (0,250,0), dimensions (375,300,450) | Push(100,2000,-5000), success actor |
| Light2 / Attack1, Attack2 | 300 / 700 ms | 0,45 / 0,45 | Même BOX | Push(100,2500,-5000), deux objets indépendants |
| Light3 / Attack1 | 350 ms | 0,7 | Même BOX | Blow(3000,2000) |
| Strong / Attack2 | 300 ms | 1,7 | BOX ancre (0,250,-100), dimensions (300,450,600) | Blow(3000,2500), non contrable, guard crush |
| Air / Attack1, Attack2, Attack3 | **200 / 300 / 650 ms** | **0,35 / 0,35 / 0,6** | BOX ancre (0,250,0), dimensions (100,600,500) | Push(50,2000,-5000), identique au deuxième, puis Push(100,2500,-5000) |
| Heavy partiel / Attack3, Attack4 | 250 / 400 ms | 0,7 / 1,2 | BOX ancre (0,250,0), dimensions (500,200,400) | Push+Blow au premier, Blow au second ; SetFullCharge(false) |
| Heavy complet / Attack7, Attack8 | 250 / 400 ms | 0,7 / 1,2 | BOX ancre (0,250,0), dimensions (500,200,500) | Push(150,2500,-5000)+Blow(-1500,4000) aux deux ; SetFullCharge(true), guard crush |
| Backdash / charge | Aucun | Aucun | Aucun contact créé | Recul/maintien uniquement |

Tous les BOX utilisent direction (0,0,-1), ancre face arrière et dimensions complètes. Le déplacement source→monde ×0,006 reste unique dans le moteur commun. L’aérien créait trois CAttack alors que l’ancien runtime n’émettait que le seuil 200 ms ; les trois déclarations sont maintenant disponibles pour le raccordement. `SetMaxAttackCount(1)` et `SetCoolTime(1600)` restent des paramètres natifs à interpréter, pas une justification pour effacer deux créations.

Critiques dépendants conservés comme objets distincts : Light3 Attack2 → Attack1 à350 ms, facteur0,5, BOX(1,50,300) ; Strong Attack1 → Attack2 à300 ms, facteur0,75, BOX(1,50,400) à z=-100 ; Heavy partiel Attack2 → Attack4 à400 ms, facteur0,5, BOX(1,50,300) ; Heavy complet Attack9 → Attack8 à400 ms, facteur0,5, BOX(1,200,400). `AlwaysCritical`/`DependOn` sont sourcés ; leur priorité et multiplicateur final restent non certifiés. Le paramètre `fullCharge` sélectionne un seul ensemble source, donc aucune addition involontaire partiel+complet.

La branche else, commentée UNLIMITED, est aussi livrée et testée : light1/2/3 facteurs0,9 ; forte à400 ms facteur1,8 normal/critique ; aérien0,45/0,45/0,9 ; heavy trois contacts250/350/450 ms facteurs0,9/0,45/0,9 puis critique dépendant à450 ms. Les récupérations/multiplicateurs et le vecteur de chute diffèrent explicitement. Le runtime du lot choisit MELEE.

Quand un objet déclare Push **et** Blow, `conditions[]` conserve les deux appels et leur ordre ; `condition` expose la dernière déclaration pour la politique d’arène, sans prétendre que cette sélection reproduit leur composition native. Le quatrième argument de InitAttack1 contient `(Power × facteur) + AdditionalPower` ; le cinquième est `AddtionalPower`, orthographe distincte dont le binding reste inconnu. La défense et les overrides d’équipement ne sont pas reconstruits.

Effets source : dégâts acteur `katana_damege.seq`, décor `katana_damege_obj.seq`, critique sans séquence propre déclarée. Full-charge utilise `katana_hit_slash.ogg`, absent du dossier runtime vérifié ce passage ; le champ source est conservé sans inventer un son de substitution. La ligne écran secondaire est déclarée par `AddSequenceBySelf` et `SetDamageSequenceTarget`, l’effet/son de charge vient du catalogue ; leur routage natif demeure incomplet. Les tableaux `KATANA_ACTION_EVENTS` gardent séquences, traînées et sons/voix aux instants source, séparément des contacts.

Vérification du passage : **36/36** via `tests/katana-source-data.test.mjs`, `katana-gameplay`, `katana-movement`, `katana-post-mixer`, `katana-material`, `katana-effects` ; journal `work/melee-batch-2/katana/tests.log`. Les neuf nouveaux tests comparent chaque CAttack aux sources actuelles dans les deux canaux, formes, facteurs, ordre, conditions, gating de charge et dépendances ; contrôlent attributs, états, événements, clips M/F et raccordement géométrique. Les régressions existantes confirment huit directions ×3 orientations, recul à vitesse1, maintien/libération, changements et attaches après mixer. Build, intégration de tous les contacts et observations principales de ce deuxième lot sont suivis par l’intégrateur ; aucun nouveau résultat visuel n’est déduit de ces tests.

Statut : **non prêt**. La récupération des sources et le code progressent, aucun seuil d’abandon atteint. Prochaines vérifications : vraie consommation des trois contacts aériens, séparation des deux charges en jeu, préservation main/fourreau et bandes lumineuses, effets/sons manquants puis comparaison des contacts/réactions avec S5Runtime. Continuer la série autorisée ; l’ancien point d’arrêt de septembre ne s’applique plus.

## Sources et raccordements

Historique du 30 septembre : item 2000018, type 39, puissance 10, déplacement 1,1. Sources alors utilisées : _eu_weapon.x7, weapon_attach.x7, NormalState/RunState, actorstates_katana_a_sword.lua, weapon_katana_a_sword.lua, attackattribindexer.lua. Profil CHANNEL_MELEE. La reprise actuelle et ses preuves XBN sont décrites ci-dessus.

Les porteurs SCN homme/femme ont été retrouvés dans l’extraction sauvegardée du 23 septembre : C:/Users/newpc/Documents/Codex/2026-09-23/x20-c-users-newpc-downloads-chrome/outputs/extracteur-s5runtime/S5Runtime-extrait. SHA conformes aux manifestes ; régénération indépendante des pistes directes identique aux bundles actuels après normalisation JSON des zéros signés. Preuve : work/katana-restoration/source-verification.json, outil tools/verify-katana-sources.mjs. Porteurs recopiés dans work/s5runtime-decoder/scn-library/model/character/bip_{male,female}/. L’ancien blocage « SCN bruts absents » est résolu.

Au repos équipé KT004, le fourreau suit **R_Hand_Dummy**, à la main/hanche, et la lame **L_Hand_Dummy**. Spine_Dummy est l’attache du fourreau déséquipé dans le XML ; son relink reste à implémenter. Les pistes natives de scale contrôlent le proxy hideblade. Couches lumineuses additives sans profondeur ni contour opaque : bandes/cadres noirs corrigés, lame solide toujours détourée.

Marche : huit clips supérieurs KT016–KT023, jambes 00008–00015, mapping source/presentation dans src/katana-data.js contrôlé par les courbes des deux sexes.

## Mobilité et actions — corrections utilisateur

| Action | Raccordement et limites |
| --- | --- |
| Premier coup KT000 / KT025 | Déplacement libre, taux 2, MoveBox ×0 ; 350/350 ms, contact 225 ms. Vitesse ajustée historique demandée par l’utilisateur conservée ; elle n’est pas présentée comme la vitesse native 1,0. |
| Deuxième coup KT001 / KT026 | Clavier de déplacement bloqué ; MoveBox ×1 et direction souris conservée. 800/800 ms ; contacts 300 et 700 ms. Clips à 1,0 en action/récupération ; courbe réinitialisée entre phases. |
| Troisième coup KT002 / KT027 | Clavier bloqué, MoveBox ×1, direction souris conservée ; 500/500 ms, contact 350 ms. Aucun déplacement inventé si la phase ne possède pas de courbe. |
| Forte KT009 / KT010 | MoveBox ×1, direction souris, clavier bloqué ; 500/550 ms. Clic gauche maintenu remplace l’esquive latérale au sol/en l’air, dans ses deux phases. |
| Aérienne KT029 / KT033 | SetDrop(1,(0,-1000,-3000)) puis SetDelayDrop(1,(0,-5000,0)) en récupération ; runtime historique400/40/450 ms conservé. Le troisième argument InitLua40 décrit une cadence de scène native, pas une preuve de phase minimale supplémentaire ; identité du state à établir avant correction de cette horloge. Contacts source200/300/650 ms, distincts du délai1 ms. Chute finale verticale sans contrôle clavier jusqu’au sol, même après fin de l’animation, suivant la correction utilisateur. Signal natif exact de sortie cinématique non prouvé. |
| Secondaire | Recul KT006_1 300 ms à vitesse 1,0, maintien KT006_2, libération KT007 / KT008, 700/40/900 ms ; contacts 250/400 ms. Routage expérimental, SP/charge maximale/auto-relâchement/critiques incomplets. |

La gravité globale et les autres armes restent inchangées. Canal de chute Katana nettoyé à l’atterrissage, au changement d’arme ou lors d’une action qui le remplace.

## Effets, audio et combat

Huit séquences actives : trois attaques ordinaires, deux impacts cible/décor, katanaa_s_atk secondaire katanaa_strong forte et katanaa_jump aérienne (partielle). Durées d’événements Lua raccordées. Deux nœuds sans texture explicitement omis. Sons coupe/fin/forte/aérien/secondaire déclenchés par horloge d’action, sans double coupe au contact.

Provenance forte résolue : CRC 9c0e5a85 du flux chiffré conforme à l’archive ; son décodage reproduit exactement le SHA du JSON conservé. L’ancien diagnostic comparait à tort le CRC du flux déchiffré avec celui de l’archive. Modèle fort animé (25 maillages), sept émetteurs et textures raccordés. Limites : katanaa_jump.seq est raccordée : trois émetteurs et deux maillages animés ; quatre maillages spin omis car slash06_1.dds manque dans l’extraction et l’index vérifiés. katana_strong.scn et katana_s_atk_line01.scn sont maintenant authentifiés et stagés avec leurs textures. La ligne secondaire exige un rendu en coordonnées écran (CActNodeLoader_IF / CActParticle_IF, profondeur 1000), pas un émetteur monde. Effet/son de charge et ligne secondaire non actifs. Volumes critiques, ensemble des contacts aériens, cooldown et magnitudes natives des réactions/poussées incomplets. Dégâts/réactions d’entraînement raccordés, sans certification native exhaustive.

## Vérifications et preuves

- tests/katana-movement.test.mjs : deux sexes à 30/60/120 Hz, premier coup mobile, suivants imposés/orientables, combo, vraie entrée MovementInput de maintien pendant les deux phases d’esquive gauche/droite au sol/en l’air, récupération aérienne et absence de déplacement jusqu’au sol.
- tests/katana-gameplay.test.mjs : huit directions à trois orientations, recul/charge/libération, murs, changement d’arme, audio/dégâts.
- tests/katana-post-mixer.test.mjs : 23 clips et fondus via Controller/MotionGraph/AnimationPlayer sur les deux corps ; parents d’équipement, confinement/proximité de la lame visible.
- Tests matériaux/contours/séquences, attaches et régressions des déplacements partagés : **227/227 passent**, build de production réussi. Rapport : work/katana-restoration/regression-output.txt.
- Contrat central actualisé, test passé, gate exécuté dans work/arsenal-integration/native-gate.json : **non prêt**, mesures natives de position et contrats d’effets encore incomplets. Anciennes mesures de dummy mises en historique, pas réutilisées comme preuve de placement.

Captures du jeu principal : work/katana-restoration/*idle-waist-050.png, *secondary-no-black-170.png, *dash-strong-045.png. Scénarios : qa=katana-combo-turn, qa=katana-dash-strong, qa=katana-air-fall, qa=katana-secondary.

**Position exacte par comparaison S5Runtime : non validée.** Les contrôles de parent/proximité détectent des décalages grossiers, mais ne certifient pas tous les angles. La capture S5Runtime du 27 septembre n’avait pas de sonde main/arme exploitable. Prochaine comparaison utile : main, garde et pointe dans les états correspondants des deux jeux.

## Suite et règle de blocage

Après trois tentatives distinctes infructueuses ou 30 minutes sans progrès vérifiable sur un problème, noter dépendance et condition de reprise, puis passer à la suivante. Katana reste accessible même incomplet ; aucune annonce « import prêt » ou « position validée ».


Complément effets : 31 tests ciblés passent et build réussi ; animation/morphing/particules/extinction vérifiés dans tests/katana-effects.test.mjs. Provenance reproductible : tools/stage-katana-extra-effects.mjs et work/s5runtime-decoder/decode_protected_seq.py --key-file.

## Dernière consigne et contrôle visuel des effets

La demande historique de s’arrêter après Katana a été remplacée par le lancement explicite de la série mêlée le 3 octobre. La progression continue sans confirmation entre armes, en gardant le gate non prêt tant que les limites natives persistent.

Effet fort observé dans le jeu principal sur les deux corps, scénario qa=strong&t=.65&qaView=profile : maillage lumineux visible, aucune erreur console. Captures work/katana-restoration/{male,female}-strong-effects-065.png. La forme/échelle/orientation exacte reste à comparer à S5Runtime. Le chemin QA avançait le contrôleur sans appeler les effets de TrainingCombat ; src/main.js avance maintenant ces effets et déclenche le même cue après la pose. Cela corrige le contrôle QA, pas un défaut de déclenchement identifié en jeu normal. 39 tests ciblés (contrat inclus) et build réussis après ce changement.

## Effet aérien — 1er octobre 2026

Le NodeLoader aérien utilise maintenant le moteur de scènes animé partagé. CRC des sources vérifiés par tools/stage-katana-extra-effects.mjs ; alpha/morphing conservés. Événement SwordJumpAtkState_Katana_A_Sword à 0 ms pendant 400 ms, attaches Bip01/acteur provenant de la SEQ. Trois émetteurs et deux maillages slash03 actifs. Les quatre maillages spin ne sont pas remplacés : reprise uniquement si la texture authentique slash06_1.dds est retrouvée. Tests d’animation, de ressources présentes, de valeurs finies et d’extinction ajoutés ; 40 tests ciblés passent, build réussi. Vue QA profile-wide ajoutée pour cadrer les bras levés et les effets sans modifier la caméra de jeu. Comparaison native de position/échelle/suivi toujours en attente.

Observation dans le jeu principal : effets de vent translucides visibles à 0,2 s avec la traînée existante, sur homme et femme, sans erreur console. Captures work/katana-restoration/{male,female}-air-effects-020.png. Gate réexécuté : toujours non prêt ; les mesures de fidélité ne sont pas déduites de cette visibilité.

Raccordement commun lot2 : trois contacts aériens200/300/650ms actifs (3,5/3,5/6 dégâts bruts preset), géométries full/partial charge choisies depuis fullCharge, effets décor/cible distincts. Gate natif SetMaxAttackCount(1) identifié comme limite d’entrée aérienne : compteur acteur+398, incrément une fois, reset physique au sol. Controller conserve cette limite même en changeant d’arme ; tests/katana-air-entry-limit.test.mjs8/8. Branche native spéciale contournant ce gate encore inexpliquée. Preuves work/melee-batch-2/katana/max-attack-count/.

Polishing physique du3octobre : Blow utilise désormais les magnitudes
source, via le moteur commun (dernier gauche18/12, fort18/15, secondaire
-9/21 ou-9/24 selon fullCharge), direction/frottements/réaction encore S5.
La politique de sélection de dernière condition existait déjà : aucune
projection manquante n'est revendiquée sur ce diagnostic. Le consommateur
Push séparé est porté dans src/native-melee-push.js mais reste non raccordé,
facteur du registre3 et acteur+70 à établir. Voir
[push-native.md](../../work/melee-batch-5/push-native.md) :39tests ciblés et
build réussis, gate non prêt conservé.

Polishing des séquences : le helper src/katana-state-effects.js remplace les
durées forcées par les fenêtres des SEQ, arguments Lua sourceEndMs conservés.
L'ancien fort2s coupait la définition2.5s, et le second coup était étiré de1.5s
à3s. Suivi/annulation natifs encore non établis ; line01 en écran reste omis
explicitement. 521régressions ciblées et build passent. Effet fort observé
M/F pendant la frappe, aucune visibilité tardive revendiquée depuis le seul
test de fenêtre. [Preuves et limites](../../work/melee-batch-5/katana-state-effects.md).

## Sons de contact — 4 octobre2026

katana_hit_slash.ogg et burstshotgun_wall_hit.ogg récupérés depuis les archives
actuelles, CRC/longueur/SHA vérifiés. Pleine charge raccordée au son cible
natif, décor à son son dédié ; SetPlaySound(false) respecté sur les contacts
Katana concernés, sans fallback airHit décor.95 tests ciblés/régressions et
build passent. Écoute en jeu et mixage natif non vérifiés ; ligne cible en
écran toujours non rendue. Preuves :
`work/melee-batch-5/katana-contact-sounds.md`.
Le besoin de staging/routage du son à pleine charge mentionné précédemment
est résolu ; l'incertitude concernant la séquence cible reste indépendante.
Nouvelle vérification de l'index actuel : slash06_1.dds toujours absente,
aucune substitution par slash06.dds. Quatre meshes aériens toujours omis.
Gate de fidélité inchangé ; aucune annonce d'import terminé.

25 octobre2026 — poussées simples raccordées au moteur de déplacement source
commun, avec leurs durées/accélérations propres, sans lift arbitraire. Pour
Iron Boots léger2, DamageData0 conserve désormais l’attaque et les clocks
de réaction en cours tout en appliquant le recul. Les contacts mixtes gardent
leur politique antérieure non certifiée. Lot commun498 contrôles et build :
[rapport](../../work/melee-pvp-comparison-20261017/capture-expansion-v2/source-melee-push-batch-20261025/REPORT.md).
Aucune qualification native complète ni nouveau statut prêt.

25 octobre2026 — les trois contacts lourds partiel/complet qui declarent
Push puis Blow conservent maintenant les deux composants independants.
La duree/phases Blow restent la politique precedente non certifiee.
192 controles du lot et build : [rapport](../../work/melee-pvp-comparison-20261017/capture-expansion-v2/katana-mixed-push-batch-20261025/REPORT.md).
