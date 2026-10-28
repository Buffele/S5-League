// Source PE pinned in ../proof.json. DOM events/asset readiness remain explicit S5 projections.
export function advanceButtonInteraction(state,event,{enabled=true,button=0}={}){
 if(![0,1,2].includes(state))throw RangeError('Unknown native button interaction');
 if(!enabled)return state;
 if(event==='reset')return 0; // Native reinitialize; pointercancel mapping is an S5 cancellation projection.
 if(event==='enter')return 2;
 if(event==='leave')return state===1?1:0; // Native leave refuses to clear a pressed button.
 if(button!==0)return state;
 if(event==='down')return 1;
 if(event==='up')return 2;
 return state;
}
export function selectWidgetSkin({type,interaction=0,selected=false,disabled=false,disabledSkinAvailable=false,visible=true}){
 if(!visible)return null;
 if(![0,1,2].includes(interaction))throw RangeError('Unknown native button interaction');
 if(type==='CGUI_Button')return disabled&&disabledSkinAvailable?3:interaction;
 if(type==='CGUI_TabButton'||type==='CGUI_CheckButton'){
  if(disabled&&disabledSkinAvailable)return 6;
  return selected?({0:2,1:3,2:5})[interaction]:({0:0,1:1,2:4})[interaction];
 }
 throw TypeError('Unsupported source widget type');
}
