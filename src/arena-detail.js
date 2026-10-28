import * as THREE from 'three';

// Visual dressing stays inside existing obstacles or outside the playable roof.
// It does not add invisible barriers or alter the movement test layout.
export function dressArena(scene,{materials,box,target}){
  const lamp=new THREE.MeshBasicMaterial({color:0xffa441});
  const foliage=new THREE.MeshToonMaterial({color:0x629e78,gradientMap:materials.green.gradientMap});
  const foliageLight=new THREE.MeshToonMaterial({color:0x99ba73,gradientMap:materials.green.gradientMap});
  function light(x,y,z,w,h,d){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),lamp);m.position.set(x,y,z);scene.add(m);return m;}
  const skyline=[];
  for(let i=0;i<42;i++){
    const angle=i/42*Math.PI*2,r=53+i%5*5,x=Math.sin(angle)*r,z=Math.cos(angle)*r,h=13+(i*17)%31,w=3+i%4,d=4+i%3;
    const building=box(x,h/2-9,z,w,h,d,i%3?'blue':'white',false);
    skyline.push(building);
    box(x,h-8.7,z,w+.18,.48,d+.18,'white',false,false);
    const side=i%2===0?1:-1;
    for(let j=0;j<3;j++){
      box(x+(j-1)*w*.25,h/2-6,z+side*(d/2+.02),.18,h*.65,.04,'navy',false,false);
      box(x+(j-1)*w*.25,h/2-6,z+side*(d/2+.046),.065,h*.57,.015,'green',false,false);
    }
    if(i%3===0){
      box(x,h-6.6,z,w*.63,4,d*.63,'white',false);
      light(x,h-8.5,z+d/2+.04,w*.7,.17,.04);
    }
    if(i%4===0){
      box(x,h-3,z,w*.27,6,d*.27,'blue',false);
      box(x,h+1,z,.12,5,.12,'navy',false,false);
    }
  }
  // Skyways and observation towers give the city a recognisable sci-fi profile.
  const railMat=new THREE.MeshToonMaterial({color:0xe0e5ce,gradientMap:materials.white.gradientMap});
  for(const [radius,height,angle,length] of [[61,11,.25,2.15],[78,19,3.35,1.85]]){
    const rail=new THREE.Mesh(new THREE.TorusGeometry(radius,.42,5,100,length),railMat);
    rail.rotation.x=Math.PI/2;rail.rotation.z=angle;rail.position.y=height;scene.add(rail);
    const underside=new THREE.Mesh(new THREE.TorusGeometry(radius,.19,5,100,length),materials.blue);
    underside.rotation.copy(rail.rotation);underside.position.y=height-.52;scene.add(underside);
  }
  for(const [x,z,h] of [[-36,-40,23],[46,-35,31]]){
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.9,1.6,h,10),materials.white);stem.position.set(x,h/2-6,z);scene.add(stem);
    for(const [offset,rad,depth,color] of [[0,4.8,1.1,'white'],[.8,3.6,.8,'blue'],[1.5,2.9,.3,'orange']]){
      const disk=new THREE.Mesh(new THREE.CylinderGeometry(rad,rad*.9,depth,18),materials[color]);disk.position.set(x,h-6+offset,z);scene.add(disk);
    }
  }
  // Bright wall-jump panels: arrows live on the broad face, not the narrow edge.
  const arrow=new THREE.Shape();arrow.moveTo(-.85,-.35);arrow.lineTo(0,.38);arrow.lineTo(.85,-.35);arrow.lineTo(.85,-.75);arrow.lineTo(0,-.04);arrow.lineTo(-.85,-.75);arrow.closePath();
  for(const x of [-9,-14]){
    for(const y of [2.35,3.55,4.75]){
      const chevron=new THREE.Mesh(new THREE.ShapeGeometry(arrow),materials.white);chevron.rotation.y=Math.PI/2;chevron.position.set(x+.507,y,-5);scene.add(chevron);
    }
    box(x,.16,-5,1.015,.32,9.015,'navy',false,false);
    for(const z of [-9.12,-.88])box(x+.507,3.45,z,.018,5.65,.045,'navy',false,false);
    for(const y of [.64,6.25])box(x+.507,y,-5,.018,.045,8.25,'navy',false,false);
    light(x+.523,6.13,-5,.026,.12,6.7);
  }
  for(const [x,y,z,w,h,d] of [[6,1,-4,5,2,2.4],[12,.65,3,4,1.3,2.8],[9,1.6,10,3,3.2,3]]){
    box(x,.105,z,w+.006,.21,d+.006,'navy',false,false);
    box(x,y+h/2-.075,z,w+.008,.15,d+.008,'orange',false,false);
    for(const side of [-1,1])box(x+side*(w/2-.12),y,z+d/2+.008,.045,h-.24,.018,'navy',false,false);
    light(x,y+h/2-.26,z+d/2+.026,w*.38,.055,.023);
  }
  // Façade panels remain within the existing raised platform volume.
  box(6,.18,-11.497,19.9,.36,.014,'navy',false,false);
  for(const x of [-3.4,1.1,5.6,10.1,15.4])box(x,1.85,-11.491,.04,2.95,.014,'navy',false,false);
  light(5,8.36,-17,7,.06,.12);
  for(const x of [0,10]){
    box(x,3.92,-18,1.015,.45,1.015,'navy',false,false);
    light(x,6.5,-17.489,.18,2.1,.015);
  }
  // Perimeter railings sit beyond the roof's boundary colliders.
  for(const z of [-24.32,24.32]){
    for(const x of [-20,-15,-10,-5,0,5,10,15,20])box(x,2.2,z,.07,.6,.07,'navy',false,false);
    box(0,2.48,z,43,.07,.07,'navy',false,false);
  }
  // Green terraces are outside the test volume, leaving every route unchanged.
  for(const [x,z] of [[-26,-16],[26,-16],[-27,13],[27,15],[-13,-28],[12,-28]]){
    box(x,.3,z,4,.6,4,'white',false);
    for(let i=0;i<9;i++){
      const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(.7+(i%3)*.19,0),i%3?foliage:foliageLight);
      leaf.position.set(x+((i*7)%5-2)*.55,1+(i%4)*.3,z+((i*3)%5-2)*.55);leaf.scale.set(1.1,1,.85);leaf.castShadow=true;scene.add(leaf);
    }
  }
  // Airship beyond the arena, entirely ornamental.
  const ship=new THREE.Group();ship.position.set(28,27,-70);ship.rotation.z=-.06;scene.add(ship);
  const hull=new THREE.Mesh(new THREE.SphereGeometry(1,18,8),materials.white);hull.scale.set(7.2,1.35,1.5);ship.add(hull);
  const stripe=new THREE.Mesh(new THREE.SphereGeometry(1,18,8),materials.blue);stripe.scale.set(7.25,.35,1.51);stripe.position.y=-.2;ship.add(stripe);
  const cabin=new THREE.Mesh(new THREE.BoxGeometry(2.3,.6,.75),materials.navy);cabin.position.set(0,-1.35,0);ship.add(cabin);
  // Readable eyes, neck, base and joints for the timing target.
  function part(w,h,d,x,y,z,material){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);target.add(m);return m;}
  part(.4,.14,.035,0,1.76,.242,materials.navy);
  for(const x of [-.105,.105])part(.055,.05,.015,x,1.77,.268,new THREE.MeshBasicMaterial({color:0x70ead6}));
  part(.2,.14,.2,0,1.43,0,materials.navy);
  part(1,.12,.7,0,.04,0,materials.navy);
  for(const x of [-.23,.23])part(.29,.16,.35,x,.12,.025,materials.navy);
  return {skyline};
}

export function createSky(scene){
  const material=new THREE.ShaderMaterial({
    side:THREE.BackSide,depthWrite:false,depthTest:false,
    uniforms:{top:{value:new THREE.Color(0x248fe0)},horizon:{value:new THREE.Color(0xd1eff8)}},
    vertexShader:'varying vec3 vPosition; void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'uniform vec3 top;uniform vec3 horizon;varying vec3 vPosition;void main(){float h=clamp(normalize(vPosition).y,0.0,1.0);gl_FragColor=vec4(mix(horizon,top,smoothstep(0.0,0.48,h)),1.0); #include <colorspace_fragment> }'.replace('; #include',';\n#include').replace('> }','>\n}'),
  });
  const sky=new THREE.Mesh(new THREE.SphereGeometry(170,24,16),material);sky.renderOrder=-1000;scene.add(sky);return sky;
}
