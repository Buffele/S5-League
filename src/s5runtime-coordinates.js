// Source-local equipment and character transforms stay in SCN coordinates.
// Column-major Three arrays already represent the transpose of S5Runtime's
// row-vector matrices. Do NOT transpose again, mirror a hand or swap L/R.
export const SCN_SCENE_SCALE=.006;
export const sourceActorYaw=facing=>facing+Math.PI;

// Only the legacy Station 2 world presentation mirrors Z. This boundary is
// independent of the character's heading and of weapon-to-hand attachment.
export function sourceMapScale(mirrorZ=false){
  return [SCN_SCENE_SCALE,SCN_SCENE_SCALE,mirrorZ?-SCN_SCENE_SCALE:SCN_SCENE_SCALE];
}
export function sourceMapPoint(point,mirrorZ=false){
  const scale=sourceMapScale(mirrorZ);
  return {x:point.x*scale[0],y:point.y*scale[1],z:point.z*scale[2]};
}
export function nativeMapPoint(point,mirrorZ=false){
  const scale=sourceMapScale(mirrorZ);
  return {x:point.x/scale[0],y:point.y/scale[1],z:point.z/scale[2]};
}
export function sourceActorVector(vector,facing,scale=SCN_SCENE_SCALE){
  const angle=sourceActorYaw(facing),c=Math.cos(angle),s=Math.sin(angle);
  return {x:(vector.x*c+vector.z*s)*scale,y:vector.y*scale,z:(-vector.x*s+vector.z*c)*scale};
}
