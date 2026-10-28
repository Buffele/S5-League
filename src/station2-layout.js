// Editable Station 2 level. Coordinates use game units: X right, Y up, Z depth.
// A module owns its scenery AND collision mesh. position is its pivot;
// rotation is in degrees; scale changes both visuals and physics together.
const piece=(id,label,position)=>({id,label,kind:'prefab',prefab:id,position,rotation:[0,0,0],scale:[1,1,1]});
export const STATION2_LAYOUT={
 version:1,name:'Station 2 · Modular',
 environment:{background:0x001b80,fog:[36,90],deathY:-21.3},
 spawn:{module:'alpha-base',local:[5.7819558,1.3254676,-4.6017664]},
 ball:{module:'train',local:[-.0000007324,.6775386,0]},
 modules:[
  piece('train','Train central et quais intérieurs',[0,6,0]),
  piece('alpha-bridge','Pont central · côté Alpha',[0,10,-12]),
  piece('beta-bridge','Pont central · côté Beta',[0,10,12]),
  piece('alpha-stairs','Escaliers et rampes · Alpha',[9.81,5.8,-7.86]),
  piece('beta-stairs','Escaliers et rampes · Beta',[-9.81,5.8,7.86]),
  piece('alpha-base','Base et plateformes hautes · Alpha',[0,14,-35]),
  piece('beta-base','Base et plateformes hautes · Beta',[0,14,35]),
  piece('alpha-deck','Plateformes centrales · Alpha',[0,5,-15]),
  piece('beta-deck','Plateformes centrales · Beta',[0,5,15]),
  piece('west-route','Passerelles extérieures · Ouest',[-27,3,0]),
  piece('east-route','Passerelles extérieures · Est',[27,3,0]),
  piece('alpha-lasers','Lasers · Alpha',[0,20,-27]),
  piece('beta-lasers','Lasers · Beta',[0,20,27]),
  piece('alpha-goal','Signalétique du but · Alpha',[0,15,-40]),
  piece('beta-goal','Signalétique du but · Beta',[0,15,40]),
  piece('backdrop','Architecture extérieure',[0,0,0]),
  piece('sky','Ciel',[0,0,0]),
 ],
};

// Additional procedural modules can be inserted directly in modules. Examples:
// {id:'training-platform',kind:'box',position:[0,8,25],size:[8,.5,6],color:0x70849b}
// {id:'training-ramp',kind:'ramp',position:[0,8,22],width:3,height:2,length:6}
// {id:'training-stairs',kind:'stairs',position:[0,8,22],width:3,height:2,length:6,steps:8}
// Ramps/stairs start at local Z=0 and rise toward local Z=-length. Stairs have
// a continuous ramp collider; the visible treads never snag the character.
