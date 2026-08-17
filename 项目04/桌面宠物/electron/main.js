const { app, BrowserWindow, ipcMain, screen } = require("electron");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

let petWindow = null;
let petHitArea = null;
let petHitMask = null;
let forceInteractive = false;
let passthroughTimer = null;
let dragOffset = null;
let dragTimer = null;
const useMousePassthrough = false;
const windowSize = { width: 150, height: 195 };
const edgeMargin = 18;
const isWindows = process.platform === "win32";

if (isWindows) {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch("disable-gpu");
  app.commandLine.appendSwitch("disable-software-rasterizer");
}

function logError(error) {
  try {
    const message = error?.stack || error?.message || String(error);
    const logPath = path.join(os.homedir(), "Desktop", "lili-desktop-pet-error.log");
    fs.appendFileSync(logPath, `[${new Date().toISOString()}]\n${message}\n\n`, "utf8");
  } catch {
    // Ignore logging failures so error handling does not trigger another crash.
  }
}

process.on("uncaughtException", logError);
process.on("unhandledRejection", logError);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toFiniteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeCursorPoint(point, win) {
  const bounds = win.getBounds();
  const cursor = screen.getCursorScreenPoint();
  return {
    screenX: toFiniteNumber(point?.screenX, cursor.x || bounds.x + bounds.width / 2),
    screenY: toFiniteNumber(point?.screenY, cursor.y || bounds.y + bounds.height / 2)
  };
}

function positionAtBottomRight(win) {
  const display = screen.getPrimaryDisplay().workArea;
  const x = Math.round(display.x + display.width - windowSize.width - edgeMargin);
  const y = Math.round(display.y + display.height - windowSize.height - edgeMargin);
  win.setPosition(x, y, false);
}

function createPetWindow() {
  petWindow = new BrowserWindow({
    width: windowSize.width,
    height: windowSize.height,
    minWidth: windowSize.width,
    minHeight: windowSize.height,
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.platform === "darwin") {
    petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    petWindow.setAlwaysOnTop(true, "floating");
  } else {
    petWindow.setAlwaysOnTop(true);
  }
  petWindow.setIgnoreMouseEvents(false);
  positionAtBottomRight(petWindow);
  petWindow.loadFile(path.join(__dirname, "..", "desktop.html"));

  passthroughTimer = setInterval(() => {
    updateMousePassthrough();
    sendCursorState(petWindow);
  }, 80);
  petWindow.on("closed", () => {
    if (passthroughTimer) clearInterval(passthroughTimer);
    if (dragTimer) clearInterval(dragTimer);
    passthroughTimer = null;
    dragTimer = null;
    petWindow = null;
    petHitArea = null;
    petHitMask = null;
    forceInteractive = false;
    dragOffset = null;
  });
}

function isCursorInsidePet(win) {
  if (!petHitArea) return false;
  const point = screen.getCursorScreenPoint();
  const bounds = win.getBounds();
  const x = point.x - bounds.x;
  const y = point.y - bounds.y;
  if (petHitMask) {
    if (
      x < petHitMask.x ||
      x > petHitMask.x + petHitMask.width ||
      y < petHitMask.y ||
      y > petHitMask.y + petHitMask.height
    ) {
      return false;
    }
    const maskX = clamp(Math.floor(((x - petHitMask.x) / petHitMask.width) * petHitMask.cols), 0, petHitMask.cols - 1);
    const maskY = clamp(Math.floor(((y - petHitMask.y) / petHitMask.height) * petHitMask.rows), 0, petHitMask.rows - 1);
    return petHitMask.bits[maskY * petHitMask.cols + maskX] === 1;
  }
  return (
    x >= petHitArea.x &&
    x <= petHitArea.x + petHitArea.width &&
    y >= petHitArea.y &&
    y <= petHitArea.y + petHitArea.height
  );
}

function updateMousePassthrough() {
  if (!petWindow || petWindow.isDestroyed()) return;
  if (!useMousePassthrough) {
    petWindow.setIgnoreMouseEvents(false);
    return;
  }
  const interactive = Boolean(dragOffset) || forceInteractive || isCursorInsidePet(petWindow);
  petWindow.setIgnoreMouseEvents(!interactive, { forward: true });
}

function sendCursorState(win) {
  if (!win || win.isDestroyed()) return;
  const cursor = screen.getCursorScreenPoint();
  const bounds = win.getBounds();
  const target = petHitArea || { x: 0, y: 0, width: bounds.width, height: bounds.height };
  const centerX = bounds.x + target.x + target.width / 2;
  const centerY = bounds.y + target.y + target.height / 2;
  const dx = cursor.x - centerX;
  const dy = cursor.y - centerY;
  win.webContents.send("desktop-pet:cursor", {
    screenX: cursor.x,
    screenY: cursor.y,
    localX: cursor.x - bounds.x,
    localY: cursor.y - bounds.y,
    dx,
    dy,
    distance: Math.hypot(dx, dy),
    insidePet: isCursorInsidePet(win)
  });
}

function getWindowLimits(win, point) {
  const bounds = win.getBounds();
  const cursorPoint = normalizeCursorPoint(point, win);
  const display = screen.getDisplayNearestPoint({
    x: Math.round(cursorPoint.screenX),
    y: Math.round(cursorPoint.screenY)
  }).bounds;
  const target = petHitArea || { x: 0, y: 0, width: bounds.width, height: bounds.height };
  return {
    minX: display.x - target.x,
    maxX: display.x + display.width - target.x - target.width,
    minY: display.y - target.y,
    maxY: display.y + display.height - target.y - target.height
  };
}

function moveWindowToCursor(win, point) {
  const bounds = win.getBounds();
  const cursorPoint = normalizeCursorPoint(point, win);
  const limits = getWindowLimits(win, cursorPoint);
  const offset = dragOffset || { x: bounds.width / 2, y: bounds.height / 2 };
  const nextX = clamp(Math.round(cursorPoint.screenX - offset.x), limits.minX, limits.maxX);
  const nextY = clamp(Math.round(cursorPoint.screenY - offset.y), limits.minY, limits.maxY);
  if (!Number.isFinite(nextX) || !Number.isFinite(nextY)) return;
  win.setPosition(nextX, nextY, false);
}

function moveWindowBy(win, delta) {
  const bounds = win.getBounds();
  const limits = getWindowLimits(win);
  const nextX = clamp(bounds.x + Math.round(delta.x || 0), limits.minX, limits.maxX);
  const nextY = clamp(bounds.y + Math.round(delta.y || 0), limits.minY, limits.maxY);
  win.setPosition(nextX, nextY, false);
}

function stopDragFollow() {
  if (dragTimer) clearInterval(dragTimer);
  dragTimer = null;
}

function startDragFollow(win) {
  stopDragFollow();
  const startedAt = Date.now();
  dragTimer = setInterval(() => {
    if (!win || win.isDestroyed() || !dragOffset) {
      stopDragFollow();
      return;
    }
    if (Date.now() - startedAt > 15000) {
      dragOffset = null;
      forceInteractive = false;
      stopDragFollow();
      updateMousePassthrough();
      return;
    }
    const point = screen.getCursorScreenPoint();
    moveWindowToCursor(win, { screenX: point.x, screenY: point.y });
  }, 16);
}

app.whenReady().then(() => {
  createPetWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createPetWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.on("desktop-pet:move", (event, delta) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || !delta) return;

  moveWindowBy(win, delta);
});

ipcMain.on("desktop-pet:start-drag", (event, point) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || !point) return;
  const bounds = win.getBounds();
  const cursorPoint = normalizeCursorPoint(point, win);
  dragOffset = {
    x: Math.round(cursorPoint.screenX - bounds.x),
    y: Math.round(cursorPoint.screenY - bounds.y)
  };
  forceInteractive = true;
  updateMousePassthrough();
  startDragFollow(win);
});

ipcMain.on("desktop-pet:drag-to", (event, point) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || !point) return;
  moveWindowToCursor(win, point);
});

ipcMain.on("desktop-pet:end-drag", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  dragOffset = null;
  forceInteractive = false;
  stopDragFollow();
  updateMousePassthrough();
});

ipcMain.on("desktop-pet:close", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});

ipcMain.on("desktop-pet:set-interactive", (event, interactive) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  forceInteractive = Boolean(interactive);
  updateMousePassthrough();
});

ipcMain.on("desktop-pet:set-hit-area", (event, area) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || !area) return;
  petHitArea = {
    x: Math.round(area.x || 0),
    y: Math.round(area.y || 0),
    width: Math.round(area.width || 0),
    height: Math.round(area.height || 0)
  };
  updateMousePassthrough();
});

ipcMain.on("desktop-pet:set-hit-mask", (event, mask) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || !mask || !Array.isArray(mask.bits)) return;
  petHitMask = {
    x: Math.round(mask.x || 0),
    y: Math.round(mask.y || 0),
    width: Math.round(mask.width || 0),
    height: Math.round(mask.height || 0),
    cols: Math.max(1, Math.round(mask.cols || 1)),
    rows: Math.max(1, Math.round(mask.rows || 1)),
    bits: mask.bits.map((bit) => (bit ? 1 : 0))
  };
  petHitArea = {
    x: petHitMask.x,
    y: petHitMask.y,
    width: petHitMask.width,
    height: petHitMask.height
  };
  updateMousePassthrough();
});
