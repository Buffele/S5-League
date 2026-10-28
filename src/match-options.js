// Authenticated _eu_gameinfo.x7 score_time choices for existing game modes.
// SHA256 4391d1195542df853939424c842dbf5da9b254a4a0d44d63c1b18f07dcf02adf.
// Captain's time field uses ROUND_* keys, not minutes. Chaser's score=1 is
// not a victory threshold. Keep each existing state's own round orchestration.
const profiles={
 touchdown:{selected:2,pairs:[[4,10],[6,15],[8,20],[10,30]]},
 deathmatch:{selected:2,pairs:[[40,10],[60,15],[80,20],[100,30]]},
 chaser:{selected:2,pairs:[[1,10],[1,15],[1,20],[1,30]]},
 battleroyal:{selected:1,pairs:[[30,5],[50,10],[70,15]]},
 siege:{selected:0,pairs:[[200,10],[250,15],[300,20]]},
 captain:{selected:2,pairs:[[2,3],[3,5],[5,9]]},
};
export const MATCH_OPTIONS=Object.freeze(Object.fromEntries(Object.entries(profiles).map(([mode,{pairs}])=>[
 mode,Object.freeze(pairs.map(([score,value])=>{
  const halves=mode==='touchdown'||mode==='deathmatch',rounds=mode==='captain';
  const rules=rounds?{scoreLimit:score,roundLimit:value}:halves?{scoreLimit:score,halfSeconds:value*30}:mode==='chaser'?{matchSeconds:value*60}:{scoreLimit:score,matchSeconds:value*60};
  const label=rounds?`${score} wins · ${value} rounds`:mode==='chaser'?`${value} min`:`${score} ${mode==='touchdown'?'touchdowns':'points'} · ${value} min`;
  return Object.freeze({id:`${score}:${value}`,sourceScore:score,sourceTime:value,...(rounds?{roundLimit:value}:{timeLimitMinutes:value}),label,rules:Object.freeze(rules)});
 })),
])));

export function resolveMatchOption(mode,id=null){
 if(!Object.hasOwn(MATCH_OPTIONS,mode))return null;const choices=MATCH_OPTIONS[mode];
 const selected=id===null||id===undefined||id===''?choices[profiles[mode].selected]:choices.find(option=>option.id===id);
 if(!selected)throw Error('Authentic paired match option required');
 return selected;
}

export function createMatchOptionControl({document,onChange}={}){
 if(typeof document?.createElement!=='function'||typeof onChange!=='function')throw Error('Actual document and session callback required');
 const root=document.createElement('label'),caption=document.createElement('span'),select=document.createElement('select');
 select.id='match-option';root.append(caption);root.append(select);root.hidden=true;select.disabled=true;
 let mode=null,committed=null;
 select.onchange=()=>{
  if(select.disabled||root.hidden){select.value=committed??'';return;}
  const selected=resolveMatchOption(mode,select.value);onChange(selected.id);
 };
 return {root,select,sync({mode:nextMode,value=null,busy=false,ready=false,capturing=false}={}){
  const selected=resolveMatchOption(nextMode,value);
  if(mode!==nextMode){
   mode=nextMode;const label=mode==='captain'?'Wins and rounds':mode==='chaser'?'Match duration':'Score and duration';caption.textContent=label;select.setAttribute('aria-label',label);
   select.replaceChildren();for(const choice of Object.hasOwn(MATCH_OPTIONS,mode)?MATCH_OPTIONS[mode]:[]){const node=document.createElement('option');node.value=choice.id;node.textContent=choice.label;select.append(node);}
  }
  committed=selected?.id??null;select.value=committed??'';root.hidden=!selected;select.disabled=busy||!ready||capturing||root.hidden;
 },dispose(){select.onchange=null;root.remove();}};
}
