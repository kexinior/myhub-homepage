import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Meting from '@meting/core';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8080);
const MAX_TRACKS = 24;
const CACHE_TTL_MS = 5 * 60 * 1000;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT = 30;
const DEFAULT_TERMS = ['周杰伦', '林俊杰', '古风'];
const ALLOWED_PLATFORMS = new Set(['netease', 'tencent', 'kugou', 'kuwo', 'baidu']);
const cache = new Map();
const rateState = new Map();

export function normalizeQueryTerms(value, fallback = DEFAULT_TERMS) {
  const terms = String(value ?? '')
    .split(',')
    .map((term) => term.trim())
    .filter((term) => term && term.length <= 40)
    .slice(0, 3);
  return terms.length > 0 ? terms : [...fallback];
}

export function normalizePlatform(value, fallback = 'netease') {
  const platform = String(value ?? '').trim().toLowerCase();
  return ALLOWED_PLATFORMS.has(platform) ? platform : fallback;
}

export function toHttpsStreamUrl(value) {
  try {
    const url = new URL(String(value ?? '').trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('unsupported protocol');
    url.protocol = 'https:';
    if (url.username || url.password) throw new Error('credentials are not allowed');
    return url.href;
  } catch {
    return null;
  }
}

export function normalizeMetingResults(results, { limit = MAX_TRACKS } = {}) {
  const maxTracks = Math.min(Math.max(Number(limit) || MAX_TRACKS, 1), MAX_TRACKS);
  const tracks = [];
  const ids = new Set();

  for (const item of results) {
    if (tracks.length >= maxTracks) break;
    const id = String(item?.id ?? item?.url_id ?? '').trim();
    const title = String(item?.name ?? item?.title ?? '').trim();
    const artist = Array.isArray(item?.artist)
      ? item.artist.map((name) => String(name).trim()).filter(Boolean).join(' / ')
      : String(item?.artist ?? '').trim();
    const url = toHttpsStreamUrl(item?.url);
    if (!id || !title || !artist || !url || ids.has(id)) continue;
    if (id.length > 100 || title.length > 200 || artist.length > 200) continue;

    ids.add(id);
    tracks.push({ id, title, artist, url });
  }
  return tracks;
}

function parseJson(value) {
  if (typeof value !== 'string') return value;
  return JSON.parse(value);
}

async function searchPlatform(platform, terms, limit) {
  const meting = new Meting(platform);
  meting.format(true);
  const candidates = [];
  const perTermLimit = Math.max(1, Math.ceil(limit / terms.length));

  for (const term of terms) {
    const raw = await meting.search(term, { page: 1, limit: Math.min(perTermLimit, 12) });
    const songs = parseJson(raw);
    if (!Array.isArray(songs)) continue;
    for (const song of songs) {
      if (candidates.length >= MAX_TRACKS) break;
      const id = song?.url_id ?? song?.id;
      if (id === undefined || id === null) continue;
      try {
        const urlRaw = await meting.url(id, 320);
        const urlInfo = parseJson(urlRaw);
        const url = Array.isArray(urlInfo) ? urlInfo[0]?.url : urlInfo?.url;
        if (url) candidates.push({ ...song, url });
      } catch {
        // A platform can return search results whose stream is unavailable.
      }
    }
    if (candidates.length >= MAX_TRACKS) break;
  }

  return normalizeMetingResults(candidates, { limit });
}

function allowedOrigins() {
  return new Set(
    String(process.env.ALLOWED_ORIGINS || 'http://localhost:8080,http://127.0.0.1:8080,http://localhost:8090,http://127.0.0.1:8090')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}

function applyCors(response, request) {
  const origin = request.headers.origin;
  if (origin && allowedOrigins().has(origin)) response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Vary', 'Origin');
}

function sendJson(response, request, status, payload) {
  applyCors(response, request);
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(body);
}

function isRateLimited(request) {
  const key = request.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const current = rateState.get(key);
  if (!current || current.expiresAt <= now) {
    rateState.set(key, { count: 1, expiresAt: now + RATE_WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > RATE_LIMIT;
}

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

async function serveStatic(request, response, pathname) {
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const target = path.resolve(ROOT, `.${requestedPath}`);
  if (target !== ROOT && !target.startsWith(`${ROOT}${path.sep}`)) {
    sendJson(response, request, 400, { error: 'Invalid path' });
    return;
  }

  try {
    const stat = await fs.stat(target);
    if (!stat.isFile()) throw new Error('not a file');
    const body = await fs.readFile(target);
    response.writeHead(200, {
      'Content-Type': MIME_TYPES[path.extname(target).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(body);
  } catch {
    sendJson(response, request, 404, { error: 'Not found' });
  }
}

export async function handleMusicRequest(request, response, requestUrl) {
  if (isRateLimited(request)) {
    response.setHeader('Retry-After', '60');
    sendJson(response, request, 429, { error: 'Too many music requests' });
    return;
  }
  const platform = normalizePlatform(requestUrl.searchParams.get('platform'));
  const terms = normalizeQueryTerms(requestUrl.searchParams.get('queries'));
  const limit = Math.min(Math.max(Number(requestUrl.searchParams.get('limit')) || MAX_TRACKS, 1), MAX_TRACKS);
  const key = `${platform}:${terms.join('|')}:${limit}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    sendJson(response, request, 200, cached.payload);
    return;
  }

  try {
    const tracks = await searchPlatform(platform, terms, limit);
    if (tracks.length === 0) throw new Error('No playable tracks');
    const payload = { version: 1, source: 'meting', platform, terms, tracks };
    cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, payload });
    sendJson(response, request, 200, payload);
  } catch (error) {
    console.error('[music] Meting request failed:', error?.message || error);
    sendJson(response, request, 502, { error: 'Meting service unavailable' });
  }
}

export function createMusicServer() {
  return http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    if (request.method === 'GET' && requestUrl.pathname === '/api/music') {
      await handleMusicRequest(request, response, requestUrl);
      return;
    }
    if (request.method === 'GET') {
      await serveStatic(request, response, requestUrl.pathname);
      return;
    }
    sendJson(response, request, 405, { error: 'Method not allowed' });
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createMusicServer().listen(PORT, '127.0.0.1', () => {
    console.log(`LXT music site running at http://127.0.0.1:${PORT}`);
  });
}
