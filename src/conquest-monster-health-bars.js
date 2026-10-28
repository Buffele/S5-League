import {CanvasTexture,Sprite,SpriteMaterial,SRGBColorSpace} from 'three';
import {ConquestMonsterActor} from './conquest-monster-actor.js';
// S5 presentation of the actual retained monster HP, independent of damage/AI.
export function createConquestMonsterHealthBars({scene,actors,createCanvas=()=>document.createElement('canvas')}={}){
 if(!scene?.isScene||!(actors instanceof Map)||typeof createCanvas!=='function')throw Error('Actual scene and monster collection required');
 const bars=new Map();let disposed=false;
 function release(row){row.sprite.removeFromParent();row.sprite.material.dispose();row.texture.dispose();}
 function make(actor){const canvas=createCanvas();canvas.width=256;canvas.height=40;const context=canvas.getContext('2d');if(!context)throw Error('Health bar canvas unavailable');const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;const sprite=new Sprite(new SpriteMaterial({map:texture,transparent:true,depthTest:true,depthWrite:false,toneMapped:false}));sprite.name='conquest-health:'+actor.id;sprite.scale.set(2.4,.375,1);sprite.renderOrder=3;scene.add(sprite);return {sprite,texture,canvas,context,hp:null,max:null};}
 return Object.freeze({
  update({visible=true}={}){if(disposed)return;for(const[actor,row]of bars)if(actors.get(actor.id)!==actor||actor.health<=0){release(row);bars.delete(actor);}
   for(const actor of actors.values()){if(!(actor instanceof ConquestMonsterActor))throw Error('Actual Conquest monster health owner required');if(actor.health<=0)continue;let row=bars.get(actor);if(!row){row=make(actor);bars.set(actor,row);}row.sprite.visible=visible;const p=actor.positionNative;row.sprite.position.set(p.x*.006,(p.y+actor.height)*.006+.4,p.z*.006);
    if(row.hp!==actor.health||row.max!==actor.maxHealth){row.hp=actor.health;row.max=actor.maxHealth;const c=row.context;c.clearRect(0,0,256,40);c.fillStyle='#081521e8';c.fillRect(0,0,256,40);c.fillStyle='#ef657c';c.fillRect(4,4,248*Math.max(0,Math.min(1,row.hp/row.max)),32);c.strokeStyle='#f2efff';c.lineWidth=2;c.strokeRect(1,1,254,38);c.font='bold 25px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#ffffff';c.shadowColor='#000000';c.shadowBlur=3;c.fillText(Math.ceil(row.hp)+' / '+Math.ceil(row.max),128,21);row.texture.needsUpdate=true;}
   }
  },
  snapshot(){return {count:bars.size,visible:[...bars.values()].filter(r=>r.sprite.visible).length,values:[...bars].map(([actor,row])=>({id:actor.id,hp:row.hp,maxHp:row.max,position:row.sprite.position.toArray()}))};},
  dispose(){if(disposed)return;disposed=true;for(const row of bars.values())release(row);bars.clear();}
 });
}
