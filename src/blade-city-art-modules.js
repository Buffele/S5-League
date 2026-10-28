import { Group } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Optional Blender art-only overlays. Source geometry, collision and gameplay
// stay with the native map world; coordinates are in S5 world units (Y up).
export async function installBladeCityArtModules(world, config, { loadAsset = url => new GLTFLoader().loadAsync(url) } = {}) {
  const rootPath = '/assets/maps/blade-city/reconstruction/';
  if (world.nativeMapId !== 158 || config?.enabled !== true || config.sourceSha256 !== world.sourceAuthoritySha256 ||
      !Array.isArray(config.assets) || config.assets.length !== 2 || new Set(config.assets).size !== 2 ||
      config.assets.some(url => typeof url !== 'string' || !url.startsWith(rootPath) || !/^[a-z0-9-]+\.glb$/.test(url.slice(rootPath.length)))) {
    throw Error('Blade City art module contract mismatch');
  }
  const group = new Group(), geometries = new Set(), materials = new Set(), textures = new Set();
  group.name = 'Blade City / separate experimental visual modules';
  let disposed = false;
  function dispose() {
    if (disposed) return;
    disposed = true; group.removeFromParent();
    for (const texture of textures) texture.dispose();
    for (const material of materials) material.dispose();
    for (const geometry of geometries) geometry.dispose();
  }
  const results = await Promise.allSettled(config.assets.map(async url => {
    const gltf = await loadAsset(url);
    if (!gltf?.scene?.isObject3D) throw Error('Blade City visual module scene unavailable');
    group.add(gltf.scene);
    gltf.scene.traverse(object => {
      if (!object.isMesh) return;
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (!material) continue; materials.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
      }
      object.userData.visualOnly = true;
    });
  }));
  const failure = results.find(result => result.status === 'rejected');
  if (failure) { dispose(); throw failure.reason; }
  world.root.add(group);
  return { root: group, dispose, snapshot: () => ({ assets: config.assets.length, visualOnly: true, collisionChanged: false }) };
}
