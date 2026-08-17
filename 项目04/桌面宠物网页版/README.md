# 栗栗网页版宠物

这是可以直接上传到 GitHub 的静态网页版。

## 文件结构

- `index.html`：网页入口
- `styles.css`：页面样式和动画
- `app.js`：宠物互动逻辑
- `assets/`：3D 和 2D RPG 动作素材

## 本地预览

在这个目录运行：

```bash
python3 -m http.server 5173
```

然后打开：

```text
http://127.0.0.1:5173/index.html
```

## 上传到 GitHub

把这个目录里的所有文件上传到仓库中的一个文件夹，例如：

```text
项目04/桌面宠物网页版/
```

上传后，`index.html` 必须和 `styles.css`、`app.js`、`assets/` 保持在同一层级。

