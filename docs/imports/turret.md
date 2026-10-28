# Turret standard — préparation bloquée pour ce passage

15 octobre 2026. Item2020005/type37 courant, aucun alias MK2/HMG/Gauss.
30sources vérifiées CRC/longueur/SHA ; cinq scènes, quatre textures et quatre
sons convertis dans public/assets/s5runtime/turret. Aucun adaptateur d'état ou
registre ajouté. src/turret-contact.js fournit uniquement les déclarations
de rayons et dégâts paramétrées. Gates natifs fermés, pas de jouabilité annoncée.

Normal TR002, Run haut TR018 dans les huit directions, bas E0019..26.
Tir mobile : débutTR001, AimBlendTR003/4/5, basF0008..15 ouTR017.
Normal installéTR026, débutTR027, AimBlendTR028/29/30, bas**TR031**.
ReloadmobileTR006/24000ticks, installéTR032/14400ticks ; demandes1000ms,
LOOP_TRUE. Transitions TR033/11200ticks etTR034/9600ticks, LOOP_TRUE.
32clips présents M/F ; TR031 manque dans les deux jeux de carriers authentifiés.
Aucun remplacement par TR026/TR017. Le tir installé reste bloqué.

Quatre handlers indépendants :

- Standardturret : InitLua(500,0,0),20rayons(index−1)*OneShotTime,
  RotateY0.9*scale puisRotateZ, puissance0.5*Power+Additional,
  critique2.5, falloff4000..8000/min0.2.
- StandardturretInstall : InitLua(0,250,0),20rayons, RotateY0.2*scale,
  puissancePower+Additional, critique1.9, falloff4000..24000/min0.2,
  cameraShake propre. Aucune consommationammo explicitement déclarée.
- StandardTurretToInstall : InitLua(2000), camLimittrue60/90,
  distZoom−400, camFix1/−80, défense+.3 pour deuxchannels.
- StandardTurretToNormal : InitLua(2000), annulecamLimit/zoom,
  camFix−1/0, défenses0. L'argument2000 n'est pas qualifié de durée native
  avant lecture du setter/factory ; pas de transition simulée implicitement.

Attaches source link1 : scène0turret_gun_l→L_Hand_Dummy,
scène1turret_gun_r→R_Hand_Dummy, scène2turret_backpak→Spine_Dummy,
scène3turret→Bip01, scène4turret_gun→L_Hand_Dummy. Les assets conservent
ces attaches et pistes. Sémantique native link1 et arbitrage de visibilité
des cinq scènes restent non établis ; listes mobile/installed servent à
l'inspection. Les tests chargent les deux mains et vérifient les clips,
huit directions et poses finies ; **ils ne certifient pas grip/orientation**.

SeptSEQ structurées, EOF exact ;11dépendances directes authentifiées.
Quatre transformations sont NodeLoader ; railCActLightning orange_beam.
Impacts gun_hit4/gun_hit avec assultrifle_hit.ogg etwall_attack.ogg.
Reloadturret_reload.ogg retrouvé, muzzleSEQ vide. Rendu NodeLoader/rail,
fermeture récursive des modèles d'effets et événements natifs restent ouverts.

Blocage borné TR031 : (1)fullcarriersM/F authentifiés sans clip,
(2)carriersbip_*_0000 authentifiés sans clip,
(3)aucune piste/copie de bone TR031 dans fullcarriers ni cinq scènes.
Après trois pistes infructueuses, arrêt de cette recherche pour ce passage.
Reprise seulement avec carrier/alias authentifié contenantTR031 ou preuve
native de la sélection réelle du bas installé. Pas de fallback pour contourner.

Tests tests/turret-preparation.test.mjs :4/4, sources/contacts/M/F.
Pas de navigateur ou S5Runtime lancé. Handoff complet dans
work/parallel-gameplay-reference/armes/turret/integration-requests.md.
