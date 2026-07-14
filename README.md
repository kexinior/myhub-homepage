# LXT / 夜樱记录室

静态个人主页源码，采用原生 HTML、CSS 和 JavaScript 构建。

页面以虚拟动漫站长“络莉”和真实个人资料并列展示，包含关于我、兴趣、项目、近期动态与公开联系方式等区域。首屏提供自然飘落与点击爆发樱花效果，本地预览环境还会启用底部音乐播放器。

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

音乐清单来自 `kexinior/my-music` 的 `playlist.json`。播放器在 `localhost` 和 `127.0.0.1` 自动启用；公开站点保持禁用，直至音频公开播放授权得到确认。

线上地址：[https://kexinior.github.io/myhub-homepage/](https://kexinior.github.io/myhub-homepage/)

GitHub Pages 发布方式参见 [README_DEPLOY.md](./README_DEPLOY.md)，角色素材来源与许可参见 [ASSET_LICENSES.md](./ASSET_LICENSES.md)。
