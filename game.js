const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
<<<<<<< ours

const angleInput = document.getElementById("angle");
const powerInput = document.getElementById("power");
const garbageSelect = document.getElementById("garbageType");
const throwBtn = document.getElementById("throwBtn");
const resetBtn = document.getElementById("resetBtn");

const angleValue = document.getElementById("angleValue");
const powerValue = document.getElementById("powerValue");
const gravityValue = document.getElementById("gravityValue");
const windValue = document.getElementById("windValue");
const gustValue = document.getElementById("gustValue");
const dragValue = document.getElementById("dragValue");
const massValue = document.getElementById("massValue");
const levelInfo = document.getElementById("levelInfo");
const physicsTip = document.getElementById("physicsTip");
const throwsLeft = document.getElementById("throwsLeft");
const scoreValue = document.getElementById("scoreValue");
const streakValue = document.getElementById("streakValue");
const status = document.getElementById("status");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("startBtn");

const office = {
  floorY: 440,
  leftWall: 60,
  rightWall: 840,
  ceiling: 60,
};

const garbageOptions = [
  { name: "Crumpled Paper", radius: 12, mass: 0.2, drag: 0.08, shape: "circle" },
  { name: "Plastic Cup", radius: 16, mass: 0.35, drag: 0.12, shape: "circle" },
  { name: "Snack Box", width: 26, height: 18, mass: 0.5, drag: 0.1, shape: "box" },
  { name: "Staple Jar", radius: 10, mass: 0.6, drag: 0.05, shape: "circle" },
];

const physicsTips = [
  "Projectile motion depends on horizontal and vertical velocity components.",
  "Wind adds sideways acceleration—try compensating by changing your angle.",
  "Higher mass reduces the impact of drag from air resistance.",
  "Drag increases with speed, so strong throws curve more than you expect.",
  "Moving targets require leading the motion—aim where the bin will be!",
];

const levels = [
  {
    name: "Lobby Warm-up",
    bin: { width: 60, height: 70, speed: 0.6 },
    gravity: 9.8,
    windBase: 0.3,
    windGust: 0.8,
  },
  {
    name: "Conference Chaos",
    bin: { width: 50, height: 60, speed: 1.1 },
    gravity: 10.5,
    windBase: 0.8,
    windGust: 1.4,
  },
  {
    name: "Copy Room Crosswind",
    bin: { width: 42, height: 55, speed: 1.4 },
    gravity: 11,
    windBase: 1.2,
    windGust: 1.8,
  },
  {
    name: "Corner Office Draft",
    bin: { width: 38, height: 52, speed: 1.8 },
    gravity: 11.5,
    windBase: 1.6,
    windGust: 2.2,
  },
];

let currentLevel = 0;
let throwCount = 0;
let projectile = null;
let bin = null;
let wind = 0;
let gust = 0;
let gustTimer = 0;
let lastTime = 0;
let statusTimeout = null;
let score = 0;
let streak = 0;
let particles = [];
let gameActive = false;

const emitter = {
  x: office.leftWall + 20,
  y: office.floorY - 10,
};

const maxThrows = 3;

function populateGarbage() {
  garbageOptions.forEach((item, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = item.name;
    garbageSelect.appendChild(option);
  });
}

function initLevel() {
  throwCount = 0;
  projectile = null;
  particles = [];
  const level = levels[currentLevel];
  bin = {
    x: office.rightWall - 100,
    y: office.floorY - level.bin.height,
    width: level.bin.width,
    height: level.bin.height,
    speed: level.bin.speed,
    direction: -1,
  };
  wind = level.windBase * (Math.random() > 0.5 ? 1 : -1);
  gust = 0;
  gustTimer = 0;
  updateUI();
  setStatus("Take your shot!");
}

function resetLevel(manual = false) {
  if (manual) {
    streak = 0;
  }
  initLevel();
}

function updateUI() {
  const level = levels[currentLevel];
  angleValue.textContent = angleInput.value;
  powerValue.textContent = powerInput.value;
  gravityValue.textContent = level.gravity.toFixed(1);
  windValue.textContent = wind.toFixed(2);
  gustValue.textContent = gust === 0 ? "None" : `${gust > 0 ? "→" : "←"} ${Math.abs(gust).toFixed(2)}`;
  const selected = garbageOptions[Number(garbageSelect.value)];
  dragValue.textContent = selected.drag.toFixed(2);
  massValue.textContent = selected.mass.toFixed(2);
  levelInfo.textContent = `Level ${currentLevel + 1}: ${level.name}. Bin size ${level.bin.width}x${level.bin.height}, speed ${level.bin.speed.toFixed(1)}.`;
  physicsTip.textContent = physicsTips[currentLevel % physicsTips.length];
  throwsLeft.textContent = Math.max(maxThrows - throwCount, 0);
  scoreValue.textContent = score.toString();
  streakValue.textContent = streak.toString();
}

function setStatus(message, timeout = 0) {
  status.textContent = message;
  if (statusTimeout) {
    clearTimeout(statusTimeout);
  }
  if (timeout > 0) {
    statusTimeout = setTimeout(() => {
      status.textContent = "";
      statusTimeout = null;
    }, timeout);
  }
}

function createProjectile() {
  const angleRad = (Number(angleInput.value) * Math.PI) / 180;
  const speed = Number(powerInput.value);
  const selected = garbageOptions[Number(garbageSelect.value)];
  const vx = Math.cos(angleRad) * speed;
  const vy = -Math.sin(angleRad) * speed;
  return {
    ...selected,
    x: emitter.x,
    y: emitter.y,
    vx,
    vy,
    rotation: 0,
    spin: (Math.random() * 0.08 + 0.04) * (Math.random() > 0.5 ? 1 : -1),
  };
}

function updateProjectile(delta) {
  if (!projectile) return;
  const level = levels[currentLevel];
  const timeScale = delta / 16.67;
  const drag = projectile.drag;
  const dragForceX = -drag * projectile.vx * Math.abs(projectile.vx);
  const dragForceY = -drag * projectile.vy * Math.abs(projectile.vy);
  const ax = (wind + gust + dragForceX) / projectile.mass;
  const ay = level.gravity + dragForceY / projectile.mass;

  projectile.vx += ax * timeScale;
  projectile.vy += ay * timeScale;
  projectile.x += projectile.vx * timeScale;
  projectile.y += projectile.vy * timeScale;
  projectile.rotation += projectile.spin;

  if (projectile.y > office.floorY - 5) {
    setStatus("Missed! Adjust your throw and try again.", 2000);
    projectile = null;
    throwCount += 1;
    streak = 0;
    if (throwCount >= maxThrows) {
      setStatus("Three throws used. Reset the level for another try.");
    }
  }
}

function updateBin(delta) {
  const timeScale = delta / 16.67;
  bin.x += bin.speed * bin.direction * timeScale;
  if (bin.x < office.leftWall + 140) {
    bin.direction = 1;
  }
  if (bin.x + bin.width > office.rightWall - 20) {
    bin.direction = -1;
  }
}

function updateGust(delta) {
  const level = levels[currentLevel];
  gustTimer += delta;
  if (gustTimer > 1800) {
    gustTimer = 0;
    gust = (Math.random() * level.windGust) * (Math.random() > 0.5 ? 1 : -1);
  }
  if (gust !== 0) {
    gust *= 0.99;
    if (Math.abs(gust) < 0.05) {
      gust = 0;
    }
  }
}

function checkScoring() {
  if (!projectile) return;
  const hitX = projectile.x > bin.x && projectile.x < bin.x + bin.width;
  const hitY = projectile.y > bin.y && projectile.y < bin.y + bin.height;
  if (hitX && hitY) {
    setStatus("Score! Great physics intuition.", 1500);
    streak += 1;
    score += 100 + streak * 25;
    spawnConfetti(projectile.x, projectile.y);
    projectile = null;
    currentLevel = Math.min(currentLevel + 1, levels.length - 1);
    initLevel();
  }
}

function drawOffice() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  skyGradient.addColorStop(0, "#dbeafe");
  skyGradient.addColorStop(0.45, "#e0f2fe");
  skyGradient.addColorStop(0.7, "#fef3c7");
  skyGradient.addColorStop(1, "#fde68a");
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#d1d5db";
  ctx.fillRect(0, office.floorY, canvas.width, canvas.height - office.floorY);

  ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
  for (let i = office.floorY; i < canvas.height; i += 12) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(canvas.width, i);
    ctx.stroke();
  }

  ctx.fillStyle = "#fef3c7";
  ctx.fillRect(office.leftWall - 40, office.ceiling - 10, 120, 60);
  ctx.fillStyle = "#b45309";
  ctx.fillRect(office.leftWall - 20, office.ceiling + 10, 80, 20);
  ctx.fillStyle = "#a3e635";
  ctx.beginPath();
  ctx.ellipse(office.leftWall + 15, office.ceiling + 10, 20, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#94a3b8";
  ctx.fillRect(office.rightWall - 160, office.ceiling, 110, 80);
  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(office.rightWall - 150, office.ceiling + 10, 90, 60);

  ctx.fillStyle = "#0f172a";
  ctx.globalAlpha = 0.2;
  ctx.fillRect(office.rightWall - 145, office.ceiling + 16, 80, 6);
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#f97316";
  ctx.beginPath();
  ctx.arc(office.rightWall - 50, office.ceiling + 40, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fb923c";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(office.rightWall - 60, office.ceiling + 40);
  ctx.lineTo(office.rightWall - 80, office.ceiling + 40);
  ctx.stroke();

  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(emitter.x, emitter.y);
  ctx.lineTo(emitter.x + 40, emitter.y - 20);
  ctx.stroke();

  ctx.fillStyle = "#0f172a";
  ctx.font = "14px Segoe UI";
  ctx.fillText("Launch desk", emitter.x - 15, emitter.y + 20);

  ctx.fillStyle = "rgba(15, 23, 42, 0.15)";
  ctx.fillRect(0, office.floorY - 20, canvas.width, 4);
}

function drawBin() {
  const binGradient = ctx.createLinearGradient(bin.x, bin.y, bin.x, bin.y + bin.height);
  binGradient.addColorStop(0, "#111827");
  binGradient.addColorStop(1, "#374151");
  ctx.fillStyle = binGradient;
  ctx.fillRect(bin.x, bin.y, bin.width, bin.height);
  ctx.fillStyle = "#4b5563";
  ctx.fillRect(bin.x - 6, bin.y, bin.width + 12, 8);
  ctx.fillStyle = "rgba(248, 250, 252, 0.2)";
  ctx.fillRect(bin.x + 4, bin.y + 6, bin.width - 8, bin.height - 18);
  ctx.fillStyle = "#f9fafb";
  ctx.fillText("BIN", bin.x + bin.width / 2 - 12, bin.y + bin.height / 2);
}

function drawProjectile() {
  if (!projectile) return;
  ctx.shadowColor = "rgba(124, 58, 237, 0.5)";
  ctx.shadowBlur = 12;
  ctx.save();
  ctx.translate(projectile.x, projectile.y);
  ctx.rotate(projectile.rotation);
  const projectileGradient = ctx.createRadialGradient(0, 0, 2, 0, 0, 18);
  projectileGradient.addColorStop(0, "#a78bfa");
  projectileGradient.addColorStop(1, "#5b21b6");
  ctx.fillStyle = projectileGradient;
  if (projectile.shape === "circle") {
    ctx.beginPath();
    ctx.arc(0, 0, projectile.radius, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(-projectile.width / 2, -projectile.height / 2, projectile.width, projectile.height);
  }
  ctx.restore();
  ctx.shadowBlur = 0;
}

function drawWind() {
  const arrowX = office.leftWall + 80;
  const arrowY = office.ceiling + 40;
  const totalWind = wind + gust;
  ctx.strokeStyle = "#0ea5e9";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(arrowX, arrowY);
  ctx.lineTo(arrowX + totalWind * 20, arrowY);
  ctx.stroke();
  ctx.fillStyle = "#0ea5e9";
  ctx.beginPath();
  ctx.arc(arrowX + totalWind * 20, arrowY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0f172a";
  ctx.fillText("Wind", arrowX - 10, arrowY - 10);
}

function drawTrajectoryPreview() {
  if (projectile || throwCount >= maxThrows) return;
  const angleRad = (Number(angleInput.value) * Math.PI) / 180;
  const speed = Number(powerInput.value);
  const selected = garbageOptions[Number(garbageSelect.value)];
  let previewX = emitter.x;
  let previewY = emitter.y;
  let previewVx = Math.cos(angleRad) * speed;
  let previewVy = -Math.sin(angleRad) * speed;
  const level = levels[currentLevel];
  ctx.strokeStyle = "rgba(124, 58, 237, 0.35)";
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(previewX, previewY);
  for (let i = 0; i < 60; i += 1) {
    const dragForceX = -selected.drag * previewVx * Math.abs(previewVx);
    const dragForceY = -selected.drag * previewVy * Math.abs(previewVy);
    const ax = (wind + dragForceX) / selected.mass;
    const ay = level.gravity + dragForceY / selected.mass;
    previewVx += ax * 0.16;
    previewVy += ay * 0.16;
    previewX += previewVx * 0.16;
    previewY += previewVy * 0.16;
    ctx.lineTo(previewX, previewY);
    if (previewY > office.floorY) break;
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawHud() {
  ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
  ctx.fillRect(20, 20, 210, 70);
  ctx.fillStyle = "#f8fafc";
  ctx.font = "14px Segoe UI";
  ctx.fillText(`Level ${currentLevel + 1}`, 32, 44);
  ctx.fillText(`Throws left: ${Math.max(maxThrows - throwCount, 0)}`, 32, 64);
  ctx.fillText(`Score: ${score}`, 32, 84);
}

function spawnConfetti(x, y) {
  const colors = ["#f97316", "#facc15", "#22c55e", "#38bdf8", "#a78bfa"];
  for (let i = 0; i < 18; i += 1) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 1.2) * 6,
      radius: Math.random() * 3 + 2,
      color: colors[i % colors.length],
      life: 60 + Math.random() * 20,
    });
  }
}

function updateParticles(delta) {
  const timeScale = delta / 16.67;
  particles = particles.filter((particle) => particle.life > 0);
  particles.forEach((particle) => {
    particle.vy += 0.12 * timeScale;
    particle.x += particle.vx * timeScale;
    particle.y += particle.vy * timeScale;
    particle.life -= 1 * timeScale;
  });
}

function drawParticles() {
  particles.forEach((particle) => {
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = Math.max(particle.life / 80, 0);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function loop(timestamp) {
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  if (!gameActive) {
    drawOffice();
    drawWind();
    drawTrajectoryPreview();
    drawBin();
    drawProjectile();
    drawHud();
    drawParticles();
    requestAnimationFrame(loop);
    return;
  }
  updateBin(delta);
  updateGust(delta);
  updateProjectile(delta);
  checkScoring();
  updateParticles(delta);
  updateUI();
  drawOffice();
  drawWind();
  drawTrajectoryPreview();
  drawBin();
  drawProjectile();
  drawHud();
  drawParticles();
  requestAnimationFrame(loop);
}

function handleThrow() {
  if (!gameActive || projectile || throwCount >= maxThrows) return;
  projectile = createProjectile();
  setStatus("In flight...");
}

angleInput.addEventListener("input", updateUI);
powerInput.addEventListener("input", updateUI);
throwBtn.addEventListener("click", handleThrow);
resetBtn.addEventListener("click", () => resetLevel(true));
startBtn.addEventListener("click", () => {
  gameActive = true;
  score = 0;
  streak = 0;
  overlay.classList.remove("visible");
  initLevel();
});
document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    handleThrow();
  }
  if (event.key.toLowerCase() === "r") {
    resetLevel(true);
  }
});

populateGarbage();
initLevel();
overlay.classList.add("visible");
=======
const gameOverEl = document.getElementById("gameOver");
const finalScoreEl = document.getElementById("finalScore");
const retryBtn = document.getElementById("retryBtn");

const W = canvas.width;
const H = canvas.height;
const floorY = 470;
const launch = { x: 120, y: floorY - 20 };

const state = {
  score: 0,
  highScore: Number(localStorage.getItem("officeTossHighScore") || 0),
  streak: 0,
  ballsLeft: 5,
  throwCount: 0,
  wind: 0.15,
  windLabel: "Breeze",
  projectile: null,
  particles: [],
  aiming: false,
  aimTrail: [],
  dragStart: null,
  dragStartTime: 0,
  bossMoodTimer: 0,
  bossBubble: "",
};

const bin = { x: 700, y: floorY - 82, w: 70, h: 82, vx: 1.7, speedTier: 1.7 };
const boss = { x: 800, y: 210, w: 140, h: 190 };
const mug = { x: boss.x - 36, y: 320, w: 25, h: 20 };

function pickWind() {
  const presets = [
    { v: -0.35, label: "Fan Left" },
    { v: -0.2, label: "Draft Left" },
    { v: 0.15, label: "Breeze" },
    { v: 0.28, label: "Fan Right" },
    { v: 0.4, label: "Window Gust" },
  ];
  const next = presets[Math.floor(Math.random() * presets.length)];
  state.wind = next.v;
  state.windLabel = next.label;
}

function resetRun() {
  state.score = 0;
  state.streak = 0;
  state.ballsLeft = 5;
  state.throwCount = 0;
  state.projectile = null;
  state.particles = [];
  state.bossMoodTimer = 0;
  state.bossBubble = "";
  pickWind();
  gameOverEl.classList.add("hidden");
}

function addScore(delta) {
  state.score += delta;
  if (state.score > state.highScore) {
    state.highScore = state.score;
    localStorage.setItem("officeTossHighScore", String(state.highScore));
  }
}

function launchProjectile(vx, vy) {
  state.projectile = {
    x: launch.x,
    y: launch.y,
    vx,
    vy,
    r: 12,
    spin: (Math.random() - 0.5) * 0.25,
    rot: 0,
  };
}

function doThrowFromDrag(endX, endY) {
  if (state.ballsLeft <= 0 || state.projectile) return;
  const dx = state.dragStart.x - endX;
  const dy = state.dragStart.y - endY;
  const dist = Math.hypot(dx, dy);
  const dt = Math.max((performance.now() - state.dragStartTime) / 1000, 0.04);
  const speedBoost = Math.min(1.8, 0.9 / dt);
  const power = Math.min(62, Math.max(18, (dist * 0.38) * speedBoost));
  const angle = Math.atan2(dy, dx);
  const vx = Math.cos(angle) * power;
  const vy = -Math.sin(angle) * power;
  launchProjectile(vx, vy);
  state.ballsLeft -= 1;
  state.throwCount += 1;
  if (state.throwCount % 3 === 0) {
    pickWind();
    bin.speedTier += 0.15;
  }
}

function spawnConfetti(x, y, count = 22) {
  for (let i = 0; i < count; i += 1) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 1.3) * 6,
      life: 40 + Math.random() * 25,
      color: ["#f97316", "#22c55e", "#38bdf8", "#facc15"][i % 4],
      r: 2 + Math.random() * 2,
    });
  }
}

function rectHit(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function updateProjectile(dt) {
  const p = state.projectile;
  if (!p) return;

  p.vx += state.wind * dt * 60;
  p.vy += 0.45 * dt * 60;
  p.vx *= 0.995;
  p.vy *= 0.997;

  p.x += p.vx * dt * 60;
  p.y += p.vy * dt * 60;
  p.rot += p.spin;

  const projRect = { x: p.x - p.r, y: p.y - p.r, w: p.r * 2, h: p.r * 2 };
  const binRect = { x: bin.x + 8, y: bin.y + 8, w: bin.w - 16, h: 18 };
  const mugRect = { ...mug };
  const bossRect = { x: boss.x + 10, y: boss.y + 25, w: boss.w - 20, h: boss.h - 25 };

  if (rectHit(projRect, binRect)) {
    state.streak += 1;
    const multi = Math.min(3, Math.max(1, state.streak));
    addScore(10 * multi);
    spawnConfetti(p.x, p.y, 16);
    state.projectile = null;
    return;
  }

  if (rectHit(projRect, mugRect)) {
    addScore(50);
    spawnConfetti(p.x, p.y, 30);
    state.projectile = null;
    return;
  }

  if (rectHit(projRect, bossRect)) {
    state.streak = 0;
    state.bossMoodTimer = 90;
    state.bossBubble = "HEY! Watch it!";
    state.projectile = null;
    return;
  }

  if (p.y + p.r >= floorY) {
    addScore(-5);
    state.streak = 0;
    state.projectile = null;
  }
}

function updateBin(dt) {
  bin.x += bin.vx * bin.speedTier * dt * 60;
  if (bin.x < 470 || bin.x + bin.w > W - 30) bin.vx *= -1;
}

function updateParticles(dt) {
  state.particles = state.particles.filter((pt) => pt.life > 0);
  state.particles.forEach((pt) => {
    pt.vy += 0.13 * dt * 60;
    pt.x += pt.vx * dt * 60;
    pt.y += pt.vy * dt * 60;
    pt.life -= 1 * dt * 60;
  });
}

function drawOffice() {
  ctx.clearRect(0, 0, W, H);

  // 2.5D/isometric style floor lines
  ctx.fillStyle = "#d1d5db";
  ctx.fillRect(0, floorY, W, H - floorY);
  ctx.strokeStyle = "rgba(100,116,139,0.45)";
  for (let i = -W; i < W * 2; i += 55) {
    ctx.beginPath();
    ctx.moveTo(i, H);
    ctx.lineTo(i + 220, floorY);
    ctx.stroke();
  }

  // back wall + desk
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(560, 180, 350, 210);
  ctx.fillStyle = "#7c2d12";
  ctx.fillRect(640, 350, 240, 34);

  // fan (wind source)
  const fanX = state.wind > 0 ? 70 : W - 90;
  ctx.fillStyle = "#334155";
  ctx.beginPath();
  ctx.arc(fanX, 100, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#38bdf8";
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(fanX, 100);
    ctx.lineTo(fanX + Math.cos((Date.now() / 150 + i * 2.1)) * 34, 100 + Math.sin((Date.now() / 150 + i * 2.1)) * 34);
    ctx.stroke();
  }

  // boss
  const angry = state.bossMoodTimer > 0;
  ctx.fillStyle = angry ? "#dc2626" : "#2563eb";
  ctx.fillRect(boss.x + 40, boss.y + 55, 58, 105);
  ctx.fillStyle = "#fcd34d";
  ctx.beginPath();
  ctx.arc(boss.x + 68, boss.y + 34, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111827";
  ctx.fillRect(boss.x + 30, boss.y + 160, 78, 24);

  // mug
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(mug.x, mug.y, mug.w, mug.h);
  ctx.strokeStyle = "#334155";
  ctx.strokeRect(mug.x + 20, mug.y + 4, 8, 10);

  if (angry) {
    ctx.fillStyle = "#fee2e2";
    ctx.fillRect(boss.x - 60, boss.y - 10, 120, 32);
    ctx.fillStyle = "#7f1d1d";
    ctx.font = "14px Inter";
    ctx.fillText(state.bossBubble, boss.x - 52, boss.y + 11);
  }

  // bin
  const g = ctx.createLinearGradient(bin.x, bin.y, bin.x, bin.y + bin.h);
  g.addColorStop(0, "#1f2937");
  g.addColorStop(1, "#4b5563");
  ctx.fillStyle = g;
  ctx.fillRect(bin.x, bin.y, bin.w, bin.h);
  ctx.fillStyle = "#6b7280";
  ctx.fillRect(bin.x - 5, bin.y, bin.w + 10, 8);

  // launch zone
  ctx.strokeStyle = "#0f172a";
  ctx.setLineDash([5, 6]);
  ctx.strokeRect(launch.x - 42, launch.y - 32, 84, 64);
  ctx.setLineDash([]);
  ctx.font = "13px Inter";
  ctx.fillStyle = "#111827";
  ctx.fillText("FLICK ZONE", launch.x - 34, launch.y + 50);
}

function drawProjectile() {
  const p = state.projectile;
  if (!p) return;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  const g = ctx.createRadialGradient(0, 0, 1, 0, 0, p.r + 4);
  g.addColorStop(0, "#fef3c7");
  g.addColorStop(1, "#d97706");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, p.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawAimingTrail() {
  if (state.aimTrail.length < 2) return;
  for (let i = 1; i < state.aimTrail.length; i += 1) {
    const a = state.aimTrail[i - 1];
    const b = state.aimTrail[i];
    const alpha = i / state.aimTrail.length;
    ctx.strokeStyle = `rgba(124,58,237,${alpha * 0.45})`;
    ctx.lineWidth = 2 + alpha * 3;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
}

function drawParticles() {
  state.particles.forEach((pt) => {
    ctx.globalAlpha = Math.max(pt.life / 70, 0);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawHUD() {
  ctx.font = "700 20px Orbitron, Inter";
  ctx.fillStyle = "#e2e8f0";
  ctx.fillText(`SCORE ${state.score}`, 18, 34);
  ctx.fillText(`STREAK x${Math.max(1, state.streak)}`, 18, 62);

  ctx.textAlign = "right";
  ctx.fillText(`HIGH ${state.highScore}`, W - 18, 34);
  ctx.fillText(`BALLS ${state.ballsLeft}`, W - 18, 62);
  ctx.fillText(`WIND ${state.windLabel}`, W - 18, 90);
  ctx.textAlign = "left";
}

function setGameOverIfNeeded() {
  if (state.ballsLeft <= 0 && !state.projectile) {
    finalScoreEl.textContent = `Score: ${state.score} • High Score: ${state.highScore}`;
    gameOverEl.classList.remove("hidden");
  }
}

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.033);
  last = now;

  updateBin(dt);
  updateProjectile(dt);
  updateParticles(dt);

  if (state.bossMoodTimer > 0) state.bossMoodTimer -= 1;
  if (!state.aiming && state.aimTrail.length > 0) {
    state.aimTrail.shift();
  }

  drawOffice();
  drawAimingTrail();
  drawProjectile();
  drawParticles();
  drawHUD();
  setGameOverIfNeeded();

  requestAnimationFrame(loop);
}

function pointerPos(event) {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX ?? event.touches?.[0]?.clientX ?? event.changedTouches?.[0]?.clientX) - rect.left;
  const y = (event.clientY ?? event.touches?.[0]?.clientY ?? event.changedTouches?.[0]?.clientY) - rect.top;
  return { x, y };
}

function onStart(event) {
  if (state.ballsLeft <= 0 || state.projectile) return;
  const p = pointerPos(event);
  state.aiming = true;
  state.dragStart = p;
  state.dragStartTime = performance.now();
  state.aimTrail = [p];
}

function onMove(event) {
  if (!state.aiming) return;
  const p = pointerPos(event);
  state.aimTrail.push(p);
  if (state.aimTrail.length > 14) state.aimTrail.shift();
}

function onEnd(event) {
  if (!state.aiming) return;
  const p = pointerPos(event);
  doThrowFromDrag(p.x, p.y);
  state.aiming = false;
}

canvas.addEventListener("mousedown", onStart);
canvas.addEventListener("mousemove", onMove);
window.addEventListener("mouseup", onEnd);
canvas.addEventListener("touchstart", (e) => { e.preventDefault(); onStart(e); }, { passive: false });
canvas.addEventListener("touchmove", (e) => { e.preventDefault(); onMove(e); }, { passive: false });
canvas.addEventListener("touchend", (e) => { e.preventDefault(); onEnd(e); }, { passive: false });

retryBtn.addEventListener("click", resetRun);
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "r") resetRun();
});

resetRun();
>>>>>>> theirs
requestAnimationFrame(loop);
