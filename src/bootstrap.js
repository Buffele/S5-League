import {mountS5LoadingView} from './s5-loading-view.js';
import {startS5Game} from './s5-game-bootstrap.js';
import './s5-loading-view.css';

const loading=mountS5LoadingView(document.body,{onRetry:()=>location.reload()});
document.dispatchEvent(new Event('s5:loading-view-mounted'));
// Remove the first-paint placeholder only after its opaque replacement is mounted.
document.getElementById('s5-boot-placeholder')?.remove();
void startS5Game({loading,loadGame:()=>import('./main.js')}).then(result=>{if(!result.accepted)console.error('Game preparation failed',result.error);});
window.addEventListener('pagehide',event=>{if(!event.persisted)loading.dispose();});
