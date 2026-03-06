import { Globals } from "./globals.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const songEl = document.getElementById("song");

const playPause = document.getElementById("playPause");
const clearBtn = document.getElementById("clearNotes");
const exportBtn = document.getElementById("exportMap");
const addNoteBtn = document.getElementById("addNote");
const scrubber = document.getElementById("scrubber");
const timeLabel = document.getElementById("timeLabel");

const songFileInput = document.getElementById("songFileInput");
const songUploadStatus = document.getElementById("songUploadStatus");

const beatmapFileInput = document.getElementById("beatmapFileInput");
const beatmapUploadStatus = document.getElementById("beatmapUploadStatus");

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener("resize", resize);

// --------------------------------------------------
// MAP SETTINGS SIDEBAR
// --------------------------------------------------

const SIDEBAR_WIDTH = 260;

let mapSettings = {
  noteSpeed: 1.0,     // visual approach speed in editor
  defaultPoints: 100  // points for new notes
};

// --------------------------------------------------
// SONG UPLOAD
// --------------------------------------------------

let currentAudioFileName = null;
let durationMs = 0;

songFileInput.addEventListener("change", () => {
  const file = songFileInput.files[0];
  if (!file) return;

  if (!file.name.endsWith(".mp3")) {
    songUploadStatus.textContent = "Please upload an MP3 file.";
    return;
  }

  currentAudioFileName = file.name;

  const url = URL.createObjectURL(file);
  songEl.src = url;

  songUploadStatus.textContent = `Loaded: ${file.name}`;
});

songEl.addEventListener("loadedmetadata", () => {
  durationMs = songEl.duration * 1000;
  scrubber.max = durationMs;
});

// --------------------------------------------------
// BEATMAP IMPORT
// --------------------------------------------------

beatmapFileInput.addEventListener("change", () => {
  const file = beatmapFileInput.files[0];
  if (!file) return;

  if (!file.name.endsWith(".beatmap") && !file.name.endsWith(".json")) {
    beatmapUploadStatus.textContent = "Please upload a .beatmap or .json file.";
    return;
  }

  const reader = new FileReader();

  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);

      if (!data.notes || !Array.isArray(data.notes)) {
        beatmapUploadStatus.textContent = "Invalid beatmap file.";
        return;
      }

      // Load notes
      notes = data.notes.map(n => ({
        x: n.x,
        y: n.y,
        timeMs: n.timeMs,
        points: n.points ?? 100
      }));

      // Load audio if available
      if (data.audio) {
        currentAudioFileName = data.audio;
        songEl.src = "../public/beatmaps/" + data.audio;
      }

      // Load settings if present
      if (typeof data.noteSpeed === "number") {
        mapSettings.noteSpeed = data.noteSpeed;
      }
      if (typeof data.defaultPoints === "number") {
        mapSettings.defaultPoints = data.defaultPoints;
      }

      beatmapUploadStatus.textContent = `Loaded beatmap: ${file.name}`;
    } catch (err) {
      console.error(err);
      beatmapUploadStatus.textContent = "Error reading beatmap.";
    }
  };

  reader.readAsText(file);
});

// --------------------------------------------------
// PLAY / PAUSE
// --------------------------------------------------

playPause.onclick = async () => {
  if (!songEl.src) {
    songUploadStatus.textContent = "Upload a song first.";
    return;
  }

  try {
    if (songEl.paused) {
      await songEl.play();
    } else {
      songEl.pause();
    }
  } catch (err) {
    console.error("Play error:", err);
    songUploadStatus.textContent = "Could not play audio.";
  }
};

// --------------------------------------------------
// NOTES (plain objects: {x, y, timeMs, points})
// --------------------------------------------------

let notes = [];
let selectedNote = null;
let draggingNote = null;
let dragOffset = { x: 0, y: 0 };

clearBtn.onclick = () => {
  notes = [];
  selectedNote = null;
  draggingNote = null;
};

// Add note at center (current time)
addNoteBtn.onclick = () => {
  const timeMs = Math.floor(songEl.currentTime * 1000);
  notes.push({ x: 0, y: 0, timeMs, points: mapSettings.defaultPoints });
};

// --------------------------------------------------
// EXPORT BEATMAP
// --------------------------------------------------

exportBtn.onclick = () => {
  const beatmap = {
    title: "New Beatmap",
    audio: currentAudioFileName || "unknown.mp3",
    offsetMs: 0,
    noteSpeed: mapSettings.noteSpeed,
    defaultPoints: mapSettings.defaultPoints,
    notes: notes
      .map(n => ({
        x: n.x,
        y: n.y,
        timeMs: n.timeMs,
        points: n.points ?? 1
      }))
      .sort((a, b) => a.timeMs - b.timeMs)
  };

  const blob = new Blob([JSON.stringify(beatmap, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${beatmap.title}.beatmap`;
  a.click();
  URL.revokeObjectURL(url);
};

// --------------------------------------------------
// SCRUBBER SYNC
// --------------------------------------------------

scrubber.addEventListener("input", () => {
  const t = Number(scrubber.value);
  songEl.currentTime = t / 1000;
});

songEl.addEventListener("timeupdate", () => {
  scrubber.value = songEl.currentTime * 1000;
});

// --------------------------------------------------
// NOTE HIT / DRAG / CREATE
// --------------------------------------------------

function screenPosFromNote(n) {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const x = cx + n.x * (canvas.width * 0.25);
  const y = cy + n.y * (canvas.height * 0.25);
  return { x, y };
}

function noteFromScreen(xPix, yPix) {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const xNorm = (xPix - cx) / (canvas.width * 0.25);
  const yNorm = (yPix - cy) / (canvas.height * 0.25);
  return { x: xNorm, y: yNorm };
}

function findNoteAt(xPix, yPix) {
  const hitRadius = 32;
  let closest = null;
  let closestDist = Infinity;

  const t = songEl.currentTime * 1000;

  for (const n of notes) {
    const dt = t - n.timeMs;
    const pct = Math.max(0, 1 - Math.abs(dt) / (Globals.spawnWindow / mapSettings.noteSpeed));

    if (pct <= 0) continue;

    const { x, y } = screenPosFromNote(n);
    const dx = xPix - x;
    const dy = yPix - y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= hitRadius && dist < closestDist) {
      closestDist = dist;
      closest = n;
    }
  }

  return closest;
}

// --------------------------------------------------
// SIDEBAR CLICK HANDLING
// --------------------------------------------------

function handleSidebarClick(xPix, yPix) {
  if (xPix > SIDEBAR_WIDTH) return false;

  const padding = 20;
  let y = 80;
  const rowH = 40;
  const btnW = 30;
  const btnH = 26;

  // Note Speed row
  const nsLabelY = y;
  const nsMinusX = padding;
  const nsMinusY = nsLabelY + 10;
  const nsPlusX = padding + 140;
  const nsPlusY = nsMinusY;

  if (
    xPix >= nsMinusX && xPix <= nsMinusX + btnW &&
    yPix >= nsMinusY && yPix <= nsMinusY + btnH
  ) {
    mapSettings.noteSpeed = Math.max(0.25, +(mapSettings.noteSpeed - 0.25).toFixed(2));
    return true;
  }

  if (
    xPix >= nsPlusX && xPix <= nsPlusX + btnW &&
    yPix >= nsPlusY && yPix <= nsPlusY + btnH
  ) {
    mapSettings.noteSpeed = Math.min(4, +(mapSettings.noteSpeed + 0.25).toFixed(2));
    return true;
  }

  y += rowH * 2;

  // Default Points row
  const dpLabelY = y;
  const dpMinusX = padding;
  const dpMinusY = dpLabelY + 10;
  const dpPlusX = padding + 140;
  const dpPlusY = dpMinusY;

  if (
    xPix >= dpMinusX && xPix <= dpMinusX + btnW &&
    yPix >= dpMinusY && yPix <= dpMinusY + btnH
  ) {
    mapSettings.defaultPoints = Math.max(100, mapSettings.defaultPoints - 100);
    return true;
  }

  if (
    xPix >= dpPlusX && xPix <= dpPlusX + btnW &&
    yPix >= dpPlusY && yPix <= dpPlusY + btnH
  ) {
    mapSettings.defaultPoints = mapSettings.defaultPoints + 100;
    return true;
  }

  return false;
}

// --------------------------------------------------
// MOUSE EVENTS
// --------------------------------------------------

canvas.addEventListener("mousedown", e => {
  const rect = canvas.getBoundingClientRect();
  const xPix = e.clientX - rect.left;
  const yPix = e.clientY - rect.top;

  // Sidebar first
  if (handleSidebarClick(xPix, yPix)) return;

  const hit = findNoteAt(xPix, yPix);

  if (hit) {
    selectedNote = hit;
    draggingNote = hit;

    const { x, y } = screenPosFromNote(hit);
    dragOffset.x = xPix - x;
    dragOffset.y = yPix - y;
  } else {
    const { x, y } = noteFromScreen(xPix, yPix);
    const timeMs = Math.floor(songEl.currentTime * 1000);
    const newNote = { x, y, timeMs, points: mapSettings.defaultPoints };
    notes.push(newNote);
    selectedNote = newNote;
    draggingNote = newNote;

    const sp = screenPosFromNote(newNote);
    dragOffset.x = xPix - sp.x;
    dragOffset.y = yPix - sp.y;
  }
});

canvas.addEventListener("mousemove", e => {
  if (!draggingNote) return;

  const rect = canvas.getBoundingClientRect();
  const xPix = e.clientX - rect.left;
  const yPix = e.clientY - rect.top;

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  const nx = xPix - dragOffset.x;
  const ny = yPix - dragOffset.y;

  draggingNote.x = (nx - cx) / (canvas.width * 0.25);
  draggingNote.y = (ny - cy) / (canvas.height * 0.25);
});

canvas.addEventListener("mouseup", () => {
  draggingNote = null;
});

canvas.addEventListener("mouseleave", () => {
  draggingNote = null;
});

// --------------------------------------------------
// KEYBOARD: delete / change points on selected note
// --------------------------------------------------

window.addEventListener("keydown", e => {
  if (!selectedNote) return;

  if (e.key === "Delete" || e.key === "Backspace") {
    notes = notes.filter(n => n !== selectedNote);
    selectedNote = null;
    draggingNote = null;
    return;
  }

  if (e.key === "+" || e.key === "=") {
    selectedNote.points = (selectedNote.points ?? mapSettings.defaultPoints) + 100;
  }

  if (e.key === "-" && (selectedNote.points ?? mapSettings.defaultPoints) > 100) {
    selectedNote.points = (selectedNote.points ?? mapSettings.defaultPoints) - 100;
  }
});

// --------------------------------------------------
// DRAWING
// --------------------------------------------------

function easeOutQuad(t) {
  return 1 - (1 - t) * (1 - t);
}

function drawNote(note, size, alpha, isSelected) {
  const { x, y } = screenPosFromNote(note);

  ctx.save();
  ctx.globalAlpha = alpha;

  if (isSelected) {
    ctx.fillStyle = "rgba(0,255,150,0.35)";
    ctx.strokeStyle = "lime";
  } else {
    ctx.fillStyle = "rgba(0,200,255,0.3)";
    ctx.strokeStyle = "rgba(0,255,200,1)";
  }

  ctx.lineWidth = isSelected ? 4 : 3;

  ctx.beginPath();
  ctx.roundRect(x - size / 2, y - size / 2, size, size, 10);
  ctx.fill();
  ctx.stroke();

  const pts = note.points ?? 1;
  ctx.fillStyle = "white";
  ctx.font = "18px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`${pts}x`, x, y + size * 0.6);

  ctx.restore();
}

function drawSidebar() {
  ctx.save();

  ctx.fillStyle = "rgba(10,10,20,0.95)";
  ctx.fillRect(0, 0, SIDEBAR_WIDTH, canvas.height);

  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(SIDEBAR_WIDTH, 0);
  ctx.lineTo(SIDEBAR_WIDTH, canvas.height);
  ctx.stroke();

  ctx.fillStyle = "white";
  ctx.font = "20px monospace";
  ctx.textAlign = "left";
  ctx.fillText("Map Settings", 20, 40);

  const padding = 20;
  let y = 80;
  const rowH = 40;

  // Note Speed
  ctx.font = "16px monospace";
  ctx.fillText("Note Speed", padding, y);
  ctx.fillText(`${mapSettings.noteSpeed.toFixed(2)}x`, padding + 80, y);

  const btnW = 30;
  const btnH = 26;
  const nsMinusX = padding;
  const nsMinusY = y + 10;
  const nsPlusX = padding + 140;
  const nsPlusY = nsMinusY;

  ctx.fillStyle = "rgba(40,40,60,1)";
  ctx.fillRect(nsMinusX, nsMinusY, btnW, btnH);
  ctx.fillRect(nsPlusX, nsPlusY, btnW, btnH);

  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText("-", nsMinusX + btnW / 2, nsMinusY + btnH - 7);
  ctx.fillText("+", nsPlusX + btnW / 2, nsPlusY + btnH - 7);

  y += rowH * 2;

  // Default Points
  ctx.textAlign = "left";
  ctx.fillText("Default Points", padding, y);
  ctx.fillText(`${mapSettings.defaultPoints}`, padding + 120, y);

  const dpMinusX = padding;
  const dpMinusY = y + 10;
  const dpPlusX = padding + 140;
  const dpPlusY = dpMinusY;

  ctx.fillStyle = "rgba(40,40,60,1)";
  ctx.fillRect(dpMinusX, dpMinusY, btnW, btnH);
  ctx.fillRect(dpPlusX, dpPlusY, btnW, btnH);

  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText("-", dpMinusX + btnW / 2, dpMinusY + btnH - 7);
  ctx.fillText("+", dpPlusX + btnW / 2, dpPlusY + btnH - 7);

  ctx.restore();
}

// --------------------------------------------------
// MAIN LOOP
// --------------------------------------------------

function loop() {
  ctx.fillStyle = Globals.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawSidebar();

  const t = songEl.currentTime * 1000;
  timeLabel.textContent = `${Math.floor(t)} ms`;

  for (const n of notes) {
    const dt = t - n.timeMs;
    const pct = Math.max(0, 1 - Math.abs(dt) / (Globals.spawnWindow / mapSettings.noteSpeed));
    const grow = easeOutQuad(pct);

    const size = Globals.baseSize + Globals.growSize * grow;
    const alpha = pct;

    drawNote(n, size, alpha, n === selectedNote);
  }

  if (selectedNote) {
    ctx.fillStyle = "white";
    ctx.font = "18px monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `Selected: t=${selectedNote.timeMs}ms, points=${selectedNote.points ?? 1}`,
      SIDEBAR_WIDTH + 20,
      30
    );
    ctx.fillText(`Drag to move | +/- to change points | Del to delete`, SIDEBAR_WIDTH + 20, 55);
  }

  requestAnimationFrame(loop);
}

loop();
