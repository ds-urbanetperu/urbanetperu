import { IP_MAX_ATTEMPTS, IP_WINDOW_MS } from '../config/loginSecurity.js';

const ipAttempts = new Map();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];

  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function cleanupExpiredEntries(now) {
  for (const [ip, entry] of ipAttempts.entries()) {
    if (entry.resetAt <= now) {
      ipAttempts.delete(ip);
    }
  }
}

export function loginRateLimiter(req, res, next) {
  const now = Date.now();
  cleanupExpiredEntries(now);

  const clientIp = getClientIp(req);
  const entry = ipAttempts.get(clientIp);

  if (!entry || entry.resetAt <= now) {
    ipAttempts.set(clientIp, {
      count: 0,
      resetAt: now + IP_WINDOW_MS
    });
    return next();
  }

  if (entry.count >= IP_MAX_ATTEMPTS) {
    const retryAfterMinutes = Math.max(
      1,
      Math.ceil((entry.resetAt - now) / 60000)
    );

    return res.status(429).json({
      message: `Demasiados intentos de inicio de sesión desde esta conexión. Intenta nuevamente en ${retryAfterMinutes} minuto(s).`,
      retryAfterMinutes,
      locked: true
    });
  }

  return next();
}

export function registerFailedIpAttempt(req) {
  const now = Date.now();
  const clientIp = getClientIp(req);
  const entry = ipAttempts.get(clientIp);

  if (!entry || entry.resetAt <= now) {
    ipAttempts.set(clientIp, {
      count: 1,
      resetAt: now + IP_WINDOW_MS
    });
    return;
  }

  entry.count += 1;
}

export function clearIpAttempts(req) {
  const clientIp = getClientIp(req);
  ipAttempts.delete(clientIp);
}
