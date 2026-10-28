import {BackSide,Box3,BoxGeometry,Data3DTexture,FloatType,LinearFilter,Matrix4,Mesh,NormalBlending,RedFormat,RepeatWrapping,ShaderMaterial,Triangle,UnsignedByteType,Vector3} from 'three';

// A scalar distance field of the actual weapon triangles, prepared once per
// geometry. It is not a flame sprite/flipbook. The shader integrates continuous
// burning fuel around that surface in three dimensions.
const fields=new WeakMap();let noiseTexture=null,noiseUsers=0;
function triangleTree(triangles){
 const bounds=new Box3();for(const triangle of triangles)bounds.expandByPoint(triangle.a).expandByPoint(triangle.b).expandByPoint(triangle.c);
 if(triangles.length<=8)return {bounds,triangles};
 const span=bounds.getSize(new Vector3()),axis=span.x>span.y&&span.x>span.z?'x':span.y>span.z?'y':'z';
 triangles.sort((a,b)=>(a.a[axis]+a.b[axis]+a.c[axis])-(b.a[axis]+b.b[axis]+b.c[axis]));const split=triangles.length>>1;
 return {bounds,left:triangleTree(triangles.slice(0,split)),right:triangleTree(triangles.slice(split))};
}
function boxDistanceSq(bounds,p){return Math.max(bounds.min.x-p.x,0,p.x-bounds.max.x)**2+Math.max(bounds.min.y-p.y,0,p.y-bounds.max.y)**2+Math.max(bounds.min.z-p.z,0,p.z-bounds.max.z)**2;}
function nearestDistance(tree,point,nearest,best=Infinity){
 if(boxDistanceSq(tree.bounds,point)>=best)return best;
 if(tree.triangles){for(const triangle of tree.triangles){triangle.closestPointToPoint(point,nearest);best=Math.min(best,point.distanceToSquared(nearest));}return best;}
 let first=tree.left,second=tree.right;if(boxDistanceSq(first.bounds,point)>boxDistanceSq(second.bounds,point))[first,second]=[second,first];
 return nearestDistance(second,point,nearest,nearestDistance(first,point,nearest,best));
}
function acquireNoise(){
 if(!noiseTexture){const n=32,data=new Uint8Array(n*n*n);let seed=43543;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed>>>24;}
  noiseTexture=new Data3DTexture(data,n,n,n);Object.assign(noiseTexture,{format:RedFormat,type:UnsignedByteType,minFilter:LinearFilter,magFilter:LinearFilter,wrapS:RepeatWrapping,wrapT:RepeatWrapping,wrapR:RepeatWrapping,unpackAlignment:1,needsUpdate:true});
 }noiseUsers++;return noiseTexture;
}
function acquireField(geometry){
 let field=fields.get(geometry);if(field){field.users++;return field;}
 geometry.computeBoundingBox();const bounds=geometry.boundingBox.clone(),span=bounds.getSize(new Vector3()),longest=Math.max(span.x,span.y,span.z),pad=longest/40;
 bounds.expandByScalar(pad);const size=bounds.getSize(new Vector3()),dims=size.toArray().map(v=>Math.max(12,Math.ceil(v/(longest/40)))),count=dims[0]*dims[1]*dims[2],data=new Float32Array(count),position=geometry.attributes.position,index=geometry.index,triangles=[];
 for(let i=0;i<(index?.count??position.count);i+=3){const ids=[0,1,2].map(j=>index?index.getX(i+j):i+j);triangles.push(new Triangle(...ids.map(id=>new Vector3().fromBufferAttribute(position,id))));}
 const point=new Vector3(),nearest=new Vector3(),tree=triangleTree(triangles);let cursor=0;
 for(let z=0;z<dims[2];z++)for(let y=0;y<dims[1];y++)for(let x=0;x<dims[0];x++){
  point.set(bounds.min.x+(x+.5)/dims[0]*size.x,bounds.min.y+(y+.5)/dims[1]*size.y,bounds.min.z+(z+.5)/dims[2]*size.z);let best=Infinity;
  best=nearestDistance(tree,point,nearest);data[cursor++]=Math.sqrt(best);
 }
 const texture=new Data3DTexture(data,...dims);Object.assign(texture,{format:RedFormat,type:FloatType,minFilter:LinearFilter,magFilter:LinearFilter,unpackAlignment:1,needsUpdate:true});
 field={texture,bounds,size,dims,users:1};fields.set(geometry,field);return field;
}
function releaseField(geometry,field){if(--field.users===0){field.texture.dispose();fields.delete(geometry);}}

export class WeaponFlameVolume{
 constructor(source,group){
  this.source=source;this.field=acquireField(source.geometry);const f=this.field;
  const material=new ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,side:BackSide,blending:NormalBlending,toneMapped:false,
   uniforms:{distanceMap:{value:f.texture},noiseMap:{value:acquireNoise()},fieldMin:{value:f.bounds.min.clone()},fieldSize:{value:f.size.clone()},boxMin:{value:new Vector3()},boxMax:{value:new Vector3()},worldToSource:{value:new Matrix4()},center:{value:new Vector3()},metric:{value:1},time:{value:0},gain:{value:0},width:{value:.06},height:{value:.3},style:{value:1},tint:{value:new Vector3(.1,.3,1)}},
   vertexShader:'varying vec3 vWorld;void main(){vec4 p=modelMatrix*vec4(position,1.);vWorld=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}',
   fragmentShader:`precision highp sampler3D;
   uniform sampler3D distanceMap;uniform sampler3D noiseMap;
   uniform vec3 fieldMin,fieldSize,boxMin,boxMax,center,tint;uniform mat4 worldToSource;
   uniform float metric,time,gain,width,height,style;varying vec3 vWorld;
   float field(vec3 world){vec3 local=(worldToSource*vec4(world,1.)).xyz;vec3 p=(local-fieldMin)/fieldSize;vec3 c=clamp(p,vec3(.0125),vec3(.9875));return (texture(distanceMap,c).r+length((p-c)*fieldSize))*metric;}
   float noise(vec3 p){return texture(noiseMap,p).r*.57+texture(noiseMap,p*2.03+vec3(.31)).r*.29+texture(noiseMap,p*4.11+vec3(.71)).r*.14;}
   void main(){vec3 rd=normalize(vWorld-cameraPosition),ro=(worldToSource*vec4(cameraPosition,1.)).xyz,dir=(worldToSource*vec4(rd,0.)).xyz;
    vec3 inv=1./dir,t0=(boxMin-ro)*inv,t1=(boxMax-ro)*inv,nearV=min(t0,t1),farV=max(t0,t1);
    float start=max(0.,max(max(nearV.x,nearV.y),nearV.z)),end=min(min(farV.x,farV.y),farV.z);if(end<=start)discard;
    float stepSize=(end-start)/40.;vec4 sum=vec4(0.);
    for(int i=0;i<40;i++){
     vec3 p=cameraPosition+rd*(start+(float(i)+.5)*stepSize);
     vec3 coord=p*(.06/max(width,.01))*vec3(1.,.32,1.)-vec3(0.,time*(style<.5?.32:style<1.5?.7:.5),0.);
     float n=noise(coord),curl=texture(noiseMap,coord.yzx+vec3(.37)).r-.5;
     vec3 warp=vec3(n-.5,0.,curl)*width*(style>1.5?1.8:1.1);
     float base=field(p),middle=field(p-vec3(0.,height*.38,0.)+warp),tip=field(p-vec3(0.,height*(.3+n*1.35),0.)+warp*1.7);
     float plume=1.-smoothstep(width*.1,width*.82,min(middle+width*.14,tip+width*.36));
     float core=1.-smoothstep(width*.06,width*.58,base);
     float density=max(core,plume*smoothstep(.34,.64,n));
     float a=1.-exp(-density*stepSize*62.*gain);float heat=clamp(core*.75+density*.25,0.,1.);
     vec3 color=mix(tint*.7,tint*1.7+vec3(.13),heat);
     sum.rgb+=(1.-sum.a)*a*color;sum.a+=(1.-sum.a)*a;if(sum.a>.97)break;
    }
    if(sum.a<.003)discard;gl_FragColor=vec4(sum.rgb/max(sum.a,.001),sum.a);
    #include <colorspace_fragment>
   }`});
  this.mesh=new Mesh(new BoxGeometry(1,1,1),material);this.mesh.name='continuous-weapon-fire-'+source.name;this.mesh.matrixAutoUpdate=false;this.mesh.frustumCulled=false;this.mesh.userData.excludeInkOutline=true;this.mesh.visible=false;group.add(this.mesh);
 }
 sample({age,mode,size,intensity,gain,color}){
  const source=this.source;source.updateWorldMatrix(true,false);let visible=true;for(let p=source;p;p=p.parent)if(!p.visible){visible=false;break;}
  visible&&=(Array.isArray(source.material)?source.material:[source.material]).some(material=>material.opacity>.002);
  this.mesh.visible=visible&&intensity*gain>.002;if(!this.mesh.visible)return;
  const u=this.mesh.material.uniforms,scale=source.getWorldScale(new Vector3()),metric=Math.min(Math.abs(scale.x),Math.abs(scale.y),Math.abs(scale.z)),width=(mode==='edge'?.032:mode==='flame'?.065:.05)*size,height=(mode==='edge'?.10:mode==='flame'?.28:.21)*size;
  u.worldToSource.value.copy(source.matrixWorld).invert();u.metric.value=metric;u.time.value=age;u.gain.value=intensity*gain;u.width.value=width;u.height.value=height;u.style.value=mode==='edge'?0:mode==='flame'?1:2;u.tint.value.set(color.r,color.g,color.b);
  const localUp=new Vector3(0,height,0).applyMatrix4(new Matrix4().copy(source.matrixWorld).setPosition(0,0,0).invert()),pad=(width*1.5)/metric;
  u.boxMin.value.copy(this.field.bounds.min).add(new Vector3(Math.min(0,localUp.x),Math.min(0,localUp.y),Math.min(0,localUp.z))).addScalar(-pad);
  u.boxMax.value.copy(this.field.bounds.max).add(new Vector3(Math.max(0,localUp.x),Math.max(0,localUp.y),Math.max(0,localUp.z))).addScalar(pad);
  const center=u.boxMin.value.clone().add(u.boxMax.value).multiplyScalar(.5),span=u.boxMax.value.clone().sub(u.boxMin.value);
  this.mesh.matrix.copy(source.matrixWorld).multiply(new Matrix4().makeTranslation(center.x,center.y,center.z)).multiply(new Matrix4().makeScale(span.x,span.y,span.z));this.mesh.matrixWorldNeedsUpdate=true;
  u.center.value.copy(this.field.bounds.getCenter(new Vector3())).applyMatrix4(source.matrixWorld);
 }
 dispose(){releaseField(this.source.geometry,this.field);if(--noiseUsers===0){noiseTexture.dispose();noiseTexture=null;}this.mesh.geometry.dispose();this.mesh.material.dispose();this.mesh.removeFromParent();}
}
