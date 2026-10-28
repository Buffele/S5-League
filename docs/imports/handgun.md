# Hand Gun — item2010007/type22

18 octobre2026 — les effets du Hand Gun adverse déjà sélectionnable en Free
training passent maintenant par le rendu principal. Un runtime partagé traite
les acteurs une fois par image ; chaque bouche et impact conserve son
propriétaire. Retirer ou réinitialiser un acteur nettoie seulement ses effets.
Les contacts déjà résolus ne sont pas recalculés par cette présentation.
Les rigs M/F et les matrices après mixer sont testés ; le vrai entraînement M/F
confirme les tirs adverses consommés, sans accumulation ni erreur console.
Preuve et limites : `work/s5-main-delivery-20261017/hud-modes/GUN-EFFECTS-BROWSER.json`.
Ce raccordement ne valide ni le timing visuel natif ni la fidélité complète de
l'arme ; la gate nativeReady demeure fermée.

Le cache audio adverse prépare désormais la banque exacte arme/sexe, y compris
si Hand Gun n'est pas dans l'équipement du joueur. Entrée/Start attendent le
décodage sur le contexte partagé ; volume, mute et arrêt incluent ces banques.
Le navigateur M/F observe des sources Hand Gun actives avec joueur Dagger ou
Counter uniquement,25 buffers décodés et les cinq OGG attendus servis en200.
Preuve : `work/s5-main-delivery-20261017/entry-lobby/OPPONENT-AUDIO-BROWSER.json`.
Il s'agit du routage et de la lecture WebAudio, sans comparaison acoustique S5Runtime.
Les voix de victime encore choisies sans identité d'acteur restent à corriger.

15 octobre2026. Adaptateur raccordé à Controller/MotionGraph ; exposition dans
le jeu principal et chemin de contact final à intégrer. Gate natif fermé.

Sources réextraites en lecture seule depuis la copie privée :16 ressources
vérifiées CRC/longueur/SHA, plus5 ressources effets/impacts, sans échec de
décodage. `work/parallel-gameplay-reference/armes/handgun/source-contract.json`
conserve les fonctions exactes, le catalogue et leurs empreintes. L'index
initial demandait aussi xbn/weapon.x7, absent ; le catalogue réel est
xbn/weapon.xml et a été extrait. Archives81–83 non reconnues par cet indexeur,
sans dépendance requise manquante. L'installation originale est intacte.

L'ancien contrat Revolver appelait cette famille type2 : le catalogue actuel
et weapon_attach.x7 établissent type22. Type2 est le Submachine Gun à deux
scènes. Hand Gun : handgun.scn, R_Hand_Dummy/link0, rangement Gun_Dummy,
origine d'attache handgun_Wea_Dummy, bouche handgun_Fire_Dummy.

NormalState : QQ000. RunState lu séparément : Q0014–Q0021 en haut,
00008–00015 en bas ; une frontière sémantique explicite réalise la conversion
latérale S5. Tir : QQ001/QQ002/QQ003, vitesse Lua0.5 ; jambes E0008–E0015 en
mouvement et Q0002 à l'arrêt. Recharge Q0004 demandée3000ms ; clips natifs
14400ticks pour chaque sexe. Jambes mobiles de recharge via RunState :
politique d'arène provisoire héritée du REX, sans observation native Hand Gun.

Les porteurs bip_*0000 n'ont aucun clip Q. Les vrais porteurs male_bip.scn et
female_bip.scn du lot Submachine sont réutilisés après vérification SHA et
longueur. Les30 clips requis sont présents ; les clips déjà dans le rig
gardent leurs données et leurs métadonnées sont comparées au porteur.
Les pistes ajoutées et chaînes de copies sont conservées dans le contrat.
Source assets et meshes ne sont pas retouchés ; les textures sont converties.

StandardRevolver2 : InitLua(260,40,-40,250,400,350), activation150ms,
puissance Power+AdditionalPower, consommation1. Catalogue actuel :8.25,
capacité15, max_ammo−1, cadence2.5, déplacement1.2, précision.03.
L'ancien catalogue EU diffère :8.4 et réserve30, non sélectionné.
L'adaptateur utilise une réserve Infinity explicite. Depuis le22 octobre2026,
le maintien du clic gauche relance un tir à la fin du cycle ; le choix initial
semi-automatique était incorrect pour la commande demandée.
Phase400ms/cooldown350ms et comparaison >= du tir restent une traduction
d'intégration des déclarations Lua, sans mesure native du dispatcher.

Pour API>=2, quatre AddPatternPoint constituent un motif séquentiel, une balle
par activation ; ils ne deviennent pas quatre projectiles simultanés.
La remise du motif après500ms sans tir reste provisoire, puisque l'algorithme
SetPatternRegression(.5,.01) n'est pas certifié. La branche API<2 possède
AddProjectileOffset ; le runtime choisit explicitement la branche API>=2.
Dégâts décroissants4000→8000 avec minimum.2 ; SetCritical(2,0) est conservé
dans la source, sans priorité équipement/armure/critique inventée.

Le Push(100,1600,−5000) est distinct d'un Blow : src/handgun-contact.js expose
la création/avance native avec direction du record, timeFactor et politique
acteur obligatoires. Le harness physique contrôlé est dans
work/parallel-gameplay-reference/physique/reactions/ ; il ne prouve pas
la réception du tir en jeu. Ne pas supposer que direction visée et direction
du record sont identiques. Aucun hold/stun arbitraire n'est ajouté.

17 octobre : raccordement Push aux contacts réels du jeu principal dans
`ranged-victim-push.js` et `TrainingCombat.receiveRifleContact`, également
repris par les contacts multi-acteurs. La branche FRONT du record utilise
l'origine de la géométrie du tir et la position horizontale de la victime,
puis le déplacement source est soumis aux collisions sans écrire une vitesse
Blow ni interrompre l'attaque de la victime. Protections, reset et fin de
condition sont conservés. Les paramètres physiques restent la politique S5
neutre qualifiée issue du snapshot FREE historique ; ils ne constituent pas
une lecture courante de l'acteur natif. Preuves et limites :
`work/ranged-push-direction-20261017/DELIVERY.md`. Comparaison S5Runtime toujours
absente et gate nativeReady inchangé à false.

Effets : weapon_revolver_fire.seq, gun_hit4.seq et gun_hit.seq réextraits,
octet-identiques aux séquences converties partagées. Le runtime Hand Gun
réutilise leurs dépendances empaquetées, toutes empreintes conservées dans
public/assets/s5runtime/handgun/effects/proof.json. Sons : handgun_blast,
revo_reload, smg_dry_fire, player_attack, wall_attack. Leur existence et leur
décodage Ogg ne constituent pas une écoute/comparaison S5Runtime.

Tests historiques du15 octobre : chargeur vide, débit unique retardé, maintien sans rafale à30/60/120Hz,
recharge infinie/finie, annulation avant activation, motif et Push explicites ;
deux vrais rigs,30 clips, huit directions repos/tir/recharge après mixer,
proximité poignée et sommets réellement rendus ; fermeture des effets.
26/26 tests ciblés (dont le raccordement Controller du coordinateur) et
build3.49s réussis ; les logs sont sous armes/handgun/. Aucun navigateur ou client
S5Runtime n'a été lancé pour ce passage. Angles exacts, fondus exhaustifs, HP
logiques, dispatcher/branches et comportement audio/visuel restent à comparer.

Raccordements à l'autre équipe : avatar, main/effects, input/menu/inventaire,
audio et rifle-contact/training-combat. Demande précise dans
work/parallel-gameplay-reference/armes/handgun/integration-requests.md.

## 22 octobre2026 — tir par maintien du clic gauche

Le runtime acceptait uniquement un front de clic. Il accepte désormais aussi
le bouton maintenu quand la phase redevient idle et le cooldown est terminé.
Chaque cycle conserve sa propre activation retardée150ms, sa balle et son
débit unique. Le relâchement empêche le cycle suivant ; un tir déjà accepté
termine son activation. La recharge commune sur chargeur vide reprend ensuite
les tirs si le bouton reste maintenu. Le clic bref reste utilisable.

La phase400ms et le cooldown350ms existants restent issus de la traduction
Lua, sans nouvelle mesure du dispatcher S5Runtime. Ce correctif répond à la commande
rapportée par l'utilisateur ; il ne certifie pas une cadence native exacte.
Gate nativeReady toujours false. Preuves, tests et limites :
`work/handgun-hold-fire-20261022/analysis.md`.
