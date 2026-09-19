/**
 * Spider-Man: Web-Shooter AR Simulator
 * Computer Vision & Real-time Hand Gesture Web-Shooting Engine
 */

// --- Game Configuration & Constants ---
const CONFIG = {
  MAX_FLUID: 10,
  RELOAD_TIME_MS: 900,
  FIRE_COOLDOWN_MS: 280,
  TARGET_SPAWN_INTERVAL: 1800,
  COMBO_TIMEOUT_MS: 2600,
  WEB_MODES: {
    classic: { name: 'Classic Web', color: '#ffffff', glow: '#00f0ff', fluidCost: 1, damage: 100 },
    impact: { name: 'Impact Web', color: '#ffffff', glow: '#ff1e27', fluidCost: 2, damage: 250 },
    taser: { name: 'Venom Taser', color: '#ffea00', glow: '#00e5ff', fluidCost: 1, damage: 150 },
    bomb: { name: 'Web Grenade', color: '#ffffff', glow: '#00ff88', fluidCost: 3, damage: 400 }
  }
};

// --- Web Audio Procedural Sound Engine ---
class WebAudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playThwip(mode = 'classic') {
    if (this.muted) return;
    this.init();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // 1. Noise burst for web fluid escaping nozzle
    const bufferSize = ctx.sampleRate * 0.12;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.frequency.exponentialRampToValueAtTime(700, now + 0.12);
    filter.Q.value = 4.0;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.55, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    // 2. High-tension whip snap oscillator
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = mode === 'taser' ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(mode === 'taser' ? 1800 : 1200, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.14);

    oscGain.gain.setValueAtTime(0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  playHit() {
    if (this.muted) return;
    this.init();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  playSpiderSense() {
    if (this.muted) return;
    this.init();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.08);
    osc.frequency.linearRampToValueAtTime(650, now + 0.16);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playReload() {
    if (this.muted) return;
    this.init();
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Metallic click & pressurized hiss
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.06);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  playCombo(level) {
    if (this.muted) return;
    this.init();
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const baseFreq = 440 * Math.pow(1.15, Math.min(level, 8));

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.2);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }
}

// --- Main Spider-Man Game Simulator ---
class SpidermanWebSimulator {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.video = document.getElementById('webcamVideo');
    this.audio = new WebAudioEngine();

    // DOM Elements
    this.scoreDisplay = document.getElementById('scoreDisplay');
    this.highScoreDisplay = document.getElementById('highScoreDisplay');
    this.comboDisplay = document.getElementById('comboDisplay');
    this.fluidBar = document.getElementById('fluidBar');
    this.fluidPercent = document.getElementById('fluidPercent');
    this.reloadPrompt = document.getElementById('reloadPrompt');
    this.emptyBanner = document.getElementById('emptyCartridgeBanner');
    this.comicLayer = document.getElementById('comicPopupLayer');
    this.spiderSenseVignette = document.getElementById('spiderSenseVignette');
    this.cameraSetupScreen = document.getElementById('cameraSetupScreen');
    this.howToPlayModal = document.getElementById('howToPlayModal');

    // Game State
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('spidey_highscore') || '0', 10);
    this.combo = 1;
    this.lastHitTime = 0;
    this.webFluid = CONFIG.MAX_FLUID;
    this.isReloading = false;
    this.activeMode = 'classic';
    this.cameraActive = false;
    this.lastFireTime = 0;

    // Simulation Entities
    this.webs = [];
    this.targets = [];
    this.splats = [];
    this.particles = [];
    this.lastTargetSpawn = 0;

    // Hand Tracking State
    this.handsResults = null;
    this.isFistHolding = false;
    this.fistStartTime = 0;
    this.lastHandPose = 'idle';

    // Mouse/Touch Aim fallback
    this.mouseAim = { x: window.innerWidth / 2, y: window.innerHeight / 2, active: false };

    this.init();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.highScoreDisplay.textContent = this.highScore;
    this.setupEventListeners();
    this.setupMediaPipe();

    // Animation Loop
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setupEventListeners() {
    // Mode Buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        const targetBtn = e.currentTarget;
        targetBtn.classList.add('active');
        this.activeMode = targetBtn.dataset.mode;
        this.showComicPopup(window.innerWidth / 2, window.innerHeight - 120, CONFIG.WEB_MODES[this.activeMode].name.toUpperCase(), 'comic-combo');
      });
    });

    // Keyboard Shortcuts (1-4 for modes, R for reload)
    window.addEventListener('keydown', (e) => {
      if (e.key === '1') document.getElementById('btnModeClassic').click();
      if (e.key === '2') document.getElementById('btnModeImpact').click();
      if (e.key === '3') document.getElementById('btnModeTaser').click();
      if (e.key === '4') document.getElementById('btnModeBomb').click();
      if (e.key === 'r' || e.key === 'R') this.reloadFluid();
    });

    // Action Buttons
    document.getElementById('btnReload').addEventListener('click', () => this.reloadFluid());

    const btnSound = document.getElementById('btnSound');
    btnSound.addEventListener('click', () => {
      this.audio.muted = !this.audio.muted;
      btnSound.textContent = this.audio.muted ? '🔇 SOUND: OFF' : '🔊 SOUND: ON';
      if (!this.audio.muted) this.audio.init();
    });

    document.getElementById('btnHowToPlay').addEventListener('click', () => {
      this.howToPlayModal.classList.remove('hidden');
    });

    document.getElementById('btnCloseHowToPlay').addEventListener('click', () => {
      this.howToPlayModal.classList.add('hidden');
    });

    document.getElementById('btnGotIt').addEventListener('click', () => {
      this.howToPlayModal.classList.add('hidden');
    });

    // Camera / Play Buttons
    document.getElementById('btnStartCamera').addEventListener('click', () => {
      this.audio.init();
      this.startCamera();
    });

    document.getElementById('btnPlayWithoutCam').addEventListener('click', () => {
      this.audio.init();
      this.cameraSetupScreen.classList.add('hidden');
      this.cameraActive = false;
      this.mouseAim.active = true;
    });

    // Canvas click fallback / manual shooting
    this.canvas.addEventListener('mousemove', (e) => {
      this.mouseAim.x = e.clientX;
      this.mouseAim.y = e.clientY;
    });

    this.canvas.addEventListener('pointerdown', (e) => {
      this.audio.init();
      this.mouseAim.x = e.clientX;
      this.mouseAim.y = e.clientY;

      if (this.webFluid <= 0) {
        this.reloadFluid();
        return;
      }

      // Shoot from bottom center towards click position
      const originX = window.innerWidth / 2;
      const originY = window.innerHeight - 20;
      this.fireWeb(originX, originY, e.clientX, e.clientY);
    });
  }

  // --- Camera & MediaPipe Hands Integration ---
  async startCamera() {
    try {
      this.cameraSetupScreen.classList.add('hidden');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      this.video.srcObject = stream;
      await this.video.play();
      this.cameraActive = true;

      // Start MediaPipe Camera loop
      if (window.Camera && this.hands) {
        const camera = new window.Camera(this.video, {
          onFrame: async () => {
            if (this.cameraActive && this.hands) {
              await this.hands.send({ image: this.video });
            }
          },
          width: 1280,
          height: 720
        });
        camera.start();
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      alert('Camera access was blocked or is not supported. Switching to Mouse / Touch control mode!');
      this.cameraActive = false;
      this.mouseAim.active = true;
    }
  }

  setupMediaPipe() {
    if (!window.Hands) {
      console.warn('MediaPipe Hands not loaded yet. Retrying in 1s...');
      setTimeout(() => this.setupMediaPipe(), 1000);
      return;
    }

    this.hands = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.65,
      minTrackingConfidence: 0.6
    });

    this.hands.onResults((results) => {
      this.handsResults = results;
      this.processHandGestures(results);
    });
  }

  // --- Spider-Man Hand Gesture Recognition Math ---
  processHandGestures(results) {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      this.isFistHolding = false;
      return;
    }

    const now = performance.now();

    results.multiHandLandmarks.forEach((landmarks) => {
      // Mirrored coordinates for intuitive screen alignment
      const wrist = { x: (1 - landmarks[0].x) * this.canvas.width, y: landmarks[0].y * this.canvas.height };
      const indexTip = { x: (1 - landmarks[8].x) * this.canvas.width, y: landmarks[8].y * this.canvas.height };
      const middleTip = { x: (1 - landmarks[12].x) * this.canvas.width, y: landmarks[12].y * this.canvas.height };
      const ringTip = { x: (1 - landmarks[16].x) * this.canvas.width, y: landmarks[16].y * this.canvas.height };
      const pinkyTip = { x: (1 - landmarks[20].x) * this.canvas.width, y: landmarks[20].y * this.canvas.height };
      const thumbTip = { x: (1 - landmarks[4].x) * this.canvas.width, y: landmarks[4].y * this.canvas.height };

      // Joint reference points
      const indexMCP = { x: (1 - landmarks[5].x) * this.canvas.width, y: landmarks[5].y * this.canvas.height };
      const middleMCP = { x: (1 - landmarks[9].x) * this.canvas.width, y: landmarks[9].y * this.canvas.height };
      const ringMCP = { x: (1 - landmarks[13].x) * this.canvas.width, y: landmarks[13].y * this.canvas.height };
      const pinkyMCP = { x: (1 - landmarks[17].x) * this.canvas.width, y: landmarks[17].y * this.canvas.height };
      const palmCenter = { x: (1 - landmarks[9].x) * this.canvas.width, y: landmarks[9].y * this.canvas.height };

      // Euclidean distance helper
      const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

      // Hand scale reference (wrist to middle MCP)
      const handScale = dist(wrist, middleMCP);
      if (handScale < 25) return; // Hand too far or invalid

      // Finger Extension States
      const isIndexExtended = dist(wrist, indexTip) > handScale * 1.35;
      const isPinkyExtended = dist(wrist, pinkyTip) > handScale * 1.25;
      const isThumbExtended = dist(palmCenter, thumbTip) > handScale * 0.7;

      // Middle and Ring finger curled down to palm
      const isMiddleCurled = dist(palmCenter, middleTip) < handScale * 0.75 || dist(wrist, middleTip) < dist(wrist, middleMCP) * 1.15;
      const isRingCurled = dist(palmCenter, ringTip) < handScale * 0.75 || dist(wrist, ringTip) < dist(wrist, ringMCP) * 1.15;

      // 1. Check for Clenched Fist (Reload Gesture)
      const isFist = dist(palmCenter, indexTip) < handScale * 0.8 &&
                     dist(palmCenter, middleTip) < handScale * 0.8 &&
                     dist(palmCenter, ringTip) < handScale * 0.8 &&
                     dist(palmCenter, pinkyTip) < handScale * 0.8;

      if (isFist) {
        if (!this.isFistHolding) {
          this.isFistHolding = true;
          this.fistStartTime = now;
        } else if (now - this.fistStartTime > 600) {
          this.reloadFluid();
          this.isFistHolding = false;
        }
        return;
      } else {
        this.isFistHolding = false;
      }

      // 2. Check for Iconic Spider-Man Web Shooting Gesture!
      // Index & Pinky extended + Middle & Ring curled + Thumb out
      const isSpiderPose = isIndexExtended && isPinkyExtended && isMiddleCurled && isRingCurled && isThumbExtended;

      if (isSpiderPose) {
        if (now - this.lastFireTime > CONFIG.FIRE_COOLDOWN_MS) {
          this.lastFireTime = now;

          // Aim calculation: Vector from palm center through midway between index & pinky tips
          const aimMidX = (indexTip.x + pinkyTip.x) / 2;
          const aimMidY = (indexTip.y + pinkyTip.y) / 2;
          const dirX = aimMidX - palmCenter.x;
          const dirY = aimMidY - palmCenter.y;
          const len = Math.hypot(dirX, dirY) || 1;

          // Project web outward in aiming direction
          const targetDist = Math.max(window.innerWidth, window.innerHeight) * 0.85;
          const targetX = palmCenter.x + (dirX / len) * targetDist;
          const targetY = palmCenter.y + (dirY / len) * targetDist;

          this.fireWeb(palmCenter.x, palmCenter.y, targetX, targetY);
        }
      }
    });
  }

  // --- Web Shooting Mechanics ---
  fireWeb(originX, originY, targetX, targetY) {
    const modeConfig = CONFIG.WEB_MODES[this.activeMode];

    if (this.webFluid < modeConfig.fluidCost) {
      this.emptyBanner.classList.remove('hidden');
      this.audio.playHit();
      return;
    }

    // Deduct Fluid
    this.webFluid -= modeConfig.fluidCost;
    this.updateFluidUI();

    // Trigger Sound
    this.audio.playThwip(this.activeMode);

    // Comic "THWIP!" Text at hand
    this.showComicPopup(originX, originY - 40, 'THWIP!', 'comic-thwip');

    // Create Animated Web Line
    const webObj = {
      originX,
      originY,
      targetX,
      targetY,
      currentX: originX,
      currentY: originY,
      speed: 38,
      mode: this.activeMode,
      color: modeConfig.color,
      glow: modeConfig.glow,
      damage: modeConfig.damage,
      progress: 0,
      lifespan: 1.0,
      splatted: false,
      branches: []
    };

    // Generate natural web branch threads
    for (let i = 0; i < 6; i++) {
      webObj.branches.push({
        offset: (Math.random() - 0.5) * 45,
        curl: (Math.random() - 0.5) * 60,
        subProgress: Math.random() * 0.8
      });
    }

    this.webs.push(webObj);
  }

  reloadFluid() {
    if (this.webFluid === CONFIG.MAX_FLUID || this.isReloading) return;
    this.isReloading = true;
    this.audio.playReload();

    this.emptyBanner.classList.add('hidden');
    this.reloadPrompt.textContent = 'RELOADING CARTRIDGE...';
    this.reloadPrompt.classList.remove('hidden');

    let start = performance.now();
    const animateReload = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / CONFIG.RELOAD_TIME_MS, 1);
      this.webFluid = Math.floor(progress * CONFIG.MAX_FLUID);
      this.updateFluidUI();

      if (progress < 1) {
        requestAnimationFrame(animateReload);
      } else {
        this.webFluid = CONFIG.MAX_FLUID;
        this.isReloading = false;
        this.updateFluidUI();
        this.reloadPrompt.classList.add('hidden');
        this.showComicPopup(window.innerWidth / 2, 160, 'RELOADED!', 'comic-combo');
      }
    };
    requestAnimationFrame(animateReload);
  }

  updateFluidUI() {
    const percent = Math.round((this.webFluid / CONFIG.MAX_FLUID) * 100);
    this.fluidPercent.textContent = `${percent}%`;
    this.fluidBar.style.width = `${percent}%`;

    if (percent <= 20) {
      this.fluidBar.classList.add('low');
      this.emptyBanner.classList.remove('hidden');
      this.reloadPrompt.classList.remove('hidden');
      this.reloadPrompt.textContent = 'RELOAD READY! (CLICK OR CLENCH FIST)';
    } else {
      this.fluidBar.classList.remove('low');
      this.emptyBanner.classList.add('hidden');
      this.reloadPrompt.classList.add('hidden');
    }
  }

  // --- Villains & Target System ---
  spawnTarget() {
    const types = [
      { id: 'goblin', name: 'Green Goblin', score: 300, radius: 44, speed: 2.8, color: '#2ec4b6', hp: 1 },
      { id: 'bomb', name: 'Pumpkin Bomb', score: 150, radius: 28, speed: 2.0, color: '#ff7b00', hp: 1, danger: true },
      { id: 'tentacle', name: 'Doc Ock Arm', score: 250, radius: 36, speed: 1.8, color: '#6c757d', hp: 1 },
      { id: 'venom', name: 'Symbiote', score: 400, radius: 48, speed: 2.2, color: '#7b2cbf', hp: 2 }
    ];

    const type = types[Math.floor(Math.random() * types.length)];
    const fromLeft = Math.random() > 0.5;

    const target = {
      ...type,
      x: fromLeft ? -type.radius : this.canvas.width + type.radius,
      y: 120 + Math.random() * (this.canvas.height - 300),
      vx: (fromLeft ? 1 : -1) * (type.speed + Math.random() * 1.5),
      vy: (Math.random() - 0.5) * 1.8,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.05 + Math.random() * 0.05,
      trapped: false,
      trappedProgress: 0,
      alpha: 1.0
    };

    if (target.danger) {
      this.triggerSpiderSense();
    }

    this.targets.push(target);
  }

  triggerSpiderSense() {
    this.spiderSenseVignette.classList.add('active');
    this.audio.playSpiderSense();
    setTimeout(() => {
      this.spiderSenseVignette.classList.remove('active');
    }, 900);
  }

  // --- Comic Onomatopoeia Banner ---
  showComicPopup(x, y, text, styleClass) {
    const el = document.createElement('div');
    el.className = `comic-text-popup ${styleClass}`;
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.setProperty('--rot', `${(Math.random() - 0.5) * 26}deg`);
    this.comicLayer.appendChild(el);

    setTimeout(() => {
      el.remove();
    }, 850);
  }

  // --- Main Animation / Render Loop ---
  gameLoop(timestamp) {
    // 1. Clear Canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 2. Draw Camera Feed if active
    if (this.cameraActive && this.video.readyState >= 2) {
      this.ctx.save();
      // Mirror horizontal
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(this.video, -this.canvas.width, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();

      // Cinematic dark vignette overlay over video for Stark AR look
      this.ctx.fillStyle = 'rgba(3, 8, 17, 0.22)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      // Cosmic / Cyber spider web background grid when camera is off
      this.drawCyberGrid();
    }

    // 3. Update & Spawn Targets
    if (timestamp - this.lastTargetSpawn > CONFIG.TARGET_SPAWN_INTERVAL) {
      this.lastTargetSpawn = timestamp;
      this.spawnTarget();
    }
    this.updateAndDrawTargets();

    // 4. Update & Draw Web Shots
    this.updateAndDrawWebs();

    // 5. Update & Draw Splats & Particles
    this.updateAndDrawSplats();
    this.updateAndDrawParticles();

    // 6. Draw Stark HUD Crosshairs / Hand Reticles
    this.drawHandReticles();

    // Check Combo decay
    if (this.combo > 1 && timestamp - this.lastHitTime > CONFIG.COMBO_TIMEOUT_MS) {
      this.combo = 1;
      this.comboDisplay.textContent = 'x1';
    }

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  drawCyberGrid() {
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(0, 210, 255, 0.08)';
    this.ctx.lineWidth = 1;
    const step = 60;
    for (let x = 0; x < this.canvas.width; x += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }

    // Huge spider emblem watermark in background
    this.ctx.fillStyle = 'rgba(255, 30, 39, 0.04)';
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 180, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  // --- Hand Hologram Tracking Reticles ---
  drawHandReticles() {
    this.ctx.save();

    if (this.handsResults && this.handsResults.multiHandLandmarks) {
      this.handsResults.multiHandLandmarks.forEach((landmarks) => {
        const palmX = (1 - landmarks[9].x) * this.canvas.width;
        const palmY = landmarks[9].y * this.canvas.height;

        // Rotating Stark HUD reticle on user's palm
        const time = performance.now() * 0.003;
        this.ctx.strokeStyle = '#00f0ff';
        this.ctx.shadowColor = '#00f0ff';
        this.ctx.shadowBlur = 12;
        this.ctx.lineWidth = 2;

        // Outer Reticle Ring
        this.ctx.beginPath();
        this.ctx.arc(palmX, palmY, 32, time, time + Math.PI * 1.5);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(palmX, palmY, 24, -time, -time + Math.PI);
        this.ctx.stroke();

        // Cross lines
        this.ctx.beginPath();
        this.ctx.moveTo(palmX - 16, palmY);
        this.ctx.lineTo(palmX + 16, palmY);
        this.ctx.moveTo(palmX, palmY - 16);
        this.ctx.lineTo(palmX, palmY + 16);
        this.ctx.stroke();
      });
    } else if (this.mouseAim.active) {
      // Draw mouse cursor reticle
      const x = this.mouseAim.x;
      const y = this.mouseAim.y;
      this.ctx.strokeStyle = '#ff1e27';
      this.ctx.shadowColor = '#ff1e27';
      this.ctx.shadowBlur = 10;
      this.ctx.lineWidth = 2;

      this.ctx.beginPath();
      this.ctx.arc(x, y, 20, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(x - 28, y);
      this.ctx.lineTo(x + 28, y);
      this.ctx.moveTo(x, y - 28);
      this.ctx.lineTo(x, y + 28);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  // --- Dynamic Animated Web Rendering ---
  updateAndDrawWebs() {
    for (let i = this.webs.length - 1; i >= 0; i--) {
      const web = this.webs[i];

      // Interpolate web trajectory forward
      const dx = web.targetX - web.originX;
      const dy = web.targetY - web.originY;
      const totalDist = Math.hypot(dx, dy) || 1;

      web.progress += web.speed / totalDist;
      if (web.progress >= 1.0) {
        web.progress = 1.0;
        if (!web.splatted) {
          this.createWebSplat(web.targetX, web.targetY, web.mode);
          web.splatted = true;
        }
      }

      web.currentX = web.originX + dx * web.progress;
      web.currentY = web.originY + dy * web.progress;

      // Collision Detection with Enemies along web head
      this.checkWebCollisions(web);

      // Render Web Strands
      this.renderWebStrand(web);

      // Fade out after completion
      if (web.progress >= 1.0) {
        web.lifespan -= 0.04;
        if (web.lifespan <= 0) {
          this.webs.splice(i, 1);
        }
      }
    }
  }

  renderWebStrand(web) {
    this.ctx.save();
    this.ctx.globalAlpha = Math.max(0, web.lifespan);

    // Glow setup
    this.ctx.shadowColor = web.glow;
    this.ctx.shadowBlur = 14;
    this.ctx.strokeStyle = web.color;
    this.ctx.lineWidth = web.mode === 'impact' ? 5 : 3;

    // Main Web Line (Tension curve)
    const midX = (web.originX + web.currentX) / 2;
    const midY = (web.originY + web.currentY) / 2 - 15 * (1 - web.progress);

    this.ctx.beginPath();
    this.ctx.moveTo(web.originX, web.originY);
    this.ctx.quadraticCurveTo(midX, midY, web.currentX, web.currentY);
    this.ctx.stroke();

    // Branching Web Filaments (Signature realistic Spider-Man webbing)
    web.branches.forEach(branch => {
      const bx = web.originX + (web.currentX - web.originX) * branch.subProgress + branch.offset;
      const by = web.originY + (web.currentY - web.originY) * branch.subProgress + branch.curl;

      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(bx, by);
      this.ctx.lineTo(bx + branch.offset * 0.5, by + branch.curl * 0.5);
      this.ctx.stroke();
    });

    // Special FX for Venom Taser: Electric Sparks
    if (web.mode === 'taser') {
      this.ctx.strokeStyle = '#ffff00';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      let cx = web.originX;
      let cy = web.originY;
      const steps = 8;
      for (let s = 1; s <= steps; s++) {
        const p = (s / steps) * web.progress;
        const nx = web.originX + (web.currentX - web.originX) * p + (Math.random() - 0.5) * 16;
        const ny = web.originY + (web.currentY - web.originY) * p + (Math.random() - 0.5) * 16;
        this.ctx.lineTo(nx, ny);
      }
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  // --- Collision Detection ---
  checkWebCollisions(web) {
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const target = this.targets[i];
      if (target.trapped) continue;

      const dist = Math.hypot(web.currentX - target.x, web.currentY - target.y);
      if (dist < target.radius + 15) {
        // Target Hit!
        target.hp -= 1;
        this.audio.playHit();
        this.createWebSplat(target.x, target.y, web.mode);

        if (target.hp <= 0) {
          target.trapped = true;
          this.handleTargetDefeated(target);
        } else {
          this.showComicPopup(target.x, target.y, 'OUCH!', 'comic-hit');
        }

        // Trigger web impact burst
        this.createSparks(target.x, target.y, web.glow, 16);
      }
    }
  }

  handleTargetDefeated(target) {
    const points = target.score * this.combo;
    this.score += points;
    this.scoreDisplay.textContent = this.score;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.highScoreDisplay.textContent = this.highScore;
      localStorage.setItem('spidey_highscore', this.highScore.toString());
    }

    // Combo Upgrade
    this.combo += 1;
    this.comboDisplay.textContent = `x${this.combo}`;
    this.lastHitTime = performance.now();
    this.audio.playCombo(this.combo);

    // Comic Onomatopoeia Hit
    const comicWords = ['THWIP!', 'BAM!', 'POW!', 'SPLAT!', 'TRAPPED!'];
    const chosenWord = comicWords[Math.floor(Math.random() * comicWords.length)];
    this.showComicPopup(target.x, target.y, `${chosenWord} +${points}`, 'comic-hit');

    // Spawn web explosion particles
    this.createSparks(target.x, target.y, '#ffffff', 24);
  }

  // --- Update & Draw Targets ---
  updateAndDrawTargets() {
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];

      if (t.trapped) {
        // Wrapped in web & dissolves
        t.y += 2.5;
        t.alpha -= 0.025;
        if (t.alpha <= 0) {
          this.targets.splice(i, 1);
          continue;
        }
      } else {
        // Natural flying movement
        t.x += t.vx;
        t.wobble += t.wobbleSpeed;
        t.y += Math.sin(t.wobble) * 1.6;

        // Remove if off-screen
        if (t.vx > 0 && t.x > this.canvas.width + 100) {
          this.targets.splice(i, 1);
          continue;
        }
        if (t.vx < 0 && t.x < -100) {
          this.targets.splice(i, 1);
          continue;
        }
      }

      this.drawTargetSprite(t);
    }
  }

  drawTargetSprite(t) {
    this.ctx.save();
    this.ctx.globalAlpha = t.alpha;
    this.ctx.translate(t.x, t.y);

    if (t.id === 'goblin') {
      // Green Goblin on Glider
      this.ctx.fillStyle = '#2b9348';
      this.ctx.beginPath();
      this.ctx.arc(0, -10, 20, 0, Math.PI * 2);
      this.ctx.fill();

      // Yellow Eyes
      this.ctx.fillStyle = '#ffe600';
      this.ctx.beginPath();
      this.ctx.arc(-7, -12, 4, 0, Math.PI * 2);
      this.ctx.arc(7, -12, 4, 0, Math.PI * 2);
      this.ctx.fill();

      // High-Tech Metallic Glider
      this.ctx.fillStyle = '#495057';
      this.ctx.beginPath();
      this.ctx.moveTo(-36, 12);
      this.ctx.lineTo(36, 12);
      this.ctx.lineTo(0, 4);
      this.ctx.closePath();
      this.ctx.fill();

      // Jet exhaust flames
      this.ctx.fillStyle = '#ff7b00';
      this.ctx.beginPath();
      this.ctx.arc(-18, 16, 4 + Math.random() * 3, 0, Math.PI * 2);
      this.ctx.arc(18, 16, 4 + Math.random() * 3, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (t.id === 'bomb') {
      // Jack-O'-Lantern Pumpkin Bomb
      this.ctx.fillStyle = '#ff6b35';
      this.ctx.shadowColor = '#ff6b35';
      this.ctx.shadowBlur = 18;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 22, 0, Math.PI * 2);
      this.ctx.fill();

      // Glowing wicked eyes and grin
      this.ctx.fillStyle = '#ffe600';
      this.ctx.beginPath();
      this.ctx.moveTo(-9, -6); this.ctx.lineTo(-4, -6); this.ctx.lineTo(-6.5, -2);
      this.ctx.moveTo(9, -6); this.ctx.lineTo(4, -6); this.ctx.lineTo(6.5, -2);
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(0, 5, 8, 0, Math.PI);
      this.ctx.stroke();
    } else if (t.id === 'tentacle') {
      // Doc Ock Mechanical Claw
      this.ctx.fillStyle = '#6c757d';
      this.ctx.strokeStyle = '#adb5bd';
      this.ctx.lineWidth = 6;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 16, 0, Math.PI * 2);
      this.ctx.fill();

      // Red core camera eye
      this.ctx.fillStyle = '#ff0054';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 7, 0, Math.PI * 2);
      this.ctx.fill();

      // Pincers
      this.ctx.strokeStyle = '#495057';
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      this.ctx.moveTo(-16, -14); this.ctx.lineTo(-24, -22);
      this.ctx.moveTo(16, -14); this.ctx.lineTo(24, -22);
      this.ctx.moveTo(0, 16); this.ctx.lineTo(0, 26);
      this.ctx.stroke();
    } else if (t.id === 'venom') {
      // Venom Symbiote Head
      this.ctx.fillStyle = '#10002b';
      this.ctx.shadowColor = '#7b2cbf';
      this.ctx.shadowBlur = 16;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 26, 0, Math.PI * 2);
      this.ctx.fill();

      // Jagged white eyes
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.moveTo(-18, -8); this.ctx.quadraticCurveTo(-6, -18, -4, -4); this.ctx.closePath();
      this.ctx.moveTo(18, -8); this.ctx.quadraticCurveTo(6, -18, 4, -4); this.ctx.closePath();
      this.ctx.fill();

      // Sharp white fangs
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(-12, 10); this.ctx.lineTo(12, 10);
      this.ctx.stroke();
    }

    // If trapped, draw thick web cocoon over target!
    if (t.trapped) {
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.shadowColor = '#00f0ff';
      this.ctx.shadowBlur = 10;
      this.ctx.lineWidth = 3;

      for (let i = 0; i < 8; i++) {
        this.ctx.beginPath();
        const angle = (i / 8) * Math.PI * 2;
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(Math.cos(angle) * (t.radius + 10), Math.sin(angle) * (t.radius + 10));
        this.ctx.stroke();
      }

      this.ctx.beginPath();
      this.ctx.arc(0, 0, t.radius * 0.7, 0, Math.PI * 2);
      this.ctx.arc(0, 0, t.radius + 4, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  // --- Web Splats & Impact Effects ---
  createWebSplat(x, y, mode) {
    this.splats.push({
      x,
      y,
      radius: mode === 'bomb' ? 85 : (mode === 'impact' ? 65 : 45),
      mode,
      alpha: 1.0,
      rotation: Math.random() * Math.PI * 2
    });
  }

  updateAndDrawSplats() {
    for (let i = this.splats.length - 1; i >= 0; i--) {
      const s = this.splats[i];
      s.alpha -= 0.012;
      if (s.alpha <= 0) {
        this.splats.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = s.alpha;
      this.ctx.translate(s.x, s.y);
      this.ctx.rotate(s.rotation);

      this.ctx.strokeStyle = CONFIG.WEB_MODES[s.mode].color;
      this.ctx.shadowColor = CONFIG.WEB_MODES[s.mode].glow;
      this.ctx.shadowBlur = 12;
      this.ctx.lineWidth = 2;

      // Radial web spokes
      const spokes = 8;
      for (let r = 0; r < spokes; r++) {
        const a = (r / spokes) * Math.PI * 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(Math.cos(a) * s.radius, Math.sin(a) * s.radius);
        this.ctx.stroke();
      }

      // Concentric web spirals
      for (let c = 0.35; c <= 1.0; c += 0.35) {
        this.ctx.beginPath();
        for (let r = 0; r <= spokes; r++) {
          const a = (r / spokes) * Math.PI * 2;
          const px = Math.cos(a) * s.radius * c;
          const py = Math.sin(a) * s.radius * c;
          if (r === 0) this.ctx.moveTo(px, py);
          else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        this.ctx.stroke();
      }

      this.ctx.restore();
    }
  }

  createSparks(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        radius: 2 + Math.random() * 3,
        alpha: 1.0,
        decay: 0.03 + Math.random() * 0.03
      });
    }
  }

  updateAndDrawParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 8;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }
}

// Instantiate on load
window.addEventListener('DOMContentLoaded', () => {
  window.spideyGame = new SpidermanWebSimulator();
});
