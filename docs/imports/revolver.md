# Revolver classique — correction du recul reçu

**22 octobre2026 — clic gauche maintenu :** le bridge transmet maintenant le
bouton tenu au runtime, qui accepte un nouveau tir à la fin de son animation
et de son cooldown. Cadence existante1000/1.2ms, animation800ms, délai de
contact150ms, quatre rayons et consommation unique conservés. Relâcher empêche
les tirs suivants ; une recharge à vide peut être suivie d'une reprise si le
bouton reste tenu. Clic bref et annulations restent testés. Cette correction
de commande n'est pas une nouvelle mesure du dispatcher S5Runtime ; gate natif
inchangé. Tests, captures M/F et limites :
`work/revolver-shotgun-hold-20261022/analysis.md`.

**21 octobre2026 — interaction Shield :** les quatre directions finales
conservent maintenant chacune leur requête source et le cutoff Shield avant
dégâts/poussée/VFX.315tests/build passent ; comparaison vivante S5Runtime encore
ouverte. [Livraison commune](../../work/shield-ranged-integration-20261021/DELIVERY.md).

17 octobre 2026. Arme déjà raccordée au jeu principal, toujours expérimentale. Ce passage corrige sa réception à distance ; il ne lance pas une nouvelle série d'import.

- Route actuelle : item 2010002 → StandardRevolver, confirmée dans xml/weapon_lua.x7 de l'archive locale. Ne pas confondre avec Hand Gun / StandardRevolver2.
- Quatre attaques, chacune AddPushCondition(120,1125,-5000), SetCollisionRangeAdjust(false,false), attribut ATTACKATTRIB_REVOLVER → DIR_FRONT. Extraction avec CRC, longueur et SHA : work/revolver-victim-push-20261017/source-audit.json ; générateur tools/inspect-revolver-push.py.
- L'ancien attackattribindexer.lua décodé diffère de l'archive actuelle (645924 contre 638240 octets). Le présent raccordement utilise le bloc actuel authentifié, sans remplacer l'ancien dossier d'extraction partagé.
- Chaque vrai rayon accepté conserve son index et ses paramètres de poussée. Réception commune TrainingCombat/ChaserCombat, donc accès par les modes déjà raccordés à ce moteur. Pas de condition si les PV sont refusés ou SetImmune interdit son ajout. Quatre conditions distinctes, aucune agrégation arbitraire ni projection Blow.
- Direction horizontale calculée depuis l'origine réelle du contact, consommateur et collisions partagés avec Hand Gun/Burst. Les paramètres de clock/cap historiques et gates/modificateurs acteur locaux ne sont pas une lecture actuelle du client S5Runtime. Voir work/ranged-push-direction-20261017/DELIVERY.md pour ces limites communes.
- lastResolvedShot garde le dernier record effectivement résolu après consommation de la file par les effets ; le lastShot Revolver existant reste sa métadonnée de tir immuable. Cette observation ne change pas la mécanique de tir.

Contrôles automatiques : vrais Controller/rigs/mixers des deux sexes, quatre rayons, dégâts, collisions contre le mur et absence de réception répétée. Régressions Revolver/conditions de poussée/Shield et contrat central ; résultats détaillés dans le rapport du lot. Les timings, ressources, clips et réserves n'ont pas été retouchés.

Preuves navigateur, statut final et limites : [rapport du lot](../../work/revolver-victim-push-20261017/DELIVERY.md). nativeReady reste false. Animations partielles de réception, décès, collision/horloge/attributs acteur courants et calibration quantitative face à S5Runtime restent à comparer.


## 18 octobre 2026 — réserve du fichier courant
La réserve utilise désormais max_ammo=-1 du xbn/weapon.xml actuel, authentifié
par CRC/longueur/SHA et index courant. Les chargeurs restent7/30/40 pour
Revolver/Semi/Smash. Les autres paramètres de cette arme sont conservés.
Tests des deux sexes, tir/recharge/changement et bonus Siege ; contrôle
navigateur du vrai runtime avec fixture QA explicite. Réserve logique
native en partie non observée ; nativeReady inchangé. Compilation globale
actuellement bloquée dans le CSS du lobby, régressions d'interface ouvertes.
[Preuves, résultats et limites](../../work/rifle-ammo-reference-20261018/DELIVERY.md).
