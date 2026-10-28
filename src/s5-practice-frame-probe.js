const activeByRenderer=new WeakMap();
// Optional diagnostic capture; no simulation dt, geometry or quality changes.
// Integration belongs to main. Enable only outside the uninstrumented FPS run.
export function installPracticeFrameProbe({host,document,isActive=()=>true,now=()=>performance.now(),raf=fn=>requestAnimationFrame(fn),cancel=id=>cancelAnimationFrame(id),durationMs=20000,requireFrameHooks=true,externalStepHooks=false}={}){
 if(!host?.renderer||!host?.match||typeof document?.createElement!=='function'||typeof isActive!=='function'||!Number.isFinite(durationMs)||durationMs<=0)throw Error('Actual Practice host/document and positive capture duration required');
 const match=host.match,world=host.world,renderer=host.renderer,restores=[],samples=[];
 if(typeof externalStepHooks!=='boolean'||externalStepHooks&&typeof match.step!=='function')throw Error('Explicit frame-probe step ownership required');
 activeByRenderer.get(renderer)?.stop('replaced');
 const pending=()=>({startedGameFrames:0,completedGameFrames:0,stepCalls:0,stepMs:0,prepareCalls:0,prepareMs:0,drawPasses:[],worldCalls:0,worldMs:0,frameCpuMs:null,phaseMs:{}});
 let current=pending(),first=null,previous=null,request=null,stopped=false,reason=null,frameStarted=null,phaseStarted=null;
 document.getElementById?.('practice-perf-readout')?.remove();
 const readout=document.createElement('output');readout.id='practice-perf-readout';readout.setAttribute('aria-label','Practice CPU diagnostic capture');readout.style.cssText='position:fixed;right:16px;top:46px;z-index:60;max-width:300px;padding:6px 9px;background:#092632ee;color:#eaffff;font:12px system-ui;pointer-events:none';document.body.append(readout);
 const before={mode:host.mode??match.state?.mode??'practice',rendererAutoReset:renderer.info?.autoReset,source:'timed actual methods; CPU submission is not GPU duration'};
 const accelerationBefore=typeof host.readAcceleration==='function'?host.readAcceleration():null;
 let accelerationAfter=null;
 function wrap(object,key,category){
  const original=object?.[key];if(typeof original!=='function')return;
  const own=Object.hasOwn(object,key);
  function wrapped(...args){
   const started=now();
   try{return original.apply(this,args);}finally{
    const elapsed=now()-started;
    if(category==='draw'){
     const info=renderer.info?.render;
     current.drawPasses.push({cpuMs:elapsed,calls:info?.calls??null,triangles:info?.triangles??null,lines:info?.lines??null,points:info?.points??null,autoReset:renderer.info?.autoReset??null,sceneId:args[0]?.uuid??null,cameraId:args[1]?.uuid??null});
    }else{current[category+'Calls']++;current[category+'Ms']+=elapsed;}
   }
  }
  object[key]=wrapped;restores.push(()=>{if(object[key]!==wrapped)return;if(own)object[key]=original;else delete object[key];});
 }
 // Conquest's API is frozen. Time its actual call through an explicit main
 // hook instead of replacing an authenticated gameplay method.
 if(!externalStepHooks)wrap(match,'step','step');
 if(!externalStepHooks)wrap(match,'render','prepare');
 wrap(world,'update','world');wrap(renderer,'render','draw');
 function step(owner,dt){
  if(!externalStepHooks||owner!==match||host.match!==match)throw Error('Current explicitly observed simulation owner required');
  if(stopped)return owner.step(dt);
  const started=now();try{return owner.step(dt);}finally{current.stepCalls++;current.stepMs+=now()-started;}
 }
 function living(){const actors=match.session?.bridge?.actors;if(actors instanceof Map){let count=0;for(const actor of actors.values())if(actor.health>0)count++;return count;}const pool=match.adapter?.pool;if(!Array.isArray(pool))return null;let count=0;for(const actor of pool)if(!actor.dead&&!actor.released)count++;return count;}
 function beginFrame(){if(stopped)return;current.startedGameFrames++;frameStarted=now();phaseStarted=frameStarted;}
 function mark(name){if(stopped||phaseStarted===null)return;const at=now();current.phaseMs[name]=(current.phaseMs[name]??0)+at-phaseStarted;phaseStarted=at;}
 function endFrame(){if(stopped||frameStarted===null)return;current.frameCpuMs=(current.frameCpuMs??0)+now()-frameStarted;current.completedGameFrames++;frameStarted=null;phaseStarted=null;}
 function report(){return {schema:'s5-practice-frame-probe-v2',before,stopped,reason,durationMs:first===null||previous===null?0:previous-first,samples:[...samples],observerIntervals:samples.length,completedGameFrames:samples.reduce((n,s)=>n+s.completedGameFrames,0),requireFrameHooks,gpuMeasured:false,otherFrameCpuMeasured:samples.some(s=>s.frameCpuMs!==null),...(accelerationBefore===null?{}:{acceleration:{before:accelerationBefore,after:accelerationAfter}}),notes:['stepMs is inclusive actual match.step, potentially multiple fixed updates per render','prepareMs is match.render including effects preparation and Practice UI','drawPasses are CPU time inside renderer.render including scene traversal/uploads/submission; not GPU timings','renderer.info counters are read after each pass; cumulative when autoReset=false and therefore must not be summed blindly','beginFrame/endFrame count completed actual game frames and sum their CPU time per observer interval; mark labels successive CPU segments','observer rAF intervals are wall time, not proof of game FPS without completed game-frame counts; logical clocks/dt are not FPS','browser tasks outside the frame callback, compositor and GPU remain unattributed','probe readout/callback overhead is outside the optional outer-frame timer','separate instrumented capture from ordinary FPS baseline']};}
 function stop(nextReason='complete'){
  if(stopped)return report();stopped=true;reason=nextReason;if(request!==null)cancel(request);document.removeEventListener?.('visibilitychange',visibility);if(activeByRenderer.get(renderer)?.stop===stop)activeByRenderer.delete(renderer);for(const restore of restores.reverse())restore();
  accelerationAfter=typeof host.readAcceleration==='function'?host.readAcceleration():null;
  const result=report();readout.dataset.observation=JSON.stringify(result);readout.textContent=`${before.mode} CPU capture ${nextReason}: ${samples.length} observer intervals / ${result.completedGameFrames} game frames`;return result;
 }
 function frame(timestamp){
  request=null;if(stopped)return;
  if(host.match!==match||host.world!==world)return stop('session-changed');
  if(!isActive())return stop('inactive-session');
  if(document.hidden)return stop('document-hidden');
  if(requireFrameHooks&&current.startedGameFrames!==current.completedGameFrames)return stop('incomplete-game-frame');
  if(requireFrameHooks&&current.completedGameFrames===0)return stop('missing-game-frame');
  if(first===null){first=timestamp;previous=timestamp;current=pending();}
  else{samples.push({at:timestamp,intervalMs:timestamp-previous,living:living(),...current});previous=timestamp;current=pending();}
  if(timestamp-first>=durationMs)return stop('complete');
  if(samples.length>=10000)return stop('sample-limit');
  readout.textContent=`${before.mode} CPU capture · ${Math.floor((timestamp-first)/1000)} s · ${samples.length} observer intervals`;
  request=raf(frame);
 }
 function visibility(){if(document.hidden)stop('document-hidden');}
 document.addEventListener?.('visibilitychange',visibility);
 const capture={beginFrame,mark,endFrame,stop,report,readout,step,get stepOwner(){return !stopped&&externalStepHooks?match:null;}};activeByRenderer.set(renderer,capture);request=raf(frame);return capture;
}
