import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createRimGlow, atmosphereProfiles, supportsRimShader } from '../src/core/RimGlow.js';

test('atmosphere profiles keep Earth strongest and effects inherit parent without picking', () => {
  const sun = new THREE.Group(), parent = new THREE.Group();
  parent.position.set(10, 4, -2);
  for (const [id, profile] of Object.entries(atmosphereProfiles)) {
    assert.ok(profile[2] <= atmosphereProfiles.earth[2]);
    const rim = createRimGlow(2, profile, sun); parent.add(rim);
    assert.deepEqual(rim.getWorldPosition(new THREE.Vector3()).toArray(), [10, 4, -2]);
    const hits = []; rim.raycast(new THREE.Raycaster(), hits);
    assert.equal(hits.length, 0, id);
    assert.equal(rim.material.depthWrite, false);
    rim.geometry.dispose(); rim.material.dispose();
  }
});

test('failed shader probe is cached and deletes temporary GPU resources', () => {
  let compiles = 0, shadersDeleted = 0, programsDeleted = 0;
  const gl = { createProgram: () => ({}), createShader: () => ({}),
    shaderSource() {}, compileShader() { compiles++; }, getShaderParameter: () => false,
    deleteShader() { shadersDeleted++; }, deleteProgram() { programsDeleted++; } };
  assert.equal(supportsRimShader(gl), false);
  assert.equal(supportsRimShader(gl), false);
  assert.equal(compiles, 1); assert.equal(shadersDeleted, 1); assert.equal(programsDeleted, 1);
  const rim = createRimGlow(2, atmosphereProfiles.earth, new THREE.Group());
  rim.onBeforeRender({ getContext: () => gl }, null, new THREE.PerspectiveCamera());
  assert.equal(rim.material.isMeshBasicMaterial, true);
  rim.geometry.dispose(); rim.material.dispose();
});
