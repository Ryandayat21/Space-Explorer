import * as THREE from 'three';

// Visual profiles, not atmospheric heights or measured scattering coefficients.
export const atmosphereProfiles = {
  venus: [0xffc779, 1.025, .11], earth: [0x65adff, 1.035, .22],
  mars: [0xe4a078, 1.012, .035], jupiter: [0xe5cba6, 1.018, .055],
  saturn: [0xead8ac, 1.018, .05], uranus: [0x8be0e6, 1.025, .09],
  neptune: [0x558eff, 1.025, .10]
};

const vertexShader = `
precision highp float;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
in vec3 position;
in vec3 normal;
out vec3 viewPosition;
out vec3 viewNormal;
void main() {
  vec4 p = modelViewMatrix * vec4(position, 1.0);
  viewPosition = p.xyz;
  viewNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * p;
}`;
const fragmentShader = `
precision highp float;
uniform vec3 tint;
uniform vec3 sunPosition;
uniform float strength;
uniform float solar;
in vec3 viewPosition;
in vec3 viewNormal;
out vec4 outColor;
void main() {
  vec3 n = normalize(viewNormal);
  float facing = abs(dot(n, normalize(-viewPosition)));
  // A soft band: zero at the silhouette, fading toward the surface.
  float rim = smoothstep(0.0, 0.12, facing) * pow(1.0 - facing, 3.0);
  float day = smoothstep(-0.25, 0.45, dot(n, normalize(sunPosition - viewPosition)));
  float light = mix(0.08 + 0.92 * day, 1.0, solar);
  outColor = vec4(tint, strength * rim * light);
}`;

const supported = new WeakMap();
// Compile/link the exact raw GLSL once per context BEFORE handing it to Three.
// A failed probe keeps the built-in material, without an invalid render program.
export function supportsRimShader(gl) {
  if (supported.has(gl)) return supported.get(gl);
  const shaders = [], program = gl.createProgram();
  let ok = false;
  try {
    for (const [type, source] of [[gl.VERTEX_SHADER, vertexShader], [gl.FRAGMENT_SHADER, fragmentShader]]) {
      const shader = gl.createShader(type); shaders.push(shader);
      gl.shaderSource(shader, '#version 300 es\n' + source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return false;
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    ok = !!gl.getProgramParameter(program, gl.LINK_STATUS);
    return ok;
  } catch { return false; }
  finally {
    for (const shader of shaders) gl.deleteShader(shader);
    gl.deleteProgram(program); supported.set(gl, ok);
  }
}

export function createRimGlow(radius, profile, sun, solar = false) {
  const [color, scale, strength] = profile;
  const fallback = new THREE.MeshBasicMaterial({ color, transparent: true,
    opacity: strength * .12, side: THREE.BackSide, depthWrite: false,
    blending: THREE.AdditiveBlending });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius * scale, 40, 28), fallback);
  mesh.name = solar ? 'solar-corona' : 'atmosphere-rim';
  mesh.raycast = () => {};
  const sunPosition = new THREE.Vector3();
  let prepared = false;
  mesh.onBeforeRender = (renderer, scene, camera) => {
    if (!prepared) {
      prepared = true;
      if (supportsRimShader(renderer.getContext())) {
        // Raw output is display-referred sRGB for this faint additive overlay only.
        mesh.material = new THREE.RawShaderMaterial({ vertexShader, fragmentShader,
          glslVersion: THREE.GLSL3, transparent: true, side: THREE.BackSide,
          depthWrite: false, blending: THREE.AdditiveBlending,
          uniforms: { tint: { value: new THREE.Color(color).convertLinearToSRGB() },
            strength: { value: strength }, solar: { value: solar ? 1 : 0 },
            sunPosition: { value: sunPosition } } });
        mesh.material.addEventListener('dispose', () => fallback.dispose());
      }
    }
    sun.getWorldPosition(sunPosition).applyMatrix4(camera.matrixWorldInverse);
  };
  return mesh;
}
