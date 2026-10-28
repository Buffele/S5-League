// Missing services stay unknown. These are adaptation boundaries, not native
// perception, impact, gate or pose-clock implementations.
export function createPracticeSentryPorts({target,provided={},onMissing=()=>{}}){
 if(!provided||typeof provided!=='object')throw Error('Sentry ports must be an explicit object');
 const missing=new Set(),status={},request=name=>{if(!missing.has(name)){missing.add(name);onMissing({port:name,status:'unproven',actorId:target.id,actorGeneration:target.generation,nativeReady:false});}};
 if(provided.afterPose!==undefined&&typeof provided.afterPose!=='function'||provided.dispose!==undefined&&typeof provided.dispose!=='function'||provided.receiveDamageRecord!==undefined&&typeof provided.receiveDamageRecord!=='function')throw Error('Invalid Sentry consumer lifecycle');
 if(provided.sourceConsumerStatus)status.sourceConsumer=provided.sourceConsumerStatus;
 if(provided.poseCompositionStatus)status.poseComposition=provided.poseCompositionStatus;
 const bindings={};
 for(const name of ['searchTarget','hasTarget','clearTarget','updateHead','beginAttack','tickAttack','endAttack']){
  const supplied=provided.bindings?.[name];if(supplied!==undefined&&typeof supplied!=='function')throw Error('Invalid Sentry port '+name);
  status[name]=supplied?'supplied-unverified':'unbound';bindings[name]=(...args)=>{if(supplied){const result=supplied(...args);if(name==='hasTarget'&&result!==null&&typeof result!=='boolean')throw Error('hasTarget must return boolean or unknown null');return result;}request(name);return null;};
 }
 if(provided.readActorGate6c!==undefined&&typeof provided.readActorGate6c!=='function')throw Error('Invalid Sentry gate port');
 if(provided.readAudioStatus!==undefined&&typeof provided.readAudioStatus!=='function')throw Error('Invalid Sentry audio port');
 const readActorGate6c=()=>{if(!provided.readActorGate6c){request('actorGate6c');return false;}const value=provided.readActorGate6c();if(typeof value!=='boolean')throw Error('Actor gate6C must be boolean');return value;};
 const readAudioStatus=()=>{if(!provided.readAudioStatus){request('audioStatus');return {normalSoundPlaying:null,attackSoundPlaying:null};}const value=provided.readAudioStatus();if(!value||![value.normalSoundPlaying,value.attackSoundPlaying].every(v=>v===null||typeof v==='boolean'))throw Error('Audio ports must return boolean or unknown null');return value;};
 status.actorGate6c=provided.readActorGate6c?'supplied-unverified':'unproven-local-diagnostic-false';status.audioStatus=provided.readAudioStatus?'supplied-unverified':'unknown';
 status.receiveDamageRecord=provided.receiveDamageRecord?'supplied-unverified':'unbound';
 const poseClockPolicy=provided.poseClockPolicy??{name:'unproven diagnostic raw-source seconds; literal loop length; native channel/blend join pending',sourceSeconds:({animation,elapsedMs})=>{const seconds=elapsedMs/1000,clip=target.model.clips.find(c=>c.name===animation.clip);return animation.loop&&clip?.duration>0?seconds%clip.duration:seconds;}};
 status.poseClock=provided.poseClockPolicy?'supplied-unverified':'unproven-local-source-seconds';
 let disposed=false;
 return {bindings,readActorGate6c,readAudioStatus,poseClockPolicy,afterPose:provided.afterPose,receiveDamageRecord(record){if(disposed)return null;if(!provided.receiveDamageRecord){request('receiveDamageRecord');return null;}return provided.receiveDamageRecord(record);},dispose(){if(disposed)return;disposed=true;provided.dispose?.();},status:Object.freeze(status),get missingPorts(){return [...missing];},nativeReady:false};
}
