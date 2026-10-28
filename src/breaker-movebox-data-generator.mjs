import fs from 'node:fs';
const out={};
for(const sex of ['male','female']){
 const delta=JSON.parse(fs.readFileSync(new URL(`../public/assets/s5runtime/animations/breaker/${sex}.json`,import.meta.url)));
 const bone=delta.bones.find(item=>item.name==='MoveBox');out[sex]={};
 for(const clip of ['HM001','HM002','HM004','HM005']){const data=bone.animations[clip].data;out[sex][clip]={durationTicks:data.durationTicks,positions:data.positions};}
}
fs.writeFileSync(new URL('./breaker-movebox-data.js',import.meta.url),`// Generated from verified Breaker rig deltas.\nexport const BREAKER_MOVEBOX=${JSON.stringify(out)};\n`);
