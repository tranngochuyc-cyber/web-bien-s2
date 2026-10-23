import * as THREE from 'three';

// All forms are built in code. The animals are artistic interpretations, not species models.
export function deepScenes(scene, mobile) {
  const twilight = new THREE.Group();
  const midnight = new THREE.Group();
  scene.add(twilight, midnight);
  const darkSkin = new THREE.MeshStandardMaterial({ color: 0x244552, roughness: .82, metalness: .07, side: THREE.DoubleSide });
  const skinCanvas = document.createElement('canvas'); skinCanvas.width = 256; skinCanvas.height = 128;
  const skinContext = skinCanvas.getContext('2d');
  const skinGradient = skinContext.createLinearGradient(0, 0, 0, 128);
  skinGradient.addColorStop(0, '#375c69'); skinGradient.addColorStop(.52, '#203d4c'); skinGradient.addColorStop(1, '#0b2534');
  skinContext.fillStyle = skinGradient; skinContext.fillRect(0, 0, 256, 128);
  let textureSeed = 51;
  const textureRandom = () => ((textureSeed = (textureSeed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 330; i++) {
    skinContext.fillStyle = textureRandom() > .5 ? 'rgba(130,190,189,.07)' : 'rgba(0,10,23,.12)';
    skinContext.beginPath(); skinContext.ellipse(textureRandom() * 256, textureRandom() * 128, 1 + textureRandom() * 8, 1 + textureRandom() * 4, textureRandom() * 6, 0, Math.PI * 2); skinContext.fill();
  }
  const skinTexture = new THREE.CanvasTexture(skinCanvas); skinTexture.colorSpace = THREE.SRGBColorSpace;
  const modeledSkin = new THREE.MeshStandardMaterial({ map: skinTexture, color: 0xb9dddd, emissive: 0x102c37, emissiveIntensity: .43, roughness: .92 });
  const finSkin = new THREE.MeshStandardMaterial({ color: 0x254755, roughness: .72, transparent: true, opacity: .86, side: THREE.DoubleSide });
  const blueLight = new THREE.MeshBasicMaterial({ color: 0x8cebe6 });
  const warmLight = new THREE.MeshBasicMaterial({ color: 0xd8f6c4 });
  const glow = new THREE.PointLight(0x7beee2, 9, 11, 2);
  const fish = new THREE.Group();
  fish.position.set(mobile ? 2 : 6.8, mobile ? -24.5 : -34, -10);
  fish.scale.setScalar(mobile ? .7 : 1);
  twilight.add(fish);

  // A single lanternfish-like specimen gives the midwater a readable silhouette.
  const bodyGeo = new THREE.SphereGeometry(1, 32, 18);
  const body = new THREE.Mesh(bodyGeo, darkSkin);
  body.scale.set(2.45, .82, .55);
  fish.add(body);
  const belly = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: 0x426672, roughness: .67, side: THREE.DoubleSide }));
  belly.scale.set(1.8, .39, .5); belly.position.y = -.43; fish.add(belly);
  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, 0); tailShape.quadraticCurveTo(.8, .48, 1.65, 1.18);
  tailShape.quadraticCurveTo(1.16, .18, 1.7, 0);
  tailShape.quadraticCurveTo(1.16, -.18, 1.65, -1.18);
  tailShape.quadraticCurveTo(.8, -.48, 0, 0);
  const tail = new THREE.Group(); tail.position.x = 2.2;
  tail.add(new THREE.Mesh(new THREE.ShapeGeometry(tailShape, 14), finSkin)); fish.add(tail);
  const dorsalShape = new THREE.Shape();
  dorsalShape.moveTo(-.9, .6); dorsalShape.quadraticCurveTo(-.2, 1.55, .6, 1.75);
  dorsalShape.quadraticCurveTo(.4, .93, 1.1, .55); dorsalShape.closePath();
  const dorsal = new THREE.Mesh(new THREE.ShapeGeometry(dorsalShape, 12), finSkin);
  dorsal.position.z = -.04; fish.add(dorsal);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(.18, 16, 12), new THREE.MeshStandardMaterial({ color: 0x050e18, roughness: .12 }));
  eye.position.set(-1.57, .22, .48); fish.add(eye);
  const glint = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 6), blueLight);
  glint.position.set(-1.62, .28, .635); fish.add(glint);
  const photophores = new THREE.InstancedMesh(new THREE.SphereGeometry(.065, 8, 6), blueLight, 15);
  const p = new THREE.Object3D();
  for (let i = 0; i < 15; i++) {
    const x = -1.8 + i * .235;
    p.position.set(x, -.51 - Math.sin((i / 14) * Math.PI) * .14, .37);
    p.scale.setScalar(.6 + (i % 3) * .18); p.updateMatrix(); photophores.setMatrixAt(i, p.matrix);
  }
  photophores.instanceMatrix.needsUpdate = true; fish.add(photophores);
  fish.add(glow); glow.position.set(-.3, -.5, 1.2);

  const shoal = new THREE.Group(); twilight.add(shoal);
  const smallBody = new THREE.SphereGeometry(1, 10, 7);
  const smallFish = new THREE.InstancedMesh(smallBody, darkSkin, mobile ? 30 : 58);
  const lights = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 5), blueLight, smallFish.count);
  let seed = 1193; const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < smallFish.count; i++) {
    const x = -19 + random() * 29, y = -24 - random() * 14, z = -23 - random() * 13;
    const s = .14 + random() * .23;
    p.position.set(x, y, z); p.rotation.set(0, 0, (random() - .5) * .18);
    p.scale.set(s * 2.6, s * .75, s * .55); p.updateMatrix(); smallFish.setMatrixAt(i, p.matrix);
    p.position.set(x - s, y - s * .35, z + s * .5); p.rotation.set(0, 0, 0);
    p.scale.setScalar(s * .19); p.updateMatrix(); lights.setMatrixAt(i, p.matrix);
  }
  smallFish.instanceMatrix.needsUpdate = true; lights.instanceMatrix.needsUpdate = true;
  shoal.add(smallFish, lights);

  // The midnight subject has a modeled jaw, fins, teeth and an independently moving lure.
  const angler = new THREE.Group();
  angler.position.set(mobile ? 2.3 : 7.2, mobile ? -44.5 : -51.2, -8.5);
  angler.scale.setScalar(mobile ? .65 : 1.25);
  midnight.add(angler);
  const head = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), modeledSkin);
  head.scale.set(2.15, 1.55, 1.18); head.position.set(.1, 0, 0); angler.add(head);
  const snout = new THREE.Mesh(new THREE.SphereGeometry(1, 26, 16), modeledSkin);
  snout.scale.set(1.2, .73, .92); snout.position.set(-1.25, .14, .12); angler.add(snout);
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(1, 30, 16), finSkin);
  jaw.scale.set(1.3, .34, .88); jaw.position.set(-1.25, -.91, .22); jaw.rotation.z = -.11; angler.add(jaw);
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 14), new THREE.MeshBasicMaterial({ color: 0x02080d }));
  mouth.scale.set(.89, .42, .18); mouth.position.set(-1.72, -.55, .94); angler.add(mouth);
  const toothMaterial = new THREE.MeshStandardMaterial({ color: 0xb7d6cc, roughness: .48 });
  for (let i = 0; i < 9; i++) {
    const x = -2.42 + i * .18;
    const upper = new THREE.Mesh(new THREE.ConeGeometry(.08, .26 + (i % 3) * .06, 5), toothMaterial);
    upper.position.set(x, -.39, 1.07); upper.rotation.z = Math.PI; angler.add(upper);
    const lower = upper.clone(); lower.position.y = -.79; lower.rotation.z = 0; angler.add(lower);
  }
  const anglerEye = new THREE.Mesh(new THREE.SphereGeometry(.22, 18, 12), new THREE.MeshStandardMaterial({ color: 0x071116, roughness: .16 }));
  anglerEye.position.set(-1.15, .42, 1.03); angler.add(anglerEye);
  const eyeRim = new THREE.Mesh(new THREE.TorusGeometry(.25, .045, 8, 24), finSkin);
  eyeRim.position.copy(anglerEye.position); eyeRim.position.z -= .03; angler.add(eyeRim);
  const gillMaterial = new THREE.MeshBasicMaterial({ color: 0x537d83, transparent: true, opacity: .6 });
  for (let i = 0; i < 3; i++) {
    const x = -.55 + i * .24;
    const gill = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, .1, 1.12), new THREE.Vector3(x + .05, -.22, 1.19),
      new THREE.Vector3(x + .1, -.53, 1.08)
    ]), 10, .018, 4), gillMaterial);
    angler.add(gill);
  }
  const tailFin = new THREE.Group(); tailFin.position.set(1.85, -.1, 0);
  const finShape = new THREE.Shape(); finShape.moveTo(0, 0);
  finShape.bezierCurveTo(.5, .5, 1.2, .8, 1.75, 1.35);
  finShape.quadraticCurveTo(1.22, .12, 1.72, 0);
  finShape.quadraticCurveTo(1.24, -.12, 1.75, -1.35);
  finShape.bezierCurveTo(1.2, -.8, .5, -.5, 0, 0);
  tailFin.add(new THREE.Mesh(new THREE.ShapeGeometry(finShape, 18), finSkin)); angler.add(tailFin);
  const spines = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const spine = new THREE.Mesh(new THREE.ConeGeometry(.12, .55 + i * .08, 5), darkSkin);
    spine.position.set(-.8 + i * .42, 1.37 - Math.abs(i - 3) * .08, 0);
    spine.rotation.z = -.28 + i * .1; spines.add(spine);
  }
  angler.add(spines);
  const lure = new THREE.Group(); lure.position.set(-1.35, 1.15, .2); angler.add(lure);
  const rod = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(-.3, 1.2, 0),
    new THREE.Vector3(-1.15, 1.75, .1), new THREE.Vector3(-2.15, 1.15, .3)
  ]), 26, .045, 6), finSkin);
  lure.add(rod);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.24, 20, 14), warmLight);
  bulb.position.set(-2.15, 1.15, .3); lure.add(bulb);
  const haloCanvas = document.createElement('canvas'); haloCanvas.width = haloCanvas.height = 64;
  const haloContext = haloCanvas.getContext('2d');
  const haloGradient = haloContext.createRadialGradient(32, 32, 2, 32, 32, 31);
  haloGradient.addColorStop(0, 'rgba(230,255,226,.95)');
  haloGradient.addColorStop(.18, 'rgba(155,246,215,.5)');
  haloGradient.addColorStop(1, 'rgba(120,240,208,0)');
  haloContext.fillStyle = haloGradient; haloContext.fillRect(0, 0, 64, 64);
  const haloTexture = new THREE.CanvasTexture(haloCanvas);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture, color: 0xb6ffdc, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.position.copy(bulb.position); halo.scale.set(2.1, 2.1, 1); lure.add(halo);
  const bulbLight = new THREE.PointLight(0xc9f9de, 33, 12, 2);
  bulbLight.position.copy(bulb.position); lure.add(bulbLight);
  const speckles = new THREE.InstancedMesh(new THREE.SphereGeometry(.03, 6, 5), blueLight, 27);
  for (let i = 0; i < speckles.count; i++) {
    const a = random() * Math.PI * 2, x = -.5 + random() * 2.5;
    p.position.set(x, Math.sin(a) * 1.04, Math.cos(a) * 1.02);
    p.scale.setScalar(.4 + random() * .7); p.updateMatrix(); speckles.setMatrixAt(i, p.matrix);
  }
  speckles.instanceMatrix.needsUpdate = true; angler.add(speckles);
  const ambient = new THREE.PointLight(0x6cb8c2, 115, 24, 2);
  ambient.position.set(9, -49, 4); midnight.add(ambient);
  const rim = new THREE.PointLight(0x24748a, 36, 15, 2);
  rim.position.set(3, -49, -13); midnight.add(rim);

  let lastActive = false;
  return {
    setMobile(value) {
      mobile = value;
      fish.position.x = mobile ? 2 : 6.8;
      angler.position.x = mobile ? 2.3 : 7.2;
      angler.scale.setScalar(mobile ? .65 : 1.25);
    },
    update(time, depth, paused) {
      const twilightPresence = THREE.MathUtils.smoothstep(depth, .28, .42) * (1 - THREE.MathUtils.smoothstep(depth, .68, .79));
      const midnightPresence = THREE.MathUtils.smoothstep(depth, .64, .81);
      twilight.visible = twilightPresence > .01;
      midnight.visible = midnightPresence > .01;
      fish.scale.setScalar((.78 + twilightPresence * .22) * (mobile ? .7 : 1));
      glow.intensity = 9 * twilightPresence;
      bulbLight.intensity = 33 * midnightPresence;
      ambient.intensity = 115 * midnightPresence;
      rim.intensity = 36 * midnightPresence;
      if (!paused) {
        fish.position.y = (mobile ? -24.5 : -34) + Math.sin(time * .72) * .16;
        tail.rotation.y = Math.sin(time * 2.1) * .18;
        shoal.position.x = Math.sin(time * .18) * .7;
        angler.position.y = (mobile ? -44.5 : -51.2) + Math.sin(time * .42) * .27;
        angler.rotation.y = Math.sin(time * .37) * .07;
        tailFin.rotation.y = Math.sin(time * 1.65) * .22;
        lure.rotation.z = Math.sin(time * .8) * .065;
        bulb.scale.setScalar(1 + Math.sin(time * 1.9) * .1);
      }
      lastActive = twilight.visible || midnight.visible;
      return lastActive;
    },
    dispose() {
      scene.remove(twilight, midnight);
      const geometries = new Set(), materials = new Set();
      for (const root of [twilight, midnight]) root.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
      });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
      skinTexture.dispose(); haloTexture.dispose();
    }
  };
}
