const f=Math.fround;
// A0A7C0/rule12: Int constant1 and Float constant38, qualified against both
// archived constant_info sources. Count is the current briefing's team1 list.
export const CONQUEST_MONSTER_HP_CONSTANTS=Object.freeze({integer1:1,float38:.75});
export function conquestTeam1Count(briefingParticipants){
 if(!Array.isArray(briefingParticipants))throw Error('Explicit current native briefing participants required');
 let count=0;
 for(const player of briefingParticipants){
  if(!Number.isInteger(player?.team)||player.team<0||player.team>255)throw Error('Explicit native briefing team byte required');
  if(player.team===1)count++;
 }
 return count;
}
export function conquestMonsterInitialHealth(healthRaw16,team1Count){
 if(!Number.isInteger(healthRaw16)||healthRaw16<0||healthRaw16>65535)throw Error('Explicit native monster health word required');
 if(!Number.isInteger(team1Count)||team1Count<0||team1Count>0x7fffffff)throw Error('Explicit native briefing team1 count required');
 const hp=(healthRaw16<<16)>>16,{integer1,float38}=CONQUEST_MONSTER_HP_CONSTANTS;
 // Preserve signed16 input and each SSE float32 rounding, including conversion
 // of the integer difference before multiplication. No clamp or HP rounding.
 const multiplier=f(f(integer1)+f(f((team1Count-integer1)|0)*f(float38)));
 return f(f(hp)*multiplier);
}
