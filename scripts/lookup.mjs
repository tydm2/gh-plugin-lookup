#!/usr/bin/env node
// gh-plugin-lookup 核心检索脚本
// 用法: node --use-system-ca lookup.mjs <npm包名>
// 只读公共信息，不写任何本地文件；包名经 encodeURIComponent 参数化防注入。
const pkg = process.argv[2];
if (!pkg) {
  console.error("usage: node --use-system-ca lookup.mjs <npm-package-name>");
  process.exit(2);
}

const out = { input: pkg };

// 1. npm registry packument（本机 Node 默认 TLS 可直连）
try {
  const r = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`, {
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) {
    console.error(`npm registry 返回 ${r.status}（${pkg} 可能不存在或需换名）`);
    process.exit(1);
  }
  const j = await r.json();
  const latest = j["dist-tags"]?.latest;
  const v = j.versions?.[latest] ?? {};
  out.name = j.name;
  out.latest = latest;
  out.distTags = j["dist-tags"];
  out.description = j.description;
  out.license = v.license ?? null;
  out.repository = v.repository?.url ?? j.repository?.url ?? null;
  out.homepage = v.homepage ?? null;
  out.dsh = v.dsh ?? null; // dsh.bundle 声明 → 是否可直接 dsh plugin add
  out.dependencies = v.dependencies ?? null;
  out.tarball = v.dist?.tarball ?? null;
} catch (e) {
  console.error("npm registry 请求失败:", e.cause?.message ?? e.message);
  process.exit(1);
}

// 2. 由 repository 定位 GitHub 仓库 → 取 README（必须 --use-system-ca）
let repo = (out.repository ?? "")
  .replace(/^git\+/, "")
  .replace(/\.git$/, "")
  .replace(/^https?:\/\/github\.com\//, "")
  .replace(/^git@github\.com:/, "");
if (repo && !repo.includes("/")) repo = "";
if (repo) {
  outer: for (const ref of ["HEAD", "main", "master"]) {
    for (const file of ["README.md", "README.zh.md", "README.en.md"]) {
      const url = `https://raw.githubusercontent.com/${repo}/${ref}/${file}`;
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (r.ok) {
          out.readmeUrl = url;
          out.readme = await r.text();
          break outer;
        }
      } catch {}
    }
  }
}

// 3. 抽取安装命令块与安装小节
if (out.readme) {
  const blocks = [...out.readme.matchAll(/```(?:sh|bash|powershell)?\s*([\s\S]*?)```/g)]
    .map((m) => m[1].trim())
    .filter((t) => /(dsh plugin|pnpm (add|i|install)|npm (i|install|add)|git clone|pip install)/i.test(t));
  out.installCommands = blocks.slice(0, 4);
  const section = out.readme.match(/^#{1,4}\s*.*(?:安装|install|Install).*$/m);
  if (section) {
    const start = out.readme.indexOf(section[0]);
    out.installSection = out.readme.slice(start, start + 600).split("\n\n")[0] ?? section[0];
  }
  if (!out.installCommands && !out.installSection) out.readmeHint = out.readme.slice(0, 400);
}

// 4. 输出（README 全文不打印，仅要点）
const { readme, ...report } = out;
console.log(JSON.stringify(report, null, 2));
if (out.installCommands?.length) {
  console.log("\n--- 安装命令（README 原样） ---");
  for (const c of out.installCommands) console.log(c);
}
