# LXT / 夜樱记录室

这是一个不依赖构建工具的静态个人主页。页面入口是 `index.html`，内容与交互由 `styles.css` 和 `script.js` 提供，图片与 SVG 放在 `assets/`。

## 本地预览

在 `personal_site` 目录运行：

```bash
python -m http.server 8080
```

然后访问 `http://127.0.0.1:8080`。

## 部署到 Cloudflare Pages

1. 登录 Cloudflare，创建一个 Pages 项目。
2. 选择 Direct Upload，上传整个 `personal_site` 目录。
3. 不填写 Build command；输出目录使用上传目录本身。
4. 在 Pages 项目的 Custom domains 中添加：
   - `myhub.cyou`
   - `www.myhub.cyou`
5. 为了让根域名由 Cloudflare 自动签发 HTTPS，进入 NicNames 的域名 DNS 设置，把当前停放用的 Nameserver 替换为 Cloudflare 分配的两条 Nameserver。这里是切换 DNS 管理方，不是转移域名所有权。
6. 等待 DNS 生效后，在 Cloudflare 中打开 Always Use HTTPS。将 `www.myhub.cyou` 设为跳转到根域名的规范地址。

域名仍由 NicNames 持有和续费。确认新站点正常后，可以停止不需要的 NicNames Website Builder 订阅，但不要取消域名续费。

## 内容修改

- 修改真实姓名、简介和技能：编辑 `index.html` 中的关于我区域。
- 替换角色：替换 `assets/yozumi-hachi.png` 与 `assets/yozumi-hachi-avatar.png`，并同步更新 `ASSET_LICENSES.md`。当前 HachiStudio 立绘为 CC0，可作为首版公开使用；后续换原创 OC 时保持相同文件尺寸即可。
- 添加项目和动态：在 `index.html` 中复制对应的项目或动态条目。
- 添加音乐：在确认音频授权后，在联系区域加入本地 `<audio controls>`，并移除 `data-audio-disabled` 状态。

## 素材授权

请阅读 [ASSET_LICENSES.md](./ASSET_LICENSES.md)。当前项目中的角色和夜景 SVG 是原有本地素材，目录没有作者和许可证记录，正式公开或商业使用前需要确认来源或替换为明确授权的素材。

未来可以使用 `project.myhub.cyou`、`ys.myhub.cyou` 等子域名部署其他静态项目。
