const uint=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
const rows=input=>{if(!Array.isArray(input)||input.length!==5||input.some(c=>!c||!['frames','durationMs','elapsedMs'].every(k=>uint(c[k]))||typeof c.paused!=='boolean'))throw Error('Five explicit source King counters248/258/268/278/288 required');return input.map(c=>({frames:c.frames,durationMs:c.durationMs,elapsedMs:c.elapsedMs,paused:c.paused}));};
const value=(n,label)=>{if(!uint(n))throw Error('Explicit uint32 King '+label+' required');return n;};
const index=input=>input>=5&&input<=7?7-input:-1;
export const CONQUEST_KING_CLOCK_SOURCE=Object.freeze({tick:0xa06a90,readAccum:0xa092f0,resetAccum:0xa09410,isRateOfFire:0xa050c0,resetRate:0xa05120,readLastAttack:0xa09380,writeLastAttack:0xa09470,constructorLastAttack32C:11,accumCounterIndex:1,accumAlsoRateInput:6,sourceKernelQualified:true,nativeCounterInitializationQualified:false,nativeReady:false});
// Pure native arithmetic, with explicit operands only. No counter allocation,
// paused initialization, omitted Lua argument or independent accum timer is invented.
export function conquestKingAdvanceCounters(counters,deltaMs){const c=rows(counters);value(deltaMs,'delta');for(let i=0;i<5;i++){const row=c[i];if(row.paused||i>=2&&row.durationMs<row.elapsedMs)continue;row.frames=(row.frames+1)>>>0;row.elapsedMs=(row.elapsedMs+deltaMs)>>>0;}return c;}
export function conquestKingAccumTime(counters){return rows(counters)[1].elapsedMs;}
export function conquestKingIsRateOfFire(counters,input){const c=rows(counters);value(input,'input');const i=index(input);return i<0?false:c[i].durationMs>=c[i].elapsedMs;}
export function conquestKingResetRate(counters,input,duration){const c=rows(counters);value(input,'input');value(duration,'duration');const i=index(input);if(i>=0){c[i].frames=0;c[i].elapsedMs=0;if(duration!==0)c[i].durationMs=duration;}return c;}
export function conquestKingResetAccum(counters,duration){const c=rows(counters);value(duration,'explicit accumulator duration');c[1].frames=0;c[1].durationMs=duration;c[1].elapsedMs=0;return c;}
// A01B30 initialization loop: inverse ResetRate index, then force-expire
// the positive array entry, retaining its supplied paused/storage operand.
export function conquestKingInitializeCounters(counters,rates){let c=rows(counters);if(!Array.isArray(rates)||rates.length!==3||rates.some(n=>!uint(n)))throw Error('Three explicit source King rate durations required');for(let i=0;i<3;i++){c=conquestKingResetRate(c,5+i,rates[i]);const row=c[2+i];if(!row.paused){row.frames=(row.frames+1)>>>0;row.elapsedMs=(row.elapsedMs+row.durationMs+1)>>>0;}}return c;}
