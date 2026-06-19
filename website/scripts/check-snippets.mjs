#!/usr/bin/env node
// Snippet typecheck harness.
//
// Scans website/components/**/*.md, extracts every ```tsx fenced code block,
// writes each to website/snippets/__generated__/<mdRelPathWithoutExt>__<index>.tsx,
// then runs `tsc --noEmit -p website/tsconfig.snippets.json`. Exits non-zero if
// tsc fails.
//
// Optional `--filter <Substring>` only processes .md files whose path contains
// <Substring> (used by per-component agents to check a single component fast).

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const websiteDir = resolve(__dirname, '..');
const componentsDir = join(websiteDir, 'components');
const generatedDir = join(websiteDir, 'snippets', '__generated__');
const tsconfig = join(websiteDir, 'tsconfig.snippets.json');

// --- parse args -------------------------------------------------------------
let filter = null;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--filter') {
    filter = argv[i + 1];
    i++;
  }
}

// --- collect markdown files -------------------------------------------------
/** @param {string} dir @returns {string[]} */
function walk(dir) {
  /** @type {string[]} */
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (entry.endsWith('.md') || entry.endsWith('.mdx')) {
      out.push(full);
    }
  }
  return out;
}

let mdFiles = walk(componentsDir).sort();
if (filter) {
  mdFiles = mdFiles.filter((f) => f.includes(filter));
}

// --- extract ```tsx blocks --------------------------------------------------
const TSX_FENCE = /```tsx[^\n]*\n([\s\S]*?)```/g;

/** @param {string} src @returns {string[]} */
function extractTsxBlocks(src) {
  /** @type {string[]} */
  const blocks = [];
  let m;
  TSX_FENCE.lastIndex = 0;
  while ((m = TSX_FENCE.exec(src)) !== null) {
    blocks.push(m[1]);
  }
  return blocks;
}

// --- clear generated dir ----------------------------------------------------
rmSync(generatedDir, { recursive: true, force: true });
mkdirSync(generatedDir, { recursive: true });

// --- write snippets ---------------------------------------------------------
let totalBlocks = 0;
const checkedFiles = [];
for (const mdFile of mdFiles) {
  const blocks = extractTsxBlocks(readFileSync(mdFile, 'utf8'));
  if (blocks.length === 0) continue;

  // mdRelPath without extension, e.g. "reference/shared-types"
  const relPath = relative(componentsDir, mdFile).replace(/\.(md|mdx)$/, '');
  const flatBase = relPath.replace(/[\\/]/g, '__');

  blocks.forEach((code, index) => {
    const outFile = join(generatedDir, `${flatBase}__${index}.tsx`);
    mkdirSync(dirname(outFile), { recursive: true });
    writeFileSync(outFile, code.endsWith('\n') ? code : `${code}\n`, 'utf8');
    totalBlocks++;
  });
  checkedFiles.push({ file: relative(websiteDir, mdFile), blocks: blocks.length });
}

// --- report what was collected ---------------------------------------------
console.log(`check-snippets: scanned ${mdFiles.length} markdown file(s)${filter ? ` (filter: "${filter}")` : ''}`);
if (checkedFiles.length === 0) {
  console.log('check-snippets: no ```tsx blocks found — nothing to typecheck.');
  process.exit(0);
}
for (const { file, blocks } of checkedFiles) {
  console.log(`  - ${file} (${blocks} tsx block${blocks === 1 ? '' : 's'})`);
}
console.log(`check-snippets: wrote ${totalBlocks} snippet(s) to ${relative(websiteDir, generatedDir)}`);

// --- typecheck --------------------------------------------------------------
// Resolve the TypeScript compiler's JS entry and run it with the current node
// binary. This avoids the .bin/tsc.cmd shim, which breaks under shell quoting
// when the project path contains spaces.
const tscJs = join(websiteDir, 'node_modules', 'typescript', 'bin', 'tsc');
console.log(`check-snippets: running tsc --noEmit -p ${relative(websiteDir, tsconfig)}`);
const result = spawnSync(process.execPath, [tscJs, '--noEmit', '-p', tsconfig], {
  cwd: websiteDir,
  stdio: 'inherit',
});

if (result.status !== 0) {
  console.error('check-snippets: FAILED — one or more snippets do not typecheck.');
  process.exit(result.status ?? 1);
}
console.log('check-snippets: OK — all snippets typecheck.');
