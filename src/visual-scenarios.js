// Deterministic snapshots run the real controller and animation graph. Used
// only with an explicit ?qa= URL; the normal player never enters this mode.
import {TUNING} from './controller.js';
import {SIM_STEP_SECONDS} from './simulation-clock.js';
import {presentationFacing,setAvatarFacing} from './view-orientation.js';
export function runVisualScenario(name,time,c,graph,avatar,afterStep=()=>{}){
  const dt=SIM_STEP_SECONDS,frames=Math.ceil(Math.max(.01,Math.min(4,time))/dt);
  const wallAngle=/^walljump-angle-(-?\d+(?:\.\d+)?)$/.exec(name);
  const diagonalWall=/^walljump-diagonal-(left|right)$/.exec(name);
  const wallScenario=name==='walljump'||name==='walljump-fail'||!!wallAngle;
  const wallView=-Math.PI/2+(wallAngle?Number(wallAngle[1])*Math.PI/180:0);
  c.reset();graph.reset();c.facing=Math.PI;
  // Keep the full Plasma wake and recovery camera clear of the training ramp.
  if(name.startsWith('plasma-rush'))c.position.x=-5;
  if(diagonalWall){c.position={x:-7.2,y:0,z:-3};c.facing=-Math.PI/2;}
  if(c.weapon==='sigmablade'&&name.startsWith('sigma-transformed-')){c.sigmaTransformed=true;name=name.slice('sigma-transformed-'.length);}
  if(name==='fireball-move')c.position={x:-8,y:0,z:9};
  let landed=false;
  if(['air-followup','air-attack','air-dash','air-dash-jump','air-dash-cancel-sprint','air-sprint','air-walk'].includes(name)){c.position.y=['air-sprint','air-dash','air-dash-cancel-sprint'].includes(name)?8:3;c.grounded=false;c.coyote=0;}
  if(name.startsWith('air-dash-slash')){c.position.y=8;c.grounded=false;c.coyote=0;}
  if(name==='katana-air-fall'){c.position.y=22;c.grounded=false;c.coyote=0;}
  if(name==='counter-air-range'){c.position.y=30;c.grounded=false;c.coyote=0;}
  if(name==='art-air'){c.position.y=3;c.grounded=false;c.coyote=0;}
  if(wallScenario){if(name==='walljump-fail')c.energy=0;c.position={x:-8.5+TUNING.radius,y:1,z:-3};c.grounded=false;c.coyote=0;c.facing=wallView;c.normalJump=true;c.jumpOriginY=0;}
  if(['ramp-up','ramp-stop'].includes(name))c.position={x:13,y:0,z:-4};
  if(name==='ramp-down')c.position={x:13,y:3.7,z:-13};
  if(name==='wall-slide')c.position={x:-7,y:0,z:0};
  for(let i=0;i<frames;i++){
    let input={facing:Math.PI};
    if(name==='fireball'||name==='fireball-move')Object.assign(input,{special:i===0,x:name==='fireball-move'?1:0,aimTarget:{x:c.position.x,y:c.position.y+1.5,z:c.position.z-30}});
    if(name==='idle-turn'||name==='mouse-orbit')input.facing=Math.PI+i*dt*2;
    if(name==='front')input.z=-1;
    if(name==='back')input.z=1;
    if(name==='left')input.x=-1;
    if(name==='right')input.x=1;
    if(['left-front','right-front','left-back','right-back'].includes(name))Object.assign(input,{x:name.startsWith('left')?-1:1,z:name.endsWith('front')?-1:1});
    if(name==='rifle-zoom')input.heavyHeld=true;
    if(name==='rifle-fire')Object.assign(input,{light:true,lightPressed:i===0});
    if(name==='handgun-hold-release')Object.assign(input,{light:i*dt<1.2,lightPressed:i===0});
    if(name==='ranged-hold-release')Object.assign(input,{light:i*dt<2.4,lightPressed:i===0});
    if(name.startsWith('rifle-fire-')){
      const direction=name.slice('rifle-fire-'.length);
      const vector={front:[0,-1],back:[0,1],left:[-1,0],right:[1,0],'left-front':[-1,-1],'right-front':[1,-1],'left-back':[-1,1],'right-back':[1,1]}[direction];
      if(vector)Object.assign(input,{light:true,lightPressed:i===0,x:vector[0],z:vector[1]});
    }
    if(name==='rifle-aim-up'||name==='rifle-aim-down')Object.assign(input,{light:true,lightPressed:i===0,aimPitch:name.endsWith('up')?.8:-.8});
    if(name==='rifle-reload-walk'){if(i===0&&c.rifle)c.rifle.ammo=Math.min(10,(c.rifle.capacity||40)-1);Object.assign(input,{reload:i===0,x:-1,z:-1});}
    if(name==='held-attack')input.light=true;
    if(name==='art-cut')Object.assign(input,{lightShort:i===0,light:i===0,lightLong:false});
    if(name==='art-rush')Object.assign(input,{heavy:i===0,heavyHeld:true});
    if(name==='art-air')Object.assign(input,{lightShort:i===0,light:i===0,lightLong:false});
    if(name==='airgun-charge')Object.assign(input,{light:true,lightPressed:i===0});
    if(name.startsWith('rocket-')){
      if(name==='rocket-reload-walk'){if(i===0)c.rocketLauncher.ammo=0;Object.assign(input,{reload:i===0,x:-1,z:-1});}
      else if(name==='rocket-run')Object.assign(input,{x:-1,z:-1});
      else if(name==='rocket-idle'){}
      else if(name.includes('secondary'))Object.assign(input,{heavyHeld:i*dt<(name.includes('fire')?3.5:4),aimPitch:name.endsWith('up')?.8:name.endsWith('down')?-.8:0});
      else Object.assign(input,{light:name.includes('charge')||i*dt<.4,aimPitch:name.endsWith('up')?.8:name.endsWith('down')?-.8:0});
    }
    if(name.startsWith('cannonade-')){
      if(name==='cannonade-zoom'||name==='cannonade-zoom-off')Object.assign(input,{heavy:i===0||name.endsWith('off')&&i===20,heavyHeld:i<8||name.endsWith('off')&&i>=20&&i<28});
      else if(name==='cannonade-idle'){}
      else if(name==='cannonade-run')Object.assign(input,{x:-1,z:-1});
      else if(name==='cannonade-reload'||name==='cannonade-reload-walk'){
        if(i===0)c.cannonade.ammo=1;Object.assign(input,{reload:i===0,...(name.endsWith('walk')?{x:-1,z:-1}:{})});
      }else{
        const hold=name==='cannonade-fire'?.4:2.1;
        Object.assign(input,{light:name.includes('charge')||i*dt<hold,lightPressed:i===0,aimPitch:name.endsWith('up')?.8:name.endsWith('down')?-.8:0});
      }
    }
    if(name==='airgun-fire')Object.assign(input,{light:i<24,lightPressed:i===0,lightReleased:i===24});
    if(name==='airgun-reload')input.reload=i===0;
    if(name==='airgun-reload-walk')Object.assign(input,{reload:i===0,x:-1,z:-1});
    if(name==='strong')Object.assign(input,{lightShort:false,lightLong:i===Math.ceil(.2/dt)});
    if(name==='counter-combo')Object.assign(input,{lightShort:[0,12,48,88].includes(i),lightLong:false});
    if(name==='katana-backdash'||name==='katana-charge')Object.assign(input,{heavy:i===0,heavyHeld:true});
    if(name==='katana-secondary')Object.assign(input,{heavy:i===0,heavyHeld:i*dt<1.4,heavyReleased:i===Math.ceil(1.4/dt)});
    if(name==='katana-combo-turn')Object.assign(input,{lightShort:[0,12,40].includes(i),x:1,z:1,facing:Math.PI+Math.max(0,i*dt-.8)});
    if(name==='katana-dash-strong')Object.assign(input,{jump:i===0,side:1,lightLong:i===Math.ceil(.2/dt)});
    if(name==='katana-air-fall')Object.assign(input,{lightShort:i===0,x:1,z:1});
    if(name==='counter-air-range')Object.assign(input,{lightShort:i===0});
    if(name==='guard')Object.assign(input,{heavy:i===0,heavyHeld:true});
    if(name==='counterattack')Object.assign(input,{heavy:i===0,heavyHeld:true,light:i===12});
    if(name==='sprint'||name==='air-sprint')Object.assign(input,{z:-1,sprint:true});
    if(name==='sprint-stop'&&i*dt<.35)Object.assign(input,{z:-1,sprint:true});
    if(name==='sprint-jump')Object.assign(input,{z:-1,sprint:true,jump:i===32});
    if(name==='air-walk'&&i>=8)Object.assign(input,{z:-1,forwardPressed:i===8});
    if(name==='left-attack')Object.assign(input,{x:-1,light:i===Math.round(.125/dt)});
    if(name==='air-attack')Object.assign(input,{z:-1,light:i===0});
      if(name==='dagger-jump-cut')Object.assign(input,{jump:i===0,light:i===0});
      // Physical edges8ms apart, deliberately sampled on adjacent16ms ticks.
      if(name==='dagger-jump-window')Object.assign(input,{light:i===0,lightPressedAt:i===0?0:undefined,jump:i===1,jumpPressedAt:i===1?.008:undefined});
    if(name==='air-followup')Object.assign(input,{lightShort:i===0||i===16,lightLong:false});
    if(name==='rush-followup')Object.assign(input,{heavy:i===0,lightShort:i===16,lightLong:false});
    if(name==='plasma-slash-jump')Object.assign(input,{lightLong:i===0,jump:i===19,side:1,x:1});
    if(name==='plasma-rush-turn')Object.assign(input,{heavy:i===0,facing:Math.PI+i*dt*3});
    if(name==='plasma-rush')Object.assign(input,{heavy:i===0});
    if(name==='heavy')Object.assign(input,{x:1,heavy:i===0,jump:i===Math.round(.25/dt),side:i===Math.round(.25/dt)?1:0});
    if(name==='dash-left'||name==='air-dash')Object.assign(input,{jump:i===0,side:-1});
    if(name==='dash-right')Object.assign(input,{jump:i===0,side:1});
    if(name==='dash-slash'||name.startsWith('air-dash-slash')){
      const held=!name.endsWith('release')||i<12;
      Object.assign(input,{jump:i===0,side:held?1:0,x:held?1:0,lightShort:i===8,lightLong:false});
    }
    if(name==='dash-jump'||name==='air-dash-jump')Object.assign(input,{jump:i===0||i===8,side:1,x:i<8?1:0});
    if(name==='air-dash-cancel-sprint')Object.assign(input,{jump:i===0||i===8,side:i<8?1:0,z:i>=8?-1:0,sprint:i>=8,forwardPressed:i===8});
    if(name==='jump-turn')Object.assign(input,{jump:i===0,facing:Math.PI+i*dt*8,z:-1});
    if(name.startsWith('jump-'))Object.assign(input,{jump:i===0,z:name==='jump-back'?1:name==='jump-front'?-1:0,x:i<3?0:name==='jump-left'?-1:name==='jump-right'?1:0,side:i<3?0:name==='jump-left'?-1:name==='jump-right'?1:0});
    if(wallScenario)Object.assign(input,{x:-1,facing:wallView,forwardHeld:true,jump:i===2});
    if(diagonalWall)Object.assign(input,{facing:-Math.PI/2,x:i<65?-Math.SQRT1_2:0,z:i<65?(diagonalWall[1]==='left'?-1:1)*Math.SQRT1_2:0,forwardHeld:i<65,side:i<65?(diagonalWall[1]==='left'?-1:1):0,jump:i===5||i===15});
    if(name==='ramp-up'||(name==='ramp-stop'&&i*dt<.65))input.z=-1;
    if(name==='ramp-down')Object.assign(input,{z:1,facing:0});
    if(name==='wall-slide')Object.assign(input,{x:-1,z:-1});
    if(name==='landing-front-idle')Object.assign(input,{jump:i===0,z:landed?0:-1});
    const events=c.step(dt,input);if(events.includes('land'))landed=true;
    graph.events(events);avatar.motion(graph.sample(c,dt));avatar.update(dt);
    avatar.group.position.set(c.position.x,c.position.y,c.position.z);setAvatarFacing(avatar.group,presentationFacing(c,c.facing,false));
    avatar.wallPose?.update(dt,c);
    afterStep(dt);
  }
  avatar.group.position.set(c.position.x,c.position.y,c.position.z);setAvatarFacing(avatar.group,presentationFacing(c,c.facing,false));
}
