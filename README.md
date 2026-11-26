# 原型索引

本仓库按分支保存各个原型，`main` 仅保留本索引。

| 原型 | 分支 | 内容与启动方式 |
| --- | --- | --- |
| Vallfirest 网站高保真复刻 | [prototype/vallfirest-html](https://github.com/tangtianshuo/prototype/tree/prototype/vallfirest-html) | 原生 HTML / CSS / JavaScript，含 78 个页面、原站图片、字体和文字。切换到该分支后执行 `python3 serve.py`，访问 `http://localhost:8090/`。 |
| SENTRA 消防 / 安防 / 救援独立站 v2 | [prototype/sentra-safety-html](https://github.com/tangtianshuo/prototype/tree/prototype/sentra-safety-html) | 原生 HTML / CSS / JavaScript，46 页、24 件示例产品，中英文、响应式、全宽自动轮播与隐藏切换控件、搜索筛选及本地询价；执行 `python3 -m http.server 8086 --bind 127.0.0.1`，访问 `http://localhost:8086/`。Cloudflare Pages：[在线预览](https://prototype-sentra-safety-html.prototype-37z.pages.dev/)。 |
| STRATA X1 航拍无人机 | [prototype/strata-x1-html](https://github.com/tangtianshuo/prototype/tree/prototype/strata-x1-html) | 单页 HTML，含全屏入场、三维环视、爆炸视图及规格下载。直接打开 `index.html`，或执行 `python3 -m http.server 8086 --bind 127.0.0.1`。Cloudflare Pages：[在线预览](https://prototype-strata-x1-html.prototype-37z.pages.dev/)。 |

查看某个原型：

```sh
git clone --single-branch --branch prototype/vallfirest-html https://github.com/tangtianshuo/prototype.git
cd prototype
python3 serve.py
```

每个原型的实现范围、验证结果和限制见对应分支的 README。
