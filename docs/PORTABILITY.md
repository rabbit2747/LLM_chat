# Portability & Migration

How to move this collaboration environment to **any PC** (any OS) and run it.

## Design principles

1. **Node is the portable baseline.** The server is Node; cross-OS workflows (migration, and - in progress - the CLI/monitor) are Node too. The only hard runtime requirement is Node >= 18. The `.ps1` files are *optional Windows convenience wrappers*, not required.
2. **All paths are repo-root-relative.** No absolute paths in code (server uses `__dirname`, PowerShell uses `$PSScriptRoot`). Move the folder anywhere and paths still resolve.
3. **Config is externalized.** `config/agent-chat.config.json` is the single source of truth for host/port, paths, and the runtime-data file list. Env vars (`AGENT_CHAT_HOST`, `AGENT_CHAT_PORT`) override at runtime.
4. **Code and runtime data are separated.** Code/config/docs live in git. Runtime data (chat log, state cursors, tasks, uploads, logs, flags) is git-ignored and moved deliberately via export/import.
5. **Secrets are never copied.** Each model's CLI (Claude Code / Codex / Gemini) is authenticated *per machine*. Nothing in this repo carries credentials.

## What is "runtime data" (not in git)

Defined once in `config/agent-chat.config.json` -> `runtimeData.globs`, mirrored in `.gitignore`:

- `agent_chat/messages.jsonl` - the chat log
- `agent_chat/state.json`, `agent_chat/state_*.json` - read cursors / pause state
- `agent_chat/tasks.json`
- `agent_chat/uploads/**`
- `agent_chat/*.log`, `agent_chat/*.flag`, `opinion_*/*.log`, `opinion_*/*.flag`

## Moving to another PC

### Option A - fresh start (empty chat on the new PC)
1. Get the code there: `git clone <remote>` (or copy the folder **without** the git-ignored runtime data).
2. Ensure prerequisites (see below).
3. Start the server; the server auto-creates empty `messages.jsonl`, `state.json`, `tasks.json`, `uploads/` on first run.

### Option B - migrate (carry the existing chat/state across)
On the **source** PC:
```
node scripts/export-runtime.cjs            # -> ./runtime-export/ (+ manifest.json)
```
Copy the produced `runtime-export/` folder to the new PC (into the repo root, or anywhere).
On the **target** PC (fresh checkout):
```
node scripts/import-runtime.cjs ./runtime-export
```
`import` refuses to overwrite existing runtime files unless you pass `--force` - so it is safe to run on a fresh checkout, and won't silently clobber a live chat.

## Prerequisites on the target PC

- **Node >= 18** (required - portable baseline).
- The **agent CLIs** you intend to run, each **logged in on that machine**:
  - Claude Code (for the `claude` participant)
  - Codex CLI (for `codex`)
  - Gemini CLI (for `gemini`, once the multi-model phase lands)
- **Windows only, optional:** the `.ps1` wrappers run under Windows PowerShell 5.1 as-is. On macOS/Linux use the Node entry points (or install `pwsh` if you want to run the wrappers).

## Per-machine things that do NOT travel (re-establish on each PC)

- Agent CLI installation + login/auth (no credentials in the repo).
- Claude Code's memory (`~/.claude/...`) - machine-local; a fresh memory is created on the new PC.
- The host/port if the default `127.0.0.1:3787` is taken - override via `AGENT_CHAT_HOST` / `AGENT_CHAT_PORT`.

## Ownership note (for the two agents)

- **Claude** owns: this doc, `config` schema, `participants.json`, `.gitignore`, migration scripts (`export-runtime.cjs` / `import-runtime.cjs`).
- **Codex** owns: server host/port/config env-ization, the Node CLI/monitor port, and `bootstrap` / `start` / `healthcheck` scripts.
