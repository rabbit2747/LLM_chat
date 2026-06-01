#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const chatDir = path.join(root, 'agent_chat');
const messagesPath = path.join(chatDir, 'messages.jsonl');
const tasksPath = path.join(chatDir, 'tasks.json');
const statePath = path.join(chatDir, 'state.json');

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith('--')) {
      args._.push(item);
      continue;
    }
    const key = item.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function ensureStore() {
  fs.mkdirSync(chatDir, { recursive: true });
  if (!fs.existsSync(messagesPath)) fs.writeFileSync(messagesPath, '', 'utf8');
  if (!fs.existsSync(tasksPath)) fs.writeFileSync(tasksPath, '[]\n', 'utf8');
  if (!fs.existsSync(statePath)) {
    writeJson(statePath, {
      pause_agent_pingpong: false,
      active_priority: 'none',
      active_task_id: '',
      updated_at: '',
    });
  }
}

function readJson(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    return raw.trim() ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readMessages() {
  ensureStore();
  return fs.readFileSync(messagesPath, 'utf8')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

function appendMessage(message) {
  fs.appendFileSync(messagesPath, `${JSON.stringify(message)}\n`, 'utf8');
}

function stateFor(agent) {
  return path.join(chatDir, `state_${agent.toLowerCase()}.json`);
}

function isAfterCursor(message, readState) {
  if (!readState.last_read_at) return true;
  const messageTime = Date.parse(message.created_at);
  const cursorTime = Date.parse(readState.last_read_at);
  return Number.isNaN(messageTime) || Number.isNaN(cursorTime) || messageTime > cursorTime;
}

function show(message) {
  const target = message.to || 'all';
  const task = message.task_id || '-';
  console.log(`[${message.created_at}] ${message.from} -> ${target} :: ${message.type} :: task=${task}`);
  console.log(message.text || '');
  if (Array.isArray(message.attachments) && message.attachments.length) {
    console.log(`attachments=${message.attachments.length}`);
  }
  console.log('');
}

function updateSharedState(message) {
  const state = readJson(statePath, {});
  state.updated_at = message.created_at;
  if (message.from === 'user') {
    state.pause_agent_pingpong = true;
    state.active_priority = 'user';
    state.active_task_id = message.task_id;
  } else if (message.type === 'decision_needed') {
    state.pause_agent_pingpong = true;
    state.active_priority = 'decision_needed';
    state.active_task_id = message.task_id;
  }
  writeJson(statePath, state);
}

function commandSend(args) {
  const from = String(args.from || '').toLowerCase();
  const to = String(args.to || 'all').toLowerCase();
  const type = String(args.type || 'status').toLowerCase();
  const text = String(args.text || '');
  if (!from) throw new Error('send requires --from');
  if (!text) throw new Error('send requires --text');
  const state = readJson(statePath, {});
  if (from !== 'user' && state.pause_agent_pingpong === true && !args.force) {
    throw new Error(`Agent ping-pong is paused by ${state.active_priority}. Use resume first, or pass --force.`);
  }
  const now = new Date().toISOString();
  const taskId = args.task || args.taskId || state.active_task_id || `task-${now.replace(/[-:.TZ]/g, '').slice(0, 14)}`;
  const message = {
    id: crypto.randomUUID(),
    from,
    to,
    type,
    text,
    task_id: taskId,
    created_at: now,
    read_by: [from],
  };
  appendMessage(message);
  updateSharedState(message);
  show(message);
}

function relevantFor(message, agent) {
  return message.from !== agent && (message.to === 'all' || message.to === agent || message.from === 'user');
}

function commandUnread(args) {
  const agent = String(args.for || '').toLowerCase();
  if (!agent) throw new Error('unread requires --for');
  const readState = readJson(stateFor(agent), { last_read_id: '', last_read_at: '', updated_at: '' });
  const unread = readMessages().filter((message) => relevantFor(message, agent) && isAfterCursor(message, readState));
  if (!unread.length) {
    console.log(`No unread messages for ${agent}.`);
    return;
  }
  unread.forEach(show);
}

function commandRead(args) {
  const agent = String(args.for || '').toLowerCase();
  if (!agent) throw new Error('read requires --for');
  const readState = readJson(stateFor(agent), { last_read_id: '', last_read_at: '', updated_at: '' });
  const unread = readMessages().filter((message) => relevantFor(message, agent) && isAfterCursor(message, readState));
  const last = unread[unread.length - 1];
  if (last) {
    writeJson(stateFor(agent), {
      last_read_id: last.id,
      last_read_at: last.created_at,
      updated_at: new Date().toISOString(),
    });
  }
  console.log(`Marked ${unread.length} message(s) as read for ${agent}.`);
}

function commandList(args) {
  let messages = readMessages();
  if (!args.all) {
    const limit = Number(args.limit || 20);
    messages = messages.slice(-limit);
  }
  messages.forEach(show);
}

function commandResume(args) {
  const from = String(args.from || '').toLowerCase();
  if (from !== 'user') throw new Error('Only user can resume agent ping-pong.');
  const state = readJson(statePath, {});
  state.pause_agent_pingpong = false;
  state.active_priority = 'none';
  state.updated_at = new Date().toISOString();
  writeJson(statePath, state);
  console.log(`Agent ping-pong resumed by ${from}.`);
}

function commandSetTask(args) {
  const taskId = args.task || args.taskId;
  const taskState = args.state;
  if (!taskId) throw new Error('set-task requires --task');
  if (!taskState) throw new Error('set-task requires --state');
  const tasks = readJson(tasksPath, []);
  const existing = tasks.find((task) => task.id === taskId);
  const now = new Date().toISOString();
  if (existing) {
    if (args.title) existing.title = args.title;
    existing.state = taskState;
    existing.updated_at = now;
  } else {
    tasks.push({ id: taskId, title: args.title || taskId, state: taskState, updated_at: now });
  }
  writeJson(tasksPath, tasks);
  console.log(`Task ${taskId} set to ${taskState}.`);
}

function help() {
  console.log(`Agent Chat CLI (Node)

Commands:
  send --from <user|agent> [--to all] [--type status] --text <text> [--task id] [--force]
  unread --for <participant>
  read --for <participant>
  list [--limit 20] [--all]
  state
  resume --from user
  set-task --task <id> --state <state> [--title text]
  tasks`);
}

function main() {
  ensureStore();
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || 'help';
  if (command === 'help') return help();
  if (command === 'send') return commandSend(args);
  if (command === 'unread') return commandUnread(args);
  if (command === 'read') return commandRead(args);
  if (command === 'list') return commandList(args);
  if (command === 'state') return process.stdout.write(fs.readFileSync(statePath, 'utf8'));
  if (command === 'resume') return commandResume(args);
  if (command === 'set-task') return commandSetTask(args);
  if (command === 'tasks') return process.stdout.write(`${JSON.stringify(readJson(tasksPath, []), null, 2)}\n`);
  throw new Error(`Unknown command: ${command}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
