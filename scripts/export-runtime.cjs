'use strict';
// Export machine-local runtime data (chat log, state cursors, tasks, uploads, logs)
// into a portable bundle directory you can copy to another PC, then restore with
// import-runtime.cjs. Cross-OS, no dependencies.
//
//   node scripts/export-runtime.cjs [outDir]
//   (default outDir: ./runtime-export)
const fs = require('node:fs');
const path = require('node:path');
const { REPO_ROOT, listRuntimeFiles } = require('./lib/runtime-data.cjs');

const outDir = path.resolve(process.argv[2] || path.join(REPO_ROOT, 'runtime-export'));

const files = listRuntimeFiles();
if (files.length === 0) {
  console.log('No runtime-data files found to export. Nothing to do.');
  process.exit(0);
}

fs.mkdirSync(outDir, { recursive: true });
let copied = 0;
for (const { rel, abs } of files) {
  const dest = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(abs, dest);
  copied++;
}

const manifest = {
  exportedAt: new Date().toISOString(),
  sourceRepo: REPO_ROOT,
  count: copied,
  files: files.map((f) => f.rel).sort(),
};
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log(`Exported ${copied} runtime file(s) -> ${outDir}`);
console.log('Copy that folder to the other PC, then run: node scripts/import-runtime.cjs <thatFolder>');
