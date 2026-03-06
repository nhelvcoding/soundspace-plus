import { Globals } from "./globals.js";
import { loadSong } from "./mapload.js";
import { getCoins, addCoins, getEquipped } from "./globals.js";
import { hit, miss, getJudgement, computeAccuracy } from "./score.js";
import { applyMods } from "./mods.js";

// ----------------- URL PARAMS & MODS -----------------
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get("mode") || "deaths";

let mods = {};
try {
  const raw = urlParams.get("mods") || "{}";
  mods = JSON.parse(decodeURIComponent(raw));
} catch {
  mods = {};
}

// ----------------- GAME STATE (BASE) -----------------
let gameState = {
  hitWindow: 150,      // base timing window
  noteSpeed: 1.0,      // base speed multiplier
  health: 100,
  maxHealth: 100,
  failOnMiss: false,
  onlyPerfect: false,
  hidden: false,
  botEnabled: false,
  coinGain: 1          // coin multiplier
};

// Apply all modifiers from mods.js (using exact names: Hidden, HardRock, Easy, SuddenDeath, Perfect, Bot)
gameState = applyMods(gameState, mods);

// ----------------- CANVAS & AUDIO -----------------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const songEl = document.getElementById("song");
const current = getCoins();

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener("resize", resize);

// ----------------- HEALTH (DEATHS MODE) -----------------
let health = gameState.health;
let maxHealth = gameState.maxHealth;
let failThreshold = 0;

// ----------------- CURSOR -----------------
let cursorX = innerWidth / 2;
let cursorY = innerHeight / 2;

document.addEventListener("mousemove", e => {
  if (document.pointerLockElement === canvas) {
    cursorX += e.movementX;
    cursorY += e.movementY;
  } else {
    cursorX = e.clientX;
    cursorY = e.clientY;
  }

  cursorX = Math.max(0, Math.min(innerWidth, cursorX));
  cursorY = Math.max(0, Math.min(innerHeight, cursorY));
});

canvas.addEventListener("click", () => {
  if (document.pointerLockElement !== canvas) {
    canvas.requestPointerLock();
  }
});

const cursor = new Image();
cursor.src = "/src/cursor.png";

const equippedCursor = getEquipped("cursor");
const cursorPaths = {
  skin_blue: "../public/skins/cursor_blue.png",
  skin_green: "../public/skins/cursor_green.png",
  skin_orange: "../public/skins/cursor_orange.png",
  skin_witched: "../public/skins/cursor_witched.png",
  skin_dark_matter: "../public/skins/cursor_dark_matter.png",
  skin_black_lightning: "../public/skins/cursor_black_lightning.png",
  skin_black_cursed: "../public/skins/cursor_cursed_black.png",
  skin_pixelated: "../public/skins/cursor_pixelated_black.png",
  skin_vortex: "../public/skins/cursor_vortex.png",
  skin_purple_triangle: "../public/skins/cursor_purple_triangle.png",
  skin_bw_zigzag: "../public/skins/cursor_zigzag_bw.png",
  skin_blue_scratched: "../public/skins/cursor_scratched_blue.png",
  skin_cursed: "../public/skins/cursor_cursed.png",
  skin_blackhole: "../public/skins/cursor_blackhole.png",
  skin_diamond: "../public/skins/cursor_diamond.png",
  skin_admin: "../public/skins/cursor_admin.png"
};
if (cursorPaths[equippedCursor]) cursor.src = cursorPaths[equippedCursor];

// ----------------- RESULTS ELEMENTS -----------------
const resultsEl = document.getElementById("results");
const rScore = document.getElementById("r-score");
const rCoinsEarned = document.getElementById("r-coins-earned");
const rCombo = document.getElementById("r-combo");
const rAccuracy = document.getElementById("r-accuracy");
const rJudgements = document.getElementById("r-judgements");
const retryBtn = document.getElementById("retryBtn");
if (retryBtn) {
  retryBtn.onclick = () => {
    window.location.reload();
  };
}

// ----------------- POPUPS -----------------
const popups = [];
let hitFlash = 0;
let lastJudgement = null;
let lastJudgementTime = 0;

function addPopup(text, x, y, now, color) {
  popups.push({ text, x, y, start: now, duration: 600, color });
}

function renderPopups(now) {
  ctx.font = "26px monospace";
  ctx.textAlign = "center";

  for (let i = popups.length - 1; i >= 0; i--) {
    const p = popups[i];
    const t = (now - p.start) / p.duration;
    if (t >= 1) {
      popups.splice(i, 1);
      continue;
    }
    const alpha = 1 - t;
    const y = p.y - t * 40;
    ctx.fillStyle = p.color.replace("ALPHA", alpha.toFixed(2));
    ctx.fillText(p.text, p.x, y);
  }
}

// ----------------- EASING -----------------
function easeOutQuad(t) {
  return 1 - (1 - t) * (1 - t);
}
function easeInQuad(t) {
  return t * t;
}

// ----------------- PANEL -----------------
function renderPanel() {
  const w = Math.min(canvas.width * 0.6, 900);
  const h = Math.min(canvas.height * 0.8, 900);
  const x = (canvas.width - w) / 2;
  const y = (canvas.height - h) / 2;

  const glow = ctx.createRadialGradient(
    x + w / 2, y + h / 2, 50,
    x + w / 2, y + h / 2, w
  );
  glow.addColorStop(0, "rgba(0,200,255,0.25)");
  glow.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = glow;
  ctx.fillRect(x - 40, y - 40, w + 80, h + 80);

  ctx.strokeStyle = "white";
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, w, h);

  return { x, y, w, h, center: [x + w / 2, y + h / 2] };
}

// ----------------- WINDOWS & SPEED -----------------
const timingWindowBase = Globals.timingWindow;
const spawnWindowBase = Globals.spawnWindow;
let timingWindow = timingWindowBase;
let spawnWindow = spawnWindowBase;


// speed multiplier from mods
let speedMultiplier = gameState.noteSpeed;

// ----------------- NOTE RENDER -----------------
function renderNoteWithTrail(note, size, alpha) {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  const x = cx + note.x * (canvas.width * 0.25);
  const y = cy + note.y * (canvas.height * 0.25);

  const trailSteps = 4;
  for (let i = 1; i <= trailSteps; i++) {
    const t = i / (trailSteps + 1);
    const trailAlpha = alpha * (0.4 * (1 - t));
    const trailSize = size * (1 - 0.15 * i);

    ctx.save();
    ctx.globalAlpha = trailAlpha;
    ctx.fillStyle = "rgba(0,200,255,0.25)";
    ctx.strokeStyle = "rgba(0,255,200,0.6)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(
      x - trailSize / 2,
      y - trailSize / 2,
      trailSize,
      trailSize,
      10
    );
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(0,200,255,0.4)";
  ctx.strokeStyle = "rgba(0,255,200,1)";
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.roundRect(x - size / 2, y - size / 2, size, size, 12);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  return { x, y, size };
}

function isHit(rect) {
  return (
    Math.abs(cursorX - rect.x) < Globals.hitRadius &&
    Math.abs(cursorY - rect.y) < Globals.hitRadius
  );
}

// ----------------- HUD -----------------
function renderHUD(session, scorePos, timePos, now) {
  ctx.fillStyle = "white";
  ctx.textAlign = "center";

  ctx.font = "32px monospace";
  ctx.fillText(`Score: ${session.score}`, scorePos[0], scorePos[1]);
  ctx.fillText(`Combo: ${session.combo}`, scorePos[0], scorePos[1] + 36);

  ctx.font = "22px monospace";
  ctx.fillText(`Time: ${Math.max(0, Math.floor(session.remaining))}`, timePos[0], timePos[1]);

  ctx.font = "18px monospace";
  ctx.fillStyle = "rgba(200,200,255,0.8)";
  ctx.fillText(`${(now / 1000).toFixed(2)}s`, timePos[0], timePos[1] + 26);

  ctx.font = "20px monospace";
  ctx.fillStyle = "white";
  ctx.fillText(`Mode: ${mode.toUpperCase()}`, scorePos[0], scorePos[1] + 70);

  const activeMods = Object.keys(mods).filter(k => mods[k]);
  if (activeMods.length > 0) {
    ctx.font = "16px monospace";
    ctx.fillStyle = "rgba(200,200,255,0.9)";
    ctx.fillText(
      `Mods: ${activeMods.join(", ")}`,
      scorePos[0],
      scorePos[1] + 95
    );
  }

  if (lastJudgement && now - lastJudgementTime < 800) {
    const t = (now - lastJudgementTime) / 800;
    const alpha = 1 - t;
    let color = "rgba(0,255,200,ALPHA)";
    if (lastJudgement === "PERFECT") color = "rgba(56,189,248,ALPHA)";
    if (lastJudgement === "GREAT") color = "rgba(74,222,128,ALPHA)";
    if (lastJudgement === "OK") color = "rgba(250,204,21,ALPHA)";
    if (lastJudgement === "MISS") color = "rgba(248,113,113,ALPHA)";

    ctx.font = "40px monospace";
    ctx.fillStyle = color.replace("ALPHA", alpha.toFixed(2));
    ctx.fillText(lastJudgement, scorePos[0], scorePos[1] - 80);
  }
}

// ----------------- SONG NAME -----------------
function getSongNameFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("song") || "piles";
}

// ----------------- RESULTS -----------------
function showResults(failed = false) {
  if (!resultsEl || !song) return;
  const s = song.session;
  const acc = computeAccuracy(s);
  const totalHit = s.perfect + s.great + s.ok + s.miss;

  let earned = 0;

  // Bot NEVER gets coins
  if (!failed && mode === "deaths" && !gameState.botEnabled) {
    earned = Math.floor(acc * totalHit * gameState.coinGain);
    localStorage.setItem("coins", (current + earned).toString());
  }

  rScore.textContent = failed ? "FAILED" : `Score: ${s.score}`;
  rCoinsEarned.textContent = `Coins Earned: ${failed || mode === "nofail" ? 0 : earned}`;
  rCombo.textContent = `Max Combo: ${s.maxCombo}`;
  rAccuracy.textContent = `Accuracy: ${acc.toFixed(2)}%`;
  rJudgements.textContent =
    `Perfect: ${s.perfect} | Great: ${s.great} | OK: ${s.ok} | Miss: ${s.miss} | Total: ${totalHit}`;

  resultsEl.classList.remove("hidden");
}

// ----------------- GAME STATE -----------------
let song = null;
let queue = [];
let start = 0;
let started = false;
let nextTick = 0;

const hitNotes = new Set();
const passedNotes = new Set();
let finished = false;

// ----------------- INIT -----------------
async function init() {
  const songName = getSongNameFromURL();
  song = await loadSong(songName);
  songEl.src = `/beatmaps/${song.audio}`;
  songEl.playbackRate = speedMultiplier;
  queue = [...song.notes];
  start = performance.now();
  requestAnimationFrame(loop);
}

// ----------------- LOOP -----------------
function loop(t) {
  const nowRaw = t - start - (song.offsetMs || 0);
  const now = nowRaw * speedMultiplier;

  ctx.fillStyle = "#050509";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const panel = renderPanel();
  const scorePos = [panel.center[0], panel.center[1] + panel.h / 2 - 40];
  const timePos = [panel.center[0], panel.y + 40];

  if (!finished && now > 0 && !started) {
    songEl.play();
    started = true;
  }

  if (!finished && now > nextTick) {
    nextTick += 1000;
    song.session.remaining -= 1;
  }

  if (!finished) {
    let newQueue = [];

    for (const note of queue) {
      const dt = now - note.timeMs;

      // 1. Too early → keep note
      if (dt < -spawnWindow) {
        newQueue.push(note);
        continue;
      }

      // 2. Too late → MISS
      if (dt > spawnWindow) {
        if (!passedNotes.has(note.timeMs)) {
          miss(song.session);
          passedNotes.add(note.timeMs);

          if (mode === "deaths") {
            if (gameState.failOnMiss) {
              finished = true;
              songEl.pause();
              showResults(true);
              return;
            }

            health -= 20;
            if (health <= failThreshold) {
              finished = true;
              songEl.pause();
              showResults(true);
              return;
            }
          }
        }
        continue;
      }

      // 3. Active window → render + hit logic
      const tNorm = Math.abs(dt) / spawnWindow;
      let grow = easeOutQuad(1 - tNorm);
      let fade = easeInQuad(1 - tNorm);

      if (gameState.hidden && dt > 0) fade = 0;

      const size = Globals.baseSize + Globals.growSize * grow;
      const rect = renderNoteWithTrail(note, size, fade);

let shouldHit = false;

if (gameState.botEnabled) {
  // bot: auto-hit inside timing window
  if (!hitNotes.has(note.timeMs) && Math.abs(dt) <= timingWindow) {
    shouldHit = true;
  }
} else {
  // player: must be inside timing window AND on the note
  if (!hitNotes.has(note.timeMs) && Math.abs(dt) <= timingWindow && isHit(rect)) {
    shouldHit = true;
  }
}


      if (!shouldHit) {
        newQueue.push(note);
        continue;
      }

      // 4. Hit logic
      let judgement = gameState.botEnabled ? "PERFECT" : getJudgement(dt);

      if (gameState.onlyPerfect && judgement !== "PERFECT") {
        judgement = "MISS";
      }

      if (judgement === "MISS") {
        miss(song.session);

        if (mode === "deaths") {
          if (gameState.failOnMiss) {
            finished = true;
            songEl.pause();
            showResults(true);
            return;
          }

          health -= 20;
          if (health <= failThreshold) {
            finished = true;
            songEl.pause();
            showResults(true);
            return;
          }
        }
      } else {
        hit(song.session, judgement);

        if (mode === "deaths") {
          if (judgement === "OK")      health = Math.min(maxHealth, health + 10);
          if (judgement === "GREAT")   health = Math.min(maxHealth, health + 13);
          if (judgement === "PERFECT") health = Math.min(maxHealth, health + 20);
        }
      }

      hitNotes.add(note.timeMs);
      passedNotes.add(note.timeMs);
      hitFlash = 0.35;
      lastJudgement = judgement;
      lastJudgementTime = now;

      let color = "rgba(0,255,200,ALPHA)";
      if (judgement === "PERFECT") color = "rgba(56,189,248,ALPHA)";
      if (judgement === "GREAT")   color = "rgba(74,222,128,ALPHA)";
      if (judgement === "OK")      color = "rgba(250,204,21,ALPHA)";
      if (judgement === "MISS")    color = "rgba(248,113,113,ALPHA)";

      addPopup(
        `+${song.session.multiplier * 100}`,
        rect.x,
        rect.y - 20,
        now,
        color
      );
    }

    queue = newQueue;

    if (queue.length === 0 && !finished && now > (song.notes.at(-1)?.timeMs ?? 0) + 1500) {
      finished = true;
      songEl.pause();
      showResults(false);
    }
  }

  renderHUD(song.session, scorePos, timePos, now);
  renderPopups(now);

  if (mode === "deaths") {
    const barW = canvas.width * 0.4;
    const barH = 20;
    const x = canvas.width / 2 - barW / 2;
    const y = 30;

    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(x, y, barW, barH);

    ctx.fillStyle = "red";
    ctx.fillRect(x, y, barW * (health / maxHealth), barH);

    ctx.strokeStyle = "white";
    ctx.strokeRect(x, y, barW, barH);
  }

  if (hitFlash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${hitFlash})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    hitFlash -= 0.02;
  }

  if (cursor.complete) {
    ctx.drawImage(cursor, cursorX - 20, cursorY - 20, 40, 40);
  }

  requestAnimationFrame(loop);
}

init();
