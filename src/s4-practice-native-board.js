import {renderS4SourceBoard,S4_RESULT_BOARD_LAYOUT} from './s4-chaser-native-board.js';
// The diagnostic session has no verified score/health/economy producer.
export function renderS4PracticeBoard(host,{score=null,details=''}={}){renderS4SourceBoard(host,[{id:'local',name:'You',score:score??'—',exp:'—',pen:'—'}],{layout:S4_RESULT_BOARD_LAYOUT,kind:'diagnostic',details:details?[{id:'local',name:'Practice details',text:details}]:[]});}
