// On-demand diagnostics only: never called by normal rendering.
export function renderStats(renderer, mode) {
  const geometries = new Set(), materials = new Set(); let bufferBytes = 0;
  mode.scene.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.material) for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
  });
  const arrays = new Set();
  for (const geometry of geometries) {
    for (const attribute of Object.values(geometry.attributes)) arrays.add(attribute.isInterleavedBufferAttribute ? attribute.data.array : attribute.array);
    if (geometry.index) arrays.add(geometry.index.array);
  }
  for (const array of arrays) bufferBytes += array.byteLength;
  return { mode: mode.id, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
    points: renderer.info.render.points, particles: mode.galaxy?.particleCount ?? renderer.info.render.points,
    geometries: geometries.size, materials: materials.size, bufferBytes,
    residentGeometries: renderer.info.memory.geometries, residentTextures: renderer.info.memory.textures };
}
