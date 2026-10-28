import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';

// The XML Scene.texture override belongs to1314 alone. Geometry, hierarchy,
// animation data, material flags and per-mesh sampler policy remain authored.
export const CONQUEST_BISHOP_SNIPE_MATERIAL=Object.freeze({
 monsterKey:1314,model:'model/monster/pve_mon_bishop.scn',
 source:'model/monster/pve_monster_bishop_basic_2.dds',
 sourceCRC32:'b8a3e956',sourceSha256:'8d4e4d07b8cdbcaab026cc6602884fb71acce16247fbbff3947a24db47d866ed',
 url:'/assets/conquest/bishop-snipe-presentation/pve_monster_bishop_basic_2.png',
 pngSha256:'e33b55fb0aab5d6ad9ff052c533aa336feadd752037318f1c5310b0bd6d2bea9',
 width:256,height:256,nativeGPUQualified:false,
});

export function conquestBishopSnipeMaterialData(data,{monsterKey}={}){
 if(monsterKey!==1314)return data;
 const spec=CONQUEST_BISHOP_SNIPE_MATERIAL;
 if(CONQUEST_SOURCE_DATA.monsters[1314].Scene.texture.toLowerCase()!==spec.source||data?.source!==spec.model||!Array.isArray(data.models)||data.models.length!==15||data.models.some(model=>!Array.isArray(model.textures)||model.textures.length!==1||model.textures[0].source!=='pve_monster_bishop_basic.dds'))throw Error('Exact authored1314 XML texture override and Bishop base-color bindings required');
 return {...data,models:data.models.map(model=>({...model,textures:model.textures.map(texture=>({...texture,name:spec.url}))}))};
}
