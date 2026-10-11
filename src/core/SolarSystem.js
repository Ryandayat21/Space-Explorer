import * as THREE from 'three';
import { bodies, moons, orbitRadiusFromAu, visualRadiusFromEarth } from '../data/celestialBodies.js';

const DEG = Math.PI / 180;

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
  return new THREE.CanvasTexture(canvas);
}

function createOrbitLine(radius, eccentricity = 0, color = 0x315177) {
  const points = [];
  for (let i = 0; i <= 160; i += 1) {
    const angle = (i / 160) * Math.PI * 2;
    const x = radius * (Math.cos(angle) - eccentricity);
    const z = radius * Math.sqrt(1 - eccentricity * eccentricity) * Math.sin(angle);
    points.push(new THREE.Vector3(x, 0, z));
  }
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.28, depthWrite: false })
  );
}

export class SolarSystem {
  constructor(scene) {
    this.scene = scene;
    this.objects = new Map();
    this.pickables = [];
    this.orbits = [];
    this.moonSystems = [];
    this.elapsedDays = 0;
    this.orbitsVisible = true;

    this.root = new THREE.Group();
    this.root.rotation.x = -2.5 * DEG;
    scene.add(this.root);

    this.#createLighting();
    this.#createStarfield();
    this.#createSun();
    this.#createPlanets();
    this.#createAsteroidBelt();
  }

  #createLighting() {
    this.scene.add(new THREE.HemisphereLight(0x18284e, 0x020204, 0.22));
    const sunLight = new THREE.PointLight(0xffefcb, 6200, 0, 1.65);
    sunLight.position.set(0, 0, 0);
    this.root.add(sunLight);
  }

  #createStarfield() {
    const count = 9000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const random = seededRandom(42042);
    const color = new THREE.Color();
    for (let i = 0; i < count; i += 1) {
      const radius = 450 + random() * 850;
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      color.setHSL(0.52 + random() * 0.14, 0.25 + random() * 0.4, 0.58 + random() * 0.38);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const stars = new THREE.Points(geometry, new THREE.PointsMaterial({ size: 1.15, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.88, depthWrite: false }));
    this.scene.add(stars);

    const haze = new THREE.Mesh(
      new THREE.SphereGeometry(1000, 48, 32),
      new THREE.MeshBasicMaterial({ color: 0x07112b, side: THREE.BackSide, transparent: true, opacity: 0.32 })
    );
    this.scene.add(haze);
  }

  #createSun() {
    const data = bodies[0];
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(data.visualRadius, 64, 40),
      new THREE.MeshBasicMaterial({ map: makeSunTexture(), color: 0xffd073 })
    );
    mesh.userData.bodyId = data.id;
    group.add(mesh);

    const glowMaterial = new THREE.SpriteMaterial({ map: makeGlowTexture(), color: 0xff9b38, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const glow = new THREE.Sprite(glowMaterial);
    glow.scale.set(32, 32, 1);
    group.add(glow);

    const corona = new THREE.Mesh(
      new THREE.SphereGeometry(data.visualRadius * 1.08, 48, 32),
      new THREE.MeshBasicMaterial({ color: 0xffb140, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, side: THREE.BackSide })
    );
    group.add(corona);

    this.root.add(group);
    this.objects.set(data.id, { data, group, mesh, radius: data.visualRadius, pivot: null });
    this.pickables.push(mesh);
  }

  #createPlanets() {
    for (const data of bodies.slice(1)) {
      const orbitRadius = orbitRadiusFromAu(data.orbitAu);
      const radius = visualRadiusFromEarth(data.radiusEarth);
      const pivot = new THREE.Group();
      pivot.rotation.y = this.#initialAngle(data.id);
      this.root.add(pivot);

      // Orbit visual uses a circle in the MVP. Eccentric orbits are planned for
      // the scientific-scale mode so the rendered line and movement stay aligned.
      const orbit = createOrbitLine(orbitRadius);
      this.root.add(orbit);
      this.orbits.push(orbit);

      const group = new THREE.Group();
      group.position.x = orbitRadius * (1 - data.eccentricity);
      group.rotation.z = data.axialTilt * DEG;
      pivot.add(group);

      const material = new THREE.MeshStandardMaterial({
        map: makePlanetTexture(data),
        color: 0xffffff,
        roughness: data.id === 'earth' ? 0.74 : 0.9,
        metalness: 0
      });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), material);
      mesh.userData.bodyId = data.id;
      group.add(mesh);

      if (['earth', 'venus', 'uranus', 'neptune'].includes(data.id)) {
        const atmosphereColor = data.id === 'earth' ? 0x4ca6ff : data.id === 'venus' ? 0xffc779 : data.id === 'uranus' ? 0x7df0ff : 0x376dff;
        const atmosphere = new THREE.Mesh(
          new THREE.SphereGeometry(radius * 1.045, 40, 28),
          new THREE.MeshBasicMaterial({ color: atmosphereColor, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, side: THREE.BackSide })
        );
        group.add(atmosphere);
      }

      if (data.rings) this.#addRings(group, radius, data.id);

      const object = { data, group, mesh, radius, pivot, orbitRadius };
      this.objects.set(data.id, object);
      this.pickables.push(mesh);
      this.#createMoonsForPlanet(object);
    }
  }

  #addRings(group, radius, planetId) {
    const outer = planetId === 'saturn' ? radius * 2.05 : radius * 1.62;
    const inner = planetId === 'saturn' ? radius * 1.25 : radius * 1.25;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(inner, outer, 96),
      new THREE.MeshBasicMaterial({
        color: planetId === 'saturn' ? 0xd5c393 : 0x8bcbd0,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: planetId === 'saturn' ? 0.6 : 0.28,
        depthWrite: false
      })
    );
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
  }

  #createMoonsForPlanet(parentObject) {
    const planetMoons = moons.filter((moon) => moon.parent === parentObject.data.id);
    planetMoons.forEach((moon, index) => {
      const pivot = new THREE.Group();
      pivot.rotation.y = (index / Math.max(planetMoons.length, 1)) * Math.PI * 2;
      parentObject.group.add(pivot);

      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(moon.size, 20, 14),
        new THREE.MeshStandardMaterial({ color: moon.color, roughness: 1 })
      );
      mesh.position.x = moon.distance;
      mesh.userData.bodyId = moon.id;
      pivot.add(mesh);

      const orbit = createOrbitLine(moon.distance, 0, 0x3f5067);
      orbit.material.opacity = 0.16;
      parentObject.group.add(orbit);
      this.orbits.push(orbit);

      const data = {
        ...moon,
        type: 'moon', symbol: '◐', radiusKm: '—', mass: '—', gravity: '—', temperature: '—',
        distance: `Mengorbit ${parentObject.data.name}`, rotation: 'Terkunci pasang surut', orbitPeriod: `${Math.abs(moon.period)} hari`, moons: '—',
        description: `${moon.name} adalah salah satu satelit alami utama ${parentObject.data.name}. Detail ilmiah lengkap akan ditambahkan pada fase konten berikutnya.`,
        fact: `Bulan ini mengelilingi ${parentObject.data.name} dalam sekitar ${Math.abs(moon.period)} hari.`
      };
      this.objects.set(moon.id, { data, group: mesh, mesh, radius: moon.size, pivot, parentObject });
      this.pickables.push(mesh);
      this.moonSystems.push({ pivot, period: moon.period });
    });
  }

  #createAsteroidBelt() {
    const count = 1900;
    const positions = new Float32Array(count * 3);
    const random = seededRandom(81517);
    const inner = orbitRadiusFromAu(2.1);
    const outer = orbitRadiusFromAu(3.25);
    for (let i = 0; i < count; i += 1) {
      const angle = random() * Math.PI * 2;
      const radius = inner + random() * (outer - inner);
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (random() - 0.5) * 2.1;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const belt = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0x7f8793, size: 0.18, transparent: true, opacity: 0.48, depthWrite: false }));
    this.root.add(belt);
    this.asteroidBelt = belt;
  }

  #initialAngle(id) {
    return [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) * 0.13;
  }

  update(deltaDays, realDelta) {
    this.elapsedDays += deltaDays;
    for (const object of this.objects.values()) {
      if (object.data.type === 'planet') {
        object.pivot.rotation.y += (Math.PI * 2 / object.data.orbitalPeriodDays) * deltaDays;
        const rotationPeriod = Math.abs(object.data.rotationDays) || 1;
        const direction = object.data.rotationDays < 0 ? -1 : 1;
        object.mesh.rotation.y += direction * (Math.PI * 2 / rotationPeriod) * deltaDays;
      } else if (object.data.type === 'star') {
        object.mesh.rotation.y += realDelta * 0.03;
      }
    }
    for (const moon of this.moonSystems) {
      const direction = moon.period < 0 ? -1 : 1;
      moon.pivot.rotation.y += direction * (Math.PI * 2 / Math.abs(moon.period)) * deltaDays;
    }
    if (this.asteroidBelt) this.asteroidBelt.rotation.y += realDelta * 0.002;
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
