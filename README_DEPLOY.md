# LXT / 夜樱记录室

这是一个不依赖构建工具的静态个人主页。页面入口是 `index.html`，内容与交互由 `styles.css` 和 `script.js` 提供，图片与 SVG 放在 `assets/`。

## 本地预览

在 `personal_site` 目录运行：

```bash
python -m http.server 8080
```

然后访问 `http://127.0.0.1:8080`。

## 部署到 GitHub Pages

站点通过 GitHub Pages 发布，不依赖外部域名或 NicNames：

- 仓库：`kexinior/myhub-homepage`
- 发布分支：`main`
- 发布目录：仓库根目录 `/`
- 线上地址：<https://kexinior.github.io/myhub-homepage/>

在 GitHub 仓库的 `Settings > Pages` 中，发布源设置为 `Deploy from a branch`、`main`、`/(root)`。每次推送到 `main` 后，GitHub Pages 会自动重新发布。

更新并发布：

```powershell
git add .
git commit -m "更新主页"
git push
```

## 内容修改

- 修改真实姓名、简介和技能：编辑 `index.html` 中的关于我区域。
- 替换角色：替换 `assets/yozumi-hachi.png` 与 `assets/yozumi-hachi-avatar.png`，并同步更新 `ASSET_LICENSES.md`。当前 HachiStudio 立绘为 CC0，可作为首版公开使用；后续换原创 OC 时保持相同文件尺寸即可。
- 添加项目和动态：在 `index.html` 中复制对应的项目或动态条目。
- 添加音乐：在确认音频授权后，在联系区域加入本地 `<audio controls>`，并移除 `data-audio-disabled` 状态。

## 素材授权

请阅读 [ASSET_LICENSES.md](./ASSET_LICENSES.md)。角色立绘具有可核验的 CC0 来源；夜景 SVG 的来源仍需确认，未来可以替换为原创素材。
