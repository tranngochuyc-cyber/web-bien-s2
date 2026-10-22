import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function reef(scene) {
  const colors = [0xa66c72, 0x7d86a6, 0x578f8d, 0xa79069];
  const all = [];
  const branchPieces = colors.map(() => []);
  // Small coral fans have curved trunks, bifurcated arms and irregular tips.
  for (let n = 0; n < 36; n++) {
    const color = n % colors.length;
    const x = 4 + Math.sin(n * 9.31) * 19;
    const z = -8 - Math.floor(n / 12) * 11 - (n % 4) * .7;
    const h = 1.3 + (Math.sin(n * 2.47) + 1) * .75;
    const fan = .8 + (n % 4) * .18;
    const root = new THREE.Vector3(x, -20.2, z);
    const mid = new THREE.Vector3(x + Math.sin(n) * .15, -20.2 + h * .53, z + Math.cos(n) * .1);
    const top = new THREE.Vector3(x + Math.sin(n * .7) * .22, -20.2 + h, z);
    const addTube = (points, radius) => branchPieces[color].push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 7, radius, 4, false));
    addTube([root, mid, top], .095);
    for (let arm = -2; arm <= 2; arm++) {
      const side = arm / 2;
      const joint = mid.clone().add(new THREE.Vector3(side * fan * .45, h * .1, side * .08));
      const tip = top.clone().add(new THREE.Vector3(side * fan, h * (.1 - Math.abs(side) * .07), Math.sin(n + arm) * .2));
      addTube([mid, joint, tip], .052);
      for (const twig of [-1, 1]) {
        const end = tip.clone().add(new THREE.Vector3(twig * .12 + side * .11, .18 + (n % 3) * .05, twig * .07));
        addTube([joint.clone().lerp(tip, .72), end], .022);
      }
    }
  }
  branchPieces.forEach((parts, i) => {
    const mesh = new THREE.Mesh(mergeGeometries(parts, false), new THREE.MeshStandardMaterial({ color: colors[i], roughness: .88, side: THREE.DoubleSide }));
    scene.add(mesh); all.push(mesh); parts.forEach(g => g.dispose());
  });
  const dummy = new THREE.Object3D();
  const rocks = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: 0x305955, roughness: 1 }), 34);
  for (let i = 0; i < rocks.count; i++) {
    dummy.position.set(-14 + Math.sin(i * 5.71) * 18, -20.2, -7 - Math.floor(i / 12) * 10 - (i % 3));
    dummy.rotation.set(i * 2, i * .8, i * .4);
    const size = .25 + (Math.sin(i * 7.3) + 1) * .45;
    dummy.scale.set(size * 1.4, size * .5, size);
    dummy.updateMatrix(); rocks.setMatrixAt(i, dummy.matrix);
  }
  rocks.instanceMatrix.needsUpdate = true; scene.add(rocks); all.push(rocks);

  const fishShape = new THREE.Shape();
  fishShape.moveTo(-.8, 0); fishShape.quadraticCurveTo(-.2, .28, .55, .08);
  fishShape.lineTo(.95, .32); fishShape.lineTo(.9, -.32);
  fishShape.lineTo(.55, -.08); fishShape.quadraticCurveTo(-.2, -.28, -.8, 0);
  const fishGeometry = new THREE.ExtrudeGeometry(fishShape, { depth: .1, bevelEnabled: true, bevelThickness: .06, bevelSize: .06, bevelSegments: 2 });
  const fishMaterial = new THREE.MeshStandardMaterial({ color: 0x7caaa8, metalness: .2, roughness: .5 });
  const time = { value: 0 };
  fishMaterial.onBeforeCompile = shader => {
    shader.uniforms.uTime = time;
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;');
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.z += sin(uTime * 1.5 + transformed.x * 2.0 + float(gl_InstanceID) * .7) * .04;');
  };
  const school = new THREE.InstancedMesh(fishGeometry, fishMaterial, 92);
  for (let i = 0; i < school.count; i++) {
    const row = Math.floor(i / 20), col = i % 20;
    dummy.position.set(-4 + col * .74 + Math.sin(i * 2.3) * .8, -10 - row * 1.35 + Math.cos(i * 1.8) * .75, -13 - row * 2.8 + Math.sin(i * 7) * .4);
    dummy.rotation.set(0, Math.PI * .2 + Math.sin(i) * .16, 0);
    dummy.scale.setScalar(.16 + i % 4 * .037);
    dummy.updateMatrix(); school.setMatrixAt(i, dummy.matrix);
  }
  school.instanceMatrix.needsUpdate = true;
  scene.add(school); all.push(school);
  return (elapsed, visible = true) => { time.value = elapsed; all.forEach(mesh => { mesh.visible = visible; }); };
}
