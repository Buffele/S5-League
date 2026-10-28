# Armes du S5Runtime local : sources, raccordement et preuves

Travail sur la copie `work/s5runtime-local/private/client`, sans modification de
l’installation originale. Ce chantier ne constitue pas un import dans S5 League.

## Source actuelle

Le catalogue expose les **794 items de catégorie 2** du client actuel. Les
capacités et ressources proviennent de **`xbn/weapon.xml`**, extrait de
`package/23.xs`, CRC `a052419b`, SHA-256
`9de364c5095c1762676babedea658262b7a9d1899cfcb0769066273d8a508c53`.
Le CRC est contrôlé à l’extraction. Les cinq empreintes du catalogue couvrent
également les items, les fonctions Lua, l’ancienne définition européenne et
l’index exhaustif de la copie actuelle.

L’ancien `xml/_eu_weapon.x7` ne contient que 124 définitions. Il reste une
preuve historique, sans fusion automatique dans les définitions actuelles.
Le candidat intermédiaire de capacités héritées des parents est conservé à part.

`build_weapon_native_data.py` compile les 794 définitions exactes dans le XBN
de type 3. Les huit autres XBN sont identiques octet pour octet au jeu de
données de départ. Le lancement `-NativeWeaponData` utilise ce candidat complet.

## Inventaire et automatisation

`weapon-service.mjs` fournit les items permanents natifs, les ACK d’équipement,
les trois emplacements d’armes et les IDs de profils. L’inventaire est partagé
entre les personnages homme/femme ; un transfert déséquipe le propriétaire
précédent avant d’équiper le nouveau. Les DTO d’entrée en partie sont comparés
aux IDs, clés et couleurs attendus.

Par défaut, les 794 items gardent leurs IDs historiques et la couleur 0.
L’option `includeColorVariants:true` ajoute les couleurs retrouvées dans les
vecteurs de modèles natifs : **2 945 combinaisons modélisées**, soit **2 954
items d’inventaire** en conservant les neuf placeholders de couleur 0.
Les armes à plusieurs modèles utilisent l’intersection de leurs palettes.
`build_weapon_palettes.py` reproduit ce catalogue depuis un preflight natif
dont les empreintes doivent correspondre aux sources courantes.

Les IDs colorés ne chevauchent pas les 18 684 items de costumes colorés.
`weapon-native-colored-preflight.json` confirme les 2 954 items réellement
présents dans l’inventaire natif avec leurs clés, IDs et couleurs exacts.
L’équipement scripté accepte `select(keys, sendRmi, {characterSlot, colors})`.
L’intégration du serveur et du lancement appartient à `auth-probe.mjs` et
`start-local.ps1` ; le service seul ne rend pas une option de lancement active.

`weapon_scenarios.py` ne lance ni ne tue un client et ne change pas le focus.
Une session de contrôle exacte doit être réservée à ce runner. Les gates
lisent le véritable acteur local, les liens inverses d’inventaire, le personnage
propriétaire, les emplacements, IDs, clés, couleurs et le type de capacité.
Ils ne dépendent pas de la taille du cache d’observation Frida.

Le contrôle du 17 octobre, `local-launch-20261017-153051-4dbc18`, confirme
ce chemin avec `-QuietStartupDiagnostics -NoEquipmentObservers` : les trois
sélections Submachine Gun `2010001`, Smash Rifle `2010006` et Assault Rifle
`2010024` passent sur l’acteur masculin réellement en partie. Les emplacements,
IDs, clés, couleurs, propriétaire d’inventaire et types explicites sont vérifiés
par `ReadProcessMemory`. Le lot après disponibilité dure 7,37 s ; ce nombre
n’inclut pas le démarrage et ne constitue pas un gain ×10 mesuré.
Preuve : `work/waiting-room-result-ui-20261017/native-followup/memory-selection-smoke.json`.
La sonde Frida de sélection reste refusée sur son préfixe tardif inconnu ;
elle n’est pas nécessaire à ce runner, qui utilise déjà `--native-memory`
par défaut. Aucun contrôle de préfixe n’est relâché. Ce passage de sélection
ne valide ni tir, ni dégâts, ni recul, ni rendu/animation sur les deux sexes.

`WeaponMemory.weapon_costume_overrides` lit le tableau des overrides du
ClothingManager : `+28 + weaponSlot*20 + partIndex*4`, trois lignes de huit
wrappers natifs. Les sources `B98E70`, `7BFD80`, `7C04B0` et `7BEAA0`
établissent la relation avec les SceneObject de costumes associés aux
Iron Boots : `2000030→1930001/1950001`, `2000035→1930002/1950002`.
Ce tableau ne contient pas les modèles principaux des armes ordinaires.

Les modèles principaux se trouvent dans les vecteurs `weaponEntity+40/+44` :
entrées de 20 octets, premier pointeur vers un objet polymorphe natif dont
`B93DA0` appelle la visibilité virtuelle `+EC`. `B94F50` et
`B92B20/B933E0/B92F80` construisent ces objets. Les autres champs restent
conservés bruts plutôt que recevoir des noms non attestés.
`B935D0` parcourt chaque indice de scène de définition, choisit sa couleur
via `9C3110`, charge avec `1162E60` et ajoute sa racine dans le vecteur
`weaponEntity+5C`. `B91040` accède à ces racines par indice. Le lecteur garde
les pointeurs nuls lorsqu’un chargement ne crée pas de racine ; il ne les
remplace pas par les modèles d’une autre arme.
`weapon_model_watch.py` peut relever ces objets pendant un lot sans API,
commande, injection ou attachement supplémentaire. Il vérifie que l’acteur,
le slot et l’arme sélectionnée restent identiques pendant la lecture.
La présence d’un objet natif n’atteste ni son rendu ni ses clips actifs.

`build_weapon_lua_contracts.py` lit séparément les déclarations de repos,
course et attaques dans 147 scripts extraits de la copie avec CRC/SHA vérifiés.
`weapon-lua-source-contracts.json` conserve les canaux `GetAnimParam`, les
arguments `SetAnim` bruts, leurs clips littéraux et les lignes de source.
756 variantes possèdent une déclaration source de repos et de course associée
à leur propre mapping. Les mappings vides, absents ou uniquement présents sur
un parent restent distincts ; la présence lexicale d’une fonction ne prouve
pas son chargement, l’ordre des scripts ou son invocation en partie.

Options utiles :

- `--sex both`, `--keys ...` ou `--offset` / `--limit` ;
- `--reuse-room` : reset, équipement et redémarrage dans la même salle ;
- `--selection-only` : disponibilité/sélection sans entrées d’attaque ;
- `--colors ...` : une couleur native par clé, avec inventaire coloré actif ;
- `--skip-completed-reports ...` : reprendre des lots exacts déjà sélectionnés
  avec les mêmes sources, sexes et couleurs ;
- `--continue-failures`, `--max-seconds` et `--output` : passage borné,
  erreurs et scénarios restants consignés ;
- `--consecutive-failure-limit` : arrêt après trois lots consécutifs en échec
  par défaut, plutôt que répéter des commandes sur un client bloqué ;
- `--reload-wait-seconds` : observation bornée de hausse réelle du chargeur.

Avant la première RPC native, le runner exige désormais le vrai booléen
`startup_observers_released` dans les métadonnées du PID réservé, le serveur
initial rejoint/en partie et le gate mémoire `nativeRuleState=2` avec joueur
vivant `firstPlayer.state=0`. Ce dernier gate s’applique aussi après chaque
redémarrage de round. Un compteur serveur en partie seul ne suffisait pas :
un ancien passage a interrompu le chargement initial, sans aucun essai qualifié.
Les passages uniquement de sélection peuvent utiliser un countdown de 250 ms ;
les essais de tir restent à 4000 ms jusqu’à preuve indépendante d’un délai court.

## Ce que les preuves établissent

`weapon-native-definition-preflight.json` vérifie les 794 définitions natives,
les 794 items réellement présents dans l’inventaire natif avec leurs IDs et
couleurs 0,
les 793 types explicitement définis, les 794 listes de scènes et les cinq
champs de ressources comparés à la source. 785 définitions possèdent une scène.
Une égalité de noms de fichiers ne prouve pas leur rendu ni le jeu d’un son.

`weapon-runtime-native-customs-pad0.json` vérifie les quatre originales sur
les deux sexes : Katana `2000104` / type 39, RuleDagger `2000106` / type 24,
LightShotgun `2011337` / type 34, AirBomber `2051337` / type 29.
Les huit sélections/types passent. LightShotgun : chargeur 9 → 8 au tir puis
8 → 9 à la recharge. AirBomber : 1 → 0 au tir ; sa recharge reste non vérifiée.
Les essais antérieurs interrompus par le rejet de padding chiffré zéro ne sont
pas des crashes du processus et ne sont pas crédités comme essais terminés.

`weapon-runtime-native-types-pad0.json` contient le passage par type natif,
sur les deux sexes : **82/82 sélections et types exacts**, sans erreur de
scénario ni de protocole. Avec les quatre originales sur les deux sexes,
**90 sélections/types**, **60 baisses de chargeur** et **46 recharges** sont
observés. `weapon-runtime-native-machineguns-pad0.json` complète le maintien
initial de 300 ms par des tirs de 2 s : HMG et LMG tirent et rechargent sur
les deux sexes ; la Turret consomme avant et après l’entrée d’installation,
puis recharge après retour. L’animation d’installation reste non vérifiée.
`weapon-runtime-coverage.json` agrège les rapports portant
exactement les empreintes du catalogue courant et garde séparés inventaire,
équipement, sélection, capacités, baisse de munitions et recharge observée.
Il distingue aussi les objets polymorphes des modèles principaux, les racines
SCN reliées à leur indice source et les changements de costume des Iron Boots.
Le passage exhaustif est fractionné en sessions bornées ; les rapports de
reprise conservent les anciens PID, dates et empreintes au lieu d’attribuer
leurs observations à une nouvelle copie. Le rapport d’agrégat est la source
des compteurs courants, car les lots encore actifs les font évoluer.

Le passage `weapon-runtime-native-all-male-pass1.json` a terminé 363 clés
masculines sans erreur ; `weapon-runtime-native-all-both-pass4.json` termine
les 431 restantes puis poursuit le personnage féminin. Leur union couvre
les **794 sélections masculines**. Le placeholder `2010023` reste sélectionné
mais sa capacité explicite manque ; il ne compte pas comme type source validé.
Les six premiers Emperor du pass4 montrent aussi de vrais pointeurs de racine
SCN nuls et des vecteurs de modèles vides : l’équipement réussi ne les rend
pas visuellement complets. `weapon-model-coverage.json` conserve les fichiers
concernés et distingue présence dans les archives et chargement natif.

## Limites encore ouvertes

L’item `2010023` possède une capacité vide dans la source actuelle. Neuf
définitions n’ont pas de scène. 25 références SCN, soit 24 noms uniques,
n’apparaissent pas directement dans l’index complet des archives de la copie.
Ces trous sont conservés et ne reçoivent pas de modèle ou de statistiques
fabriqués depuis une autre arme.

Les rapports ne déclarent aucune arme entièrement vérifiée sur la base du seul
catalogue, d’un ACK, d’une sélection ou d’une baisse de munitions. Clips actifs,
locomotion et transitions sur les deux rigs, attaches après animation,
inspection visuelle, sons/VFX et collisions/dégâts exigent encore des preuves
propres. Le problème des captures noires a depuis été résolu sur une copie
de diagnostic par la méthode native de capture exécutée sur le thread de
rendu. Le rapport `automation-native-capture.json` atteste l’avatar, Plasma,
Station2 et le HUD en arrière-plan. Les passages d’armes déjà réalisés sans
ce module restent des preuves mémoire ; aucune observation visuelle ne leur
est attribuée rétroactivement.

## Vérification du service

Depuis la racine active du dépôt :

```powershell
node --test tools/s5runtime-local/weapon-service.test.mjs tools/s5runtime-local/appearance-service.test.mjs
```

Les tests vérifient le protocole et les rejets, les transferts entre personnages,
les couleurs et leur provenance. Ils ne remplacent pas les essais du client.
