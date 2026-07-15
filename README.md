# LXT / 夜樱记录室

静态个人主页源码，采用原生 HTML、CSS 和 JavaScript 构建。

页面以虚拟动漫站长“络莉”和真实个人资料并列展示，包含关于我、兴趣、项目、近期动态与公开联系方式等区域。全页面提供自然飘落与点击爆发樱花效果，本地预览环境还会启用底部音乐播放器。

## 本地预览

在当前目录启动任意静态文件服务器，例如：

```powershell
python -m http.server 8080
```

然后访问 `http://127.0.0.1:8080`。

运行内置逻辑测试：

```powershell
node --test tests/*.test.mjs
```

播放器使用本地 Node 服务接入开源的 Meting 聚合框架，通过网易云音乐、QQ 音乐、酷狗、酷我和百度音乐查询中文歌单；页面不再保留 Audius 或其他备用音源。播放器请求 `/api/music` 获取曲目元数据和播放地址，失败时只显示错误与重试，不会切换到其他来源。

Meting 服务端默认查询“周杰伦、林俊杰、古风”，可通过 `platform`、`queries` 和 `limit` 调整。由于 GitHub Pages 只能托管静态文件，线上部署需要另行运行 `music-server.mjs` 并将页面的 `/api/music` 反向代理到该服务；默认公开页面不会在没有后端时假装可用。平台音频版权仍由对应平台和权利人负责，公开部署前请确认使用范围。

启动完整播放器：

```powershell
npm install
npm start
```

然后访问 `http://127.0.0.1:8080/`。仅运行 `python -m http.server` 不会提供 Meting API。

线上地址：[https://kexinior.github.io/myhub-homepage/](https://kexinior.github.io/myhub-homepage/)

GitHub Pages 发布方式参见 [README_DEPLOY.md](./README_DEPLOY.md)，角色素材来源与许可参见 [ASSET_LICENSES.md](./ASSET_LICENSES.md)。
