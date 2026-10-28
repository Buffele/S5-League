# Entrées de la copie S5Runtime en arrière-plan

18 octobre 2026. Correctif limité à `tools/s5runtime-local/automation-input.js`.
Preuves : `work/native-background-input-20261018/`.

## Problème et correction

Le lancement silencieux attend la véritable entrée en room avant d'installer
l'adaptateur. La copie peut avoir perdu le focus avant cette installation.
La modification existante du setter18FB7314 force les transitions futures à
laisser l'entrée active, mais ne change pas le booléen déjà désactivé.

Le témoin avant correction montre une commande Q800ms acceptée, le gestionnaire
natif inactif, aucune touche retenue après relâchement, aucun déplacement OBB.
La correction initialise aussi ce booléen lors d'une commande de jeu valide.
Elle vérifie le pointeur renvoyé par l'accesseur natif, sa classe19966918 et une
ancienne valeur strictement0 ou1. Les empreintes existantes du getter et du
setter restent exigées. L'installation initiale et les requêtes d'état ne
parcourent pas le pool global et n'activent pas le gestionnaire.

Le chemin normal sans BackgroundInput, les périphériques physiques, les durées
bornées, l'expiration de session et le relâchement automatique sont conservés.
Une commande invalide, une lecture d'état et Stop ne réactivent rien. Aucun
changement du focus Windows ni réglage système n'est effectué par l'adaptateur.
Le booléen est modifié dans la copie privée en mémoire, pas dans l'installation
de l'utilisateur ni sur le disque.

## Vérification réelle

- Avant : session165540, PID45900, foreground=false, nativeActive=false,
  centre OBB inchangé après Q800ms.
- Après : session165843, PID37364, foreground=false, nativeActive=true,
  centre OBB déplacé de [963.6593,2615.9736,6600.2939] à
  [1839.6450,2583.4429,6588.9463] après le même Q800ms ; toutes les touches
  sont relâchées. Les captures montrent les positions différentes.
- Le parcours normal emprunte ensuite les escaliers et la porte du train.
  Le Fumbi est ramassé par contact spatial : porteur64bits non nul, compteur
  de ramassage1 et total individuel2, avec le message Acquired Fumbi Score.
- L'utilisateur intervient ensuite et marque le Touchdown. Le briefing natif
  indique équipe1 :1, équipe2 :0, total individuel12, but1, ramassage1,
  autres champs de l'extension nuls. Ce but ne vient pas de l'automatisation.
- La tentative Tab finale conserve un vrai maintien et son relâchement, mais
  sa capture ne montre pas le tableau. Elle ne prouve donc pas son ouverture.
  Les12points sont lus dans le briefing natif avec vérification d'intégrité.

Le serveur est le backend local de référence. Cette séquence valide ces deux
contributions sur cette configuration ; elle ne valide pas les catégories de
combat, les assistances ou un serveur officiel. Le témoin normalisé est dans
`tests/fixtures/native/touchdown-objective-points-20261018.json`.

## Utilisation

Utiliser un emplacement de laboratoire disponible et réservé. Exemple depuis
la racine du projet :

```powershell
./tools/s5runtime-local/start-local.ps1 -AutoPlay -AutoPlayMode 2 -AutoPlayMap 66 -Instance 3 -Seconds 600 -QuietStartupDiagnostics -NoEquipmentObservers -RenderDiagnostic -BackgroundInput -NtdllProfile win32-26100-9444-to-9549
```

Attendre la libération des observateurs. `ready=true` signifie que l'adaptateur
est installé ; `nativeActive=null` avant la première entrée peut simplement
signifier que le getter renvoyé n'a pas encore été observé par un thunk.
Après la commande, vérifier nativeActive, le relâchement et le déplacement réel.
Une simple réponse accepted ne prouve pas un mouvement.
