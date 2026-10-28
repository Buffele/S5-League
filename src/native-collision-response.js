// Source response port, 7B11C0, in PE SHA256
// 6bea9d8cc2503a1e660c1d8a9dfd1241f394207c4f1cb84a9d4a1fea3d3c8017.
// One call represents ONE already-batched native movement operation. Current
// queries/worlds and callsite batching remain explicit caller contracts;
// this module does not claim runtime parity or choose a frame cadence.
import {nativeLowerSupportPosition,nativeLowerSupportDecision} from './native-lower-support.js';
const f=Math.fround;
export const NATIVE_CONTACT_MARGIN=f(.015);
const vector=value=>{
  if(!Array.isArray(value)||value.length!==3||value.some(n=>!Number.isFinite(n)||!Number.isFinite(f(n))))throw new TypeError('Expected finite float32 vector');
  return value.map(f);
};
const sub=(a,b)=>a.map((v,i)=>f(v-b[i]));
const add=(a,b)=>a.map((v,i)=>f(v+b[i]));
const scale=(a,s)=>a.map(v=>f(v*s));
// 100AF90 and 100B580: separately rounded products, then (x+y)+z.
const dot=(a,b)=>f(f(f(a[0]*b[0])+f(a[1]*b[1]))+f(a[2]*b[2]));
const length=a=>f(Math.sqrt(dot(a,a)));
const normalize=a=>{const n=length(a);return n===0?a:scale(a,f(1/n));};

// 7B195D..7B1A2B. distance is the solver's DOUBLE nearest distance in
// ellipsoid space, not a sweep fraction or world distance. Keep its precision
// for the comparison; cvtsd2ss happens only after distance > margin.
export function nativePreSlide(origin,displacement,distance,margin=NATIVE_CONTACT_MARGIN){
  origin=vector(origin);displacement=vector(displacement);margin=f(margin);
  if(!Number.isFinite(distance)||distance<0||!Number.isFinite(margin)||margin<0)throw new RangeError('Invalid contact distance/margin');
  const n=length(displacement);
  if(n===0)throw new RangeError('Pre-slide requires a nonzero displacement');
  const advanced=distance>margin;
  const fraction=advanced?f(f(f(distance)-margin)/n):0;
  return {position:advanced?add(origin,scale(displacement,fraction)):origin.slice(),fraction,advanced};
}

// 7B207F..7B2303, entered ONLY after the native category/support branches
// permit sliding. The plane is formed from preSlide-contactPoint; the next
// delta is projectedDestination-contactPoint, not projected remaining travel.
export function nativeSlideContinuation(origin,displacement,preSlide,contactPoint,{descending=false}={}){
  origin=vector(origin);displacement=vector(displacement);preSlide=vector(preSlide);contactPoint=vector(contactPoint);
  const destination=add(origin,displacement);
  const normal=normalize(sub(preSlide,contactPoint));
  const planeDistance=f(dot(normal,destination)-dot(normal,contactPoint));
  const projectedDestination=sub(destination,scale(normal,planeDistance));
  const remaining=sub(projectedDestination,contactPoint);
  const alignment=dot(normalize(displacement),remaining);
  const reason=alignment<0?'reverse':descending&&remaining[1]>0?'upward':'continue';
  // The upward branch sets the ground flag and RETURNS preSlide immediately.
  // It does not recurse with a Y-clamped delta.
  return {normal,projectedDestination,remaining,alignment,reason,stop:reason!=='continue',grounded:reason==='upward'};
}

//7B1B29..1DA4. Shared by the complete source operation and the existing S5
// world solver's player-body branch; ordinary world response stays separate.
export function nativeActorContactContinuation({origin,displacement,preSlide,point,normal,descending,iterations,float13,responseMask}){
 origin=vector(origin);displacement=vector(displacement);preSlide=vector(preSlide);point=vector(point);
 if(typeof descending!=='boolean'||!Number.isInteger(iterations)||iterations<1||!Number.isFinite(float13)||!Number.isInteger(responseMask))throw TypeError('Explicit actor contact response policy required');
 if(descending&&(iterations>1||f(float13)>f(preSlide[1]-point[1])))return {reason:'special-support',stop:true,grounded:true};
 if(!(responseMask&0x1000))return {reason:'special-category-stop',stop:true,grounded:false};
 normal=vector(normal);
 const destination=add(origin,displacement),travel=scale(normalize(displacement),length(sub(destination,preSlide)));
 const remaining=sub(travel,scale(normal,dot(travel,normal)));
 if(descending&&remaining[1]>0)remaining[1]=0;
 return {reason:'special-slide',stop:false,grounded:false,remaining};
}

const finiteFloat=(value,label)=>{
  if(!Number.isFinite(value)||!Number.isFinite(f(value)))throw TypeError(`Explicit finite ${label} required`);
  return f(value);
};
const uint=(value,label)=>{
  if(!Number.isInteger(value)||value<0||value>0xffffffff)throw TypeError(`Explicit uint32 ${label} required`);
  return value;
};

// +6AC is a response POLICY mask; +C accumulates improving-hit categories,
// and table[+8] names the active entry. These are three distinct fields.
// Coordinates are ellipsoid-normalized except the lower-support query.
export function nativeCollisionResponse({origin,displacement,radii,skin,
  maximumIterations,initialIterations,descending,grounded,solverMask,globalMask,responseMask,
  float1,float13,float37,float42,queryContact,queryLowerSupport}){
  origin=vector(origin);displacement=vector(displacement);radii=vector(radii);
  skin=finiteFloat(skin,'skin');
  if(skin<=0||radii.some(n=>n<=0))throw RangeError('Positive native skin and radii required');
  maximumIterations=uint(maximumIterations,'maximum iterations');
  let iterations=uint(initialIterations,'initial iterations');
  solverMask=uint(solverMask,'solver mask');globalMask=uint(globalMask,'global mask');responseMask=uint(responseMask,'response policy mask');
  if(typeof descending!=='boolean'||typeof grounded!=='boolean')throw TypeError('Explicit descending and grounded flags required');
  float1=finiteFloat(float1,'Float1');float13=finiteFloat(float13,'Float13');
  float37=finiteFloat(float37,'Float37');float42=finiteFloat(float42,'Float42');
  if(typeof queryContact!=='function')throw TypeError('Explicit qualified contact query required');
  const mask=(solverMask&globalMask)>>>0,trace=[],contacts=[];
  let nearestDistance=null;
  const finish=(position,reason)=>({qualified:true,position,grounded,iterations,nearestDistance,reason,contacts,trace});
  const refuse=reason=>({qualified:false,position:null,grounded:null,iterations,reason,contacts,trace});
  // Tail-call form: native recursion shares its counter across all contacts.
  for(;;){
    // 7B11F2..1230: STRICT skin² > length², before the limit or query.
    if(f(skin*skin)>dot(displacement,displacement))return finish(origin,'below-skin');
    const destination=add(origin,displacement);
    if(iterations>=maximumIterations)return finish(origin,'iteration-limit');
    iterations++;
    const result=queryContact({origin:origin.slice(),displacement:displacement.slice(),radii:radii.slice(),mask,iteration:iterations});
    if(result?.qualified!==true)return refuse('contact-query-unqualified');
    if(typeof result.hit!=='boolean')throw TypeError('Explicit contact hit flag required');
    if(!result.hit){
      // 7B2349 consumes skin on a miss too, once per actual native call.
      const n=length(displacement),fraction=f(f(n-skin)/n);
      trace.push({iteration:iterations,branch:'free-travel'});nearestDistance=-1;
      return finish(add(origin,scale(displacement,fraction)),'free-travel');
    }
    if(!Number.isFinite(result.distance)||result.distance<0)throw TypeError('Explicit nonnegative DOUBLE contact distance required');
    const point=vector(result.point);
    const activeCategory=uint(result.activeTableCategory,'active table category');
    nearestDistance=result.distance;
    const preSlide=nativePreSlide(origin,displacement,nearestDistance,skin).position;
    const entry={iteration:iterations,distance:nearestDistance,point,activeTableCategory:activeCategory,preSlide};
    contacts.push(entry);
    // 7B1A30 compares Float1 as DOUBLE, only inside/equal to skin.
    if(nearestDistance<=skin&&float1>nearestDistance&&activeCategory!==0x1000){
      grounded ||= descending;nearestDistance=0;entry.branch='near-contact';
      trace.push(entry);return finish(preSlide,'near-contact');
    }
    if(activeCategory===0x1000){
      const step=nativeActorContactContinuation({origin,displacement,preSlide,point,normal:result.normal,descending,iterations,float13,responseMask});
      entry.branch=step.reason;if(step.remaining)entry.remaining=step.remaining;trace.push(entry);
      if(step.stop){grounded||=step.grounded;return finish(preSlide,step.reason);}
      origin=preSlide;displacement=step.remaining;continue;
    }
    // 7B1DD4 covers ANY ordinary contact, including faces. Test pre-slide,
    // never the initial center or the exact time-of-impact position.
    if(descending){
      if(iterations>1||f(preSlide[1]-point[1])>float42){
        grounded=true;entry.branch='upper-support';trace.push(entry);
        return finish(preSlide,'upper-support');
      }
      if(typeof queryLowerSupport!=='function')return refuse('lower-support-query-missing');
      const position=nativeLowerSupportPosition({preSlideNormalized:preSlide,contactPointNormalizedY:point[1],radii,skin});
      const lower=queryLowerSupport({position,mask,iteration:iterations});
      if(lower?.qualified!==true)return refuse('lower-support-query-unqualified');
      if(typeof lower.hit!=='boolean')throw TypeError('Explicit lower-support hit flag required');
      entry.lowerSupport={position,hit:lower.hit};
      if(lower.hit){
        const decision=nativeLowerSupportDecision({queryPosition:position,returnedHeight:lower.height,radiusY:radii[1],float37,hit:true,qualified:true});
        entry.lowerSupport.height=f(lower.height);entry.lowerSupport.normalizedGap=decision.normalizedGap;
        if(decision.stop){
          grounded=true;entry.branch='lower-support';trace.push(entry);
          return finish(preSlide,'lower-support');
        }
      }
    }
    // 7B204A tests globalMask & policy6AC, not either hit-category field.
    if(!(globalMask&responseMask)){
      grounded ||= descending;entry.branch='category-stop';trace.push(entry);
      return finish(preSlide,'category-stop');
    }
    const slide=nativeSlideContinuation(origin,displacement,preSlide,point,{descending});
    entry.branch=slide.reason==='continue'?'ordinary-slide':slide.reason;
    entry.remaining=slide.remaining;trace.push(entry);
    if(slide.stop){grounded ||= slide.grounded;return finish(preSlide,slide.reason);}
    origin=preSlide;displacement=slide.remaining;
  }
}
