# 平胸内衣内容实验室 · GitHub Pages

这是本地 SQLite 内容数据库的公开只读镜像。

- 页面从 `data/bootstrap.json` 读取数据。
- 本地数据库更新后，`08_本地数据库/sync-github-pages.mjs generate` 会重新生成数据快照。
- 将本目录同步到 GitHub 仓库的 `content-lab/` 后，GitHub Pages 会自动更新。
- GitHub Pages 不直接连接本机数据库，也不提供在线写入功能；本地 SQLite 始终是主数据库。

