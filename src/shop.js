import { getCoins, setCoins, ITEM_DATA } from "./globals.js";
import { alertPopup } from "./alert.js";
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let scrollY = 0;
let scrollSpeed = 20;

addEventListener("wheel", e => {
  scrollY += e.deltaY > 0 ? scrollSpeed : -scrollSpeed;
});

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener("resize", resize);

let mouseX = 0, mouseY = 0;
addEventListener("mousemove", e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// Convert ITEM_DATA → array

const items = Object.entries(ITEM_DATA)
  .filter(([key, data]) => !data.unbuyable)
  .map(([key, data]) => ({
    key,
    name: data.name,
    price: data.price
  }));


function fitTextToWidth(text, maxWidth) {
  let size = 28;
  ctx.font = `${size}px monospace`;
  while (ctx.measureText(text).width > maxWidth - 20) {
    size--;
    ctx.font = `${size}px monospace`;
  }
  return size;
}

function buyItem(item) {
  const coins = getCoins();


  if (localStorage.getItem(item.key) === "owned") {
    alertPopup(`You already own ${item.name}!`);
    return;
  }

  if (coins < item.price) {
    alertPopup("Not enough coins!");
    return;
  }

  setCoins(coins - item.price);
  localStorage.setItem(item.key, "owned");
  alertPopup(`Purchased: ${item.name}!`);
}


canvas.addEventListener("click", () => {
  const cardW = canvas.width * 0.28;
  const cardH = canvas.height * 0.18;

  const startX = canvas.width * 0.15;
  const startY = canvas.height * 0.22;
  const gapX = canvas.width * 0.1;
  const gapY = canvas.height * 0.05;

  // Back button
  const backW = canvas.width * 0.15;
  const backH = canvas.height * 0.07;
  const backX = 40;
  const backY = 40;

  if (mouseX > backX && mouseX < backX + backW && mouseY > backY && mouseY < backY + backH) {
    window.location.href = "/index.html";
    return;
  }

  // Item cards
  items.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);

    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY) - scrollY;

    if (mouseX > x && mouseX < x + cardW && mouseY > y && mouseY < y + cardH) {
      buyItem(item);
    }
  });
});

function drawCard(item, x, y, w, h, hover) {
  ctx.fillStyle = hover ? "rgba(0,200,255,0.25)" : "rgba(255,255,255,0.06)";
  ctx.strokeStyle = hover ? "cyan" : "white";
  ctx.lineWidth = hover ? 4 : 2;

  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.fill();
  ctx.stroke();

  const fontSize = fitTextToWidth(item.name, w);
  ctx.font = `${fontSize}px monospace`;
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText(item.name, x + w / 2, y + h * 0.45);

  ctx.font = `${fontSize * 0.8}px monospace`;
  ctx.fillStyle = "gold";
  ctx.fillText(`${item.price} coins`, x + w / 2, y + h * 0.75);
}

function loop() {
  ctx.fillStyle = "#050509";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  ctx.fillStyle = "white";
  ctx.font = "56px monospace";
  ctx.textAlign = "center";
  ctx.fillText("SHOP", canvas.width / 2, 100);

  // Coins
  ctx.font = "32px monospace";
  ctx.fillStyle = "gold";
  ctx.textAlign = "right";
  ctx.fillText(`Coins: ${getCoins()}`, canvas.width - 40, 50);

  // Back button
  const backW = canvas.width * 0.15;
  const backH = canvas.height * 0.07;
  const backX = 40;
  const backY = 40;

  const backHover = mouseX > backX && mouseX < backX + backW && mouseY > backY && mouseY < backY + backH;

  ctx.fillStyle = backHover ? "rgba(255,80,80,0.25)" : "rgba(255,255,255,0.08)";
  ctx.strokeStyle = backHover ? "red" : "white";
  ctx.lineWidth = backHover ? 4 : 2;

  ctx.beginPath();
  ctx.roundRect(backX, backY, backW, backH, 12);
  ctx.fill();
  ctx.stroke();

  ctx.font = `${Math.floor(canvas.height * 0.035)}px monospace`;
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText("Back", backX + backW / 2, backY + backH / 2 + 12);

  // Item grid
  const cardW = canvas.width * 0.28;
  const cardH = canvas.height * 0.18;

  const startX = canvas.width * 0.15;
  const startY = canvas.height * 0.22;
  const gapX = canvas.width * 0.1;
  const gapY = canvas.height * 0.05;

  items.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);

    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY) - scrollY;

    const hover = mouseX > x && mouseX < x + cardW && mouseY > y && mouseY < y + cardH;
    drawCard(item, x, y, cardW, cardH, hover);
  });

  // Scroll clamp
  const totalRows = Math.ceil(items.length / 2);
  const totalHeight = totalRows * (cardH + gapY);
  const maxScroll = Math.max(0, totalHeight - (canvas.height - 250));

  if (scrollY < 0) scrollY = 0;
  if (scrollY > maxScroll) scrollY = maxScroll;

  requestAnimationFrame(loop);
}

loop();
