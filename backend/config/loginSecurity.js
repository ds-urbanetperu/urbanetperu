export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 15;
export const LOCKOUT_MS = LOCKOUT_MINUTES * 60 * 1000;

export const IP_MAX_ATTEMPTS = 20;
export const IP_WINDOW_MS = LOCKOUT_MS;

export function getLockoutExpiry() {
  return new Date(Date.now() + LOCKOUT_MS);
}

export function getRemainingLockMinutes(lockUntil) {
  if (!lockUntil) {
    return 0;
  }

  const remainingMs = new Date(lockUntil).getTime() - Date.now();
  return Math.max(1, Math.ceil(remainingMs / 60000));
}

export function isAccountLocked(lockUntil) {
  return Boolean(lockUntil && new Date(lockUntil).getTime() > Date.now());
}
