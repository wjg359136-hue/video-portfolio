# 视频作品集网站

一个公开、可随时随地打开的中文视频作品集单页网站。网页托管在 GitHub Pages（免费永久链接），视频文件存放在腾讯云 COS（生成可直接播放的直链）。

## 目录结构

```
index.html            # 页面入口
css/style.css         # 样式（响应式，手机/电脑均可）
js/app.js             # 渲染逻辑（读取 data/projects.json）
data/projects.json    # ★ 唯一需要维护的数据文件：项目与视频列表
scripts/add-video.ps1 # 追加视频的小脚本
docs/upload-checklist.md  # 首批视频上传对照清单
```

## 网站怎么运作

页面启动时读取 `data/projects.json`，按项目分组渲染视频卡片；点击卡片弹出播放器，直接播放 COS 上的视频直链。

## 如何添加新视频（三步）

1. **上传视频到 COS**：登录腾讯云 COS 控制台，把 MP4 传到对应项目的 `videos/<项目id>/` 目录（例如 `videos/guofeng/`），拿到直链，形如：
   `https://<桶名>.cos.<地域>.myqcloud.com/videos/guofeng/xxx.mp4`
2. **更新 `data/projects.json`**，二选一：
   - 用脚本（推荐，推荐用项目 id）：
     ```powershell
     .\scripts\add-video.ps1 -Project guofeng -Title "新作品标题" -Url "https://<桶名>.cos.<地域>.myqcloud.com/videos/guofeng/new.mp4"
     ```
     项目不存在时加 `-NewProject` 可自动创建；用中文项目名也可以（在自己的 PowerShell 窗口里直接输入）。
   - 或手动编辑 JSON：在对应项目的 `videos` 数组里加一行 `{ "title": "标题", "url": "直链" }`。
3. **推送到 GitHub**：
   ```powershell
   git add -A
   git commit -m "添加视频：新作品标题"
   git push
   ```
   推送后 GitHub Pages 会自动更新，稍等 1-2 分钟刷新页面即可看到。

## 首次部署（一次性）

### 1. 腾讯云 COS（存视频）
1. 注册/登录腾讯云，开通对象存储 COS。
2. 创建存储桶：名称建议 `sollen-video-portfolio`，地域选离你近的（如 `ap-shanghai` 上海），访问权限选 **公有读私有写**。
3. 把视频文件传到 `videos/<项目id>/` 目录（对照 `docs/upload-checklist.md`）。
4. 每个视频在「详情」里能看到对象地址，即直链。

### 2. GitHub Pages（存网页）
1. 注册 GitHub 免费账号。
2. 新建仓库，名称填 `video-portfolio`（空仓库，不勾选 README）。
3. 把本目录推送到该仓库：
   ```powershell
   git remote add origin https://github.com/<你的用户名>/video-portfolio.git
   git branch -M main
   git push -u origin main
   ```
4. 打开仓库 Settings → Pages → Source 选 `Deploy from a branch` → 分支选 `main` / 根目录 `/` → Save。
5. 等 1-2 分钟，访问：`https://<你的用户名>.github.io/video-portfolio/`

### 3. 替换占位链接
`data/projects.json` 中的链接目前是占位桶名 `sollen-video-portfolio` 和占位地域 `ap-shanghai`。确认你的真实桶名/地域后，把链接中的这两处替换掉（可以手动替换，也可以把真实桶名和地域告诉你的助手一键替换）。

## 项目 id 对照

| 项目 | id |
| --- | --- |
| 国风系列款式 | `guofeng` |
| 410 日月星辰 | `riyue` |
| 景泰蓝 | `jingtailan` |

## 常见问题

- **视频播放不出来？** 确认 COS 桶是「公有读私有写」、直链能直接在浏览器打开、`data/projects.json` 里的链接已替换为真实桶名/地域。
- **国内访问 GitHub Pages 慢？** 可后续把网页也部署一份到 COS 静态网站托管做镜像。
- **想给视频加封面？** v1 暂未做封面，后续可安装 ffmpeg 自动截帧生成。
