import * as THREE from 'three';
import {STATION2_GOAL_BOXES,STATION2_SPAWNS} from './station2-goal-data.js';

const TD_SOURCE='model/background/station2_td.scn';
const LASER_SOURCE='model/background/station2_td_laser.scn';
const SCALE=.006;
const identity=new THREE.Matrix4();
const canonical=new THREE.Matrix4().makeScale(SCALE,SCALE,-SCALE);
function matrixEquals(a,b){return a.elements.every((value,index)=>Number.isFinite(value)&&Math.abs(value-b.elements[index])<1e-12);}
function nodePoint(node){
 if(!node||!Array.isArray(node.matrix)||node.matrix.length!==16||node.matrix.some(v=>!Number.isFinite(v)))throw Error('Finite Classic Touchdown source node required');
 return [node.matrix[12]*SCALE,node.matrix[13]*SCALE,-node.matrix[14]*SCALE];
}

// Source positions become S5 WORLD coordinates once, independently of the
// editable modular pivots. Logical contact/ring frames retain identity; source
// rendered meshes and their geometry are never reparented or rewritten here.
export function createStation2ClassicTouchdownProfile({data,assets,group,scene,fumbi}){
 if(!data||!Array.isArray(data.scenes)||!Array.isArray(assets)||assets.length!==data.scenes.length||!group?.isGroup||!scene?.isScene||!fumbi?.isObject3D)throw Error('Complete Station2 Classic assets required');
 const tdIndex=data.scenes.findIndex(s=>s.source===TD_SOURCE),laserIndex=data.scenes.findIndex(s=>s.source===LASER_SOURCE);
 if(tdIndex<0||laserIndex<0||!data.scenes.some(s=>s.source==='model/background/station2.scn')||!Array.isArray(data.scenes[tdIndex].nodes)||!Array.isArray(data.scenes[laserIndex].models))throw Error('Only the canonical Station2 Classic source is supported');
 scene.updateWorldMatrix(true,false);group.updateWorldMatrix(true,true);
 if(!matrixEquals(scene.matrixWorld,identity)||!matrixEquals(group.matrixWorld,canonical)||group.getObjectById(fumbi.id)!==fumbi)throw Error('Unmoved Station2 Classic world coordinates and source Fumbi required');
 const nodes=data.scenes[tdIndex].nodes,bases={},goalBoxes={},goalCenters={},spawns={},lasers={},owned=[];
 const unique=name=>{const matches=nodes.filter(n=>n.name===name);if(matches.length!==1)throw Error('Unique Classic Touchdown node missing: '+name);return matches[0];};
 let disposed=false;
 const dispose=()=>{if(disposed)return;disposed=true;for(const mesh of owned){mesh.geometry.dispose();mesh.material.dispose();mesh.removeFromParent();}for(const module of [...Object.values(bases),...Object.values(lasers)])module.group.removeFromParent();};
 try{
  for(const side of ['alpha','beta']){
   const frame=new THREE.Group();frame.name='Station2 Classic '+side+' logical goal';
   bases[side]={group:frame,definition:{enabled:true},coordinateSpace:'s5-world'};
   const center=nodePoint(unique(STATION2_GOAL_BOXES[side].marker)),half=[...STATION2_GOAL_BOXES[side].halfExtents];
   goalCenters[side]=center;goalBoxes[side]=[new THREE.Box3(new THREE.Vector3(...center).sub(new THREE.Vector3(...half)),new THREE.Vector3(...center).add(new THREE.Vector3(...half)))];
   const spawnName=STATION2_SPAWNS[side].markers[0];spawns[side]={marker:spawnName,position:nodePoint(unique(spawnName))};
   const laserFrame=new THREE.Group();laserFrame.name='Station2 Classic '+side+' logical lasers';
   lasers[side]={group:laserFrame,meshes:[],definition:{enabled:true},coordinateSpace:'s5-world'};
  }
  const source=data.scenes[laserIndex],asset=assets[laserIndex];
  for(const [index,model]of source.models.entries()){
   if(!/alphablend2.*nofog/i.test(model.name))continue;
   const side=/alphateam/i.test(model.name)?'alpha':/betateam/i.test(model.name)?'beta':null;
   if(!side)throw Error('Classic laser team source missing');
   if(Object.values(model.animations??{}).some(a=>['positions','rotations','scales'].some(key=>a?.[key]?.length)))throw Error('Moving Classic laser geometry is not covered by the static logical profile');
   const matches=asset?.meshes?.filter(mesh=>mesh.userData?.sourceModelIndex===index);
   if(matches?.length!==1||!matches[0].geometry?.isBufferGeometry)throw Error('Classic laser source mesh missing or ambiguous');
   const original=matches[0];original.updateWorldMatrix(true,false);
   const geometry=original.geometry.clone();
   let proxy;
   try{geometry.applyMatrix4(original.matrixWorld);proxy=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial());}catch(error){geometry.dispose();throw error;}
   proxy.name=model.name;proxy.visible=false;proxy.userData.sourceModelIndex=index;proxy.userData.sourceScene=LASER_SOURCE;proxy.userData.logicalOnly=true;
   owned.push(proxy);lasers[side].group.add(proxy);lasers[side].meshes.push(proxy);
  }
  if(lasers.alpha.meshes.length!==4||lasers.beta.meshes.length!==4)throw Error('The eight original Classic laser layers are required');
  // Attach only identity frames. They host rings; hidden laser proxies are
  // logical surfaces and never join the source visual group.
  for(const module of Object.values(bases))scene.add(module.group);
 }catch(error){dispose();throw error;}
 return {kind:'station2-classic-source-v1',coordinateSpace:'s5-world',nativeMapId:66,source:TD_SOURCE,bases,goalBoxes,goalCenters,spawns,lasers,fumbi,get disposed(){return disposed;},dispose};
}
