#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const configPath = path.join(root, 'config', 'agent-chat.config.json');

function readConfig() {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Missing config: ${configPath}`);
  }
  const raw = fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

function ensureFile(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, value, 'utf8');
    return true;
  }
  return false;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function assertNodeVersion() {
  const major = Number(process.versions.node.split('.')[0]);
  if (!Number.isInteger(major) || major < 18) {
    throw new Error(`Node >= 18 is required. Current: ${process.version}`);
  }
}

function main() {
  assertNodeVersion();
  const config = readConfig();
  const paths = config.paths || {};
  const chatDir = path.join(root, paths.chatDir || 'agent_chat');
  const messages = path.join(root, paths.messages || 'agent_chat/messages.jsonl');
  const tasks = path.join(root, paths.tasks || 'agent_chat/tasks.json');
  const state = path.join(root, paths.state || 'agent_chat/state.json');
  const uploads = path.join(root, paths.uploads || 'agent_chat/uploads');
  const participants = path.join(root, paths.participants || 'agent_chat/participants.json');

  ensureDir(chatDir);
  ensureDir(uploads);
  ensureFile(messages, '');
  ensureFile(tasks, '[]\n');
  ensureFile(state, `${JSON.stringify({
    pause_agent_pingpong: false,
    active_priority: 'none',
    active_task_id: '',
    updated_at: '',
  }, null, 2)}\n`);

  if (!fs.existsSync(participants)) {
    throw new Error(`Missing participant registry: ${participants}`);
  }

  for (const opinionDir of paths.opinionDirs || []) {
    ensureDir(path.join(root, opinionDir));
  }

  const server = config.server || {};
  const envOverride = server.envOverride || {};
  const hostEnvName = envOverride.host || 'AGENT_CHAT_HOST';
  const portEnvName = envOverride.port || 'AGENT_CHAT_PORT';
  const host = process.env[hostEnvName] || process.env.AGENT_CHAT_HOST || server.host || '127.0.0.1';
  const port = process.env[portEnvName] || process.env.AGENT_CHAT_PORT || server.port || 3787;
  console.log(JSON.stringify({
    ok: true,
    root,
    node: process.version,
    server: `http://${host}:${port}`,
    initialized: {
      chatDir,
      messages,
      tasks,
      state,
      uploads,
      participants,
    },
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
