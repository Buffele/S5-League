# Guide opérationnel des imports d’armes

30 septembre 2026. Point d’entrée pour les prochains imports.
**Phase actuelle : série mêlée lancée explicitement le 3 octobre 2026, après la Plasma Sword. Premier lot : Counter Sword et Spy Dagger, un agent par arme et un agent pour les mécanismes natifs communs ; l'intégrateur garde les fichiers partagés. Priorité : code raccordable depuis les sources actuelles, incertitudes précises, contrôles courts par arme puis régressions/build du lot. Continuer sans confirmation entre armes ; conserver les gates de fidélité natifs.**

**24 octobre 2026 — reprise explicitement demandée : finition des armes de mêlée déjà intégrées, avec priorité aux attaches de la famille Metallic Fist/Demonic Knuckle et aux effets du Katana (charge au clic droit maintenu). Plasma Sword, Spy Dagger et Counter Sword sont validées par l’utilisateur et exclues de ce lot de corrections ; leurs régressions restent protégées si un consommateur partagé change. Livrer des corrections dans le jeu principal, sans transformer les contrôles source en certification visuelle.**

**26 octobre2026 — nouvelle série artistique autorisée :** réaliser les36
variantes proposées et leur sélection par attaque dans l'inventaire, dans
l'ordre Spy Dagger → Counter Sword → Plasma Sword → Bat. Cette autorisation
rouvre explicitement la présentation de ces armes, en conservant leurs
mécaniques et le clic droit Plasma déjà validé. Les sons de frappe et d'impact
doivent rester présents ; l'utilisateur autorise une nouvelle présentation
visuelle des impacts. Un personnage pour les nouvelles observations et une
validation groupée du lot ; aucune certification native déduite des variantes.

## Documents et règles de preuve

**28 octobre2026 — extension des flammes demandée :** choix F Blue Flame pour
les47groupes d'attaques des13armes de mêlée, plus option Keep flames active
hors attaque. Les variantes précédentes, la ruée Plasma et le déploiement OG
Counter restent disponibles ; sons et impacts conservés. Le mode permanent
n'invente aucune attaque. Rapport : `work/weapon-flames-all-20261028/README.md`.

**27 octobre2026 — suite des corrections visuelles demandées :** sélection des
effets dans Échap en partie, catalogue en anglais, auras de contour du maintien
Counter/Plasma avec taille/intensité réglables. Déploiement OG Counter toujours
présent, clic droit Plasma inchangé. Flammes suivies sur le métal équipé,
sans filaments ni ancien sillage dispersé autour du personnage. Rapport :
`work/counter-effects-menu-20261027/README.md`.

**27 octobre2026 — extension artistique demandée :** trois directions propres
à chacune des neuf autres familles de mêlée, déclinées par attaque dans
l'inventaire (102 alternatives supplémentaires,34 groupes). Les27motifs ont
des géométries/mouvements distincts, pas seulement un nom ou une couleur.
Le double déployé du clic maintenu Counter doit rester présent à250ms.
Conserver les composantes structurelles existantes (chaînes Twin, deux formes
Sigma, charges, impacts) jusqu'à une substitution explicite et vérifiée.
Preuves et limites : `work/melee-art-expansion-20261027/README.md`.

**26 octobre 2026 — bibliothèque décodée disponible :** consulter en priorité
le pack fourni par l'utilisateur avant une nouvelle extraction d'archives.
Le lecteur `tools/arsenal-resource-library.mjs` accepte une racine explicite
et une empreinte attendue ; le préparateur des pistes Breaker l'utilise via
`S5_RESOURCE_LIBRARY`. Le pack n'est pas une dépendance du navigateur.
Les ressources absentes et les bindings natifs non établis ne deviennent pas
résolus par la seule disponibilité du pack. Comparaison ciblée et mode d'emploi :
[lot bibliothèque](../work/weapon-polish-20261025/resource-library-batch/README.md).

**Cadence demandée par l'utilisateur,25octobre2026 :** privilégier
l'implémentation par lots de corrections liées, puis les tests globaux/en série
du lot et un seul build. Réserver les tests isolés au diagnostic des bugs qui
bloquent. Ne pas répéter les mêmes contrôles après chaque petit changement.

**Consigne utilisateur plus récente,25octobre2026 :** pour accélérer ce chantier,
effectuer les contrôles sur un seul personnage. Ne plus doubler systématiquement
les captures, essais du Jeu référence et vérifications manuelles selon le sexe.
Cette consigne remplace les exigences M/F de validation de cette série dans les
documents ci-dessous. Conserver les régressions existantes et la disponibilité
des deux personnages ; ne pas supprimer des tests ni changer les rigs pour cela.

**Objectif actualisé par l'utilisateur,25octobre2026 :** finaliser les armes
dans le jeu principal avec tous leurs coups/variantes, placements et attaches,
animations, effets/sons, contacts/réactions et cycle complet joueur/adversaire
sur les deux personnages. Préparer/réutiliser les ressources sans chargements
pendant les coups ni rafraîchissement complet. Comparer des scénarios équivalents
au Jeu référence et capitaliser les erreurs dans le contrat commun et les
fiches. Priorité mêlée ; les trois armes déjà validées restent préservées.

- [Fiche type](imports/MODELE.md) : copier pour chaque nouvelle famille.
- [Katana](imports/katana.md) : import précédent, limites conservées dans sa fiche.
- [Plasma Sword](imports/plasma-sword.md) : famille actuelle, analyse du code et corrections.
- [Contrôles de régression](IMPORT-ARMES-CONTROLES.md) : retours utilisateur transformés en vérifications.
- [Contrat des effets](CONTRAT-EFFETS-ARMES.md) : ancre, orientation, pivots, espaces de particules, suivi et extinction ; obligatoire avant de raccorder les VFX.
- [REX détaillé](IMPORT-ARMES-RETOUR-EXPERIENCE.md) : causes, sources et corrections.
- [ARMES.md](../ARMES.md) : statut courant de chaque famille ; les anciens audits servent uniquement de pistes.

Une preuve doit indiquer source/fonction ou chemin du test/rapport/capture, date et périmètre.
Distinguer **source retrouvée**, **raccordement réalisé**, **test automatique passé**, **observé dans notre jeu**, **comparé à S5Runtime**.
Une capture au repos ne valide pas le maintien ; un build réussi ne valide pas une animation.
Un champ inconnu reste « à établir ». « Sans objet » nécessite une raison tirée des sources.
Une information historique ne constitue pas une nouvelle vérification.

## Parcours par arme

1. **Préparer la fiche.** Identifier famille, item, skin, installation et sauvegarde. Lire séparément NormalState, RunState et chaque état d’action ; attache et attributs de combat. Énumérer primaire, secondaire, combos, charge, aérien, annulations, equip/stow selon les sources, sans les supposer présents.
2. **Établir le contrat.** Pour chaque état : clips haut/bas des deux sexes, boucle, durée/vitesse, mélange, mobilité, fenêtres de contact et événements VFX/audio. Construire les directions depuis les clés sémantiques avec `directionalMapping`. Vérifier les signes des courbes et la conversion d’axes à une seule frontière.
3. **Résoudre les ressources.** Partir des conversions et fragments sauvegardés. Vérifier récursivement modèle → matériaux/textures, séquence → sous-séquences/modèles/textures et sons. Contrôler CRC/longueur à l’extraction et empreintes du résultat. Un ancien index manquant doit être revérifié dans les archives locales. Ne pas modifier l’installation S5Runtime.
4. **Raccorder progressivement.** Adaptateur propre à l’arme, moteur actuel conservé. Ne pas recopier un ancien contrôleur global. Mesurer les sockets après le mixer. Brancher sélection, inventaire, changement d’arme, HUD, modèles, actions, effets, sons et combat dans le jeu principal. Une exposition expérimentale doit être explicitement étiquetée.
5. **Vérifier le fonctionnement.** Exécuter les contrôles applicables du document associé : deux sexes, huit directions, actions et transitions ; collisions, dégâts/réactions, VFX/audio. Observer chaque effet avant, pendant et après l’action. Une page isolée ne remplace pas le jeu principal.
6. **Passer les vérifications techniques.** Tests pertinents, régressions des modules partagés modifiés, build. Actualiser le contrat central pour chaque nouvelle arme ou mapping d’animation et exécuter son test et son vérificateur. Conserver le rapport non prêt ; ne jamais assouplir le gate pour le faire passer.
7. **Publier le bilan et continuer après autorisation initiale de la série.** Fiche, manifeste et ARMES cohérents, preuves et limites explicites, prochaine famille indiquée. Une fois la série lancée, aucune confirmation entre les armes n’est nécessaire.

## Réutilisation : points d’entrée, pas comportements universels

| Besoin | Module / référence existante | Vérification préalable |
| --- | --- | --- |
| Repères, attache | `src/s5runtime-coordinates.js`, `src/equipment-rig.js`, `src/equipment-hierarchy.js` | Hiérarchie source, BASE/pistes explicites, sockets et pose après mixer |
| Actions et jambes | `src/controller.js`, `src/motion-graph.js` | Contrat propre à l’arme ; durées sur chaque sexe |
| Contact mêlée / réaction | `src/training-combat.js`, `src/combat-state.js` | Fenêtres, nombre de coups, impulsion réelle et interruptions prévues |
| Visée / balles | `src/rifle-contact.js`, `src/rifle-dispersion.js` | Nombre d’attaques, motif, portée, dégâts ; récupération 0,5 s actuellement provisoire |
| Particules / trajectoires | `src/native-particle-sequence.js`, `src/revolver-effects.js`, `src/bullet-tracers.js` | Événements, ressources, suivi émetteur/particules ; traceur procédural non certifié natif |
| Sélection / audio | `src/weapon-inventory.js`, `src/weapon-slots.js`, `src/game-audio.js` | Chargement dans le jeu principal, entrées et nettoyage au changement |

## Quand passer à la suivante

**26 octobre 2026 — éviter les reprises redondantes :** avant de rouvrir un
défaut, vérifier sa dernière livraison et le code actif. Une comparaison
native incomplète ou une ancienne mention de blocage ne suffit pas à déclarer
le défaut toujours présent. Garder la correction comme livrée ; ne la rouvrir
qu'avec un nouveau constat reproductible ou une contradiction précise des
sources actuelles. Séparer les défauts à implémenter des validations restantes.

Après **trois tentatives distinctes infructueuses OU 30 minutes sur le même problème sans progrès vérifiable**, arrêter cette piste pour ce passage. Une relance identique n’est pas une nouvelle tentative. Un progrès vérifiable est, par exemple, une ressource authentifiée, un défaut reproduit/localisé ou un test auparavant en échec désormais corrigé ; une nouvelle supposition ne suffit pas.

Consigner début/dernière avancée, hypothèses et résultats, dépendance exacte, impact et condition de reprise dans la fiche. Continuer les sous-tâches indépendantes utiles, puis passer à l’arme suivante ; ne pas contourner la limite en renommant le même blocage. Ne reprendre qu’après une preuve, ressource ou réponse nouvelle. Ce seuil ne limite pas un import qui progresse.

Une demande S5Runtime précise arme/skin, état, commandes, direction, vue, résultat à départager et scénario équivalent préparé dans notre jeu. Continuer les autres armes en attendant. Ne pas lancer de nouvel audit global.
Après la Plasma Sword, choisir la prochaine famille selon les priorités utilisateur et les sources disponibles, sans refaire tout l'inventaire.

## Statuts de sortie

| Statut | Conditions |
| --- | --- |
| Préparée / non démarrée | Fiche créée, aucun raccordement revendiqué |
| En cours | Travail lancé, preuves partielles |
| Jouable avec limites | Boucle de jeu utilisable observée, limites listées ; fonctions essentielles défectueuses exclues, label essais conservé |
| Jouable et vérifiée | Tous les contrôles applicables passés, observations des deux sexes, tests/build et gate prêts, limites natives résiduelles explicitement distinguées |
| Bloquée pour ce passage | Défaut essentiel ou dépendance non résolue ; condition de reprise précise, aucune annonce de jouabilité |

« Native certifiée » n’est jamais déduit de la seule jouabilité.
Un gate non prêt interdit d’annoncer l’intégration prête/terminée ; un essai accessible reste une intégration en cours avec limites.

## Commandes de contrôle

Depuis la racine du dépôt, adapter les tests à la fiche ; ne pas lancer un audit global :

```powershell
node --test work/arsenal-integration/weapon-integration-contract.test.mjs
node work/arsenal-integration/verify-weapon-integration.mjs work/arsenal-integration/weapon-integration-contracts.json work/arsenal-integration --report work/arsenal-integration/native-gate.json
npm run build
```

Lire le résultat de la famille concernée et consigner les autres échecs préexistants séparément. Un code de sortie non nul n’est pas une réussite.
Vérifier enfin que les ressources runtime et leurs dépendances sont présentes dans le dépôt et non ignorées accidentellement ; ne pas créer de commit/push sans demande.
