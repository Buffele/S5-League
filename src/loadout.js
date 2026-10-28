export const WEAPON_CHOICES={
  handgun:{name:'Hand Gun',idle:'QQ000',experimental:true,skins:{classic:'Classic'}},
  assaultrifle:{name:'Assault Rifle',idle:'AS000',experimental:true,skins:{classic:'Classic'}},
  burstshotgun:{name:'Burst Shotgun',idle:'SS000',experimental:true,skins:{classic:'Classic'}},
  heavymachinegun:{name:'Heavy Machine Gun',idle:'F0002',experimental:true,nativeReady:false,skins:{classic:'Classic'}},
  rocketlauncher:{name:'Rocket Launcher',idle:'RL014',experimental:true,skins:{classic:'Classic'}},
  cannonade:{name:'Cannonade',idle:'E0018',experimental:true,skins:{classic:'Classic'}},
  demonicknuckle:{name:'Demonic Knuckle',idle:'KN000',experimental:true,skins:{classic:"Demon’s Fist (current asset)"}},
  deathscythe:{name:'Death Scythe',idle:'GR000',idleBySex:{male:'GR000',female:'GR000_1'},experimental:true,skins:{classic:'EXO (current asset)'}},
  vitalshock:{name:'Vital Shock',idle:'C0011',experimental:true,skins:{classic:'Black Cat (current asset)'}},
  sigmablade:{name:'Sigma Blade',idle:'DC000',experimental:true,skins:{classic:'Classic'}},
  ironboots:{name:'Iron Boots',idle:'IB000',experimental:true,skins:{classic:'Classic'}},
  bat:{name:'Bat / Storm Bat',idle:'A0013',experimental:true,skins:{classic:'Classic'}},
  assassinclaw:{name:'Assassin Claw (formerly Vital Shock)',idle:'C0011',experimental:true,skins:{classic:'Classic'}},
  twinblade:{name:'Twin Blade',idle:'SG003',experimental:true,skins:{classic:'Classic'}},
  katana:{name:'Katana',idle:'KT004',experimental:true,skins:{classic:'Classic'}},
  semirifle:{name:'Semi Rifle',idle:'W0000',experimental:true,skins:{classic:'Classic'}},
  submachinegun:{name:'Submachine Gun',idle:'D0026',experimental:true,skins:{classic:'Classic'}},
  revolver:{name:'Revolver',idle:'Q0000',experimental:true,skins:{classic:'Classic'}},
  smashrifle:{name:'Smash Rifle',idle:'DD000',experimental:true,skins:{classic:'Classic'}},
  airgun:{name:'Air Gun',idle:'AW000',experimental:true,skins:{classic:'Classic'}},
  dagger:{name:'Spy Dagger',idle:'SN002',skins:{classic:'Classic',reward:'Reward',meshy:'Meshy · prototype'}},
  plasma:{name:'Plasma Sword',idle:'A0013',skins:{classic:'Classic',mark2:'Mark II',meshy:'Meshy · prototype'}},
  breaker:{name:'Breaker',idle:'HM000',skins:{classic:'Classic'}},
  counter:{name:'Counter Sword',idle:'R0004',skins:{classic:'Classic',gold:'Gold Reward',meshy:'Meshy · prototype'}},
};
export function readLoadout(params){
  const weapon=Object.hasOwn(WEAPON_CHOICES,params.get('weapon'))?params.get('weapon'):'dagger';
  return {sex:params.get('sex')==='female'?'female':'male',outfit:params.get('outfit')==='02'?'02':'01',weapon,
    weaponSkin:Object.hasOwn(WEAPON_CHOICES[weapon].skins,params.get('weaponSkin'))?params.get('weaponSkin'):'classic'};
}
