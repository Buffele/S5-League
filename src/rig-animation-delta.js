export function mergeRigAnimationDelta(reference, delta) {
  if (delta?.format !== 's5-rig-animation-delta-v1') throw Error('Unsupported rig animation delta');
  if (delta.playable !== false || delta.rendered !== false || delta.behaviorVerified !== false) {
    throw Error('Breaker preview only accepts unverified staged animation data');
  }
  if (delta.source !== reference.source) throw Error(`Rig animation source mismatch: ${delta.source}`);
  const existingClips = new Set(reference.clips.map(clip => clip.name));
  for (const clip of delta.existingBaseRig?.clips || []) {
    const current=reference.clips.find(candidate=>candidate.name===clip.name);
    if(!current||current.durationTicks!==clip.durationTicks||current.tracks!==clip.tracks)throw Error(`Existing rig animation differs from verified source: ${clip.name}`);
  }
  for (const clip of delta.clips) if (existingClips.has(clip.name)) throw Error(`Duplicate rig animation clip: ${clip.name}`);
  const additions = new Map(delta.bones.map(bone => [bone.name, bone]));
  for (const bone of delta.bones) {
    const current = reference.bones.find(candidate => candidate.name === bone.name);
    if (!current) throw Error(`Animation delta bone is absent from rig: ${bone.name}`);
    if (current.parent !== bone.parent) throw Error(`Animation delta parent mismatch: ${bone.name}`);
  }
  return {
    ...reference,
    clips: [...reference.clips, ...delta.clips],
    bones: reference.bones.map(bone => ({
      ...bone,
      animations: { ...bone.animations, ...(additions.get(bone.name)?.animations || {}) },
    })),
  };
}
