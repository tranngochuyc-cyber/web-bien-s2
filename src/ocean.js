import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { seabedHeight } from './terrain.js';

const clamp = THREE.MathUtils.clamp;
const smooth = t => t * t * (3 - 2 * t);
const mix = THREE.MathUtils.lerp;

export function createOcean(canvas, onReady) {
  let mobile = matchMedia('(max-width: 700px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.6));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b4957);
  scene.fog = new THREE.Fog(0x0b4957, 12, 90);
  const deepColor = new THREE.Color(0x001d2d);
  const shallowColor = scene.background.clone();
  const discover = document.querySelector('#discover');
  const camera = new THREE.PerspectiveCamera(mobile ? 55 : 48, innerWidth / innerHeight, 0.1, 160);
  const cameraTarget = new THREE.Vector3();
  const clock = new THREE.Clock();
  let elapsed = 0, lastFrame = 0, frame = 0, paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lost = false, disposed = false, dirty = true, previousScroll = -1;
  let heroSwimmer;
  const mixers = [];
  const swimmers = [];
  const perf = new URLSearchParams(location.search).has('perf')
    ? { frames: 0, cpuMs: [], gpuMs: [], mantaLoadMs: null, gpuSupported: false, pendingFrame: false } : null;
  const gl = perf ? renderer.getContext() : null;
  let gpuTimer = gl?.getExtension('EXT_disjoint_timer_query_webgl2');
  let pendingGpuQuery = null;
  if (perf) {
    perf.gpuSupported = !!gpuTimer;
    perf.getState = () => ({ scheduled: !!frame, paused, lost, hidden: document.hidden, inScene: inScene() });
    window.__oceanPerf = perf;
  }

  const ambient = new THREE.HemisphereLight(0x85d4de, 0x001622, 2.3);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xe6fff0, 3.8);
  sun.position.set(-9, 19, 7);
  scene.add(sun);
  const sideLight = new THREE.PointLight(0x80e8db, 75, 32, 2);
  sideLight.position.set(7, -2, 7);
  scene.add(sideLight);

  // A transparent, moving surface is seen from below, not a static background plate.
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(150, 150, 32, 32), new THREE.ShaderMaterial({
    transparent: true, side: THREE.DoubleSide, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uFade: { value: 1 } },
    vertexShader: `uniform float uTime; varying vec2 vUv; void main(){vUv=uv; vec3 p=position; p.z+=sin(p.x*.28+uTime*.35)*.33+sin(p.y*.46-uTime*.26)*.23; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader: `uniform float uTime; uniform float uFade; varying vec2 vUv; void main(){vec2 p=vUv*42.; float wave=sin(p.x*2.1+sin(p.y*.95+uTime*.5)*2.2+uTime*.45)*sin(p.y*1.4+sin(p.x*.7-uTime*.4)*1.8); float lace=pow(max(wave,0.),8.); vec3 c=mix(vec3(.045,.25,.30),vec3(.42,.88,.84),lace*.72); gl_FragColor=vec4(c,(.68+lace*.16)*uFade);}`
  }));
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = 9;
  scene.add(surface);

  // Shaft geometry provides parallax while the seabed shader carries the caustics.
  const shaftMaterial = new THREE.MeshBasicMaterial({ color: 0x9bede0, transparent: true, opacity: .015, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const shafts = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const geometry = new THREE.CylinderGeometry(.26 + i * .04, 2.5 + (i % 3), 53, 4, 1, true);
    const shaft = new THREE.Mesh(geometry, shaftMaterial);
    shaft.position.set(-12 + i * 5.5, -15, -14 - (i % 4) * 5);
    shaft.rotation.z = -.2 + (i % 4) * .06;
    shafts.add(shaft);
  }
  scene.add(shafts);

  const floorUniforms = { uTime: { value: 0 }, uLight: { value: 1 } };
  const floorGeometry = new THREE.PlaneGeometry(85, 90, 80, 80);
  const floorPositions = floorGeometry.attributes.position;
  for (let i = 0; i < floorPositions.count; i++) {
    const x = floorPositions.getX(i) + 5;
    const z = -floorPositions.getY(i) - 14;
    floorPositions.setZ(i, seabedHeight(x, z) + 20.5);
  }
  floorPositions.needsUpdate = true;
  floorGeometry.computeVertexNormals();
  const floor = new THREE.Mesh(floorGeometry, new THREE.ShaderMaterial({
    uniforms: floorUniforms, side: THREE.DoubleSide,
    vertexShader: `varying vec3 vP; void main(){vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform float uTime; uniform float uLight; varying vec3 vP; void main(){vec2 p=vP.xy*.75; float a=sin(p.x*1.8+sin(p.y*.76+uTime*.34)*1.5); float b=sin(p.y*1.6+sin(p.x*.82-uTime*.27)*1.5); float caustic=pow(max(0.,a*b),7.); float slope=clamp((vP.z+.6)*.36+.5,0.,1.); vec3 sand=mix(vec3(.013,.095,.115),vec3(.085,.245,.225),slope); gl_FragColor=vec4(sand+caustic*vec3(.045,.14,.13)*uLight,1.);}`
  }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(5, -20.5, -14);
  scene.add(floor);
  let animateReef = () => {};
  let reefPromise;
  function ensureReef() {
    if (reefPromise) return;
    reefPromise = import('./reef.js').then(({ reef }) => {
      if (disposed) return;
      animateReef = reef(scene, renderer, markDirty);
      markDirty();
    }).catch(error => console.warn('Sunlit reef could not load', error));
  }

  const particleCount = mobile ? 420 : 950;
  const dots = new Float32Array(particleCount * 3);
  for (let i = 0; i < dots.length; i += 3) {
    dots[i] = (Math.random() - .5) * 92;
    dots[i + 1] = 10 - Math.random() * 76;
    dots[i + 2] = (Math.random() - .5) * 85;
  }
  const dotGeometry = new THREE.BufferGeometry();
  dotGeometry.setAttribute('position', new THREE.BufferAttribute(dots, 3));
  const plankton = new THREE.Points(dotGeometry, new THREE.PointsMaterial({ color: 0xc9eadb, size: .055, transparent: true, opacity: .45, depthWrite: false }));
  scene.add(plankton);

  // Keep the existing deep-water jellyfish, sharing geometry and material.
  const jellyMaterial = new THREE.MeshStandardMaterial({ color: 0x79c5d4, emissive: 0x217e9b, emissiveIntensity: .7, transparent: true, opacity: .57, side: THREE.DoubleSide });
  const bellGeometry = new THREE.SphereGeometry(.72, 20, 12, 0, Math.PI * 2, 0, Math.PI * .55);
  const jellyfish = [];
  for (let k = 0; k < (mobile ? 7 : 13); k++) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(bellGeometry, jellyMaterial));
    for (let j = 0; j < 7; j++) {
      const a = j / 7 * Math.PI * 2;
      const points = Array.from({ length: 7 }, (_, q) => new THREE.Vector3(Math.cos(a) * .42 + Math.sin(q * 1.5) * .07, -q * .32, Math.sin(a) * .42));
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 16, .012, 3), jellyMaterial));
    }
    g.position.set((Math.random() - .4) * 25, -43 - Math.random() * 14, Math.random() * 18 - 13);
    g.scale.setScalar(.5 + Math.random() * .65);
    scene.add(g);
    jellyfish.push(g);
  }

  const loader = new GLTFLoader();
  const mantaLoadStarted = performance.now();
  loader.load(`${import.meta.env.BASE_URL}models/manta-ray.glb`, gltf => {
    if (disposed) return;
    if (perf) perf.mantaLoadMs = performance.now() - mantaLoadStarted;
    const hero = gltf.scene;
    hero.position.set(mobile ? .4 : 6.9, mobile ? -5.2 : -.7, 2);
    hero.rotation.set(.04, -.28, -.12);
    hero.scale.setScalar(mobile ? .62 : 1.25);
    hero.traverse(object => { if (object.isMesh) { object.frustumCulled = false; object.castShadow = false; } });
    scene.add(hero);
    heroSwimmer = { group: hero, origin: hero.position.clone(), phase: 0 };
    swimmers.push(heroSwimmer);
    if (gltf.animations.length) {
      const mixer = new THREE.AnimationMixer(hero);
      mixer.clipAction(gltf.animations[0]).setEffectiveTimeScale(.82).play();
      mixers.push(mixer);
    }
    if (!mobile) {
      const distant = cloneSkeleton(gltf.scene);
      distant.position.set(-8, -16, -26);
      distant.rotation.set(.08, .5, -.08);
      distant.scale.setScalar(.32);
      distant.traverse(object => { if (object.isMesh) object.frustumCulled = false; });
      scene.add(distant);
      swimmers.push({ group: distant, origin: distant.position.clone(), phase: 1.6 });
      if (gltf.animations.length) {
        const mixer = new THREE.AnimationMixer(distant);
        mixer.clipAction(gltf.animations[0]).setEffectiveTimeScale(.95).play();
        mixers.push(mixer);
      }
    }
    onReady(''); markDirty();
  }, undefined, error => { console.error('Manta GLB failed to load', error); onReady('Không tải được model cá đuối. Nội dung khám phá vẫn hoạt động.'); });

  const inScene = () => scrollY < discover.offsetTop + innerHeight * .35;
  function queueFrame() {
    if (!frame && !disposed && !document.hidden && !lost && inScene()) {
      frame = requestAnimationFrame(render);
      if (perf) perf.pendingFrame = true;
    }
  }
  function stopFrame() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (perf) perf.pendingFrame = false;
  }
  function render(now) {
    frame = 0;
    if (perf) perf.pendingFrame = false;
    if (disposed || document.hidden || lost) return;
    const discoverTop = discover.offsetTop;
    if (!inScene()) return;
    const moved = Math.abs(scrollY - previousScroll) > .5;
    if (!dirty && !moved && (paused || now - lastFrame < (mobile ? 33 : 22))) {
      if (!paused) queueFrame();
      return;
    }
    const depth = clamp(scrollY / Math.max(1, discoverTop - innerHeight), 0, 1);
    if (depth > .06 && depth < .68) ensureReef();
    const dt = Math.min(clock.getDelta(), .05);
    lastFrame = now; previousScroll = scrollY; dirty = false;
    if (!paused) { elapsed += dt; mixers.forEach(m => m.update(dt)); }
    const surfaceDepth = smooth(clamp(depth / .50, 0, 1));
    const deepDepth = smooth(clamp((depth - .36) / .64, 0, 1));
    camera.position.set(mix(0, 2.5, surfaceDepth) + Math.sin(depth * Math.PI) * 1.3, mix(0, -52, depth), mix(19, 14, surfaceDepth));
    cameraTarget.set(mix(2.6, 1, surfaceDepth), camera.position.y - mix(-.4, 1.5, depth), -9 - depth * 2);
    camera.lookAt(cameraTarget);
    scene.fog.color.copy(shallowColor).lerp(deepColor, deepDepth);
    scene.background.copy(scene.fog.color);
    scene.fog.near = mix(12, 7, deepDepth);
    scene.fog.far = mix(90, 43, deepDepth);
    const lightFalloff = smooth(clamp(depth / .26, 0, 1));
    sun.intensity = mix(3.8, .7, lightFalloff) * (1 - deepDepth * .72);
    ambient.intensity = mix(2.3, .8, lightFalloff) * (1 - deepDepth * .55);
    sideLight.intensity = mix(75, 9, lightFalloff) * (1 - deepDepth * .7);
    shaftMaterial.opacity = .015 * (1 - surfaceDepth * .9);
    surface.material.uniforms.uFade.value = 1 - surfaceDepth;
    surface.material.uniforms.uTime.value = elapsed;
    floor.visible = depth > .12 && depth < .66;
    floorUniforms.uTime.value = elapsed;
    floorUniforms.uLight.value = 1 - deepDepth;
    if (!paused) {
      swimmers.forEach(({ group, origin, phase }, i) => {
        group.position.x = origin.x + Math.sin(elapsed * .19 + phase) * (i ? 1 : 1.2);
        group.position.y = origin.y + Math.sin(elapsed * .65 + phase) * .18;
        group.rotation.y += Math.sin(elapsed * .22 + phase) * .0003;
      });
      jellyfish.forEach((g, i) => { g.rotation.y = elapsed * .035; g.scale.y = 1 + Math.sin(elapsed * 1.2 + i) * .06; });

    }
    animateReef(elapsed, depth > .10 && depth < .66);
    if (pendingGpuQuery && gl.getQueryParameter(pendingGpuQuery, gl.QUERY_RESULT_AVAILABLE)) {
      if (!gl.getParameter(gpuTimer.GPU_DISJOINT_EXT)) {
        perf.gpuMs.push(gl.getQueryParameter(pendingGpuQuery, gl.QUERY_RESULT) / 1e6);
        if (perf.gpuMs.length > 60) perf.gpuMs.shift();
      }
      gl.deleteQuery(pendingGpuQuery);
      pendingGpuQuery = null;
    }
    let query = null;
    if (gpuTimer && !pendingGpuQuery && perf.frames % 20 === 0) {
      query = gl.createQuery();
      gl.beginQuery(gpuTimer.TIME_ELAPSED_EXT, query);
    }
    const renderStarted = perf ? performance.now() : 0;
    renderer.render(scene, camera);
    if (query) { gl.endQuery(gpuTimer.TIME_ELAPSED_EXT); pendingGpuQuery = query; }
    if (perf) {
      perf.frames++;
      perf.cpuMs.push(performance.now() - renderStarted);
      if (perf.cpuMs.length > 120) perf.cpuMs.shift();
    }
    if (!paused) queueFrame();
  }
  function resize() {
    mobile = innerWidth <= 700;
    camera.aspect = innerWidth / innerHeight;
    camera.fov = innerWidth < 700 ? 55 : 48;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.25 : 1.6));
    renderer.setSize(innerWidth, innerHeight);
    if (heroSwimmer) {
      heroSwimmer.origin.set(mobile ? .4 : 6.9, mobile ? -5.2 : -.7, 2);
      heroSwimmer.group.position.copy(heroSwimmer.origin);
      heroSwimmer.group.scale.setScalar(mobile ? .62 : 1.25);
    }
    markDirty();
  }
  function markDirty() { dirty = true; queueFrame(); }
  function onVisibilityChange() { if (document.hidden) stopFrame(); else markDirty(); }
  addEventListener('resize', resize);
  addEventListener('scroll', markDirty, { passive: true });
  document.addEventListener('visibilitychange', onVisibilityChange);
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);
  function onContextLost(event) { event.preventDefault(); lost = true; pendingGpuQuery = null; gpuTimer = null; if (perf) perf.gpuSupported = false; stopFrame(); onReady('Đồ họa tạm gián đoạn. Nội dung vẫn có thể khám phá.'); }
  function onContextRestored() { lost = false; onReady(''); markDirty(); }
  queueFrame();
  return {
    setPaused(value) { paused = value; if (paused) stopFrame(); markDirty(); },
    dispose() { disposed = true; stopFrame(); removeEventListener('resize', resize); removeEventListener('scroll', markDirty); document.removeEventListener('visibilitychange', onVisibilityChange); canvas.removeEventListener('webglcontextlost', onContextLost); canvas.removeEventListener('webglcontextrestored', onContextRestored); if (pendingGpuQuery) gl.deleteQuery(pendingGpuQuery); renderer.dispose(); if (perf) delete window.__oceanPerf; }
  };
}
