import {PRACTICE_SOURCE_DATA} from './practice-source-data.js';

// Source registrations only. This does not replace native timers/randomness,
// map transforms, sentry AI, collision or the server mission notification.
export function practiceMissionOption(scoreOption=254){
 const choice=PRACTICE_SOURCE_DATA.choices.find(row=>Number(row.score)===scoreOption);
 if(!choice)throw Error('Unknown native Practice option');
 const target=PRACTICE_SOURCE_DATA.targetsByScore[String(scoreOption)];
 return {scoreOption,unlimited:scoreOption===PRACTICE_SOURCE_DATA.unlimitedOption,
  matchSeconds:Number(choice.time)*60,target:{...target,calls:{...target.calls}}};
}

export function practiceMissionPlan({mapId,scoreOption=254}={}){
 const source=PRACTICE_SOURCE_DATA,map=source.maps.find(row=>row.mapId===mapId);
 if(!map)throw Error('Practice requires native map51–55');
 const option=practiceMissionOption(scoreOption),r=source.registration;
 return {mode:4,mapId,missionScript:map.missionScript,mapInfo:map.resource.bginfo_path,
  option,spawnLimit:r.spawnLimit,scorePerDestroy:r.scorePerDestroy,
  triggerRegistrations:r.spawnNames.flatMap((sceneNode,index)=>Array.from({length:r.variantsPerName},(_,variant)=>({
   notificationId:r.randomNotifyFrom+index*r.variantsPerName+variant,
   sceneNode,variant,attributeId:option.target.attributeId,randomPositionRaw:r.randomPositionRaw,
   destroyNotification:source.events.destroy,createdNotification:source.events.created,helperId:1}))),
  alarms:[{input:0,output:source.events.start,delayMs:r.startAlarmMs,repeat:false},
   {input:0,output:source.events.stageStartMessageEnd,delayMs:r.introAlarmMs,repeat:false},
   {input:source.events.stageStartMessageEnd,output:source.events.spawn,delayMs:r.spawnAlarmMs,
    repeat:true,stopEvent:source.events.spawnEnd},
   {input:source.events.destroy,output:source.events.destroyTextEnd,delayMs:r.destroyTextAlarmMs,repeat:false}],
  nativeReady:false,limitations:['Native stage dispatcher order and effective mission scoring remain unverified.',
   'Sentry collision/AI/FX/audio and map rendering are required before playable integration.']};
}

export function resolvePracticeSpawnNotification(plan,notificationId){
 if(!plan||plan.mode!==4||!Number.isInteger(notificationId))throw Error('Invalid Practice mission plan/notification');
 const registration=plan.triggerRegistrations.find(row=>row.notificationId===notificationId);
 //1225 is the RAW random API bound but has no registered SpawnHelper in Lua.
 // Native B42DE0 proves INCLUSIVE upper bound. Preserve this no-spawn outcome.
 return registration?{...registration}:null;
}
