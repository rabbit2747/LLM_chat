#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const messagesPath = path.join(root, 'agent_chat', 'messages.jsonl');
const me = process.argv[2] || 'codex';
const intervalMs = Number(process.env.AGENT_CHAT_MONITOR_MS || 3000);
const timeoutMs = Number(process.env.AGENT_CHAT_MONITOR_TIMEOUT_MS || 10 * 60 * 1000);

function readLines() {
  try {
    if (!fs.existsSync(messagesPath)) return [];
    return fs.readFileSync(messagesPath, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/);
  } catch (error) {
    if (error.code === 'EBUSY' || error.code === 'EPERM') {
      return null;
    }
    throw error;
  }
}

let initialLines = readLines();
while (initialLines === null) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
  initialLines = readLines();
}
let baseline = initialLines.filter((line) => line.trim()).length;
const deadline = Date.now() + timeoutMs;
console.log(`DIRECT_MONITOR_READY me=${me} baseline_lines=${baseline}`);

const timer = setInterval(() => {
  if (Date.now() > deadline) {
    clearInterval(timer);
    console.log('DIRECT_MONITOR_TIMEOUT_NO_NEW_MESSAGE');
    return;
  }
  const rawLines = readLines();
  if (rawLines === null) return;
  const lines = rawLines.filter((line) => line.trim());
  if (lines.length <= baseline) return;
  const newLines = lines.slice(baseline);
  baseline = lines.length;
  for (const line of newLines) {
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      continue;
    }
    const relevant = message.from === 'user' || message.to === me || message.to === 'all';
    if (message.from !== me && relevant) {
      clearInterval(timer);
      console.log(JSON.stringify({
        id: message.id,
        from: message.from,
        to: message.to,
        type: message.type,
        task_id: message.task_id,
        created_at: message.created_at,
        text: message.text,
      }));
      return;
    }
  }
}, intervalMs);
