const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopPet", {
  moveBy(delta) {
    ipcRenderer.send("desktop-pet:move", delta);
  },
  startDrag(point) {
    ipcRenderer.send("desktop-pet:start-drag", point);
  },
  dragTo(point) {
    ipcRenderer.send("desktop-pet:drag-to", point);
  },
  endDrag() {
    ipcRenderer.send("desktop-pet:end-drag");
  },
  setInteractive(interactive) {
    ipcRenderer.send("desktop-pet:set-interactive", Boolean(interactive));
  },
  setHitArea(area) {
    ipcRenderer.send("desktop-pet:set-hit-area", area);
  },
  setHitMask(mask) {
    ipcRenderer.send("desktop-pet:set-hit-mask", mask);
  },
  onCursor(callback) {
    if (typeof callback !== "function") return;
    ipcRenderer.on("desktop-pet:cursor", (_event, state) => callback(state));
  },
  close() {
    ipcRenderer.send("desktop-pet:close");
  }
});
