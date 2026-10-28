// A release/repress within one sample is still a real release. A second
// source continuously holding that direction must not manufacture one.
export function mergeLateralRelease(firstHeld,firstReleased,secondHeld,secondReleased){
 return !!((firstReleased||secondReleased)&&(!firstHeld||firstReleased)&&(!secondHeld||secondReleased));
}
