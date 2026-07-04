// Lightweight GA4 wrapper. No-op until VITE_GA_MEASUREMENT_ID is set.
// Treats all custom domains as a single property by using one Measurement ID
// and a normalized page_location (drops the host) so traffic across
// traderisefx.com / .exchange / www.* is aggregated into one site view.

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

let initialized = false;

export function initAnalytics() {
  if (typeof window === "undefined") return;
  if (initialized) return;
  if (!MEASUREMENT_ID) return;
  initialized = true;

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", MEASUREMENT_ID, {
    send_page_view: false, // we'll send manually on SPA navigations
    anonymize_ip: true,
  });
}

export function trackPageview(path: string) {
  if (typeof window === "undefined" || !window.gtag || !MEASUREMENT_ID) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: `https://traderisefx.com${path}`, // unify cross-domain
    page_title: document.title,
  });
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  // Always log to console for visibility in dev/preview
  if (import.meta.env.DEV) console.debug("[analytics]", name, params);
  if (!window.gtag || !MEASUREMENT_ID) return;
  window.gtag("event", name, params);
}
