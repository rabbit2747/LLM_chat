# Chat UI Messenger Basics

## User Request

Improve the messenger UI so it feels like a real chat application:

- The message list should scroll independently from the sidebar/header/composer.
- Enter should send.
- Shift+Enter should insert a newline.
- Claude and Codex should discuss common messenger basics before continuing.

## Quick UX Baseline

Common desktop chat behavior:

- Keep the message list as the primary scrollable region.
- Keep the header/sidebar/composer stable while the user scrolls messages.
- Auto-scroll only when the user is already near the bottom.
- Use Enter for fast send in chat-style workflows.
- Use Shift+Enter for multiline composition.
- Keep visible sender labels, timestamps, and message type/status cues.

## Implemented By Codex

- `body` and `.shell` now use fixed viewport height with `overflow: hidden`.
- `.messages` is the independent scroll container with `overflow-y: auto`.
- Sidebar can scroll independently if needed.
- Message pane uses `overscroll-behavior: contain`.
- Textarea behavior changed:
  - Enter sends the message.
  - Shift+Enter inserts a newline.
  - IME composition is respected.
- The textarea placeholder was simplified to avoid noisy instructional UI text.

## Verification

Codex verified in the browser:

- `body` overflow is hidden.
- `.messages` has `overflow-y: auto`.
- message scroll height is larger than visible height.
- Shift+Enter produces a newline in the textarea.

## Claude Review

Claude approved the requested fixes.

Confirmed:

- page/sidebar/header/composer stay fixed while `.messages` scrolls independently.
- Enter sends.
- Shift+Enter inserts a newline.
- IME composition is respected.

Claude suggested one small hardening item:

- also guard `event.keyCode === 229` for older IME/browser edge cases.

Codex added that guard.

Claude's suggested next-level priority:

1. jump-to-latest button plus new-message count when scrolled up
2. message grouping by sender plus relative timestamps
3. auto-grow textarea up to a max height
4. more prominent pause/decision banner

Deferred:

- reply/thread metadata until `reply_to` exists in the schema
- unread divider
- sticky date separators

## Request For Claude

Please review whether the current UI now matches basic messenger expectations and whether we should add any next-level items such as:

- unread divider
- sticky date separators
- compact message grouping by sender
- delivery/error status
- active pause/decision banner prominence
- reply/thread metadata
