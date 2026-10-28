// Retained archive images are fallback only; actual S5 interiors take precedence.
import {mapInteriorPreview} from './map-interior-previews.js';
const previews={
  "19": {
    "image": "/assets/ui/map-previews/map-2ecdc39e8a35.png",
    "width": 720,
    "height": 360
  },
  "52": {
    "image": "/assets/ui/map-previews/map-d0268bf49175.png",
    "width": 720,
    "height": 360
  },
  "54": {
    "image": "/assets/ui/map-previews/map-9ac20bb4ed84.png",
    "width": 720,
    "height": 360
  },
  "55": {
    "image": "/assets/ui/map-previews/map-349737dfb612.png",
    "width": 720,
    "height": 360
  },
  "66": {
    "image": "/assets/ui/map-previews/map-d0268bf49175.png",
    "width": 720,
    "height": 360
  },
  "93": {
    "image": "/assets/ui/map-previews/map-4f1b6f2313ac.png",
    "width": 720,
    "height": 360
  },
  "158": {
    "image": "/assets/ui/map-previews/map-d0c88236d6d5.png",
    "width": 720,
    "height": 360
  },
  "225": {
    "image": "/assets/ui/map-previews/map-2f535e5660dd.png",
    "width": 720,
    "height": 360
  }
};
for(const value of Object.values(previews))Object.freeze(value);
Object.freeze(previews);
export function waitingRoomMapPreview(nativeMapId,sceneKey=null){
 if(sceneKey!==null)return mapInteriorPreview(nativeMapId,sceneKey);
 return mapInteriorPreview(nativeMapId)??(Number.isSafeInteger(nativeMapId)?previews[nativeMapId]??null:null);
}
