// =============================================================================
// src/main.js — 3D Scene, Expanded Bedroom (8.8m x 8.8m), Pink Walls & Lighting
// "Side B" — Emotional Detective Game
// =============================================================================

import { createStoryController, state } from './story.js';
import { playFootstep, updateProximityShimmer } from './audio.js';
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ---------------------------------------------------------------------------
// 1. SCENE, CAMERA & RENDERER SETUP
// ---------------------------------------------------------------------------
const scene = new THREE.Scene();

// Bright, warm, inviting room atmosphere (soft dusk-rose tones)
const initialBgColor = new THREE.Color(0xf6e6ea);
scene.background = initialBgColor.clone();
scene.fog = new THREE.FogExp2(0xf6e6ea, 0.022);

const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.05, 100);
camera.position.set(0, 1.6, 2.8); // Charlie's eye height (1.6m) looking into room

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

// ---------------------------------------------------------------------------
// 2. BRIGHT WARM LIGHTING SETUP (Cozy, Clear & Well-Lit)
// ---------------------------------------------------------------------------

// A. Bright Hemisphere Light (Warm white ceiling bounce + soft rosy floor bounce)
const hemiLight = new THREE.HemisphereLight(0xfff5ee, 0xd8b4b8, 1.35);
scene.add(hemiLight);

// B. Warm sunlight streaming through window.glb (Z = -4.35)
const sunLight = new THREE.DirectionalLight(0xfff0dd, 1.6);
sunLight.position.set(2.5, 6.0, -9.0);
sunLight.target.position.set(-0.5, 1.0, 0.0);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 24;
sunLight.shadow.camera.left = -6.0;
sunLight.shadow.camera.right = 6.0;
sunLight.shadow.camera.top = 5.0;
sunLight.shadow.camera.bottom = -5.0;
sunLight.shadow.bias = -0.0004;
scene.add(sunLight);
scene.add(sunLight.target);

// C. Warm amber desk lamp PointLight over desk.glb
const deskLight = new THREE.PointLight(0xffbe7b, 4.2, 9.0, 1.6);
deskLight.position.set(-2.2, 1.85, -3.7);
deskLight.castShadow = true;
deskLight.shadow.mapSize.width = 1024;
deskLight.shadow.mapSize.height = 1024;
deskLight.shadow.bias = -0.001;
scene.add(deskLight);

// D. Warm cozy floor-lamp PointLight next to standing-lamp.glb
const floorLampLight = new THREE.PointLight(0xffe4b8, 3.8, 9.5, 1.6);
floorLampLight.position.set(3.7, 1.65, -3.7);
floorLampLight.castShadow = true;
floorLampLight.shadow.mapSize.width = 1024;
floorLampLight.shadow.mapSize.height = 1024;
scene.add(floorLampLight);

// E. Translucent warm morning sky pane outside window
const skyPaneGeo = new THREE.PlaneGeometry(2.4, 2.0);
const skyPaneMat = new THREE.MeshBasicMaterial({
  color: 0xffedd8,
  transparent: true,
  opacity: 0.9,
  side: THREE.DoubleSide,
});
const skyPane = new THREE.Mesh(skyPaneGeo, skyPaneMat);
skyPane.position.set(0, 1.5, -4.42);
scene.add(skyPane);

const windowBacklight = new THREE.PointLight(0xffdfb8, 1.8, 7, 1.8);
windowBacklight.position.set(0, 1.6, -4.8);
scene.add(windowBacklight);

// ---------------------------------------------------------------------------
// 3. EXPANDED ROOM ARCHITECTURE (8.8m x 8.8m x 3.2m)
// ---------------------------------------------------------------------------
// Soft, cozy light pink interior walls (#f3cfd6) with cream baseboards (#f7f3eb)
const ROOM_SIZE = 8.8;
const HALF_ROOM = ROOM_SIZE / 2; // 4.4m
const ROOM_HEIGHT = 3.2;

const wallMat = new THREE.MeshStandardMaterial({
  color: 0xf3cfd6, // Light pink
  roughness: 0.86,
  metalness: 0.02,
});

const baseboardMat = new THREE.MeshStandardMaterial({
  color: 0xf7f3eb, // Clean cream/white
  roughness: 0.65,
  metalness: 0.05,
});

function createWall(width, height, position, rotationY) {
  const wallGeo = new THREE.PlaneGeometry(width, height);
  const wallMesh = new THREE.Mesh(wallGeo, wallMat);
  wallMesh.position.set(...position);
  wallMesh.rotation.y = rotationY;
  wallMesh.receiveShadow = true;
  scene.add(wallMesh);

  // Baseboard along bottom
  const bbHeight = 0.15;
  const bbDepth = 0.04;
  const bbGeo = new THREE.BoxGeometry(width, bbHeight, bbDepth);
  const bbMesh = new THREE.Mesh(bbGeo, baseboardMat);

  const normalOffset = 0.02;
  const bbX = position[0] + Math.sin(rotationY) * normalOffset;
  const bbZ = position[2] + Math.cos(rotationY) * normalOffset;
  bbMesh.position.set(bbX, bbHeight / 2, bbZ);
  bbMesh.rotation.y = rotationY;
  bbMesh.receiveShadow = true;
  scene.add(bbMesh);
}

// 4 Enclosing Walls around [-4.4, +4.4]
createWall(ROOM_SIZE, ROOM_HEIGHT, [0, ROOM_HEIGHT / 2, -HALF_ROOM], 0);             // Back
createWall(ROOM_SIZE, ROOM_HEIGHT, [0, ROOM_HEIGHT / 2, HALF_ROOM], Math.PI);        // Front
createWall(ROOM_SIZE, ROOM_HEIGHT, [-HALF_ROOM, ROOM_HEIGHT / 2, 0], Math.PI / 2);   // Left
createWall(ROOM_SIZE, ROOM_HEIGHT, [HALF_ROOM, ROOM_HEIGHT / 2, 0], -Math.PI / 2);  // Right

// Ceiling at Y = 3.2m (clean warm off-white)
const ceilingGeo = new THREE.PlaneGeometry(ROOM_SIZE, ROOM_SIZE);
const ceilingMat = new THREE.MeshStandardMaterial({
  color: 0xfaf7f2,
  roughness: 0.92,
  metalness: 0.01,
});
const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
ceilingMesh.position.set(0, ROOM_HEIGHT, 0);
ceilingMesh.rotation.x = Math.PI / 2;
ceilingMesh.receiveShadow = true;
scene.add(ceilingMesh);

// ---------------------------------------------------------------------------
// 4. FLOATING DUST MOTES IN DESK & FLOOR LAMP LIGHT
// ---------------------------------------------------------------------------
const MOTE_COUNT = 90;
const moteGeo = new THREE.BufferGeometry();
const motePositions = new Float32Array(MOTE_COUNT * 3);
const moteVelocities = [];

for (let i = 0; i < MOTE_COUNT; i++) {
  motePositions[i * 3 + 0] = -2.9 + Math.random() * 1.5;
  motePositions[i * 3 + 1] = 0.8 + Math.random() * 1.5;
  motePositions[i * 3 + 2] = -4.2 + Math.random() * 1.3;

  moteVelocities.push({
    vy: 0.035 + Math.random() * 0.05,
    driftX: (Math.random() - 0.5) * 0.025,
    driftZ: (Math.random() - 0.5) * 0.025,
    phase: Math.random() * Math.PI * 2,
  });
}

moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
const moteMat = new THREE.PointsMaterial({
  color: 0xffdfb8,
  size: 0.022,
  transparent: true,
  opacity: 0.5,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
const dustMotes = new THREE.Points(moteGeo, moteMat);
scene.add(dustMotes);

// ---------------------------------------------------------------------------
// 5. FIRST-PERSON CONTROLS & HUD
// ---------------------------------------------------------------------------
const controls = new PointerLockControls(camera, document.body);
const overlay = document.getElementById('start-overlay');
const crosshair = document.getElementById('crosshair');
const promptEl = document.getElementById('prompt');

controls.addEventListener('lock', () => {
  if (overlay) overlay.style.display = 'none';
});

controls.addEventListener('unlock', () => {
  // Never re-display the title screen when intro, UI modals, or gameplay is active
  if (!state.inIntro && !state.activeModal && !state.gameCompleted) {
    // Esc was pressed during gameplay: cursor is freed, canvas click resumes lock
  }
});

// Clicking the canvas during gameplay re-engages pointer lock
renderer.domElement.addEventListener('click', () => {
  if (!state.inIntro && !state.activeModal && !state.gameCompleted && !controls.isLocked) {
    controls.lock();
  }
});

const keys = {};
window.addEventListener('keydown', (e) => (keys[e.code] = true));
window.addEventListener('keyup', (e) => (keys[e.code] = false));

// ---------------------------------------------------------------------------
// 6. ENDING LIGHTING TRANSITION SETUP
// ---------------------------------------------------------------------------
let endingTransition = {
  active: false,
  progress: 0,
  duration: 4.0,
};

const tapeModels = {
  1: null,
  2: null,
};

const story = createStoryController({
  controls,
  camera,
  scene,
  onEndingLighting: () => {
    endingTransition.active = true;
    endingTransition.progress = 0;
  },
  onTapePickedUp: (tapeNum) => {
    if (tapeModels[tapeNum]) {
      tapeModels[tapeNum].visible = false;
      const clue = `pickup_tape_${tapeNum}`;
      for (let i = interactables.length - 1; i >= 0; i--) {
        if (interactables[i].userData.clueId === clue) {
          interactables.splice(i, 1);
        }
      }
      clearHoverHighlights();
    }
  },
});

window.__storyController = story;
window.__gameState = state;

// ---------------------------------------------------------------------------
// 7. GLTF MODEL LOADER & BOUNDS NORMALIZATION
// ---------------------------------------------------------------------------
const loader = new GLTFLoader();
const interactables = [];
let ceilingFanModel = null;
const collisionObstacles = [];

function getCluePrompt(clueId) {
  switch (clueId) {
    case 'pickup_tape_1':
      return "[E] Pick Up Tape 1 (Roommate Intro)";
    case 'pickup_tape_2':
      return "[E] Pick Up Tape 2 (Midnight Guitar)";
    case 'pickup_tape_3':
      return "[E] Pick Up Tape 3 (Sunday Drive)";
    case 'notepad':
      return "[E] Read Kim's Notepad Entry";
    case 'tape_player':
      if (state.boxUnlocked && !state.gameCompleted) {
        return "[E] Press Record (Side B)";
      }
      return "[E] Play Kim's Cassette Player";
    case 'cassette':
      return "[E] Inspect Kim's Cassette";
    case 'keepsake_box':
      if (state.boxUnlocked) return "[E] Open Keepsake Box";
      return "[E] Inspect Keepsake Box (Padlocked)";
    case 'trash_can':
      return "[E] Inspect Wastebasket";
    case 'guitar':
      return "[E] Inspect Kim's Guitar";
    case 'songbook':
      return "[E] Inspect Songbook Chords";
    case 'polaroids':
      return "[E] Inspect Faded Polaroids";
    case 'camera':
      return "[E] Inspect Kim's Camera";
    case 'board':
      return "[E] Open Detective Board";
    case 'standing_lamp':
      return "[E] Look at Corner Lamp";
    case 'bed':
      return "[E] Look at Kim's Bed";
    case 'chair':
      return "[E] Look at Desk Chair";
    case 'closet':
      return "[E] Inspect Wardrobe";
    case 'door':
      return "[E] Look at Bedroom Door";
    case 'mug':
      return state.hasClosetKey ? "[E] Inspect Kim's Tea Mug" : "[E] Search Kim's Tea Mug";
    case 'trash_can':
      return state.cardPuzzleSolved ? "[E] Examine Wastebasket" : "[E] Search Wastebasket (Torn Card)";
    case 'cardboard_boxes':
      return "[E] Inspect Dorm Packing Boxes";
    default:
      return `[E] Inspect (${clueId})`;
  }
}

/**
 * Normalizing GLB loader using container wrapper for bottom-center origin & in-place rotation
 */
function loadModel(filename, { pos = [0, 0, 0], size = 1, rotX = 0, rotY = 0, rotZ = 0, clueId = null, solid = false } = {}) {
  return new Promise((resolve, reject) => {
    loader.load(
      `./public/models/${filename}`,
      (gltf) => {
        const rawModel = gltf.scene;

        const rawBox = new THREE.Box3().setFromObject(rawModel);
        const rawSize = new THREE.Vector3();
        rawBox.getSize(rawSize);
        const rawCenter = new THREE.Vector3();
        rawBox.getCenter(rawCenter);

        const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z);
        const scale = size / (maxDim || 1);
        rawModel.scale.setScalar(scale);

        const wrapper = new THREE.Group();
        rawModel.position.set(-rawCenter.x * scale, -rawBox.min.y * scale, -rawCenter.z * scale);
        wrapper.add(rawModel);

        wrapper.rotation.set(
          THREE.MathUtils.degToRad(rotX),
          THREE.MathUtils.degToRad(rotY),
          THREE.MathUtils.degToRad(rotZ)
        );
        wrapper.position.set(pos[0], pos[1], pos[2]);

        wrapper.updateMatrixWorld(true);
        // Guarantee the bottom of the object rests exactly at pos[1] regardless of rotation
        const preBox = new THREE.Box3().setFromObject(wrapper);
        const yOffset = pos[1] - preBox.min.y;
        wrapper.position.y += yOffset;
        wrapper.updateMatrixWorld(true);
        const finalBox = new THREE.Box3().setFromObject(wrapper);

        wrapper.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.material) {
              if (Array.isArray(child.material)) {
                child.userData.origEmissives = child.material.map((m) =>
                  m.emissive ? m.emissive.clone() : new THREE.Color(0, 0, 0)
                );
              } else if (child.material.emissive) {
                child.userData.origEmissive = child.material.emissive.clone();
              }
            }

            if (clueId) {
              child.userData.clueId = clueId;
              child.userData.rootModel = wrapper;
              interactables.push(child);
            }
          }
        });

        scene.add(wrapper);

        if (solid) {
          collisionObstacles.push({
            name: filename,
            minX: finalBox.min.x - 0.08,
            maxX: finalBox.max.x + 0.08,
            minZ: finalBox.min.z - 0.08,
            maxZ: finalBox.max.z + 0.08,
          });
        }

        resolve({ model: wrapper, finalBox });
      },
      undefined,
      (err) => {
        console.error(`Failed to load ./public/models/${filename}:`, err);
        reject(err);
      }
    );
  });
}

// ---------------------------------------------------------------------------
// 8. ALL 22 MODELS LOADING PIPELINE & SMART SURFACE HEIGHTS
// ---------------------------------------------------------------------------
async function initModels() {
  // 1. Floor: Expanded to 8.8m
  await loadModel('floor.glb', { pos: [0, 0, 0], size: ROOM_SIZE });

  // 2. Bed: Flipped 180 degrees (rotY: 90) so headboard sits flush against wall & faces into room
  loadModel('bed.glb', {
    pos: [2.85, 0, -1.8],
    size: 2.3,
    rotY: 90, // FLIPPED 180 DEG from previous -90
    clueId: 'bed',
    solid: true,
  });

  // 3. Night-stand: placed next to headboard of bed
  const nightstandPos = [2.85, 0, -3.3];
  const nightstandResult = await loadModel('night-stand.glb', {
    pos: nightstandPos,
    size: 0.72,
    solid: true,
  });
  const nightstandTopY = nightstandResult.finalBox.max.y;

  // 4. Notepad: resting cleanly on top of night-stand.glb
  loadModel('notepad.glb', {
    pos: [nightstandPos[0], nightstandTopY, nightstandPos[2]],
    size: 0.28,
    rotZ: 90,
    rotY: -15,
    clueId: 'notepad',
  });

  // 5. Standing lamp: bedroom corner near bed
  loadModel('standing-lamp.glb', {
    pos: [3.7, 0, -3.7],
    size: 1.65,
    clueId: 'standing_lamp',
    solid: true,
  });

  // 6. Wall architectural items
  loadModel('window.glb', { pos: [0, 1.45, -4.35], size: 1.8 });
  loadModel('door.glb', { pos: [-4.35, 0, 2.0], size: 2.2, rotY: 90, clueId: 'door' });
  loadModel('ceiling-fan.glb', { pos: [0, 2.95, 0], size: 1.4 }).then(({ model }) => {
    ceilingFanModel = model;
  });

  // 7. Wardrobe closet against right wall (completely static in default closed state)
  loadModel('closet.glb', { pos: [3.6, 0, 1.4], size: 2.35, rotY: -90, clueId: 'closet', solid: true });

  // 8. Cardboard packing boxes in open floor area (await for top Y surface)
  const boxesResult = await loadModel('cardboard-boxes.glb', {
    pos: [1.2, 0, 2.2],
    size: 1.05,
    clueId: 'cardboard_boxes',
    solid: true,
  });
  const boxesTopY = boxesResult.finalBox.max.y;
  console.log(`[BOXES_BOUNDS] min: (${boxesResult.finalBox.min.x.toFixed(2)}, ${boxesResult.finalBox.min.y.toFixed(2)}, ${boxesResult.finalBox.min.z.toFixed(2)}) max: (${boxesResult.finalBox.max.x.toFixed(2)}, ${boxesResult.finalBox.max.y.toFixed(2)}, ${boxesResult.finalBox.max.z.toFixed(2)})`);

  // 9. Dedicated Music Corner
  loadModel('guitar.glb', { pos: [-3.5, 0, -0.6], size: 1.15, rotY: 45, clueId: 'guitar' });
  loadModel('open-book.glb', { pos: [-3.15, 0, -0.35], size: 0.35, rotY: 20, clueId: 'songbook' });

  // 10. Study & Detective Desk (Flush against back light-pink wall: Z = -3.75)
  const deskResult = await loadModel('desk.glb', { pos: [-2.2, 0, -3.75], size: 1.85, solid: true });
  const deskTopY = deskResult.finalBox.max.y;
  deskLight.position.set(-2.2, deskTopY + 0.8, -3.7);

  // Desk Chair tucked neatly in front of the desk facing the desk
  loadModel('chair.glb', { pos: [-2.2, 0, -2.9], size: 0.98, rotY: 170, clueId: 'chair', solid: true });

  // Trash can beside desk
  loadModel('trash-can.glb', { pos: [-1.15, 0, -3.65], size: 0.45, clueId: 'trash_can' });

  // Wall board mounted flush on back wall directly above the desk
  loadModel('wall-board.glb', { pos: [-2.2, 1.6, -4.35], size: 1.1, clueId: 'board' });

  // 11. Tabletop Items on deskTopY (zero floating or sinking)
  await Promise.all([
    loadModel('cassette-player.glb', {
      pos: [-2.35, deskTopY, -3.70],
      size: 0.32,
      rotY: -10,
      clueId: 'tape_player',
    }),
    loadModel('empty-box.glb', {
      pos: [-1.75, deskTopY, -3.75],
      size: 0.25,
      rotY: -5,
      clueId: 'keepsake_box',
    }),
    loadModel('mug.glb', {
      pos: [-2.65, deskTopY, -3.60],
      size: 0.14,
      clueId: 'mug',
    }),
    loadModel('polaroids.glb', {
      pos: [-2.55, deskTopY, -3.85],
      size: 0.20,
      rotY: 15,
      clueId: 'polaroids',
    }),
    loadModel('camera.glb', {
      pos: [-2.75, deskTopY, -3.78],
      size: 0.18,
      rotY: -20,
      clueId: 'camera',
    }),
  ]);

  // 12. Scatter Physical Cassette Tapes in the Bedroom (Tape 1 on nightstand, Tape 2 by guitar)
  const [tape1Res, tape2Res] = await Promise.all([
    // Tape 1: Resting on night-stand beside notepad
    loadModel('cassette.glb', {
      pos: [nightstandPos[0], nightstandTopY, nightstandPos[2] + 0.18],
      size: 0.14,
      rotX: 90,
      rotY: 20,
      clueId: 'pickup_tape_1',
    }),
    // Tape 2: Resting on floor in music corner beside guitar / open-book
    loadModel('cassette.glb', {
      pos: [-3.3, 0, -0.15],
      size: 0.14,
      rotX: 90,
      rotY: 35,
      clueId: 'pickup_tape_2',
    }),
  ]);

  tapeModels[1] = tape1Res.model;
  tapeModels[2] = tape2Res.model;

  console.log(`[SIDE_B] All 22 models loaded! deskTopY = ${deskTopY.toFixed(3)}, nightstandTopY = ${nightstandTopY.toFixed(3)}`);
  document.body.setAttribute('data-status', 'ALL_22_MODELS_LOADED');

  if (window.location.hash.includes('capture')) {
    setTimeout(async () => {
      async function captureView(name, camPos, lookAtPos) {
        camera.position.set(...camPos);
        camera.lookAt(...lookAtPos);
        renderer.render(scene, camera);
        const dataUrl = renderer.domElement.toDataURL('image/png');
        await fetch(`/_report_capture?name=${name}`, { method: 'POST', body: dataUrl }).catch(() => {});
      }

      await captureView('desk_view', [-2.2, 1.45, -2.1], [-2.2, 0.95, -3.75]);
      await captureView('nightstand_view', [1.6, 1.35, -2.6], [2.85, 0.75, -3.3]);
      await captureView('music_view', [-2.0, 1.3, 0.4], [-3.3, 0.4, -0.4]);
      await captureView('boxes_view', [0.8, 1.5, 1.4], [1.25, 0.9, 2.2]);
      await captureView('room_overview', [0, 2.2, 3.6], [0, 1.2, -1.0]);

      console.log('[SIDE_B] All 5 capture views sent successfully!');
    }, 1200);
  }
}

initModels();

// ---------------------------------------------------------------------------
// 9. CIRCLE-VS-AABB SMOOTH SLIDING COLLISIONS
// ---------------------------------------------------------------------------
const PLAYER_RADIUS = 0.38; // Charlie's collision radius

function resolveCircleAABB(px, pz, radius, aabb) {
  const closestX = Math.max(aabb.minX, Math.min(px, aabb.maxX));
  const closestZ = Math.max(aabb.minZ, Math.min(pz, aabb.maxZ));
  const dx = px - closestX;
  const dz = pz - closestZ;
  const distSq = dx * dx + dz * dz;

  if (distSq < radius * radius) {
    const dist = Math.sqrt(distSq);
    if (dist > 0.0001) {
      const overlap = radius - dist;
      return {
        x: px + (dx / dist) * overlap,
        z: pz + (dz / dist) * overlap,
      };
    } else {
      const dLeft = Math.abs(px - aabb.minX);
      const dRight = Math.abs(aabb.maxX - px);
      const dBack = Math.abs(pz - aabb.minZ);
      const dFront = Math.abs(aabb.maxZ - pz);
      const minEdge = Math.min(dLeft, dRight, dBack, dFront);

      if (minEdge === dLeft) return { x: aabb.minX - radius, z: pz };
      if (minEdge === dRight) return { x: aabb.maxX + radius, z: pz };
      if (minEdge === dBack) return { x: px, z: aabb.minZ - radius };
      return { x: px, z: aabb.maxZ + radius };
    }
  }
  return null;
}

function applyPlayerCollisions() {
  let cx = camera.position.x;
  let cz = camera.position.z;

  // Outer walls boundary [-4.02, +4.02] (8.8m room minus radius & baseboard)
  const BOUND = 4.02;
  cx = Math.max(-BOUND, Math.min(BOUND, cx));
  cz = Math.max(-BOUND, Math.min(BOUND, cz));

  // Solid furniture sliding collisions
  for (const box of collisionObstacles) {
    const resolved = resolveCircleAABB(cx, cz, PLAYER_RADIUS, box);
    if (resolved) {
      cx = resolved.x;
      cz = resolved.z;
    }
  }

  camera.position.x = Math.max(-BOUND, Math.min(BOUND, cx));
  camera.position.z = Math.max(-BOUND, Math.min(BOUND, cz));
}

// ---------------------------------------------------------------------------
// 10. INTERACTION RAYCASTING & HIGHLIGHTS
// ---------------------------------------------------------------------------
const raycaster = new THREE.Raycaster();
raycaster.far = 2.8;
let activeClue = null;
let hoveredObject = null;
let hoveredMeshes = [];

const HIGHLIGHT_EMISSIVE = new THREE.Color(0x3e2832);

function setMeshHighlight(mesh, enable) {
  if (!mesh || !mesh.material) return;

  if (Array.isArray(mesh.material)) {
    mesh.material.forEach((mat, idx) => {
      if (mat.emissive) {
        if (enable) {
          mat.emissive.copy(HIGHLIGHT_EMISSIVE);
        } else if (mesh.userData.origEmissives && mesh.userData.origEmissives[idx]) {
          mat.emissive.copy(mesh.userData.origEmissives[idx]);
        }
      }
    });
  } else if (mesh.material.emissive) {
    if (enable) {
      mesh.material.emissive.copy(HIGHLIGHT_EMISSIVE);
    } else if (mesh.userData.origEmissive) {
      mesh.material.emissive.copy(mesh.userData.origEmissive);
    }
  }
}

function clearHoverHighlights() {
  for (const m of hoveredMeshes) setMeshHighlight(m, false);
  hoveredMeshes = [];
  hoveredObject = null;
  activeClue = null;
  if (crosshair) crosshair.classList.remove('active');
  if (promptEl) promptEl.style.display = 'none';
}

function updateRaycasting() {
  if (state.activeModal) {
    clearHoverHighlights();
    return;
  }

  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hits = raycaster.intersectObjects(interactables, true);

  if (hits.length > 0) {
    const hitMesh = hits[0].object;
    const clueId = hitMesh.userData.clueId;

    if (clueId) {
      if (activeClue !== clueId || hoveredObject !== hitMesh) {
        clearHoverHighlights();

        activeClue = clueId;
        hoveredObject = hitMesh;

        const root = hitMesh.userData.rootModel || hitMesh;
        root.traverse((ch) => {
          if (ch.isMesh) {
            setMeshHighlight(ch, true);
            hoveredMeshes.push(ch);
          }
        });

        if (crosshair) crosshair.classList.add('active');
        if (promptEl) {
          promptEl.style.display = 'block';
          promptEl.textContent = getCluePrompt(clueId);
        }
      }
      return;
    }
  }

  clearHoverHighlights();
}

// Keydown [E] & left-click inspect listener
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyE' && activeClue) {
    if (controls.isLocked || !state.activeModal) {
      story.inspectClue(activeClue);
    }
  }
});

window.addEventListener('mousedown', (e) => {
  if (e.button === 0 && controls.isLocked && activeClue && !state.activeModal) {
    story.inspectClue(activeClue);
  }
});

// Resize listener
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// ---------------------------------------------------------------------------
// 11. MAIN ANIMATION & RENDER LOOP
// ---------------------------------------------------------------------------
const clock = new THREE.Clock();
let headBobTimer = 0;

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.1);

  // Player Movement & Footsteps
  if (controls.isLocked) {
    const moveSpeed = 2.5 * delta;
    let isMoving = false;

    if (keys['KeyW']) { controls.moveForward(moveSpeed); isMoving = true; }
    if (keys['KeyS']) { controls.moveForward(-moveSpeed); isMoving = true; }
    if (keys['KeyA']) { controls.moveRight(-moveSpeed); isMoving = true; }
    if (keys['KeyD']) { controls.moveRight(moveSpeed); isMoving = true; }

    applyPlayerCollisions();

    if (isMoving) {
      headBobTimer += delta * 9.2;
      camera.position.y = 1.6 + Math.sin(headBobTimer) * 0.024;
      // Trigger footstep synced to stride
      playFootstep();
    } else {
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.6, delta * 8);
    }
  } else {
    camera.position.y = 1.6;
  }

  // Smooth Ceiling Fan Rotation
  if (ceilingFanModel) {
    ceilingFanModel.rotation.y += 0.85 * delta;
  }

  // Dust Motes floating in light cone
  if (dustMotes) {
    const posAttr = dustMotes.geometry.attributes.position;
    const array = posAttr.array;

    for (let i = 0; i < MOTE_COUNT; i++) {
      const vel = moteVelocities[i];
      vel.phase += delta * 1.4;

      array[i * 3 + 1] += vel.vy * delta;
      array[i * 3 + 0] += Math.sin(vel.phase) * vel.driftX * delta;
      array[i * 3 + 2] += Math.cos(vel.phase) * vel.driftZ * delta;

      if (array[i * 3 + 1] > 2.5) {
        array[i * 3 + 1] = 0.8;
        array[i * 3 + 0] = -2.9 + Math.random() * 1.5;
        array[i * 3 + 2] = -4.2 + Math.random() * 1.3;
      }
    }
    posAttr.needsUpdate = true;
  }

  // Ending Golden Sunrise Lighting Transition
  if (endingTransition.active) {
    endingTransition.progress = Math.min(1.0, endingTransition.progress + delta / endingTransition.duration);
    const p = endingTransition.progress;

    hemiLight.color.lerp(new THREE.Color(0xfff0dc), p);
    hemiLight.intensity = THREE.MathUtils.lerp(1.35, 1.85, p);

    sunLight.color.lerp(new THREE.Color(0xffe2b5), p);
    sunLight.intensity = THREE.MathUtils.lerp(1.6, 3.8, p);

    skyPaneMat.color.lerp(new THREE.Color(0xffd59e), p);
    windowBacklight.color.lerp(new THREE.Color(0xffbe6b), p);
    windowBacklight.intensity = THREE.MathUtils.lerp(1.8, 3.5, p);
  }

  // Calculate distance to nearest uncollected tape for spatial shimmer
  let nearestTapeDist = Infinity;
  for (const [num, model] of Object.entries(tapeModels)) {
    if (!state.collectedTapes[num] && model) {
      const tapePos = new THREE.Vector3();
      model.getWorldPosition(tapePos);
      const d = camera.position.distanceTo(tapePos);
      if (d < nearestTapeDist) nearestTapeDist = d;
    }
  }
  if (!state.collectedTapes[3]) {
    const closetTapePos = new THREE.Vector3(3.6, 1.1, 1.4);
    const d = camera.position.distanceTo(closetTapePos);
    if (d < nearestTapeDist) nearestTapeDist = d;
  }
  updateProximityShimmer(nearestTapeDist);

  updateRaycasting();
  story.update(delta, !!keys['Space'], !!keys['KeyR']);
  renderer.render(scene, camera);
}

animate();
