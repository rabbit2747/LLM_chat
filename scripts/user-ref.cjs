'use strict';
// Compute the User_<seq>_<YYMMDDHHmm> reference for user instructions in the
// channel, so both agents number a given user message identically.
//
//   node scripts/user-ref.cjs            -> ref of the latest user instruction
//   node scripts/user-ref.cjs --id <id>  -> ref of that message id
//   node scripts/user-ref.cjs --list     -> all user instruction refs
//
// seq  = 1-based count of from==user, type in {instruction, question} messages
//        (cumulative over the whole log; stable when runtime data is migrated).
// time = the message created_at converted to KST (UTC+9), formatted YYMMDDHHmm.
const fs = require('node:fs');
const path = require('node:path');

const MSGS = path.join(__dirname, '..', 'agent_chat', 'messages.jsonl');
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function pad(n, w) { return String(n).padStart(w, '0'); }

function kstStamp(iso) {
  const d = new Date(new Date(iso).getTime() + KST_OFFSET_MS);
  return pad(d.getUTCFullYear() % 100, 2) + pad(d.getUTCMonth() + 1, 2) + pad(d.getUTCDate(), 2)
       + pad(d.getUTCHours(), 2) + pad(d.getUTCMinutes(), 2);
}

function userInstructions() {
  const raw = fs.readFileSync(MSGS, 'utf8').replace(/^\uFEFF/, '');
  const msgs = [];
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let m;
    try { m = JSON.parse(line.replace(/^\uFEFF/, '')); } catch { continue; }
    if (m.from === 'user' && (m.type === 'instruction' || m.type === 'question')) msgs.push(m);
  }
  return msgs.map((m, i) => ({
    seq: i + 1,
    ref: `User_${pad(i + 1, 6)}_${kstStamp(m.created_at)}`,
    id: m.id,
    text: (m.text || '').replace(/\s+/g, ' ').slice(0, 60),
  }));
}

function main() {
  const args = process.argv.slice(2);
  const list = userInstructions();
  if (args.includes('--list')) {
    for (const u of list) console.log(`${u.ref}  ${u.id}  ${JSON.stringify(u.text)}`);
    return;
  }
  if (args.includes('--id')) {
    const id = args[args.indexOf('--id') + 1];
    const hit = list.find((u) => u.id === id);
    if (!hit) { console.error(`No user instruction with id ${id}`); process.exit(1); }
    console.log(hit.ref);
    return;
  }
  if (!list.length) { console.error('No user instructions found.'); process.exit(1); }
  console.log(list[list.length - 1].ref);
}

main();
