import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { seabedHeight } from './terrain.js';

export function reef(scene, renderer, onChange) {
  let seed = 7321;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const palette = [0x785a59, 0x507c76, 0x5b6b86, 0x807452, 0x456d69].map(c => new THREE.Color(c));
  const positions = [], colors = [], indices = [];
  const sides = 6;
  const axis = new THREE.Vector3(), side = new THREE.Vector3(), across = new THREE.Vector3();
  function branchSegment(a, b, bottom, top, color) {
    axis.subVectors(b, a).normalize();
    side.set(0, 0, 1).cross(axis);
    if (side.lengthSq() < .01) side.set(1, 0, 0).cross(axis);
    side.normalize();
    across.crossVectors(axis, side).normalize();
    const start = positions.length / 3;
    for (let ring = 0; ring < 2; ring++) {
      const center = ring ? b : a;
      const radius = ring ? top : bottom;
      const shade = ring ? 1.12 : .78;
      for (let j = 0; j < sides; j++) {
        const angle = j / sides * Math.PI * 2;
        const c = Math.cos(angle), s = Math.sin(angle);
        positions.push(center.x + radius * (side.x * c + across.x * s),
          center.y + radius * (side.y * c + across.y * s),
          center.z + radius * (side.z * c + across.z * s));
        colors.push(color.r * shade, color.g * shade, color.b * shade);
      }
    }
    for (let j = 0; j < sides; j++) {
      const next = (j + 1) % sides;
      indices.push(start + j, start + next, start + sides + j,
        start + next, start + sides + next, start + sides + j);
    }
  }
  function grow(start, direction, length, radius, level, color, fan) {
    const end = start.clone().addScaledVector(direction, length);
    end.x += (rand() - .5) * length * .14;
    end.z += (rand() - .5) * length * .11;
    branchSegment(start, end, radius, radius * (level ? .64 : .27), color);
    if (!level) return;
    const count = level === 3 ? 3 : 2;
    for (let j = 0; j < count; j++) {
      const spread = (j - (count - 1) / 2) * (fan ? .68 : .48) + (rand() - .5) * .19;
      const turn = fan ? new THREE.Vector3(spread, .95 + rand() * .16, (rand() - .5) * .13)
        : new THREE.Vector3(Math.cos(spread * 4 + rand()) * .52, .95 + rand() * .18, Math.sin(spread * 4 + rand()) * .48);
      turn.addScaledVector(direction, .23).normalize();
      grow(end, turn, length * (.59 + rand() * .12), radius * .61, level - 1, color, fan);
    }
  }
  // Clusters change size and density with distance; the left side stays open for chapter text.
  for (let i = 0; i < 18; i++) {
    const z = -38 + rand() * 44;
    const x = -19 + rand() * 47;
    if (x < 0 && rand() < .55) continue;
    const far = THREE.MathUtils.clamp((-z - 4) / 40, 0, 1);
    const height = (.85 + rand() * 1.65) * (1 - far * .32);
    const root = new THREE.Vector3(x, seabedHeight(x, z) - .1, z);
    const color = palette[Math.floor(rand() * palette.length)].clone().multiplyScalar(.81 + rand() * .27);
    grow(root, new THREE.Vector3((rand() - .5) * .11, 1, (rand() - .5) * .1).normalize(),
      height * .52, (.05 + height * .03), 3, color, rand() < .55);
  }
  const coralGeometry = new THREE.BufferGeometry();
  coralGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  coralGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  coralGeometry.setIndex(indices);
  coralGeometry.computeVertexNormals();
  const coral = new THREE.Mesh(coralGeometry, new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 1, side: THREE.DoubleSide, flatShading: false
  }));
  scene.add(coral);

  const dummy = new THREE.Object3D();
  const rockGeometry = new THREE.IcosahedronGeometry(1, 1);
  const vertices = rockGeometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
    const k = 1 + Math.sin(x * 7 + z * 5) * .07 + Math.cos(y * 11 + x * 3) * .055;
    vertices.setXYZ(i, x * k, y * k, z * k);
  }
  rockGeometry.computeVertexNormals();
  const rocks = new THREE.InstancedMesh(rockGeometry,
    new THREE.MeshStandardMaterial({ color: 0x8aa49b, roughness: 1 }), 62);
  for (let i = 0; i < rocks.count; i++) {
    const x = -24 + rand() * 55, z = -43 + rand() * 53;
    const size = .17 + Math.pow(rand(), 2) * 1.2;
    dummy.position.set(x, seabedHeight(x, z) - size * .24, z);
    dummy.rotation.set(rand() * .7, rand() * 6.3, rand() * .4);
    dummy.scale.set(size * (1.1 + rand()), size * (.28 + rand() * .22), size * (.67 + rand() * .65));
    dummy.updateMatrix(); rocks.setMatrixAt(i, dummy.matrix);
    rocks.setColorAt(i, new THREE.Color().setHSL(.47 + rand() * .07, .13 + rand() * .12, .07 + rand() * .06));
  }
  rocks.instanceMatrix.needsUpdate = true;
  if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true;
  scene.add(rocks);

  // Low hemispherical colonies break up the branch silhouettes at ground level.
  const domeGeometry = new THREE.SphereGeometry(1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  const domes = new THREE.InstancedMesh(domeGeometry,
    new THREE.MeshStandardMaterial({ color: 0x759b90, roughness: 1, side: THREE.DoubleSide }), 18);
  for (let i = 0; i < domes.count; i++) {
    const x = -19 + rand() * 48, z = -40 + rand() * 43;
    const size = .3 + rand() * .75;
    dummy.position.set(x, seabedHeight(x, z) - .08, z);
    dummy.rotation.set(0, rand() * Math.PI * 2, 0);
    dummy.scale.set(size, size * (.42 + rand() * .28), size * (.72 + rand() * .4));
    dummy.updateMatrix(); domes.setMatrixAt(i, dummy.matrix);
    domes.setColorAt(i, palette[Math.floor(rand() * palette.length)]);
  }
  domes.instanceMatrix.needsUpdate = true;
  if (domes.instanceColor) domes.instanceColor.needsUpdate = true;
  scene.add(domes);

  const scannedCorals = new THREE.Group();
  scene.add(scannedCorals);
  const placements = {
    stylaster_coral: [[7, -7, 2.6], [22, -18, 2.2], [-7, -28, 1.6], [16, -35, 1.5], [25, -5, 3.4]],
    seriatopora_coral: [[16, -11, 3.5], [29, -28, 2.4], [3, -25, 2.3], [-12, -39, 1.5]],
    goniastrea_coral: [[-2, -8, 1.8], [11, -24, 2.2], [27, -5, 1.6], [-9, -30, 1.3]]
  };
  let scansRequested = false;
  function loadScans() {
    if (scansRequested) return;
    scansRequested = true;
    const ktx2 = new KTX2Loader().setTranscoderPath(`${import.meta.env.BASE_URL}basis/`).detectSupport(renderer);
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).setKTX2Loader(ktx2);
    for (const [name, sites] of Object.entries(placements)) {
      loader.load(`${import.meta.env.BASE_URL}models/coral/${name}.glb`, gltf => {
        const bounds = new THREE.Box3().setFromObject(gltf.scene);
        const height = Math.max(bounds.max.y - bounds.min.y, .001);
        sites.forEach(([x, z, targetHeight], i) => {
          const colony = gltf.scene.clone(true);
          const scale = targetHeight / height;
          colony.scale.setScalar(scale);
          colony.position.set(x, seabedHeight(x, z) - bounds.min.y * scale - targetHeight * .12, z);
          colony.rotation.y = (i - 2) * .22;
          scannedCorals.add(colony);
        });
        onChange();
      }, undefined, error => console.warn(`Could not load ${name} coral scan`, error));
    }
  }

  const fishShape = new THREE.Shape();
  fishShape.moveTo(-.8, 0); fishShape.quadraticCurveTo(-.2, .27, .55, .08);
  fishShape.lineTo(.95, .32); fishShape.lineTo(.9, -.32);
  fishShape.lineTo(.55, -.08); fishShape.quadraticCurveTo(-.2, -.27, -.8, 0);
  const fishGeometry = new THREE.ExtrudeGeometry(fishShape, { depth: .1, bevelEnabled: true, bevelThickness: .04, bevelSize: .04, bevelSegments: 1 });
  const fishMaterial = new THREE.MeshStandardMaterial({ color: 0x769d98, metalness: .12, roughness: .64, side: THREE.DoubleSide });
  const time = { value: 0 };
  fishMaterial.onBeforeCompile = shader => {
    shader.uniforms.uTime = time;
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;');
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.z += sin(uTime * 2.1 + transformed.x * 3.0 + float(gl_InstanceID) * .63) * .055;');
  };
  const school = new THREE.InstancedMesh(fishGeometry, fishMaterial, 138);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < school.count; i++) {
    const group = i < 98 ? 0 : 1;
    const n = group ? i - 98 : i, total = group ? 40 : 98;
    const angle = n * golden, radius = Math.sqrt((n + .5) / total);
    const x = (group ? -10 : 8) + Math.cos(angle) * radius * (group ? 5 : 11);
    const y = (group ? -11 : -9.5) + Math.sin(angle) * radius * (group ? 2 : 4);
    dummy.position.set(x, y, (group ? -32 : -16) + Math.sin(n * 1.8) * 2.2);
    dummy.rotation.set(0, -.28 + Math.sin(angle) * .16, Math.sin(angle) * .05);
    dummy.scale.setScalar((group ? .11 : .16) + rand() * (group ? .09 : .12));
    dummy.updateMatrix(); school.setMatrixAt(i, dummy.matrix);
  }
  school.instanceMatrix.needsUpdate = true;
  scene.add(school);
  const objects = [coral, rocks, domes, school, scannedCorals];
  let wasVisible = true;
  return (elapsed, visible = true) => {
    if (visible) loadScans();
    time.value = elapsed;
    school.position.x = Math.sin(elapsed * .24) * .7;
    if (visible !== wasVisible) {
      objects.forEach(mesh => { mesh.visible = visible; });
      wasVisible = visible;
    }
  };
}
