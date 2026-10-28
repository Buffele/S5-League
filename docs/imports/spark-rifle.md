# Spark Rifle2010018 — préparation source actuelle

15 octobre2026. L'ancien aperçu isolé reste intact. Nouveau root de ressources
public/assets/s5runtime/spark-rifle-source ; modèle, texture,30clips sur chaque sexe,
cinq sons et une séquence source exacte disponibles. Aucun raccordement principal
ou comparaison S5Runtime revendiqué. NativeReadyfalse.

Catalogue actuel : type32, capacité28, réserve infinie, puissance5.25, cadence8,
move/attack1, zoom déclaré avec FOV25. L'ancien aperçu30/60,power4,cadence6 ne
constitue pas la source courante. weapon_lua sélectionne StandardSparkRifle et
UseWeapon1State_SPARK_RIFLE. Attache R_Hand_Dummy link0, stowGun_Dummy ; hiérarchie
Smg_02_Wea_Dummy et muzzleSmg_02_Fire_Dummy conservés après mixer M/F.

NormalSP000 durée0/blend1000ticks. Run hautWK014..21,bas00008..15, durée0 et
blend1000ticks. Action custom hautSP001/SP002,basSP003/SP002 ; LowerPart mobile
E0008..15 demandé800ms, neutralW0013. ReloadSP004 demandé2000ms, non bouclé,
lower uniquementneutre. Aucun fallback de recharge mobile ajouté. Durées féminines
différentes conservées ; driver et priorité du customblend encore non vérifiés.

StandardSparkRifle initialise deux attaques à10ms et65ms, chacune consumeAmmo1,
MAKERAY et dropoff4000..24000/min.2, critical2.3/prob0. La seconde déclare trois
AddProjectileOffset. Ces valeurs sont conservées comme déclarations ; elles ne
prouvent ni trois rayons, ni guidage, ni offsets de position/direction. Blocage
consommateur identique au Homing déjà borné ; aucune recherche répétée ici.
SourceInitLua(260,40,-40,250,0,666,2,drysound) conservé sans renommer666 en cooldown.

API createSparkRifleSourceState/advanceSparkRifleSource/cancelSparkRifleSource/
sparkRifleSourcePose, key sparkrifle. Queue pendingShots unique, une entrée par
attaque activée. Politique d'arène nommée catalogue-cycle-rate-two-deferred-attacks
utilise8cycles/s ; cadence/debit natifs non certifiés. Les deux attaques dépensent
leur propre munition lors de l'activation. Relâchement, annulation, recharge et
changement doivent supprimer les activations/queues non consommées. Réserve
infinie conservée. Le zoom expose les données source, sans inventer son entrée.

Effets : weapon_sparkrf_shot.seq passe CRC et parsing EOF. Trois SEQ restent
non extraits : gun_bodyhit_electronic,gun_hit_electronic,weapon_sparkrf_fire.
Passage borné après trois méthodes : en-têtes connus, corpus SEQ authentifié,
balayage u16 du suffixe après préfixe de six octets authentifié. Aucun candidat
CRC valide trouvé. Reprise : plaintext/en-tête authentifié ou preuve de codec
complémentaire ; aucun payload deviné. Manifest effectResourceReadyfalse.

Demandes de raccordement et preuves : work/parallel-gameplay-reference/armes/
spark-rifle/HANDOFF.md. Central contract et propriétaires main/avatar/audio/UI
doivent conserver ces limites avant toute exposition. Pas de famille annoncée
jouable ou prête depuis les seuls tests de ressources.
