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

播放器通过 `https://api.i-meto.com/meting/api` 接入 Meting 托管接口，GitHub Pages 可以直接跨域读取中文歌单；页面不保留 Audius 或其他备用音源。接口失败时只显示错误与重试，不会切换到其他来源。

页面默认查询“周杰伦、林俊杰、古风”，可通过播放器根元素的 `data-platform`、`data-queries` 和 `data-limit` 调整。`music-server.mjs` 仍可用于自托管 Meting，但 GitHub Pages 不依赖它。平台音频版权仍由对应平台和权利人负责，公开部署前请确认使用范围。

本地预览可继续使用任意静态服务器。若需要验证自托管接口：

```powershell
npm install
npm start
```

然后访问 `http://127.0.0.1:8080/`。

线上地址：[https://kexinior.github.io/myhub-homepage/](https://kexinior.github.io/myhub-homepage/)

GitHub Pages 发布方式参见 [README_DEPLOY.md](./README_DEPLOY.md)，角色素材来源与许可参见 [ASSET_LICENSES.md](./ASSET_LICENSES.md)。
