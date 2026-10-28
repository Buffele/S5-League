// Classic item2000001. Authenticated source/27 CAttack declarations:
// work/plasma-restoration/{parallel-pass,contact-analysis,effects-analysis}.json.
// This adapter does not replace the user-validated animation/movement clocks.
export const PLASMA_ABILITY=Object.freeze({itemKey:2000001,nativeType:0,power:17,range:500});
export const PLASMA_COMBAT_LIMITATIONS=Object.freeze([
  'Damage is InitAttack1 fourth argument, not certified final HP loss; equipment precedence, defence and critical selection remain unresolved.',
  'AdditionalPower is included in the fourth argument; the fifth AddtionalPower is misspelled and its binding remains unresolved.',
  'DependOn and AlwaysCritical are declarations; caller must choose an explicit critical policy, never blindly add both dependent objects.',
  'MAKEFAN/MAKEBOX static geometry is ported, but target body calibration, impact point and native filters are not certified.',
  'Stun arguments [1000,2500,0,1000] are preserved; interpreting the second as 2.5 seconds remains an arena policy.',
  'No animation duration, lower-body selection or previously corrected movement is changed by this adapter.',
]);
const names={light:'PlasmaSwordLight',strong:'PlasmaSwordHeavy',strongFollow:'PlasmaSwordHeavy2',heavy:'PlasmaSwordDash',air:'PlasmaSwordJumpAttack'};
const attr=name=>'ATTACKATTRIB_PLASMA_SWORD_'+name;
const box=(anchor,dimensions)=>({type:'box',anchor,direction:[0,0,-1],dimensions});
const contact=(id,timeMs,powerScale,attribute,shape,extra={})=>({id,timeMs,powerScale,attribute:attr(attribute),shape,conditions:[],initAttack2:[1,1,false],alwaysCritical:false,dependsOn:null,...extra});
const critical=(parent,timeMs,powerScale,attribute,shape)=>contact('Attack1',timeMs,powerScale,attribute,shape,{alwaysCritical:true,dependsOn:parent});
const shake=(factor1,factor2)=>({enable:[true,true,0],factor1,factor2,whenSuccess:true});

export function plasmaAttackContacts(kind,comboIndex=0,{channel='melee',range=PLASMA_ABILITY.range,power=PLASMA_ABILITY.power,additionalPower=0}={}){
  if(!Object.hasOwn(names,kind))throw new RangeError('Unknown Plasma action '+kind);
  if(!Number.isInteger(comboIndex)||comboIndex<0)throw new RangeError('Invalid Plasma combo index');
  if(!['melee','unlimited'].includes(channel))throw new RangeError('Unknown Plasma balance channel '+channel);
  if(!Number.isFinite(range)||range<=0||![power,additionalPower].every(Number.isFinite)||power<0)throw new TypeError('Invalid Plasma combat parameters');
  const melee=channel==='melee';let out;
  if(kind==='light'){
    out=[contact('Attack2',200,melee?.497:.5,'STAND_WEAK',{type:'fan',anchor:[0,140,-50],direction:[0,-1],parameters:[range*.5,range*.2,range*.7,120]}),
      critical('Attack2',200,melee?.373:.5,'CRITICAL',box([0,150,-50],[1,50,215.189786]))];
  }else if(kind==='strong'||kind==='strongFollow'){
    out=[contact('Attack2',400,melee?.994:1,'STAND_STRONG',box([0,250,0],[range*.45,range*.45,range*.9]),
      {conditions:[{type:'blow',arguments:[3000,2000]}],cameraShake:shake([100,50,20],[0,20,2000,3000])})];
    // Heavy2's MELEE critical block is commented in the current archive.
    if(kind==='strong'||!melee)out.push(critical('Attack2',400,melee?.746:1,'CRITICAL',melee?box([0,225,0],[1,100,317.025]):box([0,250,0],[1,50,range*.6])));
  }else if(kind==='heavy'){
    const factors=melee?[.187,.187,.187,.094,.094,.094]:[.17648,.17648,.14706,.14706,.17648,.17648];
    out=[200,266,332,400,450,500].map((timeMs,i)=>{
      const sourceVariable=i<3?'Attack2':i<5?'Attack3':'Attack4';
      return contact(sourceVariable+'#'+i,timeMs,factors[i],i===5?'ATTACK2':'ATTACK2_WEAK',box([0,173,100],[range*.6,187.5,range*.75]),
        {sourceVariable,successCondition:'CONDITION_ACTOR',...(i===5?{cameraShake:shake([100,50,50],[0,50,2000,3000])}:{})});
    });
  }else{
    out=[contact('Attack2',500,melee?.28:.5,'JUMP',box([0,25,-50],[range*.6,range*1.5,range*1.4]),{conditions:[{type:'stun',arguments:[1000,2500,0,1000]}]}),
      critical('Attack2',500,melee?.684:.5,'JUMP_CRITICAL',box([0,100,-50],[1,85,317]))];
  }
  return out.map((c,creationIndex)=>({...c,sourceVariable:c.sourceVariable||c.id,creationIndex,...plasmaContactAttributes(c.attribute),condition:c.conditions.at(-1)||null,
    damage:power*c.powerScale+additionalPower,damageMeaning:'InitAttack1 fourth argument only; no critical multiplier or defence applied',
    additionalPowerExpression:'AdditionalPower',fifthArgumentExpression:'AddtionalPower',
    source:{path:'script/attack/weapon_plasmasword_attack.lua',function:names[kind],branch:melee?'CHANNEL_MELEE':'else (commented CHANNEL_UNLIMITED)'}}));
}

export function plasmaContactAttributes(name){
  const key=name.replace('ATTACKATTRIB_PLASMA_SWORD_','');
  // delayMs, damageMoving, damageByPart, counterable, guardMs, guardCrush, object damage.
  const entries={STAND_WEAK:[300,true,true,true,0,false,10],STAND_STRONG:[400,false,false,true,300,false,20],
    ATTACK2_WEAK:[1000,false,false,true,1000,false,20],ATTACK2:[1000,false,false,true,1000,false,20],
    CRITICAL:[0,true,false,true,0,false,null],JUMP:[1000,false,false,false,1000,true,50],JUMP_CRITICAL:[0,true,false,false,0,false,null]};
  const data=entries[key];if(!data)throw new RangeError('Unknown Plasma attack attribute '+name);
  const [delay,moving,byPart,counterable,guardMs,guardCrush,objectDamage]=data,jump=key.startsWith('JUMP'),dash=key.startsWith('ATTACK2');
  const sequence=jump?null:key==='CRITICAL'?'effects/blank_1sec.seq':dash?'effects/skill_gunner_chargeshot_hit.seq':'effects/backattack_sword_s.seq';
  return {counterable,reaction:{sourceDirection:['DIR_FRONT','PART_MIDDLE'],sourcePower:['POWER_STRONG',objectDamage===null?'DESTROY_BLASTOBJECT_IMPOSSIBLE':'DESTROY_BLASTOBJECT_DAMAGE_'+objectDamage],
    sourceDamageData:[delay,moving?'DAMAGEMOVING_ENABLE':'DAMAGEMOVING_DISABLE',byPart?'DAMAGEBYPART_ENABLE':'DAMAGEBYPART_DISABLE'],sourceGuardData:[guardMs,guardCrush?'GUARDCRUSH_ENABLE':'GUARDCRUSH_DISABLE']},
    effects:{damageSequence:sequence,damageObjectSequence:sequence,damageSound:jump?null:'lightHit',nativeDamageSound:jump?null:'sound/sword_attack.ogg',nativeObjectSound:jump?null:'sound/sword_attack.ogg',
      attackSequence:jump||dash?null:'effects/blank_1sec.seq',nativeAttackSound:jump||dash?null:'sound/sword_s.ogg'},attributeSource:'script/attackattribindexer.lua'};
}
