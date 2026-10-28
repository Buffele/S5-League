// Cached opponent avatars own their prepared trails. Combat views borrow them
// across room transitions; a view must clear/detach, never dispose that cache.
export function createOpponentTrailCache({appliesTo,load,prepare}={}){
 if([appliesTo,load,prepare].some(port=>typeof port!=='function'))throw new TypeError('Explicit opponent trail support/load/prepare ports required');
 let entries=new WeakMap(),disposed=false;const retained=new Set();
 return {
  async prepare(avatar){
   if(disposed)throw Error('Opponent trails disposed');
   if(!appliesTo(avatar))return undefined;
   let entry=entries.get(avatar);if(entry)return entry.promise;
   entry={avatar,trail:null,ready:false,released:false,promise:null};entries.set(avatar,entry);retained.add(entry);
   entry.promise=(async()=>{
    try{
     const trail=await load(avatar);entry.trail=trail;
     if(!trail?.mesh||typeof trail.clear!=='function'||typeof trail.dispose!=='function')throw Error('Prepared opponent trail contract missing');
     if(disposed)throw Error('Opponent trails disposed');
     await prepare(avatar,trail);
     if(disposed)throw Error('Opponent trails disposed');
     entry.ready=true;return trail;
    }catch(error){
     if(entry.trail&&!entry.released){entry.released=true;entry.trail.dispose();}
     if(entries.get(avatar)===entry)entries.delete(avatar);retained.delete(entry);throw error;
    }
   })();return entry.promise;
  },
  get(avatar){
   if(disposed)throw Error('Opponent trails disposed');
   if(!appliesTo(avatar))return undefined;
   const entry=entries.get(avatar);if(!entry?.ready)throw Error('Opponent trail has not finished preparation: '+avatar.weapon);
   return entry.trail;
  },
  dispose(){
   if(disposed)return;disposed=true;
   // Pending work keeps ownership until its awaited preparation settles.
   for(const entry of retained)if(entry.ready&&!entry.released){entry.released=true;entry.trail.dispose();}
   entries=new WeakMap();retained.clear();
  },
 };
}
