import { Fraction } from './fraction';

/**
 * Split an amount (in cents) by exact fractions, using the largest-remainder method
 * so the parts always add up to the allocated total.
 */
export function allocateCents(totalCents: bigint, shares: Fraction[]): bigint[] {
  const exact = shares.map((f) => new Fraction(totalCents).mul(f));
  const floors = exact.map((f) => f.num / f.den); // shares are non-negative, so this floors
  const target = new Fraction(totalCents).mul(Fraction.sum(shares));
  let remaining = target.num / target.den - floors.reduce((a, b) => a + b, 0n);
  const order = exact
    .map((f, i) => ({ i, rem: f.sub(new Fraction(floors[i])) }))
    .sort((a, b) => b.rem.cmp(a.rem) || a.i - b.i);
  const out = [...floors];
  for (const { i } of order) {
    if (remaining <= 0n) break;
    out[i] += 1n;
    remaining -= 1n;
  }
  return out;
}

/**
 * A bequest (wasiyya) is paid before the heirs' shares and is limited to one third of the estate;
 * anything above the third needs the heirs' consent, so it is not deducted here.
 */
export function applyBequest(estateCents: bigint, requestedCents: bigint) {
  const maxCents = estateCents / 3n;
  const capped = requestedCents > maxCents;
  const bequestCents = capped ? maxCents : requestedCents;
  return { bequestCents, maxCents, capped, netCents: estateCents - bequestCents };
}

export function formatMoney(cents: bigint, currency: string): string {
  const neg = cents < 0n;
  const abs = neg ? -cents : cents;
  const whole = (abs / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const frac = (abs % 100n).toString().padStart(2, '0');
  return `${neg ? '-' : ''}${whole}.${frac} ${currency}`;
}

export function formatPercent(f: Fraction): string {
  const v = Math.round(f.toNumber() * 10000) / 100;
  return `${Number(v.toFixed(2))}%`;
}

export function toCents(amount: number): bigint {
  return BigInt(Math.round(Math.max(0, amount) * 100));
}
