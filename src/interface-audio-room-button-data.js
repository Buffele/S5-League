// Exact widgets behind the waiting-room crops, projected onto their S5 controls.
// The generic mouse cue establishes no native navigation or business outcome.
const source=Object.freeze({
 contract:'base-window-974910-974970',widgetType:'CGUI_Button',
 xui:'xui/ui/3d_waitingroom.xui',
 sourceSha256:'5ce4191f2acadba907ff97578c9ba1bff0f50c553ef498440f32cb21dcfbf0fa',
 sourceCrc32:'603ba41b',xuiMouseUpSound:'',xuiMouseEnterSound:'',
});
export const INTERFACE_WAITING_ROOM_BUTTON_IDENTITIES=Object.freeze({
 changeItems:Object.freeze({
  ...source,
  nodePath:'3D_waiting_Window/3D_waiting_GroupBox/control_button_GroupBox/item_change_Button',
  nativeLabel:'Change Item',
  uiProjection:'S5 joined-room Change items footer; exact item_change_Button crops, base mouse cue only, not native inventory navigation or equipment acceptance',
 }),
 matchSettings:Object.freeze({
  ...source,
  nodePath:'3D_waiting_Window/3D_waiting_GroupBox/map_Image_GroupBox/UI_GroupBox/set_room_property_Button',
  nativeLabel:'Change Settings',
  uiProjection:'S5 joined-room Match settings gear; exact visible-group set_room_property_Button crops, base mouse cue only, not native room-property authority or validation',
 }),
});
export function identifyWaitingRoomInterfaceButton(element){
 if(element?.matches?.('#waiting-room .waiting-room-actions button[data-room-menu="inventory"]'))return INTERFACE_WAITING_ROOM_BUTTON_IDENTITIES.changeItems;
 if(element?.matches?.('#waiting-room button.waiting-room-map-settings[data-room-menu="room"]'))return INTERFACE_WAITING_ROOM_BUTTON_IDENTITIES.matchSettings;
 return null;
}
