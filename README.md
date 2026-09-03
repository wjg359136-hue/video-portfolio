# 视频作品集网站

一个公开、可随时随地打开的中文视频作品集单页网站。网页托管在 GitHub Pages（免费永久链接），视频文件存放在腾讯云 COS（生成可直接播放的直链）。

**正式链接：https://wjg359136-hue.github.io/video-portfolio/**

## 目录结构

```
index.html            # 页面入口
css/style.css         # 样式（响应式，手机/电脑均可）
js/app.js             # 渲染逻辑（读取 data/projects.json）
data/projects.json    # ★ 唯一需要维护的数据文件：项目与视频列表
scripts/add-video.ps1 # 追加视频的小脚本
docs/upload-checklist.md  # 当前已上传视频清单
```

## 网站怎么运作

页面启动时读取 `data/projects.json`，按项目分组渲染视频卡片；点击卡片弹出播放器，直接播放 COS 上的视频直链。

## 如何添加新视频（三步）

1. **上传视频到 COS**：登录腾讯云 COS 控制台，把 MP4 传到对应项目的 `videos/<项目名>/` 目录，拿到直链（形如 `https://wu-1474585651.cos.ap-guangzhou.myqcloud.com/videos/xxx/xxx.mp4`）。
2. **更新 `data/projects.json`**，二选一：
   - 用脚本（推荐）：
     ```powershell
     .\scripts\add-video.ps1 -Project 瑞顿 -Title "新作品" -Url "https://wu-1474585651.cos.ap-guangzhou.myqcloud.com/videos/瑞顿/new.mp4"
     ```
     项目不存在时加 `-NewProject` 可自动创建。
   - 或手动编辑 JSON：在对应项目的 `videos` 数组里加一行 `{ "title": "标题", "url": "直链" }`（中文路径会被自动转码，无需手动处理）。
3. **推送到 GitHub**：
   ```powershell
   git add -A
   git commit -m "添加视频：新作品标题"
   git push
   ```
   推送后 GitHub Pages 会自动更新，稍等 1-2 分钟刷新页面即可看到。

## 部署状态

- ✅ GitHub 仓库：`wjg359136-hue/video-portfolio`，Pages 已开启（main / 根目录）
- ✅ 正式链接：https://wjg359136-hue.github.io/video-portfolio/
- ✅ 腾讯云 COS 桶 `wu-1474585651`（广州 ap-guangzhou，公有读私有写），已上传 19 个视频

## 当前项目

| 项目 | 视频数 |
| --- | --- |
| 312 | 1 |
| 兰花 | 1 |
| 兵马俑（中英） | 1 |
| 司南 | 1 |
| 孔雀 | 1 |
| 景泰蓝 | 1 |
| 琉璃 | 1 |
| 脸谱 | 1 |
| 鲲 | 1 |
| 龙 317 | 1 |
| 瑞顿 | 9 |

## 常见问题

- **视频播放不出来？** 确认 COS 桶是「公有读私有写」、直链能直接在浏览器打开。
- **微信内置浏览器播放异常？** 腾讯云对 2024 年后创建的桶，默认域名带「强制下载」头；桌面浏览器（Chrome/Edge）会忽略该头正常播放，个别 App 内嵌浏览器可能表现为下载。若遇到，可后续绑定自定义域名解决。
- **国内访问 GitHub Pages 慢？** 可后续把网页也部署一份到 COS 静态网站托管做镜像。

## 当前模式：夸克网盘文件夹跳转（2026-09-03 起）

网站采用「夸克网盘文件夹跳转」模式：每个项目一张卡片，点击卡片在新窗口打开该项目的夸克网盘分享文件夹，在夸克 App / 网页中播放视频。网页本身不加载视频文件，**不产生 COS 下行流量费用**。

- 项目分享链接维护在 `data/projects.json` 的每个项目 `folderUrl` 字段。
- 当前 13 个项目暂都指向总分享链接：https://pan.quark.cn/s/8e4b90332878
- 若要为每个项目单独跳转，把对应项目的 `folderUrl` 换成该文件夹自己的夸克分享链接即可。
- 夸克网盘需要访客登录（或打开夸克 App）才能查看和播放。

### 恢复为 COS 直接播放模式（可选）

如以后要正式对外展示、需要网页内直接播放，可切回 COS 播放模式：
1. 本机备份见 `index.cos-playback.html`（如存在）或从 git 历史恢复旧版 `index.html` / `js/app.js`。
2. 恢复后记得先确认腾讯云余额充足或已购买下行流量包，避免欠费。
