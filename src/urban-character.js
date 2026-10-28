import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';

// Original sculpted geometry, authored in the existing SCN bind space.
// No bone, clip, socket, or movement setting is altered by this builder.
export function createUrbanCharacter(rig,bones,definitions,{batch=true}={}){
 const names=[...bones.keys()],ids=new Map(names.map((n,i)=>[n,i]));
 const skeleton=new T.Skeleton(names.map(n=>bones.get(n)),names.map(n=>new T.Matrix4().fromArray(definitions.get(n).matrix).invert()));
 const ramp=new T.DataTexture(new Uint8Array([130,196,244]),3,1,T.RedFormat);ramp.minFilter=ramp.magFilter=T.NearestFilter;ramp.needsUpdate=true;
 const materials=Object.fromEntries(['skin','cloth','hair','shoe','seam'].map(n=>[n,new T.MeshToonMaterial({vertexColors:true,gradientMap:ramp})]));
 materials.face=new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide});
 const colors={skin:0xf2bc96,skinShade:0xd9957a,blue:0x477697,blueLight:0x5e8dab,blueDark:0x355975,white:0xe6edf3,hair:0xe4e6ef,hairBright:0xf8f6ff,hairShade:0xb2b9ce,dark:0x202b3d,sole:0x30374a,magenta:0xbe235f,yellow:0xf7bf27,seam:0x2c4d67,iris:0x9a4f23};
 const parts=[];
 const v=(x,y,z)=>new T.Vector3(x,y,z),p=n=>new T.Vector3().setFromMatrixPosition(new T.Matrix4().fromArray(definitions.get(n).matrix));
 const fixed=n=>()=>[[n,1]];
 const smooth=T.MathUtils.smoothstep;
 function add(g,kind,color,weights,name){
  const si=[],sw=[],cs=[],col=new T.Color();
  for(let i=0;i<g.attributes.position.count;i++){
   const point=new T.Vector3().fromBufferAttribute(g.attributes.position,i),list=weights(point).filter(([,w])=>w>0),sum=list.reduce((s,[,w])=>s+w,0);
   if(!sum)throw Error('Unweighted urban vertex '+name);
   for(let j=0;j<4;j++){if(list[j]&&!ids.has(list[j][0]))throw Error('Missing urban bone '+list[j][0]);si.push(ids.get(list[j]?.[0])??0);sw.push((list[j]?.[1]??0)/sum);}
   col.set(typeof color==='function'?color(point,i):color);cs.push(col.r,col.g,col.b);
  }
  g.setAttribute('skinIndex',new T.Uint16BufferAttribute(si,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(sw,4));g.setAttribute('color',new T.Float32BufferAttribute(cs,3));
  if(!g.attributes.normal)g.computeVertexNormals();
  g.deleteAttribute('uv');g.deleteAttribute('uv1');
  parts.push({geometry:g,kind,name});
 }
 function geometry(points,faces){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));g.setIndex(faces);return g;}
 // Elliptical loft with rounded-square sections and consistently outward faces.
 function loft(centers,radii,kind,color,weights,name,{sides=24,power=2,cap=true,axis:fixedAxis=null}={}){
  const points=[],faces=[],axis=fixedAxis?v(...fixedAxis):centers.at(-1).clone().sub(centers[0]).normalize();
  let u=v(0,0,1).cross(axis).normalize();if(u.lengthSq()<.1)u=v(1,0,0);const w=axis.clone().cross(u).normalize();
  for(let i=0;i<centers.length;i++)for(let j=0;j<sides;j++){
   const a=j/sides*Math.PI*2,c=Math.cos(a),s=Math.sin(a),q=centers[i].clone().addScaledVector(u,Math.sign(c)*Math.abs(c)**(2/power)*radii[i][0]).addScaledVector(w,Math.sign(s)*Math.abs(s)**(2/power)*radii[i][1]);points.push(...q.toArray());
  }
  for(let i=0;i<centers.length-1;i++)for(let j=0;j<sides;j++){const a=i*sides+j,b=i*sides+(j+1)%sides,c=a+sides,d=b+sides;faces.push(a,b,c,b,d,c);}
  if(cap)for(let j=1;j<sides-1;j++){faces.push(0,j+1,j);const o=(centers.length-1)*sides;faces.push(o,o+j,o+j+1);}
  add(geometry(points,faces),kind,color,weights,name);
 }
 function ellipsoid(center,scale,kind,color,bone,name,segments=24){const g=new T.SphereGeometry(1,segments,16);g.scale(...scale);g.translate(...center.toArray());add(g,kind,color,fixed(bone),name);}
 function line(points,radius,kind,color,weights,name){const curve=new T.CatmullRomCurve3(points);add(new T.TubeGeometry(curve,Math.max(6,points.length*3),radius,6,false),kind,color,weights,name);}
 function patch(points,kind,color,weights,name){
  const poly=points.map(q=>new T.Vector2(q.x,q.y)),tri=T.ShapeUtils.triangulateShape(poly,[]),g=geometry(points.flatMap(q=>q.toArray()),tri.flat());
  // Panels are authored as seen from the front (-Z).
  const n=new T.Vector3().crossVectors(points[1].clone().sub(points[0]),points[2].clone().sub(points[0]));
  if(n.z>0){const a=g.index.array;for(let i=0;i<a.length;i+=3)[a[i+1],a[i+2]]=[a[i+2],a[i+1]];}
  add(g,kind,color,weights,name);
 }
 const torsoLevels=[['Bip01 Pelvis',160],['Bip01 Spine',176],['Bip01 Spine1',190],['Bip01 Spine2',211]];
 const torsoWeight=q=>{for(let i=0;i<torsoLevels.length-1;i++)if(q.y<=torsoLevels[i+1][1]){const t=T.MathUtils.clamp((q.y-torsoLevels[i][1])/(torsoLevels[i+1][1]-torsoLevels[i][1]),0,1);return [[torsoLevels[i][0],1-t],[torsoLevels[i+1][0],t]];}return [['Bip01 Spine2',1]];};
 const shirt=[ [166,22.3,13.4],[169,23.5,14.4],[178,22.8,14.3],[190,23.3,14.8],[204,26.2,15.8],[218,29,16],[227,28.5,14.8],[232,12,9.3] ];
 const shirtColor=q=>q.z<1&&q.y>210-q.x*.42&&q.y<218-q.x*.42?colors.blueDark:q.z<1&&q.x< -11&&q.y>177&&q.y<213?colors.blueLight:colors.blue;
 loft(shirt.map(([y])=>v(0,y,3.6)),shirt.map(([,x,z])=>[x,z]),'cloth',shirtColor,torsoWeight,'T-shirt / torso',{power:2.5,cap:false,sides:40});
 loft([v(0,166.4,3.6),v(0,168,3.6)],[[22.6,13.7],[23.3,14.3]],'cloth',colors.blueDark,torsoWeight,'T-shirt / hem',{power:2.5,cap:false,sides:40});
 // A shaped neck enters the open collar; no floating ring or solid lid.
 loft([v(0,231,5),v(0,238,4.7),v(0,249,4.2)],[[8.7,7.4],[8.3,7.1],[7.4,6.7]],'skin',colors.skin,q=>{const t=smooth(q.y,234,246);return [['Bip01 Neck',1-t],['Bip01 Head',t]];},'Neck',{sides:28});
 loft([v(0,231.4,3.6),v(0,233.1,3.6)],[[12.3,9.7],[11.8,9.2]],'cloth',colors.blueDark,fixed('Bip01 Spine2'),'T-shirt / rib collar',{sides:40,power:2.5,cap:false});

 // Fuse the pelvis and both short legs into a single continuous surface.
 // This avoids stacked caps and the visible seams of three intersecting tubes.
 const shortsField=new MarchingCubes(46,materials.cloth,false,false,16000),extent=40,centerY=140;
 const shortLegs=['L','R'].map(side=>({hip:p(`Bip01 ${side} Thigh`),knee:p(`Bip01 ${side} Calf`)}));
 shortsField.isolation=0;
 const smin=(a,b,k)=>{const h=T.MathUtils.clamp(.5+.5*(b-a)/k,0,1);return T.MathUtils.lerp(b,a,h)-k*h*(1-h);};
 for(let zi=0;zi<46;zi++)for(let yi=0;yi<46;yi++)for(let xi=0;xi<46;xi++){
  const x=(xi/23-1)*extent,y=(yi/23-1)*extent+centerY,z=(zi/23-1)*extent;
  let d=Math.max((Math.hypot(x/24.4,(z-1)/14.8)-1)*14.8,Math.abs(y-158)-11);
  for(const {hip,knee} of shortLegs){const t=T.MathUtils.clamp((hip.y-y)/(hip.y-knee.y),-.03,.79),cx=T.MathUtils.lerp(hip.x,knee.x,t),cz=T.MathUtils.lerp(hip.z,knee.z,t),rx=12.2+Math.sin(t*3)*.7;
   const leg=Math.max((Math.hypot((x-cx)/rx,(z-cz)/14.4)-1)*rx,112-y,y-165);d=smin(d,leg,5.2);
  }
  shortsField.field[zi*46*46+yi*46+xi]=-d;
 }
 shortsField.update();const shortGeometry=new T.BufferGeometry();
 shortGeometry.setAttribute('position',new T.Float32BufferAttribute(shortsField.positionArray.slice(0,shortsField.count*3),3));shortGeometry.setAttribute('normal',new T.Float32BufferAttribute(shortsField.normalArray.slice(0,shortsField.count*3),3));shortGeometry.scale(extent,extent,extent);shortGeometry.translate(0,centerY,0);
 const shortWeight=q=>{const side=q.x>=0?'L':'R',t=smooth(160-q.y,0,20);return [['Bip01 Pelvis',1-t],[`Bip01 ${side} Thigh`,t]];};
 add(shortGeometry,'cloth',q=>Math.abs(q.x)>19+(160-q.y)*.06?colors.blueLight:colors.white,shortWeight,'Shorts / continuous tailored surface');shortsField.geometry.dispose();
 for(const side of ['L','R']){
  const s=side==='L'?1:-1,upper=`Bip01 ${side} UpperArm`,fore=`Bip01 ${side} Forearm`,hand=`Bip01 ${side} Hand`,clav=`Bip01 ${side} Clavicle`,a=p(upper),b=p(fore),c=p(hand);
  const armWeight=q=>{const x=Math.abs(q.x);if(x<a.x*s+7){const t=smooth(x,18,30);return [[clav,1-t],[upper,t]];}const t=smooth(x,53,68);return [[upper,1-t],[fore,t]];};
  loft([a.clone().add(v(-s*5,-6,-3)),a.clone().lerp(b,.18).add(v(0,-3,-1.5)),a.clone().lerp(b,.48).add(v(0,-1,0)),a.clone().lerp(b,.61)],[[9.2,10.5],[11.1,11.4],[10.7,10.9],[10.5,10.7]],'cloth',colors.blue,armWeight,`${side} T-shirt / sleeve`,{sides:28,cap:false});
  loft([a.clone().lerp(b,.58),a.clone().lerp(b,.63)],[[10.6,10.8],[10.6,10.8]],'cloth',colors.blueDark,armWeight,`${side} T-shirt / sleeve hem`,{sides:28,cap:false});
  loft([a.clone().lerp(b,.58),a.clone().lerp(b,.83),b.clone(),b.clone().lerp(c,.14),b.clone().lerp(c,.45),b.clone().lerp(c,.76),c.clone()],[[9.3,9.4],[9.5,9.3],[7.7,8.2],[8.4,8.4],[7.6,8],[5.7,6],[5.2,5.4]],'skin',colors.skin,armWeight,`${side} arm / forearm`,{sides:24});
  // Checker wrist bands follow the forearm, leaving the hand socket untouched.
  const cuff0=b.clone().lerp(c,.79),cuff1=b.clone().lerp(c,.98);
  loft([cuff0,cuff1],[[7.4,7.6],[7.4,7.6]],'shoe',colors.dark,fixed(fore),`${side} wrist cuff`,{sides:24});
  for(let row=0;row<2;row++)for(let cell=0;cell<8;cell++)if((row+cell)%2===0){
   const points=[],faces=[];for(const t of [row/2+.035,(row+1)/2-.035])for(let j=0;j<4;j++){const theta=(cell+(j/3*.8+.1))/8*Math.PI*2,center=cuff0.clone().lerp(cuff1,t);points.push(...center.add(v(0,Math.cos(theta)*7.53,Math.sin(theta)*7.73)).toArray());}
   for(let j=0;j<3;j++)faces.push(j,j+4,j+1,j+1,j+4,j+5);const g=geometry(points,faces); // double-sided accent material for mirrored bands
   add(g,'face',colors.yellow,fixed(fore),`${side} cuff / yellow square ${row}-${cell}`);
  }
  // Five visible digits use the native thumb and the two grouped finger chains.
  loft([c.clone().add(v(-s,0,0)),c.clone().add(v(s*7,1,0)),c.clone().add(v(s*15,2,1))],[[4.8,5.8],[4.6,7.6],[3.2,7.5]],'skin',colors.skin,fixed(hand),`${side} hand / palm`,{sides:20});
  const digits=[{chain:0,offset:0,width:2.2},{chain:1,offset:-.4,width:1.95},{chain:1,offset:4,width:2},{chain:2,offset:.2,width:1.9},{chain:2,offset:4.1,width:1.6,short:2.4}];
  digits.forEach((d,index)=>{
   const ns=[`Bip01 ${side} Finger${d.chain}`,`Bip01 ${side} Finger${d.chain}1`,`Bip01 ${side} Finger${d.chain}2`],joints=ns.map(n=>p(n).add(v(0,0,d.offset))),tip=joints[2].clone().add(v(s*(3.3-(d.short||0)),0,-.15));
   if(d.short){joints[1].x-=s*d.short*.45;joints[2].x-=s*d.short*.8;}
   const weight=q=>{const x=s*q.x,t=smooth(x,s*joints[1].x-1,s*joints[1].x+1.5),u=smooth(x,s*joints[2].x-1,s*joints[2].x+1.5);return [[ns[0],1-t],[ns[1],t*(1-u)],[ns[2],t*u]];};
   loft([joints[0],joints[0].clone().lerp(joints[1],.6),joints[1],joints[2],tip],[[d.width,d.width],[d.width,d.width],[d.width*.94,d.width*.94],[d.width*.82,d.width*.85],[.5,.65]],'skin',colors.skin,weight,`${side} finger ${index}`,{sides:12});
  });

  const thigh=`Bip01 ${side} Thigh`,calf=`Bip01 ${side} Calf`,foot=`Bip01 ${side} Foot`,toe=`Bip01 ${side} Toe0`,hip=p(thigh),knee=p(calf),ankle=p(foot);
  const legWeight=q=>{const h=smooth(hip.y-q.y,0,18),k=smooth(knee.y-q.y,-10,13);return [['Bip01 Pelvis',1-h],[thigh,h*(1-k)],[calf,h*k]];};
  loft([hip.clone().lerp(knee,.72),hip.clone().lerp(knee,.9),knee,knee.clone().lerp(ankle,.15),knee.clone().lerp(ankle,.37),knee.clone().lerp(ankle,.7),ankle.clone()],[[10.7,11],[9.5,9.7],[8.4,8.7],[9.3,10],[10,10.6],[7,7.8],[5.6,6.6]],'skin',colors.skin,legWeight,`${side} leg / knee / calf`,{sides:28});

  const cx=ankle.x+s*1.1,shoeWeight=q=>{const t=smooth(-q.z,4,16);return [[foot,1-t],[toe,t]];};
  const soleCenters=[v(cx,0,-2),v(cx,2.6,-2),v(cx,5.8,-2)];
  loft(soleCenters,[[11,23.5],[11.4,23.7],[11.1,23.3]],'shoe',colors.sole,shoeWeight,`${side} shoe / outsole`,{sides:36,power:3});
  loft([v(cx,5.8,-2),v(cx,8,-1.5)],[[11.15,23.3],[10.8,23]],'shoe',0xd4dce5,shoeWeight,`${side} shoe / midsole`,{sides:36,power:3,axis:[0,1,0]});
  loft([v(cx,7,-1.5),v(cx,12,-1.5),v(cx,18,1.4),v(cx,23,7.3),v(cx,30,9.5)],[[10.7,22.7],[10.3,22.2],[9.6,19.3],[8.8,13.2],[8.1,10.3]],'shoe',0x8995a7,shoeWeight,`${side} shoe / upper`,{sides:36,power:2.8,axis:[0,1,0]});
  loft([v(cx,29,9.5),v(cx,31,9.5)],[[8.4,10.5],[8.1,10.3]],'shoe',colors.white,fixed(foot),`${side} shoe / collar`,{sides:28,power:2.8,cap:false});
  // Both side panels have explicit winding; no hard-coded left/right flip.
  const shoeOuter=(y,z,flank)=>{const levels=[[7,-1.5,10.7,22.7],[12,-1.5,10.3,22.2],[18,1.4,9.6,19.3],[23,7.3,8.8,13.2],[30,9.5,8.1,10.3]];let a=levels[0],b=levels[1];for(let i=0;i<levels.length-1;i++)if(y>=levels[i][0]){a=levels[i];b=levels[i+1];}const t=T.MathUtils.clamp((y-a[0])/(b[0]-a[0]),0,1),cz=T.MathUtils.lerp(a[1],b[1],t),rx=T.MathUtils.lerp(a[2],b[2],t),rz=T.MathUtils.lerp(a[3],b[3],t);return cx+flank*(rx*Math.max(0,1-Math.abs((z-cz)/rz)**2.8)**(1/2.8)+.12);};
  for(const flank of [-1,1]){
   const pts=[[9,-13],[16,-3],[23,7],[10,18],[9,2]].map(([y,z])=>v(shoeOuter(y,z,flank),y,z));
   const g=geometry(pts.flatMap(q=>q.toArray()),flank<0?[0,1,2,0,2,4,2,3,4]:[0,2,1,0,4,2,2,4,3]);add(g,'face',colors.magenta,shoeWeight,`${side} shoe / magenta ${flank}`);
  }
  for(let i=0;i<6;i++){const z=-10+i*3.25,y=18+i*1.8;line([v(cx-5,y,z),v(cx,y+.55,z-1),v(cx+5,y,z-1.5)],.62,'shoe',colors.white,shoeWeight,`${side} shoe / lace ${i}`);}
 }

 // Sculpted anime head: a flatter front keeps the eyes readable at game distance.
 const head='Bip01 Head',headLevels=[[244,3.6,4.5],[248,8.6,8],[253,13.3,10.4],[260,16.8,12.4],[268,18.2,13.6],[277,18.6,14.6],[284,15.7,13.4],[290,8,7.5],[292,1,1]];
 loft(headLevels.map(([y])=>v(0,y,4)),headLevels.map(([,x,z])=>[x,z]),'skin',colors.skin,fixed(head),'Head / sculpted face',{sides:48,power:2.6});
 function faceZ(x,y,offset=.25){let a=headLevels[0],b=headLevels[1];for(let i=0;i<headLevels.length-1;i++)if(y>=headLevels[i][0]){a=headLevels[i];b=headLevels[i+1];}const t=T.MathUtils.clamp((y-a[0])/(b[0]-a[0]),0,1),rx=T.MathUtils.lerp(a[1],b[1],t),rz=T.MathUtils.lerp(a[2],b[2],t);return 4-rz*Math.max(0,1-Math.abs(x/rx)**2.6)**(1/2.6)-offset;}
 for(const s of [-1,1]){
  ellipsoid(v(s*18,264.3,4.5),[3.2,5.5,3.4],'skin',colors.skin,head,`${s} ear`);
  ellipsoid(v(s*19.1,264.3,2.2),[1.25,3.2,1.05],'skin',colors.skinShade,head,`${s} ear / inner`);
  const eye=[[3.4,266.6],[6.5,269],[11.3,269],[14.9,267.8],[12.4,263],[7.9,262.1],[4.1,263.3]].map(([x,y])=>[s*x,y]);
  patch(eye.map(([x,y])=>v(x,y,faceZ(x,y,.4))),'face',0xfff4ea,fixed(head),`${s} eye / white`);
  const iris=(rx,ry,color,dy,name,offset)=>{const g=new T.CircleGeometry(1,36),arr=g.attributes.position;for(let i=0;i<arr.count;i++){const x=s*8.9+arr.getX(i)*rx,y=265.9+dy+arr.getY(i)*ry;arr.setXYZ(i,x,y,faceZ(x,y,offset));}g.deleteAttribute('normal');add(g,'face',color,fixed(head),`${s} eye / ${name}`);};
  iris(2.95,3.3,0x5d342d,0,'iris rim',.5);iris(2.45,2.9,0xad642a,-.15,'amber iris',.55);iris(1.15,2.5,0x2c2332,.1,'pupil',.6);iris(.7,.85,0xfffcf5,1.3,'highlight',.68);
  line(eye.slice(0,4).map(([x,y])=>v(x,y,faceZ(x,y,.65))),.43,'face',0x423137,fixed(head),`${s} eye / upper lid`);
  line(eye.slice(3).concat([eye[0]]).map(([x,y])=>v(x,y,faceZ(x,y,.6))),.17,'face',0x9b6558,fixed(head),`${s} eye / lower lid`);
  const brow=[[3.7,272.4],[10,274],[15,273.2],[13.5,272.4],[8,272.9]].map(([x,y])=>v(s*x,y,faceZ(s*x,y,.5)));
  patch(brow,'face',0x7b6a70,fixed(head),`${s} eyebrow`);
 }
 // Low relief nose instead of a sphere or a painted triangular shadow.
 patch([v(-1.3,261,faceZ(-1.3,261,.1)),v(0,264,faceZ(0,264,.25)),v(1.8,258.6,-9.4),v(0,257.8,-10.8),v(-1.5,258.5,-9.3)],'skin',colors.skin,fixed(head),'Face / nose');
 line([v(-2.6,252.5,faceZ(-2.6,252.5,.22)),v(0,252.1,faceZ(0,252.1,.35)),v(3,252.7,faceZ(3,252.7,.22))],.18,'face',0x9c685d,fixed(head),'Face / mouth');

 // Hair clumps are curved, tapered lens volumes rather than cones or alpha cards.
 ellipsoid(v(0,281.8,5),[19.4,16,16.2],'hair',colors.hairShade,head,'Hair / cap',40);
 function lock(points,width,index,name){
  const curve=new T.CatmullRomCurve3(points.map(a=>v(...a))),positions=[],faces=[],segments=10,sides=8;
  for(let i=0;i<=segments;i++){
   const t=i/segments,c=curve.getPoint(t),axis=curve.getTangent(t),radial=c.clone().sub(v(0,276,5)).normalize();let u=axis.clone().cross(radial).normalize();if(u.lengthSq()<.1)u=v(1,0,0);const w=u.clone().cross(axis).normalize(),r=width*(.52+.62*Math.sin(Math.PI*t*.9))*(1-t)**.67+.025;
   for(let j=0;j<sides;j++){const a=j/sides*Math.PI*2;positions.push(...c.clone().addScaledVector(u,Math.cos(a)*r).addScaledVector(w,Math.sin(a)*r*.34).toArray());}
  }
  for(let i=0;i<segments;i++)for(let j=0;j<sides;j++){const a=i*sides+j,b=i*sides+(j+1)%sides,c=a+sides,d=b+sides;faces.push(a,c,b,b,c,d);}
  add(geometry(positions,faces),'hair',[colors.hair,colors.hairBright,0xd1d7e6][index%3],fixed(head),name);
 }
 const bangs=[[-15,284,-6,-18,274,-9,-17,267,-7,4.7],[-10,290,-9,-13,279,-12,-12,268,-11,5],[-4,292,-10,-7,280,-13,-8,267,-12,5],[3,293,-9,1,281,-14,-2,271,-14,5.2],[10,291,-7,8,281,-13,4,274,-14,5],[15,286,-3,15,277,-10,12,269,-12,4.5],[18,280,3,19,271,-1,18,263,0,3.5]];
 bangs.forEach((a,i)=>lock([a.slice(0,3),a.slice(3,6),a.slice(6,9)],a[9],i,`Hair / fringe ${i}`));
 for(let i=0;i<21;i++){const a=i/21*Math.PI*2,c=Math.cos(a),s=Math.sin(a);lock([[c*5,295,5+s*5],[c*14,294+(i%3),5+s*12],[c*21,284+(i%4)*2,5+s*18]],5,i,`Hair / upper layer ${i}`);}
 for(let i=0;i<10;i++){const a=i/10*Math.PI*2,c=Math.cos(a),s=Math.sin(a);lock([[c*5-3,291,5+s*5],[c*9,300+(i%3),5+s*10],[c*13+3,302+(i%3)*2,5+s*14]],4.2,i,`Hair / crown ${i}`);}
 for(let i=0;i<13;i++){const a=i/12*Math.PI,c=Math.cos(a),s=Math.sin(a);lock([[c*15,286,5+s*12],[c*20,278,6+s*16],[c*20,268+(i%3),8+s*16]],4.5,i+1,`Hair / back ${i}`);}

 const meshes=[];
 for(const [key,material]of Object.entries(materials)){
  const selected=parts.filter(q=>q.kind===key);if(!selected.length)continue;
  const groups=batch?[selected]:selected.map(q=>[q]);
  for(const group of groups){const source=group.map(q=>q.geometry.index?q.geometry.toNonIndexed():q.geometry.clone()),g=mergeGeometries(source);if(!g)throw Error('Urban geometry merge failed');
   const mesh=new T.SkinnedMesh(g,material);mesh.name=batch?`Urbain / ${key}`:group[0].name;mesh.userData.parts=group.map(q=>q.name);mesh.userData.characterSkin='urban';mesh.frustumCulled=false;mesh.castShadow=key!=='face';mesh.receiveShadow=true;mesh.bind(skeleton,new T.Matrix4());rig.add(mesh);meshes.push(mesh);for(const q of source)q.dispose();
  }
 }
 for(const part of parts)part.geometry.dispose();
 return {meshes,skeleton,materials,partCount:parts.length};
}
