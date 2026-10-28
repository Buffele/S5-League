// Budgets are physical pixels, independent of the monitor's CSS scaling.
export const RENDER_QUALITY={
 performance:{label:'Performance',pixelRatio:1,pixels:1920*1080,scale:.8,shadowSize:1024,outlineRatio:.75,bloom:false},
 balanced:{label:'Balanced',pixelRatio:1.25,pixels:2560*1440,scale:1,shadowSize:2048,outlineRatio:1,bloom:true},
 high:{label:'High',pixelRatio:2,pixels:3840*2160,scale:1,shadowSize:4096,outlineRatio:1.5,bloom:true},
};
const KEY='s5.graphics.quality';
export const normalizeRenderQuality=value=>Object.hasOwn(RENDER_QUALITY,value)?value:'balanced';
export function readRenderQuality(fallback='balanced'){try{const saved=localStorage.getItem(KEY);return saved===null?normalizeRenderQuality(fallback):normalizeRenderQuality(saved);}catch{return normalizeRenderQuality(fallback);}}
export function saveRenderQuality(value){try{localStorage.setItem(KEY,normalizeRenderQuality(value));}catch{}}
export function renderPixelRatio(quality,width,height,dpr=1){
 const budget=RENDER_QUALITY[normalizeRenderQuality(quality)];
 return Math.min(Math.max(.25,Number(dpr)||1),budget.pixelRatio,Math.sqrt(budget.pixels/Math.max(1,width*height)))*budget.scale;
}
export function applyShadowBudget(renderer,sun,quality,enabled=true){
 const size=RENDER_QUALITY[normalizeRenderQuality(quality)].shadowSize;
 // Artist-map presentation can mute the shared sun and provide its own key.
 // A zero-intensity light contributes no illumination; its shadow pass is
 // wasted work. Keep global shadows enabled for the active map's own lights.
 renderer.shadowMap.enabled=enabled;sun.castShadow=enabled&&sun.intensity!==0;
 if(sun.shadow.mapSize.x!==size||sun.shadow.mapSize.y!==size){
  sun.shadow.map?.dispose();sun.shadow.map=null;
  sun.shadow.mapPass?.dispose();sun.shadow.mapPass=null;
  sun.shadow.mapSize.set(size,size);
 }
 // Keep per-frame dynamic shadows: movement/attacks must never reuse stale poses.
 renderer.shadowMap.needsUpdate=true;sun.shadow.needsUpdate=true;
}
export function surfaceDetailSize(width,height,maxSize=512){
 const scale=Math.min(1,maxSize/Math.max(width,height));
 return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}
