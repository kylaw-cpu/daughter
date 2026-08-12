#!/usr/bin/env node
/**
 * SendPlate auth service — email + 6-digit code via Resend.
 *
 *   RESEND_API_KEY=re_xxx RESEND_FROM="SendPlate <verify@yourdomain.com>" node server/index.mjs
 *
 * Zero dependencies (plain node:http + fetch), so it runs anywhere Node 18+
 * runs. Without RESEND_API_KEY it starts in dev mode and prints codes to the
 * console instead of emailing them. This is the first slice of the Phase 4
 * backend; it folds into the full Fastify service later. Codes are stored
 * hashed, in memory — swap for Redis/Postgres when there is more than one
 * instance.
 *
 * Endpoints (spec §10):
 *   POST /auth/otp/request  { email }            -> { requestId }
 *   POST /auth/otp/verify   { requestId, code }  -> { token, user: null }
 */
import http from 'node:http';
import crypto from 'node:crypto';

const PORT = Number(process.env.PORT ?? 8787);
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? '';
// Resend's shared onboarding sender works without a verified domain, but can
// only deliver to the email address that owns the Resend account.
const RESEND_FROM = process.env.RESEND_FROM ?? 'SendPlate <onboarding@resend.dev>';

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 30 * 1000;

/** requestId -> { emailHash, codeHash, expiresAt, attempts } */
const pending = new Map();
/** emailHash -> last request timestamp (rate limit) */
const lastRequest = new Map();

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

function prune() {
  const now = Date.now();
  for (const [id, entry] of pending) if (entry.expiresAt < now) pending.delete(id);
}
setInterval(prune, 60_000).unref();

async function sendCodeEmail(email, code) {
  if (!RESEND_API_KEY) {
    console.log(`[dev mode] verification code for ${email}: ${code}`);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [email],
      subject: `${code} — SendPlate verification code 驗證碼`,
      text:
        `Your SendPlate verification code is ${code}. It expires in 10 minutes.\n` +
        `你的 SendPlate 驗證碼是 ${code}，10 分鐘內有效。\n\n` +
        `If you didn't request this, you can ignore this email. 如非本人操作，請忽略此電郵。`,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`resend ${res.status}: ${detail.slice(0, 300)}`);
  }
}

function json(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 10_000) reject(new Error('body too large'));
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('bad json'));
      }
    });
    req.on('error', reject);
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  try {
    if (req.method === 'POST' && req.url === '/auth/otp/request') {
      const { email } = await readBody(req);
      if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
        return json(res, 400, { code: 'invalid_email', message: 'invalid email' });
      }
      const normalized = email.trim().toLowerCase();
      const emailHash = sha256(normalized);
      const last = lastRequest.get(emailHash) ?? 0;
      if (Date.now() - last < RESEND_COOLDOWN_MS) {
        return json(res, 429, { code: 'too_many_requests', message: 'try again shortly' });
      }
      lastRequest.set(emailHash, Date.now());

      const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
      const requestId = crypto.randomUUID();
      pending.set(requestId, {
        emailHash,
        codeHash: sha256(`${requestId}:${code}`),
        expiresAt: Date.now() + CODE_TTL_MS,
        attempts: 0,
      });
      await sendCodeEmail(normalized, code);
      return json(res, 200, { requestId });
    }

    if (req.method === 'POST' && req.url === '/auth/otp/verify') {
      const { requestId, code } = await readBody(req);
      const entry = typeof requestId === 'string' ? pending.get(requestId) : undefined;
      if (!entry || entry.expiresAt < Date.now()) {
        return json(res, 400, { code: 'expired_code', message: 'code expired — request a new one' });
      }
      entry.attempts += 1;
      if (entry.attempts > MAX_ATTEMPTS) {
        pending.delete(requestId);
        return json(res, 429, { code: 'too_many_attempts', message: 'too many attempts' });
      }
      const ok =
        typeof code === 'string' &&
        crypto.timingSafeEqual(
          Buffer.from(sha256(`${requestId}:${code}`)),
          Buffer.from(entry.codeHash)
        );
      if (!ok) return json(res, 400, { code: 'wrong_code', message: 'wrong code' });
      pending.delete(requestId);
      // No user store yet: the app keeps its local profile. Token is opaque.
      return json(res, 200, { token: `spl_${crypto.randomUUID()}`, user: null });
    }

    return json(res, 404, { code: 'not_found' });
  } catch (e) {
    console.error(e);
    return json(res, 500, { code: 'unknown', message: 'server error' });
  }
});

server.listen(PORT, () => {
  console.log(
    `SendPlate auth service on http://localhost:${PORT} ` +
      (RESEND_API_KEY ? `(sending via Resend as "${RESEND_FROM}")` : '(dev mode: codes print here)')
  );
});
