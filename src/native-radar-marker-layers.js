// Pinned PE6bea9d8c: 008EF490 quad, 008EE430 frame, 008ED0F0/008EE2C0 markers.
// Inputs remain native screen coordinates/raw actor methods; no S5 camera,
// rule/team/liveness substitution or map-profile selection is owned here.
const f=Math.fround;
const gray=f(.333);
const scalar=(value,label)=>{if(!Number.isFinite(value)||!Number.isFinite(f(value)))throw TypeError(`Finite float32 ${label} required`);return f(value);};
const flag=(value,label)=>{if(typeof value!=='boolean')throw TypeError(`Explicit raw ${label} boolean required`);return value;};
const byte=(value,label)=>{if(!Number.isInteger(value)||value<0||value>255)throw TypeError(`Explicit ${label} byte required`);return value;};
const point=value=>{if(!Array.isArray(value)||value.length!==2)throw TypeError('Explicit source screen XY required');return value.map((v,i)=>scalar(v,'screen '+i));};
const rgba=value=>{if(!Array.isArray(value)||value.length!==4)throw TypeError('Explicit source RGBA required');return value.map((v,i)=>scalar(v,'color '+i));};
const id48=(value,label)=>{if(typeof value!=='bigint'||value<0n||value>0xffffffffffffn)throw TypeError(`Explicit ${label} unsigned48 required`);return value;};

export const NATIVE_RADAR_SPRITE_UV=Object.freeze([[0,0],[0,1],[1,1],[1,0]].map(Object.freeze));

// Signed truncation toward zero follows CDQ/SUB/SAR, including odd sizes.
export function nativeRadarMarkerQuad({center,width,height,color}){
 const [x,y]=point(center);
 for(const [name,size]of Object.entries({width,height}))if(!Number.isInteger(size)||size<1||size>0x7fffffff)throw TypeError('Positive native int32 '+name+' required');
 const left=f(f(x-f(Math.trunc(width/2)))-.5),top=f(f(y-f(Math.trunc(height/2)))-.5),right=f(left+f(width)),bottom=f(top+f(height));
 return {corners:[[left,top],[left,bottom],[right,bottom],[right,top]],uv:NATIVE_RADAR_SPRITE_UV,color:rgba(color)};
}

// The frame uses source rectangle coordinates directly; it does NOT call
// 008EF490 and therefore has no marker half-pixel subtraction.
export function nativeRadarFrameQuad({left,top,width,height}){
 left=scalar(left,'left');top=scalar(top,'top');width=scalar(width,'width');height=scalar(height,'height');if(width<=0||height<=0)throw RangeError('Positive source frame dimensions required');
 const right=f(left+width),bottom=f(top+height);return {texture:'skin',corners:[[left,top],[left,bottom],[right,bottom],[right,top]],uv:NATIVE_RADAR_SPRITE_UV,color:[1,1,1,1]};
}

// Concrete actor vtable13AAFDC +44=005192B0; +1C4=00530650.
export function nativeRadarActor44({protected154,component1CPresent,componentSlotB0}){
 const enabled=byte(protected154,'actor154')!==0;if(!enabled)return false;
 if(!flag(component1CPresent,'actor1C presence'))return false;
 return byte(componentSlotB0,'component slotB0')!==0;
}
export function nativeRadarActor1C4(protected1AA){return byte(protected1AA,'actor1AA')!==0;}

// 008928B0 order: collection order, optional self skip, RTTI165AC58, slot210.
// RTTI and slot210 consumers are owned by the separately qualified subject port.
export function collectNativeRadarActors({actors,subject,includeSubject}){
 if(!Array.isArray(actors))throw TypeError('Current native actor collection required');flag(includeSubject,'includeSubject');const result=[];
 for(const actor of actors){if(!includeSubject&&actor===subject)continue;if(!actor||typeof actor!=='object')throw TypeError('Native actor record required');if(!flag(actor.type165AC58,'actor RTTI165AC58'))continue;const raw=byte(actor.slot210,'actor slot210');if(raw===0||raw===1)result.push(actor);}
 return result;
}

// Actual two-pass order and tint branch of 008ED0F0. Position projection and
// range exclusion must come from the qualified source projection port.
export function nativeRadarNearbyMarkerLayers({actors,modeByte,rule8TargetId}){
 if(!Array.isArray(actors))throw TypeError('Qualified collected actors required');byte(modeByte,'rule mode');const draws=[];
 for(let pass=0;pass<2;pass++)for(const actor of actors){
  if(flag(actor.slot1C4,'actor slot1C4'))continue;const active=flag(actor.slot44,'actor slot44');if(active!==(pass===1))continue;
  let color=pass===0?[gray,gray,gray,1]:[1,1,1,1];
  if(pass===1&&modeByte===8&&id48(actor.id48,'actor id')===id48(rule8TargetId,'rule8 target'))color=[0,1,1,1];
  if(flag(actor.rangeExcluded,'native range exclusion'))continue;
  draws.push({texture:'white',...nativeRadarMarkerQuad({center:actor.screen,width:8,height:8,color})});
 }
 return draws;
}
export function nativeRadarLocalMarkerLayer({rangeExcluded,screen,slot44}){
 if(flag(rangeExcluded,'local range exclusion'))return null;const active=flag(slot44,'local slot44');return {texture:'me',...nativeRadarMarkerQuad({center:screen,width:10,height:10,color:active?[1,1,1,1]:[gray,gray,gray,1]})};
}

// The arrow's source rotation/projection must supply the four resulting screen
// vertices. This renderer does not turn an unqualified S5 yaw into an arrow.
export function nativeRadarDirectionLayer({corners}){
 if(!Array.isArray(corners)||corners.length!==4)throw TypeError('Four source arrow screen corners required');return {texture:'direction',corners:corners.map(point),uv:NATIVE_RADAR_SPRITE_UV,color:[1,1,1,1]};
}
