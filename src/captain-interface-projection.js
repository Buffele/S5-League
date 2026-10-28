// Native startup499880 selects a logical768-high surface;118F470/F5A0
// use width/scale,height/scale, near1/far10000 in D3DXMatrixOrthoLH.
// Scale1 is the explicit startup value. Browser preset selection/letterboxing
// below is an S5 adapter, not a qualified native resize/physical viewport port.
export const CAPTAIN_INTERFACE_PRESETS=Object.freeze([
 Object.freeze({id:0,width:1024,height:768,aspect:4/3}),
 Object.freeze({id:1,width:1365,height:768,aspect:16/9}),
 Object.freeze({id:2,width:1229,height:768,aspect:16/10}),
]);
export function captainInterfaceViewport(width,height){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw RangeError('Positive Captain interface viewport required');
 const aspect=width/height,preset=CAPTAIN_INTERFACE_PRESETS.reduce((best,p)=>Math.abs(Math.log(aspect/p.aspect))<Math.abs(Math.log(aspect/best.aspect))?p:best);
 const viewHeight=Math.min(height,width/preset.aspect),viewWidth=viewHeight*preset.aspect;
 return {preset,scale:1,near:1,far:10000,x:(width-viewWidth)/2,y:(height-viewHeight)/2,width:viewWidth,height:viewHeight};
}
