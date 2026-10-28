// Physical number-row keys: &, é, " on AZERTY; U selects the experimental SMG.
export const WEAPON_SLOTS=Object.freeze({Digit1:'counter',Digit2:'dagger',Digit3:'plasma',Digit4:'breaker',Digit5:'airgun',Digit6:'smashrifle',Digit7:'revolver',Digit8:'semirifle',Digit9:'katana',Digit0:'twinblade',KeyU:'submachinegun',KeyJ:'cannonade',KeyK:'rocketlauncher',KeyH:'handgun',KeyO:'assaultrifle',KeyP:'burstshotgun'});

export function canSwitchWeapon(controller){
  if(controller.fireball)return false;
  const attack=controller.attack;
  if(!attack)return true;
  // Ordered S5Runtime capture: a slot requested under Counter guard must wait.
  // Committing it before Space destroys the guard that launches the dodge.
  // A later slot is blocked once held right re-enters Guard. A pre-Space
  // request still commits on Dodge entry, when the outgoing attack is null.
  if(attack.kind==='guard')return false;
  // User-observed dagger cancel: finish the thrust, skip its recovery.
  if(controller.weapon==='dagger')return attack.phase==='recovery';
  // Capture 21:35:57: Plasma weak and both sword aerial attacks keep an
  // early slot request until state exit. Other sword windows remain unmeasured.
  return false;
}
