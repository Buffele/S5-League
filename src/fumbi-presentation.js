// S5 state mapping inferred from the native body alpha tracks, not a recovered
// S5Runtime state table. Transition clips run once; the normal dance stays visible.
export function createFumbiPresentation(animation){
 let previous=null,transition=null;
 const api={reset(){previous=null;transition=null;},update(dt,{ball,owner=null,phase='playing'}={}){
  const state=phase==='goal'?'goal':owner?`carried:${owner.id}`:ball;
  if(state!==previous){
   if(state==='goal'){transition=null;animation.play('mas_002',{repeat:false,restart:true});}
   else if(owner){transition='mas_001';animation.play(transition,{repeat:false,restart:true});}
   else if(previous!==null&&(previous.startsWith('carried:')||previous==='goal'||previous==='dropped')){transition='mas_003';animation.play(transition,{repeat:false,restart:true});}
   else {transition=null;animation.play('mas_000',{restart:true});}
   previous=state;
  }
  if(transition&&animation.finished){transition=null;animation.play('mas_000',{restart:true});}
  animation.update(dt,{stationary:!!owner,upwardLight:true});
 }};return api;
}
