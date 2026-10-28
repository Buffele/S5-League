const f=Math.fround;
const required=['readTeamSelector','readPlayerTeamActors','readMonsters','isEligible','isExcludedMonster','readPosition','isActorType165AC64','readVirtual164','visible'];
const bool=(value,label)=>{if(typeof value!=='boolean')throw Error('Explicit native perception boolean required: '+label);return value;};
const list=(value,label)=>{if(!Array.isArray(value))throw Error('Ordered native perception registry required: '+label);return value;};
const byte=value=>{if(!Number.isInteger(value)||value<0||value>255)throw Error('Native perception team selector byte required');return value;};

// Exact GetActorByMinDist6C3E60 candidate assembly/order and float32 XZ²
// reduction. Registry membership, eligibility, exclusions, RTTI/virtual164 and
// visibility remain explicit native producer ports, not geometrical guesses.
export function conquestPawnNearestActor(request,ports){
 if(!required.every(name=>typeof ports?.[name]==='function'))throw Error('Explicit native Pawn perception registry/filter/position ports required');
 const {monster,firstFlag,minDistance,maxDistance,requireVisible,partVisible}=request??{};
 if(!monster)return null;
 if(![firstFlag,requireVisible,partVisible].every(value=>typeof value==='boolean')||![minDistance,maxDistance].every(value=>Number.isFinite(value)&&Number.isFinite(f(value))))throw Error('Exact native nearest-actor arguments required');
 const self=monster.actor??monster;let selector=byte(ports.readTeamSelector(self));
 if(firstFlag){if(selector===1)selector=2;else if(selector===2)selector=1;}
 const candidates=[];
 for(const actor of list(ports.readPlayerTeamActors(selector),'players'))if(actor!==self&&bool(ports.isEligible(actor),'eligible'))candidates.push(actor);
 for(const actor of list(ports.readMonsters(),'monsters')){
  if(actor===self||!bool(ports.isEligible(actor),'eligible'))continue;
  if(byte(ports.readTeamSelector(actor))!==selector||bool(ports.isExcludedMonster(actor),'excluded'))continue;
  candidates.push(actor);
 }
 const component=(actor,key)=>{const value=ports.readPosition(actor)?.[key];if(!Number.isFinite(value)||!Number.isFinite(f(value)))throw Error('Finite native perception position required');return f(value);};
 // Native getter order is Z then X for each origin/candidate. Y is ignored.
 const originZ=component(self,'z'),originX=component(self,'x'),minimum=f(f(minDistance)*f(minDistance)),maximum=f(f(maxDistance)*f(maxDistance));
 let best=maximum,result=null;
 for(const actor of candidates){
  const z=component(actor,'z'),x=component(actor,'x'),dx=f(x-originX),dz=f(z-originZ),distance=f(f(dx*dx)+f(dz*dz));
  if(!(distance>minimum&&distance<maximum&&distance<best))continue;
  if(!partVisible&&bool(ports.isActorType165AC64(actor),'actor-type')&&bool(ports.readVirtual164(actor,0),'virtual164'))continue;
  if(requireVisible&&!bool(ports.visible(self,actor),'visible'))continue;
  result=actor;best=distance;
 }
 return result;
}
