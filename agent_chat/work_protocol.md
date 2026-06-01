# Claude/Codex Work Protocol

## Problem

The user explicitly asked that Claude and Codex discuss, design, plan, divide work, and then execute.

During the messenger UI work, both agents sometimes worked in parallel on the same area. That created duplicated effort and risked conflicting edits.

This is a protocol violation.

## Correct Flow For User Instructions

1. User gives an instruction.
2. All active agent work pauses.
3. Claude and Codex discuss:
   - what the user wants
   - requirements and constraints
   - design approach
   - who is better suited for which part
   - which files or systems each agent may touch
4. Agents agree on ownership.
5. `coordination.md` is updated with:
   - task
   - state
   - owner
   - reviewer
   - files claimed
   - next action
6. Only the owner implements.
7. The other agent reviews.
8. If a new user message arrives, stop and reprioritize.

## Constitutional Rule: User Preemption During Work

User messages preempt every other task, including implementation, testing,
committing, monitoring, agent-to-agent discussion, and review.

Main Codex must operate with preemption checkpoints:

1. before starting any non-trivial tool sequence
2. after each meaningful tool result
3. before editing files
4. before committing
5. before sending final status
6. during long work by splitting commands into bounded steps where possible

If a new user message is detected at a checkpoint:

1. stop the current task immediately
2. treat the newest user message as the active priority
3. do not continue older pending work until the newest message is handled
4. update or consult `coordination.md` if ownership or task state changes

Codex must not rely on a background watcher to satisfy this rule. Main Codex is
responsible for directly checking `agent_chat/messages.jsonl` or
`agent-chat` unread state while active.

## Constitutional Rule: Encoding And Portability Hygiene

LLM_Chat is intended to move across PCs and operating systems. Committed files
must avoid encoding and filename choices that can break on another machine.

Binding policy:

```text
docs/ENCODING_POLICY.md
```

Required rules:

1. File and directory names must use ASCII portable names only.
2. Committed text files must be UTF-8 without BOM and use LF line endings.
3. Code and config files must be ASCII-only, including comments.
4. Markdown may contain non-ASCII prose when needed, but no decorative Unicode
   punctuation, arrows, emoji, smart quotes, section signs, or hidden BOM/ZWSP.
5. Runtime data such as chat logs and uploads is exempt because it is not
   committed.
6. Before commit, run:

```text
node scripts/check-encoding.cjs --staged
```

For full audits, run:

```text
node scripts/check-encoding.cjs
```

Encoding violations are review blockers. Existing violations must be fixed by
the file owner or explicitly documented as temporary legacy exceptions.

## Ownership Rules

- One owner per implementation area.
- One reviewer per implementation area.
- A file owner has the write lock for that file group.
- The reviewer must not edit owned files unless the owner hands off.
- Emergency fixes require an explicit message explaining why immediate action was needed.

## Suggested Message Types

- `proposal`: suggested design or division of labor
- `agreement`: acceptance of design/ownership
- `handoff`: owner gives work to the other agent
- `hold`: request that the other agent stop editing a file group
- `review`: review results
- `decision_needed`: stop and ask the user

## Current Lock Rule

Until this protocol is acknowledged by both agents:

```text
No further source edits except protocol/coordination documentation.
```

## Codex Commitment

Codex will not independently implement non-trivial user instructions before first discussing design and ownership with Claude.

## Deprecated Rule: Codex Watch Loop

The one-shot watch loop was tested and is deprecated for primary monitoring.

It can detect a message, but it does not reliably ensure that main Codex responds in the visible Codex thread and rearms the watcher.

For active messenger collaboration, main Codex must directly monitor the messenger instead.

Deprecated loop:

```text
watch agent armed
        ->
watch agent detects a relevant message
        ->
watch agent reports raw message fields to main Codex
        ->
watch agent terminates
        ->
main Codex reads the messenger directly
        ->
main Codex responds where appropriate
        ->
main Codex marks messages read
        ->
main Codex immediately arms the next watch agent
```

This rule was attempted because:

- heartbeat polling clutters the main Codex conversation
- a single one-shot watcher exits after detection
- without rearming, Codex will miss the next messenger event

Therefore, after every watch-agent notification, Codex must either:

1. rearm the next watch agent, or
2. explicitly tell the user that monitoring is no longer armed.

Silent unarmed monitoring is not allowed.

Current rule:

```text
main Codex directly checks unread messages
        ->
main Codex handles the message
        ->
main Codex responds visibly when required
        ->
main Codex marks messages read
```

## Constitutional Rule: Watch Agent Is Not Codex

The watch agent is only a messenger sensor.

The watch agent must not:

- answer the user
- answer Claude
- write to `agent_chat/messages.jsonl`
- run `scripts/agent-chat.ps1 send`
- run `scripts/agent-chat.ps1 read`
- edit source files
- make decisions
- summarize as if it were main Codex

The watch agent may only:

1. read `agent_chat/state_codex.json`
2. read `agent_chat/messages.jsonl`
3. detect the next relevant message
4. report only the raw message fields to main Codex:
   `id`, `from`, `to`, `type`, `task_id`, `created_at`, `text`
5. terminate

Only main Codex may decide what to say, where to say it, whether to mark read, and when to rearm the next watcher.

## Constitutional Rule: Visible Codex Acknowledgement

When a watch agent reports a user message, main Codex must not satisfy the event only inside the messenger UI.

Main Codex must do all of the following:

1. inspect the messenger record directly
2. answer in the messenger when appropriate
3. answer in the main Codex thread when the user is testing monitoring, asking why Codex did not respond, or requesting visible confirmation
4. mark the message read only after the visible response decision is made
5. rearm the next watch agent or explicitly say monitoring is not armed

Messenger-only acknowledgement is not enough for monitoring tests unless the user explicitly says the main Codex thread should stay silent.

## Constitutional Rule: Backlog-First Monitoring

Monitoring must not only watch messages that arrive after the monitor starts.

When any agent monitor or watcher starts, it must first check unread backlog
using that agent's read cursor. Only when there is no unread backlog may it set
the current end of `messages.jsonl` as the live baseline and wait for new
messages.

Required behavior:

1. read the agent cursor, for example `agent_chat/state_codex.json`
2. scan `agent_chat/messages.jsonl` for relevant messages after that cursor
3. if unread messages exist, return or handle them before waiting for new ones
4. if multiple unread user messages exist, the newest user message is the active
   priority
5. only after backlog is clear, monitor new appended messages

This prevents missed messages when monitoring was temporarily off.
