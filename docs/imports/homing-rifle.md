# Homing Rifle — adaptateur source avec limites

15 octobre2026. Item2010015/type28, handler StandardSmg2Homing, modèle
homing_rifle.scn. Ne pas fusionner avec WaterGun/Spark ou déduire un
projectile guidé du nom commercial. API createHomingRifleState,
advanceHomingRifle, homingRiflePose ; cléhomingrifle, queue possédée par
l'adaptateur. Raccordement principal/contact/VFX/UI reste chez leurs
propriétaires ; aucun jeu principal ou S5Runtime observé par cet agent.

Catalogue courant : puissance6.25, cadence8, capacité30, réserve infinie,
move/attackmove1, accuracy0, rand_dmg_min−3/max3/prob100. La sémantique du
pipeline aléatoire n'est pas prouvée : ces valeurs sont conservées, non
appliquées implicitement aux dégâts. Aucun SetCritical dans ce handler.

NormalState W0000 ; Run haut WK014..21, bas00008..15 selon huit clés.
Tir AimBlend **WK001/WK002/WK003**, bas E0008..15 ou neutralW0013.
Les jambes demandent800ms : facteur calculé depuis chaque vrai clip/sex.
FemaleE0010/E0012 ont3200ticks, autres4000 ; aucune vitesse uniforme imposée.
Reload W0004 demande2000ms, LOOP_FALSE, basW0004 ; durée source14720ticks
homme/15200femme, fitting séparé. Aucun mapping mobile de recharge substitué.
30clips par sexe vérifiés, mainR_Hand_Dummy/link0, gripSmg_02_Wea_Dummy,
stowGun_Dummy, muzzleSmg_02_Fire_Dummy. Tests postmixer contrôlent grip et
vertices sur huitdirections, repos/tir/recharge et visée.

StandardSmg2Homing : InitLua(260,40,−40,250,0,666,3,drysound).
Trois CAttack à10/65/120ms, chacune consomme1ammo, puissancePower+Additional,
rayon source(0,0,−1), falloff4000..12000/min0.2, thickrayBodyPartsfalse,
collisionRangeAdjustfalse. Attack2 ajoute deux offsets[.0084,−.0084,−1]
et[−.0084,−.0084,−1] ; Attack3 unoffset[0,.012,−1]. Le comportement natif
de ces listes reste inconnu : pas d'expansion en rayons ni guidage inventé.

Politique d'essai nommée et nativeReadyfalse :8cycles/seconde, trois
activations source par cycle, débit à activation, relâchement annule les
activations restantes. Le catalogue ne prouve pas cette cadence par cycle ;
factory/timing/input restent à comparer. La queue émise contient exactement
trois CAttack et conserve leurs offsets pour le futur propriétaire contact.

17sources vérifiées CRC/longueur/SHA, modèle/texture/cinqsons convertis.
Attribut PART_UPPER, sonshoming_hit/homing_shot/wall_attack, reloadhoming_reload.
QuatreSEQ référencées gun_bodyhit_electronic_plasma/gun_hit_electronic_plasma/
weapon_homing_shot/weapon_homing_fire restent **non décodées**.
Troispistes bornées : headersconnus échec ; candidat ajusté parCRC rejeté
parparseurstructure ; corpus deheadersTurret authentifié0/4. Les candidats
rejetés sont en quarantaine, exclus du manifeste auth et des assets publics.
Un CRC ajusté ne fournit pas une authentification indépendante. Aucun codec
partagé modifié ; script exploratoire désactivé. Reprise avec header/format
authentifié ou copie source conforme permettant parseSEQ complet.

Validation :9tests propres +12contratcentral **21/21**, buildexit0/2.64s.
Gates fermés pour offsets, cadence/input, randomdamage, effets et comparaison
native. Demandes/scénarios : armes/homing-rifle/integration-requests.md.
