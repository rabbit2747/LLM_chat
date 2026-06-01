'use strict';
// Encoding hygiene gate for OS-agnostic portability. Run before every commit:
//   node scripts/check-encoding.cjs
// Exits non-zero (and lists violations) if any tracked-or-new, non-ignored file
// breaks the rules below. Ignored runtime data is exempt (git excludes it).
//
// Rules (see work_protocol.md "Encoding & Portability Hygiene"):
//  1. File/dir names: ASCII only, charset [A-Za-z0-9._-] per path segment.
//  2. No UTF-8 BOM at the start of any text file.
//  3. Code files (.cjs .js .mjs .ts .json .ps1, .gitignore .gitattributes):
//     pure ASCII content (no byte >= 0x80).
//  4. Doc files (.md .txt and other text): non-ASCII letters allowed (e.g.
//     Korean prose), but decorative Unicode punctuation/symbols are forbidden
//     (em/en dash, smart quotes, arrows, section sign, ellipsis, >=/<=, emoji).
//  5. Binary files (contain a NUL byte, or known binary extension): skipped.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');

const CODE_EXT = new Set(['.cjs', '.js', '.mjs', '.ts', '.json', '.ps1']);
const CODE_BASENAMES = new Set(['.gitignore', '.gitattributes']);
const BINARY_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip']);
const NAME_RE = /^[A-Za-z0-9._-]+$/;

// Decorative Unicode code points forbidden in docs (specified as numbers so this
// source file stays pure ASCII). Hangul/CJK letters are NOT in this list.
const FORBIDDEN_DOC = new Set([
  0x2010, 0x2011, 0x2012, 0x2013, 0x2014, 0x2015, // dashes/hyphens
  0x2018, 0x2019, 0x201c, 0x201d,                 // smart quotes
  0x2026,                                          // ellipsis
  0x2190, 0x2191, 0x2192, 0x2193, 0x21d2,         // arrows
  0x00a7,                                          // section sign
  0x00a0,                                          // non-breaking space
  0x2022,                                          // bullet
  0x2260, 0x2264, 0x2265,                          // != <= >=
  0x2705, 0x274c, 0x2714, 0x2716,                  // check/cross marks
  0xfeff, 0x200b,                                  // BOM/ZWNBSP, zero-width space
]);

// Default: all tracked + new (non-ignored) files (full audit).
// --staged: only files staged for commit (pre-commit gate -> blocks new violations).
const STAGED = process.argv.includes('--staged');

function listFiles() {
  const args = STAGED
    ? ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z']
    : ['ls-files', '--cached', '--others', '--exclude-standard', '-z'];
  const out = execFileSync('git', args, { cwd: REPO_ROOT, maxBuffer: 64 * 1024 * 1024 });
  return out.toString('utf8').split('\0').filter(Boolean);
}

function classify(rel) {
  const base = path.basename(rel);
  const ext = path.extname(rel).toLowerCase();
  if (BINARY_EXT.has(ext)) return 'binary';
  if (CODE_EXT.has(ext) || CODE_BASENAMES.has(base)) return 'code';
  return 'doc';
}

function lineColOf(buf, byteIndex) {
  let line = 1;
  for (let i = 0; i < byteIndex && i < buf.length; i++) {
    if (buf[i] === 0x0a) line++;
  }
  return line;
}

const violations = [];

for (const rel of listFiles()) {
  // Rule 1: name segments ASCII-only.
  for (const seg of rel.split('/')) {
    if (!NAME_RE.test(seg)) { violations.push(`[name] ${rel} :: segment "${seg}" is not ASCII [A-Za-z0-9._-]`); break; }
  }

  const abs = path.join(REPO_ROOT, rel);
  let buf;
  try { buf = fs.readFileSync(abs); } catch { continue; }
  if (buf.length === 0) continue;

  const kind = classify(rel);
  if (kind === 'binary' || buf.includes(0x00)) continue; // skip binary content

  // Rule 2: no BOM.
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    violations.push(`[bom] ${rel} :: starts with a UTF-8 BOM`);
  }

  if (kind === 'code') {
    // Rule 3: pure ASCII.
    for (let i = 0; i < buf.length; i++) {
      if (buf[i] >= 0x80) { violations.push(`[code-nonascii] ${rel}:${lineColOf(buf, i)} :: non-ASCII byte 0x${buf[i].toString(16)} (code files must be ASCII-only)`); break; }
    }
  } else {
    // Rule 4: docs may contain non-ASCII letters but not decorative symbols.
    const text = buf.toString('utf8');
    let idx = 0;
    for (const ch of text) {
      const cp = ch.codePointAt(0);
      if (FORBIDDEN_DOC.has(cp) || (cp >= 0x1f000 && cp <= 0x1ffff)) {
        violations.push(`[doc-decorative] ${rel} :: forbidden char U+${cp.toString(16).toUpperCase()} (use an ASCII equivalent: - -> >= ... [x])`);
        break;
      }
      idx += ch.length;
    }
  }
}

if (violations.length) {
  console.error(`Encoding check FAILED (${violations.length} violation(s)):`);
  for (const v of violations) console.error('  ' + v);
  console.error('\nFix: ASCII-only names; no BOM; ASCII-only code; ASCII punctuation in docs.');
  process.exit(1);
}
console.log('Encoding check passed: names ASCII, no BOM, code ASCII-only, docs free of decorative Unicode.');
