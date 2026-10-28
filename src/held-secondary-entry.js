// Normal/Run input9 USE_WEAPON2 is distinct from BEGIN10 and END11.
// Re-request an eligible secondary at idle; never manufacture press events
// for a running attack's combo handlers, zoom adapters or charge release.
// Existing SP, cooldown, grounded and action gates remain in the Controller.
// Vital Shock/Smash use S5's declared secondary route: their full native
// dispatcher cadence is still unverified. See the held-secondary contract.
const heldEntryWeapons=new Set(['dagger','plasma','counter','katana','breaker','twinblade','demonicknuckle','deathscythe','vitalshock','ironboots','bat','smashrifle']);
export function secondaryEntryRequested(weapon,input,hasActiveAttack=false){
 return !!input.heavy||!hasActiveAttack&&heldEntryWeapons.has(weapon)&&!!input.heavyHeld&&!input.heavyReleased;
}
