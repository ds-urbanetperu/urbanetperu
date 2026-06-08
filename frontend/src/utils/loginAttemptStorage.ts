const MUNICIPAL_LOCK_KEY = "urbanet_municipal_login_lock";

export const MUNICIPAL_MAX_ATTEMPTS = 5;
export const MUNICIPAL_LOCKOUT_MINUTES = 15;

type MunicipalLoginLock = {
  failedAttempts: number;
  lockUntil: string | null;
};

function readLockState(): MunicipalLoginLock {
  const rawState = localStorage.getItem(MUNICIPAL_LOCK_KEY);

  if (!rawState) {
    return { failedAttempts: 0, lockUntil: null };
  }

  try {
    return JSON.parse(rawState) as MunicipalLoginLock;
  } catch {
    return { failedAttempts: 0, lockUntil: null };
  }
}

function persistLockState(state: MunicipalLoginLock) {
  localStorage.setItem(MUNICIPAL_LOCK_KEY, JSON.stringify(state));
}

export function getRemainingLockMinutes(lockUntil: string | null) {
  if (!lockUntil) {
    return 0;
  }

  const remainingMs = new Date(lockUntil).getTime() - Date.now();
  return Math.max(1, Math.ceil(remainingMs / 60000));
}

export function isMunicipalLoginLocked() {
  const state = readLockState();

  if (!state.lockUntil) {
    return false;
  }

  if (new Date(state.lockUntil).getTime() <= Date.now()) {
    persistLockState({ failedAttempts: 0, lockUntil: null });
    return false;
  }

  return true;
}

export function getMunicipalLockMessage() {
  const state = readLockState();

  if (!state.lockUntil) {
    return "";
  }

  const retryAfterMinutes = getRemainingLockMinutes(state.lockUntil);
  return `Acceso municipal bloqueado temporalmente por demasiados intentos fallidos. Intenta nuevamente en ${retryAfterMinutes} minuto(s).`;
}

export function registerMunicipalFailedAttempt() {
  const state = readLockState();
  const failedAttempts = state.failedAttempts + 1;

  if (failedAttempts >= MUNICIPAL_MAX_ATTEMPTS) {
    const lockUntil = new Date(
      Date.now() + MUNICIPAL_LOCKOUT_MINUTES * 60 * 1000
    ).toISOString();

    persistLockState({ failedAttempts, lockUntil });

    return {
      locked: true,
      message: getMunicipalLockMessage()
    };
  }

  persistLockState({ failedAttempts, lockUntil: null });

  const attemptsRemaining = MUNICIPAL_MAX_ATTEMPTS - failedAttempts;

  return {
    locked: false,
    message: `Credenciales municipales inválidas. Te quedan ${attemptsRemaining} intento(s) antes del bloqueo temporal.`
  };
}

export function clearMunicipalLoginAttempts() {
  localStorage.removeItem(MUNICIPAL_LOCK_KEY);
}
