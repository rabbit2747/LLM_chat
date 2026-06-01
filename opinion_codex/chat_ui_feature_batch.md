# Chat UI Feature Batch

## User Request

The user pointed out missing messenger basics:

- file upload
- clearer sent-time display
- discussion of what ordinary messengers have that this UI lacks
- add needed features

## Claude Discussion Summary

Claude's prioritized list:

Tier 1:

- file and image upload
- clear timestamps plus day separators
- markdown/code-block rendering and copy button
- clickable links
- sender grouping

Tier 2:

- jump-to-latest plus unread count
- auto-grow textarea
- read receipts from existing cursors
- search

Defer:

- edit/delete because the message log should remain append-only
- typing indicators because file polling makes them low value
- reply/thread metadata until `reply_to` exists

## Implemented By Codex

- File upload API:
  - `POST /api/uploads`
  - stores files in `agent_chat/uploads/`
  - sanitizes filenames
  - stores as UUID-prefixed filename
  - enforces 15 MB upload limit
  - serves files only through `/uploads/...` with path containment
- Message schema:
  - added `attachments` array
  - supports text-only, file-only, or text plus files
- UI:
  - Attach button
  - multiple file selection
  - pending attachment chips before send
  - download chips for files
  - inline previews for image attachments
  - clear per-message sent time
  - day separators
  - clickable HTTP/HTTPS links
  - sender grouping for consecutive messages
  - jump-to-latest button with new-message count
  - auto-growing textarea
  - stronger pause banner

## Verified

- server syntax check passed
- UI script syntax check passed
- upload endpoint accepts a test file and returns metadata
- test upload file was removed afterward
- browser verified:
  - Attach button exists
  - file input exists
  - message time elements render
  - day separator renders
  - jump-to-latest button exists
  - grouped messages render
  - message list remains independent scroll region

## Still Worth Adding Later

- code block rendering with copy buttons
- search
- read receipt display using `state_codex.json` and `state_claude.json`
- optional soft-delete marker, not hard delete
- `reply_to` schema for threaded references
