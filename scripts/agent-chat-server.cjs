const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const chatDir = path.join(root, 'agent_chat');
const uiDir = path.join(chatDir, 'ui');
const uploadsDir = path.join(chatDir, 'uploads');
const messagesPath = path.join(chatDir, 'messages.jsonl');
const tasksPath = path.join(chatDir, 'tasks.json');
const statePath = path.join(chatDir, 'state.json');
const configPath = path.join(root, 'config', 'agent-chat.config.json');

function readOptionalConfig() {
  try {
    if (!fs.existsSync(configPath)) return {};
    const raw = fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, '');
    return raw.trim() ? JSON.parse(raw) : {};
  } catch (error) {
    console.warn(`Ignoring invalid config at ${configPath}: ${error.message}`);
    return {};
  }
}

const config = readOptionalConfig();
const serverConfig = config.server || {};
const envOverride = serverConfig.envOverride || {};
const hostEnvName = envOverride.host || 'AGENT_CHAT_HOST';
const portEnvName = envOverride.port || 'AGENT_CHAT_PORT';
const host = String(process.env[hostEnvName] || process.env.AGENT_CHAT_HOST || serverConfig.host || '127.0.0.1');
const port = Number(process.env[portEnvName] || process.env.AGENT_CHAT_PORT || process.argv[2] || serverConfig.port || 3787);

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error(`Invalid AGENT_CHAT_PORT: ${port}`);
}

function ensureStore() {
  fs.mkdirSync(chatDir, { recursive: true });
  fs.mkdirSync(uiDir, { recursive: true });
  fs.mkdirSync(uploadsDir, { recursive: true });
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
    if (!raw.trim()) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readMessages() {
  ensureStore();
  const raw = fs.readFileSync(messagesPath, 'utf8').replace(/^\uFEFF/, '');
  return raw
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

function appendMessage(input) {
  ensureStore();
  const state = readJson(statePath, {});
  const from = String(input.from || 'user').toLowerCase();
  const taskId = input.task_id || state.active_task_id || `task-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`;
  const now = new Date().toISOString();
  const message = {
    id: crypto.randomUUID(),
    from,
    to: String(input.to || 'all').toLowerCase(),
    type: String(input.type || 'status').toLowerCase(),
    text: String(input.text || '').trim(),
    task_id: taskId,
    created_at: now,
    read_by: [from],
    attachments: Array.isArray(input.attachments) ? input.attachments : [],
  };

  if (!message.text && message.attachments.length === 0) {
    const error = new Error('Message text is required.');
    error.statusCode = 400;
    throw error;
  }

  if (from !== 'user' && state.pause_agent_pingpong === true) {
    const error = new Error('Agent ping-pong is paused by user priority.');
    error.statusCode = 409;
    throw error;
  }

  fs.appendFileSync(messagesPath, `${JSON.stringify(message)}\n`, 'utf8');

  state.updated_at = now;
  if (!state.active_task_id) state.active_task_id = taskId;
  if (from === 'user') {
    markActiveTask('paused_by_user', taskId);
    state.pause_agent_pingpong = true;
    state.active_priority = 'user';
    state.active_task_id = taskId;
  } else if (message.type === 'decision_needed') {
    state.pause_agent_pingpong = true;
    state.active_priority = 'decision_needed';
    state.active_task_id = taskId;
  }
  writeJson(statePath, state);

  return message;
}

function safeFileName(name) {
  const baseName = path.basename(String(name || 'upload.bin'));
  return baseName.replace(/[^\w.\-()[\] ]+/g, '_').slice(0, 160) || 'upload.bin';
}

function saveUpload(input) {
  ensureStore();
  const originalName = safeFileName(input.name);
  const mimeType = String(input.type || 'application/octet-stream');
  const encoded = String(input.data || '');
  const data = Buffer.from(encoded, 'base64');
  const maxBytes = 15 * 1024 * 1024;

  if (!data.length) {
    const error = new Error('Upload data is required.');
    error.statusCode = 400;
    throw error;
  }

  if (data.length > maxBytes) {
    const error = new Error('Upload is too large. Max size is 15 MB.');
    error.statusCode = 413;
    throw error;
  }

  const id = crypto.randomUUID();
  const storedName = `${id}-${originalName}`;
  const filePath = path.join(uploadsDir, storedName);
  fs.writeFileSync(filePath, data);

  return {
    id,
    name: originalName,
    type: mimeType,
    size: data.length,
    url: `/uploads/${storedName}`,
  };
}

function markActiveTask(taskState, taskId) {
  const tasks = readJson(tasksPath, []);
  if (!Array.isArray(tasks)) return;

  const existing = tasks.find((task) => task.id === taskId);
  if (existing) {
    existing.state = taskState;
    existing.updated_at = new Date().toISOString();
  } else {
    tasks.push({
      id: taskId,
      title: taskId,
      state: taskState,
      updated_at: new Date().toISOString(),
    });
  }
  writeJson(tasksPath, tasks);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 20 * 1024 * 1024) {
        req.destroy(new Error('Request body too large.'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, value, statusCode = 200) {
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(JSON.stringify(value, null, 2));
}

function sendStatic(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
  };
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      'content-type': types[ext] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(data);
  });
}

function markRead(agent) {
  const messages = readMessages();
  const recipient = String(agent || '').toLowerCase();
  const relevant = messages.filter((message) => {
    const isRecipient = message.to === 'all' || message.to === recipient || message.from === 'user';
    return message.from !== recipient && isRecipient;
  });
  const last = relevant[relevant.length - 1];
  const stateFile = path.join(chatDir, `state_${recipient}.json`);
  writeJson(stateFile, {
    last_read_id: last?.id || '',
    last_read_at: last?.created_at || '',
    updated_at: new Date().toISOString(),
  });
  return { marked: relevant.length, last_read_id: last?.id || '' };
}

function resume(by) {
  if (String(by || '').toLowerCase() !== 'user') {
    const error = new Error('Only user can resume agent ping-pong.');
    error.statusCode = 403;
    throw error;
  }
  const state = readJson(statePath, {});
  state.pause_agent_pingpong = false;
  state.active_priority = 'none';
  state.updated_at = new Date().toISOString();
  writeJson(statePath, state);
  return { ok: true, resumed_by: by || 'user', state };
}

ensureStore();

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'GET' && url.pathname === '/api/messages') {
      sendJson(res, { messages: readMessages() });
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/state') {
      sendJson(res, readJson(statePath, {}));
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/tasks') {
      sendJson(res, readJson(tasksPath, []));
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/messages') {
      const body = await readBody(req);
      sendJson(res, appendMessage(body), 201);
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/uploads') {
      const body = await readBody(req);
      sendJson(res, saveUpload(body), 201);
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/read') {
      const body = await readBody(req);
      sendJson(res, markRead(body.for));
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/resume') {
      const body = await readBody(req);
      sendJson(res, resume(body.by));
      return;
    }

    if (url.pathname.startsWith('/uploads/')) {
      const uploadPath = path.resolve(uploadsDir, `.${url.pathname.replace('/uploads', '')}`);
      if (!uploadPath.startsWith(uploadsDir)) {
        res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
      }
      sendStatic(res, uploadPath);
      return;
    }

    const requestPath = url.pathname === '/' ? '/index.html' : url.pathname;
    const staticPath = path.resolve(uiDir, `.${requestPath}`);
    if (!staticPath.startsWith(uiDir)) {
      res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }
    sendStatic(res, staticPath);
  } catch (error) {
    sendJson(res, { error: error.message || 'Server error' }, error.statusCode || 500);
  }
});

server.listen(port, host, () => {
  console.log(`Agent chat UI: http://${host}:${port}`);
});
