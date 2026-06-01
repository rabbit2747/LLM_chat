# Monitoring Design

## Current Conclusion

Claude confirmed its mechanism is event-triggered at the agent level:

- A lightweight watcher checks `agent_chat/messages.jsonl`.
- The watcher exits only when it detects a message for Claude.
- The Claude harness re-invokes Claude when that watcher exits.
- Claude is not waking the LLM every few seconds.

Codex cannot currently guarantee external re-invocation after the main Codex turn ends.

## Codex Decision

The one-shot subagent watcher pattern is deprecated.

It detected messages, but it did not reliably produce the required main Codex acknowledgement and rearm loop. The user observed repeated failures where the messenger was updated or a subagent reported, but the main Codex chat did not answer.

Use direct Codex monitoring instead.

Deprecated pattern:

```text
spawn quiet watch agent
        ↓
agent watches messages.jsonl
        ↓
agent detects a relevant user/codex/all message
        ↓
agent completes and reports raw message fields to main Codex
        ↓
main Codex reads the message, handles it, marks it read
        ↓
main Codex spawns the next quiet watch agent
```

Do not use short-interval Codex heartbeat polling.

## Direct Monitoring Rule

Main Codex is responsible for checking the messenger directly when active collaboration is happening.

Required behavior:

1. run `scripts/agent-chat.ps1 unread -For codex`
2. inspect `agent_chat/messages.jsonl` when needed
3. answer in the main Codex thread when the user is testing visibility or asking Codex directly
4. answer in the messenger when appropriate
5. run `scripts/agent-chat.ps1 read -For codex`

Subagents must not be used as the primary monitoring loop unless a future harness supports reliable main-thread continuation.

## Local Flag Watcher

Script:

```text
scripts/watch-agent-chat-codex.ps1
```

Behavior:

- checks `agent_chat/messages.jsonl`
- detects new messages for `codex`, `all`, or any `user` message
- writes `agent_chat/CODEX_CHAT.flag`
- appends `agent_chat/codex_chat_watch.log`
- does not edit project source
- does not invoke Codex directly

This local watcher is useful for logs and flags, but it is not equivalent to main Codex being automatically re-invoked.

## Watch Agent Rules

The watch agent is one-shot, not permanent.

It should:

- read `agent_chat/state_codex.json`
- watch for the next message newer than Codex's read cursor
- match messages where:
  - `to=codex`
  - `to=all`
  - `from=user`
- avoid editing files
- avoid marking messages as read
- avoid writing to the messenger
- avoid answering, deciding, or summarizing as Codex
- finish only when it detects a relevant message or times out
- report only raw JSON fields: `id`, `from`, `to`, `type`, `task_id`, `created_at`, `text`

The watch agent itself must never run:

```text
scripts/agent-chat.ps1 send
scripts/agent-chat.ps1 read
```

Strict watch-only script:

```text
scripts/watch-agent-chat-codex-strict.ps1
```

This script must not write flags, logs, chat messages, read cursors, or source files.

When it reports, main Codex must:

1. inspect `agent_chat/messages.jsonl`
2. handle the user/Claude message according to the work protocol
3. respond in the messenger and/or main Codex thread as the message requires
4. run `scripts/agent-chat.ps1 read -For codex`
5. spawn a fresh watch agent

Codex must not leave the user believing monitoring is active when no watch agent is armed.

For user monitoring tests, main Codex must make the acknowledgement visible in the main Codex thread unless the user explicitly asks for messenger-only replies.

## Fallback

The previous heartbeat automation `monitor-agent-chat` has been deleted.

No periodic heartbeat should be used unless the user explicitly asks for unattended long-duration monitoring without an active Codex turn.

## Future Improvement

If Codex harness later supports external re-invocation from a local watcher exit, replace the one-shot subagent pattern with a Claude-style watcher-only model.
