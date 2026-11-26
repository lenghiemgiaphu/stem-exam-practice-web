#!/usr/bin/env node
/**
 * Rà soát bảo mật tĩnh (chỉ dùng thư viện chuẩn của Node): `pnpm audit:security`
 *  1. Client component ('use client') không import module chỉ dành cho server và không đọc process.env.
 *  2. Thư mục public/ (gửi nguyên cho trình duyệt) không chứa khóa/secret/process.env.
 *  3. Không có biến NEXT_PUBLIC_* nào mang khóa bí mật.
 *  4. Mọi API quản trị (trừ login/logout) đều gọi requireAdmin().
 *  5. lib/supabase/server chỉ được import từ code server.
 * Thoát với mã 1 nếu có vi phạm.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const IGNORE = new Set(['node_modules', '.next', '.git', 'scripts'])
const problems = []

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (IGNORE.has(name)) continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}
const rel = (f) => relative(ROOT, f).replaceAll('\\', '/')
const read = (f) => readFileSync(f, 'utf8')
const files = walk(ROOT)
const code = files.filter((f) => /\.(ts|tsx|js|jsx|mjs)$/.test(f) && !rel(f).startsWith('public/data'))
const isClient = (text) => /^\s*(?:\/\*[\s\S]*?\*\/\s*|\/\/.*\n\s*)*['"]use client['"]/.test(text)

const SERVER_ONLY_IMPORTS = [
  /from\s+['"]@\/lib\/supabase\//,
  /from\s+['"]@\/lib\/admin\/(auth|session|stats|export|filters|aggregate)['"]/,
  /from\s+['"]@\/lib\/ai\//,
  /from\s+['"]@\/lib\/analytics\/(http|rate-limit)['"]/,
  /from\s+['"]@supabase\/supabase-js['"]/,
  /from\s+['"]node:/,
  /from\s+['"]next\/headers['"]/,
]

// 1 + 5. Client component
for (const f of code) {
  const text = read(f)
  if (isClient(text)) {
    for (const re of SERVER_ONLY_IMPORTS) if (re.test(text)) problems.push(`${rel(f)}: client component import module chỉ dành cho server (${re})`)
    if (/process\.env/.test(text)) problems.push(`${rel(f)}: client component đọc process.env`)
  }
  if (/lib\/supabase\/server/.test(text) && isClient(text)) problems.push(`${rel(f)}: client component import lib/supabase/server`)
}

// 2. public/
const SECRET_PATTERNS = [
  [/SUPABASE_SERVICE_ROLE_KEY|ADMIN_ANALYTICS_SECRET/, 'tên biến bí mật'],
  [/sb_secret_[A-Za-z0-9_-]{10,}/, 'Supabase secret key'],
  [/eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/, 'chuỗi giống JWT (service_role / anon key)'],
  [/AIza[0-9A-Za-z_-]{35}/, 'khóa Google API'],
  [/process\.env/, 'process.env'],
]
for (const f of files.filter((f) => rel(f).startsWith('public/') && /\.(js|html|json|css)$/.test(f))) {
  const text = read(f)
  for (const [re, label] of SECRET_PATTERNS) if (re.test(text)) problems.push(`${rel(f)}: public/ chứa ${label}`)
}

// 3. NEXT_PUBLIC_ cho khóa bí mật
for (const f of files.filter((f) => /\.(ts|tsx|js|jsx|mjs|md|example|env.*)$/.test(f) || rel(f).startsWith('.env'))) {
  if (rel(f) === 'README.md' || rel(f).startsWith('docs/')) continue
  const bad = read(f).match(/NEXT_PUBLIC_[A-Z0-9_]*(SERVICE|SECRET|GEMINI|SUPABASE|ADMIN)[A-Z0-9_]*/)
  if (bad) problems.push(`${rel(f)}: biến ${bad[0]} sẽ bị lộ ra trình duyệt`)
}

// 4. API quản trị
for (const f of files.filter((f) => /^app\/api\/admin\/.+\/route\.ts$/.test(rel(f)))) {
  if (/\/(login|logout)\/route\.ts$/.test(rel(f))) continue
  if (!/requireAdmin\(req\)/.test(read(f))) problems.push(`${rel(f)}: API quản trị không gọi requireAdmin(req)`)
}

console.log(`Đã quét ${code.length} file mã nguồn và ${files.filter((f) => rel(f).startsWith('public/')).length} file trong public/.`)
if (problems.length) {
  console.error(`\n✗ ${problems.length} vấn đề bảo mật:\n - ${problems.join('\n - ')}`)
  process.exit(1)
}
console.log('✓ Không phát hiện khóa server nào bị đưa ra phía client; mọi API quản trị đều yêu cầu xác thực.')
