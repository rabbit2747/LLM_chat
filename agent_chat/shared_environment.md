# Shared Environment And Capability Registry

## Purpose

Claude and Codex run on the same local PC and the same repository, so shared local setup should be installed once whenever possible.

Agent-specific capabilities, credentials, MCP tools, skills, and runtime state must still be documented separately because each agent may have different access.

## User Authority

User instructions are absolute.

If a user message appears in `agent_chat/messages.jsonl`, Claude/Codex discussion pauses and the user message becomes the active priority.

## Shared Local Setup Policy

Use this rule:

```text
Install once on the PC when the tool is genuinely shared.
Configure per agent only when credentials, state, plugins, or permissions differ.
```

Examples:

- Shared install:
  - Node.js
  - npm dependencies
  - PowerShell scripts
  - local watcher scripts
  - browser UI server
- Per-agent configuration:
  - Codex skills
  - Claude skills or project memory
  - MCP server access
  - app connectors
  - API keys and credentials
  - read cursors such as `state_codex.json` and `state_claude.json`

## Current Shared Tools

- Local messenger CLI: `scripts/agent-chat.ps1`
- Local messenger UI server: `scripts/agent-chat-server.cjs`
- Local messenger UI: `agent_chat/ui/`
- Shared message log: `agent_chat/messages.jsonl`
- Shared state: `agent_chat/state.json`
- Per-agent read cursors:
  - `agent_chat/state_codex.json`
  - `agent_chat/state_claude.json`
- Claude message watcher: `opinion_claude/watch-channel.ps1`
- Claude opinion flag watcher for Codex side: `scripts/watch-claude-opinion-flag.ps1`

## Codex Available Skills Snapshot

Codex currently has these relevant skill/plugin families available in this session:

- Browser automation
- GitHub
- Gmail
- Google Calendar
- Google Drive, Docs, Sheets, Slides
- Slack
- Supabase
- Vercel
- Hugging Face
- Documents
- Presentations
- Spreadsheets
- Security scan workflows
- Local project skills:
  - `grware-feature-worker`
  - `grware-orchestrator`
  - `grware-review-gate`
  - `grware-status-visualizer`
  - `hs-security-scan`
  - `karpathy-guidelines`
  - `pentester`
  - `playwright`
  - `ios-diagnostics`

Codex can also use local shell access in this workspace and the Codex app automation heartbeat currently named:

```text
Monitor Agent Chat
```

It checks the messenger periodically for new Codex/user messages.

## Claude Capability Section

Claude should add or report:

- Claude available MCP servers
- Claude available skills/tools
- Claude project memory files
- Claude watcher behavior
- Any setup already installed on the shared PC
- Any setup Claude needs Codex to avoid duplicating

## Setup Coordination Rules

1. Before installing anything, check whether the other agent already installed it.
2. Prefer adding setup notes here before adding a new dependency.
3. If a dependency is project-level, commit it to normal project files.
4. If a dependency is local-only, document it here and avoid deployment.
5. Never store secrets in this repository.
6. Keep `agent_chat/`, `opinion_claude/`, and `opinion_codex/` out of deployment.

## Next Step

Claude should fill in the Claude capability section or send the details through the messenger.

After that, Codex and Claude can agree on:

- shared setup baseline
- who owns each type of task
- which watchers/automations remain active
- what should never be duplicated
