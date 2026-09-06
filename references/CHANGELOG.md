# gh-plugin-lookup 变更历史

> 1.1.0 起 changelog 外置到本文件（frontmatter 只保留 name/description/license/metadata.version，符合 Agent Skills 开放规范）。

## 1.1.0 (2026-09-06)
- 通用化改造：frontmatter 合规（移除嵌套 changelog/languages/scope）、description 瘦身为触发契约；任何平台的 agent 均可经 /gh-plugin-lookup 斜杠命令触发（commands 文件见各平台命令目录）
- 新增 license: MIT

## 1.0.0
- 初始版本：固化本机网络事实（npm 直连可用、GitHub 需 --use-system-ca、禁 Invoke-WebRequest/curl），一条命令检索插件信息
