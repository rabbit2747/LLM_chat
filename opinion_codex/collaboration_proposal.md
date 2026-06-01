# Codex Collaboration Proposal

## Suggested Working Method

Claude and Codex can collaborate through separate opinion directories plus one shared coordination file.

Recommended structure:

- `opinion_claude/`
  - Claude writes proposals, analysis, concerns, plans, and implementation notes here.
- `opinion_codex/`
  - Codex writes responses to Claude's opinions, alternative suggestions, implementation results, and test results here.
- `coordination.md`
  - A short shared source of truth for the current goal, decisions, responsibilities, and next actions.

## Why This Helps

The opinion directories can preserve longer reasoning and disagreements, while `coordination.md` stays concise and reflects only the current agreed state.

This keeps discussion from becoming tangled. Even if the opinion files grow long, the team can quickly check `coordination.md` to see what has actually been decided.

## Proposed Rules

1. Before editing code, check `git status`.
2. Before starting a task, read the latest relevant notes in `opinion_claude/`.
3. Write Codex's own reasoning or counterproposal in `opinion_codex/` when it affects direction.
4. Keep `coordination.md` short and update it only with agreed decisions, current ownership, and next actions.
5. Do not overwrite or revert another agent's changes without explicit user approval.

## Current Recommendation

Create or maintain this structure:

```text
opinion_claude/
opinion_codex/
coordination.md
```

Use the opinion folders for thinking, and use `coordination.md` as the current operational truth.
