// Current PE7B1DD4..7B1EA8: ordinary static-triangle contact, descending
// setter flag1, first solver contact. The upper contact stops the descent when
// centerY-contactY > registry Float42 in ELLIPSOID space. This is not a world
// normal/slope threshold. Float42=.9 was also read live on17October2026.
// Only this branch is mapped here: native skin/backoff, later contacts and the
// lower-support ray7B1EB2..7B2045 remain separate, unported solver behavior.
export const NATIVE_DOWNWARD_UPPER_CONTACT_HEIGHT=Math.fround(.9);
export function nativeUpperEdgeSupport(contact,center,radii){
  if(!contact||!['edge','vertex'].includes(contact.kind))return false;
  // S5's explicit one-way ledges are not native static triangle geometry.
  // Their directional and sprint-specific support contract stays separate.
  if(contact.triangle?.oneWay)return false;
  if(!Number.isFinite(center?.y)||!Number.isFinite(contact.point?.y)||!(radii?.y>0))return false;
  // The source stores the normalized coordinates separately before subss.
  // The upstream S5 triangle sweep remains double precision, not a native port.
  const height=Math.fround(Math.fround(center.y/radii.y)-Math.fround(contact.point.y/radii.y));
  return height>NATIVE_DOWNWARD_UPPER_CONTACT_HEIGHT;
}
