// Lower container62a4c0/62a510: high byte selects child, low byte its phase.
// Spy phase selector5deed2..5def01 deliberately passes command &0xff.
export function encodeNativeLowerCommand(child,phase){
 if(!Number.isInteger(child)||child<0||child>2||!Number.isInteger(phase)||phase<0||phase>255)throw new RangeError('Invalid native lower command');
 return child*256+phase;
}
export function decodeNativeLowerCommand(command){
 if(!Number.isInteger(command)||command<0||command>65535)throw new RangeError('Invalid native lower command');
 return {child:command>>>8,phase:command&255};
}
export function spyNativeLowerCommand(command){return decodeNativeLowerCommand(command&255);}
// Callers provide actual native child objects and their virtual operations.
// switch62a460 exits/enters even if the selected pointer is unchanged.
export function applyNativeLowerCommand(container,command,{enter,exit,selectPhase}){
 const {child,phase}=decodeNativeLowerCommand(command);
 const next=container.children[child];
 if(next){
  const hadSelected=!!container.selected;
  if(hadSelected)exit(container.selected);
  container.selected=next;
  if(hadSelected)enter(next);
 }
 if(container.selected)selectPhase(container.selected,phase);
 return container.selected;
}
