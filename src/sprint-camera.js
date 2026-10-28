import {BASE_FOV} from './input.js';

// S5Runtime capture-20260923-191147-828660: vertical projection FOV 90 -> 110 -> 90.
// Native camera 0x766237/0x766242: tick milliseconds * .01, clamped to 1.
// 0x766622-0x766672 then lerps the angle using this value * camera[0x15c].
// Captured camera[0x15c] is .5 both during sprint and on exit.
export const SPRINT_CAMERA=Object.freeze({rest:BASE_FOV,sprint:110,timeScale:10,response:.5});

export function updateSprintFov(camera,dt,sprinting){
  if(!Number.isFinite(dt)||dt<=0)return;
  const target=sprinting?SPRINT_CAMERA.sprint:SPRINT_CAMERA.rest;
  const amount=Math.min(1,dt*SPRINT_CAMERA.timeScale)*SPRINT_CAMERA.response;
  const next=camera.fov+(target-camera.fov)*amount;
  if(next!==camera.fov){camera.fov=next;camera.updateProjectionMatrix();}
}
