/**
 * Skyrim Wellbeing Manager lore proxy — a Cloudflare Worker.
 *
 * Keeps the Gemini API key server-side. The browser sends a Firebase ID token;
 * the worker verifies its signature and audience against Google's public keys,
 * applies a small per-user rate limit, builds the prompt itself, and forwards
 * to Gemini. No third-party dependencies.
 */

export interface Env {
  GEMINI_API_KEY: string;
  FIREBASE_PROJECT_ID: string;
  /** Comma-separated list of allowed origins, e.g. "https://woodrock.github.io,http://localhost:5173". */
  ALLOWED_ORIGINS: string;
  GEMINI_MODEL?: string;
  /** Optional KV namespace for rate limiting. Without it the limit is per-isolate only. */
  RATE_LIMIT?: KVNamespace;
}

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}

const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const MAX_PROMPT = 600;
const RATE_PER_HOUR = 60;

const memoryBuckets = new Map<string, { n: number; reset: number }>();
let certCache: { keys: Record<string, string>; expires: number } | null = null;

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean);
  const ok = origin && allowed.includes(origin);
  return {
    'access-control-allow-origin': ok ? origin : allowed[0] ?? '',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-max-age': '86400',
    vary: 'Origin',
  };
}

function b64url(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const bin = atob(input.replace(/-/g, '+').replace(/_/g, '/') + pad);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

function pemToDer(pem: string): ArrayBuffer {
  const body = pem.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\s/g, '');
  const bin = atob(body);
  return Uint8Array.from(bin, c => c.charCodeAt(0)).buffer;
}

async function googleCerts(): Promise<Record<string, string>> {
  if (certCache && certCache.expires > Date.now()) return certCache.keys;
  const res = await fetch(CERTS_URL, { cf: { cacheTtl: 3600 } } as RequestInit);
  if (!res.ok) throw new Error('cert fetch failed');
  const keys = (await res.json()) as Record<string, string>;
  const cc = res.headers.get('cache-control') ?? '';
  const maxAge = Number(/max-age=(\d+)/.exec(cc)?.[1] ?? 3600);
  certCache = { keys, expires: Date.now() + Math.min(maxAge, 6 * 3600) * 1000 };
  return keys;
}

/** Extract the RSA public key from an X.509 certificate (DER). */
async function importCertKey(pem: string): Promise<CryptoKey> {
  // SubjectPublicKeyInfo is embedded in the cert; WebCrypto cannot import X.509 directly,
  // so locate the SPKI by scanning for the RSA OID sequence.
  const der = new Uint8Array(pemToDer(pem));
  const oid = [0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00];
  let idx = -1;
  outer: for (let i = 0; i < der.length - oid.length; i++) {
    for (let j = 0; j < oid.length; j++) if (der[i + j] !== oid[j]) continue outer;
    idx = i; break;
  }
  if (idx < 0) throw new Error('rsa oid not found');
  // Walk back to the enclosing SEQUENCE header (0x30 len...) that starts the SPKI.
  let start = idx - 1;
  while (start > 0 && der[start] !== 0x30) start--;
  // Try up to 4 bytes back for long-form length encodings.
  for (let back = 0; back < 5; back++) {
    const s = start - back;
    if (s < 0 || der[s] !== 0x30) continue;
    const len = derLength(der, s + 1);
    if (!len) continue;
    const end = s + 1 + len.headerLen + len.length;
    if (end <= der.length) {
      try {
        return await crypto.subtle.importKey('spki', der.slice(s, end), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
      } catch { /* try the next candidate */ }
    }
  }
  throw new Error('spki import failed');
}

function derLength(der: Uint8Array, at: number): { length: number; headerLen: number } | null {
  const b = der[at];
  if (b === undefined) return null;
  if (b < 0x80) return { length: b, headerLen: 1 };
  const n = b & 0x7f;
  if (n > 4) return null;
  let length = 0;
  for (let i = 0; i < n; i++) length = (length << 8) | der[at + 1 + i];
  return { length, headerLen: 1 + n };
}

interface Claims { sub: string; aud: string; iss: string; exp: number; iat: number; auth_time?: number }

async function verifyIdToken(token: string, projectId: string): Promise<Claims> {
  const [h, p, s] = token.split('.');
  if (!h || !p || !s) throw new Error('malformed');
  const header = JSON.parse(new TextDecoder().decode(b64url(h))) as { alg: string; kid: string };
  if (header.alg !== 'RS256') throw new Error('alg');
  const certs = await googleCerts();
  const pem = certs[header.kid];
  if (!pem) throw new Error('kid');
  const key = await importCertKey(pem);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64url(s), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) throw new Error('signature');
  const claims = JSON.parse(new TextDecoder().decode(b64url(p))) as Claims;
  const now = Math.floor(Date.now() / 1000);
  if (claims.aud !== projectId) throw new Error('aud');
  if (claims.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('iss');
  if (claims.exp <= now) throw new Error('expired');
  if (claims.iat > now + 300) throw new Error('iat');
  if (!claims.sub) throw new Error('sub');
  return claims;
}

async function rateLimited(uid: string, env: Env): Promise<boolean> {
  const hour = Math.floor(Date.now() / 3_600_000);
  const key = `rl:${uid}:${hour}`;
  if (env.RATE_LIMIT) {
    const n = Number((await env.RATE_LIMIT.get(key)) ?? '0') + 1;
    await env.RATE_LIMIT.put(key, String(n), { expirationTtl: 3700 });
    return n > RATE_PER_HOUR;
  }
  const b = memoryBuckets.get(key) ?? { n: 0, reset: (hour + 1) * 3_600_000 };
  b.n += 1;
  memoryBuckets.set(key, b);
  if (memoryBuckets.size > 5000) memoryBuckets.clear();
  return b.n > RATE_PER_HOUR;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('origin');
    const cors = corsHeaders(origin, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ error: 'method' }, 405, cors);
    if (!origin || cors['access-control-allow-origin'] !== origin) return json({ error: 'origin' }, 403, cors);

    const auth = request.headers.get('authorization') ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return json({ error: 'unauthenticated' }, 401, cors);

    let uid: string;
    try {
      uid = (await verifyIdToken(token, env.FIREBASE_PROJECT_ID)).sub;
    } catch (e) {
      return json({ error: 'invalid token', reason: (e as Error).message }, 401, cors);
    }

    if (await rateLimited(uid, env)) return json({ error: 'rate limited' }, 429, cors);

    let body: { kind?: string; prompt?: string };
    try { body = await request.json(); } catch { return json({ error: 'bad json' }, 400, cors); }
    if (typeof body.prompt !== 'string' || !['quest', 'reframe'].includes(body.kind ?? '')) return json({ error: 'bad request' }, 400, cors);
    const prompt = body.prompt.slice(0, 2000);
    if (prompt.length > MAX_PROMPT * 3) return json({ error: 'too long' }, 413, cors);

    const model = env.GEMINI_MODEL || 'gemini-3.1-pro-preview';
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 300, temperature: 0.9 },
      }),
    });
    if (!res.ok) return json({ error: 'upstream', status: res.status }, 502, cors);
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
    return json({ text }, 200, { ...cors, 'cache-control': 'no-store' });
  },
};
