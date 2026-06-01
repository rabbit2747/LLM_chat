# User-Supervised Agent Chat Protocol

## Core Principle

The user is the highest-priority authority.

Claude and Codex may discuss, disagree, refine, and coordinate with each other, but any user message immediately overrides the current agent-to-agent flow.

If the user enters a question or instruction while Claude and Codex are discussing, the agents must pause the ping-pong and handle the user message first.

## Priority Order

1. User instruction
2. User question
3. User decision request
4. Agreed coordination state
5. Agent-to-agent discussion
6. Individual agent opinion

No agent message can override a user instruction.

## Query Flow

When the user asks a question:

1. User asks a question.
2. Claude and Codex each send their own opinion through the messenger.
3. Each agent reads the other's opinion.
4. Agents respond with agreement, disagreement, feedback, or correction.
5. If consensus is needed, agents continue ping-pong discussion.
6. If a user decision is required, ping-pong stops.
7. If the user sends a new question or instruction during ping-pong, all agent discussion pauses immediately.
8. The user message becomes the active task.

## Instruction Flow

When the user gives an instruction:

1. User gives an instruction.
2. Claude and Codex discuss what each side is best suited to handle.
3. The agent best suited for design prepares the design.
4. The other agent gives detailed feedback.
5. The design-feedback loop continues until the plan is strong enough or a user decision is needed.
6. Work begins only after the design and ownership are clear.
7. During execution, agents report status and raise blockers.

## Messenger Requirements

The chat system should support:

- Human-visible message history.
- User messages in the same timeline as agent messages.
- Clear sender labels: `user`, `claude`, `codex`, `system`.
- Message types: `question`, `instruction`, `opinion`, `feedback`, `agreement`, `disagreement`, `decision_needed`, `status`, `result`.
- Thread or task IDs so each discussion stays tied to a specific user request.
- Read/unread state per participant.
- A hard pause flag when user intervention occurs.

## User Override Rule

If a message from `user` appears:

```text
pause_agent_pingpong=true
active_priority=user
```

Agents must stop debating the previous topic until the user message is handled.

If the user message changes the task, the previous task should be marked as:

```text
paused_by_user
```

or:

```text
superseded_by_user
```

## Decision Needed Rule

Agents should stop ping-pong and ask the user when:

1. The decision affects project direction.
2. There are two or more viable designs with meaningful tradeoffs.
3. A change may remove, rewrite, or invalidate existing work.
4. The agents disagree after a reasonable number of turns.
5. Security, privacy, deployment, or data-loss risk is involved.
6. The user's preference is the only real deciding factor.

## Suggested Turn Limits

To avoid endless agent discussion:

- Normal query discussion: 2 rounds each agent.
- Design discussion: 3 rounds each agent.
- More than that requires either a user decision or a written reason to continue.

## Task States

Each user request should have one state:

```text
new
agent_discussion
decision_needed
designing
ready_to_execute
executing
blocked
completed
paused_by_user
superseded_by_user
```

## Additional Recommendation

Keep three layers:

1. Messenger
   - Fast agent-to-agent and user-visible conversation.
2. Opinion directories
   - Longer reasoning, design notes, and review documents.
3. `coordination.md`
   - Short current source of truth: active task, owner, state, decisions, next action.

The messenger should not replace `coordination.md`. It should feed into it.

## Minimal First Build

Start with a local CLI messenger using:

```text
agent_chat/messages.jsonl
agent_chat/tasks.json
agent_chat/state.json
scripts/agent-chat.ps1
```

The first version should make it easy to:

- Send a message.
- Read unread messages.
- Mark messages as read.
- Create or update a task state.
- Set `pause_agent_pingpong=true` when the user sends a message.
- List active tasks waiting for user decision.

## Codex Opinion

This protocol is better than a simple watcher because it models the actual collaboration flow.

The most important design point is not "agents can talk." It is "agents can talk, but the user can interrupt and override them at any time."

That should be the foundation of the messenger.
