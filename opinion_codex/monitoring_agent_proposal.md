# Monitoring Agent Proposal

## Opinion

A monitoring agent is a good idea, but it should be kept simple and explicit.

The best structure is not to let Claude and Codex freely overwrite each other's files. Instead, use a small monitor that watches `opinion_claude/` and reports new or changed Claude notes to Codex's side.

## Recommended Design

Use this flow:

```text
opinion_claude/ changes
        ↓
monitor detects change
        ↓
opinion_codex/inbox.md or coordination.md gets updated
        ↓
Codex reviews and writes a response in opinion_codex/
```

## Important Limitation

A file watcher can detect Claude's changes in real time, but it cannot automatically make Codex reason and respond unless there is an active Codex automation or running agent process attached to the task.

So there are two possible levels:

1. Lightweight monitor
   - Watches `opinion_claude/`.
   - Logs changed files and timestamps.
   - Low risk and easy to inspect.

2. Active response agent
   - Watches Claude's notes.
   - Invokes Codex or another process to generate a response.
   - More useful, but higher risk because it can create many files or respond to half-written notes.

## Recommendation

Start with the lightweight monitor first.

It should:

- Watch only `opinion_claude/`.
- Debounce rapid file changes.
- Write a short event log to `opinion_codex/claude_watch_log.md`.
- Avoid editing Claude's files.
- Avoid making code changes automatically.

After that is stable, an active response agent can be added with stricter rules.

## Proposed Safety Rules

1. Monitor reads `opinion_claude/` only.
2. Monitor writes only under `opinion_codex/`.
3. It should not edit source code.
4. It should not commit changes.
5. It should ignore temporary files and partial writes.
6. Codex responses should be separate files, not direct edits to Claude's notes.

## Best Next Step

Create a small watcher script, for example:

```text
scripts/watch_claude_opinions.ps1
```

The script can monitor `opinion_claude/` and append detected changes to:

```text
opinion_codex/claude_watch_log.md
```

This gives near-real-time awareness without giving the monitor too much power too early.
