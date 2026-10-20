const KEY = 'swm:lastRoute';
const AUTH = ['/signin', '/signup', '/forgot-password'];

export function rememberRoute(path: string) {
  if (AUTH.includes(path)) return;
  try { sessionStorage.setItem(KEY, path); } catch { /* storage unavailable */ }
}

/** Where the player last was in the realm, or Today. */
export function lastRoute(): string {
  try { const p = sessionStorage.getItem(KEY); if (p && p.startsWith('/') && !AUTH.includes(p)) return p; } catch { /* ignore */ }
  return '/today';
}
