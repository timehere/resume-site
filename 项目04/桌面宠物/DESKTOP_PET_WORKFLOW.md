# 桌面宠物制作流程

这份流程用于后续从一张宠物图像生成可运行的桌面宠物程序。后面用户给新宠物图像时，优先按这里执行。

## 1. 输入确认

- 收到宠物参考图。
- 确认目标形象：动物类型、主色、是否保留原图特点。
- 确认是否需要两种形态：
  - `3D` 或写实/半写实风格。
  - `2D RPG` 像素风格。
- 确认基础动作：
  - 走路。
  - 趴下。
  - 睡觉。
  - 打哈欠。
  - 跳一下。
  - 摸头眯眼。
  - 鼠标靠近时看鼠标。
  - 拖拽和放下。

## 2. 图像资产处理

- 从参考图中抠出宠物主体，生成透明背景图片。
- 保留宠物关键特征，例如耳朵、脸型、尾巴、毛色、表情气质。
- 输出 3D 主体图：
  - 静止图放入 `assets/actions/idle-desktop.png`。
  - 原始参考保留为 `assets/fox-reference-source.png` 或新命名。
- 输出 2D RPG 像素主体图：
  - 静止图放入 `assets/pixel-actions/pixel-idle.gif`。
  - 像素图要简化轮廓，但保留 3D 图的主要特征。

## 3. 动作生成

每个动作都要让“宠物图像本身变化”，不要只在图片外叠加表情或脚。

3D 动作文件放入 `assets/actions/`：

- `walk.gif`：循环迈步、身体轻微起伏、尾巴摆动。
- `lie.gif`：姿态趴下，不压缩整张图片。
- `sleep.gif`：趴下呼吸、闭眼、轻微睡眠节奏。
- `yawn.gif`：圆嘴张合。
- `jump.gif`：起跳、落地回弹。
- `pet.gif`：眯眼点头。
- `look.gif`：抬头看鼠标。
- `drag.gif`：被拎起来。
- `drop.gif`：落地晃动。

2D RPG 动作文件放入 `assets/pixel-actions/`：

- `pixel-walk.gif`
- `pixel-lie.gif`
- `pixel-sleep.gif`
- `pixel-yawn.gif`
- `pixel-jump.gif`
- `pixel-pet.gif`
- `pixel-look.gif`
- `pixel-drag.gif`
- `pixel-drop.gif`

## 4. 前端预览

主要文件：

- `index.html`：普通浏览器预览。
- `desktop.html`：桌面宠物窗口。
- `styles.css`：通用样式。
- `desktop.css`：桌面版尺寸、透明窗口、缩放、视线跟随。
- `app.js`：动作切换、互动、自动行为。

检查点：

- 3D 和 2D 可以切换。
- 每个动作按钮能显示对应动图。
- 点击不会误触发拖拽。
- 拖拽只有在按住并移动超过阈值后触发。
- 鼠标靠近时进入看鼠标状态。

## 5. 桌面互动逻辑

当前默认交互：

- 短点击宠物：随机说一句话。
- 按住并移动：拖动宠物。
- 松开：落地晃动。
- 鼠标靠近：视线跟随鼠标。
- 鼠标远离：恢复待机。
- `Shift` + 点击：切换 `3D` / `2D RPG`。
- 双击：也可以切换 `3D` / `2D RPG`。
- 长时间不操作：偷偷打盹或提醒休息。
- 晚上：说晚安。

## 6. Electron 桌面化

主要文件：

- `electron/main.js`
  - 创建透明无边框窗口。
  - 设置 always-on-top。
  - 启动时定位到桌面右下角。
  - 控制窗口拖动。
  - 读取系统鼠标位置并发送给页面，用于视线跟随。
- `electron/preload.js`
  - 暴露安全 IPC：
    - `moveBy`
    - `startDrag`
    - `dragTo`
    - `endDrag`
    - `setInteractive`
    - `setHitArea`
    - `setHitMask`
    - `onCursor`
    - `close`

桌面版注意点：

- 不要依赖浏览器页面路径启动。
- 启动脚本必须固定进入项目目录：
  - `/Users/a1234/Documents/宠物`
- 桌面 App 当前目标路径：
  - `/Users/a1234/Desktop/桌面宠物/栗栗桌面宠物.app`

## 7. 打包流程

先做语法检查：

```bash
/Users/a1234/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check app.js
/Users/a1234/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check electron/main.js
/Users/a1234/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check electron/preload.js
```

打包 universal macOS App：

```bash
PATH=/Users/a1234/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/a1234/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback:$PATH \
/Users/a1234/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm run pack:universal
```

替换桌面 App 时使用 `ditto`，不要用普通复制破坏 `.app` 内部结构：

```bash
ditto "/Users/a1234/Documents/宠物/dist/栗栗桌面宠物-darwin-universal/栗栗桌面宠物.app" "/Users/a1234/Desktop/桌面宠物/栗栗桌面宠物.app"
```

签名并验证：

```bash
codesign --force --deep --sign - "/Users/a1234/Desktop/桌面宠物/栗栗桌面宠物.app"
codesign --verify --deep --strict --verbose=2 "/Users/a1234/Desktop/桌面宠物/栗栗桌面宠物.app"
```

## 8. 验证清单

打包后必须验证：

- App 能打开，并且进程路径是：
  - `/Users/a1234/Desktop/桌面宠物/栗栗桌面宠物.app`
- `Contents/Resources/app/assets/actions/` 存在完整动作 GIF。
- 点击宠物不会出现破图。
- 点击只说话，不会直接变成拖拽图。
- 拖拽能移动到目标位置。
- 右下角可以放置。
- 3D/2D 切换正常。
- 鼠标靠近时视线跟随。
- 离远后恢复待机。

## 9. 常见问题

### 点击后出现破图

通常是资源路径错了，或从错误目录启动。检查：

- 是否从完整 App 启动。
- 是否误用桌面文件夹作为工作目录。
- `assets/actions/*.gif` 是否在 App 包内。
- 启动脚本是否固定 `cd "/Users/a1234/Documents/宠物"`。

### 拖不动

检查：

- 是否关闭了旧的透明窗口穿透逻辑。
- `pointerdown` 不要立即进入拖拽，要移动超过阈值才拖拽。
- 主进程坐标必须校验为有效数字。

### App 双击没反应

检查：

- `.app` 是否用 `ditto` 复制。
- 是否完成 `codesign`。
- 是否还有旧进程占用。

## 10. 后续复用方式

当用户给新宠物图像时：

1. 先按第 1 节确认形象和动作。
2. 按第 2 节生成透明主体图。
3. 按第 3 节生成 3D 和 2D 动作图。
4. 替换 `assets/actions/` 和 `assets/pixel-actions/`。
5. 更新必要命名和文案。
6. 跑第 7 节打包流程。
7. 按第 8 节逐项验证。
