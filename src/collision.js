// Independent swept-ellipsoid implementation, not a port of S4's executable.
// Algorithm family: Fauerby, Improved Collision Detection and Response (2003).
// https://www.peroxide.dk/papers/collision/collision.pdf
// Solver tolerances, grounding and recursion bounds remain reconstruction choices.
import {Vector3,Ray} from 'three';
import {nativeUpperEdgeSupport} from './native-downward-support.js';
import {nativePreSlide,nativeActorContactContinuation} from './native-collision-response.js';
import {nativeLowerSupportPosition,nativeLowerSupportDecision,NATIVE_LOWER_SUPPORT_GAP} from './native-lower-support.js';
import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';
export const COLLISION_SETTINGS=Object.freeze({
  epsilon:1e-9,maxIterations:8,groundNormalY:.65,snapBase:.025,snapTravelRate:1.2,
  contactTolerance:1e-5,
  // S5Runtime 0.8.32 live 0x15F4210; free-path solver 0x7B2349.
  // Ellipsoid-space distance, NOT the numerical epsilon above. Opt-in below:
  // applying native skin to all contacts/locomotion needs separate validation.
  dodgeFreeTravelMargin:Math.fround(.015),
  wallProbe:.04,wallMaxNormalY:.3,
});
const EPS=COLLISION_SETTINGS.epsilon;
const vector=p=>new Vector3(p.x,p.y,p.z);
const point=(x,y,z)=>new Vector3(x,y,z);

// A rounded edge can have an upward radial normal without being a floor.
// Generic support query: faces (including coplanar seams) and balanced points.
// Controller descent also opts into the separate native upper-contact branch
// below; treating EVERY off-center radial contact as a slide was incorrect.
export function isGroundContact(contact,minY=COLLISION_SETTINGS.groundNormalY){
  if(!contact||contact.normal.y<minY)return false;
  const n=contact.normal,toleranceSq=COLLISION_SETTINGS.contactTolerance**2;
  return contact.kind==='face'||n.x*n.x+n.z*n.z<=toleranceSq||
    n.distanceToSquared(contact.surfaceNormal)<=toleranceSq;
}

function firstRoot(a,b,c,limit){
  if(Math.abs(a)<EPS){
    if(Math.abs(b)<EPS)return null;
    const t=-c/b;return t>=-EPS&&t<=limit+EPS?Math.max(0,t):null;
  }
  const discriminant=b*b-4*a*c;
  if(discriminant<-EPS)return null;
  const root=Math.sqrt(Math.max(0,discriminant));
  // Stable quadratic roots even when b and sqrt(discriminant) nearly cancel.
  const q=-.5*(b+(b<0?-root:root));
  const roots=Math.abs(q)<EPS?[-b/(2*a)]:[q/a,c/q];
  roots.sort((x,y)=>x-y);
  return roots.find(t=>t>=-EPS&&t<=limit+EPS)??null;
}

function inside(p,a,b,c,n){
  return [[a,b],[b,c],[c,a]].every(([s,e])=>e.clone().sub(s).cross(p.clone().sub(s)).dot(n)>=-EPS);
}

export function triangle(a,b,c,id=0){
  const normal=b.clone().sub(a).cross(c.clone().sub(a));
  if(normal.lengthSq()<EPS*EPS)throw Error('Degenerate collision triangle');
  normal.normalize();
  return {a,b,c,normal,id,min:a.clone().min(b).min(c),max:a.clone().max(b).max(c)};
}

// Returns first entering contact, including t=0. Tangencies and separating
// contacts are ignored so internal coplanar edges cannot snag a grounded actor.
export function sweepSphere(origin,delta,tri,limit=1){
  // Native triangle sweep 0x1278832–0x1278877 flips the plane toward
  // the sphere origin. Reverse winding too, for the inside-triangle test.
  if(origin.clone().sub(tri.a).dot(tri.normal)<0)
    tri={...tri,b:tri.c,c:tri.b,normal:tri.normal.clone().negate()};
  const {a,b,c,normal}=tri,dist=origin.clone().sub(a).dot(normal),planeSpeed=delta.dot(normal);
  // A sphere moving away from the plane may still enter a finite edge
  // while partly within the plane slab; test feature approach below.
  let best=null,maxTime=limit;
  const consider=(t,p,kind)=>{
    if(t===null||t<-EPS||t>maxTime+EPS)return;
    t=Math.max(0,Math.min(limit,t));
    const n=origin.clone().addScaledVector(delta,t).sub(p).normalize();
    if(delta.dot(n)>=-EPS)return;
    best={time:t,point:p,normal:n,kind,triangle:tri};maxTime=t;
  };
  if(planeSpeed<-EPS){
    // Test resting contact in distance units before dividing by a tiny step.
    // Otherwise sub-nanometre roundoff after sliding becomes a negative time
    // outside the time tolerance and the following gravity sweep misses the floor.
    // Imported float32 faces can meet a few micrometres above the previous
    // face. Recover that shallow overlap instead of discarding a negative TOI
    // and letting the next gravity step pass through the new floor entirely.
    const resting=dist<=1+EPS&&dist>=1-COLLISION_SETTINGS.contactTolerance;
    const t=resting?0:(1-dist)/planeSpeed;
    if(t>=-EPS&&t<=maxTime+EPS){
      const p=origin.clone().addScaledVector(delta,Math.max(0,t)).addScaledVector(normal,resting?-dist:-1);
      if(inside(p,a,b,c,normal))consider(t,p,'face');
    }
  }
  const speedSq=delta.lengthSq();
  // Float32 shared edges need the same shallow-overlap recovery as faces.
  // Otherwise a wall slide can leave a resting ledge a few micrometres inside
  // the sphere and its negative entry root silently removes ground support.
  const restingFeature=distanceSq=>distanceSq<=1+EPS&&distanceSq>=(1-COLLISION_SETTINGS.contactTolerance)**2;
  for(const p of [a,b,c]){
    const relative=origin.clone().sub(p);
    if(restingFeature(relative.lengthSq()))consider(0,p.clone(),'vertex');
    consider(firstRoot(speedSq,2*delta.dot(relative),relative.lengthSq()-1,maxTime),p.clone(),'vertex');
  }
  for(const [s,e] of [[a,b],[b,c],[c,a]]){
    const edge=e.clone().sub(s),lenSq=edge.lengthSq(),relative=origin.clone().sub(s);
    const alongDelta=delta.dot(edge)/lenSq,alongOrigin=relative.dot(edge)/lenSq;
    const perpendicularDelta=delta.clone().addScaledVector(edge,-alongDelta);
    const perpendicularOrigin=relative.clone().addScaledVector(edge,-alongOrigin);
    if(alongOrigin>=0&&alongOrigin<=1&&restingFeature(perpendicularOrigin.lengthSq()))consider(0,s.clone().addScaledVector(edge,alongOrigin),'edge');
    const t=firstRoot(perpendicularDelta.lengthSq(),2*perpendicularDelta.dot(perpendicularOrigin),perpendicularOrigin.lengthSq()-1,maxTime);
    if(t!==null){
      const along=alongOrigin+t*alongDelta;
      if(along>=-EPS&&along<=1+EPS)consider(t,s.clone().addScaledVector(edge,Math.max(0,Math.min(1,along))),'edge');
    }
  }
  return best;
}

export function boxTriangles(box){
  const {minX:x,maxX:X,minY:y,maxY:Y,minZ:z,maxZ:Z}=box;
  const p=[point(x,y,z),point(X,y,z),point(X,Y,z),point(x,Y,z),point(x,y,Z),point(X,y,Z),point(X,Y,Z),point(x,Y,Z)];
  const faces=[[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[0,1,5,4],[3,7,6,2]];
  return faces.flatMap(([a,b,c,d])=>[[p[a],p[b],p[c]],[p[a],p[c],p[d]]]);
}

// One authoritative wedge for physics and rendered ramp, including its sides.
export function rampGeometry(r){
  const {minX:x,maxX:X,minZ:z,maxZ:Z,bottom:y,top:Y}=r;
  const vertices=[x,y,Z,X,y,Z,x,Y,z,X,Y,z,x,y,z,X,y,z];
  const indices=[0,1,2,1,3,2,0,2,4,1,5,3,2,3,4,3,5,4,0,4,5,0,5,1];
  return {vertices,indices};
}

export function worldTriangles(world){
  const raw=(world.colliders||[]).flatMap(boxTriangles);
  const records=world.queryTriangleRecords;
  if(world.ramp){
    const {vertices,indices}=rampGeometry(world.ramp),p=[];
    for(let i=0;i<vertices.length;i+=3)p.push(point(...vertices.slice(i,i+3)));
    for(let i=0;i<indices.length;i+=3)raw.push(indices.slice(i,i+3).map(j=>p[j]));
  }
  for(const [index,t] of (world.triangles||[]).entries()){
    const points=t.map(v=>Array.isArray(v)?point(...v):vector(v));
    // Preserve authenticated source records through normalization and actor
    // collision views. Never pair stale/differently ordered metadata by index.
    const record=records?.[index];
    if(record?.points?.length===3&&points.every((p,j)=>p.x===record.points[j]?.x&&p.y===record.points[j]?.y&&p.z===record.points[j]?.z))points.sourceRecord=record;
    if(t.oneWay)points.oneWay=true;raw.push(points);
  }
  return raw;
}

export class EllipsoidWorld {
  constructor(world,radii){
    this.world=world;this.radii=vector(radii);
    if(![radii.x,radii.y,radii.z].every(n=>Number.isFinite(n)&&n>0))throw Error('Invalid ellipsoid radii');
    this.rebuild();
  }
  rebuild(){
    this.triangles=worldTriangles(this.world).map((points,id)=>{
      const tri=triangle(...points.map(p=>p.clone().divide(this.radii)),id);
      if(points.oneWay)tri.oneWay=true;
      if(points.sourceRecord)tri.sourceRecord=points.sourceRecord;
      return tri;
    });
    this.sourceRamp=this.world.ramp;this.sourceBoxes=this.world.colliders;this.sourceCount=this.world.colliders?.length;this.sourceTriangles=this.world.triangles;
    this.sourceQueryRecords=this.world.queryTriangleRecords;
  }
  refresh(){
    if(this.sourceRamp!==this.world.ramp||this.sourceBoxes!==this.world.colliders||this.sourceCount!==this.world.colliders?.length||this.sourceTriangles!==this.world.triangles||this.sourceQueryRecords!==this.world.queryTriangleRecords)this.rebuild();
  }
  toWorldContact(hit){
    return {...hit,point:hit.point.clone().multiply(this.radii),normal:hit.normal.clone().divide(this.radii).normalize(),surfaceNormal:hit.triangle.normal.clone().divide(this.radii).normalize(),wallNormal:hit.triangle.normal.clone().multiply(this.radii).normalize()};
  }
  nearest(origin,delta){
    let hit=null;
    const end=origin.clone().add(delta),min=origin.clone().min(end).addScalar(-1-EPS),max=origin.clone().max(end).addScalar(1+EPS);
    for(const tri of this.triangles){
      if(tri.min.x>max.x||tri.max.x<min.x||tri.min.y>max.y||tri.max.y<min.y||tri.min.z>max.z||tri.max.z<min.z)continue;
      // One-way support exists only while approaching the top from above.
      // Ordinary imported walls/ceilings retain their two-sided sweep.
      if(tri.oneWay&&(delta.dot(tri.normal)>=-EPS||origin.clone().sub(tri.a).dot(tri.normal)<-EPS))continue;
      const next=sweepSphere(origin,delta,tri,hit?.time??1);
      // Coplanar ties have the same constraint; order must not pick a later hit.
      if(next&&(!hit||next.time<hit.time-EPS))hit=next;
    }
    return hit;
  }
  actorContact(origin,delta){
    if(!this.queryActorContacts||delta.lengthSq()<EPS*EPS)return null;
    const result=this.queryActorContacts({origin:origin.toArray(),displacement:delta.toArray(),radii:this.radii.toArray().map(n=>Math.fround(n/SCN_SCENE_SCALE))});
    if(result?.qualified!==true)throw Error('Player body contact query refused');
    if(!result.hit)return null;
    return result;
  }
  actorWorldContact(hit,origin,delta,iteration=1){
    const preSlide=nativePreSlide(origin.toArray(),delta.toArray(),hit.distance).position;
    const response=nativeActorContactContinuation({origin:origin.toArray(),displacement:delta.toArray(),preSlide,
      point:hit.point,normal:hit.normal,descending:delta.y<0,iterations:iteration,float13:.02,responseMask:0xffffffff});
    const normal=new Vector3(...hit.normal).multiply(this.radii).normalize();
    return {kind:'actor-body',actorBody:true,time:hit.distance/delta.length(),point:new Vector3(...hit.point).multiply(this.radii),
      normal,surfaceNormal:normal.clone(),wallNormal:normal.clone(),groundSupport:response.grounded,
      targetSolverId:hit.selected?.solverId,preSlide,response};
  }
  sweep(center,displacement,{actorBodies=false}={}){
    this.refresh();
    const origin=vector(center).divide(this.radii),delta=vector(displacement).divide(this.radii);
    const hit=this.nearest(origin,delta);
    const body=actorBodies?this.actorContact(origin,delta):null;
    if(body&&(!hit||body.distance<hit.time*delta.length()))return this.actorWorldContact(body,origin,delta);
    return hit?this.toWorldContact(hit):null;
  }
  supportsGround(contact,center,minY=COLLISION_SETTINGS.groundNormalY,supportDepth=0,allowEdgeSupport=false,nativeDownwardSupport=false,nativeLowerSupport=false){
    if(contact?.actorBody)return contact.groundSupport===true;
    if(isGroundContact(contact,minY))return true;
    // Static-triangle descending support has a separate native upper-contact
    // branch. An off-center edge near the top is not automatically a slide.
    // The caller limits this to the first downward contact; horizontal/upward
    // sweeps and generic collision queries keep their existing response.
    if(nativeDownwardSupport&&nativeUpperEdgeSupport(contact,center,this.radii))return true;
    if(nativeDownwardSupport&&nativeLowerSupport&&contact&&!contact.triangle?.oneWay&&['face','edge','vertex'].includes(contact.kind)){
      // Source7B1EB2..7B2045 probes below the actual contact, at the current
      // body's X/Z, when its first descending contact is not upper support.
      // Stair noses can otherwise look like a wall to the rounded body even
      // while a real tread remains directly underneath it. This is a CURRENT
      // S5 static-world ray, not certification of the native manager union.
      const queryPosition=nativeLowerSupportPosition({preSlideNormalized:vector(center).divide(this.radii).toArray(),
        contactPointNormalizedY:contact.point.y/this.radii.y,radii:this.radii.toArray(),skin:Math.fround(.015)});
      const below=this.raycast({x:queryPosition[0],y:queryPosition[1],z:queryPosition[2]},
        {x:0,y:-this.radii.y*NATIVE_LOWER_SUPPORT_GAP,z:0});
      if(below&&nativeLowerSupportDecision({queryPosition,returnedHeight:below.point.y,radiusY:this.radii.y,
        float37:NATIVE_LOWER_SUPPORT_GAP,hit:true,qualified:true}).stop)return true;
    }
    // Maps can explicitly designate a thin ledge as walkable. This only
    // accepts an actual upward contact, never snaps toward a remote surface.
    if(allowEdgeSupport&&contact&&contact.normal.y>=minY){
      const key=this.world.edgeSupportKey?.(contact);
      // One continuous ledge run belongs to one window. A later window must
      // not catch the fall automatically when sprinting diagonally inward.
      if(key&&(this.edgeSupportKey==null||this.edgeSupportKey===key)){
        this.edgeSupportKey=key;this.edgeSupportUsed=true;return true;
      }
    }
    if(!contact||contact.normal.y<minY||supportDepth<=0)return false;
    // Stair treads and float32 seams may put the rounded body on an edge
    // while real walkable floor still exists immediately under its center.
    // A bounded downward ray distinguishes those from an unsupported ledge.
    const below=this.raycast(center,{x:0,y:-this.radii.y-supportDepth,z:0});
    return !!below&&below.normal.y>=minY;
  }
  // Segment query reuses the existing collision triangles (including imported
  // SCN walls and ramps). It does not build another render mesh or collider.
  raycast(origin,displacement){
    this.refresh();
    const start=vector(origin).divide(this.radii),delta=vector(displacement).divide(this.radii),length=delta.length();
    if(length<1e-9)return null;
    const end=start.clone().add(delta),min=start.clone().min(end),max=start.clone().max(end);
    const ray=new Ray(start,delta.multiplyScalar(1/length)),point=new Vector3();let nearest=null,distance=length+1e-8;
    for(const tri of this.triangles){
      if(tri.min.x>max.x||tri.max.x<min.x||tri.min.y>max.y||tri.max.y<min.y||tri.min.z>max.z||tri.max.z<min.z)continue;
      if(tri.oneWay&&(delta.dot(tri.normal)>=-EPS||start.clone().sub(tri.a).dot(tri.normal)<-EPS))continue;
      if(!ray.intersectTriangle(tri.a,tri.b,tri.c,false,point))continue;
      const d=point.distanceTo(start);if(d>distance||d<1e-6)continue;
      distance=d;const normal=tri.normal.clone().divide(this.radii).normalize();
      if(normal.dot(vector(displacement))>0)normal.negate();
      nearest={time:d/length,point:point.clone().multiply(this.radii),normal,triangleId:tri.id};
    }
    return nearest;
  }
  move(center,displacement,{maxIterations=COLLISION_SETTINGS.maxIterations,stopOnGround=false,groundNormalY=COLLISION_SETTINGS.groundNormalY,supportDepth=0,freeTravelMargin=0,allowEdgeSupport=false,nativeDownwardSupport=false,nativeLowerSupport=false}={}){
    if(!Number.isFinite(freeTravelMargin)||freeTravelMargin<0)throw Error('Invalid free travel margin');
    this.refresh();
    let p=vector(center).divide(this.radii),remaining=vector(displacement).divide(this.radii);
    const contacts=[],planes=[];let iterations=0;
    for(;iterations<maxIterations&&remaining.lengthSq()>EPS*EPS;iterations++){
      const hit=this.nearest(p,remaining);
      const body=this.actorContact(p,remaining);
      if(body&&(!hit||body.distance<hit.time*remaining.length())){
        const contact=this.actorWorldContact(body,p,remaining,iterations+1);contacts.push(contact);
        p.set(...contact.preSlide);
        if(contact.response.stop){remaining.set(0,0,0);break;}
        remaining.set(...contact.response.remaining);
        continue;
      }
      if(!hit){
        // Native free travel consumes a small margin even without an obstacle.
        // Apply it once per actual move, after batching movement contributions,
        // not once per timer substep; never turn a tiny move into a reverse step.
        p.addScaledVector(remaining,Math.max(0,1-freeTravelMargin/remaining.length()));
        remaining.set(0,0,0);break;
      }
      p.addScaledVector(remaining,hit.time);
      const contact=this.toWorldContact(hit);contacts.push(contact);
      remaining.multiplyScalar(1-hit.time);
      if(stopOnGround&&this.supportsGround(contact,p.clone().multiply(this.radii),groundNormalY,supportDepth,allowEdgeSupport,nativeDownwardSupport&&iterations===0&&displacement.y<0&&displacement.x===0&&displacement.z===0,nativeLowerSupport)){
        contact.groundSupport=true;remaining.set(0,0,0);break;
      }
      // Adjacent SCN faces can differ by only a few microradians. Merging
      // them by a loose dot threshold keeps clipping against the previous
      // face and repeatedly hits the new one at t=0 until movement stalls.
      if(!planes.some(n=>n.distanceToSquared(hit.normal)<=EPS*EPS))planes.push(hit.normal);
      // Clip against all encountered planes, not only the most recent one.
      // This keeps a second wall from pushing the actor through the first.
      for(let pass=0;pass<planes.length+1;pass++)for(const n of planes){
        const into=remaining.dot(n);if(into<0)remaining.addScaledVector(n,-into);
      }
    }
    return {position:p.multiply(this.radii),contacts,iterations,exhausted:remaining.lengthSq()>EPS*EPS};
  }
}
