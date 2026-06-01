# UI Redesign Spec - Style A: Calm Dark Operator Console

Author: claude / 2026-06-01 / task=ui-redesign (User_000036)
Applies: taste-skill `design-taste-frontend` + `high-end-visual-design` principles,
adapted from "landing page" to "operational console" (vanilla HTML/CSS/JS, no build).
Owner of implementation: Codex (agent_chat/ui/styles.css + index.html + app.js).
This doc is the design contract + the anti-slop review checklist.

## Design read
"A 3-party AI-agent collaboration console for a technical operator, calm
dark operator-console language, native CSS tokens + restrained accent + mono
metadata + quiet motivated motion." Dials: DESIGN_VARIANCE 4, MOTION_INTENSITY 3,
VISUAL_DENSITY 5 (it is a working console, not an airy gallery, not a cockpit).

## Hard locks (from the skill; non-negotiable)
1. ONE theme: dark. No section inverts to light.
2. ONE radius scale: pill (999px) for circular/interactive chips+buttons, 12px for
   message/cards, 8px for inputs/selects. Documented rule, applied everywhere.
3. Accent discipline: the three participant colors are IDENTITY ONLY (avatar ring,
   sender name, 2px message left-border). Exactly ONE interaction accent for
   focus/links/primary action. No AI-purple, no random neon, no gradient slop.
4. Tinted shadows only (tinted to the dark bg). No pure-black drop shadows.
5. Mono is for metadata/IDs/timestamps ONLY, never body copy.
6. Motion must be motivated + honor prefers-reduced-motion. No infinite decorative loops.
7. Emoji allowed ONLY in runtime channel content (markers). NOT in committed CSS/HTML
   (encoding policy). No decorative unicode in code.

## Design tokens (CSS custom properties on :root)
Color (dark neutral base):
- --bg: #0e0f11            (app canvas)
- --surface: #16181c       (sidebar, message stage)
- --raised: #1c1f24        (cards, composer, inputs)
- --hairline: rgba(255,255,255,0.07)
- --border: #262a30
- --text-1: #e6e8ea        (primary)
- --text-2: #9aa1a9        (secondary)
- --text-3: #6b727a        (muted / timestamps)
Participant identity (from agent_chat/participants.json):
- --user: #8a8f98  (neutral grey)   --claude: #d97757   --codex: #10a37f
Interaction accent (the single locked accent):
- --accent: #5b7cfa        (calm periwinkle-blue)
- --accent-weak: rgba(91,124,250,0.16)
Status:
- --warn: #d9a441 (pause/priority)  --ok: #10a37f (complete)

Type:
- --font-sans: -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
- --font-mono: ui-monospace, "SF Mono", "Cascadia Code", "JetBrains Mono", Consolas, monospace
- scale: --t-xs 11px / --t-sm 12.5px / --t-base 14px / --t-md 15px / --t-lg 18px / --t-xl 22px
- line-height: body 1.55, headings 1.2; body max width ~68ch

Space (4-based): --s1 4 / --s2 8 / --s3 12 / --s4 16 / --s5 20 / --s6 24 / --s8 32 / --s10 40 (px)
Radius: --r-sm 8 / --r-md 12 / --r-pill 999 (px)
Elevation: --shadow-1: 0 1px 2px rgba(0,0,0,.3); --shadow-2: 0 10px 30px -16px rgba(0,0,0,.6)
Motion: --ease: cubic-bezier(.16,1,.3,1); --dur: 240ms

## Component specs
Shell: CSS grid, sidebar `clamp(240px,22vw,288px)` + chat 1fr, height 100dvh.
On <768px: sidebar collapses to a top bar (room + state pill); participants in a
drawer or hidden. Declare the mobile fallback explicitly.

Sidebar (--surface): room block (eyebrow "LLM Chat" mono uppercase tracking, h1
"Agent Chat", state pill), hairline divider, participants list, hairline, task panel.
Participant row: 28px avatar circle, 1.5px ring in that agent color, name in --text-1,
role in --text-3. Active/relevant agent gets a faint --accent-weak background.

State pill (--r-pill): mono --t-xs. States: "idle" (text-3), "user priority"
(--warn text + faint warn bg + slow 2s opacity pulse - motivated: live status),
"working" (accent). reduced-motion: no pulse.

Message row: grouped by sender (consecutive same-sender hides the avatar, keeps a
tight 4px gap; new sender gets 20px gap). Layout: 28px avatar column + content.
Sender line: name (agent color, 13px 600) + "-> to" (text-3) + mono timestamp (text-3,
right). Body: --t-base, --text-1, max ~68ch, whitespace-pre-wrap. Left identity:
2px left border in sender color on the content block (not a full colored bubble).
Surface: --raised at radius --r-md only for hover/focus emphasis; default is flat on
--surface with the left border doing the identity work (calm, low-chrome).
Per-type tint: keep subtle. Only special types get a chip: opinion/agreement/result
show a small mono type-label chip (text-3, hairline border). No loud colored bubbles.

Markers (runtime channel messages that contain the start/complete emoji): render as a
full-width centered "system strip", not a normal message. Start marker: slim pill,
--accent left rule, mono label, the rocket emoji inline (emoji comes from message text,
CSS adds no emoji). Final-complete marker: --ok tint, the check+party emoji inline,
slightly stronger. These make "discussion started" / "final complete" visually obvious
to the user (the whole point of User_000034).

Composer (--raised, radius --r-md, hairline top): row1 = fixed "From: User" + To select
+ Type select (radius --r-sm, dark, --t-sm). row2 = auto-grow textarea (radius --r-sm,
--bg inset, focus ring --accent) + Attach (ghost) + Send (primary). Send = filled pill,
bg --accent, text #0b0d10 (>=4.5:1), :active translateY(1px). Attach = ghost pill with
--border. Attachment list as small chips.

Pause banner: inline strip above messages, --warn text on faint warn bg, hairline, mono
label. Calm, not alarming red.

Jump-to-latest button: floating pill bottom-right of message stage, --raised + --border,
appears only when scrolled up (existing logic), fade in.

## Motion (motivated only)
- New message: opacity 0->1 + translateY 8px->0, --dur --ease. Only on append.
- Button hover: translateY(-1px); :active scale .98 / translateY(1px).
- State pill pulse: only "user priority" state.
- Global: `@media (prefers-reduced-motion: reduce)` disables all transitions/animations.

## Accessibility checklist (must pass)
- [ ] Body text contrast >= 4.5:1 (#e6e8ea on #0e0f11 passes ~16:1; text-3 #6b727a on
      --surface must stay >= 4.5:1 for any essential text; if used for non-essential
      meta only, >= 3:1 acceptable - verify).
- [ ] Send/primary button label contrast >= 4.5:1 against --accent.
- [ ] :focus-visible ring on every interactive (inputs, selects, buttons, jump btn).
- [ ] Select/placeholder/helper text all pass AA.
- [ ] Labels above inputs; no placeholder-as-label.
- [ ] prefers-reduced-motion honored.

## Anti-slop review checklist (Claude will review against this)
- [ ] One accent locked; participant colors used as identity only; no AI-purple/gradient slop.
- [ ] One radius scale applied consistently (pill / 12 / 8).
- [ ] Single dark theme; no light section sandwiched in.
- [ ] Shadows tinted, no pure black.
- [ ] Mono only on meta/IDs/timestamps, not body.
- [ ] Motion motivated; reduced-motion path present; no infinite decorative loops.
- [ ] No em-dash / decorative unicode / emoji in committed CSS or HTML (run check-encoding).
- [ ] Real content (the conversation + state) is the visual; no fake-screenshot filler.
- [ ] Markers visually distinct (start vs final-complete) so the user can spot completion at a glance.
- [ ] Mobile fallback declared for the sidebar and composer.

## Revision 2 (User_000036 feedback): soft light palette + 3 fixes

User feedback: (1) sidebar U/C/X initials not centered in the circle, (2) start/
complete marker messages get pushed right like user messages - markers must be a
centered system strip, not a user message, (3) the dark tone strains the eyes;
wants an easier overall color, but NOT pure white.

Decision: pivot Style A from dark to a SOFT LIGHT neutral console (same layout,
same locks, same component specs - only the palette + the 3 fixes change).
Note: avoid the taste-skill "warm cream cliche" hexes (#f5f1ea / #f7f5f1 /
#faf7f1 family). Use a muted warm-gray "soft paper" instead, lower glare than
pure white, with AA-safe text and deepened participant/accent colors for light.

### Revised tokens (light), replace the dark :root values
- --bg: #ecebe6        (muted warm-gray, low glare; not pure white, not cream)
- --surface: #f4f3ef   (sidebar, message stage)
- --raised: #faf9f6    (cards, composer, inputs; not pure #fff)
- --hairline: rgba(30, 28, 24, 0.08)
- --border: #dddbd3
- --text-1: #232730    (soft near-black, not #000)
- --text-2: #555b63    (secondary, AA on surface)
- --text-3: #7e848c    (meta only; non-essential, >= 3:1)
- --user: #5f6670   --claude: #b8512f   --codex: #0e7c63   (deepened for AA text on light)
- --accent: #3f5fe0     (deepened so a white button label passes AA ~4.6:1)
- --accent-weak: rgba(63, 95, 224, 0.12)
- --warn: #a6791f       --warn-weak: rgba(166,121,31,0.14)
- --ok: #0e7c63         --ok-weak: rgba(14,124,99,0.13)
- --shadow-1: 0 1px 2px rgba(40, 36, 30, 0.08)
- --shadow-2: 0 18px 40px -24px rgba(40, 36, 30, 0.22)
Everything else (fonts, radius scale, spacing, motion, ease/dur) is unchanged.
Theme stays single-locked (now light); no section inverts to dark.

### Fix 1 - avatar centering
Sidebar `.avatar` and `.message-avatar`: `display:flex; align-items:center;
justify-content:center; line-height:1; text-align:center;` so the single
initial sits dead-center. Verify at 28px size.

### Fix 2 - marker is a centered system strip (not a user message)
A marker (matched by markerKind: has User_NNNNNN_YYYYYYYYYY + start/complete
emoji) must render full-width centered REGARDLESS of `from`/`to`. The `.marker`
rule must WIN over `.message.user` alignment (raise specificity or reset:
`.message.marker { align-self:center; margin-inline:auto; }` and inside the
marker, neutralize the user right-align: `.message.marker .bubble{ margin-left:0;
margin-right:0; text-align:left; }`). Hide the avatar for markers (already done).
Start marker: accent left rule. Complete marker: --ok tint. Confirm alignment is
driven ONLY by the marker class, not by sender.

### Fix 3 - palette is the Revised tokens above (a11y must re-pass)
Re-run the a11y checklist on light: text-1/2 on bg+surface >= 4.5:1; --user/
--claude/--codex as sender-name text >= 4.5:1 (deepened values above satisfy
this); white Send label on --accent #3f5fe0 >= 4.5:1; focus rings visible on
light. Keep prefers-reduced-motion.

### Review note
Mobile stays out of scope this round (desktop screenshot basis). After Codex
implements, Claude re-reviews palette + a11y + the 2 alignment fixes, then commit.

## Revision 3 (User_000040 feedback): boxed messages, opaque backgrounds

User feedback: (1) make the marker a rectangular box like other messages (drop
the centered floating-pill treatment), (2) message backgrounds must NOT be
transparent - give every message a solid surface.

### Fix A - every message bubble is a solid contained card
`.bubble`: background `var(--raised)` (#faf9f6, opaque), `border: 1px solid
var(--border)`, `border-radius: var(--r-md)`, `box-shadow: var(--shadow-1)`,
padding ~12px 14px. No `background: transparent` on the bubble. Identity stays a
2px left border in the sender color (claude/codex/user) on the card. Hover may
deepen slightly, but the resting state is already an opaque card.
- User message: same opaque card, right-aligned (keep), optional faint
  `--accent-weak` tint to read as "own", still opaque.

### Fix B - marker is a boxed message, not a centered pill
Remove the centered system-strip treatment (`align-self:center`,
`margin-inline:auto`, translucent pill). Markers now use the SAME boxed card as
a normal message (left-aligned, opaque --raised, --r-md). Keep them recognizable
WITHOUT the pill: stronger left border - start marker = 3px `--accent` left
border, complete marker = 3px `--ok` left border - plus the inline emoji from the
message text. Avatar may show like a normal message (or stay hidden - Codex's
call), but layout = rectangular box like the others.

Locks unchanged (single light theme, one radius scale, mono meta only, AA,
reduced-motion). a11y: opaque card bg must keep text contrast AA.
Codex implements styles.css (app.js likely unchanged); Claude reviews + commits.

## Revision 4 (User_000041 feedback): marker shows sender, readable line breaks

User feedback: (1) a marker should show WHO sent it, exactly like a normal
message - the only difference is the emoji + the [ ... ] text. Stop hiding the
sender on markers. (2) messages are hard to read; paragraphs/line breaks are not
applied well - Codex messages especially show literal "\n" instead of breaks.

### Fix A - marker renders like a normal message (sender shown)
Remove the marker special-casing that hides avatar/name/meta
(`.marker .message-avatar, .meta, .message-time { display:none }` -> delete).
A marker now renders identically to a normal message (avatar + sender name +
to + type + timestamp + boxed bubble). The ONLY marker difference is the emoji
and the [User_...] text in the body. A subtle left-border tint
(start=accent, complete=ok) MAY stay as a light touch, but the sender meta
MUST be visible. Drop any centered/strip layout entirely.

### Fix B - render line breaks robustly (the readability + Codex "\n" bug)
`.text` already has white-space: pre-wrap (real newlines render). The bug is
messages that carry a literal backslash-n ("\n" as two characters) instead of a
real newline - these show up as visible "\n". Fix in app.js render
(linkifyText or a step after escapeHtml): convert literal "\n" and "\r\n"
sequences in the message text into real line breaks (e.g. replace the 2-char
"\n" with an actual newline, or with <br> after escaping). Net effect: whether a
sender emits a real newline OR an escaped "\n", the UI shows proper paragraph
breaks. Keep escaping order safe (escape HTML first, then insert <br>).

### Behavior note (both agents, not just UI)
Write readable messages: short paragraphs, real line breaks between points, no
wall-of-text run-ons. Prefer sending real newlines; do not emit literal "\n".
(Claude will format its own channel messages with real line breaks going
forward; Codex should ensure its send path emits real newlines too.)

Locks unchanged. Codex implements styles.css + app.js render; Claude reviews + commits.

## Out of scope (keep)
- app.js message schema, send/read/pause logic, jump-to-latest behavior: preserve.
- participants.json stays the color source of truth; UI reads names/colors conceptually
  from it (hardcoded CSS vars must match participants.json values listed above).
