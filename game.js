const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

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
const status = document.getElementById("status");

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

const emitter = {
  x: office.leftWall + 20,
  y: office.floorY - 10,
};

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
  status.textContent = "Take your shot!";
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
  projectile.rotation += projectile.vx * 0.01;

  if (projectile.y > office.floorY - 5) {
    status.textContent = "Missed! Adjust your throw and try again.";
    projectile = null;
    throwCount += 1;
    if (throwCount >= 3) {
      status.textContent = "Three throws used. Reset the level for another try.";
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
    status.textContent = "Score! Great physics intuition.";
    projectile = null;
    currentLevel = Math.min(currentLevel + 1, levels.length - 1);
    initLevel();
  }
}

function drawOffice() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#d1d5db";
  ctx.fillRect(0, office.floorY, canvas.width, canvas.height - office.floorY);

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
}

function drawBin() {
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(bin.x, bin.y, bin.width, bin.height);
  ctx.fillStyle = "#4b5563";
  ctx.fillRect(bin.x - 6, bin.y, bin.width + 12, 8);
  ctx.fillStyle = "#f9fafb";
  ctx.fillText("BIN", bin.x + bin.width / 2 - 12, bin.y + bin.height / 2);
}

function drawProjectile() {
  if (!projectile) return;
  ctx.save();
  ctx.translate(projectile.x, projectile.y);
  ctx.rotate(projectile.rotation);
  ctx.fillStyle = "#7c3aed";
  if (projectile.shape === "circle") {
    ctx.beginPath();
    ctx.arc(0, 0, projectile.radius, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(-projectile.width / 2, -projectile.height / 2, projectile.width, projectile.height);
  }
  ctx.restore();
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

function loop(timestamp) {
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  updateBin(delta);
  updateGust(delta);
  updateProjectile(delta);
  checkScoring();
  updateUI();
  drawOffice();
  drawWind();
  drawBin();
  drawProjectile();
  requestAnimationFrame(loop);
}

function handleThrow() {
  if (projectile || throwCount >= 3) return;
  projectile = createProjectile();
  status.textContent = "In flight...";
}

angleInput.addEventListener("input", updateUI);
powerInput.addEventListener("input", updateUI);
throwBtn.addEventListener("click", handleThrow);
resetBtn.addEventListener("click", initLevel);

populateGarbage();
initLevel();
requestAnimationFrame(loop);
