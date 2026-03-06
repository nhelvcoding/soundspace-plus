import { getCoins, getEquipped } from "./globals.js";
import { alertPopup } from "./alert.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
// ------------------------------
// MODIFIERS STATE
// ------------------------------
let modifiers = JSON.parse(localStorage.getItem("modifiers") || "{}");
let showModifiersPopup = false;

function toggleModifier(name) {
  modifiers[name] = !modifiers[name];
  localStorage.setItem("modifiers", JSON.stringify(modifiers));
}

// ------------------------------
// SCROLLING FOR SONG LIST
// ------------------------------
let songScrollY = 0;
let songScrollSpeed = 10;

addEventListener("wheel", e => {
  songScrollY += e.deltaY > 0 ? songScrollSpeed : -songScrollSpeed;
});

// ------------------------------
// CANVAS RESIZE
// ------------------------------
function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener("resize", resize);

// ------------------------------
// MOUSE TRACKING
// ------------------------------
let mouseX = 0, mouseY = 0;
addEventListener("mousemove", e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// ------------------------------
// CURSOR SKINS
// ------------------------------
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

// ------------------------------
// SONG LIST
// ------------------------------
let songs = [];

async function loadBeatmapList() {
  const res = await fetch("/beatmaps/beatmaps.json");
  const data = await res.json();
  songs = data.songs;
}

await loadBeatmapList();

let selectedIndex = 0;

// ------------------------------
// BUTTONS (3 ROWS)
// ------------------------------
const buttons = [
  // ROW 1 — PLAY BUTTONS (side-by-side)
  {
    text: "Start (Deaths Mode)",
    row: 1,
    action: () => {
      const id = songs[selectedIndex].id;
      const mods = encodeURIComponent(JSON.stringify(modifiers));
      window.open(`/game.html?song=${encodeURIComponent(id)}&mode=deaths&mods=${mods}`, "_blank");

    }
  },
  {
    text: "Start (No-Fail)",
    row: 1,
    action: () => {
      const id = songs[selectedIndex].id;
      const mods = encodeURIComponent(JSON.stringify(modifiers));
      window.open(`/game.html?song=${encodeURIComponent(id)}&mode=nofail&mods=${mods}`, "_blank");
    }
  },

  // ROW 0 — MIDDLE VERTICAL BUTTONS
  { text: "Beatmap Maker", row: 0, action: () => window.location.href = "/maker.html" },
  { text: "Import Beatmap", row: 0, action: () => document.getElementById("importBeatmapInput").click() },

  // ROW 2 — SHOP BUTTONS (side-by-side)
  { text: "Shop", row: 2, action: () => window.location.href = "/shop.html" },
  { text: "Inventory", row: 2, action: () => window.location.href = "/inventory.html" }
];

// ------------------------------
// MODIFIERS BUTTON
// ------------------------------
function openModifiers() {
  showModifiersPopup = true;
}


// ------------------------------
// IMPORT BEATMAP
// ------------------------------
window.importedBeatmaps = {};

document.getElementById("importBeatmapInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    alertPopup("Invalid beatmap file.");
    return;
  }

  if (!data.title || !data.audio || !Array.isArray(data.notes)) {
    alertPopup("Beatmap missing required fields.");
    return;
  }

  const id = "custom_" + Math.random().toString(36).slice(2, 10);
  window.importedBeatmaps[id] = data;

  songs.push({
    id,
    title: data.title,
    audio: data.audio,
    file: file.name
  });

  selectedIndex = songs.length - 1;
  alertPopup(`Imported beatmap: ${data.title}`);
});

// ------------------------------
// DRAW SONG LIST (SCROLLABLE)
// ------------------------------
function drawSongList() {
  const cx = canvas.width / 2;

  // FIXED SCROLL REGION
  const listTop = canvas.height * 0.26;
  const listBottom = canvas.height * 0.48;
  const spacing = canvas.height * 0.045;

  ctx.font = `${Math.floor(canvas.height * 0.03)}px monospace`;
  ctx.textAlign = "center";

  songs.forEach((s, i) => {
    const y = listTop + i * spacing - songScrollY;

    if (y < listTop - spacing || y > listBottom + spacing) return;

    const selected = i === selectedIndex;
    ctx.fillStyle = selected ? "rgba(0,255,200,1)" : "rgba(200,200,255,0.7)";
    ctx.fillText(`${selected ? "> " : ""}${s.title}`, cx, y);
  });

  const totalHeight = songs.length * spacing;
  const maxScroll = Math.max(0, totalHeight - (listBottom - listTop));

  songScrollY = Math.max(0, Math.min(songScrollY, maxScroll));
}

// ------------------------------
// KEYBOARD NAVIGATION
// ------------------------------
addEventListener("keydown", e => {
  if (e.key === "ArrowUp") selectedIndex = (selectedIndex - 1 + songs.length) % songs.length;
  if (e.key === "ArrowDown") selectedIndex = (selectedIndex + 1) % songs.length;
});

// ------------------------------
// CLICK HANDLING
// ------------------------------
canvas.addEventListener("click", () => {
  const bw = canvas.width * 0.22;
  const bh = canvas.height * 0.08;
  const cx = canvas.width / 2;

  const rowGap = canvas.height * 0.05;

  const playY = canvas.height * 0.52;
  const midY  = playY + bh + rowGap;
  const shopY = midY + 2 * (bh + rowGap);

  const gap = canvas.width * 0.03;
  const leftX  = cx - bw - gap;
  const rightX = cx + gap;

  const row0 = buttons.filter(b => b.row === 0);
  const row1 = buttons.filter(b => b.row === 1);
  const row2 = buttons.filter(b => b.row === 2);

  // PLAY BUTTONS
  if (mouseX > leftX && mouseX < leftX + bw && mouseY > playY && mouseY < playY + bh)
    row1[0].action();

  if (mouseX > rightX && mouseX < rightX + bw && mouseY > playY && mouseY < playY + bh)
    row1[1].action();

  // MIDDLE BUTTONS
  row0.forEach((btn, i) => {
    const x = cx - bw/2;
    const y = midY + i * (bh + rowGap);
    if (mouseX > x && mouseX < x + bw && mouseY > y && mouseY < y + bh)
      btn.action();
  });

  // SHOP BUTTONS
  if (mouseX > leftX && mouseX < leftX + bw && mouseY > shopY && mouseY < shopY + bh)
    row2[0].action();

  if (mouseX > rightX && mouseX < rightX + bw && mouseY > shopY && mouseY < shopY + bh)
    row2[1].action();
// MODIFIERS BUTTON FUNCTION
// ------------------------------
// MODIFIERS POPUP CLICK HANDLING
// ------------------------------
// ------------------------------
// MODIFIERS POPUP CLICK HANDLING
// ------------------------------
if (showModifiersPopup) {

  const popupW = canvas.width * 0.4;
  const popupH = canvas.height * 0.7;
  const px = canvas.width/2 - popupW/2;
  const py = canvas.height/2 - popupH/2;

  // Close button
  const closeX = px + popupW - 40;
  const closeY = py + 20;
  if (mouseX > closeX && mouseX < closeX + 30 && mouseY > closeY && mouseY < closeY + 30) {
    showModifiersPopup = false;
    return;
  }

  // Modifier list
  const modList = ["Hidden", "HardRock", "Easy", "SuddenDeath", "Perfect", "Bot"];
  const itemH = 50;

  modList.forEach((name, i) => {
    const bx = px + 40;
    const by = py + 80 + i * (itemH + 20);
    const bw = popupW - 80;
    const bh = itemH;

    if (mouseX > bx && mouseX < bx + bw && mouseY > by && mouseY < by + bh) {
      toggleModifier(name);
    }
  });

  return; // block clicks behind popup
}

  // MODIFIERS BUTTON (CIRCLE)
  const modX = canvas.width * 0.08;
  const modY = canvas.height * 0.55;
  const modR = canvas.height * 0.045;

  const dx = mouseX - modX;
  const dy = mouseY - modY;

  if (dx * dx + dy * dy <= modR * modR) {
    openModifiers();
  }
});

// ------------------------------
// DRAW BUTTON
// ------------------------------
function drawButton(btn, x, y, w, h) {
  const hover = mouseX > x && mouseX < x+w && mouseY > y && mouseY < y+h;

  ctx.fillStyle = hover ? "rgba(0,200,255,0.25)" : "rgba(255,255,255,0.08)";
  ctx.strokeStyle = hover ? "cyan" : "white";
  ctx.lineWidth = hover ? 4 : 2;

  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "white";
  ctx.font = `${Math.floor(canvas.height * 0.035)}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText(btn.text, x + w/2, y + h/2 + canvas.height * 0.012);
}

// ------------------------------
// DRAW MODIFIERS BUTTON
// ------------------------------
function drawModifiersButton() {
  const x = canvas.width * 0.08;
  const y = canvas.height * 0.55;
  const r = canvas.height * 0.045;

  const hover = (mouseX - x) ** 2 + (mouseY - y) ** 2 <= r ** 2;

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = hover ? "rgba(0,200,255,0.25)" : "rgba(255,255,255,0.08)";
  ctx.fill();

  ctx.strokeStyle = hover ? "cyan" : "white";
  ctx.lineWidth = hover ? 4 : 2;
  ctx.stroke();

  ctx.fillStyle = "white";
  ctx.font = `${Math.floor(canvas.height * 0.03)}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText("M", x, y + canvas.height * 0.01);
}

// ------------------------------
// MAIN LOOP
// ------------------------------
function loop() {

  ctx.fillStyle = "#050509";
  ctx.fillRect(0, 0, canvas.width, canvas.height);



  ctx.font = `${Math.floor(canvas.height * 0.04)}px monospace`;
  ctx.fillStyle = "gold";
  ctx.textAlign = "right";
  ctx.fillText(`Coins: ${getCoins()}`, canvas.width - 40, 40);

  ctx.fillStyle = "white";
  ctx.font = `${Math.floor(canvas.height * 0.08)}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText("SOUNDSPACE-V2", canvas.width/2, canvas.height * 0.15);

  ctx.font = `${Math.floor(canvas.height * 0.03)}px monospace`;
  ctx.fillStyle = "rgba(200,200,255,0.8)";
  ctx.fillText("Use ↑/↓ to select song", canvas.width/2, canvas.height * 0.20);

  drawSongList();

  const bw = canvas.width * 0.22;
  const bh = canvas.height * 0.08;
  const cx = canvas.width / 2;

  const rowGap = canvas.height * 0.05;

  const playY = canvas.height * 0.52;
  const midY  = playY + bh + rowGap;
  const shopY = midY + 2 * (bh + rowGap);

  const gap = canvas.width * 0.03;
  const leftX  = cx - bw - gap;
  const rightX = cx + gap;

  const row0 = buttons.filter(b => b.row === 0);
  const row1 = buttons.filter(b => b.row === 1);
  const row2 = buttons.filter(b => b.row === 2);

  // PLAY BUTTONS
  drawButton(row1[0], leftX,  playY, bw, bh);
  drawButton(row1[1], rightX, playY, bw, bh);

  // MIDDLE BUTTONS
  row0.forEach((btn, i) => {
    const x = cx - bw/2;
    const y = midY + i * (bh + rowGap);
    drawButton(btn, x, y, bw, bh);
  });

  // SHOP BUTTONS
  drawButton(row2[0], leftX,  shopY, bw, bh);
  drawButton(row2[1], rightX, shopY, bw, bh);

  // MODIFIERS BUTTON
  drawModifiersButton();
// ------------------------------
// DRAW MODIFIERS POPUP
// ------------------------------
if (showModifiersPopup) {
  // Darken background (fixed)
  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const popupW = canvas.width * 0.4;
  const popupH = canvas.height * 0.7;
  const px = canvas.width/2 - popupW/2;
  const py = canvas.height/2 - popupH/2;

  // Window
  ctx.fillStyle = "rgba(20,20,30,0.95)";
  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(px, py, popupW, popupH, 20);
  ctx.fill();
  ctx.stroke();

  // Title
  ctx.fillStyle = "white";
  ctx.font = `${Math.floor(canvas.height * 0.04)}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText("Modifiers", canvas.width/2, py + 50);

  // Close button
  ctx.fillStyle = "red";
  ctx.fillRect(px + popupW - 40, py + 20, 30, 30);
  ctx.fillStyle = "white";
  ctx.font = "24px monospace";
  ctx.fillText("X", px + popupW - 25, py + 42);

  // Modifier list
  const modList = ["Hidden", "HardRock", "Easy", "SuddenDeath", "Perfect", "Bot"];
  const itemH = 50;

  modList.forEach((name, i) => {
    const bx = px + 40;
    const by = py + 80 + i * (itemH + 20);
    const bw = popupW - 80;
    const bh = itemH;

    const active = modifiers[name];

    ctx.fillStyle = active ? "rgba(0,255,200,0.25)" : "rgba(255,255,255,0.08)";
    ctx.strokeStyle = active ? "cyan" : "white";
    ctx.lineWidth = active ? 4 : 2;

    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "white";
    ctx.font = `${Math.floor(canvas.height * 0.03)}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText(name, bx + bw/2, by + bh/2 + 10);
  });
}
  if (cursor.complete) ctx.drawImage(cursor, mouseX - 20, mouseY - 20, 40, 40);

  requestAnimationFrame(loop);
}

loop();
