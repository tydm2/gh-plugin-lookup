# 本机网络事实（gh-plugin-lookup 调试兜底参考）

> 仅当主路径（`scripts/lookup.mjs`）失败时按此排查；不要临场发明新路径。

## 已知可用路径（2026-08 实测）

| 目标 | 可用方式 | 备注 |
|---|---|---|
| registry.npmjs.org | Node 默认 TLS（fetch / npm / pnpm） | 未走 MITM 拦截，稳定 |
| raw.githubusercontent.com | `node --use-system-ca` fetch | 被 MITM 代理劫持，须系统 CA |
| github.com / api.github.com | `node --use-system-ca` fetch | 同上 |

## 已知失效路径（别再试）

- `Invoke-WebRequest` / `curl.exe`（schannel）：`SEC_E_NO_CREDENTIALS` 或「基础连接已关闭」——**误导性报错**，不代表目标不可达。
- 无 `--use-system-ca` 的 Node fetch 访问 GitHub：`unable to verify the first certificate`。
- 本机代理 `127.0.0.1:7890` 当前未运行（`ProxyEnable=0`）。

## 兜底顺序（主路径失败时）

1. 重试 1 次（瞬时抖动）。
2. 换镜像域名（如 `cdn.jsdelivr.net/gh/<owner>/<repo>@main/README.md`），仍用 `node --use-system-ca`。
3. 仍失败 → 如实报告原因与耗时，停止重试（不循环试错）。

## 环境前提

- Node ≥ 18（全局 `fetch`）；本机 v24。
- 系统根证书含 MITM 代理的 CA（`--use-system-ca` 生效的前提）。
- DSH 沙箱：网络只读命令可用；写文件需在会话工作区内或申请权限。
