// Exact-input cache of Microsoft D3DX9_29 Decompose -> Transformation.
// Does not apply to a changed source matrix or to an animated local pose.
const d3dxSha='c5e21c18f8c79bc517da59e3192c39ea73bdcaf85867628187f6b3cca07dd21f';
function vector(value,length){
 if(!Array.isArray(value)||value.length!==length||!value.every(Number.isFinite))throw new TypeError('Finite native pose record required');
 return value.map(Math.fround);
}
export function nativeRecordedShapePose(binding,record){
 if(record?.dllSha256!==d3dxSha||record.hresult!==0||record.name!==binding?.name)throw new Error('Unverified native Shape pose record');
 const input=vector(record.input,16),authored=vector(binding.authoredMatrix,16);
 if(input.some((v,i)=>v!==authored[i]))throw new Error('Native pose record does not match the authored Shape matrix');
 return Object.freeze({position:Object.freeze(vector(record.translation,3)),rotation:Object.freeze(vector(record.rotation,4)),scale:Object.freeze(vector(record.scale,3)),localMatrix:Object.freeze(vector(record.recomposed,16))});
}
