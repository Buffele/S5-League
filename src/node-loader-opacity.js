// Native CActNodeLoader1160160: active interval is inclusive; FadeOutTime
// begins at end, not end-FadeOutTime. A skipped/invisible action cannot
// spontaneously become visible during its tail. Browser time remains seconds
// in Sequence; this evaluator accepts milliseconds without claiming x87 parity.
export function nodeLoaderOpacity(previous,clock,start,end,fadeIn,fadeOut){
 if(clock>=start&&clock<=end)return previous>=1?previous:fadeIn?Math.min(1,(clock-start)/fadeIn):1;
 if(previous<=0||clock<start)return 0;
 return fadeOut?Math.max(0,(fadeOut-(clock-end))/fadeOut):0;
}
