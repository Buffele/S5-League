# Synthèse captures et fidélité S5Runtime — 26 septembre 2026

## Dernière vérification du projet

Suite complète exécutée après les corrections et les nouveaux tests : **787
tests réussis, aucun échec** (`output/edge-final-tests.log`). Construction Vite
réussie. Ce résultat valide les assertions S5 couvertes, pas une reproduction
globale 1:1 de S5Runtime. Aucun push effectué dans cette étape.

## Résultats établis

- **Glissement des bordures : corrigé dans S5.** Un contact latéral sur une
  arête ne suffit plus à immobiliser le personnage comme sur un sol. Le cas
  filmé est reproduit sur les collisions importées de Station 2 ; la chute
  aboutit au quai inférieur. Escaliers, rampes et raccords restent testés.
- **Walljumps de la dernière prise : contacts compatibles.** Les six positions
  physiques capturées autorisent un walljump dans les variantes source et
  modulaire de Station 2. Les positions affichées ne sont pas interchangeables
  avec les positions physiques. Les six essais ne mesurent pas la portée
  maximale et ne constituent pas un replay des entrées de la macro.
- **Réception et raccord d'animation : chemin normal identifié et corrigé.**
  Les paramètres natifs de réception/retour à l'attente et la continuité des
  interruptions sont documentés dans `S5RUNTIME-FORWARD-JUMP-VIDEO.md`. Les tests
  de continuité utilisent les deux rigs ; l'ensemble des variantes/cancels
  S5Runtime n'est pas encore mesuré en situation.
- **Catalogue disponible**, mais pas totalement identifié : 435 entrées,
  associations natives documentées pour 5 clips sur les deux rigs. Ne pas
  présenter les candidats, les références de script et les gestes validés
  visuellement comme un seul statut de confirmation.

## Ce qui reste non prouvé

1. Identité exacte des durées de glissement S5/S5Runtime et ressenti de la correction
   pendant un enchaînement réel. Le test de collision vérifie le résultat,
   pas la correspondance temporelle image par image.
2. Limite supérieure et portée maximale du walljump : il manque une frontière
   réussite/échec comparable. Agrandir les collisions à partir des six seules
   réussites n'est pas justifié.
3. Délai du double Espace de la macro : les entrées Windows ordinaires sont
   visibles, mais les appuis synthétiques des six déclenchements ne le sont
   pas. Les états capturés ne permettent pas de reconstruire ce délai.
4. Catalogue complet des gestes, sonde du clip actif/temps de lecture et
   timings des variantes/cancels. Les sondes existantes de paramètres ne
   prouvent pas le clip effectivement joué à chaque instant.

## Prochaine intervention utile

Pour le problème actuel de bordure, **refaire seulement le même passage dans
S5**, à l'endroit montré dans le dernier clip : toucher le bord en retombant,
puis essayer le walljump habituel. Signaler si le personnage reste accroché
ou si un walljump toujours réussi dans S5Runtime reste impossible dans S5.

Pas besoin de refaire toutes les captures. Si une différence persiste, une
courte vidéo S5 montrant cet essai permettra de cibler la suite ; ne pas
recalibrer arbitrairement la portée ou la gravité avant ce constat.

La capture précédente est terminée et aucun nouvel enregistrement n'a été
lancé. L'objectif de fidélité globale reste incomplet ; cette synthèse n'en
constitue pas une déclaration d'achèvement.

## Références reproductibles

- `tools/s5runtime-trace/EDGE-REACH-ANALYSIS.md` : mesures, limites et correction.
- `tools/probe-edge-walljump.mjs` : comparaison des contacts depuis la capture.
- `tests/fixtures/s5runtime-edge-entries.json` : six cas physiques avec provenance.
- `tests/edge-support.test.mjs`, `tests/imported-maps.test.mjs`,
  `tests/modular-map.test.mjs` : régressions de support et de contact.
- `docs/ANIMATION-CATALOGUE.md` : inventaire, statuts et travail restant.
- `tools/s5runtime-trace/PASSATION-CAPTURE.md` : historique et état des prises.
