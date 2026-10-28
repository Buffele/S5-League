# Helpers de transformation SCN S5Runtime

Les modules partagés `src/s5runtime-scn-transform-source.js`, `src/s5runtime-srt-math.js` et `src/s5runtime-d3dx-scalar-baseline.js` ne dépendent pas de `work/`. Ils sont disponibles pour les consommateurs Anchoring et Sentry ; aucun consommateur Practice/main n'est modifié par ce lot.

```js
import {createTransformSampler11353b0} from './s5runtime-scn-transform-source.js';
import {createSrtBaselinePorts,SRT_POLICY} from './s5runtime-srt-math.js';
const sampler=createTransformSampler11353b0({
  ...createSrtBaselinePorts({policy:SRT_POLICY}),
  writeDestination48: qualifiedMatrixWriter,
  writeLastClock0c: qualifiedClockWriter,
});
const result=sampler.evaluate({
  selectedTrack, clockTicks,
  transitionActive:false, destinationPresent:true,
  selectionProvenance:{source:'Exact selected source KeyData and branch evidence'},
});
```

Chaque port contient `{tick, provenance:{kind:'source-port'|'s5-explicit-adaptation',source:'...'}}` ; il est synchrone. Le consommateur établit la sélection, la présence réelle du transform animator et ses branches. `selectedTrack` est la KeyData exacte avec `position`, `scale`, `rotation`, `positions`, `scales`, `rotations` ; déballer `.data` d'une enveloppe Bone seulement après validation de `copy`. Aucun choix automatique de première animation. `clockTicks` est un uint32 de scène natif ; le sampler ne convertit pas les secondes.

`selectedTrack:null` ne compose ni n'écrit le dernier temps. `destinationPresent:false` conserve la composition et l'écriture du dernier temps. La branche de transition exige le port `applyTransition1135480` ; sa progression utilise le temps source indépendant et ne doit pas être déduite du temps de scène. Le constructeur frais1134B20 avec première sélection/blend0 justifie une transition initiale absente ; blend0 seul ne prouve pas l'absence sur un objet réutilisé.

La recherche unsigned sélectionne le premier temps exact et conserve les défauts avant la première clé. La division0/0 de clés dupliquées produit `branch:'non-finite-native-ratio'`, sans écriture. Les callbacks peuvent échouer après une écriture ; aucun rollback n'est annoncé.

Le modèle mathématique supporte uniquement les centres NULL source, applique l'échelle aux lignes de la matrice quaternion puis la translation. Sa politique explicite est conservée à l'identique pour la traçabilité. Les entrées math sont des float32 exacts ; le sampler arrondit ses calculs aux frontières documentées.

Preuve numérique : `tests/s5runtime-srt-math.test.mjs` compare les48 cas aux bits float32 de la DLL privée d3dx9_29.dll authentifiée, avec gardes ABI/inputs. 40SRT (29 tuples distincts) et8Slerp,672 composants, deux sorties−0 ; égalité stricte. Les fixtures request/native/profile sont épinglées par SHA sous `tests/fixtures/s5runtime-srt-reference/`. Le profil borné identifie les cinq modèles Anchoring utilisés. Il ne qualifie pas automatiquement les tuples Sentry, la parité générale D3DX/x87, le dispatch S5Runtime en jeu, les espaces parent/world, les matériaux, le GPU ou la caméra. Les flags généraux nativeReady restent false.

Sources et promotion : `work/parallel-gameplay-reference/competences/anchoring/model-binding/transform-sampling/srt-math/shared-helper-promotion.json`, revue `SHARED-HELPER-REVIEW.md`, rapport natif `FINAL-CORPUS-REVIEW.md`. Les collecteurs et preuves antérieures sont conservés sans retouche.
