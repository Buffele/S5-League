import {PRACTICE_SOURCE_DATA} from './practice-source-data.js';
// Session clock only. Source score/result producers are not established:
// expiration is displayed without manufacturing a result, victory or ACK.
export class PracticeSessionState{
 constructor({scoreLimit=254}={}){const option=PRACTICE_SOURCE_DATA.choices.find(c=>Number(c.score)===scoreLimit);if(!option)throw Error('Authentic Practice option required');this.rules={scoreLimit,matchSeconds:Number(option.time)*60};this.reset();}
 reset(){this.mode='practice';this.phase='playing';this.remaining=this.rules.matchSeconds;this.elapsed=0;this.playingDelta=0;this.deadlineExpired=false;this.alive=true;this.winner=null;this.score=0;this.counter=0;this.scores={alpha:0,beta:0};this.scoreStatus='native producer unverified; no local points';this.resultStatus='native conclusion unverified; manual replay/exit';}
 tick(dt){if(!Number.isFinite(dt)||dt<0)throw Error('Invalid Practice session delta');this.playingDelta=dt;this.elapsed+=dt;this.remaining=Math.max(0,this.rules.matchSeconds-this.elapsed);this.deadlineExpired=this.remaining===0;return null;}
 get unlimited(){return this.rules.scoreLimit===254;}
}
