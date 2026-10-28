import {CONQUEST_ATTACK_BOX_SOURCE} from './conquest-monster-attack-geometry.js';
import {assertConquestQueenAttackDeclaration} from './conquest-queen-attack.js';
const f=Math.fround;
function vector(value,label){
 if(!Array.isArray(value)||value.length!==3||!value.every(n=>Number.isFinite(n)&&Number.isFinite(f(n))))throw Error('Explicit native '+label+' vec3 required');
 return value.map(f);
}
function boolean(value,label){if(typeof value!=='boolean')throw Error('Explicit native '+label+' boolean required');return value;}
function nonnegative(value,label){if(!Number.isFinite(value)||!Number.isFinite(f(value))||value<0)throw Error('Native nonnegative '+label+' required');return f(value);}
function normalize(value){const square=f(f(f(value[0]*value[0])+f(value[1]*value[1]))+f(value[2]*value[2])),length=f(Math.sqrt(square));if(!(length>0))throw Error('Nonzero native direction required');return value.map(v=>f(v/length));}

// 5F5790 and 53FAF0 use this threshold, not the different97EC00 visual
// facing shortcut. Quaternion/matrix math is a bounded scalar port; original
// DLL29 CPU cases carry explicit numeric tolerances, not live-pose evidence.
function sourceRotation(direction){
 const d=vector(direction,'rotation direction');
 let axis,angle;
 if(d[2]>CONQUEST_ATTACK_BOX_SOURCE.halfTurnThreshold){axis=[0,1,0];angle=CONQUEST_ATTACK_BOX_SOURCE.pi;}
 else {
  const length=f(Math.sqrt(f(f(f(d[0]*d[0])+f(d[1]*d[1]))+f(d[2]*d[2]))));
  angle=f(Math.acos(f(f(-d[2])/length)));if(Number.isNaN(angle))angle=0;
  const raw=[d[1],f(-d[0]),0],squared=f(raw[0]*raw[0]+raw[1]*raw[1]);
  axis=squared>1.1754943508222875e-38?raw.map(v=>f(v/Math.sqrt(squared))):[0,0,0];
 }
 const half=f(angle*.5),s=f(Math.sin(half)),[x,y,z]=axis.map(v=>f(v*s)),w=f(Math.cos(half));
 const matrix=[f(1-2*y*y-2*z*z),f(2*x*y+2*z*w),f(2*x*z-2*y*w),
  f(2*x*y-2*z*w),f(1-2*x*x-2*z*z),f(2*y*z+2*x*w),
  f(2*x*z+2*y*w),f(2*y*z-2*x*w),f(1-2*x*x-2*y*y)];
 return {matrix,quaternion:[x,y,z,w]};
}
const rotate=(v,m)=>[0,1,2].map(i=>f(f(f(v[0]*m[i])+f(v[1]*m[3+i]))+f(v[2]*m[6+i])));


// Same original5F5790 arithmetic, with each authenticated Queen BOX instead
//of the ordinary Pawn dimensions. Actor size does not scale authored shapes.
export function conquestQueenWorldAttackBox({attack,position7c,direction8c}){
 assertConquestQueenAttackDeclaration(attack);if(attack.shapeType!==1)throw Error('Authored Queen BOX declaration required');const position=vector(position7c,'Queen7C'),direction=vector(direction8c,'Queen8C');
 if(direction[1]!==0||Math.abs(Math.hypot(...direction)-1)>1e-5)throw Error('Source-normalized horizontal Queen attack direction required');
 const matrix=sourceRotation(direction).matrix,box=attack.box;
 return {type:1,origin:rotate(box.origin,matrix).map((v,i)=>f(v+position[i])),direction:normalize(rotate(box.direction,matrix)),width:box.width,height:box.height,depth:box.depth,
  source:'5F5790/authenticated-Queen1403',coordinateSpace:'native',orientDirection280:true,placeOrigin281:true,nativeReady:false};
}
