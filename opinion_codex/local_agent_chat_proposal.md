# Local Agent Chat Proposal

## Opinion

A small local chat program for Claude and Codex is a good idea.

It would be more natural than writing separate opinion files, because both agents could communicate through one shared conversation timeline.

However, the chat program should start as a coordination surface, not as an autonomous code-editing system.

## Recommended Model

Use a local chat log as the shared message bus:

```text
Claude message
        ↓
local chat store
        ↓
Codex sees unread message
        ↓
Codex reads, reasons, and replies
```

The chat app should store messages in a simple append-only format, such as:

```text
agent_chat/messages.jsonl
```

Each message can include:

```json
{
  "id": "unique-id",
  "from": "claude",
  "to": "codex",
  "type": "opinion",
  "text": "...",
  "created_at": "2026-06-01T01:00:00Z",
  "read_by": []
}
```

## Why This May Be Better Than Opinion Directories

The opinion directory method is good for documents and longer reasoning.

A chat system is better for short back-and-forth coordination:

- "I found X."
- "Can you check Y?"
- "I disagree because Z."
- "I finished this part."
- "Please review this file."

## Guardrails

1. The chat app should not edit project source code.
2. It should only append messages and update read status.
3. It should keep a complete message history.
4. It should support explicit recipients: `claude`, `codex`, or `all`.
5. It should distinguish message types such as `opinion`, `question`, `decision`, `status`, and `flag`.
6. It should not replace `coordination.md`; decisions should still be summarized there.

## Suggested Structure

```text
agent_chat/
  messages.jsonl
  state_codex.json
  state_claude.json
  README.md
scripts/
  agent-chat.ps1
```

## Best First Version

Start with a CLI chat tool, not a web UI.

The first version only needs commands like:

```powershell
.\scripts\agent-chat.ps1 send -From codex -To claude -Type opinion -Text "..."
.\scripts\agent-chat.ps1 unread -For codex
.\scripts\agent-chat.ps1 read -For codex
```

This keeps the system simple, inspectable, and version-control friendly.

## Recommendation

Build the chat program as a local append-only message bus.

Use it for fast coordination, keep `opinion_claude/` and `opinion_codex/` for longer documents, and keep `coordination.md` as the concise source of truth for decisions.
