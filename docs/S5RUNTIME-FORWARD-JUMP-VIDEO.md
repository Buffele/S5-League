# Saut avant — première référence vidéo S5Runtime

Analyse du 26 septembre 2026. Aucun changement du gameplay.

## Source et méthode

- Fichier utilisateur : `S5Runtime 2026-09-26 10-17-54.mp4`, dossier Vidéos/Captures.
- SHA-256 : `6fec178f21ff2ccba73a867892493fd6d51c9d391767f8b49c8f34cdf2cbd9c7`.
- 1920 × 1080, durée conteneur 3,872 s, cadence moyenne ~30,39 images/s.
- Décodage local avec PyAV, vue générale à 4 images/s puis images de la séquence
  à ~30 images/s, horodatages de présentation conservés. Aucune interpolation
  d'images et aucune télémétrie synchronisée.
- Outil : `tools/s5runtime-trace/inspect-video.py`. Dépendances PyAV et Pillow ; PyAV
  installé localement dans le dossier ignoré `.deps/video-analysis`.
- Planches locales ignorées par Git :
  `tools/s5runtime-trace/calibration/video-forward-jump/{overview,detail}/`.

## Observations visuelles

Une répétition complète, personnage masculin apparent avec dague, vue arrière
oblique. Le personnage se trouve sur un rebord étroit de Station 2 : ce n'est pas
un témoin sur grande surface plane. Le vêtement masque une partie des genoux.
Le sens « avant » est fourni par l'utilisateur, pas déduit de touches enregistrées.

| Temps dans la vidéo | Observation |
|---|---|
| 1,539–1,572 s | Passage de l'attente au début visible du saut |
| ~1,57–2,30 s | Rotation aérienne puis retour vers une posture verticale |
| ~2,34–2,61 s | Nouvelle bascule/roulade basse dans la séquence de réception |
| ~2,61–2,74 s | Redressement visible du buste, repositionnement des jambes et des bras |
| ~2,74–2,87 s | Stabilisation vers la pose d'attente |

Ce sont des repères visuels approximatifs, pas les frontières des états moteur.
Le contact au sol exact n'est pas identifiable sûrement depuis cette seule vue.
La résolution temporelle est d'environ 33 ms par image ; la fin du redressement
est progressive, donc une durée de transition au milliseconde serait injustifiée.
L'ensemble redressement/stabilisation occupe ici un ordre de grandeur de 0,2 s.

## Comparaison initiale avec les clips importés

Les poses ont été examinées dans le catalogue, en lecture directe de profil :

- `00000` à 0,500 s termine bas, penché avec appui sur les mains. Cette dernière
  pose ne représente pas, à elle seule, le retour debout visible dans la vidéo.
- `00003` à 0,100 s montre une posture à genou. Cette comparaison limitée ne
  suffit ni à l'identifier comme le relevé avant ni à l'exclure formellement.
- Le numéro du clip effectivement joué dans S5Runtime reste **non identifié**.
  La vidéo ne distingue pas à elle seule un clip de récupération dédié d'un
  mélange vers la pose d'attente. Aucun candidat n'est promu « confirmé ».

S5 possède déjà un fondu de 0,2 s après la roulade (`src/motion-graph.js`).
La durée proche ne prouve pas que sa trajectoire articulaire soit correcte.
Ne pas remplacer à nouveau un clip sur la seule base de cette durée.

## Deuxième prise HD / 60 images/s et identification du raccord

Source : `S5Runtime 2026-09-26 10-29-23.mp4`, SHA-256
`e67e543dd03753e6bebf1b45f2797b2e73e23213aba4105a4bafbc487617ccdb`.
1920 × 1080, durée 2,841667 s, cadence moyenne 1440000/24001 (~59,9975 images/s).
Il y a **un seul saut**, toujours sur un rebord étroit. La prise reste exploitable ;
ne pas la présenter comme trois répétitions sur sol plat. Planches dans
`tools/s5runtime-trace/calibration/video-forward-jump-take2/` (ignorées par Git).

La réception/bascule débute visuellement vers 1,51–1,54 s. Vers 1,79–1,82 s,
le buste se redresse et les jambes reviennent sous le corps ; vers 1,94–1,98 s,
la pose d'attente est retrouvée. Incertitude d'au moins une image (~17 ms),
plus l'ambiguïté du contact et des poses masquées. Cela est cohérent avec une
roulade quittée vers **300 ms**, puis une transition d'environ **150–200 ms**.
La durée exacte du mélange n'est pas une mesure directe du moteur.

### Écart certain côté S5

`src/motion-graph.js` joue `00000` jusqu'à 0,500 s puis applique un fondu de 0,200 s.
Le contrôleur dispose pourtant déjà de `SOURCE_MOVEMENT.landDelayMs = 300`, issu
de la capture native `src/s5runtime-native-physics-data.js` du 23 septembre.
La durée du fichier animation et la durée de l'état de réception ont été confondues
dans la présentation. Cet écart de 200 ms est réel dans notre code ; son effet
visuel est cohérent avec les deux vidéos. La vidéo seule ne mesure pas un contact
physique exact à la frame près.

### Ce que disent les poses originales

Les 223 clips masculins ont été échantillonnés à 11 positions temporelles avec
les pistes originales et la hiérarchie complète ; les comparaisons détaillées
ont porté sur `00000`, `00003`, `00004`, `00054` et `SN002`.
Le classement géométrique des extrémités est seulement un outil de présélection,
pas une reconnaissance automatique fiable de la vidéo.

- `00000` à ~0,250–0,300 s présente une sortie de rotation avec le buste relevé.
  En poursuivant jusqu'à 0,500 s, le personnage se remet en appui bas sur les mains.
  Ce dernier mouvement n'est pas celui du retour debout observé dans ces prises.
- `00003` comporte une flexion/réception à genou avant son redressement. Ajouter
  son début après la roulade ne reproduit pas la continuité observée.
- `00054` est un redressement court dans une autre orientation/posture ; ni sa
  version entière ni son inversion ne sont justifiées par ces images.
- La meilleure hypothèse actuelle est `00000` interrompu autour de 0,300 s puis
  mélange vers la pose d'attente dague `SN002`, pas ajout de `00054`/`00003`.
  Le clip actif n'a pas été lu simultanément à la vidéo : cette identité précise
  reste une attribution visuelle, distincte du mécanisme de sortie d'état ci-dessous.

### Vérification statique du client, sans accès au processus

Fichier local `s5runtimegame.exe`, SHA-256
`6bea9d8cc2503a1e660c1d8a9dfd1241f394207c4f1cb84a9d4a1fea3d3c8017`.
Les fonctions ont été reliées aux chaînes de diagnostic `CJumpState` et à sa table
virtuelle. Outil reproductible : `tools/s5runtime-trace/inspect-jump-code.py`, qui refuse
une empreinte différente. Extraits locaux dans `calibration/video-forward-jump/native/`.

- Entrée (`0x624B00`) : l'index de constante `0x20` est lu à `0x624BD8`, stocké
  dans le paramètre 3, puis copié vers la limite du timer à `this + 0x170`
  (`0x624D12–0x624D39`). L'index 32 est `GAMETEMPO_jump_landdelay` dans la table
  `tests/fixtures/s4/constant_info.x7`, cohérent avec la donnée native déjà capturée.
- Tick : les sous-états 5 et 6 suivent la branche de réception à `0x62608A`.
  Le timer à `this + 0x16C` est incrémenté, puis l'état est quitté lorsque le temps
  écoulé dépasse la limite (`0x62629F–0x626363`). Le code appelle le changement
  d'état de l'acteur avec la destination mémorisée à `this + 0x13C` ; il ne
  démarre pas ici un nouveau sous-état de relevé.
- Cette preuve établit la sortie temporisée de réception, **pas** le détail du
  mélange dans l'état suivant, ni le clip exact observé lors de cette vidéo.
  Aucun code du client n'a été exécuté/modifié, aucune commande envoyée à S5Runtime.

### Conclusion et correction à préparer

Le problème identifié est d'abord **le point de sortie de la roulade**, trop tardif
dans S5, plutôt qu'un clip de relevé démontré manquant. Faire suivre la présentation
de réception par la fin réelle de l'état (`landend` / timer 300 ms), puis comparer
un mélange court vers la pose courante avec la vidéo. Ne pas déduire des captures
le mode exact de mélange (pose figée ou source qui continue) : cela reste à vérifier.
La vérification du mélangeur ci-dessous complète désormais cette réserve.
Ne changer ni la physique, ni les règles de cancel à partir de cette seule étude.
**Aucun changement du gameplay réalisé pendant l'identification.**

## Suite

Les deux prises suffisent pour préparer la correction du raccord ; pas de nouvelle
capture nécessaire immédiatement. Restent à vérifier après correction : le rendu
effectif S5 et les paramètres exacts de cette transition. Ces prises ne mesurent pas l'annulation
par sprint, ni la variante arrière, ni le personnage féminin.

## Mélangeur vérifié dans le client — 26 septembre 2026

Analyse statique du même exécutable, sans lecture du processus ni modification du
client. **Le mécanisme du moteur est confirmé ; son activation et ses paramètres
sur la réception filmée ne sont pas encore observés directement.**

### Preuves reproductibles

Outil : `tools/s5runtime-trace/inspect-animation-blend.py`. Il vérifie l'empreinte du
client avant de désassembler et résout les imports depuis le fichier PE.
Les sorties restent locales dans `calibration/video-forward-jump/blend/`.

```powershell
python tools/s5runtime-trace/inspect-animation-blend.py 'C:\Users\Baba\Downloads\S5Runtime\s5runtimegame.exe' tools/s5runtime-trace/calibration/video-forward-jump/blend --range prepare:007c9ba0:007c9d80 --range blend-tick:007c97e0:007c9ba0 --range snapshot:007c9ec0:007ca370 --range quaternion-thunk:012a8d96:012a8d9c --range blend-duration:00b78990:00b78a62
```

Python doit pouvoir importer Capstone depuis `tools/s5runtime-trace/.deps`.
Les adresses sont propres à l'empreinte documentée plus haut.

- `CBlendingTransformAnimator`, sélection simple `0x7C8CC0`, prépare la source
  via `0x7C9BA0` avant de sélectionner la nouvelle animation via `0x7C9D80`.
- Transition ordinaire : `0x7C9CDB–0x7C9D27` conserve la piste sortante et son
  temps courant. Dans `0x7C97E0`, **le temps de cette piste continue d'avancer**
  (`0x7C9878–0x7C9884`) ; la piste est rééchantillonnée à ce temps
  (`0x7C999F–0x7C99B0`). Elle boucle ou reste sur sa fin selon son ancien mode.
  Ce n'est donc pas systématiquement un fondu depuis une pose figée.
- Transition interrompue : si un fondu a déjà commencé et n'est pas terminé,
  `0x7C9C32–0x7C9CC8` appelle `0x7C9EC0`. Cette routine évalue le mélange en cours
  et écrit ses transformations dans une source temporaire (`0x7CA310–0x7CA364`),
  utilisée comme départ du nouveau raccord. Cela évite de repartir brutalement
  d'un des deux clips bruts.
- Le poids de la destination est `temps écoulé / durée` (`0x7C990A`), avec une
  progression linéaire dans cette routine. Positions et échelles sont interpolées
  linéairement ; les rotations passent par `0x100E7D0`, puis `0x12A8D96`, puis
  l'import **`d3dx9_29.dll!D3DXQuaternionSlerp`** à `0x139AB00`.
- L'horloge importée à `0x139AA78` est **`winmm.dll!timeGetTime`**. Son delta est
  multiplié par ~4,8 : les durées du mélangeur sont en ticks d'animation à
  4 800/s, pas directement en millisecondes. Une valeur brute de 500 représente
  environ 104 ms, **pas 500 ms** (hors quantification des mises à jour).
- La durée vient des paramètres d'animation : `0xB78990` cherche un réglage
  associé au nom de l'animation courante, sinon utilise le défaut à `+0x38`.
  Il peut donc exister des durées différentes selon la transition. La présence
  d'un paramètre 500 dans une autre branche de saut ne donne pas celle du relevé.

### Conséquence pour S5 et limites

`src/animation-player.js`, `play()`, crée une pose constante via `snapshot()`
pour **chaque** changement avec fondu et arrête l'ancienne action. Ce comportement
diffère du cas ordinaire du mélangeur S5Runtime identifié. Il faut distinguer un fondu
entre deux clips vivants d'un raccord interrompu depuis le résultat courant.

Les vidéos restent compatibles avec une réception quittée vers 300 ms, suivie
d'un mélange vers l'attente. Mais cette analyse **ne confirme pas à elle seule**
le couple exact `00000 → SN002`, la durée propre à ce couple, ni l'absence absolue
d'un autre clip de relevé. L'estimation visuelle 150–200 ms n'est pas promue en
paramètre natif. D'autres traitements du poseur n'ont pas été entièrement étudiés.

Prochaine validation ciblée : retrouver les paramètres de l'état destination
de la réception, puis comparer dans l'atelier le fondu à source vivante et le
fondu à pose figée aux mêmes images des deux vidéos. Aucun nouveau recording
n'est nécessaire pour cette comparaison. **Aucun changement de gameplay ici.**

## Paramètres chargés et chemin de réception vérifiés — complément

Une lecture ciblée du processus S5Runtime déjà ouvert (PID 13524) a maintenant permis
de vérifier les paramètres, en plus du code. Aucune touche envoyée, injection ou
écriture mémoire. Ce relevé n'est **pas** une capture synchronisée avec les vidéos.
La synthèse portable est dans `docs/s5runtime-landing-animation-evidence.json`.

### Résultat pour le retour normal à l'attente dague

| Étape | Réglage natif vérifié |
| --- | --- |
| Réception avec roulade (sous-état 6) | Paramètre 4 : `00000`, vitesse 0,8, départ 0, non bouclé |
| Fondu d'entrée de cette roulade | 100 ticks ≈ 20,8 ms |
| Sortie de l'état de réception | Lorsque le timer dépasse 300 ms, pas à la fin du fichier |
| Attente dague | `SN002`, vitesse 1, boucle, pas de redémarrage forcé |
| Fondu vers cette attente | 1 000 ticks ≈ **208,3 ms**, aucune exception par clip source |
| Source du fondu ordinaire | La roulade continue d'avancer pendant sa disparition |

Cela établit le chemin normal **`00000 → SN002` par mélange**, sans ajout d'un
clip de relevé dans ce chemin. Cela ne prétend pas exclure d'autres chemins
lorsqu'une action, un changement d'arme ou un déplacement intervient.

**Correction importante de l'hypothèse précédente :** 300 ms dans l'état ne
signifient pas une lecture jusqu'à 0,300 s dans `00000`. À vitesse 0,8, cela donne
environ **0,240 s du clip**, plus le dépassement d'un tick de simulation. Pendant
le fondu, l'horloge sortante identifiée dans le moteur avance séparément à 4,8
ticks/ms ; il ne faut pas lui appliquer aveuglément la vitesse 0,8 précédente.
La comparaison antérieure de la pose brute à 0,300 s n'était donc qu'approximative.

### Chaîne de preuves et limites

- Scan frais des instances `CJumpState` (vtable `0x13B58CC`) : 13 correspondances,
  dont une rejetée (vecteur d'animations invalide). Ne jamais sélectionner
  aveuglément la première adresse : celle-ci était précisément le faux candidat.
  Les 12 objets cohérents appartiennent à six acteurs ; les six paramètres de
  saut concordent. L'acteur de vtable `0x13AAFDC`, déjà repéré dans les précédentes
  calibrations, possède les états 8 et 24. Le timer de sa réception précédente
  conserve une limite de 300 ms et un temps final de 311 ms. Cela ne prouve pas
  que cette réception mémorisée est celle de la vidéo.
- La table de branchement à `0x627768` relie le sous-état 6 à `0x62750A`, qui joue
  le paramètre 4. Le sous-état 5 joue le paramètre 3 (`00003`, vitesse 0,8, offset
  brut 500) : ne pas le remplacer par une animation inventée ou inversée.
- La destination mémorisée (`0x13B7F78`, état 4) route l'absence de déplacement
  vers son enfant `+0x118` (`0x6539A4–0x6539DA`). Dans ce relevé, il s'agit du
  sélecteur d'attente `0x13B6500`, état 5.
- Ce sélecteur choisit son enfant selon le type d'arme
  (`0x6364B7–0x6364CD`) puis appelle son entrée (`0x6368FA–0x636911`). Son slot 24
  contient le paramètre `SN002` ci-dessus. Les paramètres sont chargés même si
  l'enfant actuellement sélectionné est celui sans arme : le relevé ne prouve
  donc pas que la dague était équipée au moment de l'inspection.
- L'entrée de cet enfant (`0x62C630`) appelle le paramètre 0 sur le chemin normal
  (`0x62CCBF` et suivants). Le chemin alternatif du paramètre 1 est réservé à un
  autre type : `0x108EE20` teste uniquement `0x26`, pas 24. Aucun clip de relevé
  intermédiaire n'est inséré dans ce chemin normal.
- `0xB78484–0xB7849F` applique la vitesse du paramètre quand aucun ajustement de
  durée n'est demandé, ce qui est le cas de l'appel de réception examiné.
- Les deux vidéos et la planche HD `detail/sheet-001.jpg` restent compatibles avec
  ce raccord court : sortie de rotation puis retour debout sans nouvelle rotation.
  Les ~208 ms sont désormais un **réglage lu**, pas une mesure vidéo. L'occlusion,
  la caméra et l'instant de contact empêchent encore une validation image par image
  précise ; aucun score automatique de similitude n'a été calculé.

### Reproduire le relevé

`tools/s5runtime-trace/inspect-animation-parameters.py` n'ouvre le processus qu'en
lecture, vérifie son exécutable/empreinte et refuse un scan de plus de dix minutes.
Les pointeurs, propriétaires, tailles de vecteurs, chaînes et tables sont vérifiés.
Les adresses de cette session ne sont pas des constantes réutilisables.

```powershell
# Remplacer PID par celui du processus actuel, sans réutiliser 13524 par défaut.
tools/s5runtime-trace/bin/Release/net9.0-windows/S5RuntimeTrace.exe scan-int --pid PID --value 20666572 --out tools/s5runtime-trace/calibration/video-forward-jump/blend/jump-instances.json
python tools/s5runtime-trace/inspect-animation-parameters.py tools/s5runtime-trace/calibration/video-forward-jump/blend/jump-instances.json tools/s5runtime-trace/calibration/video-forward-jump/blend/live-parameters-expanded.json
```

**Prêt pour une correction ciblée S5** : sortie sur la fin d'état, vitesse 0,8,
fondu ordinaire à source vivante vers l'attente dague pendant 1 000/4 800 s,
et continuité conservée lors d'une interruption. Tester ensuite contre les vidéos
et les cancels existants. Cette vérification n'a pas modifié le gameplay.

## Application et vérification dans S5 — 26 septembre 2026

Les sections précédentes décrivent les étapes de recherche avant correction.
La correction de présentation est maintenant appliquée, sans modification de
la physique du contrôleur :

- La réception suit le timer du contrôleur et l'événement `landend` (limite
  native de 300 ms), et non les 500 ms du fichier. Les deux variantes de réception
  sont lues à vitesse 0,8 ; la variante reste choisie au contact.
- Le retour normal de la roulade à l'attente dague utilise 1 000/4 800 s,
  soit 208,3 ms. La source continue d'avancer à sa propre horloge de fondu (1×),
  avec respect du bouclage ou de la fin du clip.
- Lorsqu'un autre fondu est interrompu, la nouvelle transition part de la pose
  visible mélangée, pas d'une reprise du clip précédent. Les pistes temporaires
  sont retirées à la fin du fondu sans supprimer les actions réutilisables.
- Les interruptions par sprint, attaque, saut et dodge restent testées. Leurs
  délais exacts dans S5Runtime ne sont pas pour autant nouvellement mesurés ici.

### Correction du champ historiquement nommé `offsetTicks`

Le champ `CAnimParam +0x3c` n'est **pas un décalage de départ du clip**.
`0xB782B4–0xB782C9` le copie dans le contrôleur `+0x54` après sélection ;
`0x7C7C5D` l'ajoute à la durée du **prochain fondu entrant**.
Le nom de champ est conservé dans le relevé brut pour compatibilité, avec cette
clarification explicite. Pour la réception sans roulade `00003`, les 500 ticks
ajoutés au fondu de `SN002` donnent **312,5 ms**, contre **208,3 ms** après
`00000`. Aucun départ artificiel à 500/4 800 s n'est appliqué.
Les autres paramètres du saut ne sont pas recalibrés par déduction ici.

### Contrôles réalisés

- 740 tests réussis et compilation Vite réussie.
- Tests avec les vrais rigs masculin et féminin à 30, 60 et 144 images/s :
  horloge de réception, absence de saut de pose à l'instant du raccord,
  transformations finies et absence de reprise de la roulade après sa sortie.
- Tests du mélange ordinaire, des interruptions, du bouclage et du nettoyage des
  actions temporaires ; test du supplément de durée du prochain fondu.
- Contrôle visuel navigateur du scénario déterministe
  `?qa=landing-front-idle&t=1.05&weapon=dagger&sex=male&qaView=profile`
  pendant le relevé, puis `t=1.23` debout ; aucune erreur console observée.
  La vue de profil et le masquage de l'adversaire ne concernent que ce mode QA.

Le chemin natif est confirmé et son raccord est implémenté/testé dans S5.
Cela ne constitue pas une validation visuelle 1:1 image par image des deux vidéos,
ni une identification complète des 435 entrées du catalogue.

### Complément : interruption par changement d'arme

`weapon-pose-transition.js` avait conservé un autre comportement : faire avancer
les deux sources avec leur poids figé lors d'une interruption. Cela différait de
la copie de transformations à `0x7C9EC0` déjà documentée. La capture du mélange
générique et celle du changement d'arme conservent désormais les transformations
des os concernés à l'instant de l'interruption. Les canaux non concernés restent
animés, et les raccords ordinaires conservent leur source vivante.

Régression ajoutée sur les changements d'arme rapides et sur le changement en
plein fondu de locomotion. Vérification sur les vrais rigs des deux sexes :
interruption du relevé par sprint, attaque et passage dague → plasma, continuité
de position/rotation à t=0 et absence de reprise de roulade. Dernière suite
complète : 755 tests réussis, compilation réussie. Les timings exacts de ces
interruptions dans S5Runtime ne sont pas nouvellement établis par ces tests S5.

Microbenchmark local existant (107 os, capture ordinaire, pas un profil GPU) :
capture médiane ~0,214 ms, échantillonnage médian ~0,026 ms ; aucune promesse de
framerate global ne découle de cette seule mesure.
