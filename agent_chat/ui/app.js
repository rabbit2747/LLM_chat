const els = {
  messages: document.querySelector('#messages'),
  statePill: document.querySelector('#statePill'),
  pauseBanner: document.querySelector('#pauseBanner'),
  lastUpdated: document.querySelector('#lastUpdated'),
  composer: document.querySelector('#composer'),
  to: document.querySelector('#to'),
  type: document.querySelector('#type'),
  text: document.querySelector('#text'),
  taskId: document.querySelector('#taskId'),
  resumeBtn: document.querySelector('#resumeBtn'),
  fileInput: document.querySelector('#fileInput'),
  attachBtn: document.querySelector('#attachBtn'),
  attachmentList: document.querySelector('#attachmentList'),
  sendBtn: document.querySelector('#sendBtn'),
  jumpLatestBtn: document.querySelector('#jumpLatestBtn'),
};

let lastMessageCount = -1;
let pinnedToBottom = true;
let pendingFiles = [];
let newMessageCount = 0;

function formatTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}

function formatFullTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatFileSize(size) {
  if (!Number.isFinite(size)) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function labelFor(agent) {
  if (agent === 'user') return 'User';
  if (agent === 'claude') return 'Claude';
  if (agent === 'codex') return 'Codex';
  return agent;
}

function avatarFor(agent) {
  if (agent === 'user') return 'U';
  if (agent === 'claude') return 'C';
  if (agent === 'codex') return 'X';
  return '?';
}

function renderAttachments(attachments = []) {
  if (!Array.isArray(attachments) || attachments.length === 0) return '';
  return `
    <div class="attachments">
      ${attachments.map(renderAttachment).join('')}
    </div>
  `;
}

function renderAttachment(file) {
  const isImage = String(file.type || '').startsWith('image/');
  if (isImage) {
    return `
      <a class="attachment-image-link" href="${escapeAttr(file.url)}" target="_blank" rel="noreferrer">
        <img class="attachment-image" src="${escapeAttr(file.url)}" alt="${escapeAttr(file.name)}" />
        <span>${escapeHtml(file.name)} / ${formatFileSize(file.size)}</span>
      </a>
    `;
  }

  return `
    <a class="attachment-link" href="${escapeAttr(file.url)}" download="${escapeAttr(file.name)}" target="_blank" rel="noreferrer">
      ${escapeHtml(file.name)} / ${formatFileSize(file.size)}
    </a>
  `;
}

function renderMessages(messages) {
  const previousCount = lastMessageCount;
  if (messages.length === lastMessageCount) return;
  lastMessageCount = messages.length;

  if (!pinnedToBottom && previousCount >= 0 && messages.length > previousCount) {
    newMessageCount += messages.length - previousCount;
  }

  const prevScrollTop = els.messages.scrollTop;

  els.messages.innerHTML = messages.map((message, index) => {
    const previous = messages[index - 1];
    const grouped = shouldGroup(message, previous);
    const needsDay = shouldShowDaySeparator(message, previous);
    const marker = markerKind(message.text);
    return `
    ${needsDay ? `<div class="day-separator">${formatDay(message.created_at)}</div>` : ''}
    <article class="message ${message.from}${grouped ? ' grouped' : ''}${marker ? ` marker marker-${marker}` : ''}">
      <div class="message-avatar">${avatarFor(message.from)}</div>
      <div class="bubble">
        <div class="meta">
          <span>${labelFor(message.from)} -> ${labelFor(message.to)}</span>
          <span class="tag">${message.type}</span>
          <span class="tag">${message.task_id || '-'}</span>
          <span>${formatTime(message.created_at)}</span>
        </div>
        <p class="text">${linkifyText(message.text)}</p>
        ${renderAttachments(message.attachments)}
        <div class="message-time">Sent ${formatFullTime(message.created_at)}</div>
      </div>
    </article>
  `;
  }).join('');

  if (pinnedToBottom) {
    els.messages.scrollTop = els.messages.scrollHeight;
    newMessageCount = 0;
  } else {
    // append-only log: new messages are added below, so restoring the prior
    // scrollTop keeps the user exactly where they were (no jump to top).
    els.messages.scrollTop = prevScrollTop;
  }
  renderJumpLatest();
}

function markerKind(text) {
  const value = String(text || '');
  if (!/User_\d{6}_\d{10}/.test(value)) return '';
  if (/\u{1F680}/u.test(value)) return 'start';
  if (/\u2705|\u{1F389}/u.test(value)) return 'complete';
  return '';
}

function shouldShowDaySeparator(message, previous) {
  if (!previous) return true;
  return formatDay(message.created_at) !== formatDay(previous.created_at);
}

function formatDay(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(value));
}

function shouldGroup(message, previous) {
  if (!previous) return false;
  if (message.from !== previous.from) return false;
  if (message.task_id !== previous.task_id) return false;

  const currentTime = new Date(message.created_at).getTime();
  const previousTime = new Date(previous.created_at).getTime();
  return Number.isFinite(currentTime) && Number.isFinite(previousTime)
    && currentTime - previousTime < 5 * 60 * 1000;
}

function renderState(state) {
  const paused = Boolean(state.pause_agent_pingpong);
  els.statePill.classList.toggle('paused', paused);
  els.statePill.textContent = paused
    ? `Paused: ${state.active_priority}`
    : 'Ping-pong open';
  els.pauseBanner.hidden = !paused;
  els.lastUpdated.textContent = state.updated_at
    ? `Updated ${formatTime(state.updated_at)}`
    : 'Waiting';
  if (state.active_task_id && !els.taskId.value) {
    els.taskId.value = state.active_task_id;
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}

function linkifyText(value) {
  const escaped = escapeHtml(value);
  return escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a class="text-link" href="$1" target="_blank" rel="noreferrer">$1</a>',
  );
}

async function getJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.includes(',') ? result.split(',').pop() : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function uploadFile(file) {
  return postJson('/api/uploads', {
    name: file.name,
    type: file.type || 'application/octet-stream',
    data: await fileToBase64(file),
  });
}

function renderPendingFiles() {
  if (pendingFiles.length === 0) {
    els.attachmentList.hidden = true;
    els.attachmentList.innerHTML = '';
    return;
  }

  els.attachmentList.hidden = false;
  els.attachmentList.innerHTML = pendingFiles.map((file) => `
    <span class="attachment-chip">${escapeHtml(file.name)} / ${formatFileSize(file.size)}</span>
  `).join('');
}

function renderJumpLatest() {
  if (pinnedToBottom) {
    els.jumpLatestBtn.hidden = true;
    els.jumpLatestBtn.textContent = 'Jump to latest';
    return;
  }

  els.jumpLatestBtn.hidden = false;
  els.jumpLatestBtn.textContent = newMessageCount > 0
    ? `${newMessageCount} new - Jump to latest`
    : 'Jump to latest';
}

function autoGrowComposer() {
  els.text.style.height = 'auto';
  els.text.style.height = `${Math.min(els.text.scrollHeight, 180)}px`;
}

async function refresh() {
  try {
    const [{ messages }, state] = await Promise.all([
      getJson('/api/messages'),
      getJson('/api/state'),
    ]);
    renderMessages(messages);
    renderState(state);
  } catch (error) {
    els.statePill.textContent = 'Connection lost';
    els.statePill.classList.add('paused');
  }
}

els.messages.addEventListener('scroll', () => {
  const distance = els.messages.scrollHeight - els.messages.scrollTop - els.messages.clientHeight;
  pinnedToBottom = distance < 80;
  if (pinnedToBottom) {
    newMessageCount = 0;
  }
  renderJumpLatest();
});

els.composer.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = els.text.value.trim();
  if (!text && pendingFiles.length === 0) return;

  els.sendBtn.disabled = true;
  const attachments = [];

  try {
    for (const file of pendingFiles) {
      attachments.push(await uploadFile(file));
    }

    await postJson('/api/messages', {
      from: 'user',
      to: els.to.value,
      type: els.type.value,
      text,
      task_id: els.taskId.value.trim(),
      attachments,
    });

    els.text.value = '';
    autoGrowComposer();
    pendingFiles = [];
    renderPendingFiles();
    pinnedToBottom = true;
    await refresh();
  } finally {
    els.sendBtn.disabled = false;
  }
});

els.resumeBtn.addEventListener('click', async () => {
  await postJson('/api/resume', { by: 'user' });
  await refresh();
});

els.attachBtn.addEventListener('click', () => {
  els.fileInput.click();
});

els.fileInput.addEventListener('change', () => {
  pendingFiles = [...pendingFiles, ...Array.from(els.fileInput.files || [])];
  els.fileInput.value = '';
  renderPendingFiles();
});

els.jumpLatestBtn.addEventListener('click', () => {
  pinnedToBottom = true;
  newMessageCount = 0;
  els.messages.scrollTop = els.messages.scrollHeight;
  renderJumpLatest();
});

els.text.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' || event.isComposing || event.keyCode === 229) {
    return;
  }

  if (event.shiftKey) {
    return;
  }

  if (!event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault();
    els.composer.requestSubmit();
  }
});

els.text.addEventListener('input', autoGrowComposer);

refresh();
autoGrowComposer();
setInterval(refresh, 1500);
