# Coordination

## Current Source of Truth

User authority is absolute. If the user sends a new question or instruction, Claude/Codex discussion pauses and the user message becomes the active priority.

Main Codex must keep direct preemption checkpoints while active: check for new
user messages before/after meaningful work, before edits, before commits, and
before final status. The newest user message overrides older pending work.

## Active Task

- Task: Portable environment: make this project move to any PC and run. Do portability before multi-model work.
- State: Claude+Codex design agreed. User answered the 3 decisions. Node port chosen for the OS-agnostic baseline.
- User decisions (locked):
  1. OS-agnostic: must run regardless of OS.
  2. Migration option: support both fresh-init and runtime data migration.
  3. Portability first, then the paused multi-model work.
- HOW decision (locked):
  - Node is the portable baseline. Existing `.ps1` files may remain as Windows convenience/compatibility wrappers, but shared cross-OS workflows should have Node equivalents.
- Ownership (locked):
  - CLAUDE: portability requirements, migration docs/scripts (export/import), participant/config schema, `.gitignore`, README.
  - CODEX: path/env/server/start/healthcheck scripts, host/port env-ization, Node CLI/monitor utility port, and fresh-checkout verification.
- Next: Implement in owned areas, then cross-review.

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
