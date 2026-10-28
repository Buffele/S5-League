# Modes du client S5Runtime copié local

Le raccordement local S5 de Touchdown, Deathmatch, Chaser, Battle Royal et Captain, ainsi que les modules Siege en attente de routage principal, est décrit dans [MODES-S5.md](MODES-S5.md), avec ses tests et ses adaptations provisoires. Il est distinct des preuves et codecs du client S5Runtime décrits ici.

Les modules ci-dessous concernent la copie native privée de S5Runtime. Ils ne constituent pas des imports dans S5 League. Le statut exhaustif reste dans `work/s5runtime-local/reports/modes-catalog.json` et `modes-native-evidence.json` : **tous les modes ne sont pas encore complets**.

## Couverture

- 24 identifiants déclarés dans les sources, 17 constructeurs natifs et leurs formats de briefing retrouvés.
- Deathmatch, Touchdown, Practice, BattleRoyal et Captain : codecs/règles de la référence Netsphere adaptés dans `local-modes.mjs`. La présence de ces règles ne remplace pas une partie complète observée pour chaque mode.
- Variantes22/23/24 : alias XML Deathmatch/BattleRoyal/Deathmatch, mécaniques Snowball/GunGame/Duel incomplètes. L’adaptateur les refuse par défaut. Random14 dispose d’une sélection pondérée source ; son cycle de parties reste incomplet.
- Chaser8 : moteur serveur testé pour groupes, éliminations authentifiées, scores, durée, rotation et résultats. Probabilités liées aux familiers, cible bonus et intermission sont des politiques locales explicites. Une partie avec deux vrais clients reste à vérifier.
- Siege11/IronHeart151 : véritable capture native du point3, score individuel/équipe5, sorties core/assist, collectes de bonus score et cycles résultat/reset/replay observés. Contestation, conservation des points, bonus temporels, drops automatiques et rendu de l’UI de résultat restent incomplets. Les autres cartes n’utilisent pas des identifiants de points devinés.

## Chaser : briefing complet et diagnostic natif

`native-chaser-briefing.mjs` encode le suffixe global natif1094640/1094A80, minimum44 octets : rôle, cible bonus, trois scalaires, première manche et trois vecteurs. Les vecteurs4C/50 désignent respectivement les joueurs initialement poursuivis et les survivants (10950C0/1095090/10952D0). Le scalaire+30 demeure opaque et reste0.

La copie réservée PID24040, session085954-9798b1, a accepté le constructeur rôle0/durée0/firstRoundtrue, puis deux initialisations typées avec rôle1, durée60000 et temps67000 puis64000. Preuve : `work/s5runtime-local/private/chaser-complete-briefing-native.json`. Ce diagnostic mono n’est pas une vraie partie : le serveur attend des opposants ; le joueur natif apparaîtstate0 malgré state4 serveur. Ce désaccord est enregistré, sans changer les gates des véritables parties. Sa source est ensuite retrouvée : GameEvent9 porte deux octets après account, et le second change l’état natif (108E060/106D7B0). Le module suit ce report mono ; il ne laisse pas un report supprimer une élimination authentifiée ni réanimer un mort pendant une vraie manche.

## Siege : objets bonus

Sources natives : EE8B30/EE8C80 callbacks3072/3073, 7D91F0 file de drops, 7D9410 positionnement au core du point, 5234D0 application. Les callbacks3074/3075 de conservation ne font rien dans ce client.

Le descripteuru64 est composé de champs signés : pointId4bits, pickupId20bits, effet12bits, valeur12bits, taux16bits en pour cent. Le point est recherché par AEB710 ; AEF240 fournit son core.center. Les effets sont1HP,2SP,3PEN,4EXP,5vitesse,6rechargement,7attaque,8défense,9munitions,10chargeur,11score,12sans effet,13respawn,14régénérationSP,15munitions spéciale. Le dernier n’est pas exposé sans mapping XML établi.

`native-siege-buffs.mjs` fournit des drops typés et consomme C2S2047 uniquement pour un participant authentifié et un descripteur exactement émis. Une collecte ne peut être rejouée ; les identifiants restent monotones après reset. `canCollect` permet une validation serveur supplémentaire ; le raccordement exige vivant et présence core/assist déclarée par vrai2046. Une distance de collecte compétitive certifiée reste à établir.

Le score du buff11 augmente player+C8, total+18, count+D8 et équipe+10. L’autre score d’équipe+1C est le combat (kill2, assist1, healassist1), pas la conservation du point. `addBuffReward` garde le score du buff et les récompenses PEN/EXP séparés des captures.

La copie fraîche PID20816/session091559-c2926e a rejoué toute la route et capturé le point3. Un drop game_score1/pickup1 s’est ensuite matérialisé dans le pool natif ; deux déplacements ont produit le vrai2047 `01ff071300000b10000000` à07:18:47.614Z. Le pool est devenu vide, buffscore/count valent1, total individuel/équipe passe5→6 et combat reste0. Preuves privées `siege-fresh-waypoint-replay-c2926e.json`, `siege-buff-real-pickup-c2926e.json` et son extrait de log. **Seul ce buff score est observé en gameplay**, les autres effets et les drops automatiques restent à vérifier.

Raccordement du sous-ensemble : créer `createNativeSiegeBuffs` avec les vrais pointIds/participants, sender et `onReward: siegeCapture.addBuffReward`, l’activer après loading natif, router2047 avant fallback et le vider au leave/reset/close. Une injection d’ACK ne valide pas le gameplay.

`verify_siege_buff_pickup.py --instance1` réalise aussi un replay borné20s : drop typé au point réellement occupé, lecture des coordonnées du vrai objet, déplacements clavier et constat de son vrai2047. Le second ramassage correspond au descripteurpickup2, paquet `01ff072300000b10000000`, ligne2651 à07:23:18.585Z. Score individuel/équipe7, buffscore/count2, pool vide. Preuve `siege-buff-automated-replay-c2926e.json` ; aucune écriture de position ni appel natif de collecte.

## Siege : briefing et cycle local partiel

`native-siege-round.mjs` construit le briefing11 à partir des ledgers séparés : player40 octets (kills, killassists, healassists, quatre mots opaques0, capture, assistcapture, buff), team8 octets (capture+assist+buff, combat). Le combat est kill2/killassist1/healassist1 ; aucune conservation de point n’est placée dans ce champ. PEN/EXP des buffs restent dans les champs communs de résultat. Sources110F140/110F4A0 et10991B0..1099500.

`createNativeSiegeRound` englobe capture et buffs : `setPlaying(true)` puis `handle(2046/2047,body,sessionAccountId)` et `tick()`. Le loading/countdown reste orchestré par le serveur central. Ce module envoie déjà son briefing11 au début ; ne pas le remplacer ensuite par un briefing générique zéro. `recordCombat` est un raccordement interne pour des événements authentifiés/validés par le serveur ; il n’est pas une preuve de combat natif, ni une commande de score publique.

`finish()` émet3010state3 puis3009resulttrue. Le gagnant est une politique locale explicite (plus grand total, égalité neutre) ; score/time limits déclenchent la même fin locale. La conservation/upkeep reste désactivée. `reset()` remplace les objets et ledgers par des objets neufs, conserve le prochain pickupId monotone, neutralise les points, envoie3010waiting puis briefing score zéro. Les getters `capture`/`buffs` renvoient les nouveaux objets après reset : le raccordement doit les relire, pas conserver les anciennes références.

La neutralisation est3069operation0 gauge0/max30000 puis operation1/team0/account0/récompenses0/helpersvides. SourcesAEB560→AED5D0 etAEBEB0 : owner0 est neutre, compte0 n’a pas de participant auquel attribuer un reward. Operation3 opaque n’est pas utilisée. Les compteursCC/D0/D8 ne figurent pas dans le briefing, mais le callback3009 EDFE30 appelle d’abord briefing.vtable+24→10713D0→player.vtable+4→110EE10 : ce reset effaceA4..D8 avant le decoder110F140. Un briefing de résultat recharge les scores, tandis que ces compteurs non sérialisés restent0. Source complète privée `decompiled-modes/siege_full_briefing_score_reset.asm`.

La copie fraîche PID25128/session093633-696ccc vérifie maintenant ce cycle. Capture réelle5/count1 et buff réel1/count1 donnent total6. Le résultat natifrule3/player2 conserve capture5/buff1/total6 et remetCC/D8 à0 comme prévu. Le reset produitwaitingrule1/player4, tous scores/counters0 et points3/1/2 neutres ; la partie suivante capture réellement5/count1 avec buff0/count0. Preuve `siege-lifecycle-replay-696ccc.json`. Le deuxième cycle laissepickup3 matérialisé mais non ramassé : pool1 avant résultat,0 en résultat/waiting, puis troisième partie fraîche ; nextPickupId4 (`siege-lifecycle-pending-replay-696ccc.json`).

Un reset direct depuis playing, sans résultat préalable, est également vérifié avec pickup5 réellement présent : pool1→0, scores/counters0, owners0, puis quatrième capture native5/count1 après start (`siege-lifecycle-direct-reset-696ccc.json`). Aucune suppression manuelle d’objet natif n’est nécessaire pour ce chemin de lifecycle observé.3010waiting et3009briefing sont deux callbacks séparés : le vérificateur attend rule1 ET player4/scores0 avant de poursuivre, car une lecture entre les callbacks pouvait encore voir l’ancien score/player0. Les commandes clavier respectent le minimum100ms ; `verify_siege_buff_pickup.py --pickup-id 4` permet de reprendre un objet déjà émis après un rejet de durée, sans redrop ni ACK artificiel.

`verify_siege_lifecycle.py` accepte `--pending-score-buff` et `--direct-reset`. Ces preuves sont RAM/protocole et véritables inputs, **pas une validation visuelle de l’UI de résultat**, ni une partie complète avec adversaires. Il reste notamment la contestation/assist avec vrais coéquipiers, upkeep/time bonuses, autres effets/maps et politique de victoire originale.52 tests modes passent au total ; cinq portent sur le cycle serveur Siege.

## Plan exhaustif des modes

`native-mode-availability.mjs` expose `planNativeModeAvailability()` et `planNativeMode(id)` ; `build-native-mode-plan.mjs` sauvegarde `work/s5runtime-local/reports/modes-availability-plan.json`. Les24 modes restent visibles dans ce plan avec les maps/options source, le niveau de raccordement, `unsupportedForCompleteGameplay:true` et les prérequis spécifiques. Aucun n’est déclaré complètement vérifié.

Survival3/Tutorial5/WeaponTraining19/mode21 n’ont pas de constructeur classique retrouvé ; leur chemin d’entrée propre doit être établi. Les noms18/21 restent non vérifiés. SemiTouchdown6 n’a pas de map déclarée dans la table extraite. Scenario7, Conquest12, Training13, Warfare15 et Arena20 ont leur factory/briefing, mais leurs callbacks/objectifs/rounds ne sont pas implémentés. Les variantes16/17/18 utilisent un chemin training : le callback natif3009 ne décode pas leur briefing serveur classique. Un format partagé ne constitue pas un alias. Snowball22/GunGame23/Duel24 ont seulement leurs alias XML explicites et restent refusés par défaut par l’adaptateur. Random14 nécessite encore un véritable cycle et des parties vérifiées des modes sélectionnés ; map993 est un sélecteur, pas une map native byte.
