# Vallfirest 本地高保真复刻

来源：https://www.vallfirest.com/ 。保留原站的 HTML、CSS、JavaScript、图片、字体和西班牙语文案；包括首页及首页直接链接的 77 个页面，其中包含英文首页。

## 启动

```sh
git clone --single-branch --branch prototype/vallfirest-html https://github.com/tangtianshuo/prototype.git
cd prototype
python3 serve.py
```

浏览器打开 http://localhost:8090/ 。可通过 `python3 serve.py 8091` 自定义端口。

这是静态 HTML/CSS/JS 项目，无需 npm、构建步骤或第三方运行依赖。Python 只用于提供静态 HTTP 服务。请通过 HTTP 访问，以确保根路径资源和本地搜索正常加载。

## 文件

- `index.html`：西班牙语首页。
- `en/index.html`：英文首页。
- 各页面目录：分类、四大业务、公司介绍、经销商、产品详情、新闻和联系等页面。
- `templates/`：原站样式、图片、交互脚本。
- `media/`：原始产品、横幅、新闻等图片。
- `assets/external/`：本地化的字体及外部库。
- `local.js` / `local.css`：本地全文搜索、Cookie 选择记忆、静态表单反馈及辅助样式。
- `search-index.json`：本地页面搜索索引。
- `manifest.json`：源地址、本地资源映射及下载异常。
- `verification.json`：校验结果。
- `screenshots/home-desktop.png`：桌面首页截图。
- `tools/mirror.py`：抓取与路径本地化脚本，仅重新抓取时需要 requests、beautifulsoup4。

## 复刻范围与校验

共保存 78 个页面，约 129 MB。所有本地 HTML 中的图片、样式表及链接路径已检查，无缺失文件。已在浏览器检查首页与头盔分类页、Cookie 拒绝按钮、搜索入口及搜索结果。原站桌面端的版式、图片裁切和文本为复刻基准。已检查 390px 窄屏，保留的原站桌面模板存在最小宽度限制，窄屏会横向滚动；未另外改造成移动版。

轮播、导航菜单、弹窗、产品滑块和地图沿用原站交互代码。本地搜索在已保存页面中查找。登录、购物车结算、邮件订阅和联系表单未实现服务端；表单提交显示本地预览提示。未抓取的更深层链接和其余语言版本保留原站链接。部分内页的视频来自 Vimeo，需要外部服务支持；原站失效的 4 个旧 CSS 资源引用记录在 manifest 中。

仅用于用户指定的本地复刻，图片、文案与商标的权利归原权利人。
