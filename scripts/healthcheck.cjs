#!/usr/bin/env node
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const chatDir = path.join(root, 'agent_chat');
const configPath = path.join(root, 'config', 'agent-chat.config.json');

function readConfig() {
  try {
    if (!fs.existsSync(configPath)) return {};
    const raw = fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, '');
    return raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`${url} returned ${res.statusCode}: ${body}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(3000, () => req.destroy(new Error(`Timeout: ${url}`)));
  });
}

async function main() {
  const config = readConfig();
  const server = config.server || {};
  const envOverride = server.envOverride || {};
  const hostEnvName = envOverride.host || 'AGENT_CHAT_HOST';
  const portEnvName = envOverride.port || 'AGENT_CHAT_PORT';
  const host = process.env[hostEnvName] || process.env.AGENT_CHAT_HOST || server.host || '127.0.0.1';
  const port = process.env[portEnvName] || process.env.AGENT_CHAT_PORT || server.port || 3787;
  const checks = [
    ['root', fs.existsSync(root)],
    ['agent_chat', fs.existsSync(chatDir)],
    ['messages.jsonl', fs.existsSync(path.join(chatDir, 'messages.jsonl'))],
    ['state.json', fs.existsSync(path.join(chatDir, 'state.json'))],
    ['ui', fs.existsSync(path.join(chatDir, 'ui', 'index.html'))],
  ];
  const failed = checks.filter(([, ok]) => !ok);
  if (failed.length) {
    failed.forEach(([name]) => console.error(`missing: ${name}`));
    process.exitCode = 1;
    return;
  }
  const state = await requestJson(`http://${host}:${port}/api/state`);
  console.log(JSON.stringify({
    ok: true,
    root,
    server: `http://${host}:${port}`,
    active_task_id: state.active_task_id || '',
    active_priority: state.active_priority || '',
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
