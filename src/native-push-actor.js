// Base actor vtable13aafdc +70 ->51c2f0. Raw Push displacement consumer.
// This prepares ordered position writes; collision setter7b0180 is supplied
// by the caller. All coordinates/limits here use native source units.
// Proof: work/melee-batch-5/push-actor-native.md.
export function nativePushActorWrites(displacement,{horizontalBlocked,horizontalMultiplier,maxDistance}={}){
 if(!Array.isArray(displacement)||displacement.length!==3||!displacement.every(Number.isFinite))throw new TypeError('Three finite source displacement components required');
 if(typeof horizontalBlocked!=='boolean'||![horizontalMultiplier,maxDistance].every(Number.isFinite)||maxDistance<0)throw new TypeError('Explicit native actor policy required');
 const f=Math.fround;
 let [x,y,z]=displacement.map(f);
 // Condition gate1 zeroes horizontal components only. Condition400/gate4
 // multiplies them by its field40; caller supplies that resolved multiplier.
 x=horizontalBlocked?0:f(x*f(horizontalMultiplier));
 z=horizontalBlocked?0:f(z*f(horizontalMultiplier));
 const limit=f(maxDistance);
 if(y>=0||x!==0||z!==0){
  //100B580: separately rounded SSE products, (x²+y²)+z², then sqrt
  // and a float32 store. Math.hypot retains different intermediate precision.
  const length=f(Math.sqrt(f(f(f(x*x)+f(y*y))+f(z*z))));
  if(length>=limit&&length>0){
   const inverse=f(1/length);
   x=f(f(x*inverse)*limit);y=f(f(y*inverse)*limit);z=f(f(z*inverse)*limit);
  }
 }
 // A pure downward delta bypasses the cap. Negative Y is submitted AFTER
 // horizontal motion, using a fresh position read and setter flag1.
 return y<0?[{delta:[x,0,z],flag:0},{delta:[0,y,0],flag:1}]:[{delta:[x,y,z],flag:0}];
}

export function applyNativePushActorWrites(writes,{getPosition,setPosition}){
 if(typeof getPosition!=='function'||typeof setPosition!=='function')throw new TypeError('Native position getter/setter callbacks required');
 for(const {delta,flag} of writes){
  const position=getPosition();
  setPosition(position.map((v,i)=>Math.fround(v+delta[i])),flag);
 }
}
