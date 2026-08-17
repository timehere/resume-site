const body = document.body;
const speech = document.getElementById("speech");
const petButton = document.getElementById("petButton");
const petZone = document.getElementById("petZone");
const petPhoto = document.querySelector(".pet-photo");
const pixelPetImage = document.querySelector(".pixel-pet-image");
const desktopClose = document.getElementById("desktopClose");
const styleButtons = Array.from(document.querySelectorAll(".mode-button"));
const actionButtons = Array.from(document.querySelectorAll(".action-button"));

const stillPhoto = "assets/fox-reference-pet.png";
const desktopStillPhoto = "assets/actions/idle-desktop.png";
const pixelStill = "assets/pixel-actions/pixel-idle.gif";
const actionGifs = {
  walk: "assets/actions/walk.gif",
  lie: "assets/actions/lie.gif",
  sleep: "assets/actions/sleep.gif",
  yawn: "assets/actions/yawn.gif",
  jump: "assets/actions/jump.gif",
  pet: "assets/actions/pet.gif",
  look: "assets/actions/look.gif",
  drag: "assets/actions/drag.gif",
  drop: "assets/actions/drop.gif"
};
const pixelActionGifs = {
  idle: pixelStill,
  walk: "assets/pixel-actions/pixel-walk.gif",
  lie: "assets/pixel-actions/pixel-lie.gif",
  sleep: "assets/pixel-actions/pixel-sleep.gif",
  yawn: "assets/pixel-actions/pixel-yawn.gif",
  jump: "assets/pixel-actions/pixel-jump.gif",
  pet: "assets/pixel-actions/pixel-pet.gif",
  look: "assets/pixel-actions/pixel-look.gif",
  drag: "assets/pixel-actions/pixel-drag.gif",
  drop: "assets/pixel-actions/pixel-drop.gif"
};

const lines = [
  "我在这里，尾巴也在认真陪你。",
  "刚刚我巡逻了一圈，桌面安全。",
  "你继续写，我负责看住分心。",
  "摸头可以，但不要摸太久，我会困。",
  "今天也要慢慢做完，不用一下子冲太猛。"
];

const actionText = {
  idle: "我在这里，尾巴也在认真陪你。",
  walk: "我去桌面边缘巡逻一下。",
  lie: "我先趴一会儿，耳朵还在听。",
  sleep: "我偷偷睡一小会儿。",
  yawn: "哈啊，休息一下也不丢人。",
  jump: "跳一下，给你加一点精神。",
  look: "我看到鼠标了。",
  pet: "嗯……摸头可以。",
  drag: "被拎起来了，尾巴要保持平衡。",
  drop: "落地，晃一下就稳了。",
  reminder: "你已经工作很久了，起来活动两分钟。",
  night: "晚上了，栗栗跟你说晚安。"
};

let lineIndex = 0;
let currentAction = "idle";
let lastInteraction = Date.now();
let dragStart = null;
let lastDragScreen = null;
let dragStartedAt = 0;
let isDragging = false;
let suppressNextClick = false;
let reminderShown = false;
const isDesktopPet = body.dataset.desktop === "true" && window.desktopPet;
let actionReturnTimer = null;
let autonomousTimer = null;
let desktopMoveTimer = null;
let speechTimer = null;
let desktopInteractive = false;
let facingDirection = -1;
let cursorLookActive = false;

const autonomousActions = [
  { action: "walk", duration: 4400, line: "我去桌面边缘巡逻一下。" },
  { action: "lie", duration: 6200, line: "我先趴一会儿。" },
  { action: "sleep", duration: 7600, line: "我偷偷打个盹。" },
  { action: "yawn", duration: 2600, line: "哈啊，稍微放松一下。" },
  { action: "jump", duration: 980, line: "跳一下，换换精神。" }
];

function say(text) {
  speech.textContent = text;
  if (!isDesktopPet) return;
  body.dataset.speaking = "true";
  if (speechTimer) window.clearTimeout(speechTimer);
  speechTimer = window.setTimeout(() => {
    delete body.dataset.speaking;
    speechTimer = null;
  }, 3600);
}

function setStyle(style) {
  body.dataset.style = style;
  styleButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.style === style);
  });
  refreshPetImages(currentAction);
  reportDesktopHitArea();
}

function swapImage(image, src, resetSrc) {
  if (!image) return;
  if (!image.src.endsWith(src)) {
    image.src = src;
    return;
  }
  if (src !== resetSrc) {
    image.src = resetSrc;
    void image.offsetWidth;
    image.src = src;
  }
}

function refreshPetImages(action) {
  if (petPhoto) {
    const basePhoto = isDesktopPet ? desktopStillPhoto : stillPhoto;
    swapImage(petPhoto, actionGifs[action] || basePhoto, basePhoto);
  }
  if (pixelPetImage) {
    swapImage(pixelPetImage, pixelActionGifs[action] || pixelStill, pixelStill);
  }
  reportDesktopHitArea();
  window.setTimeout(reportDesktopHitArea, 120);
}

function stopDesktopMotion() {
  if (desktopMoveTimer) {
    window.clearInterval(desktopMoveTimer);
    desktopMoveTimer = null;
  }
}

function setFacing(direction) {
  facingDirection = direction < 0 ? -1 : 1;
  body.dataset.facing = facingDirection < 0 ? "left" : "right";
}

function startDesktopWalk(duration) {
  if (!isDesktopPet || !window.desktopPet) return;
  stopDesktopMotion();
  const direction = facingDirection;
  const startedAt = Date.now();
  desktopMoveTimer = window.setInterval(() => {
    if (Date.now() - startedAt > duration || isDragging || currentAction !== "walk") {
      stopDesktopMotion();
      setFacing(-direction);
      return;
    }
    window.desktopPet.moveBy({ x: direction * 3, y: 0 });
  }, 140);
}

function setAction(action, options = {}) {
  currentAction = action;
  stopDesktopMotion();
  if (actionReturnTimer) {
    window.clearTimeout(actionReturnTimer);
    actionReturnTimer = null;
  }
  if (body.dataset.action === action) {
    body.dataset.action = "reset";
    void body.offsetWidth;
  }
  body.dataset.action = action;
  refreshPetImages(action);
  reportDesktopHitArea();
  if (actionText[action]) say(actionText[action]);
  if (action === "walk") startDesktopWalk(options.returnToIdle || 3200);
  actionButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.action === action);
  });
  if (options.returnToIdle) {
    actionReturnTimer = window.setTimeout(() => {
      actionReturnTimer = null;
      setAction("idle");
    }, options.returnToIdle);
  }
}

function markInteraction() {
  lastInteraction = Date.now();
  reminderShown = false;
}

function speakNext() {
  markInteraction();
  lineIndex = (lineIndex + 1) % lines.length;
  say(lines[lineIndex]);
  setAction("jump", { returnToIdle: 760 });
}

function randomDelay(min, max) {
  return Math.floor(min + Math.random() * (max - min));
}

function scheduleAutonomousActivity() {
  if (!isDesktopPet) return;
  if (autonomousTimer) window.clearTimeout(autonomousTimer);
  autonomousTimer = window.setTimeout(() => {
    const idleMs = Date.now() - lastInteraction;
    if (!isDragging && idleMs > 4500 && currentAction === "idle") {
      const next = autonomousActions[Math.floor(Math.random() * autonomousActions.length)];
      say(next.line);
      setAction(next.action, { returnToIdle: next.duration });
    }
    scheduleAutonomousActivity();
  }, randomDelay(6500, 13000));
}

function setDesktopInteractive(interactive) {
  if (!isDesktopPet || !window.desktopPet || desktopInteractive === interactive) return;
  desktopInteractive = interactive;
  window.desktopPet.setInteractive(interactive);
}

function reportDesktopHitArea() {
  if (!isDesktopPet || !window.desktopPet) return;
  window.requestAnimationFrame(() => {
    const image = body.dataset.style === "pixel2d" ? pixelPetImage : petPhoto;
    const rect = (image || petButton).getBoundingClientRect();
    const hitMask = buildImageHitMask(image, rect);
    if (hitMask) {
      window.desktopPet.setHitMask(hitMask);
      return;
    }
    const fallbackRect = petButton.getBoundingClientRect();
    const padX = 28;
    const padY = 30;
    window.desktopPet.setHitArea({
      x: fallbackRect.left + padX,
      y: fallbackRect.top + padY,
      width: fallbackRect.width - padX * 2,
      height: fallbackRect.height - padY * 2
    });
  });
}

function buildImageHitMask(image, rect) {
  if (!image || !rect.width || !rect.height || !image.complete) return null;
  const cols = 48;
  const rows = 64;
  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.clearRect(0, 0, cols, rows);
  try {
    context.drawImage(image, 0, 0, cols, rows);
    const pixels = context.getImageData(0, 0, cols, rows).data;
    const bits = [];
    for (let i = 0; i < pixels.length; i += 4) {
      bits.push(pixels[i + 3] > 28 ? 1 : 0);
    }
    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      cols,
      rows,
      bits
    };
  } catch {
    return null;
  }
}

function isInsidePetHitArea(event) {
  const image = body.dataset.style === "pixel2d" ? pixelPetImage : petPhoto;
  const rect = (image || petButton).getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  return x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
}

function updateDesktopMousePassthrough(event) {
  if (!isDesktopPet) return;
  setDesktopInteractive(isDragging || isInsidePetHitArea(event));
}

function updateCursorLook(state) {
  if (!isDesktopPet || !state || isDragging) return;
  const dx = Number(state.dx) || 0;
  const dy = Number(state.dy) || 0;
  const distance = Number(state.distance) || Number.POSITIVE_INFINITY;
  const maxDistance = 260;
  const lookX = clampForCss(dx / maxDistance, -1, 1);
  const lookY = clampForCss(dy / maxDistance, -0.8, 0.8);
  body.style.setProperty("--look-x", lookX.toFixed(3));
  body.style.setProperty("--look-y", lookY.toFixed(3));
  const shouldLook = distance < maxDistance || state.insidePet;
  if (shouldLook && !cursorLookActive && currentAction === "idle") {
    cursorLookActive = true;
    setAction("look");
  } else if (!shouldLook && cursorLookActive && currentAction === "look") {
    cursorLookActive = false;
    body.style.setProperty("--look-x", "0");
    body.style.setProperty("--look-y", "0");
    setAction("idle");
  } else if (!shouldLook) {
    cursorLookActive = false;
  }
}

function clampForCss(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

if (isDesktopPet) {
  window.addEventListener("mousemove", updateDesktopMousePassthrough);
  window.addEventListener("resize", reportDesktopHitArea);
  window.addEventListener("mouseleave", () => {
    if (!isDragging) setDesktopInteractive(false);
  });
  window.setInterval(reportDesktopHitArea, 1000);
  [petPhoto, pixelPetImage].forEach((image) => {
    if (image) image.addEventListener("load", reportDesktopHitArea);
  });
  window.desktopPet.onCursor(updateCursorLook);
}

styleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    markInteraction();
    setStyle(button.dataset.style);
  });
});

actionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    markInteraction();
    const action = button.dataset.action;
    setAction(action, action === "jump" ? { returnToIdle: 760 } : {});
  });
});

petButton.addEventListener("click", (event) => {
  if (suppressNextClick) {
    suppressNextClick = false;
    return;
  }
  if (!isDragging) speakNext();
});

petButton.addEventListener("dblclick", () => {
  if (!isDesktopPet) return;
  markInteraction();
  setStyle(body.dataset.style === "fox3d" ? "pixel2d" : "fox3d");
  say(body.dataset.style === "fox3d" ? "我切回 3D 形态了。" : "我变成 2D RPG 形态了。");
});

petZone.addEventListener("pointermove", (event) => {
  const rect = petButton.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const near = x > 42 && x < rect.width - 42 && y > 16 && y < rect.height - 26;
  const head = x > rect.width * 0.35 && x < rect.width * 0.62 && y > 16 && y < rect.height * 0.42;
  if (!isDragging && near && currentAction === "idle") setAction(head ? "pet" : "look");
});

petZone.addEventListener("pointerleave", () => {
  if (!isDragging && (currentAction === "look" || currentAction === "pet")) setAction("idle");
});

petButton.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  if (isDesktopPet && event.shiftKey) {
    markInteraction();
    setStyle(body.dataset.style === "fox3d" ? "pixel2d" : "fox3d");
    say(body.dataset.style === "fox3d" ? "我切回 3D 形态了。" : "我变成 2D RPG 形态了。");
    suppressNextClick = true;
    return;
  }
  markInteraction();
  setDesktopInteractive(true);
  dragStart = { x: event.clientX, y: event.clientY };
  lastDragScreen = { x: event.screenX, y: event.screenY };
  dragStartedAt = Date.now();
  petButton.setPointerCapture(event.pointerId);
});

petButton.addEventListener("pointermove", (event) => {
  if (!dragStart) return;
  event.preventDefault();
  const dx = event.clientX - dragStart.x;
  const dy = event.clientY - dragStart.y;
  if (!isDragging && Math.hypot(dx, dy) > 8) {
    isDragging = true;
    if (isDesktopPet) {
      window.desktopPet.startDrag({ screenX: event.screenX, screenY: event.screenY });
    }
    suppressNextClick = true;
    petButton.classList.add("is-dragging");
    setAction("drag");
  }
  if (isDragging) {
    if (isDesktopPet && lastDragScreen) {
      lastDragScreen = { x: event.screenX, y: event.screenY };
      if (Number.isFinite(lastDragScreen.x) && Number.isFinite(lastDragScreen.y)) {
        window.desktopPet.dragTo(lastDragScreen);
      }
    } else {
      petButton.style.transform = `translate(${dx}px, ${dy}px)`;
    }
  }
});

function finishDrag() {
  if (!dragStart) return;
  dragStart = null;
  lastDragScreen = null;
  const dragElapsed = Date.now() - dragStartedAt;
  dragStartedAt = 0;
  if (isDesktopPet) {
    window.desktopPet.endDrag();
  }
  if (isDragging) {
    isDragging = false;
    suppressNextClick = true;
    petButton.classList.remove("is-dragging");
    petButton.style.transform = "";
    setAction("drop", { returnToIdle: 720 });
    reportDesktopHitArea();
    window.setTimeout(() => setDesktopInteractive(false), 180);
    if (isDesktopPet && dragElapsed < 180) {
      window.setTimeout(speakNext, 0);
    }
  } else if (isDesktopPet) {
    window.setTimeout(() => setDesktopInteractive(false), 120);
  }
}

petButton.addEventListener("pointerup", finishDrag);
petButton.addEventListener("pointercancel", finishDrag);
window.addEventListener("pointerup", finishDrag);
window.addEventListener("blur", finishDrag);

if (desktopClose && window.desktopPet) {
  desktopClose.addEventListener("click", () => window.desktopPet.close());
}

window.setInterval(() => {
  const now = new Date();
  const idleMs = Date.now() - lastInteraction;
  if (!reminderShown && idleMs > 45_000) {
    reminderShown = true;
    setAction("sleep");
    say(actionText.reminder);
  }
  if (now.getHours() >= 22 && now.getMinutes() === 0) {
    say(actionText.night);
  }
}, 10_000);

setStyle("fox3d");
setFacing(-1);
setAction("idle");
reportDesktopHitArea();
scheduleAutonomousActivity();
