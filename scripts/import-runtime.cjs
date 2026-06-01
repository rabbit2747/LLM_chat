'use strict';
// Restore a runtime-data bundle produced by export-runtime.cjs into this repo.
// Cross-OS, no dependencies.
//
//   node scripts/import-runtime.cjs [inDir] [--force]
//   (default inDir: ./runtime-export)
//
// By default it refuses to overwrite existing runtime files (so you don't clobber
// a live chat). Pass --force to overwrite. Intended use: a FRESH checkout on a new PC.
const fs = require('node:fs');
const path = require('node:path');
const { REPO_ROOT } = require('./lib/runtime-data.cjs');

const args = process.argv.slice(2);
const force = args.includes('--force');
const positional = args.filter((a) => !a.startsWith('--'));
const inDir = path.resolve(positional[0] || path.join(REPO_ROOT, 'runtime-export'));

if (!fs.existsSync(inDir)) {
  console.error(`Import source not found: ${inDir}`);
  process.exit(1);
}

const manifestPath = path.join(inDir, 'manifest.json');
let relFiles;
if (fs.existsSync(manifestPath)) {
  relFiles = JSON.parse(fs.readFileSync(manifestPath, 'utf8')).files;
} else {
  // No manifest: walk the bundle and import everything except manifest.json.
  relFiles = [];
  const walk = (dir, rel) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const childRel = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(path.join(dir, e.name), childRel);
      else if (childRel !== 'manifest.json') relFiles.push(childRel);
    }
  };
  walk(inDir, '');
}

const conflicts = relFiles.filter((rel) => fs.existsSync(path.join(REPO_ROOT, rel)));
if (conflicts.length && !force) {
  console.error(`Refusing to overwrite ${conflicts.length} existing file(s). Re-run with --force to overwrite:`);
  conflicts.forEach((c) => console.error(`  ${c}`));
  process.exit(2);
}

let restored = 0;
for (const rel of relFiles) {
  const src = path.join(inDir, rel);
  const dest = path.join(REPO_ROOT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  restored++;
}

console.log(`Imported ${restored} runtime file(s) from ${inDir} into ${REPO_ROOT}`);
