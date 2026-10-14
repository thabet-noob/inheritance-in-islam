import { Gender, HEIR_TYPES, HeirType, Heirs } from '../engine/heirs';
import { formatMoney } from '../engine/money';
import { heirName, Lang, t } from '../i18n/strings';
import { PersonView } from './Circle';

/**
 * The calculation encoded in a share link. Names are deliberately left out:
 * a link may be posted publicly, so it carries only relations, counts and amounts.
 */
export interface Scenario {
  g: Gender;
  e: string; // estate
  c: string; // currency
  b: string; // bequest
  h: Heirs; // living heirs per type
  l?: Lang;
}

const toBase64Url = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromBase64Url = (s: string) => atob(s.replace(/-/g, '+').replace(/_/g, '/'));

export function encodeScenario(sc: Scenario): string {
  return toBase64Url(JSON.stringify(sc));
}

export function decodeScenario(hash: string): Scenario | null {
  const m = /[#&]s=([A-Za-z0-9_-]+)/.exec(hash);
  if (!m) return null;
  try {
    const raw = JSON.parse(fromBase64Url(m[1]));
    if (raw.g !== 'male' && raw.g !== 'female') return null;
    const h: Heirs = {};
    for (const k of Object.keys(raw.h ?? {})) {
      const n = Number(raw.h[k]);
      if ((HEIR_TYPES as readonly string[]).includes(k) && Number.isInteger(n) && n > 0 && n <= 50) h[k as HeirType] = n;
    }
    return {
      g: raw.g,
      e: String(raw.e ?? '0'),
      c: String(raw.c ?? 'AED').slice(0, 3),
      b: String(raw.b ?? '0'),
      h,
      l: raw.l === 'en' ? 'en' : raw.l === 'ar' ? 'ar' : undefined,
    };
  } catch {
    return null;
  }
}

export function scenarioUrl(sc: Scenario): string {
  return `${window.location.origin}${window.location.pathname}#s=${encodeScenario(sc)}`;
}

/** Plain-text summary for messaging apps and email. Uses relations, not personal names. */
export function summaryText(opts: {
  lang: Lang;
  views: PersonView[];
  currency: string;
  estateCents: bigint;
  bequestCents: bigint;
}): string {
  const { lang, views, currency, estateCents, bequestCents } = opts;
  const s = t(lang);
  const lines = [s.title, `${s.tileEstate}: ${formatMoney(estateCents, currency)}`];
  if (bequestCents > 0n) lines.push(`${s.bequest}: ${formatMoney(bequestCents, currency)}`);
  lines.push('');
  for (const v of views) {
    if (!v.alive || !v.share?.isPositive()) continue;
    lines.push(`• ${heirName(v.type, 1, lang)}: ${v.share} — ${formatMoney(v.cents ?? 0n, currency)}`);
  }
  return lines.join('\n');
}
