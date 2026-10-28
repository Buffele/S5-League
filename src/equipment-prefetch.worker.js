import {loadValidatedAssetJson} from './persistent-asset-json.js';
import {warmEquipmentSources} from './equipment-source-plan.js';
let paused=true,started=false;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function beforeFile(){while(paused)await sleep(100);await sleep(20);}
self.onmessage=event=>{
 if(event.data.type==='pause'){paused=event.data.paused;return;}
 if(event.data.type!=='start'||started)return;
 started=true;const {plan,scope}=event.data,seen=new Set();
 void(async()=>{
  const report={total:plan.length,completed:0,ready:0,failures:[],sourceOnly:true};
  for(const item of plan){
   await beforeFile();
   try{
    await warmEquipmentSources(item,scope,{readJson:loadValidatedAssetJson,warmTexture:async url=>{const response=await fetch(url);if(!response.ok)throw Error('Texture unavailable: '+url);await response.arrayBuffer();},seen,beforeFile});
    report.ready++;
   }catch(error){report.failures.push({label:item.label,error:String(error.message)});}
   report.completed++;self.postMessage({...report,files:seen.size});
  }
  self.close();
 })().catch(error=>{self.postMessage({error:String(error.message)});self.close();});
};
