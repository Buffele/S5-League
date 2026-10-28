import {createWaitingRoomResults} from './waiting-room-results.js';
const integer=n=>Number.isSafeInteger(n)&&n>=0;
const finite=n=>Number.isFinite(n)&&n>=0;
const receipts=new WeakSet();
const totalRounds=8;
const duration=ms=>{const s=Math.floor(ms/1000),minutes=Math.floor(s/60);return `${minutes}:${String(s%60).padStart(2,'0')}`;};
const number=n=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(n);

// Local presentation of observed S5 state only. Neither the stage-completion
// counter nor an empty actor collection is itself a native server victory.
export function conquestLocalResult(snapshot){
 if(!snapshot||snapshot.fault||!integer(snapshot.round)||snapshot.round<1||snapshot.round>totalRounds||!integer(snapshot.completedRounds)||snapshot.completedRounds>totalRounds||!finite(snapshot.baseHp)||!finite(snapshot.baseMaxHp)||snapshot.baseMaxHp<=0||snapshot.baseHp>snapshot.baseMaxHp||!integer(snapshot.session?.elapsedMs))return null;
 let outcome=null;
 if(snapshot.status==='base-destroyed'&&snapshot.baseHp===0)outcome='DEFEAT';
 else if(snapshot.status==='round-cleared'&&snapshot.round===totalRounds&&snapshot.completedRounds===totalRounds&&snapshot.baseHp>0){
  const f=snapshot.finalization;
  if(!integer(snapshot.total)||snapshot.total<1||snapshot.alive!==0||snapshot.session.actorCount!==0||snapshot.session.retiredActorCount!==0||!f||f.qualified===false||f.completed!==snapshot.total||f.observed!==f.completed||f.entered!==f.completed||f.pending!==0||f.failed!==0||f.unobservedRetired!==0)return null;
  outcome='VICTORY';
 }
 if(outcome===null)return null;
 const metrics=Object.freeze({completedRounds:snapshot.completedRounds,totalRounds,baseHp:snapshot.baseHp,baseMaxHp:snapshot.baseMaxHp,elapsedMs:snapshot.session.elapsedMs});
 const result=Object.freeze({mode:'conquest',outcome,score:`${metrics.completedRounds} / ${totalRounds} vagues terminées`,players:Object.freeze([]),metrics,scope:'s5-local-conquest',serverAccepted:false,nativeVictoryQualified:false,nativeReady:false});receipts.add(result);return result;
}
export function assertConquestLocalResult(result){if(!receipts.has(result))throw Error('Observed local Conquest result required');return result;}

// Retain the actual encounter and read its snapshot once per presentation
// frame. Once terminal, keep the same immutable result without touching HP,
// kills, scores, wave counters, clocks or actors during the result interval.
export function createConquestLocalResults({encounter}={}){
 if(!encounter||typeof encounter.snapshot!=='function')throw Error('Actual Conquest encounter snapshot producer required');
 const read=encounter.snapshot;let result=null,lastSnapshot=null,disposed=false;
 return Object.freeze({
  observe(){if(disposed||encounter.snapshot!==read)throw Error('Current owned Conquest result observer required');if(!result){lastSnapshot=read.call(encounter);result=conquestLocalResult(lastSnapshot);}return lastSnapshot;},
  get result(){return result;},get finished(){return result!==null;},
  dispose(){disposed=true;lastSnapshot=null;result=null;},
 });
}

// Reuse the existing modal/focus isolation/artwork/countdown surface. Conquest
// has no admitted participant score ledger, so show measured match metrics
// instead of manufacturing a Top Scorers ranking or EXP/PEN rewards.
export function createConquestLocalResultsView({document:doc=globalThis.document,artwork=null}={}){
 const before=new Set(Array.from(doc.body.children)),view=createWaitingRoomResults({document:doc,artwork});
 const root=Array.from(doc.body.children).find(node=>!before.has(node)&&node.id==='room-results');if(!root){view.dispose();throw Error('Actual owned Conquest results modal required');}
 let last=null;
 return {resultKind:'conquest',
  update(result,remaining){assertConquestLocalResult(result);view.update(result,remaining);if(last===result)return;last=result;
   root.setAttribute('aria-label','Résultats Conquest');root.querySelector('[data-mode]').textContent='CONQUEST · PARTIE LOCALE';root.querySelector('[data-outcome]').textContent=result.outcome==='VICTORY'?'DÉFENSE RÉUSSIE':'BASE DÉTRUITE';
   const scope=root.querySelector('.room-results-scope');scope.hidden=false;scope.textContent='Bilan de la partie locale';
   root.querySelector('[data-team-alpha]').textContent='BILAN';root.querySelector('.room-results-columns').style.display='none';root.querySelector('.room-results-rewards').style.display='none';
   const rows=root.querySelector('[data-top-scorers]');rows.setAttribute('aria-label','Bilan de la partie');rows.replaceChildren();
   const m=result.metrics,values=[['Vagues terminées',`${m.completedRounds} / ${m.totalRounds}`],['Vie de la base',`${number(m.baseHp)} / ${number(m.baseMaxHp)}`],['Temps écoulé',duration(m.elapsedMs)]];
   for(const [index,[label,value]] of values.entries()){const row=doc.createElement('li');row.dataset.top='false';row.dataset.local='false';row.style.gridColumn='1';row.style.gridRow=String(index+1);row.style.gridTemplateColumns='minmax(0, 1fr) auto';const name=doc.createElement('b'),metric=doc.createElement('strong');name.textContent=label;metric.textContent=value;row.append(name,metric);rows.append(row);}
  },hide:()=>view.hide(),get opened(){return view.opened;},render:renderer=>view.render(renderer),dispose:()=>view.dispose(),
 };
}
