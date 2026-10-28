const f=Math.fround;
const vector=v=>{if(!Array.isArray(v)||v.length!==3||v.some(n=>!Number.isFinite(n)||!Number.isFinite(f(n))))throw Error('Finite current Rook sort position required');return v.map(f);};
export const CONQUEST_ROOK_AURA_SORT_SOURCE=Object.freeze({wrapper:0x53bfd0,comparator:0x549750,importIat:0x139a6a4,crt:'msvcr120.dll',crtSha256:'86e39b5995af0e042fcdaa85fe2aefd7c9ddc7ad65e6327bd5e7058bc3ab615f',qsort:0x1001fdd6,shortSort:0x1001fb7e,recordBytes:20,smallSortLimit:8,nativeReady:false});

//549750: feet7C + (0,height6C*CONST_FLOAT33,0), then100B4F0.
// The comparison uses the original source FEET, not the aura sphere origin.
export function conquestRookAuraContactDistanceSquared(contact,sourcePosition7c,halfFactor=.5){
 const origin=vector(sourcePosition7c),position=vector(contact?.actor?.position7c),height=f(contact.actor.height6c),half=f(halfFactor);
 if(!Number.isFinite(height)||!Number.isFinite(half))throw Error('Finite current Rook sort height/factor required');
 const x=f(position[0]-origin[0]),y=f(f(position[1]+f(height*half))-origin[1]),z=f(position[2]-origin[2]);return f(f(f(x*x)+f(y*y))+f(z*z));
}

// Literal index port of this client's imported MSVCR120 qsort. Equal keys
// depend on the ENTIRE input/partition, so sorting tie groups afterwards is
// insufficient. No actor IDs and no JS sort enter any branch below.
export function orderConquestRookAuraContacts({contacts,sourcePosition7c,halfFactor=.5}={}){
 if(!Array.isArray(contacts))throw Error('Actual ordered Rook contacts required');vector(sourcePosition7c);
 const a=[...contacts],compare=(left,right)=>{const x=conquestRookAuraContactDistanceSquared(left,sourcePosition7c,halfFactor),y=conquestRookAuraContactDistanceSquared(right,sourcePosition7c,halfFactor);return y>x?-1:x>y?1:0;};
 const swap=(left,right)=>{if(left!==right){const record=a[left];a[left]=a[right];a[right]=record;}};
 const stack=[];let lo=0,hi=a.length-1;
 while(true){
  const size=hi-lo+1;
  if(size>1&&size<=8){
   //shortsort selects the FIRST strictly greatest record and swaps it with
   //the current last slot. All-equal small arrays therefore rotate left.
   for(let last=hi;last>lo;last--){let max=lo;for(let p=lo+1;p<=last;p++)if(compare(a[p],a[max])>0)max=p;swap(max,last);}
  }else if(size>8){
   let mid=lo+Math.floor(size/2);
   if(compare(a[lo],a[mid])>0)swap(lo,mid);
   if(compare(a[lo],a[hi])>0)swap(lo,hi);
   if(compare(a[mid],a[hi])>0)swap(mid,hi);
   let low=lo,high=hi;
   while(true){
    if(mid>low){do{low++;}while(low<mid&&compare(a[low],a[mid])<=0);}
    if(mid<=low){do{low++;}while(low<=hi&&compare(a[low],a[mid])<=0);}
    do{high--;}while(high>mid&&compare(a[high],a[mid])>0);
    if(high<low)break;
    swap(low,high);if(mid===high)mid=low;
   }
   high++;
   if(mid<high){do{high--;}while(high>mid&&compare(a[high],a[mid])===0);}
   if(mid>=high){do{high--;}while(high>lo&&compare(a[high],a[mid])===0);}
   // Native pushes the larger range and visits the smaller range first;
   // equal partition sizes choose the right range first.
   if(high-lo>=hi-low){if(lo<high)stack.push([lo,high]);if(low<hi){lo=low;continue;}}
   else {if(low<hi)stack.push([low,hi]);if(lo<high){hi=high;continue;}}
  }
  if(!stack.length)break;[lo,hi]=stack.pop();
 }
 return a;
}
