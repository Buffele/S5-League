import {nativeRadarProjectPoint} from './native-radar-projection.js';
import {nativeRadarMarkerQuad} from './native-radar-marker-layers.js';

// 8EE0C0 -> DD46A0/DCFAB0, full record+10/+14 -> root7EDA30,
// record+24 -> 8EF740/8EF7F0 -> index0, 12x12, white -> 8EF490.
// getEntityByIdentity must resolve the actual complete uint64 identity and
// return an entity object or explicit null. An unresolved nonzero identity is
// NOT equivalent to carried: the source still draws its current record point.
export function nativeRadarFumbiMarker({ruleCode,record,getEntityByIdentity,projection}){
 if(!Number.isInteger(ruleCode)||ruleCode<0||ruleCode>255)throw TypeError('Explicit native rule byte required');
 if(![2,6,17].includes(ruleCode)||record===null)return null;
 if(!record||typeof record.carrierIdentity64!=='bigint'||record.carrierIdentity64<0n||record.carrierIdentity64>0xffffffffffffffffn)throw TypeError('Explicit complete native Fumbi record identity required');
 if(typeof getEntityByIdentity!=='function')throw TypeError('Qualified native identity lookup required');
 const entity=getEntityByIdentity(record.carrierIdentity64);
 if(entity!==null){if(!entity||typeof entity!=='object')throw TypeError('Lookup must return an entity object or explicit null');return null;}
 const point=nativeRadarProjectPoint({...projection,point:record.position});
 if(point.rangeExcluded)return null;
 return {texture:'star',...nativeRadarMarkerQuad({center:point.screen,width:12,height:12,color:[1,1,1,1]})};
}
