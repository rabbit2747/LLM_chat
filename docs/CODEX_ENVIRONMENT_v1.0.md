# Codex Environment Snapshot v1.0

This document captures the Codex side of the LLM_Chat v1.0 default
environment. It is intended for moving the project to another PC without
copying secrets.

## Scope

- Snapshot owner: Codex
- Project root on this PC: `C:\Users\HS\LLM_Chat`
- Current committed foundation: `5d67fb7c221894a743a8dae5c708ba8c1f863859`
- Current git remote: `origin https://github.com/rabbit2747/LLM_chat.git`
- Portable runtime baseline: Node.js >= 18
- Current local Node version observed by Codex: `v24.12.0`

This file documents Codex-side runtime behavior, tools, skills, connectors,
and monitoring rules. Claude maintains the main environment snapshot and
Claude-side details in `docs/ENVIRONMENT_v1.0.md`.

## Codex Operating Rules

User authority is absolute.

Codex must follow claim-first collaboration:

1. Before implementation, state which file or area Codex will own.
2. Wait for Claude/Codex alignment when the task is non-trivial.
3. Update `coordination.md` with owner, reviewer, claimed files, and next
   action before source edits.
4. Do not edit Claude-owned files unless Claude hands them off.
5. If a new user message arrives, stop current work and reprioritize.

Post-facto ownership claims are not acceptable for planned work.

## Codex Monitoring Mode

Codex primary monitoring is main-Codex direct monitoring.

Deprecated for Codex primary operation:

- heartbeat polling that wakes the LLM on a fixed schedule
- background watcher processes that answer or make decisions
- one-shot watcher loops as a substitute for visible main-Codex handling

Current Codex rule:

1. Main Codex directly checks `agent_chat/messages.jsonl` or
   `node scripts/agent-chat.cjs unread --for codex`.
2. Main Codex handles the newest user message first.
3. Main Codex responds visibly when the user is testing monitoring or asking
   Codex directly.
4. Main Codex marks messages read only after deciding how to respond.
5. While active, Main Codex uses preemption checkpoints before/after meaningful
   work, before edits, before commits, and before final status.

Foreground direct monitor command:

```bash
node scripts/direct-monitor.cjs codex
```

Optional timeout control:

```bash
AGENT_CHAT_MONITOR_TIMEOUT_MS=3600000 node scripts/direct-monitor.cjs codex
```

Important limitation:

- This direct monitor works while a Codex turn is active.
- It does not prove that the Codex desktop runtime can be externally
  re-invoked after the turn ends.

## Codex Portable Entry Points

Cross-OS Node entry points:

```bash
node scripts/bootstrap.cjs
node scripts/start-agent-chat.cjs
node scripts/healthcheck.cjs
node scripts/agent-chat.cjs help
node scripts/agent-chat.cjs unread --for codex
node scripts/export-runtime.cjs
node scripts/import-runtime.cjs ./runtime-export
```

Windows compatibility wrappers may remain, but they are not the portable
baseline:

```text
scripts/agent-chat.ps1
scripts/watch-agent-chat-codex.ps1
scripts/watch-agent-chat-codex-strict.ps1
scripts/watch-claude-opinion-flag.ps1
```

## Codex Tools Available In This Session

Local development tools:

- PowerShell shell execution
- `apply_patch` file editing
- Git CLI
- Node.js
- direct local filesystem access
- image viewing for local images when needed

Codex app tools visible in this session:

- automation management through `codex_app.automation_update`
- workspace dependency discovery through `codex_app.load_workspace_dependencies`
- current app terminal read through `codex_app.read_thread_terminal`
- plugin/tool discovery through `tool_search`

System tools visible in this session:

- web search/browse
- image generation/editing

## Codex Plugins And Connectors Snapshot

Enabled plugin families visible to Codex in this session:

- Browser
- Codex Security
- Documents
- GitHub
- Gmail
- Google Calendar
- Google Drive
- Hugging Face
- Presentations
- Slack
- Spreadsheets
- Supabase
- Vercel

These connectors may require per-machine or per-account authentication. Do not
copy credentials between PCs through this repository.

## Codex Skills Snapshot

Relevant system/plugin skill families visible to Codex in this session:

- browser automation
- OpenAI docs
- image generation
- documents
- presentations
- spreadsheets
- GitHub workflows
- Gmail workflows
- Google Calendar workflows
- Google Drive/Docs/Sheets/Slides workflows
- Slack workflows
- Supabase workflows
- Hugging Face workflows
- Vercel/Next.js/React/deployment workflows
- Codex Security workflows

Local/user skills visible to Codex in this session:

- `grware-feature-worker`
- `grware-orchestrator`
- `grware-review-gate`
- `grware-status-visualizer`
- `hs-security-scan`
- `karpathy-guidelines`
- `pentester`
- `playwright`
- `ios-diagnostics`

Skills are part of the Codex environment, not the portable project runtime.
On another PC, install or enable equivalent Codex skills/plugins separately.

## MCP And App State Policy

Codex may access MCP-backed apps/connectors through enabled plugins, but this
repository must not store:

- OAuth tokens
- API keys
- session cookies
- connector credentials
- local Codex app secrets
- personal account state

For a new PC:

1. Clone or copy the repository.
2. Run `node scripts/bootstrap.cjs`.
3. Authenticate required connectors in the Codex app or CLI on that PC.
4. Verify project health with `node scripts/healthcheck.cjs`.
5. Verify Codex messaging with `node scripts/agent-chat.cjs unread --for codex`.

## Runtime Data Policy

Git tracks code, docs, config, UI, and scripts.

Runtime data is intentionally ignored by git and moved only through export/import:

- `agent_chat/messages.jsonl`
- `agent_chat/state.json`
- `agent_chat/state_*.json`
- `agent_chat/tasks.json`
- `agent_chat/uploads/**`
- `agent_chat/*.log`
- `agent_chat/*.flag`
- `opinion_claude/*.log`
- `opinion_claude/*.flag`
- `opinion_codex/*.log`
- `opinion_codex/*.flag`

Fresh start:

```bash
node scripts/bootstrap.cjs
node scripts/start-agent-chat.cjs
```

Migration:

```bash
node scripts/export-runtime.cjs
node scripts/import-runtime.cjs ./runtime-export
```

`import-runtime.cjs` refuses to overwrite existing runtime files unless
`--force` is passed.

## Fresh PC Codex Checklist

1. Install Node.js >= 18.
2. Clone `https://github.com/rabbit2747/LLM_chat.git`.
3. Authenticate the Codex environment and any required connectors on that PC.
4. Run `node scripts/bootstrap.cjs`.
5. Start the server with `node scripts/start-agent-chat.cjs`.
6. Run `node scripts/healthcheck.cjs`.
7. If migrating chat state, run `node scripts/import-runtime.cjs ./runtime-export`.
8. Open the UI at the configured host/port, default `http://127.0.0.1:3787`.
9. Use main-Codex direct monitoring during active collaboration.

## Known Non-Portable Items

These must be recreated or reauthenticated on each PC:

- Codex app login
- connector/app credentials
- local skill installation if not present on the target PC
- local shell profile settings
- any external model CLI login, such as Gemini when added later

## Verification Commands Used For v1.0 Foundation

```bash
node --check scripts/agent-chat-server.cjs
node --check scripts/agent-chat.cjs
node --check scripts/start-agent-chat.cjs
node --check scripts/healthcheck.cjs
node --check scripts/direct-monitor.cjs
node --check scripts/bootstrap.cjs
node --check scripts/lib/runtime-data.cjs
node --check scripts/export-runtime.cjs
node --check scripts/import-runtime.cjs
node scripts/bootstrap.cjs
node scripts/healthcheck.cjs
```
