# LLM_Chat - Default Environment Snapshot **v1.0**

This is the **main** v1.0 snapshot of the LLM_Chat collaboration environment:
the exact state to reproduce on another PC so you can use llm_chat with this
same environment (the chat *data* will differ; the *environment* should match).

> Companion: Codex-side details live in
> [`CODEX_ENVIRONMENT_v1.0.md`](CODEX_ENVIRONMENT_v1.0.md). Portability/migration
> mechanics live in [`PORTABILITY.md`](PORTABILITY.md).

**Golden rule - never commit secrets.** Tokens, API keys, OAuth/session state,
and `~/.claude/.credentials.json` stay per-machine. This doc captures the
*shape* of the environment (names, lists, config structure), not secret values.

---

## 1. Snapshot identity

| Field | Value |
|-------|-------|
| Version tag | `v1.0` (tag points to the snapshot commit below) |
| Foundation commit | `5d67fb7` (portable foundation, Initial commit) |
| V1.0 snapshot commit | the commit tagged `v1.0` (this doc + `CODEX_ENVIRONMENT_v1.0.md` live here; resolve with `git rev-parse v1.0`) |
| Branch / remote | `main` -> `origin` = https://github.com/rabbit2747/LLM_chat.git |
| Portable runtime baseline | Node.js >= 18 (observed here: v24.12.0) |
| Snapshot date | 2026-06-01 |
| Snapshot owners | Claude (this doc) + Codex (`CODEX_ENVIRONMENT_v1.0.md`) |

---

## 2. The two layers (this answers "is it portable as-is?")

The environment is split across two layers. **Only layer A travels in git.**
Layer B is per-machine Claude Code / Codex configuration that must be
re-created on each PC. That is why `git clone` alone gives you the app but not
the full working environment.

### Layer A - in the repo (portable via git) YES
Messenger app, config, docs, scripts, watcher scripts, and collaboration MD.
See sections 3-4.

### Layer B - in `~/.claude/` and the agent runtimes (per-machine) NO not in git
Skills, plugins, MCP servers, Claude Code settings, memory, credentials.
See sec 5. These must be reinstalled/reauthenticated on a new PC (sec 7).

---

## 3. Repo layout (Layer A - what git tracks)

```
agent_chat/      messenger: ui/, participants.json, (runtime: messages.jsonl, state*, tasks, uploads/)
opinion_claude/  Claude long-form .md + watch-channel.ps1 + watch-codex.ps1
opinion_codex/   Codex long-form .md
config/          agent-chat.config.json (portable SSOT: host/port/paths/runtime globs)
scripts/         Node server, agent-chat.cjs CLI, bootstrap/start/healthcheck,
                 direct-monitor, export/import-runtime, lib/, .ps1 Windows wrappers
docs/            this file, CODEX_ENVIRONMENT_v1.0.md, PORTABILITY.md
coordination.md  agreed current state (SSOT)
README.md        overview + quick start
.gitignore       excludes runtime data (carried via export/import only)
```

## 4. Committed collaboration MD & their roles

| File | Role |
|------|------|
| `coordination.md` | SSOT: active task, owners, locks, agreed working rules |
| `agent_chat/work_protocol.md` | full collaboration protocol incl. User Preemption / claim-first |
| `agent_chat/capabilities.md`, `shared_environment.md`, `monitoring_design.md`, `README.md` | system design notes |
| `opinion_claude/*.md`, `opinion_codex/*.md` | each agent's long-form reasoning archive |
| `docs/PORTABILITY.md` | move-to-another-PC mechanics |

---

## 5. Claude-side environment manifest (Layer B - recreate per PC)

Source of truth on this machine: `~/.claude/`. Listed here as a **manifest**
so it can be reproduced; raw commands/tokens are intentionally omitted.

### 5.1 Skills
- **User skills** (`~/.claude/skills/`): `hs-security-scan`, `ios-diagnostics`, `pptx-format-transfer`
- **Plugin-provided skills**: come bundled with the enabled plugins in sec 5.2
  (e.g. `code-review`, `frontend-design`, `agent-sdk-dev:new-sdk-app`,
  `anthropic-skills:*` such as docx/pdf/pptx/xlsx/skill-creator, `deep-research`).

### 5.2 Plugins (enabled)
Marketplace: `claude-plugins-official` (github: `anthropics/claude-plugins-official`).
Enabled in `~/.claude/settings.json`:
`github`, `code-review`, `security-guidance`, `context7`, `frontend-design`,
`agent-sdk-dev`, `playwright` (all `@claude-plugins-official`).

### 5.3 MCP servers
- **User-configured** (in `~/.claude.json`, user scope): `ghidra`, `jadx`, `burp`
  - reverse-engineering / pentest tool servers. Recreate on a new PC with
  `claude mcp add ...`; their commands/paths/tokens are machine-local and are
  **not** stored here.
- **Plugin-provided**: `context7` (context7 plugin), `playwright` (playwright plugin).
- **Built-in harness servers** (ship with Claude Code, no user config): preview,
  browser (Claude_in_Chrome), session management, mcp-registry, scheduled-tasks.

### 5.4 Settings (sanitized summary)
- `~/.claude/settings.json`: `enabledPlugins` (the 7 above),
  `skipDangerousModePermissionPrompt: true`, `agentPushNotifEnabled: true`.
- `~/.claude/settings.local.json`: a `permissions.allow` list only
  (Bash/PowerShell command allowlist - e.g. `powershell:*`, `claude mcp *`,
  `wmic ...`, `java *`, `Stop-Process *`). No secrets.

### 5.5 Memory
`~/.claude/projects/C--Users-HS-LLM-Chat/memory/`: `MEMORY.md` (index) +
`claude-codex-collab.md`, `claim-before-acting.md`. Machine-local; recreated
per PC. Not part of the repo.

### 5.6 Claude monitoring / watcher arming runbook
Claude's wake mechanism = **one-shot PowerShell watchers** that exit on a new
event, which makes the harness re-invoke Claude:
- `opinion_claude/watch-channel.ps1` - watches `agent_chat/messages.jsonl`,
  wakes only on `to==claude` or `to==all`.
- `opinion_claude/watch-codex.ps1` - watches `opinion_codex/*.md`.

Arm (re-arm after every wake, and at the start of every new session):
```
powershell -NoProfile -ExecutionPolicy Bypass -File opinion_claude/watch-channel.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File opinion_claude/watch-codex.ps1
```
Note: this wake path is currently **Claude Code + Windows PowerShell** specific.
The messenger/app itself is cross-OS Node; only this re-invocation mechanism is
host-specific. Codex uses main-direct monitoring instead (see the Monitoring section of its doc).

---

## 6. Monitoring model (both agents, summary)
- **Claude**: one-shot watcher exits -> harness re-invokes (re-arm each turn).
- **Codex**: main-Codex direct monitoring (`node scripts/direct-monitor.cjs codex`
  during an active turn); background watcher deprecated.
- Both observe **User Preemption**: a new user message preempts agent work.

## 7. Fresh-PC reproduction (full environment, not just the app)
1. Install **Node.js >= 18**.
2. `git clone https://github.com/rabbit2747/LLM_chat.git && cd LLM_chat`
3. `node scripts/bootstrap.cjs` then `node scripts/start-agent-chat.cjs`
   (`node scripts/healthcheck.cjs` to verify). UI: `http://127.0.0.1:3787`.
4. **Recreate Layer B** (not carried by git):
   - Install/enable the sec 5.2 plugins and sec 5.1 skills.
   - Re-add the sec 5.3 MCP servers (`ghidra`, `jadx`, `burp`) with `claude mcp add`,
     and authenticate any connectors **on that PC**.
   - Apply the sec 5.4 settings (enabledPlugins + permission allowlist) as desired.
5. **Chat data**: fresh start (server auto-creates empty files) **or** migrate
   with `export-runtime.cjs` -> copy -> `import-runtime.cjs ./runtime-export`.
6. Arm Claude watchers (sec 5.6); use Codex direct monitoring (its doc).

## 8. Secret-exclusion policy (must NEVER be committed)
`~/.claude/.credentials.json`, OAuth tokens, API keys, session cookies,
connector/MCP credentials, and any raw `~/.claude.json` server commands that
embed tokens/paths. The repo `.gitignore` already excludes runtime data; these
secrets live outside the repo by design.

## 9. Protocol: claim-first / lock-first
Non-trivial work follows: user instructs -> each agent opines -> reconcile +
**claim ownership before acting** ("I'll take X" *before* doing it, never after)
-> execute in owned areas -> cross-review. Locks recorded in `coordination.md`.

## 10. Tagging v1.0
After this doc + `CODEX_ENVIRONMENT_v1.0.md` are committed:
```
git tag -a v1.0 -m "v1.0 default environment snapshot"
git push origin v1.0
```
