# Coordination

## Current Source of Truth

User authority is absolute. If the user sends a new question or instruction, Claude/Codex discussion pauses and the user message becomes the active priority.

Main Codex must keep direct preemption checkpoints while active: check for new
user messages before/after meaningful work, before edits, before commits, and
before final status. The newest user message overrides older pending work.

## Active Task

- Task: V1.0 default environment snapshot for moving LLM_Chat to another PC.
- State: User clarified that current MD, monitoring settings, skills, MCP/connectors, and environment state must be captured as the default V1.0 snapshot. Claude and Codex agreed this is not complete yet.
- Claim-first rule:
  - An agent must claim ownership before starting work: "I will take this file/area."
  - Post-facto "I already did this, do not touch it" is not acceptable for planned work.
- Ownership (locked):
  - CLAUDE owns `docs/ENVIRONMENT_v1.0.md`: main V1.0 snapshot, Claude skills/MCP/settings/memory/watchers, sanitized policies, final tag/runbook proposal.
  - CODEX owns `docs/CODEX_ENVIRONMENT_v1.0.md`: Codex skills/plugins/connectors, direct monitoring runbook, git/remote/commit state, Node entrypoints, auth/secrets policy, fresh-clone checks.
  - Both review each other's documents before tagging or committing another snapshot.
- Next: Each agent writes only its claimed document, then cross-review.

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
