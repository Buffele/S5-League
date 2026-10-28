// Temporary, explicit Conquest capability boundary. Do not enter an unported
// weapon attack that cannot yet supply a qualified monster damage/state route.
export const CONQUEST_PLAYABLE_WEAPONS=Object.freeze(['handgun','submachinegun','semirifle','assaultrifle']);
export function conquestPlayableInput(weapon,input){
 if(CONQUEST_PLAYABLE_WEAPONS.includes(weapon))return input;
 // Primary only: its cut has a retained NPC FAN/record route. Rush is a
 // distinct unported state; admitting the cut must not open that action.
 if(weapon==='dagger')return {...input,heavy:false,heavyHeld:false,heavyPressed:false,heavyReleased:false};
 return {...input,light:false,lightPressed:false,lightReleased:false,lightShort:false,lightLong:false,heavy:false,heavyHeld:false,heavyPressed:false,heavyReleased:false};
}
