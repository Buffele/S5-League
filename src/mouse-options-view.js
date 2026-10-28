import {installAudioHScroll as installNativeScroll} from './options-hscroll-view.js';
const PREFIX='Option_Window/Option_GroupBox/KeySetting_GroupBox/Mouse_GroupBox/';
// Uses the native Options factory/skins and actual transaction port; no separate panel or model.
export function installMouseOptionsView(host,{data,make,place,decorate,image,mouseOptions,transaction,canAct=()=>true,visualTheme='s5',document:doc=host.ownerDocument}={}){
 if(!mouseOptions?.get||!mouseOptions?.setSensitivity)throw TypeError('Real mouse option port required');
 for(const source of Object.values(data.nodes))if(source.path.startsWith(PREFIX)&&source.type==='CGUI_Image')image(source.path,host);
 for(const path of ['Title1_Label','Titel2_Label'])make(PREFIX+path,'label',host).textContent=data.nodes[PREFIX+path].englishText[0];
 const value=make(PREFIX+'1_Label','output',host),source=data.nodes[PREFIX+'1_HScrollBar'],slider=doc.createElement('input');slider.type='range';slider.min='0';slider.max='100';slider.step='1';slider.setAttribute('aria-label','Mouse sensitivity');host.append(slider);
 const bar=installNativeScroll(host,{control:slider,source,visualTheme,getValue:()=>mouseOptions.get().sensitivity,setValue:raw=>mouseOptions.setSensitivity(raw),formatValueText:raw=>String(raw),document:doc});place(bar.root,source);bar.root.style.position='absolute';bar.root.style.backgroundImage='none';
 const inverse=make(PREFIX+'2_CheckButton','input',host);inverse.type='checkbox';inverse.className+=' s5runtime-options-mute';inverse.setAttribute('aria-label','Invert vertical aim');const skin=decorate(inverse,PREFIX+'2_CheckButton',()=>inverse.checked);
 const change=()=>{if(!inverse.disabled)mouseOptions.setInverse(inverse.checked);sync();};inverse.addEventListener('change',change);
 function sync(){const row=mouseOptions.get(),enabled=transaction.snapshot().phase==='open'&&canAct()&&row.available;slider.disabled=inverse.disabled=!enabled;inverse.checked=row.inverse;value.textContent=String(row.sensitivity);host.dataset.mouseCurrent=String(row.currentSensitivity);host.dataset.mouseInverseCurrent=String(row.currentInverse);slider.title=String(row.sensitivity);skin();bar.sync();}
 const off=mouseOptions.subscribe(sync),offT=transaction.subscribe(sync);sync();return {root:host,slider,inverse,bar,sync,cancel:()=>bar.cancel(),dispose(){bar.dispose();off();offT();inverse.removeEventListener('change',change);}};
}
