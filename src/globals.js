


if (!localStorage.getItem("coins")) {
  localStorage.setItem("coins", "0");
}

export function getCoins() {
  return parseInt(localStorage.getItem("coins") || "0");
}

export function addCoins(amount) {
  console.log(`Adding ${amount} coins`);
  const current = getCoins();
  localStorage.setItem("coins", (current + amount).toString());
}

export function setCoins(amount) {
  localStorage.setItem("coins", amount.toString());
}
export function getOwnedItems() {
  const items = [];
  for (let key in localStorage) {
    if (localStorage.getItem(key) === "owned") {
      items.push(key);
    }
  }
  return items;
}
export const ITEM_DATA = {
  skin_blue:  { name: "Blue Cursor Skin",  price: 5000,  type: "cursor" },
    skin_green: { name: "Green Cursor Skin", price: 5000,  type: "cursor" },
      skin_orange: { name: "Orange Fruit Cursor Skin", price: 50000,  type: "cursor" },
        skin_witched: { name: "Witched Cursor Skin", price: 25000,  type: "cursor" },
         skin_dark_matter: { name: "Dark Matter Cursor Skin", price: 1000000,  type: "cursor" },
          skin_black_lightning:  { name: "Black Lightning Cursor Skin",  price: 500000,  type: "cursor" },
            skin_orange: { name: "Indexed Cursor Skin", price: 500, type: "cursor" },
             skin_plasma: { name: "Plasma Cursor Skin", price: 250000, type: "cursor" },
               skin_black_cursed: { name: "Black Cursed Cursor Skin", price: 300000, type: "cursor" },
               skin_cursed: { name: " Cursed Cursor Skin", price: 250000, type: "cursor" },
                skin_pixelated: { name: "Pixelated Cursor Skin", price: 75000, type: "cursor" },
                  skin_vortex: { name: "Vortex Cursor Skin", price: 50000, type: "cursor" },
                    skin_purple_triangle: { name: "Purple Triangle Cursor Skin", price: 1000000, type: "cursor" },
                      skin_bw_zigzag: { name: "Black And White Zigzag Cursor Skin", price: 10000000, type: "cursor" },
                        skin_blue_scratched: { name: "Blue Scratched Cursor Skin", price: 10000000, type: "cursor" },
                        skin_blackhole: { name: "Black Hole Cursor Skin", price: 0, type: "cursor", unbuyable: true },
                          skin_diamond: { name: "Diamond Cursor Skin", price: 0, type: "cursor", unbuyable: true },
                          skin_admin: { name: "Admin Cursor Skin", price: 0, type: "cursor", unbuyable: true }
};

export function equipItem(key) {
  const item = ITEM_DATA[key];
  if (!item) return;

  localStorage.setItem("equipped_" + item.type, key);
}

export function getEquipped(type) {
  return localStorage.getItem("equipped_" + type);
}




export const Globals = {
  background: "#050509",
  spawnWindow: 900,      // ms around hit time
  baseSize: 22,          // smaller base
  growSize: 38,          // smaller growth
  hitRadius: 42,         // hitbox
  timingWindow: 85,      // ms for hit
  panelBorderColor: "#ffffff",
  panelGlowColor: "rgba(0, 200, 255, 0.4)"
};
