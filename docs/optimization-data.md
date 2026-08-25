# 优化数据：装 gh-plugin-lookup 前后 token 消耗对比

> 实测于 2026-08，数据来源为本机 DeepSeek Harness 会话真实日志（JSONL 逐事件计量），非模拟估算。
> 检索对象：dshmarket（DSH 插件市场）——「查一下这个插件怎么装」。

## 结论摘要

| 指标 | 数值 |
|---|---|
| 无 skill 直接检索 | ≈18,889 tokens（29 次工具调用）|
| 有 skill 检索 | ≈1,339 tokens（2 次调用）|
| **每次检索节约** | **≈17,550 tokens** |
| **节约百分比** | **92.9%**（≈1/14，14.1 倍）|
| 创建 skill 一次性成本 | ≈36,932 tokens |
| **回本** | **≈2.1 次检索**（第 3 次起纯赚）|

## 测量方法

- **数据来源**：会话持久化 JSONL（zstd 多帧解压）中 `tool/call`、`tool/result`、`assistant/message` 事件，递归提取全部文本字符量。
- **边界（公平性）**：
  - Path A（无 skill）= 首轮检索阶段实录，步骤 1–25：环境探索 → 失败试错 → 成功获取 README。**失败路径与可避免的探索全部如实计入**。
  - Path B（有 skill）= skill 加载注入（SKILL.md）+ `lookup.mjs` 一条命令 + 输出 + 最小答复。
  - 安装环节（`dsh plugin add`）两条路径完全相同，不计入。
- **token 估算公式**：CJK 1 字 ≈ 1 token；ASCII 4 字符 ≈ 1 token（DeepSeek BPE 近似，±20% 误差）。Path A 为 ASCII 为主（96%），符合该比例。

## 核心对比表

| 指标 | ❌ 无 skill | ✅ 有 skill |
|---|---|---|
| 工具调用次数 | 29 | 2 |
| 工具输入字符 | 8,372 | 226 |
| 工具输出字符 | 35,595 | 1,471 |
| 模型推理+答复字符 | 22,678 | ~37 |
| 总字符 | 66,645 | 3,584 |
| 估算 token | ≈18,889 | ≈1,339 |

## token 浪费明细（Path A 前几名）

| 步骤 | 字符 | 浪费内容 |
|---|---|---|
| step 3 | 8,798 | 在 DSH `node_modules` 中 grep "market" → 34 行营销噪音 |
| step 25 | 6,852 | 读 10KB 完整 README（skill 只提取约 200 字符安装命令）|
| step 8 | 5,880 | `npm.ps1` 执行策略报错 ×3 |
| step 9 | 3,199 | `npm view` 404 报错块 |
| step 13–21 | ~17,000 | 网络试错：4 个 GitHub 镜像、curl schannel、连通性探测、Node 证书失败 |
| 其余 | ~25,000 | 环境探索、web_search、反复推理 |

## 根因与固化（技能内已写死）

1. 本机 HTTPS 被 MITM 代理劫持：`Invoke-WebRequest`/`curl`（schannel）全部失效且报错误导（"基础连接已关闭" ≠ 目标不可达）。
2. 唯一可用路径：`registry.npmjs.org`（Node 默认 TLS）+ GitHub（必须 `node --use-system-ca`）。
3. skill 把上述事实固化为一条命令，消灭试错。

## 敏感性

- 即使 Path B 的推理常数放宽到 500 tokens，节省仍 ≈89%。
- token 为估算值（±20%）；实际 DeepSeek tokenizer 计数可能略有出入，不影响量级结论。

## 复现

```sh
# 一条命令检索（有 skill 路径）
node --use-system-ca "<技能目录>/scripts/lookup.mjs" dshmarket

# 无 skill 路径的原始试错过程见本仓库提交历史对应的会话记录
```
