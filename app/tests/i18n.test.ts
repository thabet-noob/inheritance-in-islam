import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { calculate } from '../src/engine/calculate';
import { HEIR_TYPES, HeirType, Heirs } from '../src/engine/heirs';
import { formatStep } from '../src/i18n/messages';
import { heirName, heirNote, ruleIdLabel } from '../src/i18n/strings';
import { ruleCount, ruleText } from '../src/ui/rules';

const dir = join(__dirname, '..', '..', 'test-cases');
const allHeirs: Heirs[] = readdirSync(dir)
  .filter((f) => /^test-case-\d+\.json$/.test(f))
  .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')))
  .filter((tc) => tc.heirs.length)
  .map((tc) => Object.fromEntries(tc.heirs.map((h: { heir: string; count: number }) => [h.heir, h.count])));

describe('rules text', () => {
  it('parses all 44 rules in both languages', () => {
    expect(ruleCount('en')).toBe(44);
    expect(ruleCount('ar')).toBe(44);
  });

  it('keeps the rule 14 ranking inside rule 14, not rule 1', () => {
    expect(ruleText('1', 'en')).toMatch(/^1\) Husband/);
    expect(ruleText('14', 'en')).toContain('Paternal Grandfather');
    expect(ruleText('14', 'ar')).toContain('ابن الأخ الشقيق');
  });

  it('finds lettered sub-rules in Arabic', () => {
    expect(ruleText('2b', 'ar')).toContain('ب. تأخذ الثمن');
    expect(ruleText('13e', 'ar')).toContain('هـ. الجد يحجب');
    expect(ruleIdLabel('13e', 'ar')).toBe('13هـ');
  });
});

describe('every step of every reference case renders in both languages', () => {
  const steps = allHeirs.flatMap((h) => calculate(h).steps);
  const extra = [
    calculate({ Wife: 1 }).steps, // spouse only (Rule 26)
    calculate({ GrandFather: 1, FullBrother: 2, FullSister: 1 }).steps,
    calculate({ GrandFather: 1, FullSister: 2, PaternalBrother: 1 }).steps,
  ].flat();

  it('has text and rule text for every step', () => {
    for (const step of [...steps, ...extra]) {
      for (const lang of ['en', 'ar'] as const) {
        const text = formatStep(step, lang);
        expect(text.length, `${step.key} ${lang}`).toBeGreaterThan(5);
        expect(text).not.toMatch(/undefined|NaN|\[object/);
        if (lang === 'ar') expect(text).toMatch(/[؀-ۿ]/);
        expect(ruleText(step.rule, lang), `rule ${step.rule} ${lang}`).not.toBe('');
      }
    }
  });
});

describe('Arabic gender agreement', () => {
  it('uses لكل واحدة for female heirs and لكل واحد for male heirs', () => {
    const step = calculate({ Wife: 1, Son: 2, Daughter: 2, Mother: 1 }, 'male').steps.find((s) => s.key === 'splitResult')!;
    expect(formatStep(step, 'ar')).toContain('الابنان: \u206617/36\u2069 إجمالًا (\u206617/72\u2069 لكل واحد)');
    expect(formatStep(step, 'ar')).toContain('البنتان: \u206617/72\u2069 إجمالًا (\u206617/144\u2069 لكل واحدة)');
  });
});

describe('Arabic blocked wording agrees with the heir', () => {
  it('uses محجوبة / محجوبتان / محجوب', () => {
    const steps = calculate({ Son: 1, GrandDaughter: 1, FullSister: 2, FullBrother: 1 }, 'male').steps;
    const text = steps.filter((s) => s.key === 'block').map((s) => formatStep(s, 'ar'));
    expect(text).toContain('بنت الابن: محجوبة حجبًا كاملًا بوجود الابن.');
    expect(text).toContain('الأختان الشقيقتان: محجوبتان حجبًا كاملًا بوجود الابن.');
    expect(text).toContain('الأخ الشقيق: محجوب حجبًا كاملًا بوجود الابن.');
  });
});

describe('Arabic genitive after بين / بوجود', () => {
  it('uses the genitive dual', () => {
    const steps = calculate({ Son: 3, Daughter: 2 }, 'male').steps;
    expect(formatStep(steps.find((s) => s.key === 'joint')!, 'ar')).toBe('تعصيب مشترك بين البنين والبنتين.');
    const block = calculate({ Son: 2, FullUncle: 1 }, 'male').steps.find((s) => s.key === 'block')!;
    expect(formatStep(block, 'ar')).toBe('العم الشقيق: محجوب حجبًا كاملًا بوجود الابنين.');
    expect(heirName('GrandDaughter', 2, 'ar', true)).toBe('بنتي الابن');
    expect(heirName('FullSister', 2, 'ar', true)).toBe('الأختين الشقيقتين');
    expect(heirName('Son', 3, 'ar')).toBe('البنين');
  });
});

describe('heir names and notes', () => {
  it('has Arabic singular, dual and plural names and notes for every heir', () => {
    for (const h of HEIR_TYPES as readonly HeirType[]) {
      for (const n of [1, 2, 3]) expect(heirName(h, n, 'ar')).toMatch(/[؀-ۿ]/);
      expect(heirNote(h, 'ar')).toMatch(/[؀-ۿ]/);
    }
    expect(heirName('Son', 2, 'ar')).toBe('الابنان');
    expect(heirName('Daughter', 3, 'ar')).toBe('البنات');
  });
});
