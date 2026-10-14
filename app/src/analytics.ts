/**
 * Anonymous, cookie-free usage statistics (Umami Cloud).
 *
 * Privacy rules: only event names and small labels (channel, language, rule number) are sent.
 * Never names, amounts, heirs or the shared-link hash. The Umami script itself only reports on
 * thabet-noob.github.io and respects the browser's Do Not Track setting (see index.html).
 */

type EventData = Record<string, string | number | boolean>;
interface Umami {
  track: (event?: string | ((props: Record<string, unknown>) => Record<string, unknown>), data?: EventData) => void;
}
declare global {
  interface Window {
    umami?: Umami;
  }
}

const queue: Array<(u: Umami) => void> = [];
let waiting = false;

function send(fn: (u: Umami) => void) {
  if (window.umami) {
    try {
      fn(window.umami);
    } catch {
      /* analytics must never break the app */
    }
    return;
  }
  queue.push(fn);
  if (waiting) return;
  waiting = true;
  // The script loads with `defer`; wait for it (up to ~15 s), then flush.
  let tries = 0;
  const timer = window.setInterval(() => {
    tries += 1;
    if (window.umami || tries > 60) {
      window.clearInterval(timer);
      waiting = false;
      const u = window.umami;
      const pending = queue.splice(0);
      if (u) pending.forEach((f) => send(f));
    }
  }, 250);
}

/** Page view with the path only: no query string, no #s=… scenario hash. */
export function trackPageview() {
  send((u) => u.track((props) => ({ ...props, url: window.location.pathname })));
}

export function track(event: string, data?: EventData) {
  // Function form so the URL is overridden too: Umami would otherwise send location.href,
  // which can contain the #s=… scenario of a shared link.
  send((u) => u.track((props) => ({ ...props, url: window.location.pathname, name: event, ...(data ? { data } : {}) })));
}

/** Track an event only once per page load (e.g. "started editing a case"). */
const seen = new Set<string>();
export function trackOnce(event: string, data?: EventData) {
  if (seen.has(event)) return;
  seen.add(event);
  track(event, data);
}
