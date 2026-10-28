import {meleeMotifProfile} from './melee-art-motifs.js';
// Additional S5 art directions. These group existing actions; they never add
// combat states or input bindings. Native models/particles/audio remain active.
export const EXTRA_MELEE_EFFECTS=Object.freeze({
 katana:{code:'K',names:['Lightblade','Samurai Echoes','Cutting Wind'],color:0x70cfff,rows:[['combo','Left click · combo'],['power','Power strike'],['air','Air attack'],['charge','Backstep and charge'],['release','Charged rush']]},
 twinblade:{code:'T',names:['Twin Edges','Duplication','Linked Spirals'],color:0x62dfff,rows:[['combo','Twin-blade combo'],['air','Air attack'],['charge','Charge'],['release','Blade launch']]},
 breaker:{code:'H',names:['Blazing Hammer','Echo Wave','Gravity Pressure'],color:0xffa557,rows:[['strike','Primary strike'],['air','Air attack'],['charge','Charge'],['power','Charged strike']]},
 assassinclaw:{code:'A',names:['Electric Talons','Spectral Claw','Living Current'],color:0x70e9c1,rows:[['strike','Left click · claw strike']]},
 ironboots:{code:'I',names:['Jet Heels','Ghost Steps','Rising Currents'],color:0x5edaff,rows:[['combo','Kick combo'],['upper','Uppercut'],['air','Air attack'],['slide','Slide'],['boost','Boost']]},
 sigmablade:{code:'S',names:['Overload','Phase Blade','Unstable Flux'],color:0xb895ff,rows:[['combo','Combo · both forms'],['power','Power strike · both forms'],['air','Air attack'],['transform','Transformation']]},
 vitalshock:{code:'V',names:['Ion Claw','Feline Afterimage','Voltage Arcs'],color:0x69baff,rows:[['strike','Primary strike'],['power','Power strike and follow-up'],['air','Air attack'],['rush','Rush']]},
 deathscythe:{code:'F',names:['Astral Scythe','Spectral Harvest','Reaper Vortex'],color:0x9e96ff,rows:[['combo','Combo'],['upper','Uppercut'],['air','Air attack'],['special','Special and finisher']]},
 demonicknuckle:{code:'G',names:['Ember Fists','Phantom Strikes','Demon Breath'],color:0xff836b,rows:[['strike','Alternating strikes'],['air','Air attack'],['power','Protection attack']]},
});
const mappings={
 katana:{light:'combo',strong:'power',air:'air',backdash:'charge',charge:'charge',heavy:'release'},
 twinblade:{light:'combo',strong:'combo',air:'air',charge:'charge',gather:'charge',heavy:'release'},
 breaker:{light:'strike',strong:'strike',air:'air',charge:'charge',gather:'charge',heavy:'power'},
 assassinclaw:{light:'strike'},
 ironboots:{light:'combo',strong:'upper',air:'air',dash:'slide',heavy:'slide',boost:'boost'},
 sigmablade:{light:'combo',strong:'power',air:'air',heavy:'transform',transform:'transform'},
 vitalshock:{light:'strike',strong:'power',strongFollow:'power',air:'air',rush:'rush'},
 deathscythe:{light:'combo',heavy:'upper',uppercut:'upper',air:'air',strong:'special',strongFollow:'special'},
 demonicknuckle:{light:'strike',light2:'strike',air:'air',heavy:'power'},
};
export const extraMeleeAttack=(weapon,kind)=>mappings[weapon]?.[kind]??null;
export function extraMeleeProfile(p){
 const entry=EXTRA_MELEE_EFFECTS[p.weapon];if(!entry)return false;
 Object.assign(p,{color:entry.color,shell:true,width:.7,life:.27,parts:true});
 if(p.style==='A')Object.assign(p,{width:1.05,life:.18,shards:18,segmented:true});
 if(p.style==='B')Object.assign(p,{width:.48,life:.35,echo:'weapons',echoCount:3,echoLife:.62,interval:.09});
 if(p.style==='C')Object.assign(p,{width:.65,life:.38,flow:4,shards:8});
 if(p.action==='charge')Object.assign(p,{trail:false,flow:p.style==='C'?5:p.style==='B'?2:3,shards:p.style==='A'?12:0,charging:true});
 if(['rush','boost','slide','transform'].includes(p.action))Object.assign(p,{flow:p.style==='A'?2:p.style==='B'?3:5,echo:p.style==='B'?'body':p.echo,echoLife:.72,echoCount:3});
 Object.assign(p,meleeMotifProfile(p.weapon,p.style));p.flow=0;
 if(['power','release','special','upper'].includes(p.action)){p.width*=1.35;p.life+=.08;}
 return true;
}

// Suppression is opt-in only where an explicit substitute already exists.
// Counter's original deployed weapon is retained alongside its contour aura. Twin
// chains, Sigma transformation, charges and ground strikes retain their models.
export function replaceNativeAttackModels(attack){
 const weapon=attack?.weapon??(attack?.type?'dagger':null);
 return weapon==='dagger'||weapon==='plasma'&&attack.kind!=='heavy'||weapon==='bat'||weapon==='counter'&&attack.kind!=='heavy';
}
