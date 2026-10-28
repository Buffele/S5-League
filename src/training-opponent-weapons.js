// Training bots remain an S5 test opponent; this does not certify native AI.
export const TRAINING_OPPONENT_WEAPONS=Object.freeze(['counter','handgun','assaultrifle','burstshotgun','heavymachinegun','semirifle','submachinegun','smashrifle','revolver','sigmablade','katana','breaker','twinblade','bat','deathscythe','demonicknuckle','ironboots','assassinclaw','vitalshock']);
export const trainingOpponentWeapon=value=>TRAINING_OPPONENT_WEAPONS.includes(value)?value:'counter';
