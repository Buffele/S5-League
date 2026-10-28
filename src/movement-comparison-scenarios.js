import {TUNING} from './movement-profile.js';
// Shared executable input contract for Controller and the owner's native lab.
const floor={minX:-100,maxX:100,minY:-1,maxY:0,minZ:-100,maxZ:100};
const frontal={minX:-100,maxX:100,minY:0,maxY:30,minZ:TUNING.radius+.02,maxZ:TUNING.radius+.12};
const lateral={minX:TUNING.radius+.02,maxX:TUNING.radius+.12,minY:0,maxY:30,minZ:-100,maxZ:100};
// First tick start at/after the requested event, exactly once even when a
// preceding long native tick is followed by a short one.
const pulse=(t,at,dt,previousTickStart=t-dt)=>t>=at-1e-9&&previousTickStart<at-1e-9;
export const MOVEMENT_SCENARIOS=Object.freeze([
  {id:'forward-run',duration:2,walls:[],input:t=>({z:1,forward:1,forwardHeld:true,facing:0})},
  {id:'forward-sprint',duration:2,walls:[],input:t=>({z:1,forward:1,forwardHeld:true,facing:0,sprint:true})},
  {id:'stationary-jump',duration:1.5,walls:[],input:(t,dt,previous)=>({jump:pulse(t,.1,dt,previous),facing:0})},
  {id:'jump-air-steer',duration:1.5,walls:[],input:(t,dt,previous)=>({jump:pulse(t,.1,dt,previous),x:t>=.25?1:0,side:t>=.25?1:0,facing:0})},
  {id:'jump-air-dodge',duration:1.5,walls:[],input:(t,dt,previous)=>({jump:pulse(t,.1,dt,previous)||pulse(t,.28,dt,previous),x:t>=.28?1:0,side:t>=.28?1:0,facing:0})},
  {id:'frontal-walljump',duration:2,walls:[frontal],input:(t,dt,previous)=>({jump:pulse(t,.1,dt,previous)||pulse(t,.25,dt,previous),z:1,forward:1,forwardHeld:true,facing:0})},
  // This is a requested comparison of forward travel ALONG a right wall after
  // jumping, not evidence that the existing rebound implements native wallrun.
  {id:'right-wall-forward-run-after-jump',duration:2,walls:[lateral],input:(t,dt,previous)=>({jump:pulse(t,.1,dt,previous)||pulse(t,.25,dt,previous),z:1,forward:1,forwardHeld:true,facing:0})},
]);
export function movementScenarioWorld(scenario){return {spawn:{x:0,y:0,z:0},colliders:[floor,...scenario.walls]};}
