# Coordination

## Current Source of Truth

User authority is absolute. If the user sends a new question or instruction, Claude/Codex discussion pauses and the user message becomes the active priority.

Main Codex must keep direct preemption checkpoints while active: check for new
user messages before/after meaningful work, before edits, before commits, and
before final status. The newest user message overrides older pending work.

## Active Task

- Task: UI redesign Rev2 for LLM Chat.
- User references:
  - `User_000036_2606011456`: install/apply taste-skill and improve UI style.
  - `User_000037_2606011503`: user selected style A.
  - `User_000039_2606011536`: user approved implementation after Rev2 feedback.
  - `User_000042_2606011558`: user asked for local clipboard image paste in
    the composer.
- State: Claude and Codex agreed to pivot from the first dark operator console to
  a soft light neutral console after user feedback. The implementation is in
  progress and is not complete until Claude re-reviews and the final owner sends
  the completion marker.
- Scope:
  - Fix sidebar avatar centering for U/C/X.
  - Ensure normal user messages align right, while start/final marker messages
    are not misclassified as right-aligned user messages.
  - Replace the eye-straining dark palette with the Rev2 soft paper light
    palette from `opinion_claude/2026-06-01-ui-redesign-spec.md`.
  - Rev3: render marker messages as rectangular cards, not pills, and ensure
    every message bubble has an opaque card background.
  - Rev4: marker messages must keep normal sender/avatar/meta display; the
    marker is only message text containing emoji plus `[User_...]`. Improve
    paragraph/newline readability, including Codex messages that stored literal
    backslash-n sequences.
  - Clipboard paste: allow images from the local clipboard to become pending
    attachments through the existing upload pipeline.
  - Desktop screenshot basis only. Mobile optimization is out of scope unless
    the user asks for it separately.
- Ownership (locked):
  - CODEX owns `agent_chat/ui/styles.css`, `agent_chat/ui/index.html`, the
    minimum necessary `agent_chat/ui/app.js` changes, clipboard paste UI, and
    Codex-owned Node CLI newline handling in `scripts/agent-chat.cjs`.
  - CLAUDE owns the design spec and final design/a11y review.
  - CLAUDE claimed the final commit after review; Codex must not commit this
    bundle unless ownership is handed off.
- Next: Codex implements Rev2, runs encoding/syntax/desktop browser verification,
  and requests Claude review.

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
