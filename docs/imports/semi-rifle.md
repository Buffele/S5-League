# Semi Rifle — réception à distance à comparer

**23 octobre — Conquest :** raccord réel du Controller, reçus par balle,
rayon après dispersion/obstacles/Shield et PV usine conservés lors du changement
d'arme. Main testé sur les deux sexes, attribut34, politique S5 plain-item/FREE2
à11PV proches. Aucun Push ajouté. Gate visuel complet et comparaison native
encore ouverts ; voir `work/game-modes/conquest-recovery/pawn-finalization-20261023/rifle-delivery-checkpoint.json`.

**21 octobre2026 — interaction Shield :** le rayon primaire définitif utilise
désormais le masque MAKERAY authentifié et le cutoff Shield avant dégâts/VFX.
315tests/build passent. Cela ne qualifie pas DAMAGEMOVING/PartialAnim ni une
comparaison vivante S5Runtime. [Livraison commune](../../work/shield-ranged-integration-20261021/DELIVERY.md).

17 octobre 2026. La correction du recul ne peut pas être déduite du raccordement Hand Gun/Burst/Revolver.

- Route actuelle item2010004 → StandardSmg2. Le corps et StandardSmg2_Pattern sont authentifiés depuis l'archive locale, CRC/longueur/SHA conservés dans work/automatic-rifle-reactions-20261017/source-audit.json.
- Aucun AddPushCondition/AddBlowCondition/AddStunCondition dans ces deux fonctions. En revanche ATTACKATTRIB_SMG2 déclare SetDamageData(0,DAMAGEMOVING_ENABLE,DAMAGEBYPART_ENABLE) et SetPartialAnim00016.
- DAMAGEMOVING est une énumération UNKNOWN0/ENABLE1/DISABLE2. Ne pas convertir DISABLE2 en booléen vrai. Le setter5F71D0 stocke le deuxième argument dans le champ+E8. Reprise statique du18octobre : le registre typé6E9390→5FC090 relie ce champ à60BD7E ; seule la valeur1 active state+180 et sa composante de locomotion inférieure. Cela ne définit aucune impulsion de recul.
- Baseline navigateur S5 : personnage féminin, cible passive, deux munitions et deux baisses de PV,100→89,4, déplacement nul échantillonné. Tests CPU avec les deux sexes et adversaire en attaque. Ces observations sont locales à S5, pas une comparaison native.

Reprise statique du18octobre : le consommateur PartialAnim5206B0→7C8170→7C9230 est retrouvé séparément. Les arguments sont00016/30/100/.2 ; le mélange varie pendant la lecture, remplace le précédent à chaque déclenchement et ne constitue pas un verrouillage du corps entier. Les deux rigs contiennent réellement00016 (3120ticks). Le chargement frais/cache active le masque des onze nœuds ; actor+198 est la distance carrée à CCamera. La durée0 saute le changement d'état dommage complet mais conserve ce chemin partiel. L'admission contextuelle du record reste à qualifier avant raccordement.

Le comportement runtime n'a pas été modifié dans cet audit. Le recul, l'animation partielle et les interruptions natives restent non certifiés. [Rapport historique](../../work/automatic-rifle-reactions-20261017/DELIVERY.md), [reprise et preuves actuelles](../../work/automatic-rifle-reactions-20261017/FOLLOWUP.md).


## 18 octobre 2026 — réserve du fichier courant
La réserve utilise désormais max_ammo=-1 du xbn/weapon.xml actuel, authentifié
par CRC/longueur/SHA et index courant. Les chargeurs restent7/30/40 pour
Revolver/Semi/Smash. Les autres paramètres de cette arme sont conservés.
Tests des deux sexes, tir/recharge/changement et bonus Siege ; contrôle
navigateur du vrai runtime avec fixture QA explicite. Réserve logique
native en partie non observée ; nativeReady inchangé. Compilation globale
actuellement bloquée dans le CSS du lobby, régressions d'interface ouvertes.
[Preuves, résultats et limites](../../work/rifle-ammo-reference-20261018/DELIVERY.md).
