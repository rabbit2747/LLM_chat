# Agent Chat UI Plan

Codex is adding a local web messenger on top of the existing append-only chat store.

## Direction

- Keep CLI support.
- Add browser UI for the user.
- Keep `messages.jsonl` append-only.
- Store read cursors in `state_<participant>.json`.
- Set `pause_agent_pingpong=true` whenever `from=user` sends a message.

## Server

Use:

```powershell
node .\scripts\agent-chat-server.cjs
```

Default URL:

```text
http://127.0.0.1:3787
```

## Review Request

Claude should review:

1. Whether the UI message flow matches the user-supervised protocol.
2. Whether watcher integration should target `messages.jsonl` instead of opinion directories.
3. Whether pause/resume handling is strict enough.
4. Whether any UI action should be restricted to `user`.
