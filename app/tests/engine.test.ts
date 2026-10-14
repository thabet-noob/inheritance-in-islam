import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { calculate } from '../src/engine/calculate';
import { Fraction } from '../src/engine/fraction';
import { HEIR_TYPES, HeirType, Heirs } from '../src/engine/heirs';
import { allocateCents, applyBequest, formatMoney } from '../src/engine/money';
import { relevance } from '../src/engine/relevance';

interface TestCase {
  id: number;
  heirs: { heir: string; count: number }[];
  shares_by_category: { heir: string; fraction: string }[];
  shares_by_individual: { heir: string; fraction: string }[];
}

const dir = join(__dirname, '..', '..', 'test-cases');
const cases: TestCase[] = readdirSync(dir)
  .filter((f) => /^test-case-\d+\.json$/.test(f))
  .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')))
  .sort((a, b) => a.id - b.id);

const SKIP = new Set([29]); // empty on the reference site
const INDIVIDUAL_TABLE_WRONG = new Set([127]); // reference shows 1/3 per maternal brother; correct is 1/6

describe('reference test cases', () => {
  it('loads all 134 cases', () => expect(cases.length).toBe(134));

  for (const tc of cases) {
    if (SKIP.has(tc.id)) continue;
    it(`#${tc.id} ${tc.heirs.map((h) => `${h.heir} ${h.count}`).join(', ')}`, () => {
      const heirs: Heirs = {};
      for (const h of tc.heirs) {
        expect(HEIR_TYPES).toContain(h.heir);
        heirs[h.heir as HeirType] = h.count;
      }
      const result = calculate(heirs);
      const got = Object.fromEntries(result.categories.map((c) => [c.heir, c.share.toString()]));
      const expected = Object.fromEntries(
        tc.shares_by_category.map((r) => [r.heir, Fraction.parse(r.fraction).toString()]),
      );
      expect(got).toEqual(expected);

      if (!INDIVIDUAL_TABLE_WRONG.has(tc.id)) {
        for (const r of tc.shares_by_individual) {
          const type = r.heir.replace(/ \d+$/, '');
          const cat = result.categories.find((c) => c.heir === type)!;
          expect(cat.perPerson.toString(), r.heir).toBe(Fraction.parse(r.fraction).toString());
        }
      }
    });
  }
});

describe('default scenario: male, 1 wife, 2 sons, 2 daughters, mother, 1,000,000 USD', () => {
  const result = calculate({ Wife: 1, Son: 2, Daughter: 2, Mother: 1 }, 'male');
  const per = (h: HeirType) => result.categories.find((c) => c.heir === h)!.perPerson.toString();

  it('computes the expected fractions', () => {
    expect(per('Wife')).toBe('1/8');
    expect(per('Mother')).toBe('1/6');
    expect(per('Son')).toBe('17/72');
    expect(per('Daughter')).toBe('17/144');
  });

  it('allocates exact amounts summing to the estate', () => {
    const shares = [per('Wife'), per('Mother'), per('Son'), per('Son'), per('Daughter'), per('Daughter')].map(Fraction.parse);
    const cents = allocateCents(100_000_000n, shares);
    expect(cents.map((c) => formatMoney(c, 'USD'))).toEqual([
      '125,000.00 USD',
      '166,666.67 USD',
      '236,111.11 USD',
      '236,111.11 USD',
      '118,055.56 USD',
      '118,055.55 USD', // the 2 leftover cents go to the largest remainders (mother, then daughter 1)
    ]);
    expect(cents.reduce((a, b) => a + b, 0n)).toBe(100_000_000n);
  });

  it('lists the expected rules', () => {
    expect(new Set(result.steps.map((s) => s.rule))).toEqual(new Set(['2b', '6b', '14', '15', '44']));
  });
});

describe('app default example: wife, son, 2 daughters, mother, grandfather, uncle; 1,000,000 TND', () => {
  const result = calculate({ Wife: 1, Son: 1, Daughter: 2, Mother: 1, GrandFather: 1, FullUncle: 1 }, 'male');
  const cat = (h: HeirType) => result.categories.find((c) => c.heir === h)!;

  it('matches the expected shares', () => {
    expect(cat('Wife').perPerson.toString()).toBe('1/8');
    expect(cat('Son').perPerson.toString()).toBe('13/48');
    expect(cat('Daughter').perPerson.toString()).toBe('13/96');
    expect(cat('Mother').perPerson.toString()).toBe('1/6');
    expect(cat('GrandFather').perPerson.toString()).toBe('1/6');
    expect(cat('FullUncle').status).toBe('blocked');
    expect(cat('FullUncle').blocked).toMatchObject({ by: 'Son', rule: '13a' });
  });

  it('allocates amounts summing to the estate', () => {
    const shares = ['Wife', 'Son', 'Daughter', 'Daughter', 'Mother', 'GrandFather'].map((h) => cat(h as HeirType).perPerson);
    const cents = allocateCents(100_000_000n, shares);
    expect(cents.map((c) => formatMoney(c, 'TND'))).toEqual([
      '125,000.00 TND',
      '270,833.33 TND',
      '135,416.67 TND',
      '135,416.67 TND',
      '166,666.67 TND',
      '166,666.66 TND',
    ]);
    expect(cents.reduce((a, b) => a + b, 0n)).toBe(100_000_000n);
  });
});

describe('bequest (wasiyya)', () => {
  it('deducts a bequest within one third', () => {
    expect(applyBequest(100_000_000n, 10_000_000n)).toEqual({
      bequestCents: 10_000_000n,
      maxCents: 33_333_333n,
      capped: false,
      netCents: 90_000_000n,
    });
  });

  it('caps a bequest above one third', () => {
    const r = applyBequest(100_000_000n, 50_000_000n);
    expect(r).toMatchObject({ bequestCents: 33_333_333n, capped: true, netCents: 66_666_667n });
  });

  it('heirs share the net estate exactly', () => {
    const { netCents } = applyBequest(100_000_000n, 20_000_000n);
    const result = calculate({ Wife: 1, Son: 1 }, 'male');
    const cents = allocateCents(netCents, result.categories.map((c) => c.perPerson));
    expect(cents).toEqual([10_000_000n, 70_000_000n]);
  });
});

describe('relevance', () => {
  it('hides siblings when a son exists', () => {
    const heirs = { Wife: 1, Son: 2, Daughter: 2, Mother: 1 };
    expect(relevance(heirs, 'male', 'FullBrother')).toMatchObject({ relevant: false, blockedBy: 'Son' });
    expect(relevance(heirs, 'male', 'GrandFather').relevant).toBe(true);
    expect(relevance(heirs, 'male', 'PaternalGrandMother')).toMatchObject({ relevant: false, blockedBy: 'Mother' });
  });

  it('shows blocked siblings when they still reduce the mother (Rule 6)', () => {
    expect(relevance({ Wife: 1, Father: 1, Mother: 1 }, 'male', 'MaternalBrother').relevant).toBe(true);
  });
});
