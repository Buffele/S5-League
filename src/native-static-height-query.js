import {intersectS5RuntimeTrianglePacket} from './s5runtime-skill-shield-triangle.js';

//12797C0 static tree height query, not the manager/world90/category400 union.
// Inputs are in ONE explicit native coordinate space. This module is not
// connected to Controller; sourceS5 geometry adapters need separate proof.
const f=Math.fround;
const gates={nativeReady:false,nativeCompared:false,x87BitwiseParityVerified:false};
const uint=value=>Number.isInteger(value)&&value>=0&&value<=0xffffffff;
function xyz(value){
 if(!Array.isArray(value)||value.length!==3||!value.every(x=>Number.isFinite(x)&&Number.isFinite(f(x))))throw TypeError('Finite native float32 XYZ required');
 return value.map(f);
}
function bytes(value,offset,length){
 if(!ArrayBuffer.isView(value)||!Number.isInteger(offset)||offset<0||offset+length>value.byteLength)throw TypeError('Bounded native packet bytes required');
 return new DataView(value.buffer,value.byteOffset+offset,length);
}
export function decodeNativeTriangle40(value,offset=0){
 const view=bytes(value,offset,40),at=start=>xyz([0,1,2].map(i=>view.getFloat32(start+i*4,true)));
 return {vtable:view.getUint32(0,true),origin:at(4),edge1:at(0x10),edge2:at(0x1c)};
}
export function decodeNativeBounds28(value,offset=0){
 const view=bytes(value,offset,28),at=start=>xyz([0,1,2].map(i=>view.getFloat32(start+i*4,true)));
 return {vtable:view.getUint32(0,true),min:at(4),max:at(0x10)};
}
function bounds(value){
 const min=xyz(value?.min),max=xyz(value?.max);
 if(min.some((v,i)=>v>max[i]))throw TypeError('Ordered native bounds required');
 return {min,max};
}
const enabled=value=>value===true||typeof value==='number'&&value!==0;
const knownEnabled=value=>typeof value==='boolean'||Number.isInteger(value)&&value>=0&&value<=255;
const overlaps=(box,p,height)=>p[1]>=box.min[1]&&box.max[1]>=height&&
 p[0]>=box.min[0]&&p[0]<=box.max[0]&&p[2]>=box.min[2]&&p[2]<=box.max[2];

// A qualified tree has explicit bounds, branch boolean, ordered8 children or
// ordered leaf records. Each admitted enabled record supplies packets and the
// original per-triangle bounds, rather than recomputed geometry envelopes.
// raw14 is intentionally ignored by12797C0; raw10&mask andraw34 are required.
export function queryNativeStaticHeight({position,mask,tree,complete,initialHeight=-100000}={}){
 const p=xyz(position);
 if(!uint(mask)||!Number.isFinite(initialHeight)||!Number.isFinite(f(initialHeight)))throw TypeError('Explicit native mask and initial height required');
 let height=f(initialHeight),hit=false,selected=null,reason=null;
 const incomplete=why=>({qualified:false,hit:false,height:f(initialHeight),reason:why,...gates});
 if(complete!==true)return incomplete('tree-unqualified');
 const path=new Set();let visited=0;
 function visit(node){
  if(node===null)return;
  if(!node||path.has(node)||++visited>100000){reason='invalid-tree';return;}
  const box=bounds(node.bounds);if(!overlaps(box,p,height))return;
  path.add(node);
  if(node.branch===true){
   if(!Array.isArray(node.children)||node.children.length!==8)reason='children-unqualified';
   else for(const child of node.children){visit(child);if(reason)break;}
  }else if(node.branch===false){
   if(!Array.isArray(node.records))reason='leaf-records-unqualified';
   else for(const record of node.records){
    if(!uint(record?.raw10)||!knownEnabled(record.raw34)){reason='record-mask-or-enable-unqualified';break;}
    if(!(record.raw10&mask)||!enabled(record.raw34))continue;
    if(record.qualified!==true||!Array.isArray(record.packets)||!Array.isArray(record.triangleBounds)||record.packets.length!==record.triangleBounds.length){reason='record-geometry-unqualified';break;}
    for(let index=0;index<record.packets.length;index++){
     if(!overlaps(bounds(record.triangleBounds[index]),p,height))continue;
     const result=intersectS5RuntimeTrianglePacket({from:p,direction:[0,-1,0],packet:record.packets[index]});
     if(result.hit&&result.point[1]>height){height=result.point[1];hit=true;selected={record,index,point:result.point};}
    }
   }
  }else reason='branch-unqualified';
  path.delete(node);
 }
 visit(tree);
 return reason?incomplete(reason):{qualified:true,hit,height,selected,...gates};
}
