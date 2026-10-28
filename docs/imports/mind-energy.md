# Mind Energy2060001 — sources préparées

15octobre2026. Lot distinct de l'ancien aperçu mind-energy et de Mind Shock2060002.
Source actuelle CRC/SHA : douze fichiers principaux ; quatorze ressources initiales,
trente et une dépendances SEQ et trois DDS imbriqués supplémentaires authentifiés.
21clips primaires sur chaque sexe, sept SCN,29textures converties, trois sons et
dix SEQ parsés à EOF sont disponibles sous public/assets/s5runtime/mind-energy-source/.

MindHeal est la fonction weapon_lua de2060001 ; abilitytype11,power10.05,
magazine20,max_ammo−1,rate_of_fire3,range3000,move/attack.9. Le script déclare
InitMindEnergyLua1(200,1500,500,260,false,1700), équipe amie1,FindEnemyfalse,
find/range3000/45°,damageHP0..0,healingHP0..15. La conversion réelle de ces
bornes en soin, consommation/cadence et paramètres des bindings restent ouverts.

NormalState00029 ; RunState haut et bas00008..15, blendIn2000ticks haut et
1000ticks bas, durée0 donc pas de fitting arbitraire à2s/1s. ActionbeginH0000
durée0,blendIn200ticks ; CustomAnimBlender hautH0000/H0001 et basH0002/H0001.
LowerPart mobileE0008..15 demandé800ms ; neutralH0001. ReloadH0012 durée0,
blend1000/500ticks, bouclé ; lower déclaré seulement neutreH0012. Le mapping
mobile de recharge n'est pas inventé. Driver/priority du mélange custom restent
non certifiés. Les différences de durée des clips féminins sont conservées.

weapon_attach type11/scène0 : Bip01 R Forearm,link1. Le modèle n'a pas de
BoneChunk ; ses ModelData/BASE sont conservés et le moteur de hiérarchie existant
les attache au Forearm. Aucun dummy/grip artificiel ajouté. Tests loadAvatar réel
sur deux sexes,21clips et huit directions après mixer passent. Le comportement
exact du link1 et l'horloge indépendante BASE n'ont pas été comparés à S5Runtime.

API : createMindEnergySourceState/advanceMindEnergySource/mindEnergySourcePose,
cancelMindEnergySource. La queue unique pendingHealingRequests fournit des
requêtes MindHeal authentifiées ; aucun pendingShots/faux projectile n'est créé.
Politique d'arène nommée : begin200ms,requêtes à la cadence catalogue3/s,débit1,
fin500ms,recharge3000ms,blend1 si absent. Ces choix ne certifient pas les timers
natifs. Conversion de soin exige cible, acceptations équipe/range/LOS, facteur
normalisé, échelle d'unités et nom de politique explicites ; aucun PV n'est écrit.

Limites : exact strings InitMindEnergyLua1/2 non retrouvées dans le PE pinné.
SetFindEnemy appartient à CAttackMindEnergyState ; SetHealingHP retrouvé sur
CMindEnergyAIActorState ne prouve pas une substitution de classe player. Deux
textures exactes effects/inter_pasthit7.bmp/.dds et inter_pasthit7a.bmp/.dds sont
absentes de l'index actuel : deux modèles FX restent non prêts, sans alias.
Les clips DD005..DD012 existent dans le porteur courant (56 pistes homme,
43 femme,3200ticks chacun), mais certaines copies DamageH0004..H0011 pointent
vers une entrée DD absente sur le nœud concerné. Les porteurs bip_*0000 ne
contiennent ni les H ni les DD ciblés. Aucun fallback par nœud n'est inventé.
Les dix SEQ et leurs champs sont conservés ; contexte Lightning/NodeControl et
rendu restent ouverts. Pas d'exposition main/registry, pas d'observation navigateur
ni de client natif, aucune gate prête ouverte. Ne pas annoncer la famille jouable.

Preuves, contrat et demandes : work/parallel-gameplay-reference/armes/mind-energy/.

La recherche des bindings joueur est bornée pour ce passage : littéraux exacts,
table de registration joueur/IA et héritage Lua inspectés. Reprise avec binding
authentifié InitMindEnergyLua1/2, ou factory démontrant le pont joueur vers IA.
Les setters Find du joueur sont distincts du stockage Healing de l'IA ; leurs
preuves ne ferment pas l'application des soins ni la cadence. Voir native/ et
native-gate.json. Le registre central doit être actualisé par son propriétaire
avant toute exposition, avec queue de soin et approximations conservées.
