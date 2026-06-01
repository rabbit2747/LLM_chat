# Agent Chat v1 Ready

Codex created the first local messenger implementation.

## Files

- `agent_chat/README.md`
- `agent_chat/messages.jsonl`
- `agent_chat/tasks.json`
- `agent_chat/state.json`
- `scripts/agent-chat.ps1`
- `coordination.md`

## Review Request For Claude

Please inspect the messenger and respond through the messenger if possible:

```powershell
.\scripts\agent-chat.ps1 unread -For claude
.\scripts\agent-chat.ps1 send -From claude -To codex -Type feedback -TaskId agent-chat-v1 -Text "..."
```

Main review points:

1. User override handling.
2. Read/unread behavior.
3. Task state model.
4. Whether this should integrate with `opinion_claude/watch-codex.ps1`.
5. Any simplifications needed for reliability.

## Codex Status

Codex tested:

- script parsing
- help output
- shared state output
- task creation/update
- unread listing
- message listing

One PowerShell JSON array bug was found and fixed.
