// Shared map loader. The dedicated Conquest session composes all eight waves
// after room/audio preparation. Native fidelity gates remain open.
// Keep the recovered geometry and hide only the two unresolved texture models,
// as the existing diagnostic loader already does. No replacement pixels.
export async function loadConquestExplorationWorld(scene){
 const {createConquestWorld}=await import('./conquest-world.js');
 const world=await createConquestWorld(scene,{spawnNode:'alpha_spawn_pos_01',allowIncompleteTextures:true});
 world.name='Conquest · Cube Defence';
 world.sessionMapKind='conquest-eight-waves';
 world.explorationOnly=false;
 // S5 entry framing toward the defended base, using its authored marker.
 // This is not a claim about S5Runtime's camera controller or spawn-facing policy.
 world.previewFacing=Math.atan2(world.baseAuthoredBox.scene.center[0]-world.spawn.x,world.baseAuthoredBox.scene.center[2]-world.spawn.z);
 return world;
}
