import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const distDir = path.join(repoRoot, 'dist');

const skip = new Set([
  '.git', '.github', 'node_modules', 'dist',
  'package.json', 'package-lock.json', '.npmrc',
  '.eslintrc.json', 'jest.config.cjs', 'babel.config.cjs',
  '__tests__', 'tests', 'coverage',
  'netlify.toml', 'backend', 'scripts',
]);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src, dst) {
  ensureDir(dst);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const from = path.join(src, entry.name);
    const to = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else if (entry.isFile()) fs.copyFileSync(from, to);
  }
}

fs.rmSync(distDir, { recursive: true, force: true });
copyDir(repoRoot, distDir);
console.log('Built static site to dist/');

