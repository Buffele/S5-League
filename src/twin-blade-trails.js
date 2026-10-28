import {Group} from 'three';
import {WeaponTrail} from './weapon-trail.js';

// Two actual rigid blade meshes; never attach the second trail to the skinned
// chain or to the first weapon mesh returned by avatar construction.
const BLADES=[
  {side:'right',source:'model/weapon/twinsword_r.scn',name:'twinsword_r'},
  {side:'left',source:'model/weapon/twinsword_l.scn',name:'twinsword_l'},
];
export class TwinBladeTrails {
  constructor(avatar,{texture=null}={}){
    this.mesh=new Group();this.mesh.name='twin-blade-motion-trails';
    this.proxies=new WeakMap();
    this.trails=BLADES.map(({side,source,name},index)=>{
      const blade=avatar.meshes.find(mesh=>mesh.userData.weapon&&mesh.userData.source===source&&mesh.name===name);
      if(!blade?.geometry?.attributes.position?.count)throw Error(`Missing Twin Blade ${side} blade geometry`);
      // Reuse S5's geometry-derived ribbon endpoints. These are not a port of
      // the native GhostTrail Line shape, tessellation or lifetime.
      const trail=new WeaponTrail(blade,{weapon:'twinblade',texture:Array.isArray(texture)?texture[index]:texture});
      trail.mesh.name=`twin-blade-${side}-trail`;this.mesh.add(trail.mesh);return trail;
    });
  }
  update(dt,attack,options={}){
    let proxy=null;
    if(attack){
      proxy=this.proxies.get(attack);
      if(!proxy){proxy={};this.proxies.set(attack,proxy);}
      // Keep identity stable between samples: WeaponTrail clears on new action.
      // The caller's attack and its ledger are never mutated by the renderer.
      Object.assign(proxy,attack,{weapon:'twinblade'});
    }
    for(const trail of this.trails)trail.update(dt,proxy,options);
  }
  clear(){for(const trail of this.trails)trail.clear();}
  dispose(){for(const trail of this.trails)trail.dispose();this.mesh.removeFromParent();}
}
