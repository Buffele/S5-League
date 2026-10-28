// Native 010D17D0 -> 010D1DD0: HUD points are a signed32-bit projection of
// combat counters, independent of the common score used by local match rules.
export function battleRoyalDisplayedScore(player){
 if(!player)return null;
 return (Math.imul(player.kills,2)+player.killAssists+Math.imul(player.bonusKills,5)+player.bonusKillAssists+Math.imul(player.leaderKills,2)+player.leaderKillAssists)|0;
}

// Numeric suffix of native comparator010D1810. S5's local participants have
// no native briefing metadata (status+10 and protected byte+7 precede this
// suffix), so this is not a complete native participant-order implementation.
// Fully equal local entries retain Map insertion order through stable sort;
// native list insertion order on exact ties has not been established.
export function compareBattleRoyalParticipants(a,b){
 return ((b.score|0)-(a.score|0))
  || battleRoyalDisplayedScore(b)-battleRoyalDisplayedScore(a)
  || ((Math.imul(b.bonusKills,2)+b.leaderKills)|0)-((Math.imul(a.bonusKills,2)+a.leaderKills)|0)
  || ((b.killAssists+b.bonusKillAssists+b.leaderKillAssists)|0)-((a.killAssists+a.bonusKillAssists+a.leaderKillAssists)|0)
  || ((a.deaths+a.bonusDeaths)|0)-((b.deaths+b.bonusDeaths)|0);
}
