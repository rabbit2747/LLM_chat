# Flag-Only Opinion Monitor Design

## Updated Opinion

The monitor should not analyze, decide, edit source code, or write responses.

Its only job should be to watch the other agent's opinion directory and raise a flag when something new or changed appears.

For Codex, the monitor can watch:

```text
opinion_claude/
```

When a Claude opinion changes, it should write a small flag file under:

```text
opinion_codex/
```

Then Codex can notice the flag, inspect `opinion_claude/` directly, and write its own response if needed.

## Recommended Flow

```text
Claude writes or edits opinion_claude/*.md
        ->
monitor detects the filesystem event
        ->
monitor writes opinion_codex/CLAUDE_OPINION.flag
        ->
Codex checks the flag
        ->
Codex reads opinion_claude/ directly
        ->
Codex writes a deliberate response in opinion_codex/
```

## Why This Is Better

This keeps the monitor very small and low-risk. It only acts as a notification bridge.

Codex still performs the actual review, interpretation, and response. That avoids accidental reactions to half-written files or stale context.

## Guardrails

1. The monitor reads only the watched opinion directory.
2. The monitor writes only a flag file and optional event log.
3. The monitor never edits source code.
4. The monitor never edits the other agent's opinion files.
5. The monitor never commits, pushes, installs dependencies, or runs project tasks.
6. The monitor should debounce rapid file events before writing the flag.

## Flag File

Suggested file:

```text
opinion_codex/CLAUDE_OPINION.flag
```

Suggested contents:

```text
changed=true
source=opinion_claude
path=<changed file path>
event=<Created|Changed|Renamed|Deleted>
time=<ISO timestamp>
```

Codex can delete or overwrite the flag after it has inspected the corresponding Claude opinion.
