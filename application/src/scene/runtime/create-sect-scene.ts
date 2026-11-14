import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { SceneLifecycle, SceneProjection, SectScene } from './types';

interface SceneOptions {
  onSelectSession: (id: string) => void;
  onFocusIsland: (id: string) => void;
  onFailure: () => void;
}

const statusColor: Record<string, number> = { working: 0x78be92, awaiting_input: 0xd2a75c, idle: 0x9fae9f, interrupted: 0xc7786f, unknown: 0xa5aaa6 };
const areaSlots: Record<string, Array<[number, number]>> = {
  implementation: [[-.65, .18], [0, .18], [.65, .18], [-.25, .72]],
  research: [[-1.04, -.18], [-.55, -.34], [-.04, -.18]],
  testing: [[1.05, .24], [.57, .68], [1.36, -.3]],
  design: [[-.97, .46], [-1.32, -.3], [-.72, -.52]],
  council: [[.55, -.35], [.98, -.48], [1.32, .48]],
  rest: [[-.08, -.73], [.4, -.76], [-.48, -.76]],
};

function seeded(seed: number) {
  let value = seed >>> 0;
  return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; };
}

function islandPositions(total: number, aspect: number) {
  if (total <= 1) return [{ x: 0, y: 0, z: 0 }];
  if (aspect < 1.25) {
    if (total === 2) return [{ x: -4.4, y: 0, z: -2.8 }, { x: 4.4, y: .15, z: 2.8 }];
    if (total === 3) return [{ x: -4.6, y: 0, z: -2.8 }, { x: 4.6, y: .15, z: -2.8 }, { x: 0, y: -.1, z: 4.1 }];
    if (total === 4) return [
      { x: -9, y: 0, z: -3 }, { x: -3, y: .18, z: 3 },
      { x: 3, y: -.12, z: -3 }, { x: 9, y: .12, z: 3 },
    ];
  } else {
    if (total === 2) return [{ x: -5.5, y: 0, z: -1.7 }, { x: 5.5, y: .15, z: 1.7 }];
    if (total === 3) return [{ x: -7.2, y: 0, z: -1.8 }, { x: 0, y: .15, z: 1.8 }, { x: 7.2, y: -.1, z: -1.4 }];
    if (total === 4) return [
      { x: -8.2, y: 0, z: -2.1 }, { x: -2.75, y: .18, z: 2.1 },
      { x: 2.75, y: -.12, z: -2.1 }, { x: 8.2, y: .12, z: 2.1 },
    ];
  }
  const columns = 4;
  const rows = Math.ceil(total / columns);
  return Array.from({ length: total }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const inRow = Math.min(columns, total - row * columns);
    return {
      x: (column - (inRow - 1) / 2) * 7.2 + (row % 2 ? 3.6 : 0),
      y: (index % 3 - 1) * .16,
      z: (row - (rows - 1) / 2) * 6.4,
    };
  });
}

export function createSectScene(host: HTMLElement, options: SceneOptions): SectScene {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xc5d9d5, 22, 55);
  const camera = new THREE.OrthographicCamera(-12, 12, 7.2, -7.2, .1, 100);
  camera.position.set(0, 11, 21);
  camera.lookAt(0, .7, 0);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power', stencil: false, depth: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  host.replaceChildren(renderer.domElement);
  renderer.domElement.className = 'sect-webgl-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const hemi = new THREE.HemisphereLight(0xf7f7e9, 0x627766, 2.1);
  scene.add(hemi);
  const keyLight = new THREE.DirectionalLight(0xffecd0, 2.2);
  keyLight.position.set(-8, 15, 8);
  scene.add(keyLight);

  const ownedGeometries = new Set<THREE.BufferGeometry>();
  const ownedMaterials = new Set<THREE.Material>();
  const rayTargets: THREE.Object3D[] = [];
  const islandRayTargets: THREE.Object3D[] = [];
  const characterRayTargets: THREE.Object3D[] = [];
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const animationTargets: Array<{ breathGroup: THREE.Group; phase: number }> = [];
  const islandGroups = new Map<string, THREE.Group>();
  const sessionGroups = new Map<string, THREE.Group>();
  const boxGeometries = new Map<string, THREE.BoxGeometry>();
  const robeMaterials = new Map<string, THREE.MeshStandardMaterial>();
  const statusMaterials = new Map<string, THREE.MeshStandardMaterial>();
  const sessionNameplates = new Map<string, { material: THREE.SpriteMaterial; texture: THREE.CanvasTexture }>();
  let islandSignature = '';
  let projection: SceneProjection = { islands: [], agents: [], disciples: [], selectedSessionId: null };
  let lifecycle: SceneLifecycle = { active: true, motion: true, mode: 'full', quality: 'auto', theme: 'light' };
  let disposed = false;
  let dragX = 0;
  let downX = 0;

  const material = (color: number, roughness = .9, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
    const value = new THREE.MeshStandardMaterial({ color, roughness, ...extra });
    ownedMaterials.add(value);
    return value;
  };
  const makeGeometry = <T extends THREE.BufferGeometry>(geometry: T): T => { ownedGeometries.add(geometry); return geometry; };
  type GeometryPart = {
    geometry: THREE.BufferGeometry;
    position: [number, number, number];
    scale: [number, number, number];
    rotation?: [number, number, number];
  };
  const geometryTransform = new THREE.Object3D();
  const composeGeometry = (parts: GeometryPart[]) => {
    const transformed = parts.map(({ geometry, position, scale, rotation = [0, 0, 0] }) => {
      const copy = geometry.clone();
      geometryTransform.position.set(...position);
      geometryTransform.scale.set(...scale);
      geometryTransform.rotation.set(...rotation);
      geometryTransform.updateMatrix();
      copy.applyMatrix4(geometryTransform.matrix);
      return copy;
    });
    const combined = mergeGeometries(transformed, false);
    transformed.forEach((geometry) => geometry.dispose());
    if (!combined) throw new Error('Unable to compose shared disciple geometry');
    return makeGeometry(combined);
  };
  const discipleParts = {
    sphere: new THREE.SphereGeometry(1, 16, 12),
    leg: new THREE.CapsuleGeometry(.105, .23, 3, 7),
    torso: new THREE.CylinderGeometry(.19, .35, .42, 14, 1, false),
    sleeve: new THREE.CapsuleGeometry(.075, .16, 3, 7),
    belt: new THREE.BoxGeometry(1, 1, 1),
    eye: new THREE.TorusGeometry(.046, .008, 4, 12, Math.PI),
    mouth: new THREE.TorusGeometry(.025, .006, 4, 10, Math.PI),
  };
  const shared: Record<string, THREE.BufferGeometry> = {
    rock: makeGeometry(new THREE.DodecahedronGeometry(1, 0)),
    treeBall: makeGeometry(new THREE.IcosahedronGeometry(1, 1)),
    trunk: makeGeometry(new THREE.CylinderGeometry(.1, .15, 1, 7)),
    post: makeGeometry(new THREE.CylinderGeometry(.07, .08, 1, 7)),
    roof: makeGeometry(new THREE.ConeGeometry(1, .65, 4)),
    islandTop: makeGeometry(new THREE.CylinderGeometry(1.86, 1.66, .46, 48, 1, false)),
    islandKeel: makeGeometry(new THREE.ConeGeometry(1.25, 2.2, 8, 1, false)),
    path: makeGeometry(new THREE.BoxGeometry(.45, .055, .29)),
    meditationRobe: composeGeometry([
      { geometry: discipleParts.leg, position: [-.13, .3 - .52, .12], scale: [1.05, 1.05, .9], rotation: [0, -.22, Math.PI / 2] },
      { geometry: discipleParts.leg, position: [.13, .31 - .52, .02], scale: [1.05, 1.05, .9], rotation: [0, .22, Math.PI / 2] },
      { geometry: discipleParts.torso, position: [0, .6 - .52, 0], scale: [1, 1, 1] },
      { geometry: discipleParts.sleeve, position: [-.2, .6 - .52, .105], scale: [1, 1, 1], rotation: [0, 0, .88] },
      { geometry: discipleParts.sleeve, position: [.2, .6 - .52, .105], scale: [1, 1, 1], rotation: [0, 0, -.88] },
    ]),
    meditationAccent: composeGeometry([
      { geometry: discipleParts.belt, position: [0, .5 - .52, .27], scale: [.32, .055, .065] },
      { geometry: discipleParts.sphere, position: [0, .68 - .52, .255], scale: [.036, .036, .036] },
    ]),
    meditationSkin: composeGeometry([
      { geometry: discipleParts.sphere, position: [0, 1.04 - .52, 0], scale: [.29, .29, .29] },
      { geometry: discipleParts.sphere, position: [-.04, .55 - .52, .27], scale: [.065, .05, .045] },
      { geometry: discipleParts.sphere, position: [.04, .55 - .52, .27], scale: [.065, .05, .045] },
    ]),
    meditationHair: composeGeometry([
      { geometry: discipleParts.sphere, position: [0, 1.225 - .52, -.005], scale: [.29, .145, .29] },
      { geometry: discipleParts.sphere, position: [0, 1.405 - .52, -.018], scale: [.09, .09, .09] },
      { geometry: discipleParts.sphere, position: [-.222, 1.075 - .52, .015], scale: [.064, .122, .087] },
      { geometry: discipleParts.sphere, position: [.222, 1.075 - .52, .015], scale: [.064, .122, .087] },
    ]),
    meditationFace: composeGeometry([
      { geometry: discipleParts.eye, position: [-.082, 1.068 - .52, .282], scale: [1, 1, 1], rotation: [0, 0, Math.PI] },
      { geometry: discipleParts.eye, position: [.082, 1.068 - .52, .282], scale: [1, 1, 1] },
      { geometry: discipleParts.mouth, position: [0, .982 - .52, .288], scale: [1, 1, 1] },
    ]),
    statusDot: makeGeometry(new THREE.SphereGeometry(.075, 8, 6)),
    cloud: makeGeometry(new THREE.SphereGeometry(1, 12, 8)),
    flower: makeGeometry(new THREE.IcosahedronGeometry(.12, 0)),
  };
  Object.values(discipleParts).forEach((geometry) => geometry.dispose());
  const waterfallVertices: number[] = [];
  const waterfallIndices: number[] = [];
  const waterfallSegments = 16;
  for (let index = 0; index <= waterfallSegments; index++) {
    const t = index / waterfallSegments;
    const width = .25 * (1 - t * .55);
    const center = Math.sin(t * Math.PI * 1.45) * .12;
    const y = -2.8 * t;
    waterfallVertices.push(center - width / 2, y, 0, center + width / 2, y, 0);
    if (index < waterfallSegments) {
      const start = index * 2;
      waterfallIndices.push(start, start + 1, start + 2, start + 1, start + 3, start + 2);
    }
  }
  const waterfallGeometry = new THREE.BufferGeometry();
  waterfallGeometry.setAttribute('position', new THREE.Float32BufferAttribute(waterfallVertices, 3));
  waterfallGeometry.setIndex(waterfallIndices);
  waterfallGeometry.computeVertexNormals();
  makeGeometry(waterfallGeometry);
  const mats = {
    rock: material(0x728174), lowerRock: material(0x637469), meadow: material(0x8da57d), earth: material(0xb3ba95), path: material(0xd1c8a8),
    wood: material(0x746953), roof: material(0x547763), blossomRoof: material(0x937965), bambooRoof: material(0x547a6c),
    trunk: material(0x82785c), pine: material(0x728e72), pink: material(0xe0b8b1), bamboo: material(0x719276),
    cloud: material(0xffffff, 1, { transparent: true, opacity: .25, depthWrite: false }),
    waterfall: material(0x9ddbd6, .32, { transparent: true, opacity: .53, emissive: 0x75c5c5, emissiveIntensity: .16, side: THREE.DoubleSide, depthWrite: false }),
    stone: material(0x8cc7a8, .26, { metalness: .12, emissive: 0x255b43, emissiveIntensity: .18 }),
    robeAccent: material(0xe8d8b4), dark: material(0x333f38),
    skin: material(0xf0d7bd, .94), hair: material(0x3c302b, .88), faceInk: material(0x463832, .82),
  };
  const mesh = (geometry: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0) => {
    const object = new THREE.Mesh(geometry, mat);
    object.position.set(x, y, z);
    object.castShadow = false;
    object.receiveShadow = false;
    parent.add(object);
    return object;
  };
  const box = (w: number, h: number, d: number, mat: THREE.Material, parent: THREE.Object3D, x: number, y: number, z: number) => {
    const key = `${w}:${h}:${d}`;
    let geometry = boxGeometries.get(key);
    if (!geometry) { geometry = makeGeometry(new THREE.BoxGeometry(w, h, d)); boxGeometries.set(key, geometry); }
    return mesh(geometry, mat, parent, x, y, z);
  };

  type InstanceTransform = { x: number; y: number; z: number; sx: number; sy: number; sz: number; rx?: number; ry?: number; rz?: number };
  const instances = (geometry: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D, transforms: InstanceTransform[]) => {
    if (!transforms.length) return;
    const object = new THREE.InstancedMesh(geometry, mat, transforms.length);
    const dummy = new THREE.Object3D();
    transforms.forEach((transform, index) => {
      dummy.position.set(transform.x, transform.y, transform.z);
      dummy.rotation.set(transform.rx ?? 0, transform.ry ?? 0, transform.rz ?? 0);
      dummy.scale.set(transform.sx, transform.sy, transform.sz);
      dummy.updateMatrix();
      object.setMatrixAt(index, dummy.matrix);
    });
    object.instanceMatrix.needsUpdate = true;
    object.castShadow = false;
    object.receiveShadow = false;
    parent.add(object);
  };

  function createPavilion(group: THREE.Group, biome: string, index: number) {
    const building = new THREE.Group();
    building.position.set(index === 0 ? 0 : index === 1 ? -1.32 : 1.27, .28, index === 0 ? -.48 : .28);
    building.scale.setScalar(index === 0 ? .82 : .66);
    group.add(building);
    const roofMaterial = biome === 'blossom' ? mats.blossomRoof : biome === 'bamboo' ? mats.bambooRoof : mats.roof;
    box(1.12, .13, .84, mats.earth, building, 0, 0, 0);
    for (const x of [-.42, .42]) for (const z of [-.28, .28]) mesh(shared.post, mats.wood, building, x, .52, z).scale.y = .95;
    const ridge = box(1.36, .14, .17, mats.wood, building, 0, 1.04, 0);
    ridge.rotation.y = .12;
    for (const z of [-.43, .43]) {
      const roof = mesh(shared.roof, roofMaterial, building, 0, 1.18, z);
      roof.rotation.y = Math.PI / 4;
      roof.scale.set(1.05, .68, .67);
      const upturn = box(.1, .18, .1, roofMaterial, building, 0, 1.26, z * 1.26);
      upturn.rotation.x = -.28 * Math.sign(z);
      upturn.rotation.z = -.22 * Math.sign(z);
    }
    box(.72, .055, .68, mats.path, building, 0, .09, 0);
  }

  function createIsland(island: SceneProjection['islands'][number], index: number, total: number) {
    const group = new THREE.Group();
    group.userData.islandId = island.id;
    group.scale.setScalar(1.56);
    const aspect = Math.max(host.clientWidth, 1) / Math.max(host.clientHeight, 1);
    const position = islandPositions(total, aspect)[index];
    group.position.set(position.x, position.y, position.z);
    scene.add(group);
    islandGroups.set(island.id, group);
    const rand = seeded(island.layoutSeed);
    const land = mesh(shared.islandTop, mats.meadow, group, 0, 0, 0);
    land.userData.islandId = island.id;
    islandRayTargets.push(land);
    const keel = mesh(shared.islandKeel, mats.rock, group, 0, -.83, 0);
    keel.rotation.x = Math.PI;
    mesh(shared.rock, mats.lowerRock, group, -.8, -1.17, -.08).scale.set(.52, .56, .45);
    mesh(shared.rock, mats.lowerRock, group, .68, -1.05, .06).scale.set(.4, .53, .48);
    for (const [x, z, scale] of [[-1.05, .82, 1], [.95, 1.05, .76], [.65, -.9, .65]] as const) {
      const fall = mesh(waterfallGeometry, mats.waterfall, group, x, -.9, z);
      fall.scale.set(scale, 1, 1);
      fall.userData.islandId = island.id;
      islandRayTargets.push(fall);
    }
    for (const [x, z, sx, sz] of [[-.96, -.45, .62, .52], [.98, -.48, .55, .46], [0, 1.18, .48, .38]] as const) {
      const hill = mesh(shared.cloud, mats.meadow, group, x, .19, z);
      hill.scale.set(sx, .13, sz);
    }
    const edgeRocks: InstanceTransform[] = [];
    for (let n = 0; n < 11; n++) {
      const angle = n / 11 * Math.PI * 2;
      const radius = 1.67 + rand() * .32;
      const size = .14 + rand() * .18;
      edgeRocks.push({ x: Math.cos(angle) * radius, y: -.14, z: Math.sin(angle) * radius, sx: size * 1.25, sy: size, sz: size, ry: rand() * Math.PI });
    }
    instances(shared.rock, mats.rock, group, edgeRocks.filter((_, n) => n % 3 !== 0));
    instances(shared.rock, mats.lowerRock, group, edgeRocks.filter((_, n) => n % 3 === 0));
    const pathStones: InstanceTransform[] = [];
    for (let step = 0; step < 5; step++) {
      pathStones.push({ x: (rand() - .5) * .28, y: .246 + step * .004, z: .9 + step * .12, sx: 1, sy: 1, sz: 1, ry: (rand() - .5) * .14 });
    }
    instances(shared.path, mats.path, group, pathStones);
    createPavilion(group, island.biome, 0);
    createPavilion(group, island.biome, 1);
    createPavilion(group, island.biome, 2);
    const trunks: InstanceTransform[] = [];
    const canopy: InstanceTransform[] = [];
    const bambooStems: InstanceTransform[] = [];
    for (let tree = 0; tree < 12; tree++) {
      const angle = rand() * Math.PI * 2;
      const radius = .97 + rand() * .74;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const scale = .5 + rand() * .34;
      trunks.push({ x, y: .28 + .42 * scale, z, sx: scale, sy: .9 * scale, sz: scale });
      for (let tier = 0; tier < 3; tier++) {
        const offsetX = (rand() - .5) * .22;
        const offsetZ = (rand() - .5) * .18;
        const size = .35 - tier * .035;
        canopy.push({ x: x + offsetX * scale, y: .28 + (.79 + tier * .27) * scale, z: z + offsetZ * scale, sx: size * scale, sy: size * .9 * scale, sz: size * scale, ry: rand() * Math.PI });
      }
      if (island.biome === 'bamboo') for (let stem = 0; stem < 3; stem++) {
        bambooStems.push({ x: x + (stem - 1) * .17 * scale, y: .28 + .98 * scale, z: z + .06 * scale, sx: .47 * scale, sy: (1.35 + rand() * .3) * scale, sz: .47 * scale });
      }
    }
    instances(shared.trunk, mats.trunk, group, trunks);
    const foliage = island.biome === 'blossom' ? mats.pink : island.biome === 'bamboo' ? mats.bamboo : mats.pine;
    instances(shared.treeBall, foliage, group, canopy);
    instances(shared.post, mats.bamboo, group, bambooStems);
    const crystals: InstanceTransform[] = [];
    for (let stone = 0; stone < 4; stone++) {
      crystals.push({ x: -.78 + stone * .17, y: .4 + rand() * .14, z: .86 + (stone % 2) * .2, sx: .23, sy: .55 + rand() * .32, sz: .22, rz: (rand() - .5) * .25 });
    }
    instances(shared.flower, mats.stone, group, crystals);
    const clouds: InstanceTransform[] = [];
    for (let cloud = 0; cloud < 3; cloud++) {
      clouds.push({ x: (rand() - .5) * 4.7, y: .4 + rand() * .4, z: -1.7 + rand() * 3.4, sx: .95 + rand() * .3, sy: .24, sz: .45 });
    }
    instances(shared.cloud, mats.cloud, group, clouds);
    return group;
  }

  function createDisciple(disciple: SceneProjection['disciples'][number], color: string, index: number) {
    const group = new THREE.Group();
    group.userData.sessionId = disciple.sessionId;
    let robeMaterial = robeMaterials.get(color);
    if (!robeMaterial) { robeMaterial = material(new THREE.Color(color).getHex(), .83); robeMaterials.set(color, robeMaterial); }
    const breathGroup = new THREE.Group();
    breathGroup.position.y = .52;
    group.add(breathGroup);
    mesh(shared.meditationRobe, robeMaterial, breathGroup);
    mesh(shared.meditationAccent, mats.robeAccent, breathGroup);
    mesh(shared.meditationSkin, mats.skin, breathGroup);
    mesh(shared.meditationHair, mats.hair, breathGroup);
    mesh(shared.meditationFace, mats.faceInk, breathGroup);

    const colorKey = String(statusColor[disciple.status]);
    let statusMaterial = statusMaterials.get(colorKey);
    if (!statusMaterial) {
      statusMaterial = material(statusColor[disciple.status], .5, { emissive: statusColor[disciple.status], emissiveIntensity: .1 });
      statusMaterials.set(colorKey, statusMaterial);
    }
    const status = mesh(shared.statusDot, statusMaterial, group, .36, 1.18, .18);
    status.scale.setScalar(1.25);
    group.traverse((part) => {
      part.userData.sessionId = disciple.sessionId;
      part.userData.islandId = disciple.islandId;
    });
    const badge = makeNameplate(disciple.title, disciple.sessionId === projection.selectedSessionId, disciple.sessionId);
    badge.position.set(0, 1.68, 0);
    group.add(badge);
    const island = islandGroups.get(disciple.islandId);
    if (island) {
      const slots = areaSlots[disciple.areaId] ?? areaSlots.implementation;
      const [x, z] = slots[index % slots.length];
      group.position.set(x, .05, z + .34);
      island.add(group);
    }
    characterRayTargets.push(...group.children);
    if (disciple.status === 'working') animationTargets.push({ breathGroup, phase: index * .87 });
    sessionGroups.set(disciple.sessionId, group);
  }

  function makeNameplate(label: string, selected: boolean, sessionId: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 58;
    const context = canvas.getContext('2d');
    if (!context) return new THREE.Object3D();
    context.fillStyle = selected ? '#397a61' : '#faf8f1';
    context.beginPath();
    context.roundRect(4, 4, 248, 50, 16);
    context.fill();
    context.fillStyle = selected ? '#fff' : '#2c4138';
    context.font = '600 20px sans-serif';
    context.textAlign = 'center'; context.textBaseline = 'middle';
    context.fillText(label.slice(0, 20), 128, 30, 224);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false });
    ownedMaterials.add(mat);
    sessionNameplates.set(sessionId, { material: mat, texture });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.55, .34, 1);
    sprite.userData.nameplate = true;
    return sprite;
  }

  function rebuild(projectionValue: SceneProjection) {
    projection = projectionValue;
    const orderedIslands = [...projection.islands].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
    const nextIslandSignature = JSON.stringify(orderedIslands.map(({ id, biome, layoutSeed, order }) => [id, biome, layoutSeed, order]));
    if (nextIslandSignature !== islandSignature) {
      for (const island of islandGroups.values()) scene.remove(island);
      islandGroups.clear();
      islandRayTargets.length = 0;
      orderedIslands.forEach((island, index) => createIsland(island, index, orderedIslands.length));
      islandSignature = nextIslandSignature;
    } else {
      const aspect = Math.max(host.clientWidth, 1) / Math.max(host.clientHeight, 1);
      const positions = islandPositions(orderedIslands.length, aspect);
      orderedIslands.forEach((island, index) => {
        const group = islandGroups.get(island.id);
        if (group) group.position.set(positions[index].x, positions[index].y, positions[index].z);
      });
    }
    for (const [sessionId, group] of sessionGroups) {
      group.removeFromParent();
      const nameplate = sessionNameplates.get(sessionId);
      if (nameplate) {
        nameplate.texture.dispose();
        nameplate.material.dispose();
        ownedMaterials.delete(nameplate.material);
        sessionNameplates.delete(sessionId);
      }
    }
    sessionGroups.clear();
    characterRayTargets.length = 0;
    animationTargets.length = 0;
    const ownerById = new Map(projection.agents.map((agent) => [agent.id, agent]));
    const ranked = [...projection.disciples].sort((a, b) => {
      const order = { working: 0, awaiting_input: 1, interrupted: 2, idle: 3, unknown: 4 };
      return (a.sessionId === projection.selectedSessionId ? -2 : 0) - (b.sessionId === projection.selectedSessionId ? -2 : 0)
        || order[a.status] - order[b.status] || a.sessionId.localeCompare(b.sessionId);
    }).slice(0, 24);
    const slotsByIsland = new Map<string, number>();
    ranked.forEach((session) => {
      const agent = ownerById.get(session.agentId);
      if (!agent) return;
      const index = slotsByIsland.get(session.islandId) ?? 0;
      slotsByIsland.set(session.islandId, index + 1);
      createDisciple(session, agent.robeColor, index);
    });
    rayTargets.splice(0, rayTargets.length, ...islandRayTargets, ...characterRayTargets);
    camera.updateProjectionMatrix();
    invalidate();
  }

  function resize() {
    if (disposed) return;
    const width = Math.max(host.clientWidth, 1);
    const height = Math.max(host.clientHeight, 1);
    const mode = width < 560 ? 'compact' : 'full';
    if (lifecycle.mode !== mode) lifecycle = { ...lifecycle, mode };
    const aspect = width / height;
    const qualityCap = lifecycle.quality === 'low' || autoDowngraded || lifecycle.mode === 'compact' ? 1 : 1.5;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, qualityCap));
    renderer.setSize(width, height, false);
    const baseScale = aspect < 1.2 ? 8.8 : aspect < 1.55 ? 8.1 : 7.5;
    const positions = islandPositions(projection.islands.length, aspect);
    const worldWidth = positions.length ? Math.max(...positions.map(({ x }) => x)) - Math.min(...positions.map(({ x }) => x)) + 9 : 9;
    const worldDepth = positions.length ? Math.max(...positions.map(({ z }) => z)) - Math.min(...positions.map(({ z }) => z)) : 0;
    const worldHeight = worldDepth * .46 + 9;
    const scale = Math.max(baseScale, worldHeight / 2, worldWidth / (2 * aspect) * 1.04);
    camera.left = -scale * aspect;
    camera.right = scale * aspect;
    camera.top = scale;
    camera.bottom = -scale;
    camera.position.x = dragX;
    camera.updateProjectionMatrix();
    invalidate();
  }

  let raf = 0;
  let lastFrame = 0;
  let dirty = true;
  let clock = 0;
  let qualitySamples: number[] = [];
  let slowSince: number | null = null;
  let autoDowngraded = false;
  function invalidate() { dirty = true; if (lifecycle.active) requestRender(); }
  function requestRender() { if (!raf && lifecycle.active && !disposed && (dirty || (lifecycle.motion && animationTargets.length > 0))) raf = requestAnimationFrame(draw); }
  function draw(now: number) {
    raf = 0;
    if (disposed || !lifecycle.active) return;
    const fps = lifecycle.mode === 'compact' ? 15 : 30;
    const minFrame = 1000 / fps;
    if (lifecycle.motion && now - lastFrame < minFrame - 1) { requestRender(); return; }
    const elapsed = Math.min(now - lastFrame, minFrame);
    lastFrame = now;
    if (lifecycle.motion) {
      clock += elapsed / 1000;
      for (const target of animationTargets) target.breathGroup.scale.y = 1 + Math.sin(clock * 1.4 + target.phase) * .012;
    }
    if (dirty || lifecycle.motion) {
      const renderStarted = performance.now();
      renderer.render(scene, camera);
      const renderCost = performance.now() - renderStarted;
      dirty = false;
      if (lifecycle.quality === 'auto' && !autoDowngraded) {
        qualitySamples.push(renderCost);
        if (qualitySamples.length > 30) qualitySamples.shift();
        if (qualitySamples.length === 30) {
          const sorted = [...qualitySamples].sort((a, b) => a - b);
          const p95 = sorted[Math.ceil(sorted.length * .95) - 1];
          if (p95 > 33) {
            slowSince ??= now;
            if (now - slowSince >= 10_000) { autoDowngraded = true; resize(); }
          } else slowSince = null;
        }
      }
    }
    if (lifecycle.motion && animationTargets.length > 0) requestRender();
  }

  function setLifecycle(value: SceneLifecycle) {
    if (lifecycle.quality !== value.quality) {
      qualitySamples = [];
      slowSince = null;
      autoDowngraded = false;
    }
    lifecycle = value;
    scene.background = null;
    const dark = value.theme === 'dark';
    scene.fog!.color.set(dark ? 0x355467 : 0xc5d9d5);
    hemi.intensity = dark ? 1.35 : 2.1;
    keyLight.intensity = dark ? 1.05 : 2.2;
    renderer.toneMappingExposure = dark ? .98 : 1.12;
    if (!value.motion) animationTargets.forEach((target) => { target.breathGroup.scale.y = 1; });
    if (!value.active || !value.motion) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      lastFrame = 0;
    }
    resize();
    if (value.active) requestRender();
  }

  function onPointerDown(event: PointerEvent) { downX = event.clientX; }
  function onPointerUp(event: PointerEvent) {
    if (Math.abs(event.clientX - downX) > 8) {
      dragX = THREE.MathUtils.clamp(dragX - (event.clientX - downX) * .015, -5, 5);
      camera.position.x = dragX; camera.updateProjectionMatrix(); invalidate(); return;
    }
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(rayTargets, true)[0];
    if (!hit) return;
    let object: THREE.Object3D | null = hit.object;
    while (object) {
      const sessionId = object.userData.sessionId as string | undefined;
      const islandId = object.userData.islandId as string | undefined;
      if (sessionId) { options.onSelectSession(sessionId); return; }
      if (islandId) { options.onFocusIsland(islandId); return; }
      object = object.parent;
    }
  }
  function onWheel(event: WheelEvent) {
    event.preventDefault();
    const factor = Math.exp(event.deltaY * .0007);
    camera.zoom = THREE.MathUtils.clamp(camera.zoom / factor, .82, 1.35);
    camera.updateProjectionMatrix(); invalidate();
  }
  const onCameraReset = () => {
    dragX = 0;
    camera.position.x = 0;
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    invalidate();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointerup', onPointerUp);
  renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('cloudsect:camera-reset', onCameraReset);

  try { rebuild(projection); resize(); }
  catch { options.onFailure(); }

  return {
    update: rebuild,
    setLifecycle,
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('cloudsect:camera-reset', onCameraReset);
      for (const nameplate of sessionNameplates.values()) nameplate.texture.dispose();
      for (const mat of ownedMaterials) {
        mat.dispose();
      }
      for (const geometry of ownedGeometries) geometry.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
