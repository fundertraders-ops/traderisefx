const KEY = "traderise_ref";

export function captureRefFromUrl() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref) {
    try { localStorage.setItem(KEY, ref.toUpperCase()); } catch {}
  }
}

export function getStoredRef(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export function clearStoredRef() {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(KEY); } catch {}
}

export function buildReferralLink(code: string): string {
  if (typeof window === "undefined") return `/?ref=${code}`;
  return `${window.location.origin}/?ref=${code}`;
}
