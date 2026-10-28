// Real 1280×640 renders of the shipped map factories. See the capture manifest.
// Scene variants sharing a native ID have deliberately distinct photographs.
export const MAP_INTERIOR_SCENES=Object.freeze({
 arena:null,station2:66,'station2-modular':66,circle2:93,'circle2-classic':93,
 'azit':15,'alice-house':225,'bio-lab':19,'blade-city':158,ironheart:151,'practice-52':52,'practice-54':54,
});
const canonical=Object.freeze({15:'azit',19:'bio-lab',52:'practice-52',54:'practice-54',66:'station2',93:'circle2-classic',151:'ironheart',158:'blade-city',225:'alice-house'});
const previews=Object.freeze(Object.fromEntries(Object.keys(MAP_INTERIOR_SCENES).map(key=>[key,Object.freeze({image:'/assets/ui/map-interiors/'+key+'-v1.png',width:1280,height:640})])));
export function mapInteriorPreview(nativeMapId,sceneKey=null){
 const key=sceneKey??(Number.isSafeInteger(nativeMapId)?canonical[nativeMapId]:null);
 if(typeof key!=='string'||!Object.hasOwn(MAP_INTERIOR_SCENES,key)||MAP_INTERIOR_SCENES[key]!==nativeMapId)return null;
 return previews[key];
}
