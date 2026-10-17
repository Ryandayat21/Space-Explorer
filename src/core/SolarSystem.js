import * as THREE from 'three';
import { bodies, moons, visualRadiusFromEarth } from '../data/celestialBodies.js';

import { orbitalElements } from '../data/orbitalElements.js';
import { OrbitMotion } from './OrbitMotion.js';
import { dwarfPlanets } from '../data/dwarfPlanets.js';
import { createPlanetRings } from './PlanetRings.js';
import { comets } from '../data/comets.js';
import { CometVisual } from './CometVisual.js';
import { smallBodyRegions } from '../data/smallBodyRegions.js';
import { SmallBodyRegion } from './SmallBodyRegion.js';
import { SpaceBackground } from './SpaceBackground.js';
import { createRimGlow, atmosphereProfiles } from './RimGlow.js';

const DEG = Math.PI / 180;
const textureIds = new Set([...bodies.map(body => body.id), 'moon']);

function seededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => ((value = (value * 16807) % 2147483647) - 1) / 2147483646;
}

function makePlanetTexture(body) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const base = new THREE.Color(body.color);
  const random = seededRandom([...body.id].reduce((total, char) => total + char.charCodeAt(0), 1));

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, `#${base.clone().offsetHSL(0, 0.03, 0.14).getHexString()}`);
  gradient.addColorStop(0.5, body.color);
  gradient.addColorStop(1, `#${base.clone().offsetHSL(0, 0, -0.18).getHexString()}`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  if (['jupiter', 'saturn', 'uranus', 'neptune', 'venus'].includes(body.id)) {
    const bands = body.id === 'jupiter' ? 28 : 16;
    for (let i = 0; i < bands; i += 1) {
      const y = (i / bands) * size;
      const alpha = 0.04 + random() * 0.15;
      ctx.fillStyle = random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(23,34,52,${alpha})`;
      ctx.fillRect(0, y, size, size / bands * (0.5 + random()));
    }
    if (body.id === 'jupiter') {
      ctx.fillStyle = 'rgba(151, 59, 39, .55)';
      ctx.beginPath();
      ctx.ellipse(370, 320, 50, 20, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    for (let i = 0; i < 620; i += 1) {
      const radius = 1 + random() * 13;
      const light = random() > 0.5 ? 255 : 20;
      ctx.fillStyle = `rgba(${light},${light},${light},${0.025 + random() * 0.1})`;
      ctx.beginPath();
      ctx.arc(random() * size, random() * size, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    if (body.id === 'earth') {
      ctx.fillStyle = 'rgba(64, 126, 73, .78)';
      for (let i = 0; i < 26; i += 1) {
        ctx.beginPath();
        ctx.ellipse(random() * size, random() * size, 18 + random() * 42, 8 + random() * 20, random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,.16)';
      for (let i = 0; i < 60; i += 1) ctx.fillRect(random() * size, random() * size, 20 + random() * 90, 2 + random() * 5);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeSunTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 512, 256);
  gradient.addColorStop(0, '#ff7a17');
  gradient.addColorStop(0.5, '#ffd45c');
  gradient.addColorStop(1, '#ff922b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 256);
  const random = seededRandom(1701);
  for (let i = 0; i < 850; i += 1) {
    ctx.fillStyle = `rgba(255,255,210,${0.05 + random() * 0.22})`;
    ctx.beginPath();
    ctx.arc(random() * 512, random() * 256, 1 + random() * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(255,239,170,1)');
  gradient.addColorStop(0.16, 'rgba(255,184,62,.9)');
  gradient.addColorStop(0.45, 'rgba(255,104,28,.28)');
  gradient.addColorStop(1, 'rgba(255,65,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export class SolarSystem {
  constructor(scene) {
    this.scene = scene;
    this.objects = new Map();
    this.pickables = [];
    this.orbits = [];
    this.orbitMotions = [];
    this.elapsedDays = 0;
    this.textureLoader = new THREE.TextureLoader();
    this.loadedTextures = new Map();
    this.effects = [];
    this.scratch = new THREE.Vector3();
    this.disposed = false;
    this.orbitsVisible = true;

    this.root = new THREE.Group();
    this.root.rotation.x = -2.5 * DEG;
    scene.add(this.root);

    this.#createLighting();
    this.#createStarfield();
    this.#createSun();
    this.#createPlanets();
    this.#createComets();
    this.regions = new Map(smallBodyRegions.map(config => {
      const region = new SmallBodyRegion(config);
      this.root.add(region);
      return [config.id, region];
    }));
    this.asteroidBelt = this.regions.get('asteroid-belt');
    this.selection = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), new THREE.MeshBasicMaterial({ color: 0x66d9ff, transparent: true, opacity: 0.16, side: THREE.BackSide, depthWrite: false }));
    this.selection.visible = false;
    scene.add(this.selection);
    for (const object of this.objects.values()) {
      const hit = new THREE.Mesh(new THREE.SphereGeometry(Math.max(object.radius, 0.75), 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
      hit.userData.bodyId = object.data.id;
      object.group.add(hit);
      this.pickables.push(hit);
    }
  }

  #createLighting() {
    // A very faint neutral fill keeps the night hemisphere readable without a blue cast.
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x606878, 0.035));
    // Constant visual exposure: compressed orbital distances are not physical light distances.
    const sunLight = new THREE.PointLight(0xfff4e4, 3, 0, 0);
    sunLight.position.set(0, 0, 0);
    this.root.add(sunLight);
  }

  #createStarfield() {
    this.background = new SpaceBackground();
    this.scene.add(this.background);
  }

  #createSun() {
    const data = bodies[0];
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(data.visualRadius, 64, 40),
      new THREE.MeshBasicMaterial({ map: makeSunTexture(), color: new THREE.Color(1.3, 1.3, 1.3) })
    );
    mesh.userData.bodyId = data.id;
    group.add(mesh);

    const glowMaterial = new THREE.SpriteMaterial({ map: makeGlowTexture(), color: 0xff9b38, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const glow = new THREE.Sprite(glowMaterial);
    glow.scale.set(32, 32, 1);
    glow.material.opacity = 0.32;
    glow.raycast = () => {};
    group.add(glow);
    this.effects.push(glow);

    const corona = createRimGlow(data.visualRadius, [0xffb140, 1.10, .25], group, true);
    group.add(corona);
    this.effects.push(corona);

    this.root.add(group);
    this.objects.set(data.id, { data, group, mesh, radius: data.visualRadius, pivot: null });
    this.pickables.push(mesh);
  }

  #createPlanets() {
    for (const data of [...bodies.slice(1), ...dwarfPlanets]) {
      const orbitRadius = orbitalElements[data.id].semiMajorAxis;
      const radius = data.visualRadius ?? visualRadiusFromEarth(data.radiusEarth);
      const parentObject = this.objects.get('sun');
      const motion = new OrbitMotion(parentObject.group, orbitalElements[data.id]);
      this.orbitMotions.push(motion);
      this.orbits.push(motion.line);
      const group = motion.group;
      const visual = new THREE.Group();
      visual.rotation.z = data.axialTilt * DEG;
      group.add(visual);

      const material = new THREE.MeshStandardMaterial({
        map: makePlanetTexture(data),
        color: 0xffffff,
        roughness: ['jupiter', 'saturn', 'uranus', 'neptune'].includes(data.id) ? 0.9 : 0.96,
        metalness: 0
      });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), material);
      mesh.userData.bodyId = data.id;
      visual.add(mesh);

      if (atmosphereProfiles[data.id]) {
        const atmosphere = createRimGlow(radius, atmosphereProfiles[data.id], parentObject.group);
        visual.add(atmosphere);
        this.effects.push(atmosphere);
      }

      if (data.rings) mesh.add(createPlanetRings(data.id, radius));

      const object = { data, group, mesh, radius, parentObject, motion, orbitRadius };
      this.objects.set(data.id, object);
      this.pickables.push(mesh);
      this.#createMoonsForPlanet(object);
    }
  }

  #createComets() {
    for (const data of comets) {
      const parentObject = this.objects.get('sun');
      const motion = new OrbitMotion(parentObject.group, orbitalElements[data.id]);
      this.orbitMotions.push(motion); this.orbits.push(motion.line);
      const visual = new CometVisual(data.visualRadius);
      motion.group.add(visual);
      visual.nucleus.userData.bodyId = data.id;
      this.objects.set(data.id, { data, group: motion.group, mesh: visual.nucleus,
        radius: data.visualRadius, parentObject, motion, cometVisual: visual });
      this.pickables.push(visual.nucleus);
      this.effects.push(visual.coma);
      visual.update(motion.group.position);
    }
  }

  #createMoonsForPlanet(parentObject) {
    const planetMoons = moons.filter((moon) => moon.parent === parentObject.data.id);
    planetMoons.forEach((moon) => {
      const motion = new OrbitMotion(parentObject.group, orbitalElements[moon.id], {
        equatorialTilt: parentObject.data.axialTilt * DEG, color: 0x3f5067, opacity: 0.16
      });
      this.orbitMotions.push(motion);
      this.orbits.push(motion.line);
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(moon.size, 20, 14),
        new THREE.MeshStandardMaterial({ map: makePlanetTexture(moon), roughness: 1 })
      );
      mesh.userData.bodyId = moon.id;
      motion.group.add(mesh);

      const data = { ...moon, type: 'moon', symbol: '\u25d0' };
      this.objects.set(moon.id, { data, group: motion.group, mesh, radius: moon.size, motion, parentObject });
      this.pickables.push(mesh);
    });
  }

  update(deltaDays) {
    if (!Number.isFinite(deltaDays) || !Number.isFinite(this.elapsedDays + deltaDays)) {
      throw new RangeError('Simulation time must remain finite');
    }
    if (deltaDays === 0) return;
    this.elapsedDays += deltaDays;
    for (const motion of this.orbitMotions) motion.update(this.elapsedDays);
    for (const object of this.objects.values()) {
      if (object.cometVisual) object.cometVisual.update(object.group.position);
      if (object.data.type === 'planet' || object.data.type === 'dwarf-planet') {
        const rotationPeriod = Math.abs(object.data.rotationDays) || 1;
        const direction = object.data.rotationDays < 0 ? -1 : 1;
        object.mesh.rotation.y += direction * (Math.PI * 2 / rotationPeriod) * deltaDays;
      } else if (object.data.type === 'star') {
        object.mesh.rotation.y += deltaDays * 0.03;
      }
    }
    for (const region of this.regions.values()) region.update(deltaDays);
  }

  select(id) {
    this.selectedId = id;
    this.selection.visible = !!this.getObject(id);
    this.loadTexture(id);
  }

  loadTexture(id) {
    if (this.loadedTextures.has(id)) return this.loadedTextures.get(id);
    if (!textureIds.has(id) || this.disposed) return;
    const request = new Promise(resolve => {
      this.textureLoader.load(import.meta.env.BASE_URL + 'textures/' + id + '.jpg', texture => {
        if (this.disposed) { texture.dispose(); resolve(false); return; }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
        const material = this.getObject(id).mesh.material;
        material.map?.dispose(); material.map = texture;
        material.color.setRGB(id === 'sun' ? 1.3 : 1, id === 'sun' ? 1.3 : 1, id === 'sun' ? 1.3 : 1);
        material.needsUpdate = true;
        resolve(true);
      }, undefined, () => {
        window.dispatchEvent(new CustomEvent('texture-fallback', { detail: id }));
        resolve(false);
      });
    });
    this.loadedTextures.set(id, request);
    return request;
  }

  updateDetail(camera) {
    this.background.update(camera);
    for (const id of textureIds) {
      if (this.loadedTextures.has(id)) continue;
      const object = this.objects.get(id);
      object.group.getWorldPosition(this.scratch);
      if (camera.position.distanceToSquared(this.scratch) < 4900) this.loadTexture(id);
    }
    if (this.selectedId) {
      const object = this.getObject(this.selectedId);
      object.group.getWorldPosition(this.selection.position);
      this.selection.scale.setScalar(object.radius * 1.09);
    }
  }

  clearance(position, resolve = false) {
    let nearest = Infinity;
    for (const object of this.objects.values()) {
      object.group.getWorldPosition(this.scratch);
      this.scratch.subVectors(position, this.scratch);
      const distance = this.scratch.length(), safe = object.radius + Math.max(.25, object.radius * .08);
      nearest = Math.min(nearest, distance - object.radius);
      if (resolve && distance < safe) {
        if (distance < .00001) this.scratch.set(0, 1, 0); else this.scratch.divideScalar(distance);
        position.addScaledVector(this.scratch, safe - distance);
      }
    }
    return nearest;
  }

  setQuality(quality) {
    this.effects.forEach(effect => { effect.visible = quality !== 'low'; });
    this.background.setQuality(quality);
    for (const region of this.regions.values()) region.setQuality(quality);
  }

  setRegionVisible(id, visible) {
    const region = this.regions.get(id);
    if (region) region.visible = !!visible;
  }

  dispose() {
    this.disposed = true;
    const textures = new Set(), materials = new Set(), geometries = new Set();
    this.scene.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) for (const material of [object.material].flat()) {
        materials.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
      }
    });
    textures.forEach(item => item.dispose()); materials.forEach(item => item.dispose()); geometries.forEach(item => item.dispose());
    this.scene.clear(); this.objects.clear(); this.pickables.length = 0;
    this.orbitMotions.length = 0; this.orbits.length = 0;
    this.regions.clear(); this.asteroidBelt = null;
  }

  setOrbitsVisible(visible) {
    this.orbitsVisible = visible;
    this.orbits.forEach((orbit) => { orbit.visible = visible; });
  }

  getObject(id) {
    return this.objects.get(id);
  }

  getWorldPosition(id, target = new THREE.Vector3()) {
    const object = this.objects.get(id);
    if (!object) return target.set(0, 0, 0);
    return object.group.getWorldPosition(target);
  }
}
