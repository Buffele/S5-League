import {assertConquestRookDefenseCommandSource} from './conquest-rook-aura-combat.js';
import {assertConquestRookDefenseConditions} from './conquest-rook-defense-conditions.js';
const uint=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
//13EFBA0: admission9FDC90 applies at Enter; exit9FDE00 is empty.
export class ConquestRookDefenseCommand{
 #source;#authority;#conditions;#destroyed=false;#entered=false;
 constructor(source,{actorAuthority,conditionOwner}={}){assertConquestRookDefenseCommandSource(source,{actorAuthority,conditionOwner});assertConquestRookDefenseConditions(conditionOwner,{actorAuthority});this.#source=source;this.#authority=actorAuthority;this.#conditions=conditionOwner;this.gameTime=source.gameTime;this.nativeType=6;this.actorId=source.actorId;this.counter={updates:0,durationMs:0,elapsedMs:0,paused:false};}
 enter(){if(this.#destroyed||this.#entered)throw Error('Once-only owned defense command admission required');assertConquestRookDefenseCommandSource(this.#source,{actorAuthority:this.#authority,conditionOwner:this.#conditions});this.#entered=true;return this.#conditions.admit(this.#source);}
 tick(deltaMs){if(this.#destroyed||!uint(deltaMs))throw Error('Live uint32 defense command tick required');const c=this.counter;if(!c.paused){c.updates=(c.updates+1)>>>0;c.elapsedMs=(c.elapsedMs+deltaMs)>>>0;}}
 isRunning(){if(this.#destroyed)throw Error('Disposed defense command');return this.counter.elapsedMs<=this.counter.durationMs;}
 exit(){if(this.#destroyed)throw Error('Disposed defense command');}
 destroy(){this.#destroyed=true;}
}
