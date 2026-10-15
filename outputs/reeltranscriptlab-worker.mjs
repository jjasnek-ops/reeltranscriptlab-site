import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';

const ORIGIN = 'https://reeltranscriptlab.com';
const DECLARATION = 'Coming soon. Authentication is not yet available; the public read-only service remains available.';
const CONSTRUCTION = {
  status: 'under_construction',
  available: false,
  capabilities_status: 'planned_contract_only',
  launch_date: null,
  message: DECLARATION,
};
const LINK_HEADER = [
  '</.well-known/api-catalog>; rel="api-catalog"',
  '</openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json"',
  '</ai/>; rel="service-doc"; type="text/html"',
  '</.well-known/ai-catalog.json>; rel="describedby"; type="application/json"',
].join(', ');
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, MCP-Protocol-Version, MCP-Session-Id, Last-Event-ID',
  'Access-Control-Expose-Headers': 'MCP-Session-Id, MCP-Protocol-Version',
  'X-Content-Type-Options': 'nosniff',
};

const authorizationServer = {
  issuer: ORIGIN,
  authorization_endpoint: `${ORIGIN}/oauth/authorize`,
  token_endpoint: `${ORIGIN}/oauth/token`,
  registration_endpoint: `${ORIGIN}/oauth/register`,
  jwks_uri: `${ORIGIN}/.well-known/jwks.json`,
  response_types_supported: ['code'],
  grant_types_supported: ['authorization_code'],
  token_endpoint_auth_methods_supported: ['none'],
  code_challenge_methods_supported: ['S256'],
  scopes_supported: ['site:read'],
  origin: ORIGIN,
  ...CONSTRUCTION,
  planned_endpoints: {
    authorize: `${ORIGIN}/oauth/authorize`,
    token: `${ORIGIN}/oauth/token`,
    register: `${ORIGIN}/oauth/register`,
    claim: `${ORIGIN}/oauth/claim`,
    resource: `${ORIGIN}/api/agent-resource`,
  },
  agent_auth: {
    status: 'under_construction',
    available: false,
    capabilities_status: 'planned_contract_only',
    skill: `${ORIGIN}/auth.md`,
    register_uri: `${ORIGIN}/oauth/register`,
    claim_uri: `${ORIGIN}/oauth/claim`,
    identity_types_supported: ['anonymous'],
    anonymous: {
      status: 'under_construction',
      available: false,
      capabilities_status: 'planned_contract_only',
      credential_types_supported: ['access_token'],
    },
    supported_methods: [],
    planned_methods: ['POST application/json'],
    message: DECLARATION,
  },
};

const protectedResource = {
  resource: ORIGIN,
  issuer: ORIGIN,
  authorization_servers: [ORIGIN],
  bearer_methods_supported: ['header'],
  scopes_supported: ['site:read'],
  resource_documentation: `${ORIGIN}/auth.md`,
  planned_resource_endpoint: `${ORIGIN}/api/agent-resource`,
  origin: ORIGIN,
  ...CONSTRUCTION,
};

const authMarkdown = [
  '---',
  'title: auth.md',
  `origin: ${ORIGIN}`,
  `issuer: ${ORIGIN}`,
  'status: under_construction',
  'available: false',
  'capabilities_status: planned_contract_only',
  'launch_date: null',
  `message: "${DECLARATION}"`,
  `planned_authorize_endpoint: ${ORIGIN}/oauth/authorize`,
  `planned_token_endpoint: ${ORIGIN}/oauth/token`,
  `planned_register_endpoint: ${ORIGIN}/oauth/register`,
  `planned_claim_endpoint: ${ORIGIN}/oauth/claim`,
  `planned_resource_endpoint: ${ORIGIN}/api/agent-resource`,
  'agent_auth_status: under_construction',
  'agent_auth_available: false',
  `agent_auth_register_uri: ${ORIGIN}/oauth/register`,
  `agent_auth_claim_uri: ${ORIGIN}/oauth/claim`,
  'identity_types_supported: [anonymous]',
  'credential_types_supported: [access_token]',
  'planned_registration_method: POST application/json (not supported yet)',
  '---',
  '',
  '# auth.md — Agent Authentication Contract (Under Construction)',
  '',
  'Coming soon. Authentication is not yet available; the public read-only service remains available.',
  '',
  'This is a planned contract only. OAuth authorization, token issuance, registration, claims, and the planned protected resource are unavailable. This site has no active account or identity-submission flow. No login is required for the public pages or guide lookup API.',
  '',
  '## Planned registration flow (not available)',
  '',
  `The future registration URI is ${ORIGIN}/oauth/register. The planned method is POST with application/json and an anonymous identity type. If a future registration flow is implemented, its credential type is planned to be an access token, and the planned claim URI is ${ORIGIN}/oauth/claim. These details describe an unavailable contract; they do not authorize a request now.`,
  '',
  'Do not send a request body, credentials, or identity data to any planned endpoint. The authorize, token, register, claim, and resource paths return HTTP 503 with temporarily_unavailable and Cache-Control: no-store. The Worker does not read or store those request bodies, create accounts, issue tokens, send email, or redirect to an identity provider.',
  '',
  'The public read-only guide service is available at [Reel Transcript Lab AI access](https://reeltranscriptlab.com/ai/). It can be used without signing in and cannot submit transcription jobs.',
  '',
  'The JWKS URI is intentionally disabled and returns an empty keys array. It cannot validate signatures. No OpenID Connect discovery document is published.',
  '',
  'Agent instructions use I-Lang:',
  '',
  '    ::ILANG',
  '    [TYPE:agent-instructions][LANG:en][STATUS:under_construction]',
  '    ::STATE{@SERVICE, origin:https://reeltranscriptlab.com, access:public_read_only, authentication:unavailable}',
  '    ::RULE{public_page_request⇒use_without_credentials}',
  '    ::RULE{task_requires_identity_or_token⇒stop_and_report_not_available}',
  '    ::BOUNDARY{never:claim_OAuth_or_agent_registration_is_available}',
  '    ::Ω',
].join('\n');

const apiCatalog = {
  linkset: [
    {
      anchor: `${ORIGIN}/api/agent/guides`,
      'service-desc': [{ href: `${ORIGIN}/openapi.json`, type: 'application/vnd.oai.openapi+json' }],
      'service-doc': [{ href: `${ORIGIN}/ai/`, type: 'text/html' }],
      status: [{ href: `${ORIGIN}/api/agent/status`, type: 'application/json' }],
    },
    {
      anchor: `${ORIGIN}/mcp`,
      describedby: [{ href: `${ORIGIN}/.well-known/mcp/server-card.json`, type: 'application/json' }],
      'service-doc': [{ href: `${ORIGIN}/ai/`, type: 'text/html' }],
    },
  ],
};

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  });
}

function withHeaders(response, additions = {}) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(additions)) headers.set(name, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function addVary(headers, token) {
  const values = (headers.get('Vary') || '').split(',').map((item) => item.trim()).filter(Boolean);
  if (!values.some((item) => item.toLowerCase() === token.toLowerCase())) values.push(token);
  headers.set('Vary', values.join(', '));
}

function markdown(body) {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      Vary: 'Accept',
      Link: LINK_HEADER,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function decodeHtml(text) {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function stripHtml(html) {
  return decodeHtml(html
    .replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<(br|\/p|\/h[1-6]|\/li|\/section|\/article|\/div)>/gi, '\n')
    .replace(/<[^>]+>/g, ' '))
    .replace(/[\t\f\v ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function fetchAsset(path, request, env, accept = 'text/html') {
  const url = new URL(path, request.url);
  return env.ASSETS.fetch(new Request(url, { headers: { Accept: accept } }));
}

async function listPublicGuides(request, env) {
  const response = await fetchAsset('/guides/', request, env);
  if (!response.ok) throw new Error('The public guide index is temporarily unavailable.');
  const html = await response.text();
  const cards = [...html.matchAll(/<article\s+class=["']guide-card["'][^>]*>([\s\S]*?)<\/article>/gi)];
  const guides = [];
  for (const [, card] of cards) {
    const href = card.match(/<h2[^>]*>\s*<a[^>]*href=["']\/guides\/([a-z0-9-]+)\/?["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!href) continue;
    const paragraphs = [...card.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((match) => stripHtml(match[1]));
    guides.push({
      id: href[1],
      title: stripHtml(href[2]),
      summary: paragraphs.at(-1) || '',
      source_url: `${ORIGIN}/guides/${href[1]}/`,
    });
  }
  return guides;
}

async function findPublicGuide(slug, request, env) {
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) return null;
  const guides = await listPublicGuides(request, env);
  return guides.find((guide) => guide.id === slug) || null;
}

async function readPublicGuide(slug, request, env) {
  const guide = await findPublicGuide(slug, request, env);
  if (!guide) return null;
  const response = await fetchAsset(`/guides/${slug}/`, request, env);
  if (!response.ok) return null;
  const html = await response.text();
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || html;
  return { id: guide.id, title: guide.title, content: stripHtml(main), source_url: guide.source_url };
}

function corsPreflight() {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS, 'Access-Control-Max-Age': '86400' } });
}

async function publicAgentApi(request, env, url) {
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405, CORS_HEADERS);
  if (url.pathname === '/api/agent/status') {
    return json({ status: 'ok', service: 'public-guide-lookup', access: 'read-only' }, 200, CORS_HEADERS);
  }
  if (url.pathname === '/api/agent/guides') {
    const query = url.searchParams.get('q') || '';
    if (query.length > 120) return json({ error: 'query_too_long', max_chars: 120 }, 400, CORS_HEADERS);
    if (!query.trim()) return json({ items: [], count: 0 }, 200, CORS_HEADERS);
    const normalized = query.trim().toLocaleLowerCase('en');
    const guides = await listPublicGuides(request, env);
    const items = guides.filter((guide) => `${guide.id} ${guide.title} ${guide.summary}`.toLocaleLowerCase('en').includes(normalized));
    return json({ items, count: items.length }, 200, CORS_HEADERS);
  }
  const match = url.pathname.match(/^\/api\/agent\/guides\/([a-z0-9-]+)$/);
  if (match) {
    const guide = await readPublicGuide(match[1], request, env);
    return guide ? json(guide, 200, CORS_HEADERS) : json({ error: 'guide_not_found' }, 404, CORS_HEADERS);
  }
  return json({ error: 'not_found' }, 404, CORS_HEADERS);
}

function unavailable() {
  return json({
    error: 'temporarily_unavailable',
    error_description: 'Coming soon. No registration, claim, authorization, or token operation is available.',
    ...CONSTRUCTION,
  }, 503, { 'Cache-Control': 'no-store' });
}

function makeMcpServer(request, env) {
  const server = new McpServer({ name: 'Reel Transcript Lab Public Guide Lookup', version: '1.0.0' });
  server.registerTool('search_public_guides', {
    title: 'Search public guides',
    description: '::ILANG [TYPE:tool][LANG:en][ACCESS:read_only] Find matching entries in the published guide index. Do not fetch arbitrary URLs or submit transcript requests. Cite each returned source_url. ::Ω',
    inputSchema: { query: z.string().max(120).optional() },
    outputSchema: {
      items: z.array(z.object({ id: z.string(), title: z.string(), summary: z.string(), source_url: z.string() })),
      count: z.number().int().nonnegative(),
    },
  }, async ({ query = '' }) => {
    const guides = query.trim() ? await listPublicGuides(request, env) : [];
    const normalized = query.trim().toLocaleLowerCase('en');
    const items = guides.filter((guide) => `${guide.id} ${guide.title} ${guide.summary}`.toLocaleLowerCase('en').includes(normalized));
    const result = { items, count: items.length };
    return { content: [{ type: 'text', text: JSON.stringify(result) }], structuredContent: result };
  });
  server.registerTool('read_public_guide', {
    title: 'Read a public guide',
    description: '::ILANG [TYPE:tool][LANG:en][ACCESS:read_only] Read one guide using its exact stable slug from search_public_guides or the public guide index. Return only published guide text and cite source_url. ::Ω',
    inputSchema: { slug: z.string().regex(/^[a-z0-9-]{1,100}$/) },
    outputSchema: { id: z.string(), title: z.string(), content: z.string(), source_url: z.string() },
  }, async ({ slug }) => {
    const result = await readPublicGuide(slug, request, env);
    if (!result) return { content: [{ type: 'text', text: JSON.stringify({ error: 'guide_not_found' }) }], isError: true };
    return { content: [{ type: 'text', text: JSON.stringify(result) }], structuredContent: result };
  });
  return server;
}

async function handleMcp(request, env) {
  if (request.method === 'OPTIONS') return corsPreflight();
  const server = makeMcpServer(request, env);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
    enableDnsRebindingProtection: true,
    allowedHosts: ['reeltranscriptlab.com', 'www.reeltranscriptlab.com', '127.0.0.1:8787', 'localhost:8787'],
    maxRequestBodySize: 65536,
  });
  await server.connect(transport);
  const response = await transport.handleRequest(request);
  return withHeaders(response, CORS_HEADERS);
}

async function staticResponse(request, env, url) {
  const wantsMarkdown = url.pathname === '/' && /(?:^|,)\s*text\/markdown(?:\s*;|\s*(?:,|$))/i.test(request.headers.get('Accept') || '');
  if (wantsMarkdown) {
    const response = await fetchAsset('/ai/home.md', request, env, 'text/markdown');
    if (!response.ok) return new Response('Homepage Markdown is temporarily unavailable.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', Vary: 'Accept' } });
    const result = markdown(await response.text());
    return withHeaders(result, CORS_HEADERS);
  }

  const response = await env.ASSETS.fetch(request);
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  if (url.pathname === '/') {
    headers.set('Link', LINK_HEADER);
    addVary(headers, 'Accept');
  }
  if (url.pathname === '/.well-known/ai-catalog.json' || url.pathname.startsWith('/.well-known/agent-skills/') || url.pathname.startsWith('/.well-known/mcp/')) {
    for (const [name, value] of Object.entries(CORS_HEADERS)) headers.set(name, value);
  }
  if (url.pathname.endsWith('.ilang')) headers.set('Content-Type', 'text/plain; charset=utf-8');
  if (url.pathname.endsWith('.md')) headers.set('Content-Type', 'text/markdown; charset=utf-8');
  if (url.pathname === '/openapi.json') headers.set('Content-Type', 'application/vnd.oai.openapi+json; charset=utf-8');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.protocol !== 'https:' && !['127.0.0.1', 'localhost'].includes(url.hostname)) {
      url.protocol = 'https:';
      return Response.redirect(url.href, 301);
    }
    if (url.hostname === 'www.reeltranscriptlab.com') {
      url.hostname = 'reeltranscriptlab.com';
      return Response.redirect(url.href, 301);
    }

    if (url.pathname === '/.well-known/oauth-authorization-server') return json(authorizationServer);
    if (url.pathname === '/.well-known/oauth-protected-resource') return json(protectedResource);
    if (url.pathname === '/.well-known/api-catalog') {
      return new Response(JSON.stringify(apiCatalog), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/linkset+json; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
    }
    if (url.pathname === '/.well-known/jwks.json') return json({ keys: [] });
    if (url.pathname === '/auth.md') return markdown(authMarkdown);
    if (['/oauth/authorize', '/oauth/token', '/oauth/register', '/oauth/claim', '/api/agent-resource'].includes(url.pathname)) return unavailable();

    if (url.pathname === '/mcp') return handleMcp(request, env);
    if (url.pathname === '/api/agent/status' || url.pathname === '/api/agent/guides' || url.pathname.startsWith('/api/agent/guides/')) {
      try {
        return await publicAgentApi(request, env, url);
      } catch {
        return json({ error: 'guide_lookup_temporarily_unavailable' }, 503, CORS_HEADERS);
      }
    }
    if (!url.pathname.startsWith('/api/')) return staticResponse(request, env, url);

    if (url.pathname === '/api/export') {
      if (request.method !== 'POST') return json({ message: 'Method not allowed.' }, 405);
      if (request.headers.get('Origin') !== url.origin) return json({ message: 'Cross-site requests are not allowed.' }, 403);
      if (Number(request.headers.get('Content-Length') || 0) > 2000000) return json({ message: 'Download is too large.' }, 413);
      const reader = request.body?.getReader();
      if (!reader) return json({ message: 'Missing transcript.' }, 400);
      let size = 0;
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 2000000) {
          await reader.cancel();
          return json({ message: 'Download is too large.' }, 413);
        }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
      }
      const fields = new URLSearchParams(new TextDecoder().decode(bytes));
      const format = fields.get('format');
      if (!['txt', 'srt', 'vtt'].includes(format)) return json({ message: 'Invalid format.' }, 400);
      return new Response(fields.get('content') || '', {
        headers: {
          'Content-Type': format === 'vtt' ? 'text/vtt; charset=utf-8' : 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="instagram-transcript.${format}"`,
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    if (request.method !== 'GET') return json({ message: 'Method not allowed.' }, 405);
    if (request.headers.get('X-Requested-With') !== 'ReelTranscriptLab') return json({ message: 'Use the form on this website.' }, 403);
    const origin = request.headers.get('Origin');
    if (origin && origin !== url.origin) return json({ message: 'Cross-site requests are not allowed.' }, 403);
    if (!env.SUPADATA_API_KEY) return json({ message: 'Transcription is temporarily unavailable.' }, 503);

    let upstream;
    if (url.pathname === '/api/transcript') {
      let video;
      try {
        video = new URL(url.searchParams.get('url'));
      } catch {
        return json({ message: 'Enter a complete Instagram video link.' }, 400);
      }
      if (video.protocol !== 'https:' || !['instagram.com', 'www.instagram.com', 'm.instagram.com'].includes(video.hostname) || video.username || video.password || video.port || !/^\/(reel|reels|p|tv|share)\/[A-Za-z0-9_\/-]+\/?$/.test(video.pathname)) {
        return json({ message: 'Enter a public Instagram Reel or video post link.' }, 400);
      }
      if (!(await env.TRANSCRIPT_LIMIT.limit({ key: request.headers.get('CF-Connecting-IP') || 'unknown' })).success) return json({ message: 'Too many requests. Please wait a minute and try again.' }, 429);
      video.search = '';
      video.hash = '';
      upstream = `https://api.supadata.ai/v1/transcript?${new URLSearchParams({ url: video.href, text: 'false', mode: 'auto' })}`;
    } else if (/^\/api\/transcript\/[A-Za-z0-9-]{10,100}$/.test(url.pathname)) {
      if (!(await env.POLL_LIMIT.limit({ key: request.headers.get('CF-Connecting-IP') || 'unknown' })).success) return json({ message: 'Please wait before checking again.' }, 429);
      upstream = `https://api.supadata.ai/v1/transcript/${url.pathname.split('/').pop()}`;
    } else {
      return json({ message: 'Not found.' }, 404);
    }

    try {
      const response = await fetch(upstream, { headers: { 'x-api-key': env.SUPADATA_API_KEY }, signal: AbortSignal.timeout(110000) });
      if (!response.ok || response.status === 206) {
        await response.body?.cancel();
        const message = response.status === 404 ? 'The video was not found or is not publicly accessible.' : response.status === 429 || response.status === 402 ? 'Transcription capacity is temporarily unavailable. Please try again later.' : 'The provider could not transcribe this video. Try the original public Reel link.';
        return json({ message }, response.status === 206 ? 422 : response.status);
      }
      return new Response(response.body, { status: response.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
    } catch {
      return json({ message: 'The transcription provider did not respond in time. Please try again later.' }, 504);
    }
  },
};
