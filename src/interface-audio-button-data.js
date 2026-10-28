import {identifyWaitingRoomInterfaceButton} from './interface-audio-room-button-data.js';

// Authenticated XUI identity + generic base-window callback; DOM mapping is an explicit S5 projection.
export const INTERFACE_INVENTORY_BUTTON_IDENTITIES=Object.freeze({
  "equip": {
    "contract": "base-window-974910-974970",
    "widgetType": "CGUI_Button",
    "xui": "xui/ui/shop_ inven.xui",
    "nodePath": "Inven_Window/ItemSlot_GroupBox/Item_Install_Button",
    "sourceSha256": "5b8e05b099b310ba49495a3869354b79ea614c7a1f111ffc62d02d5d587b043d",
    "sourceCrc32": "8bd265b3",
    "xuiMouseUpSound": "Sound\\Interface\\shop_costume_wear.ogg",
    "xuiMouseUpResourceAvailable": false,
    "uiProjection": "S5 per-card equip/remove projects the single native selected-item button; base-window cue is separate from XUI sound and from equipment outcome"
  },
  "remove": {
    "contract": "base-window-974910-974970",
    "widgetType": "CGUI_Button",
    "xui": "xui/ui/shop_ inven.xui",
    "nodePath": "Inven_Window/ItemSlot_GroupBox/Item_Clear_Button",
    "sourceSha256": "5b8e05b099b310ba49495a3869354b79ea614c7a1f111ffc62d02d5d587b043d",
    "sourceCrc32": "8bd265b3",
    "xuiMouseUpSound": "Sound\\Interface\\shop_costume_unwear.ogg",
    "xuiMouseUpResourceAvailable": false,
    "uiProjection": "S5 per-card equip/remove projects the single native selected-item button; base-window cue is separate from XUI sound and from equipment outcome"
  }
});
export const INTERFACE_BASE_BUTTON_PUBLIC_TRACKS=Object.freeze({
  "sound/interface/mouse_click.ogg": {
    "url": "/assets/s5runtime/interface-audio/sound/interface/mouse_click.ogg",
    "path": "sound/interface/mouse_click.ogg",
    "sha256": "c12c63147b5b1aa5b716c906e9eabf127de615e9fc292335cdca3d8d7076f3b2",
    "crc32": "bcfcf5b6",
    "size": 27944
  },
  "sound/interface/mouse_enter.ogg": {
    "url": "/assets/s5runtime/interface-audio/sound/interface/mouse_enter.ogg",
    "path": "sound/interface/mouse_enter.ogg",
    "sha256": "2d8f665183ee437d417e89a3bced184dc1c97faa6408b241bb830fdf951b3a4f",
    "crc32": "29df2473",
    "size": 13538
  }
});
export function identifyInventoryInterfaceButton(element){
 if(element?.matches?.('button.s5runtime-inventory-equip[data-weapon],button.s5runtime-inventory-equip[data-skill]'))return INTERFACE_INVENTORY_BUTTON_IDENTITIES.equip;
 if(element?.matches?.('button.s5runtime-skill-remove'))return INTERFACE_INVENTORY_BUTTON_IDENTITIES.remove;
 return null;
}

// Same exact start_blue_Button already used by the room's three atlas crops.
// Colour is a source widget name, not a team assignment. Only the generic
// CGUI_Button mouse phase is projected; the native Start transport stays open.
export const INTERFACE_ROOM_START_IDENTITY=Object.freeze({
 contract:'base-window-974910-974970',widgetType:'CGUI_Button',
 xui:'xui/ui/3d_waitingroom.xui',
 nodePath:'3D_waiting_Window/3D_waiting_GroupBox/control_button_GroupBox/start_blue_Button',
 sourceSha256:'5ce4191f2acadba907ff97578c9ba1bff0f50c553ef498440f32cb21dcfbf0fa',
 sourceCrc32:'603ba41b',nativeStartHandler:'CB3410',
 uiProjection:'S5 joined-room Start; base mouse cue only, not native validation or acceptance',
});
// These three buttons already paint the matching native widget crops. Their
// routes are S5 routes: the base mouse cue does not establish native navigation,
// a room service, or the Menu Settings -> lobby_option transport.
export const INTERFACE_LOBBY_BUTTON_IDENTITIES=Object.freeze({
 'create-room':Object.freeze({
  contract:'base-window-974910-974970',widgetType:'CGUI_Button',
  xui:'xui/ui/lobby_roomlist.xui',
  nodePath:'RoomList_Window/RoomList_GroupBox/MakeRoom_Button_GroupBox/MakeMission_Button',
  sourceSha256:'f92370dd1fb364c3689e241afc56a5c37ccc1b5de99dfdbadf3b6f37649b6af3',sourceCrc32:'0daa4c6a',
  nativeLabel:'Create Room',sprite:'create-room.png',
  uiProjection:'S5 Create match opens local preparation; exact Create Room widget crop, base mouse cue only, no native room creation or acceptance',
 }),
 settings:Object.freeze({
  contract:'base-window-974910-974970',widgetType:'CGUI_Button',
  xui:'xui/ui/main_upnavi.xui',
  nodePath:'up_navi_Window/up_navi_GroupBox/option_GroupBox/set_GroupBox/Set_Button',
  sourceSha256:'3ee45a63b70bee9e863aaaa031e8dce3b0e4483ce4f23caa950d821ef060513e',sourceCrc32:'0bc6b654',
  nativeLabel:'Menu Settings',sprite:'settings.png',xuiMouseUpSound:'',xuiMouseEnterSound:'',
  uiProjection:'S5 Settings uses the Menu Settings widget crop; base mouse cue only, native options opener remains unverified',
 }),
 back:Object.freeze({
  contract:'base-window-974910-974970',widgetType:'CGUI_Button',
  xui:'xui/ui/main_upnavi.xui',
  nodePath:'up_navi_Window/up_navi_GroupBox/option_GroupBox/ItemList_Left_Button',
  sourceSha256:'3ee45a63b70bee9e863aaaa031e8dce3b0e4483ce4f23caa950d821ef060513e',sourceCrc32:'0bc6b654',
  nativeLabel:'Back',sprite:'back.png',xuiMouseUpSound:'',xuiMouseEnterSound:'',
  uiProjection:'S5 Back to lobby uses the Back widget crop; base mouse cue only, native back destination is not asserted',
 }),
});
const lobbySelectors=Object.freeze({
 'create-room':'.s5-lobby button.s5-lobby-create[data-interface-lobby-button="create-room"]',
 settings:'.s5-lobby button.s5-lobby-settings[data-interface-lobby-button="settings"]',
 back:'.s5-lobby button.s5-lobby-back[data-interface-lobby-button="back"]',
});
export function identifyGameInterfaceButton(element){
 const inventory=identifyInventoryInterfaceButton(element);if(inventory)return inventory;
 for(const [key,selector] of Object.entries(lobbySelectors))if(element?.matches?.(selector))return INTERFACE_LOBBY_BUTTON_IDENTITIES[key];
 return element?.matches?.('#waiting-room button[data-room-start]')?INTERFACE_ROOM_START_IDENTITY:identifyWaitingRoomInterfaceButton(element);
}
