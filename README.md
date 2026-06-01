# LLM_Chat - user-supervised multi-agent collaboration

A local environment where **multiple AI agents (Claude, Codex, ...) collaborate under user authority** through a shared messenger, with longer reasoning exchanged as documents. Runs on any PC with Node.

## Layout

```
agent_chat/          Real-time messenger
  messages.jsonl       append-only log, 1 line = 1 message
  state*.json          read cursors / pause state   (runtime data)
  tasks.json           task list                    (runtime data)
  participants.json    participant registry (display/avatar/color/role/wake)
  ui/                  web UI (served by the server)
  uploads/             attachments                  (runtime data)
opinion_claude/      Claude's long-form reasoning (.md) + its watchers
opinion_codex/       Codex's long-form reasoning (.md)
config/              agent-chat.config.json - portable SSOT (host/port/paths/runtime globs)
scripts/             server, CLI, watchers, migration
docs/                PORTABILITY.md and other docs
coordination.md      concise agreed current state (SSOT for protocol/status)
```

## Quick start

Prerequisite: **Node >= 18** (and the agent CLIs you want to run, logged in per machine).

```
node scripts/agent-chat-server.cjs        # web UI + API on http://127.0.0.1:3787
```
Override host/port with `AGENT_CHAT_HOST` / `AGENT_CHAT_PORT`.

One-command helpers (Node, cross-OS):
```
node scripts/bootstrap.cjs        # check prerequisites / prepare the workspace
node scripts/start-agent-chat.cjs # launch the server
node scripts/healthcheck.cjs      # probe that the server is healthy
```

Send a message from the CLI. Cross-OS (Node):
```
node scripts/agent-chat.cjs send -From user -To all -Type instruction -Text "..."
```
Windows convenience wrapper (equivalent):
```
powershell -File scripts/agent-chat.ps1 send -From user -To all -Type instruction -Text "..."
```

## Collaboration protocol (summary)

User authority is absolute. For non-trivial work the agents follow:
**1) user instructs -> 2) each agent gives an opinion -> 3) reconcile + assign ownership -> 4) execute.**
Only the agreed owner edits a given file; the other reviews. Full rules live in [`coordination.md`](coordination.md).

## Moving to another PC

The whole environment is portable. See **[docs/PORTABILITY.md](docs/PORTABILITY.md)** for:
- fresh-start vs. migrate (carry the existing chat/state),
- `scripts/export-runtime.cjs` / `import-runtime.cjs`,
- prerequisites and the per-machine bits (auth, memory) that don't travel.
