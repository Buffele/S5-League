// Current-PE1182430 ordered extrema/expansion sphere,1181820 affine update.
// Source algorithm port; source geometry/order and native observations remain
// external. Float32 stores modeled; x87/library bitwise equivalence unclaimed.
const f=Math.fround;
function vector(v,name){if(!Array.isArray(v)||v.length!==3||!v.every(x=>Number.isFinite(x)&&Number.isFinite(f(x))))throw new TypeError(`${name} finite float32 vector required`);return v.map(f);}
function provenance(p){if(!['source-port','s5-explicit-adaptation'].includes(p?.kind)||typeof p.source!=='string'||!p.source.trim())throw new TypeError('Explicit geometry/matrix provenance required');}
const distanceSquared=(a,b)=>{const d=a.map((v,i)=>f(v-b[i]));return f(f(f(d[0]*d[0])+f(d[1]*d[1]))+f(d[2]*d[2]));};

export function createNativeShieldLocalSphere({orderedVertices,provenance:origin}={}){
 provenance(origin);if(!Array.isArray(orderedVertices)||orderedVertices.length===0)throw new TypeError('Nonempty source-ordered vertex stream required');
 const vertices=orderedVertices.map((v,i)=>vector(v,`vertex${i}`));
 if(vertices.some(v=>v.some(x=>Math.abs(x)>=100000000)))throw new RangeError('Vertex outside supported native extrema sentinel range±1e8');
 const minima=[vertices[0],vertices[0],vertices[0]],maxima=[vertices[0],vertices[0],vertices[0]];
 for(const v of vertices)for(let axis=0;axis<3;axis++){if(v[axis]<minima[axis][axis])minima[axis]=v;if(v[axis]>maxima[axis][axis])maxima[axis]=v;}
 let seedAxis=0,seedDistance=distanceSquared(minima[0],maxima[0]);
 for(let axis=1;axis<3;axis++){const d=distanceSquared(minima[axis],maxima[axis]);if(d>seedDistance){seedAxis=axis;seedDistance=d;}}
 const first=minima[seedAxis],second=maxima[seedAxis];
 let center=first.map((v,i)=>f(f(v+second[i])*.5));
 let radiusSquared=distanceSquared(second,center),radius=f(Math.sqrt(radiusSquared)),expansions=0;
 for(const point of vertices){
  const d2=distanceSquared(point,center);
  if(d2>radiusSquared){
   const distance=f(Math.sqrt(d2));radius=f((radius+distance)/2);radiusSquared=f(radius*radius);
   const gap=f(distance-radius);
   center=center.map((v,i)=>f((radius*v+gap*point[i])/distance));expansions++;
  }
 }
 if(!Number.isFinite(radius)||!center.every(Number.isFinite))throw new RangeError('Sphere arithmetic outside supported finite geometry');
 return {center,radius,seedAxis,expansions,vertexCount:vertices.length,orderedVerticesPreserved:true,
  sourceAlgorithm:'1182430',sourceConstructionAlgorithmVerified:true,provenance:{...origin},
  nativeSphereConstructionVerified:false,nativeCompared:false,x87BitwiseParityVerified:false};
}

export function transformNativeShieldSphere({localSphere,matrixElements,provenance:origin}={}){
 provenance(origin);const center=vector(localSphere?.center,'sphere center'),radius=f(localSphere?.radius);
 if(!Number.isFinite(radius)||radius<0)throw new TypeError('Finite nonnegative local radius required');
 if(!Array.isArray(matrixElements)||matrixElements.length!==16||!matrixElements.every(x=>Number.isFinite(x)&&Number.isFinite(f(x))))throw new TypeError('Explicit16 native matrix floats required');
 const m=matrixElements.map(f);
 if(m[3]!==0||m[7]!==0||m[11]!==0||m[15]!==1)throw new RangeError('Only affine w=1 matrix branch supported; no implicit perspective normalization');
 const axes=[[m[0],m[1],m[2]],[m[4],m[5],m[6]],[m[8],m[9],m[10]]];
 const scale=axes.map(a=>f(Math.sqrt(f(f(f(a[0]*a[0])+f(a[1]*a[1]))+f(a[2]*a[2])))));
 const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
 const orthogonal=dot(axes[0],axes[1])===0&&dot(axes[0],axes[2])===0&&dot(axes[1],axes[2])===0;
 const worldCenter=center.map((_,i)=>f(f(f(f(center[0]*m[i])+f(center[1]*m[4+i]))+f(center[2]*m[8+i]))+m[12+i]));
 return {center:worldCenter,radius:f(radius*Math.max(...scale)),axisScales:scale,sourceAlgorithm:'1181820/100E050 affine branch',
  sourceConstructionAlgorithmVerified:true,localSpherePreserved:true,maxAxisScaleConservativeForOrthogonalBasis:orthogonal,
  provenance:{...origin},nativeSphereConstructionVerified:false,nativeCompared:false,x87BitwiseParityVerified:false};
}
