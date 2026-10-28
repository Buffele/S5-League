import './inventory-menu.css';
import './inventory-workshop.css';
import {installInventoryMenuView} from './inventory-menu-view.js';
import {installRoomMenu} from './room-menu.js';
export function installInventoryMenu(shell){
 const inventory=installInventoryMenuView(shell);installRoomMenu(shell);return inventory;
}
