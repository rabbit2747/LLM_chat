'use strict';
// Shared helper for migration (export/import) and any tool that needs the
// runtime-data file list. Reads config/agent-chat.config.json -> runtimeData.globs
// (the SSOT) and resolves which files on disk match. No external dependencies.
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CONFIG_PATH = path.join(REPO_ROOT, 'config', 'agent-chat.config.json');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'runtime-export']);

function loadConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

// Convert a glob (supporting ** and *) to a RegExp over POSIX-style relative paths.
function globToRegex(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') { re += '.*'; i++; }   // ** -> any depth
      else { re += '[^/]*'; }                          // *  -> within a segment
    } else if ('.+?^${}()|[]\\'.includes(c)) {
      re += '\\' + c;                                  // escape regex metachars
    } else {
      re += c;
    }
  }
  return new RegExp('^' + re + '$');
}

// Walk the repo, return every file as a POSIX relative path.
function walk(dir, rootRel, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), rootRel ? `${rootRel}/${entry.name}` : entry.name, out);
    } else {
      out.push(rootRel ? `${rootRel}/${entry.name}` : entry.name);
    }
  }
  return out;
}

// Resolve runtime-data files present on disk. Returns [{ rel, abs }].
function listRuntimeFiles() {
  const cfg = loadConfig();
  const globs = (cfg.runtimeData && cfg.runtimeData.globs) || [];
  const regexes = globs.map(globToRegex);
  const all = walk(REPO_ROOT, '', []);
  const matched = all.filter((rel) => regexes.some((re) => re.test(rel)));
  return matched.map((rel) => ({ rel, abs: path.join(REPO_ROOT, rel) }));
}

module.exports = { REPO_ROOT, loadConfig, globToRegex, listRuntimeFiles };
