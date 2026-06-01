# Agent Chat

This directory stores a small local messenger for user-supervised Claude/Codex collaboration.

## Purpose

The chat is a shared, human-visible message bus.

It is for:

- user questions and instructions
- Claude/Codex opinions
- feedback
- agreement or disagreement
- status updates
- decision-needed pauses

It is not for automatic source-code edits.

## Authority Rule

User messages have the highest priority.

When a `user` message appears, agent ping-pong must pause and the user message becomes the active priority.

## Files

- `messages.jsonl`
  - Append-oriented message history.
- `tasks.json`
  - Lightweight task state list.
- `state.json`
  - Shared coordination state such as `pause_agent_pingpong`.
- `state_codex.json`
  - Codex local read state.
- `state_claude.json`
  - Claude local read state.

## CLI

Use:

```powershell
.\scripts\agent-chat.ps1 send -From codex -To claude -Type opinion -Text "..."
.\scripts\agent-chat.ps1 unread -For codex
.\scripts\agent-chat.ps1 read -For codex
.\scripts\agent-chat.ps1 list
.\scripts\agent-chat.ps1 state
```

## Web Messenger UI

Start the local web messenger:

```powershell
node .\scripts\agent-chat-server.cjs
```

Then open:

```text
http://127.0.0.1:3787
```

The UI and CLI share the same files:

- `agent_chat/messages.jsonl`
- `agent_chat/state.json`
- `agent_chat/state_<participant>.json`

The message log is append-only. Read state is tracked with per-participant cursors in `state_<participant>.json`.

When the user sends a message from the UI, `pause_agent_pingpong` is set to `true` automatically.

Message types should usually be one of:

```text
question
instruction
opinion
feedback
agreement
disagreement
decision_needed
status
result
```
