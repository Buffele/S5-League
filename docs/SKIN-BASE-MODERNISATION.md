# Modernisation du skin masculin de base

Analyse du 16 octobre 2026. Direction initiale : proposition ImageGen 3, « Urbain ». Le travail porte sur le visuel du personnage, avec conservation du squelette, des animations et du comportement du jeu.

## Import Meshy en cours

### Option RunFast — 18 octobre 2026

Le FBX fourni `Meshy_AI_White_Haired_Athlete_RunFast.fbx` est désormais une
option de présentation distincte, `Meshy · Run Fast`, dans **Settings → Graphics
→ Character animations**. Les deux contrôles permettent de choisir séparément
la course avant au sol et le sprint. Le choix est appliqué immédiatement et
conservé sur cet appareil ; `runStyle=meshy` et `sprintStyle=meshy` permettent
aussi un lien de test. Les autres directions, les sauts, les attaques et les
réceptions conservent leur sélection existante. La vitesse physique reste la
même. Cette option ne remplace pas le choix de style de l'utilisateur.

La source intacte et son inspection sont dans `art/animations/meshy-run-fast/`.
Le SHA256 du FBX est
`b4486666bcaaabddf27ef94debf2949e79e5556d096d334ae939b2b5798a57bf`.
La boucle source dure 0,5 seconde ; elle est échantillonnée à 60 Hz, avec une
fermeture de couture sur ses trois dernières images. Les 23 pistes de corps
sont adaptées aux deux rigs natifs en conservant leurs longueurs. La conversion
est une rotation, avec correspondance Left source → R natif et Right → L.
Le déplacement global est retiré ; le mouvement vertical et le dégagement des
semelles sont conservés. Le moteur conserve les échelles, les doigts et les
attaches d'équipement du sprint natif, recalés sur la durée du nouveau cycle.
Les géométries, poids et squelettes des personnages ne sont pas modifiés.

Reproduction : `tools/inspect-meshy-run-fast.py` dans Blender avec le chemin du
FBX après `--`, puis `tools/import-meshy-run-fast.py`. Les deux JSON runtime
sont `public/assets/animations/meshy-run-fast-{male,female}.json`.
Le FBX de course contenu dans l'ancienne archive du personnage reste une
source distincte ; les paragraphes historiques ci-dessous concernent cet
ancien import.

Validation : 35 tests ciblés réussis (RunFast, styles existants, sprint natif,
attaches après mixer, transitions et cache des actions). Les tests évaluent
les surfaces Meshy et classiques des deux sexes avec Dagger, Plasma et Counter.
Compilation Vite réussie sans recopier les ressources publiques dans le dossier
de contrôle. Captures du jeu principal et des réglages dans
`work/meshy-run-fast/qa/`. Le matériau et les retouches de skin restent ceux du
prototype actuel ; cette adaptation ne certifie pas chaque costume ou état d'arme.

### FBX avec rig reçu le 17 octobre — essai actif

L’archive `Meshy_AI_White_Haired_Athlete_biped (1).zip` contient un FBX personnage, quatre textures PNG 2K et une animation de course séparée. Les originaux sont conservés dans `art/characters/meshy/rigged-source/`. L’inspection trouve 71 os, 16 538 sommets, 15 443 triangles et aucun sommet sans poids. Le FBX utilise le préfixe `smartrig:` avec des noms d’articulations humanoïdes ; aucune hypothèse de compatibilité directe avec le squelette du jeu n’est faite.

Le choix masculin `meshy` utilise désormais ce FBX à la place du premier GLB. `tools/inspect-rigged-meshy.py` conserve une scène source ; `tools/import-rigged-meshy.py` ajuste la surface à la référence native et transfère les poids fournis vers 40 os natifs, avec quatre influences normalisées au maximum. Les matrices inverses sont calculées en double précision à partir des matrices natives. Les os, sockets et clips du jeu restent inchangés. L’animation de course Meshy n’est pas importée. La rotation de coordonnées transforme les noms source Left/Right en R/L natifs ; les contrôles utilisent les positions transformées et les matrices après animation.

La texture de couleur originale est utilisée par le matériau toon existant. Les cartes normales, rugosité et métal sont conservées, sans nouveau rendu PBR. Le fichier éditable est `art/characters/meshy/meshy-native-rig-v2.blend`. Les rapports sont dans `work/meshy-character/rigged/`.

### Corrections de surface et de poids du 17 octobre

`tools/meshy_skin_repairs.py` complète le transfert initial. La géométrie et les poids du corps restent issus du FBX ; les retouches locales concernent 1 369 sommets de mains, 5 488 sommets de chaussures/lacets et 774 sommets de bracelets. Les paumes sont ajustées d’un seul tenant, leur portée est comparée à la surface des gants natifs de la tenue 01 et les directions des doigts sont alignées sur les chaînes natives. Les poids distaux du pouce attribués à tort à des points de paume sont remplacés par des poids anatomiques bornés. Les bracelets ne suivent plus les doigts. Les chaussures conservent leur forme ; elles ne sont plus allongées pour rejoindre un marqueur de fin d’orteil.

La couture centrale du short reçoit jusqu’à deux unités natives de volume supplémentaire sur 321 sommets pour dégager le passage des doigts pendant SN004. Les normales sont lissées entre les doublons de couture UV tout en gardant les cassures franches. Les textures originales restent intactes et ne sont plus recopiées lorsqu’elles sont identiques, ce qui évite plusieurs rechargements inutiles du serveur pendant un ajustement.

Quinze tests ciblés passent : `meshy-character`, `inventory-avatar-preview` et `equipment-rig`. Ils couvrent les poids, les matrices inverses, les clips et attaches après animation, les huit directions, l’inventaire et la non-régression masculin/féminin des ressources existantes. Une régression spécifique contrôle les proportions des chaussures et lance trois rayons sur l’intrusion observée devant le short dans SN004 à 0,3 s. Le build isolé `work/meshy-character/validated-build` passe. Les rendus de contrôle repos/course/attaque/saut/sprint sont dans `work/meshy-character/poses/` ; ils utilisent maintenant aussi les normales réellement déformées du runtime.

Le skin corrigé a été observé dans le lobby principal avec Counter Sword ; capture `work/meshy-character/rigged/main-live.jpg`. **Toujours un essai : la validation visuelle complète en déplacement et combat dans le jeu principal reste à terminer.** Le contrôle du navigateur est intermittent après navigation. Les rendus Blender ne remplacent pas cette validation. Le rig natif n’a que trois chaînes de doigts : annulaire et auriculaire suivent le majeur. La surface ne fournit ni corps caché complet ni vêtements interchangeables.

Lors du premier essai, le contrôle automatique Windows s’était arrêté car il ne pouvait pas identifier l’URL du navigateur avec assez de confiance. Le 17 octobre, le serveur Vite 5174 a également dû être relancé après blocage : plus de 120 000 handles, contre environ 5 000 après exclusion de `work`, `art`, `dist` et `docs` de la surveillance. Le correctif ne désactive pas la surveillance de `src` et `public`.

### Historique — premier GLB et poids locaux, remplacés

L’utilisateur a fourni `Meshy_AI_AnimeBoy3D_1016210956_image-to-3d-texture.glb`. L’original est conservé dans `art/characters/meshy/source.glb` : 363 162 sommets, 671 198 triangles, trois textures JPEG intégrées, aucun squelette ni animation. Une réduction à environ 32 000 triangles est préparée avec la texture de couleur d’origine.

Le choix masculin `meshy` est raccordé au chargeur et à l’inventaire comme essai. Les os et les clips natifs ne sont pas modifiés. Les ressources sont dans `public/assets/characters/meshy/` ; scripts de préparation : `tools/inspect-meshy-character.py`, `tools/rig-meshy-character.py`, `tools/extract-meshy-textures.mjs`.

**Cet essai n’est pas validé pour le jeu.** Le solveur automatique de poids Blender a échoué sur la surface, y compris après soudure des doublons et normalisation d’échelle. Les poids par enveloppes produisent encore des défauts aux mains et aux poignets ; les doigts restent rigides dans cette version. Les captures de contrôle sont des rendus Blender de poses évaluées par le moteur d’animation du jeu, pas des captures du jeu principal. Les tentatives de contrôle du navigateur ont rencontré des timeouts ; elles ne valident aucune observation en jeu.

L’utilisateur signale qu’un rig manuel est disponible dans Meshy. Un FBX texturé avec armature et poids pourra fournir une meilleure base de transfert. Conserver le personnage assemblé, sans Part Splitting ni connecteurs d’impression ; garder les textures et, si possible, une pose A ou T. Aucune nouvelle animation Meshy n’est nécessaire. Après réception, reprendre les poids et les repères depuis ce fichier, puis refaire les contrôles de déformation et l’observation dans le jeu principal avant toute annonce de disponibilité vérifiée.

Le reste de cette fiche conserve l’analyse initiale et son périmètre ; les mesures des tenues 01/02 ne décrivent pas le GLB Meshy.

## Référence et identification des ressources

La référence utilisateur montre des cheveux blancs courts, un visage anime, un T-shirt bleu, un short blanc et bleu, des bracelets noirs et jaunes, des mains nues et des baskets montantes grises, blanches et magenta.

Attention : le chargement par défaut du projet pointe vers `public/assets/s5runtime/outfit-male-01.json`. L’inspection de ses six textures montre un gilet sombre à rayures, un bas clair à rayures, des gants et des chaussures sombres. La tenue 02 présente un autre gilet et des gants. Ces deux exports ne sont donc pas une identification du personnage de la capture. La première identification « tenue 01 » dans le chat est corrigée ici.

Le catalogue local `work/s5runtime-local/private/appearance-catalog.json` donne les pistes suivantes. Il établit les noms et chemins déclarés, pas leur correspondance visuelle exacte avec la capture ni la variante de couleur.

| Zone | Item source candidat | Scène déclarée |
| --- | --- | --- |
| Haut | 1020002, Training M Shirt | model/character/body/26_male_body.scn |
| Bas | 1030002, Training M Pants | model/character/leg/26_male_leg.scn |
| Mains | 1040002, Basic M Hand | model/character/hand/00_male_hand.scn |
| Chaussures | 1050002, Sporty M Shoes | model/character/foot/00_male_foot.scn |
| Visage | 1010003, Sharp m style | model/character/face/00_male_face.scn |
| Cheveux | 1000001, Keen ou 1000012, Spin | model/character/hair/01_male_hair.scn ou 00_male_hair.scn |

Le XML `work/s5runtime-inventory-recovery/preview-sources/xml/_eu_make_character_info.x7` associe effectivement les quatre items vestimentaires et le visage ci-dessus à un preset masculin ; il utilise Keen pour les cheveux. Cela renforce la piste sans prouver l’identité de la capture. Avant transfert de poids depuis ces modèles, extraire et décoder les scènes candidates, résoudre leurs textures et vérifier visuellement chaque pièce et sa couleur. Aucun chiffre de géométrie des exports 01/02 ne doit être attribué à ces candidats.

## Découpage pour la fabrication

Les éléments ci-dessous sont des pièces de travail proposées. Les bras, mains et jambes gauche/droite peuvent être travaillés séparément, puis regroupés en meshes compatibles avec le chargeur ; un membre anatomique n’exige pas un fichier runtime distinct.

| Élément à recréer | Visuel de la direction 3 | Contrainte de raccordement |
| --- | --- | --- |
| Tête, visage, oreilles | Contour du visage plus propre, nez et bouche discrets, yeux ambre expressifs, sourcils précis ; conserver l’identité anime | Conserver position et volume général de la tête ; jonction invisible au cou |
| Cheveux | Mèches blanches sculptées en volumes lisibles, frange et silhouette arrière maîtrisées | Conserver l’attache de tête et sa chaîne locale ; éviter le front et les oreilles |
| Cou et peau du haut du corps | Teinte cohérente avec le visage, volumes simples et ombres propres | Répartir explicitement la peau entre tête et torse après inspection des candidats |
| T-shirt | Coupe légèrement plus structurée, panneaux bleus ton sur ton, découpes angulaires discrètes, col et ourlets nets | Même gabarit aux épaules et au bassin ; déformation souple du torse et des manches |
| Bras et avant-bras gauche/droite | Arrondis plus réguliers, coudes mieux construits, détail sobre | Préserver coudes et poignets, transférer aussi les influences des os auxiliaires du bras |
| Mains gauche/droite | Paumes et doigts plus propres, phalanges et ongles discrets | Préserver les chaînes de doigts existantes et la prise des armes ; ne pas imposer un nouveau rig à cinq chaînes indépendantes |
| Bracelets gauche/droite | Bandes noires nettes et motif jaune lisible | Pièces de travail distinctes de la peau, sans modifier les sockets de main |
| Short | Blanc et bleu, panneaux légèrement asymétriques, plis et coutures sobres | Conserver bassin, entrejambe et dégagement des genoux ; éviter les intersections avec les cuisses |
| Cuisses, genoux et mollets gauche/droite | Volumes de peau continus, genoux plus naturels, cohérence avec les bras | Conserver articulations, longueur des jambes et raccords short/chaussures |
| Chaussures gauche/droite | Montantes grises et blanches, panneaux magenta angulaires, lacets et semelles plus propres | Préserver appui au sol, position des chevilles, longueur utile du pied et flexion des orteils |

Le dos et les parties cachées de la capture sont à concevoir à partir de la direction 3. Ils ne constituent pas une restitution vérifiée des assets originaux.

## Structure technique vérifiée dans le projet

`src/avatar.js` charge séparément `rig-male.json`, l’outfit et les armes. Les six familles vestimentaires sont body, leg, hand, foot, face et hair. Les données runtime sont des scènes converties en JSON avec positions, normales, UV, indices, matrices et poids ; remplacer un PNG ne permet pas à lui seul de refaire les volumes.

Le rig masculin de base contient 107 nœuds et 223 entrées de clips, avant les ajouts d’équipement et les deltas d’animation propres aux armes. Ces 107 nœuds comprennent des os, des auxiliaires et des dummies : ce ne sont pas 107 articulations anatomiques. La tenue 01 compte 9 meshes non vides, 1 910 sommets et 2 275 triangles ; la tenue 02 en compte 6, 2 101 sommets et 2 096 triangles. Ces mesures concernent uniquement ces exports.

Dans la tenue 01, body contient deux meshes et des influences de colonne, bassin, tête, clavicules, bras et os auxiliaires ; leg contient deux meshes avec influences bassin/cuisses/mollets ; hand contient les deux mains et leurs influences d’avant-bras et de doigts ; foot contient deux meshes non vides avec influences pieds/orteils. Visage et cheveux sont rigides dans cet export, sans poids de skinning, et passent par l’attache de tête. Leur répartition exacte en peau/vêtement reste à établir sur les scènes candidates.

Les textures inspectées sont de petite résolution : 256 × 256 ou 128 × 128 pour la tenue 01, 256 × 256 ou 128 × 256 pour la tenue 02 (dimensions exactes par pièce dans le rapport). Le rendu utilise `MeshToonMaterial`, une rampe de trois tons, `DoubleSide`, `alphaTest=.45`, des textures sRGB et `flipY=false`. Les détails d’yeux et de bouche sont présents dans l’atlas du visage. Le format modèle inspecté n’expose pas de morph targets ; aucune animation faciale indépendante n’est établie.

`src/anime-character.js` est un autre personnage procédural, avec veste claire/orange et pantalon sombre. Il ne représente pas le skin demandé et n’est pas la base visuelle à retenir.

## Contrat pour conserver les animations

- Garder noms, hiérarchie et matrices de référence du squelette, y compris os auxiliaires, dummies, MoveBox et sockets d’équipement. Ne pas déplacer les articulations pour épouser le dessin généré.
- Modeler sur la pose de référence réelle. Conserver les conversions SCN du chargeur : pas de nouvelle permutation d’axes, inversion gauche/droite ni transposition des matrices. Le scale actuel est `.006 × 1.3` sur le rig.
- Transférer les poids vers les nouvelles surfaces et corriger les déformations localement. Le chargeur retient les quatre influences positives les plus fortes et les normalise ; aucun sommet ne peut rester sans poids.
- Conserver les matrices inverses de bind cohérentes avec la référence. Pour visage et cheveux, respecter les parents et matrices locales, dont les éventuels dummies intermédiaires, ainsi que BASE et les pistes d’équipement. Vérifier après mise à jour du mixer.
- Garder les animations, leurs canaux haut/bas, leurs IDs, vitesses, fondus, boucles et root motion. Aucun changement dans les contrôleurs, la physique ou les attaches d’armes pour compenser un défaut de modèle.
- Produire de nouvelles UV et textures pour le nouveau modèle. Une cible initiale de 1 024 × 1 024 par famille peut être évaluée, sans la présenter comme un budget validé. Conserver les aplats anime, limiter les ombres peintes trop fortes et réserver la transparence aux zones qui en ont besoin.
- Conserver un ensemble modulaire de six familles compatible avec le chargement existant, avec des sous-meshes supplémentaires seulement lorsque la matière ou la déformation le justifie. Garder le modèle de travail éditable et produire les JSON runtime par conversion.

## Ordre de réalisation et vérification

1. Confirmer les six scènes et variantes correspondant à la capture ; conserver un inventaire et les empreintes des originaux.
2. Préparer une référence de rig et des vues de face, profil et dos aux proportions réelles. Adapter la proposition 3 à ces proportions ; l’image générée ne fournit ni géométrie, ni UV, ni poids.
3. Créer un corps de travail pour les raccords, puis tête/cheveux, T-shirt/bras, short/jambes, mains/bracelets et chaussures. Éviter de conserver des surfaces de peau cachées qui traversent les vêtements.
4. Transférer les poids, vérifier les jointures, puis peindre les textures et exporter une variante séparée sans écraser les tenues actuelles.
5. Comparer les positions des sockets et des contacts des pieds avant/après animation. Inspecter épaules, coudes, poignets, doigts, entrejambe, genoux, chevilles et cou pendant les poses extrêmes.
6. Dans le jeu principal : neutre, huit directions, retour au neutre, marche/course/sprint, sauts et réceptions, attaques, charge, changement d’arme ; contrôler les IDs de clips réellement joués. Les armes portables doivent conserver leurs grips après mixer. Vérifier également le preview d’inventaire.
7. Exécuter les régressions pertinentes (`avatar-cached-rig`, `equipment-rig`, `inventory-avatar-preview`, puis les tests des armes touchées) et le build après intégration. Vérifier la tenue féminine et les autres tenues si le chargeur partagé change. Le modèle féminin n’est pas à recréer dans cette demande.

Cette analyse initiale ne valide pas un nouveau skin en jeu. Les évolutions du chargeur et des assets runtime sont décrites dans la section d’import ci-dessus ; le squelette et les clips natifs restent inchangés.

## Preuves reproductibles

Exécuter `node tools/audit-base-skin.mjs` depuis la racine. Le rapport `work/base-skin-modernization/audit.json` enregistre géométrie, textures et dimensions, influences, matrices, hiérarchie du rig, empreintes SHA256 et candidats du catalogue local. Le catalogue local est facultatif pour régénérer les statistiques runtime.
