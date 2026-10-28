// Source7B1EB2..7B2045, manager7B5AE0, world11FF0A0, tree12797C0.
// Pure port contract. The Azit host adapter also uses the bounded decision on
// its current S5 static geometry; that does not certify the manager union.
// A subset of admitted faces cannot certify the native prioritized query.
const f=Math.fround;
export const NATIVE_LOWER_SUPPORT_GAP=f(.7);
const vector=(value,label)=>{
 if(!Array.isArray(value)||value.length!==3||!value.every(Number.isFinite))throw TypeError(`Explicit finite ${label} required`);
 const rounded=value.map(f);if(!rounded.every(Number.isFinite))throw TypeError('Native coordinate overflow');return rounded;
};

export function nativeLowerSupportPosition({preSlideNormalized,contactPointNormalizedY,radii,skin}){
 const p=vector(preSlideNormalized,'pre-slide position'),r=vector(radii,'radii');
 if(r.some(x=>x<=0)||![contactPointNormalizedY,skin].every(x=>Number.isFinite(x)&&Number.isFinite(f(x))))throw TypeError('Explicit lower-support contact and skin required');
 p[1]=f(f(contactPointNormalizedY)+f(skin));return p.map((v,i)=>f(v*r[i]));
}

// Each supplied world query must implement its own tree and world90 union.
// Qualification describes the CURRENT world/state, never merely a map name.
export function nativePrioritizedSupportHeight({position,mask,managerFlag20,worldC,world8,category400}){
 position=vector(position,'query position');
 if(!Number.isInteger(mask)||mask<0||mask>0xffffffff||typeof managerFlag20!=='boolean')throw TypeError('Explicit native query mask and manager flag required');
 const incomplete=reason=>({qualified:false,hit:false,height:0,reason});
 if(worldC?.complete!==true||typeof worldC.query!=='function')return incomplete('worldC-unqualified');
 if((mask&0x400)&&(category400?.complete!==true||!Array.isArray(category400.queries)))return incomplete('category400-unqualified');
 // A complete captured tree can still refuse a CURRENT query, for example
 // after an enabled-state callback loses an owner. Never turn that refusal
 // into a geometric miss and let another partition certify the wrong floor.
 const run=(query,input)=>{const result=query(input);if(result?.qualified!==true)return null;if(typeof result.hit!=='boolean'||!Number.isFinite(result.height)||!Number.isFinite(f(result.height)))throw TypeError('Explicit native height query result required');return result;};
 const calls=['worldC'];let result=run(worldC.query,{position,mask});
 if(result===null)return incomplete('worldC-query-unqualified');
 let hit=result.hit,height=hit?f(result.height):0;
 if(!managerFlag20&&!hit){
  if(world8?.complete!==true||typeof world8.query!=='function')return incomplete('world8-unqualified');
  calls.push('world8');result=run(world8.query,{position,mask});if(result===null)return incomplete('world8-query-unqualified');if(result.hit){hit=true;height=f(result.height);}
 }
 if(mask&0x400)for(const query of category400.queries){
  calls.push('category400');result=run(query,{position,initialHeight:height});if(result===null)return incomplete('category400-query-unqualified');if(result.hit){hit=true;height=f(result.height);}
 }
 return {qualified:true,hit,height,calls};
}

export function nativeLowerSupportDecision({queryPosition,returnedHeight,radiusY,float37,hit,qualified}){
 if(qualified!==true)return {stop:false,qualified:false,reason:'incomplete-native-query'};
 const p=vector(queryPosition,'query position');
 if(![returnedHeight,radiusY,float37].every(x=>Number.isFinite(x)&&Number.isFinite(f(x)))||f(radiusY)<=0||typeof hit!=='boolean')throw TypeError('Explicit native lower-support decision inputs required');
 const normalizedGap=f(f(p[1]-f(returnedHeight))/f(radiusY));
 return {stop:hit&&f(float37)>normalizedGap,qualified:true,normalizedGap};
}
