// Storage can be unavailable in private browsing or full. Gameplay must continue.
export function readStored(key, fallback = null) {
  try { return localStorage.getItem(key) ?? fallback } catch { return fallback }
}
export function writeStored(key, value) {
  try { localStorage.setItem(key, value) } catch {}
}
