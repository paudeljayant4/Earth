/* ============================================
   ASCENSION — SCRIPT.JS
   Full cinematic sci-fi experience
   ============================================ */

// ─── PERFORMANCE DETECT ───────────────────────
const isLowEnd = navigator.hardwareConcurrency <= 4 || window.devicePixelRatio < 1.5;
const isMobile = window.innerWidth < 768;

// ─── THREE.JS SETUP ───────────────────────────
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  antialias: !isLowEnd,
  alpha: false
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isLowEnd ? 1 : 2));
camera.position.set(0, 0, 7);

// ─── LIGHTS ───────────────────────────────────
const sun = new THREE.PointLight(0xffffff, 2.5, 500);
sun.position.set(12, 5, 10);
scene.add(sun);
const ambient = new THREE.AmbientLight(0x111133, 0.4);
scene.add(ambient);

// ─── TEXTURES ─────────────────────────────────
const loader = new THREE.TextureLoader();
const loadTex = (url, fallbackColor) => {
  const tex = loader.load(url, undefined, undefined, () => {
    // on error: create tiny colored canvas
  });
  return tex;
};

// Galaxy background
const galaxyTex = loadTex('galaxy.jpg');
scene.background = galaxyTex;

// Earth
const earthGeo = new THREE.SphereGeometry(2, isLowEnd ? 48 : 96, isLowEnd ? 48 : 96);
const earthMat = new THREE.MeshPhongMaterial({
  map: loadTex('earth_day.jpg'),
  emissiveMap: loadTex('earth_night.jpg'),
  emissive: new THREE.Color(0x223366),
  emissiveIntensity: 0.8,
  specular: new THREE.Color(0x223355),
  shininess: 30,
});
const earth = new THREE.Mesh(earthGeo, earthMat);
scene.add(earth);

// Atmosphere rim glow
const atmGeo = new THREE.SphereGeometry(2.15, 64, 64);
const atmMat = new THREE.MeshPhongMaterial({
  color: 0x0055ff,
  emissive: 0x0033aa,
  emissiveIntensity: 1.2,
  transparent: true,
  opacity: 0.12,
  side: THREE.BackSide,
});
const atmosphere = new THREE.Mesh(atmGeo, atmMat);
scene.add(atmosphere);

// Clouds
let clouds = null;
if (!isLowEnd) {
  const cloudsMat = new THREE.MeshPhongMaterial({
    map: loadTex('earth_clouds.png'),
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });
  clouds = new THREE.Mesh(new THREE.SphereGeometry(2.04, 64, 64), cloudsMat);
  scene.add(clouds);
}

// Orbital rings
function makeRing(radius, color, opacity) {
  const geo = new THREE.TorusGeometry(radius, 0.003, 2, 128);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
  return new THREE.Mesh(geo, mat);
}
const ring1 = makeRing(2.8, 0x00c3ff, 0.25);
ring1.rotation.x = Math.PI * 0.3;
const ring2 = makeRing(3.3, 0x1a8cff, 0.15);
ring2.rotation.x = -Math.PI * 0.2;
ring2.rotation.z = Math.PI * 0.1;
scene.add(ring1, ring2);

// Starfield particles
let particles = null;
const starCount = isLowEnd ? 800 : 2500;
const starGeo = new THREE.BufferGeometry();
const starArr = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i++) starArr[i] = (Math.random() - 0.5) * 200;
starGeo.setAttribute('position', new THREE.BufferAttribute(starArr, 3));
const starMat = new THREE.PointsMaterial({ size: isLowEnd ? 0.08 : 0.05, color: 0xaaccff });
particles = new THREE.Points(starGeo, starMat);
scene.add(particles);

// Light streak particles
let streaks = null;
if (!isLowEnd) {
  const sGeo = new THREE.BufferGeometry();
  const sCount = 120;
  const sArr = new Float32Array(sCount * 3);
  for (let i = 0; i < sCount; i++) {
    const phi = Math.random() * Math.PI * 2;
    const theta = Math.acos(2 * Math.random() - 1);
    const r = 4 + Math.random() * 30;
    sArr[i*3] = r * Math.sin(theta) * Math.cos(phi);
    sArr[i*3+1] = r * Math.sin(theta) * Math.sin(phi);
    sArr[i*3+2] = r * Math.cos(theta);
  }
  sGeo.setAttribute('position', new THREE.BufferAttribute(sArr, 3));
  streaks = new THREE.Points(sGeo, new THREE.PointsMaterial({ size: 0.04, color: 0x66e0ff, transparent: true, opacity: 0.5 }));
  scene.add(streaks);
}

// ─── POST PROCESSING ──────────────────────────
let composer = null;
if (!isLowEnd) {
  composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));
  const bloom = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.8, 0.4, 0.2
  );
  composer.addPass(bloom);
  window._bloom = bloom;
}

// ─── FILM GRAIN ───────────────────────────────
const grainCanvas = document.getElementById('grainCanvas');
const gCtx = grainCanvas.getContext('2d');
function resizeGrain() {
  grainCanvas.width = window.innerWidth;
  grainCanvas.height = window.innerHeight;
}
resizeGrain();
function renderGrain() {
  const w = grainCanvas.width, h = grainCanvas.height;
  const img = gCtx.createImageData(w, h);
  const data = img.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.random() * 255;
    data[i] = data[i+1] = data[i+2] = v;
    data[i+3] = 255;
  }
  gCtx.putImageData(img, 0, 0);
}

// ─── RADAR CANVAS ─────────────────────────────
const radarCanvas = document.getElementById('radarCanvas');
const rCtx = radarCanvas.getContext('2d');
let radarAngle = 0;
let radarBlips = [];
function updateRadar() {
  const w = radarCanvas.width, h = radarCanvas.height;
  const cx = w/2, cy = h/2, r = w/2 - 4;
  rCtx.clearRect(0, 0, w, h);

  // BG
  rCtx.beginPath();
  rCtx.arc(cx, cy, r, 0, Math.PI * 2);
  rCtx.fillStyle = 'rgba(0,20,40,0.85)';
  rCtx.fill();

  // Circles
  rCtx.strokeStyle = 'rgba(0,195,255,0.15)';
  rCtx.lineWidth = 0.5;
  [0.25, 0.5, 0.75, 1].forEach(f => {
    rCtx.beginPath();
    rCtx.arc(cx, cy, r * f, 0, Math.PI * 2);
    rCtx.stroke();
  });
  // Crosshairs
  rCtx.beginPath();
  rCtx.moveTo(cx - r, cy); rCtx.lineTo(cx + r, cy);
  rCtx.moveTo(cx, cy - r); rCtx.lineTo(cx, cy + r);
  rCtx.strokeStyle = 'rgba(0,195,255,0.1)';
  rCtx.stroke();

  // Sweep gradient
  const grad = rCtx.createConicalGradient
    ? rCtx.createConicalGradient(cx, cy, radarAngle - 1.2, radarAngle)
    : null;

  rCtx.save();
  rCtx.translate(cx, cy);
  const sweepGrad = rCtx.createLinearGradient(0, 0, r * Math.cos(radarAngle), r * Math.sin(radarAngle));
  sweepGrad.addColorStop(0, 'rgba(0,195,255,0.5)');
  sweepGrad.addColorStop(1, 'rgba(0,195,255,0)');
  rCtx.rotate(radarAngle);
  rCtx.beginPath();
  rCtx.moveTo(0, 0);
  rCtx.arc(0, 0, r, -0.6, 0);
  rCtx.closePath();
  rCtx.fillStyle = 'rgba(0,195,255,0.12)';
  rCtx.fill();

  rCtx.beginPath();
  rCtx.moveTo(0, 0);
  rCtx.lineTo(r, 0);
  rCtx.strokeStyle = 'rgba(0,195,255,0.9)';
  rCtx.lineWidth = 1;
  rCtx.stroke();
  rCtx.restore();

  // Blips
  radarBlips = radarBlips.filter(b => b.age < 120);
  radarBlips.forEach(b => {
    const alpha = Math.max(0, 1 - b.age / 120);
    rCtx.beginPath();
    rCtx.arc(cx + b.x * r, cy + b.y * r, 2.5, 0, Math.PI * 2);
    rCtx.fillStyle = `rgba(0,255,150,${alpha})`;
    rCtx.shadowBlur = 6;
    rCtx.shadowColor = 'rgba(0,255,150,0.8)';
    rCtx.fill();
    rCtx.shadowBlur = 0;
    b.age++;
  });

  // Add new blip randomly
  if (Math.random() < 0.02) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 0.2 + Math.random() * 0.75;
    radarBlips.push({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, age: 0 });
    document.getElementById('targetCount').textContent = radarBlips.length;
  }

  radarAngle += 0.03;
  if (radarAngle > Math.PI * 2) radarAngle = 0;

  // Clip to circle
  rCtx.save();
  rCtx.beginPath();
  rCtx.arc(cx, cy, r, 0, Math.PI * 2);
  rCtx.clip();
  rCtx.restore();
}

// ─── UTC CLOCK ────────────────────────────────
function updateClock() {
  const now = new Date();
  const h = String(now.getUTCHours()).padStart(2, '0');
  const m = String(now.getUTCMinutes()).padStart(2, '0');
  const s = String(now.getUTCSeconds()).padStart(2, '0');
  document.getElementById('utcClock').textContent = `${h}:${m}:${s} UTC`;
}

// ─── POPULATION COUNTER ───────────────────────
let popBase = 8045311447;
function updatePop() {
  popBase += Math.floor(Math.random() * 3);
  document.getElementById('popCounter').textContent = popBase.toLocaleString();
}

// ─── SCAN PROGRESS ────────────────────────────
let scanProgress = 0;
function updateScan() {
  if (scanProgress < 100) {
    scanProgress += 0.15;
    const pct = Math.min(100, Math.floor(scanProgress));
    document.getElementById('scanPct').textContent = pct + '%';
    document.getElementById('scanBar').style.width = pct + '%';
  }
}

// ─── CONSOLE LOG ──────────────────────────────
const consoleMessages = [
  '> INITIALIZING SCAN PROTOCOL...',
  '> BIOSPHERE ANALYSIS ACTIVE',
  '> CLOUD LAYER: NOMINAL',
  '> OCEAN MASS DETECTED — 71.2%',
  '> CIVILIZATION SIGNALS ACTIVE',
  '> ENERGY EMISSIONS CATALOGUED',
  '> NEURAL NETWORK DENSITY: HIGH',
  '> ELECTROMAGNETIC FIELD: STABLE',
  '> AI CORE UPLINK ESTABLISHED',
  '> SCANNING SURFACE STRUCTURES...',
  '> ANOMALOUS SIGNAL DETECTED',
  '> CROSS-REFERENCING DATABASE...',
  '> DESIGNATION CONFIRMED: EARTH',
  '> EVOLUTION INDEX: ACCELERATING',
  '> PHASE TRANSITION IMMINENT...',
];
let consoleIdx = 0;
const logEl = document.getElementById('consoleLog');

function addConsoleLog() {
  if (consoleIdx >= consoleMessages.length) return;
  const line = document.createElement('div');
  line.style.opacity = '0';
  line.textContent = '';
  logEl.appendChild(line);
  const msg = consoleMessages[consoleIdx++];
  let charIdx = 0;
  const type = setInterval(() => {
    if (charIdx < msg.length) {
      line.textContent += msg[charIdx++];
      line.style.opacity = '1';
    } else {
      clearInterval(type);
      // Scroll
      logEl.scrollTop = logEl.scrollHeight;
      // Glitch occasionally
      if (Math.random() < 0.3) {
        const saved = line.textContent;
        line.style.color = '#ff3b3b';
        setTimeout(() => {
          line.style.color = '';
          line.textContent = saved;
        }, 80);
      }
    }
  }, 35);
}

// ─── AUDIO SYSTEM ─────────────────────────────
// Procedural audio using Web Audio API (no external file required)
let audioCtx = null;
let masterGain = null;
let droneOscs = [];

function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(audioCtx.destination);

  // Deep drone
  const droneFreqs = [40, 60, 80, 120, 160];
  droneFreqs.forEach(freq => {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = freq < 80 ? 'sine' : 'triangle';
    osc.frequency.value = freq;
    g.gain.value = freq < 80 ? 0.3 : 0.06;
    osc.connect(g).connect(masterGain);
    osc.start();
    droneOscs.push(osc);
  });

  // Pulse
  startPulse();

  // Fade in
  masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 3);
}

function startPulse() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const env = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 240 + Math.random() * 80;
  env.gain.setValueAtTime(0.12, audioCtx.currentTime);
  env.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
  osc.connect(env).connect(masterGain);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.8);
  setTimeout(startPulse, 1800 + Math.random() * 2000);
}

function triggerBassHit() {
  if (!audioCtx) return;
  const bass = audioCtx.createOscillator();
  const env = audioCtx.createGain();
  bass.type = 'sine';
  bass.frequency.setValueAtTime(60, audioCtx.currentTime);
  bass.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 1.5);
  env.gain.setValueAtTime(1.5, audioCtx.currentTime);
  env.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2);
  bass.connect(env).connect(audioCtx.destination);
  bass.start();
  bass.stop(audioCtx.currentTime + 2);
}

function buildUpAudio() {
  if (!audioCtx) return;
  // Rise
  droneOscs.forEach(osc => {
    osc.frequency.linearRampToValueAtTime(
      osc.frequency.value * 1.5,
      audioCtx.currentTime + 8
    );
  });
  masterGain.gain.linearRampToValueAtTime(0.7, audioCtx.currentTime + 6);
}

function fadeAudio() {
  if (!audioCtx) return;
  masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 5);
}

// ─── TIMELINE SCENES ──────────────────────────
const mainText = document.getElementById('mainText');

function showText(text, classes = [], duration = 3200) {
  return new Promise(resolve => {
    mainText.className = '';
    mainText.style.opacity = '0';
    setTimeout(() => {
      mainText.textContent = text;
      classes.forEach(c => mainText.classList.add(c));
      mainText.style.opacity = '1';
      setTimeout(() => {
        mainText.style.opacity = '0';
        setTimeout(resolve, 1500);
      }, duration);
    }, 600);
  });
}

function showTextNoFade(text, classes = []) {
  mainText.className = '';
  mainText.style.opacity = '0';
  setTimeout(() => {
    mainText.textContent = text;
    classes.forEach(c => mainText.classList.add(c));
    mainText.style.opacity = '1';
  }, 600);
}

function glitchText() {
  mainText.classList.add('glitch');
  setTimeout(() => mainText.classList.remove('glitch'), 500);
}

function triggerScanSweep() {
  const sweep = document.getElementById('scanSweep');
  sweep.classList.remove('sweeping');
  void sweep.offsetWidth;
  sweep.classList.add('sweeping');
}

let cameraShakeActive = false;
let shakeIntensity = 0;
function triggerCameraShake(intensity, duration) {
  shakeIntensity = intensity;
  cameraShakeActive = true;
  setTimeout(() => { cameraShakeActive = false; }, duration);
}

let targetZoom = 7;
let currentZoom = 7;

async function runTimeline() {
  const hud = document.getElementById('hud');

  // Scene 1: already shown in intro (SIGNAL DETECTED)
  // Wait for intro fade
  await delay(1500);

  // Scene 2: Earth reveal — show HUD
  triggerScanSweep();
  hud.classList.remove('hidden');
  hud.classList.add('visible');

  // Start console typing
  const consoleInterval = setInterval(addConsoleLog, 2200);

  await showText('DESIGNATION: EARTH', ['cyan-text'], 2500);
  await showText('STATUS: EVOLVING CIVILIZATION', [], 2500);

  // Scene 3: Humanity data stream
  targetZoom = 5.5;
  buildUpAudio();
  await showText('8,000,000,000 UNITS', ['small-data'], 2200);
  await showText('RAPID TECHNOLOGICAL GROWTH', ['small-data'], 2000);
  glitchText();
  await showText('UNSTABLE ENVIRONMENTAL SYSTEMS', ['small-data', 'warn'], 2000);
  await showText('EXPONENTIAL INTELLIGENCE CURVE', ['small-data'], 2200);

  // Scene 4: Transformation
  targetZoom = 4.5;
  triggerScanSweep();
  atmMat.emissiveIntensity = 1.8;
  await showText('THEY CREATE.', ['cyan-text'], 2000);
  await showText('THEY INNOVATE.', ['cyan-text'], 2000);
  await showText('THEY TRANSCEND.', ['cyan-text'], 2500);

  // Scene 5: ASCENSION DROP
  await delay(500);
  triggerBassHit();
  triggerCameraShake(0.25, 1200);
  document.body.classList.add('bloom-up');
  if (window._bloom) window._bloom.strength = 2.0;
  atmMat.emissiveIntensity = 3.0;
  glitchText();
  showTextNoFade('NEXT PHASE: ASCENSION', ['big-text', 'cyan-text']);
  triggerScanSweep();
  await delay(200);
  glitchText();
  await delay(3000);
  document.body.classList.remove('bloom-up');
  if (window._bloom) window._bloom.strength = 0.8;

  // Scene 6: Future message
  clearInterval(consoleInterval);
  targetZoom = 4.0;
  fadeAudio();
  await showText('THE FUTURE IS NOT GIVEN.', [], 3000);
  await showText('IT IS ENGINEERED.', ['cyan-text'], 4000);

  // End frame
  mainText.style.opacity = '0';
  const endFrame = document.createElement('div');
  endFrame.id = 'endFrame';
  endFrame.textContent = 'YEAR 01 : THE AWAKENING';
  document.body.appendChild(endFrame);
  await delay(1000);
  endFrame.classList.add('visible');

  // Fade everything out
  await delay(4000);
  document.body.style.transition = 'opacity 3s ease';
  document.body.style.opacity = '0';
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── ANIMATE LOOP ─────────────────────────────
let frameCount = 0;
function animate() {
  requestAnimationFrame(animate);
  frameCount++;

  const t = Date.now() * 0.001;

  // Earth rotation
  earth.rotation.y += 0.002;
  atmosphere.rotation.y += 0.002;
  if (clouds) clouds.rotation.y += 0.003;

  // Particles
  if (particles) particles.rotation.y += 0.0001;
  if (streaks) {
    streaks.rotation.x += 0.0003;
    streaks.rotation.y += 0.0002;
  }

  // Rings pulse
  ring1.rotation.z += 0.0008;
  ring2.rotation.z -= 0.0005;
  ring1.material.opacity = 0.15 + Math.sin(t * 1.2) * 0.1;
  ring2.material.opacity = 0.08 + Math.sin(t * 0.8 + 1) * 0.07;

  // Atmosphere pulse
  atmMat.emissiveIntensity += (Math.sin(t * 0.5) * 0.1);

  // Smooth zoom
  currentZoom += (targetZoom - currentZoom) * 0.008;
  camera.position.z = currentZoom;

  // Camera shake
  if (cameraShakeActive) {
    camera.position.x = (Math.random() - 0.5) * shakeIntensity;
    camera.position.y = (Math.random() - 0.5) * shakeIntensity;
  } else {
    camera.position.x *= 0.85;
    camera.position.y *= 0.85;
  }

  // HUD updates every 30 frames
  if (frameCount % 2 === 0) {
    updateRadar();
  }
  if (frameCount % 30 === 0) {
    updateClock();
    updatePop();
    updateScan();
  }

  // Film grain every 3 frames (not on mobile)
  if (!isMobile && frameCount % 3 === 0) {
    renderGrain();
  }

  if (composer) composer.render();
  else renderer.render(scene, camera);
}
animate();

// ─── INTRO SCREEN ─────────────────────────────
const introScreen = document.getElementById('introScreen');
let started = false;

function startExperience() {
  if (started) return;
  started = true;

  // Fullscreen
  try {
    document.documentElement.requestFullscreen?.();
  } catch(e) {}

  // Audio
  initAudio();

  // Fade out intro
  introScreen.classList.add('fade-out');
  setTimeout(() => {
    introScreen.style.display = 'none';
    runTimeline();
  }, 1200);
}

introScreen.addEventListener('click', startExperience);
introScreen.addEventListener('touchend', startExperience, { passive: true });

// ─── RESIZE ───────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (composer) composer.setSize(window.innerWidth, window.innerHeight);
  resizeGrain();
});
