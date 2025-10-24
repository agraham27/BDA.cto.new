const ACCESS_TOKEN_KEY = 'bd:access-token';
const REFRESH_TOKEN_KEY = 'bd:refresh-token';
const USER_KEY = 'bd:user';

const isBrowser = typeof window !== 'undefined';

export function persistSession({ accessToken, refreshToken }: { accessToken: string; refreshToken: string }) {
  if (!isBrowser) return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function persistUser(user: unknown) {
  if (!isBrowser) return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function restoreSession() {
  if (!isBrowser) return null;
  const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export function restoreUser<T = unknown>() {
  if (!isBrowser) return null;
  const serialized = window.localStorage.getItem(USER_KEY);
  if (!serialized) return null;
  try {
    return JSON.parse(serialized) as T;
  } catch (error) {
    console.warn('Failed to parse stored user', error);
    return null;
  }
}

export function clearSession() {
  if (!isBrowser) return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}
