const UNBOUND=Symbol('unbound-animation-action');

// Keep the public Map contract (including ordered, live iteration), while
// allocating Three interpolants and property bindings only when requested.
export class AnimationActionCache extends Map {
 #clips=new Map();
 #createAction;
 constructor(clips,createAction){
  super();this.#createAction=createAction;
  for(const clip of clips){this.#clips.set(clip.name,clip);super.set(clip.name,UNBOUND);}
 }
 get(name){
  const value=super.get(name);
  if(value!==UNBOUND)return value;
  const action=this.#createAction(this.#clips.get(name));
  super.set(name,action);this.#clips.delete(name);return action;
 }
 set(name,action){this.#clips.delete(name);return super.set(name,action);}
 delete(name){this.#clips.delete(name);return super.delete(name);}
 clear(){this.#clips.clear();super.clear();}
 *values(){for(const name of super.keys())yield this.get(name);}
 *entries(){for(const name of super.keys())yield [name,this.get(name)];}
 [Symbol.iterator](){return this.entries();}
 forEach(callback,thisArg){
  if(typeof callback!=='function')throw new TypeError('Callback must be a function');
  for(const name of super.keys())callback.call(thisArg,this.get(name),name,this);
 }
}
