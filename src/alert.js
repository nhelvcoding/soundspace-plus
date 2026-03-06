export function alertPopup(text) {
  // Remove existing popup if any
  const old = document.getElementById("alertPopup");
  if (old) old.remove();

  // Create popup container
  const popup = document.createElement("div");
  popup.id = "alertPopup";
  popup.style.position = "fixed";
  popup.style.left = "50%";
  popup.style.top = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.background = "rgba(20,20,20,0.95)";
  popup.style.border = "2px solid white";
  popup.style.padding = "20px 30px";
  popup.style.borderRadius = "12px";
  popup.style.color = "white";
  popup.style.fontFamily = "monospace";
  popup.style.fontSize = "22px";
  popup.style.textAlign = "center";
  popup.style.zIndex = "9999";
  popup.style.minWidth = "300px";
  popup.style.maxWidth = "500px";
  popup.style.boxShadow = "0 0 20px rgba(255,255,255,0.3)";

  // Message text
  const msg = document.createElement("div");
  msg.innerText = text;
  popup.appendChild(msg);

  // OK button
  const btn = document.createElement("button");
  btn.innerText = "OK";
  btn.style.marginTop = "20px";
  btn.style.padding = "10px 20px";
  btn.style.fontSize = "18px";
  btn.style.fontFamily = "monospace";
  btn.style.cursor = "pointer";
  btn.style.borderRadius = "8px";
  btn.style.border = "2px solid white";
  btn.style.background = "rgba(255,255,255,0.1)";
  btn.style.color = "white";

  btn.onmouseenter = () => {
    btn.style.background = "rgba(255,255,255,0.25)";
  };
  btn.onmouseleave = () => {
    btn.style.background = "rgba(255,255,255,0.1)";
  };

  btn.onclick = () => popup.remove();

  popup.appendChild(btn);

  document.body.appendChild(popup);
}
