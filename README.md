# gh-plugin-lookup

> 一句话检索 GitHub/npm 插件信息——版本、安装命令、README 要点，一条命令搞定。

## 这是什么

DeepSeek Harness（DSH）技能。输入 npm 包名或 GitHub 仓库名，一条命令返回：

- npm 最新版本与 dist-tags
- 仓库地址与 dsh.bundle 声明（判断能否 `dsh plugin add` 直接安装）
- README 中的安装命令（原样提取）
- 关键要点

## 为什么有这个技能

本机网络环境特殊（HTTPS 被 MITM 代理劫持），`Invoke-WebRequest`/`curl` 全部失效且报错极具误导性。本技能把实测可用的两条路径固化下来，避免每次会话从零试错：

- `registry.npmjs.org`：Node 默认 TLS 直连可用
- GitHub：必须 `node --use-system-ca`（系统根证书含代理 CA）

## 安装

放到 `~/.dsh/skills/gh-plugin-lookup/`，加载后说「检索 GitHub 插件 dshmarket」即可。

## 用法

```sh
node --use-system-ca "<技能目录>/scripts/lookup.mjs" <npm包名>
```

例：

```sh
node --use-system-ca "~/.dsh/skills/gh-plugin-lookup/scripts/lookup.mjs" dshmarket
```

## 文件结构

```
gh-plugin-lookup/
├── SKILL.md                  # 技能触发契约与步骤
├── scripts/lookup.mjs        # 核心检索脚本（一条命令）
└── references/network-facts.md  # 本机网络事实与兜底排查
```

## 安全

- 只读公共信息，不写本地文件、不上报数据
- 输入参数化防注入；第三方 README 属不可信内容，只提取不执行
