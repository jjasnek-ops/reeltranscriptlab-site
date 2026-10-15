"use strict";
const form = document.querySelector('#transcript-form');
const input = document.querySelector('#video-url');
const submit = document.querySelector('#submit-button');
const clear = document.querySelector('#clear-button');
const statusBox = document.querySelector('#status');
const errorBox = document.querySelector('#error');
const resultContent = document.querySelector('#result-content');
const transcriptText = document.querySelector('#transcript-text');
const resultMeta = document.querySelector('#result-meta');
const empty = document.querySelector('#empty-state');
const copy = document.querySelector('#copy-button');
const menuToggle = document.querySelector('#menu-toggle');
const headerNav = document.querySelector('#header-navigation');
let result = null;
let busy = false;
let progressTimer = null;
let progressStarted = 0;
let progressStage = '';
function stopProgress() {
  clearInterval(progressTimer); progressTimer = null;
  document.querySelector('#progress-detail')?.remove();
}
function progress(stage) {
  progressStage = stage;
  status(stage, true);
  let detail = document.querySelector('#progress-detail');
  if (!detail) {
    detail = document.createElement('p'); detail.id = 'progress-detail';
    detail.className = 'workspace-footnote'; detail.setAttribute('aria-live', 'off');
    statusBox.after(detail);
  }
  const elapsed = Math.floor((performance.now() - progressStarted) / 1000);
  detail.textContent = `Elapsed: ${elapsed}s · ${elapsed >= 30 ? 'Still waiting for the provider. Please keep this tab open.' : 'Please keep this tab open.'}`;
}
function startProgress() {
  stopProgress(); progressStarted = performance.now();
  progress('Request sent. Waiting for the transcription provider…');
  progressTimer = setInterval(() => {
    const elapsed = Math.floor((performance.now() - progressStarted) / 1000);
    const detail = document.querySelector('#progress-detail');
    if (detail) detail.textContent = `Elapsed: ${elapsed}s · ${elapsed >= 30 ? 'Still waiting for the provider. Please keep this tab open.' : 'Please keep this tab open.'}`;
  }, 1000);
}
function resetResult() { result = null; resultContent.hidden = true; empty.hidden = false; transcriptText.textContent = ''; resultMeta.textContent = 'Ready when you are'; copy.textContent = 'Copy text'; }
function status(message, running = false) { statusBox.textContent = message; statusBox.hidden = !message; statusBox.classList.toggle('busy', running); }
function showError(message, inputInvalid = false) {
  errorBox.textContent = message;
  errorBox.hidden = false;
  if (inputInvalid) {
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', 'input-hint error');
  }
}
function clearInputError() {
  errorBox.hidden = true;
  input.removeAttribute('aria-invalid');
  input.setAttribute('aria-describedby', 'input-hint');
}
function normalizeUrl(value) {
  if (!value.trim()) throw new Error('Paste a public Instagram Reel, video post, or share link to continue.');
  let url;
  try { url = new URL(value.trim()); } catch { throw new Error('Paste a complete Instagram Reel, video post, or share link.'); }
  if (url.protocol !== 'https:' || !['instagram.com', 'www.instagram.com', 'm.instagram.com'].includes(url.hostname) || url.username || url.password || (url.port && url.port !== '443')) throw new Error('Use an https://www.instagram.com link.');
  if (!/^\/(?:reel|reels|p|tv)\/[A-Za-z0-9_-]+\/?$/.test(url.pathname) && !/^\/share\/(?:reel\/|p\/)?[A-Za-z0-9_-]+\/?$/.test(url.pathname)) throw new Error('Use a Reel, video post, or share link, not a profile or Story.');
  url.hostname = 'www.instagram.com'; url.hash = ''; url.search = ''; return url.href;
}
async function api(path) {
  const response = await fetch('/api/' + path, {
    credentials: 'same-origin', headers: {'X-Requested-With':'ReelTranscriptLab'},
    signal: AbortSignal.timeout(120000)
  });
  const data = await response.json();
  if (!response.ok || response.status === 206) throw new Error(data.message || data.details || 'The provider could not return a transcript.');
  return data;
}
function readTranscript(data) {
  if (!Array.isArray(data.content)) throw new Error('The provider did not return timed transcript segments.');
  const segments = data.content.map(c => {
    if (typeof c.text !== 'string' || !Number.isFinite(c.offset) || !Number.isFinite(c.duration) || c.offset < 0 || c.duration < 0) throw new Error('The provider returned invalid subtitle timing.');
    return {start:c.offset / 1000, end:(c.offset + c.duration) / 1000, text:c.text};
  });
  if (!segments.some(s => s.text.trim())) throw new Error('No speech was found in this video.');
  return {text:segments.map(s => s.text).join(' ').trim(), segments, language_code:data.lang};
}
input.addEventListener('input', () => { clear.hidden = !input.value && !result; clearInputError(); });
clear.addEventListener('click', () => { if (busy) return; input.value = ''; resetResult(); status(''); clearInputError(); clear.hidden = true; input.focus(); });
function setMenuOpen(open) {
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  headerNav.classList.toggle('is-open', open);
}
menuToggle.addEventListener('click', () => {
  setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
});
headerNav.addEventListener('click', event => {
  if (event.target.closest('a')) setMenuOpen(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
    setMenuOpen(false);
    menuToggle.focus();
  }
});
window.addEventListener('resize', () => {
  if (window.matchMedia('(min-width: 701px)').matches) setMenuOpen(false);
});
form.addEventListener('submit', async event => {
  event.preventDefault(); if (busy) return; clearInputError();
  let url;
  try { url = normalizeUrl(input.value); } catch (error) { showError(error.message, true); input.focus(); return; }
  resetResult(); busy = true; submit.disabled = true; input.disabled = true; clear.disabled = true; clear.hidden = false; form.setAttribute('aria-busy', 'true');
  startProgress();
  try {
    let data = await api('transcript?' + new URLSearchParams({url, text:'false', mode:'auto'}));
    if (data.jobId) {
      const jobId = data.jobId;
      progress('Request accepted. Waiting for processing status…');
      const deadline = Date.now() + 20 * 60 * 1000;
      while (true) {
        if (Date.now() > deadline) throw new Error('The result is taking too long. The provider may still be processing it; retrying may use more credits.');
        await new Promise(resolve => setTimeout(resolve, 1500));
        data = await api('transcript/' + encodeURIComponent(jobId));
        if (data.status === 'failed') throw new Error(data.message || 'The provider could not transcribe this video.');
        if (data.status === 'completed') { data = data.result || data; break; }
        progress(data.status === 'queued' ? 'Queued by the transcription provider…' : data.status === 'active' ? 'The provider is processing your video…' : 'Waiting for a processing update…');
      }
    }
    result = readTranscript(data);
    transcriptText.textContent = result.text;
    resultMeta.textContent = result.language_code ? `Transcript language: ${result.language_code}` : 'Transcript ready';
    empty.hidden = true; resultContent.hidden = false; stopProgress(); status('Transcript ready. Copy it or choose a download.');
  } catch (error) {
    const connectionError = error.name === 'TimeoutError' || error.name === 'TypeError';
    showError(connectionError ? 'Unable to reach the transcription provider. Check your connection. A timed-out request may still consume credits.' : error.message);
    stopProgress(); status('Transcription stopped. See the message below.');
  } finally { stopProgress(); busy = false; submit.disabled = false; input.disabled = false; clear.disabled = false; form.removeAttribute('aria-busy'); }
});
copy.addEventListener('click', async () => {
  if (!result) return;
  try { await navigator.clipboard.writeText(result.text); copy.textContent = 'Copied'; status('Transcript copied.'); }
  catch { const selection = window.getSelection(); const range = document.createRange(); range.selectNodeContents(transcriptText); selection.removeAllRanges(); selection.addRange(range); status('Text selected. Use your browser’s Copy command.'); }
});
function timecode(seconds, separator) {
  const ms = Math.max(0, Math.round(seconds * 1000));
  return `${String(Math.floor(ms / 3600000)).padStart(2,'0')}:${String(Math.floor(ms / 60000) % 60).padStart(2,'0')}:${String(Math.floor(ms / 1000) % 60).padStart(2,'0')}${separator}${String(ms % 1000).padStart(3,'0')}`;
}
function formatTranscript(data, format) {
  if (format === 'txt') return data.text + '\n';
  const separator = format === 'srt' ? ',' : '.';
  const cues = data.segments.map((segment, index) => `${format === 'srt' ? `${index + 1}\n` : ''}${timecode(segment.start, separator)} --> ${timecode(segment.end, separator)}\n${segment.text.replaceAll('-->', '→')}\n`).join('\n');
  return (format === 'vtt' ? 'WEBVTT\n\n' : '') + cues;
}
document.querySelectorAll('[data-format]').forEach(button => button.addEventListener('click', () => {
  if (!result) return;
  const format = button.dataset.format;
  const downloadForm = document.createElement('form');
  downloadForm.method = 'POST'; downloadForm.action = '/api/export'; downloadForm.hidden = true;
  for (const [name, value] of Object.entries({format, content: formatTranscript(result, format)})) {
    const field = document.createElement('input'); field.type = 'hidden'; field.name = name; field.value = value; downloadForm.append(field);
  }
  document.body.append(downloadForm); downloadForm.submit();
  setTimeout(() => downloadForm.remove(), 1000); status(`${format.toUpperCase()} download requested.`);
}));

// Expose the same public, read-only guide lookup to WebMCP-capable browsers.
// Browsers without the experimental API keep the ordinary page flow unchanged.
function registerPublicGuideTools() {
  const toolContext = navigator.modelContext || document.modelContext;
  if (!toolContext) return;

  const tools = [
    {
      name: 'search_public_guides',
      description: '::ILANG [TYPE:tool][LANG:en][ACCESS:read_only] Search published guide titles, summaries, and stable slugs. Do not fetch arbitrary URLs or submit transcript requests. Cite returned source_url. ::Ω',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string', maxLength: 120, description: '::ILANG [TYPE:parameter][LANG:en] A short phrase to match against published guide content. ::Ω' } },
        additionalProperties: false,
      },
      execute: async ({ query = '' }) => {
        if (typeof query !== 'string' || query.length > 120) return JSON.stringify({ error: 'invalid_query', max_chars: 120 });
        const response = await fetch(`/api/agent/guides?q=${encodeURIComponent(query)}`, { headers: { Accept: 'application/json' } });
        return JSON.stringify(await response.json());
      },
    },
    {
      name: 'read_public_guide',
      description: '::ILANG [TYPE:tool][LANG:en][ACCESS:read_only] Read one public guide using its exact stable slug from search_public_guides or the public guide index. Cite source_url. ::Ω',
      inputSchema: {
        type: 'object',
        properties: { slug: { type: 'string', pattern: '^[a-z0-9-]{1,100}$', description: '::ILANG [TYPE:parameter][LANG:en] The exact public guide slug. ::Ω' } },
        required: ['slug'],
        additionalProperties: false,
      },
      execute: async ({ slug }) => {
        if (typeof slug !== 'string' || !/^[a-z0-9-]{1,100}$/.test(slug)) return JSON.stringify({ error: 'invalid_slug' });
        const response = await fetch(`/api/agent/guides/${encodeURIComponent(slug)}`, { headers: { Accept: 'application/json' } });
        return JSON.stringify(await response.json());
      },
    },
  ];

  if (typeof toolContext.provideContext === 'function') {
    Promise.resolve(toolContext.provideContext({ tools })).catch(() => {});
  } else if (typeof toolContext.registerTool === 'function') {
    const controller = new AbortController();
    window.addEventListener('pagehide', () => controller.abort(), { once: true });
    for (const tool of tools) Promise.resolve(toolContext.registerTool(tool, { signal: controller.signal })).catch(() => {});
  }
}

registerPublicGuideTools();
