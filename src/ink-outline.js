import * as THREE from 'three';
import {SeparatedOutlinePass} from './separated-outline-pass.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {createSettingsCards} from './settings-cards.js';
import {createChaserViewPass} from './chaser-presentation.js';
import {RENDER_QUALITY,normalizeRenderQuality} from './render-quality.js';
import {attachPresentationDepth,applyComposerBudget} from './composer-budget.js';

const KEY='s5.graphics.outlines';
export function normalizeOutlineSettings(value={}){
 return {mode:['off','character','objects'].includes(value.mode)?value.mode:'objects',width:THREE.MathUtils.clamp(Number.isFinite(Number(value.width))?Number(value.width):1,.5,2.5)};
}
export function readOutlineSettings(){
 try{return normalizeOutlineSettings(JSON.parse(localStorage.getItem(KEY)||'{}'));}catch{return normalizeOutlineSettings();}
}

export function createInkOutline(scene,camera,world){
 const pass=new SeparatedOutlinePass(new THREE.Vector2(1,1),scene,camera,[]);
 pass.inkOnly=true;pass.maxResolution=1920;
 pass.visibleEdgeColor.set(0xffffff);pass.hiddenEdgeColor.set(0x000000);
 pass.edgeGlow=0;pass.pulsePeriod=0;pass.edgeStrength=3;pass.downSampleRatio=1;
 // OutlinePass normally adds a luminous colour. Use its visibility mask with
 // normal alpha blending to draw opaque ink, never glowing/x-ray silhouettes.
 pass.overlayMaterial.blending=THREE.NormalBlending;
 pass.overlayMaterial.fragmentShader=`varying vec2 vUv;
 uniform sampler2D edgeTexture1;uniform float edgeStrength;
 void main(){float edge=texture2D(edgeTexture1,vUv).r;
 float alpha=clamp(edge*edgeStrength,0.0,.95);gl_FragColor=vec4(.009,.011,.016,alpha);}`;
 pass.overlayMaterial.needsUpdate=true;
 let settings=readOutlineSettings(),avatar=null;const characters=new Set();
 let objects=world.blenderSlice?world.blenderSlice.groups.filter(g=>['train','alpha-bridge','beta-bridge'].includes(g.userData.moduleId)):[world.target].filter(Boolean);
 function update(){
  pass.enabled=settings.mode!=='off';pass.edgeThickness=settings.width;
  pass.selectedObjects=[avatar,...characters,...(settings.mode==='objects'?objects:[])].filter(Boolean);
 }
 update();
 return {pass,get settings(){return {...settings};},
  setAvatar(group){avatar=group;update();},addCharacter(group){characters.add(group);update();},removeCharacter(group){characters.delete(group);update();},
  setWorld(next){objects=next.blenderSlice?next.blenderSlice.groups.filter(g=>['train','alpha-bridge','beta-bridge'].includes(g.userData.moduleId)):[next.target].filter(Boolean);update();},
  configure(value,{persist=false}={}){settings=normalizeOutlineSettings({...settings,...value});update();if(persist)try{localStorage.setItem(KEY,JSON.stringify(settings));}catch{}},
 };
}

export function createOutlinePresentation(renderer,scene,camera,world){
 const composer=new EffectComposer(renderer),outline=createInkOutline(scene,camera,world);
 attachPresentationDepth(composer);
 const chaserView=createChaserViewPass(scene,camera,world);composer.addPass(new RenderPass(scene,camera));composer.addPass(outline.pass);composer.addPass(new OutputPass());composer.addPass(chaserView);
 let width=1,height=1,quality='balanced';
 const resize=(w,h)=>{width=w;height=h;applyComposerBudget(composer,renderer,quality);outline.pass.maxResolution=Math.max(w,h)*RENDER_QUALITY[quality].outlineRatio;composer.setSize(w,h);};
 return {outline,setQuality:value=>{quality=normalizeRenderQuality(value);resize(width,height);},setChaser:(enabled,targets=[],excluded=[])=>{chaserView.enabled=!!enabled;chaserView.targets=targets;chaserView.excluded=excluded;},render:()=>{if(!outline.pass.enabled&&!chaserView.enabled){renderer.setRenderTarget(null);renderer.render(scene,camera);}else composer.render();},resize};
}

export function installOutlineSettings(outline){
 const section=document.createElement('details');section.id='graphics-settings';section.open=true;
 section.innerHTML='<summary><span>Settings</span><small>Graphics, camera and interface</small></summary><div class="graphics-grid"></div>';
 document.querySelector('.setup').after(section);
 const grid=section.querySelector('.graphics-grid');
 const widthLabel=document.createElement('label');widthLabel.className='settings-range settings-range--outline';widthLabel.innerHTML='<span>Outline width</span><output id="outline-width-value"></output><input id="outline-width" aria-label="Outline width" type="range" min="0.5" max="2.5" step="0.25">';
 const width=widthLabel.querySelector('input'),output=widthLabel.querySelector('output');width.value=outline.settings.width;
 let cards;
 const apply=mode=>{outline.configure({mode,width:Number(width.value)},{persist:true});widthLabel.classList.toggle('is-disabled',mode==='off');width.disabled=mode==='off';output.value=Number(width.value).toFixed(2).replace(/\.00$/,'');};
 cards=createSettingsCards({id:'outline-mode',title:'Black outlines',description:'Choose which objects receive an ink outline.',value:outline.settings.mode,onChange:apply,options:[
  {value:'off',label:'No outlines',caption:'Smoother performance'},
  {value:'character',label:'Characters',caption:'Combat clarity'},
  {value:'objects',label:'Entire world',caption:'Anime style'},
 ]});
 grid.append(cards.element,widthLabel);width.oninput=()=>apply(cards.control.value);apply(cards.control.value);
}
