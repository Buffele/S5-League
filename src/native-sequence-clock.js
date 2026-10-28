// Sequence controller119fae0, reset119f460. Native integer time units.
const uint32=value=>{
 if(!Number.isInteger(value)||value<0||value>0xffffffff)throw new RangeError('Native uint32 sequence time required');
 return value;
};
const boolean=value=>{if(typeof value!=='boolean')throw new TypeError('Explicit native sequence flag required');return value;};
export function resetNativeSequenceClock(state,duration){
 uint32(duration);boolean(state.looping);
 Object.assign(state,{emitting:true,enabled:true,speed:1,start:0,end:duration,previous:0,current:0});
 return state;
}
export function advanceNativeSequenceClock(state,delta){
 uint32(delta);uint32(state.current);uint32(state.start);uint32(state.end);
 boolean(state.enabled);boolean(state.emitting);boolean(state.looping);
 const speed=Math.fround(state.speed);
 if(!Number.isFinite(speed))throw new RangeError('Finite native float sequence speed required');
 if(![24,53,64].includes(state.precisionBits))throw new TypeError('Explicit native x87 precision required');
 if(state.roundingMode!=='nearest')throw new TypeError('Explicit verified nearest-mode float conversions required');
 state.previous=state.current;
 if(state.enabled){
  // Unsigned delta -> stored float32, then x87 multiply by stored float32.
  // FISTP int64 under OR0xc00 truncates; native adds its low32 bits.
  // OR0xc00 changes rounding, not x87 precision. The runtime precision
  // control is not established; require it instead of assuming a default.
  const product=Math.fround(delta)*speed;
  const scaled=Math.trunc(state.precisionBits===24?Math.fround(product):product);
  if(!Number.isFinite(scaled)||scaled<-(2**63)||scaled>=2**63)throw new RangeError('Native sequence int64 conversion domain exceeded');
  const increment=Number(BigInt.asUintN(32,BigInt(scaled)));
  state.current=(state.current+increment)>>>0;
  if(state.end<state.current){
   if(!state.looping)return {emitting:state.emitting,previous:state.previous,current:state.current,dispatch:false};
   const span=(state.end-state.start)>>>0;
   if(span===0)throw new RangeError('Native sequence modulo by zero');
   state.current=(((state.current-state.end)>>>0)%span+state.start)>>>0;
  }
 }
 return {emitting:state.emitting,previous:state.previous,current:state.current,dispatch:true};
}
// The owner supplies the actual native collection order and virtual methods.
// No clipping to action windows, invented reset on wrap or fractional carry.
export function tickNativeSequenceActions(state,delta,actions,{updateAction,readActive}={}){
 if(!Array.isArray(actions)||typeof updateAction!=='function'||typeof readActive!=='function')throw new TypeError('Native ordered action methods required');
 const timing=advanceNativeSequenceClock(state,delta);
 if(!timing.dispatch)return false;
 let active=false;
 for(const action of actions){
  // Native rereads controller fields for each virtual action call.
  updateAction(action,{emitting:state.emitting,previous:state.previous,current:state.current,dispatch:true});
  const value=boolean(readActive(action));active=active||value;
 }
 return !state.looping&&state.emitting?true:active;
}
