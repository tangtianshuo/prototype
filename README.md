# SENTRA 消防 / 安防 / 救援独立站 HTML 原型

本版本用于页面结构、视觉风格和交互评审。全部页面为 HTML + CSS + 原生 JavaScript，无构建依赖；在独立目录制作，未修改工作区已有网站。

## 打开方式

可直接打开 `index.html` 浏览。建议使用本地 HTTP 服务，让所有浏览器中的本地存储和下载行为保持一致：

```sh
python3 -m http.server 8086 --bind 127.0.0.1
```

访问 http://localhost:8086 。右上角支持 English / 中文切换。

## 页面范围：46 页

- 首页：`index.html`
- 全部产品：`products/index.html`
- 二级分类：`products/fire.html`、`products/security.html`、`products/rescue.html`
- 12 个细分类页面：`products/fire/`、`products/security/`、`products/rescue/`
- 24 个三级产品详情：`product/`，如 `product/sp-101.html`
- 应用方案、资料中心、关于我们、联系我们、询价清单，共 5 页

产品浏览既支持“首页 → 二级大类 → 三级产品详情”，也支持经过细分类缩小选型范围。

## 交互

- 产品导航展开，手机菜单，中英文切换。
- 全站产品搜索；分类页关键词搜索、场景和材质组合筛选；名称和型号排序；空结果与清空筛选。
- 首页三类精选产品切换。
- 产品详情参数、介绍、下载和常见问题标签。
- 产品数量、加入询价、询价数量修改、移除产品；清单保存在当前浏览器。
- 询价表单必填和邮箱格式校验；本地保存预览；下载 JSON 询价单。
- 下载 TXT 参数预览，不冒充正式 PDF 或认证文件。

## 设计依据

- Protec：深蓝 / 白色 / 少量红色的专业配色和信息层次。
- Rapidrop：产品优先、侧栏分类与参数筛选、规整的产品网格与详情信息。
- Kidde / Firechief / Tyco：产品系列分组与从产品进入选型的路径。
- Fire Protection Online：按客户描述引入住宅、商业、工业与零售场景入口；参考站本次访问返回 403，未声称完整读取。

参考地址：
https://www.protec.co.uk/
https://www.rapidrop.com/products/sprinkler-heads
https://shopkidde.com/
https://firechiefglobal.com/
https://www.tyco-fire.com/
https://www.fireprotectiononline.co.uk/

## 待客户替换的正式内容

SENTRA 是暂用品牌。公司文案、型号、参数均为演示资料，未填写虚构资质、客户数量或认证。图片混合使用参考产品图片与本地 SVG 产品示意图，详见 `assets/SOURCES.md`。正式上线需替换为客户真实品牌与产品资料。

询价仅本地演示，不连接邮件、CRM 或订单系统。线上发布状态与预览链接见仓库 main 分支索引。

## 编辑入口

- `style.css`：颜色、字体、排版、响应式。
- `app.js`：所有页面布局、文案与交互。
- `build.py`：分类、示例产品数据、HTML 页面生成。
- `data.js`：生成后的分类与产品数据。修改数据建议编辑 `build.py` 后执行 `python3 build.py`。
- `screenshots/`：桌面与手机页面预览。

## 已验证

46 个 HTML 地址均返回 HTTP 200，共 24 件产品，图片资源全部存在。通过浏览器检查桌面首页、分类页、产品详情和手机布局，验证材质筛选、中文切换、手机菜单、加入 3 件产品、询价清单、表单本地保存。390px 手机首页和分类页无横向溢出。

## v2 视觉与体验升级

已使用 UI/UX Pro Max 再次优化所有页面。设计规则见 `DESIGN.md`，新增的 `modern.css` 统一控制本地字体、现代排版、卡片、吸顶导航、手机筛选抽屉与底部询价入口。应用方案页加入四种场景图片、具体产品与细分类路径。

本轮检查覆盖 375px、768px、1024px、1440px，验证中英排版、无横向溢出、筛选抽屉关闭与焦点返回、标签页方向键操作。本分支保存 v2 原型；历史设计由本地备份保留。

## 克隆本原型

```sh
git clone --single-branch --branch prototype/sentra-safety-html https://github.com/tangtianshuo/prototype.git
cd prototype
python3 -m http.server 8086 --bind 127.0.0.1
```

访问 http://localhost:8086/ 。该原型为客户需求创建设计，并非对参考品牌网站的逐页复刻。

## 首页 HERO 全宽轮播更新（2026-11-16）

采用全宽背景轮播与浮层标题、文案、按钮。消防、安防、救援三个主题默认每 6.5 秒切换；无播放按钮，左右箭头默认隐藏，悬停或键盘聚焦时淡入。底部仅保留细线分页，手机支持横滑。悬停、聚焦、切换后台或滚出可视区时暂停，离开后恢复；系统减少动态效果时不自动播放。

`hero.css` 为轮播样式，`app.js` 中的 `heroMarkup` / `initHero` 为结构和交互。
