# Chargement initial des armes et skins — 20 octobre 2026

> **Actualisation :** le comportement ci-dessous est historique et a été remplacé après les freezes signalés par l'utilisateur. La construction automatique des trente personnages, avant le lobby ou en arrière-plan, a été retirée. Le code actuel prépare les slots équipés, précharge les fichiers dans un worker séparé et garde les bundles construits à la demande en mémoire. Voir [le rapport rendu/chargement](PERFORMANCES-RENDU-CHARGEMENT-20261020.md).

## Résultat

Le démarrage normal prépare maintenant toutes les familles installées et disponibles, avec chaque variante déclarée, avant de déverrouiller le lobby. Le personnage actif conserve ses bundles dans le cache existant, indexé par apparence/corps/tenue + arme + variante. Les modèles, textures, animations, effets et compilations de matériaux suivent les mêmes chargeurs qu'une sélection réelle. Aucun gate d'import, tag expérimental, mapping d'animation ou transform d'équipement n'est modifié.

Sur la configuration vérifiée : 24 familles, 30 couples arme/variante, puis 11 préparations d'apparence de personnage. Le rapport final donne 41/41, sans échec de préparation. Le compteur des constructions de bundles reste à 30 après les changements Plasma Sword Classic → Mark II → Meshy → Classic. Le chargement bibliothèque mesuré sur une session était d'environ 36 secondes ; ce n'est pas un benchmark comparatif ni une promesse sur une autre machine.

## Préparation et mémoire

- Les armes déjà équipées sont préparées d'abord. Le catalogue complet rejoint ensuite le même cache ; ces armes ne sont pas construites deux fois.
- Une préparation de bundle à la fois et un retour à la boucle d'événements entre unités évitent de lancer simultanément trente constructions de personnages et compilations GPU.
- Pour les autres skins de personnage, préchargement des JSON de rig/tenue, textures et modules procéduraux dans les caches partagés. Pas de conservation de trente avatars supplémentaires pour chaque sexe et tenue.
- La sélection du corps/type de personnage conserve le redémarrage existant. Ce travail prépare ses ressources ; il n'introduit pas un changement de rig à chaud.
- Les diagnostics isolés conservent leur préparation limitée, sauf demande explicite avec `preloadEquipment` dans l'URL. Le parcours normal précharge le catalogue complet.

## Audio

Les sons sont téléchargés et décodés par un unique OfflineAudioContext silencieux, sans ouverture d'une sortie audio ou contournement du geste utilisateur. Les sons partagés sont dédupliqués entre variantes/familles. Les buffers préparés sont réutilisés au déverrouillage audio. Si OfflineAudioContext est absent, les octets sont anticipés et le décodage reste confié au contexte du jeu.

L'entrée en partie déverrouille maintenant également les banques des variantes qui se trouvent seulement dans le cache, sur le contexte et le bus SFX existants. Les bundles déjà présents dans la map des armes ne sont pas déverrouillés deux fois. La préparation des chemins audio est idempotente, notamment pour Twin Blade.

La ressource HMG `sound/hmg_hit.ogg`, déjà signalée absente dans le contrat existant, reste explicitement absente. Aucun son de remplacement n'a été inventé. Son statut figure dans le rapport audio ; il ne devient pas une fausse validation native.

## Progression et erreurs

Barre accessible et compte des unités réellement préparées. Le libellé indique la famille/variante en cours. Aucun compteur basé sur un délai. Une erreur des ressources initialement équipées garde le démarrage bloqué par le mécanisme existant. Un échec d'une ressource optionnelle est enregistré, n'augmente pas le nombre prêt, et reste réessayable par le cache à la sélection. La navigation hors page annule les unités encore en attente et conserve le teardown existant.

## Preuves

- `work/startup-equipment-20261020/verification.json` : rapport DOM réel, 41/41, 30 bundles prêts et détail audio.
- `work/startup-equipment-20261020/regression.log` : 227 tests ciblés passent.
- `work/startup-equipment-20261020/audio-regression.log` : 123 tests audio passent. Certaines couvertures recoupent le journal précédent ; ne pas additionner les comptes.
- `work/startup-equipment-20261020/build.log` : build réussi.
- Tests dédiés : `startup-equipment-preload`, `avatar-appearance-preload`, `game-audio-preload`, ainsi que l'attente des variantes hors équipement dans le vrai prélude Play.
- Vérification navigateur : démarrage complet, variantes Plasma Mark II/Meshy sans nouvelle construction, retour à Classic et à Spy Dagger, puis entrée réelle dans la salle d'attente sans erreur console. Équipement initial restauré.
