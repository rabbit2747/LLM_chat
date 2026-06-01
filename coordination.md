# Coordination

## Current Source of Truth

User authority is absolute. If the user sends a new question or instruction, Claude/Codex discussion pauses and the user message becomes the active priority.

Main Codex must keep direct preemption checkpoints while active: check for new
user messages before/after meaningful work, before edits, before commits, and
before final status. The newest user message overrides older pending work.

## Active Task

- Task: V1.1 environment snapshot and continuous monitoring constitution.
- User reference:
  - `User_000043_2606011606`: snapshot current configuration as V1.1 and record
    continuous monitoring requirements for Claude and Codex separately.
- State: Claude and Codex agreed on the V1.1 scope. Clipboard paste is already
  committed at `75db625`, so V1.1 should include all current work through that
  commit.
- Scope:
  - Add a constitutional rule that monitoring must be continuous while agents
    are active.
  - Document Codex monitoring as a main-Codex foreground `direct-monitor.cjs`
    rearm loop.
  - Document Claude monitoring as its backlog-safe watcher/wake method.
  - Write V1.1 snapshot documentation and tag/push V1.1.
- Ownership (locked):
  - CODEX owns `agent_chat/work_protocol.md` continuous monitoring section,
    especially the Codex method.
  - CLAUDE owns V1.1 environment snapshot documentation, exact Claude
    monitoring wording review, commit, tag `v1.1`, and push.
- Next: Codex updates the constitution, then Claude writes the V1.1 snapshot and
  performs final review/commit/tag.

## Previous Completed Task

- Task: Portable environment foundation.
- State: Implemented, reviewed, committed as `5d67fb7 Initial commit: portable multi-agent collaboration environment`.
- Git remote: `origin https://github.com/rabbit2747/LLM_chat.git`.

## Previous Paused Task

- Task: Multi-model structuring to let other models, for example Gemini, join the messenger.
- State: Claude and Codex reached design agreement, but implementation is paused because the user sent a newer portability question.
- Agreed direction: participants registry, separate dispatcher process, wake/runner adapters, N-agent UI/protocol generalization.

## Agreed Working Rules

1. Use `agent_chat/` for short messages.
2. Use `opinion_claude/` and `opinion_codex/` for longer reasoning.
3. Use this file for the concise current state.
4. Do not edit another agent's opinion files directly.
5. Check `git status` before source edits.
6. User messages override all agent-to-agent discussion.
7. After a user instruction, do not start implementation immediately unless the instruction is explicitly trivial or urgent.
8. For non-trivial work, first discuss requirements, design, division of labor, and ownership in `agent_chat/messages.jsonl`.
9. Only the agreed owner edits the relevant files; the other agent reviews.
10. If one agent claims ownership of a file or task, the other agent must hold edits to that area until handoff.
11. Update this file before implementation starts so the current owner, state, and next action are visible.
