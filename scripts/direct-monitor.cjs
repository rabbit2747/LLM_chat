#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const chatDir = path.join(root, 'agent_chat');
const messagesPath = path.join(chatDir, 'messages.jsonl');
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

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    return raw.trim() ? JSON.parse(raw) : fallback;
  } catch (error) {
    if (error.code === 'EBUSY' || error.code === 'EPERM') return null;
    throw error;
  }
}

function parseMessages(lines) {
  const messages = [];
  for (const line of lines.filter((item) => item.trim())) {
    try {
      messages.push(JSON.parse(line));
    } catch {
      continue;
    }
  }
  return messages;
}

function relevant(message) {
  return message.from !== me && (message.from === 'user' || message.to === me || message.to === 'all');
}

function messageAfterCursor(message, cursor, allMessages) {
  if (cursor.last_read_id) {
    const cursorIndex = allMessages.findIndex((item) => item.id === cursor.last_read_id);
    const messageIndex = allMessages.findIndex((item) => item.id === message.id);
    if (cursorIndex >= 0 && messageIndex >= 0) return messageIndex > cursorIndex;
  }
  if (!cursor.last_read_at) return true;
  const messageTime = Date.parse(message.created_at);
  const cursorTime = Date.parse(cursor.last_read_at);
  return Number.isNaN(messageTime) || Number.isNaN(cursorTime) || messageTime > cursorTime;
}

function printMessage(message) {
  console.log(JSON.stringify({
    id: message.id,
    from: message.from,
    to: message.to,
    type: message.type,
    task_id: message.task_id,
    created_at: message.created_at,
    text: message.text,
  }));
}

let initialLines = readLines();
while (initialLines === null) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
  initialLines = readLines();
}
let initialCursor = readJson(path.join(chatDir, `state_${me}.json`), { last_read_id: '', last_read_at: '' });
while (initialCursor === null) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
  initialCursor = readJson(path.join(chatDir, `state_${me}.json`), { last_read_id: '', last_read_at: '' });
}

const initialMessages = parseMessages(initialLines);
const unreadBacklog = initialMessages.filter((message) => relevant(message) && messageAfterCursor(message, initialCursor, initialMessages));
if (unreadBacklog.length) {
  const userBacklog = unreadBacklog.filter((message) => message.from === 'user');
  printMessage(userBacklog.length ? userBacklog[userBacklog.length - 1] : unreadBacklog[0]);
  process.exit(0);
}

let baseline = initialMessages.length;
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
  const messages = parseMessages(rawLines);
  if (messages.length <= baseline) return;
  const newMessages = messages.slice(baseline);
  baseline = messages.length;
  for (const message of newMessages) {
    if (relevant(message)) {
      clearInterval(timer);
      printMessage(message);
      return;
    }
  }
}, intervalMs);
