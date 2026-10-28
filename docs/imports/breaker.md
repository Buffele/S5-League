# Breaker — lot mêlée 2, 3 octobre 2026

28 octobre2026 — choix F · Flame ajouté par attaque, couleur réglable et option globale
Keep flames active hors attaque, sauvegardés dans inventaire/Échap/paramètres.
Effets/impacts/audio existants conservés ; ancrages post-mixer, limites et
preuves groupées : `work/weapon-flames-all-20261028/README.md`.

27 octobre2026 — trois directions artistiques propres à cette arme, déclinées
par attaque et sélectionnables dans l'inventaire. Géométries distinctes ;
séquences structurelles, particules d'impact et audio existants conservés.
Mécaniques et gates natifs inchangés. Sources, ancrages et contrôles :
[lot artistique](../../work/melee-art-expansion-20261027/README.md).

26 octobre 2026 — bibliothèque décodée : scènes eff_bat_jumpattack/hm_jump
identiques aux sources validées, scripts identiques hors fins de ligne.
Préparateur des pistes raccordé à cette source optionnelle, résultat public
reproduit à l'octet près. `skill_bat_strike1` reste absent du pack ; aucun effet
de substitution ajouté. [Bilan](../../work/weapon-polish-20261025/resource-library-batch/README.md).

25 octobre2026 — `breaker_big_smash` du lourd se déclenche au départ de
l'état, au lieu du volume500ms. `sword_power` aérien est raccordé après300ms,
séparément du `breaker_jump` d'activation. Le fort ordinaire conserve le
`breaker_smash` de son attribut, pas le son lourd. Aucun VFX n'est substitué
à la séquence strike1 absente.47contrôles audio/runtime groupés et build commun.
[Lot et limites](../../work/weapon-polish-20261025/melee-audio-events/README.md).

25 octobre2026 — observation native ciblée de skill_bat_strike, personnage
sélectionné :42 relevés actifs montrent le conteneur sans parent et le Ghost
identité, malgré la demande de séquence. Aucun rattachement à Bat n'est observé
sur ce Breaker ; le Shape peut être périmé dans le cache. Ne pas réutiliser sa
matrice comme preuve de suivi ni transférer la nouvelle branche Bat au marteau.
Preuve/limites : `work/weapon-polish-20261025/bat-active-sequence-native/README.md`.
Les corrections demandées de hm_jumpattack et de l'impact lourd sont conservées.

25 octobre2026 — checkpoint de l'aérien supplémentaire : `skill_bat_strike`
charge un Shape sans maillage et un CActGhostTrail absent du runtime actuel.
Un raccordement du seul loader à un socket ne rétablirait pas l'effet.
Le parent/pose de l'instance GhostTrail active et son rendu restent à qualifier ;
`strike1` reste absent. Aucun parent ou ruban de substitution ajouté.
Lecture et condition de reprise :
`work/weapon-polish-20261025/effect-pool-lifecycle-batch/README.md`.

25 octobre2026 — adversaire Free training exposé avec `loadBreakerTrails`,
préparation/cache et pose adverse réelle ; ruban générique remplacé. Lot partagé
de six armes : `work/weapon-polish-20261025/melee-opponent-batch/README.md`.
Les limites natives et les effets encore non qualifiés ci-dessous restent ouverts.

**Statut : en cours, disponible en essais.** Adaptateur consommable livré ; le gate natif reste fermé. Les corrections utilisateur de repos, déplacement et attache sont conservées, aucun manifeste ancien réécrit pour faire réussir les tests.

## Traînée acteur classique — 25 octobre 2026

`src/breaker-trails.js` remplace le ruban générique fondé sur les bounds par
la forme acteur `Line01` restaurée depuis le SCN authentifié. Il lit la paire
P/P+V après le mixer, la texture `hm` et les fenêtres source léger/fort
50–600 ms, heavy100–900 ms et aérien50–350 ms. Charge et gather restent sans
ruban : leurs déclarations sont commentées dans la source. Le chemin statique
type33 établit `blendType=0 → SRCALPHA / ONE`, avec test de profondeur sans
écriture ; buffers, extinction et warmup sont réutilisés.

Les trois chemins réels du jeu — arme initiale, cache de changement et avatars
QA — chargent le même renderer. Les contrôles rig/source/asset/intégration
M/F sont verts, ainsi que le build commun. Preuve :
`work/weapon-polish-20261025/breaker-actor-trail/HANDOFF.md` et les
dossiers voisins `breaker-actor-trail-{shape,profile,blend}`. La seconde passe
native `flag22`, l'équation de blend, l'alpha séparé, le brouillard effectif,
les pixels et une comparaison visuelle avec le Jeu référence restent ouverts.

## Sources et contrat

Classique `2000013`, type 33, `model/weapon/breaker.scn`, attache équipée `L_Hand_Dummy`. Le catalogue actuel `xbn/weapon.xml` fournit Power **24**, Range **500**, move rate 1, attack move rate 0,95, charge power rate 2. L'ancien EU Power 22,5 reste distinct.

`work/melee-batch-2/breaker/build_source.py` reprend le lecteur lexical Counter et extrait directement les six ressources de la copie XS actuelle, avec longueur/CRC/SHA indépendants. `source-contract.json` conserve **15 fonctions**, **7 attributs** et leur provenance. Le corps actif supprime les commentaires avant les vérifications : le second contact heavy `SetFullCharge(true)` est commenté, il n'est pas créé.

`src/breaker-combat-data.js` exporte `BREAKER_ABILITY`, `breakerAttackContacts(kind, comboIndex, options)`, `BREAKER_LOCOMOTION`, `BREAKER_SOURCE_STATES`, `BREAKER_SOURCE_EFFECTS` et `BREAKER_UNCERTAINTIES`. La liste de contacts est raccordable au moteur commun ; charge/gather/garde renvoient une liste vide. Les profils runtime existants ne sont pas remplacés.

Repos explicitement `NormalState_Breaker` : HM000, boucle, reset false, blend 300 ticks. Run explicitement `RunState_Breaker` : HM008–HM015 haut, 00008–00015 bas, boucle, reset false, blend 1000 ticks. Source et présentation sont nommées séparément ; les tests reconstruisent les directions avec `directionalMapping`. HM006 et SG018–SG025 sont des jambes de charge, pas le déplacement ordinaire.

| Action | Source | Clips / vitesses déclarées | InitLua brut | Contact normal CHANNEL_MELEE |
|---|---|---|---|---|
| Léger | StandardBreakerAfterDash1 | HM001/HM002, 1/1 | 600,500,40,true | 200 ms, Power=24, box 750×350×500, ancre 0,200,0, blow 2000/3000 |
| Fort | StandardBreakerStandAttack_Strong | mêmes clips | mêmes paramètres | identique léger |
| Heavy | StandardBreakerAfterDash4 | HM004/HM005, 1/1 | "","",800,1000,40,false,2000 | 500 ms, Power×0,85=20,4, box 750×600×850, ancre 0,200,-100, **blow 0/0** |
| Aérien | StandardBreakerJumpDash | HM016/HM017, 0,85/1, durée demandée 300/1000 | 300,600,40,false | 250 ms, Power=24, box 500×600×600, ancre 0,0,-100, push 100/4000/-5000 |
| Charge | StandardBreakerAfterDash5 | haut vide, bas HM006/SG018–25 | 40,0,0,false,true,3 | aucun |
| Gather | StandardBreakerGatherGuage | haut vide, bas HM007/SG018–25 | 40,0,0,false,true,2 | aucun |

Les boîtes sont en unités source, dimensions complètes, direction 0,0,-1 ; le moteur commun porte leur conversion. Pas de critique individuel actif (`AlwaysCritical`/`DependOn` absents). Les attributs critiques indexés ne suffisent pas à créer un critique.

Léger/fort sont contrables ; **heavy et aérien ne le sont pas**. Guard crush : 0 désactivé léger, 1000 activé heavy/aérien. DamageData : 200 ms léger/aérien, 1000 ms heavy, `DAMAGEMOVING_ENABLE`, `DAMAGEBYPART_DISABLE`. Le heavy préserve `SetFullCharge(false)` ; la chaîne de charge et le multiplicateur de table 2 ne sont pas appliqués arbitrairement. **Blow 0/0 doit conserver une impulsion nulle**, même si la réaction de blow est jouée.

Déplacements : MoveBox×1 léger/heavy ; drop heavy à 400 ms [0,-10000,0], aérien à 200 ms [0,-20000,0], cooldown aérien600. Les déclarations de vitesse ne prouvent pas seules le fitting réel. Le 40 de la chaîne CAttackState prouvée est un intervalle de mise à jour scène ; aucune nouvelle phase de 40 ms n'est ajoutée. Les profils historiques S5 restent inchangés et leur ancien `minimumMs40` n'est pas certifié ; l'overload heavy doit être examiné séparément.

## Effets et son

Toutes les attaques normales déclarent l'impact `effects/backattack_sword_s.seq`, son `breaker_hit.ogg`. Départ léger `breaker_smash.ogg`, aérien `breaker_jump.ogg`. Heavy ajoute `breaker_big_smash.ogg` à 0 et `weapon_breaker_chargeattcack.seq` à500 ms. Aérien ajoute `skill_bat_strike.seq` et `hm_jumpattack.seq` à0, puis `skill_bat_strike1.seq`/`sword_power.ogg` à300 ms. La charge et gather n'ont aucun événement actif dans leurs bodies : les lignes VFX/audio sont commentées.

La traînée source est `GhostTrail_Breaker_01` : léger/fort50–600, heavy100–900, aérien50–350 ms. Voix homme/femme léger2/2, heavy1/1, aérien3/1. Les ressources et le renderer sont désormais raccordés ; l'observation de chaque événement/arrêt et la fermeture de `skill_bat_strike1` restent à joindre au lot.

### Correctif de présentation — 25 octobre 2026

Le premier raccordement de `weapon_breaker_chargeattcack.seq` à 500 ms avait
conservé l'origine acteur. Le retour utilisateur a invalidé son placement :
l'effet doit partir de l'impact de l'arme et l'aérien doit suivre cette arme.
La correction utilise le socket équipé `HM_DMGeffect_Dummy`, évalué après la
pose de son propriétaire. Le lourd interroge la surface sous ce socket sur
3 unités (portée source convertie), fige le point touché et sa normale au
premier départ des particules et retire le décalage d'émission source de -600
en Z. Sans surface touchée, aucun choc de sol n'est créé. L'appel source est
à 500 ms, ses premiers départs à +100 ms : le raccordement prend donc le
snapshot à 600 ms et retranche 100 ms aux fenêtres internes. Chaque départ
et chaque fin visible conserve son temps absolu. Un snapshot à 500 ms prenait
la tête encore derrière le personnage, avant la fin de l'armé.

L'aérien `hm_jumpattack.seq` conserve ses deux modèles et dummies, recentre
leurs pivots source et suit le socket pendant l'action. Les courbes de
transformation, alpha, morphing et UV sont récupérées depuis les deux SCN
authentifiés dans un complément `public/assets/weapons/breaker/effect-tracks.json`.
L'adaptateur corrige aussi la rotation des particules locales. Le suivi après
pose ne réémet pas et n'avance pas deux fois l'horloge. La traînée `Line01`
reste liée au modèle animé suivant sa hiérarchie source.

La politique socket/suivi et le recentrage appliquent la correction utilisateur
du 25 octobre ; le consommateur natif de l'objet externe reste à comparer.
La correction suivante de la traînée a invalidé le premier diagnostic de
parent « correct » : les points P/P+V décrivent les coins réels de la tête du
marteau dans le repère du maillage. Réappliquer la matrice de placement Shape
les déplaçait vers le manche. `breaker-trails.js` utilise maintenant la matrice
du maillage visible après mixer ; le test exige la correspondance des points
avec ses vrais sommets. L'impact conserve le dégagement de surface de 0,025
déjà employé par les autres impacts mêlée pour éviter le z-fighting.

`tests/breaker-effect-attachment.test.mjs` mesure l'impact et le suivi sur les
vrais rigs M/F à quatre orientations, plateforme surélevée/pente/absence de sol,
l'extinction et les pistes source.
Voir [contrat des effets](../CONTRAT-EFFETS-ARMES.md).

`BREAKER_PRESENTATION_COVERAGE` et
`tests/breaker-effects.test.mjs` constituent le garde-fou : chaque état du
Breaker doit déclarer un cue, une traînée ou une limite sourcée. Les branches
`skill_bat_strike` / `skill_bat_strike1` restent explicitement ouvertes (ancre
externe `Bat` non établie et une ressource non retrouvée) ; aucune imitation
visuelle n'a été ajoutée. La vérification visuelle homme/femme dans le jeu
principal reste nécessaire avant de déclarer l'arme terminée.

## Vérification courte

Le 3 octobre, la régression d'empreinte des effets staging est résolue par
reconversion authentifiée des5SEQ et restauration LF des3modèles, puis
régénération du manifeste. Les champs sérialisés sont identiques ; seul le
texte descriptif du parseur évolue. Provenance et runner dans
[breaker-effect-reconversion.md](../../work/melee-batch-5/breaker-effect-reconversion.md).
59régressions d'effets passent, build réussi. Statuts de rendu natif non prêt
conservés : aucune validation visuelle déduite de ces empreintes.

**8/8 tests réussis** (`tests/breaker-source-data.test.mjs` et `tests/breaker-locomotion.test.mjs`), rapport `work/melee-batch-2/breaker/tests.txt`.

- Contacts indépendamment comparés aux corps actifs actuels : temps, puissance, dimensions, ancre, condition, counter et réaction ; aucun second heavy commenté réintroduit.
- Vrais rigs/mixer/Controller/MotionGraph : deux sexes, huit directions, quatre orientations, attaques léger/fort/heavy/aérien/charge, changement Breaker→Counter→Breaker, retour HM000 ; IDs haut/bas contrôlés.
- Grip mesuré après mixer : `Sword_Wea_Dummy` relatif à `L_Hand_Dummy` reste identité à3e-5 près. Cela ne remplace pas l'observation visuelle du maillage ni une comparaison S5Runtime.

C01/C02/C03/C05/C13 : contrôles automatiques partiels réussis, observation principale à joindre par l'intégrateur. C06/C12 : déclarations préparées, effets/écoute non certifiés. C09 : paramètres physiques préparés, distances natives non calibrées. C04/C07/C08/C11 : sans objet pour les états sélectionnés, aucune visée rayonnée, balle, fumée ou dispersion déclarée. C10 : règles de réactions mêlée explicites. C14 : build, tests communs et gate du lot à joindre.

## Les quatre échecs staging anciens

Examen **en lecture seule** des manifests et du runtime. Les tests sous `work/arsenal-integration` ont en plus des imports relatifs hérités vers `work/src`/`work/public` inexistants. Des copies diagnostiques dans le dossier de preuves ne corrigent que ces chemins pour voir les assertions historiques ; elles ne changent aucun test source ni manifeste. `staging-diagnostic.txt` reproduit **4 échecs / 6** :

1. Le test attend `staged-not-playable`, alors que le manifeste modèle déclare déjà `integrated-training`.
2. Le test modèle exige l'absence du Breaker du sélecteur alors qu'il est déjà jouable en essais.
3. Le test effets compare les octets LF aux fichiers CRLF ; les huit différences de son manifeste sont **entièrement** expliquées par les fins de ligne. La normalisation en mémoire retrouve exactement tous les SHA attendus.
4. Le test effets exige lui aussi l'absence du Breaker du sélecteur.

`staging-comparison.json` compare 7 assets modèle, 31 assets effets, 2 rigs : respectivement 1, 8, 2 mismatches bruts, tous SHA identiques après normalisation LF en mémoire. Le test rig séparé échoue de même sur 3003189 octets contre3003188. Ce constat explique le décalage, **ne transforme pas un test échoué en test passé** et ne prouve pas une intégration native prête. Aucun fichier n'a été normalisé ni gate assoupli.

## Prochaine preuve utile

Chaîne native Breaker charge/overload InitLua/`SetFullCharge(false)` puis observation des effets et sons dans le jeu principal. Les contacts normaux et la locomotion peuvent avancer sans attendre cette certification. Aucun seuil d'abandon atteint : ressources authentifiées et tests nouveaux passés.

Raccordement commun lot2 : volumes BOX exacts consommés par melee-runtime, contre interdit sur heavy/air, dégâts bruts24/20,4, heavy blow[0,0] respecte la force nulle tout en gardant réaction. tests/melee-batch-2-runtime.test.mjs et suite globale1474/1478 (4 échecs préexistants), contrat10/10/buildcode0. Source charge reste une approximation de contrôle documentée.
