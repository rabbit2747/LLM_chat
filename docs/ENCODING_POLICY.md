# Encoding & Portability Hygiene (policy)

Goal: the project must move between PCs and OSes byte-stable, with no mojibake,
no BOM surprises, and no non-portable file names. This policy is enforced by
`scripts/check-encoding.cjs`. The constitution (`agent_chat/work_protocol.md`)
references this file as a binding rule.

## Rules

1. **ASCII-only names.** Every committed file name, directory name, git branch,
   git tag, config key, and participant id uses only `[A-Za-z0-9._-]` per path
   segment. Non-ASCII (Korean, emoji, spaces) is allowed only in *content*
   (message text, document prose, chat data) - never in names.

2. **UTF-8, no BOM, LF.** All committed text files are UTF-8 without a byte-order
   mark, with LF line endings. `.gitattributes` enforces `eol=lf`. Writers must
   not emit a BOM (PowerShell: write with `utf8NoBOM` or `ascii`, not the default
   `utf8` which adds a BOM). Readers strip a leading BOM defensively
   (`.replace(/^\uFEFF/, '')`).

3. **Code files are ASCII-only.** For `.cjs .js .mjs .ts .json .ps1` and
   `.gitignore .gitattributes`, every byte is `< 0x80` - including comments.
   Write comments in English/ASCII.

4. **No decorative Unicode in docs.** Markdown/text docs may contain non-ASCII
   *letters* (e.g. Korean prose), but not decorative punctuation/symbols. Use
   ASCII equivalents:
   - em/en dash -> `-`
   - arrows -> `->`
   - section sign -> `sec` / `section`
   - ellipsis -> `...`
   - `>=` `<=` `!=` instead of the Unicode forms
   - check/cross marks -> `[x]` / `[ ]`
   - no emoji in committed docs
   Portability-core docs (protocol, snapshot, runbooks) are recommended
   ASCII-only; Korean prose is allowed in user-facing docs if it passes the check.

5. **Verify bytes, not the console.** A PowerShell console printing garbled
   characters is a cp949 *display* artifact, not data corruption - the stored
   JSONL/UTF-8 is fine. Confirm with a hex/byte inspection before "fixing" data.

6. **Runtime data is exempt.** Files matched by `.gitignore` (chat log, state,
   tasks, uploads, logs, flags) may contain any UTF-8 (Korean chat is normal).
   They are not committed, so the check skips them.

## Enforcement

```
node scripts/check-encoding.cjs            # full audit (all tracked + new files)
node scripts/check-encoding.cjs --staged   # pre-commit gate (staged files only)
```

Run `--staged` before every commit; it fails (exit 1) and lists violations if a
staged file breaks a rule. Run the full audit periodically to clean legacy files.

## On legacy violations

Pre-existing files that predate this policy are cleaned by their owner
(each agent fixes files in its own area; runtime data is exempt). New commits
must pass `--staged` so no new violation is introduced.
