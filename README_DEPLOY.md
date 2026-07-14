# LXT / 夜樱记录室

这是一个不依赖构建工具的静态个人主页。页面入口是 `index.html`，通用交互由 `script.js` 提供，樱花与播放器分别由 `sakura-effects.mjs` 和 `music-player.mjs` 提供；播放器样式位于 `music-player.css`，其余页面样式位于 `styles.css`。

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
- 替换角色：替换 `assets/yozumi-dream-room.png` 与 `assets/yozumi-dream-avatar.png`，并同步更新 `ASSET_LICENSES.md`。当前图片来自用户提供的素材，公开发布前需要确认原图授权；后续换原创 OC 时保持相同文件尺寸即可。
- 添加项目和动态：在 `index.html` 中复制对应的项目或动态条目。
- 添加音乐：在 `kexinior/my-music` 的 `playlist.json` 中追加具有唯一 `id` 的曲目，并确保 `title`、`artist`、`src` 完整。主页会相对清单地址解析音频路径。
- 公开播放器：确认所有音频具备公开播放授权后，将 `index.html` 中播放器根元素的 `data-public-enabled` 改为 `true`。默认值 `false` 只允许 `localhost` 和 `127.0.0.1` 本地预览，公开页面不会请求播放清单。

## 素材授权

请阅读 [ASSET_LICENSES.md](./ASSET_LICENSES.md)。当前页面使用的梦幻房间插画、头像裁切及音乐均需由素材提供者确认公开使用范围；未确认前不要开启公开播放器。
