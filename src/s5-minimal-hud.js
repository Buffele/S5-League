import {readS4EquipmentAmmo} from './s4-equipment-ui.js';
import {createHudFeedback} from './s5-hud-feedback.js';

export function ammunitionPips(current,capacity){
 if(!Number.isFinite(current)||!Number.isFinite(capacity)||capacity<=0)return null;
 const count=Math.min(12,Math.ceil(capacity));
 return Array.from({length:count},(_,i)=>current/capacity>i/count);
}

/** Presentation only. The controller, health, mode clocks and combat retain ownership. */
export function installMinimalHud({document:doc=globalThis.document,terrainRadar=false}={}){
 const make=(tag,id)=>{const el=doc.createElement(tag);el.id=id;return el;};
 const host=doc.getElementById('hud'),weapon=doc.getElementById('weapon');
 const feedback=createHudFeedback({document:doc,host,weapon});
 const pips=make('div','s5-ammo-pips');pips.setAttribute('aria-hidden','true');weapon.append(pips);
 const skill=make('div','s5-skill');skill.hidden=true;const skillIcon=doc.createElement('img');skill.append(skillIcon);doc.body.append(skill);
 // Collision outlines are an explicit diagnostic aid, not the source minimap.
 const radar=make('div','s5-radar');radar.hidden=!terrainRadar;radar.setAttribute('role','img');radar.setAttribute('aria-label','Diagnostic collision terrain radar · north up');
 const canvas=doc.createElement('canvas');canvas.width=canvas.height=256;radar.append(canvas);const north=doc.createElement('span');north.textContent='N';radar.append(north);doc.body.append(radar);
 const context=canvas.getContext('2d');let lastWorld=null,lines=[],lastRadar=-Infinity,lastPips='',lastSkill=null,disposed=false;
 function terrain(world){
  lines=[];
  for(const box of world?.colliders??[]){if(box.maxY-box.minY<.1)continue;const {minX:x,maxX:X,minZ:z,maxZ:Z}=box;lines.push([[x,z],[X,z]],[[X,z],[X,Z]],[[X,Z],[x,Z]],[[x,Z],[x,z]]);}
  // Static collision edges, decimated once per world, never the full scene per frame.
  const triangles=world?.triangles??[],step=Math.max(1,Math.ceil(triangles.length/5000));
  for(let i=0;i<triangles.length;i+=step){const t=triangles[i];for(let j=0;j<3;j++)lines.push([[t[j][0],t[j][2]],[t[(j+1)%3][0],t[(j+1)%3][2]]]);}
 }
 function update({controller,health,world,visible=true,skillState,maxSp=1,now=performance.now()}={}){
  if(disposed)return;radar.hidden=!visible||!terrainRadar;
  const hp=Number.isFinite(health?.hp)?health.hp:null,max=health?.maxHp||100;
  host.classList.toggle('s5-low-hp',hp!==null&&hp>0&&hp/max<=.25);
  const state=controller?.rifle??controller?.rocketLauncher??controller?.airgun??controller?.cannonade,ammo=readS4EquipmentAmmo(controller);
  feedback.update({visible,hp,maxHp:max,sp:controller?.energy,maxSp,ammo,phase:state?.phase??'',weaponKey:controller?.weapon??state,now});
  const pattern=ammunitionPips(ammo?.current,state?.capacity??(controller?.airgun?3:controller?.cannonade?4:controller?.rocketLauncher?1:null));
  const key=JSON.stringify(pattern);if(key!==lastPips){lastPips=key;pips.replaceChildren();for(const on of pattern??[]){const pip=doc.createElement('i');pip.className=on?'is-loaded':'';pips.append(pip);}}pips.hidden=!ammo||!pattern;
  const item=skillState?.itemKey??controller?.s5runtimeSkill?.itemKey??null;
  if(item!==lastSkill){lastSkill=item;if(item!==null){skillIcon.src=`/assets/s5runtime/skills/${item}.png`;skillIcon.alt=doc.getElementById('skill-select')?.selectedOptions?.[0]?.textContent??'Equipped skill';}else skillIcon.removeAttribute('src');}
  skill.hidden=!visible||item===null;skill.classList.toggle('is-active',!!skillState?.active);
  if(!terrainRadar||!visible||now-lastRadar<100||!context)return;lastRadar=now;
  if(world!==lastWorld){lastWorld=world;terrain(world);}
  const p=controller?.position;if(!p)return;const scale=256/64;context.clearRect(0,0,256,256);context.save();context.beginPath();context.rect(6,6,244,244);context.clip();
  context.strokeStyle='#b7d2e45c';context.lineWidth=.8;context.beginPath();
  for(const [a,b]of lines){const ax=128+(a[0]-p.x)*scale,az=128+(a[1]-p.z)*scale,bx=128+(b[0]-p.x)*scale,bz=128+(b[1]-p.z)*scale;if(Math.max(ax,bx)<0||Math.min(ax,bx)>256||Math.max(az,bz)<0||Math.min(az,bz)>256)continue;context.moveTo(ax,az);context.lineTo(bx,bz);}context.stroke();
  context.translate(128,128);context.rotate(Math.PI-(controller?.facing??0));context.fillStyle='#fff';context.beginPath();context.moveTo(0,-10);context.lineTo(6,7);context.lineTo(0,4);context.lineTo(-6,7);context.closePath();context.fill();context.restore();
 }
 return {update,dispose(){disposed=true;feedback.dispose();pips.remove();skill.remove();radar.remove();host.classList.remove('s5-low-hp','s5-damaged');}};
}
