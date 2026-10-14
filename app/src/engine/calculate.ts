// Inheritance calculation engine. Pure functions, no UI imports.
// Rule numbers refer to rules/rules.txt; behaviour is matched to the reference
// calculator's test cases (see ANALYSIS.md).

import { Fraction, F } from './fraction';
import { DISTANT_AGNATES, Gender, HEIR_TYPES, HeirType, Heirs, SIBLINGS } from './heirs';

export type HeirRef = { heir: HeirType; count: number };
export type SharePart = { heir: HeirRef; share: string; each: string };
export type Param = string | number | boolean | HeirRef | SharePart[];

export type MessageKey =
  | 'block' | 'prescribed' | 'psExhausted' | 'mat1' | 'mat3' | 'mat33'
  | 'joint' | 'ratio' | 'splitResult' | 'umar1' | 'umar2'
  | 'gf23' | 'gf23d' | 'gf23e' | 'akd18a' | 'akd24' | 'gf23cFull' | 'gf23g' | 'gf23gRest' | 'gf23cPaternal'
  | 'residue' | 'never17' | 'taseeb16a' | 'onlyHeir' | 'mush22' | 'mush22a'
  | 'state27' | 'awl' | 'spouse26' | 'radd';

/** A calculation step. The text is rendered per language from `key` + `p` (see src/i18n/messages.ts). */
export interface Step {
  rule: string; // e.g. "2b", "14", "13a"
  key: MessageKey;
  p: Record<string, Param>;
}

export interface Blocked {
  heir: HeirType;
  by: HeirType;
  rule: string;
}

export type ShareStatus = 'share' | 'blocked' | 'nothing-left';

export interface CategoryShare {
  heir: HeirType;
  count: number;
  share: Fraction; // total for the whole category
  perPerson: Fraction;
  status: ShareStatus;
  blocked?: Blocked;
}

export interface Flags {
  awl: boolean;
  radd: boolean;
  umar: boolean;
  mushtaraka: boolean;
  grandfatherSpecial: boolean;
  akdariyya: boolean;
  spouseReturn: boolean;
  stateTakesAll: boolean;
}

export interface Result {
  categories: CategoryShare[];
  blocked: Blocked[];
  steps: Step[];
  flags: Flags;
}

export function calculate(input: Heirs, gender?: Gender): Result {
  const counts = {} as Record<HeirType, number>;
  for (const h of HEIR_TYPES) counts[h] = Math.max(0, Math.floor(input[h] ?? 0));
  const deceased: Gender = gender ?? (counts.Husband > 0 ? 'female' : 'male');
  if (deceased === 'male') counts.Husband = 0;
  else counts.Wife = 0;
  counts.Husband = Math.min(counts.Husband, 1);

  const steps: Step[] = [];
  const flags: Flags = {
    awl: false,
    radd: false,
    umar: false,
    mushtaraka: false,
    grandfatherSpecial: false,
    akdariyya: false,
    spouseReturn: false,
    stateTakesAll: false,
  };
  const ref = (h: HeirType): HeirRef => ({ heir: h, count: counts[h] });
  const step = (rule: string, key: MessageKey, p: Record<string, Param> = {}) => steps.push({ rule, key, p });

  // ---------------------------------------------------------------- blocking
  const blocked = new Map<HeirType, Blocked>();
  const present = (h: HeirType) => counts[h] > 0;
  const active = (h: HeirType) => present(h) && !blocked.has(h);
  const block = (by: HeirType, rule: string, list: HeirType[]) => {
    for (const h of list) {
      if (present(h) && !blocked.has(h)) {
        blocked.set(h, { heir: h, by, rule });
        step(rule, 'block', { by: ref(by), heir: ref(h) });
      }
    }
  };
  const femaleDescendant = present('Daughter') || present('GrandDaughter');

  for (const h of HEIR_TYPES) {
    if (!active(h)) continue;
    switch (h) {
      case 'Son':
        block(h, '13a', ['GrandSon', 'GrandDaughter', ...SIBLINGS, ...DISTANT_AGNATES]);
        break;
      case 'Daughter':
        // Two or more daughters fill the 2/3 zone; granddaughters get nothing unless a grandson makes them residuary.
        if (counts.Daughter >= 2 && !present('GrandSon')) block(h, '30', ['GrandDaughter']);
        break;
      case 'GrandSon':
        block(h, '13b', [...SIBLINGS, ...DISTANT_AGNATES]);
        break;
      case 'Father':
        block(h, '13c', ['GrandFather', 'PaternalGrandMother', ...SIBLINGS, ...DISTANT_AGNATES]);
        break;
      case 'Mother':
        block(h, '13d', ['PaternalGrandMother', 'MaternalGrandMother']);
        break;
      case 'GrandFather':
        // Rule 12: maternal siblings are excluded by any male paternal ancestor.
        block(h, '12', ['MaternalBrother', 'MaternalSister']);
        block(h, '13e', DISTANT_AGNATES);
        break;
      case 'FullBrother':
        block(h, '13f', ['PaternalBrother', 'PaternalSister', ...DISTANT_AGNATES]);
        break;
      case 'FullSister':
        if (femaleDescendant) block(h, '13g', ['PaternalBrother', 'PaternalSister', ...DISTANT_AGNATES]);
        break;
      case 'PaternalBrother':
        block(h, '13h', DISTANT_AGNATES);
        break;
      case 'PaternalSister':
        if (femaleDescendant) block(h, '13i', DISTANT_AGNATES);
        break;
      default: {
        const i = DISTANT_AGNATES.indexOf(h);
        if (i >= 0 && i < DISTANT_AGNATES.length - 1) {
          block(h, `13${String.fromCharCode('j'.charCodeAt(0) + i)}`, DISTANT_AGNATES.slice(i + 1));
        }
      }
    }
  }
  // Note: maternal siblings are NOT blocked by daughters/granddaughters. This follows the site's
  // Rule 12 ("does not have any male offspring") and reference test case #34. Classical fiqh
  // would have any descendant block them.

  // ---------------------------------------------------------- prescribed shares
  const share = new Map<HeirType, Fraction>();
  const get = (h: HeirType) => share.get(h) ?? Fraction.ZERO;
  const prescribe = (h: HeirType, f: Fraction, rule: string, extra: '' | 'withDaughter' | 'withFullSister' = '') => {
    share.set(h, f);
    step(rule, 'prescribed', { heir: ref(h), f: f.toString(), extra });
  };

  const hasDesc = active('Son') || active('Daughter') || active('GrandSon') || active('GrandDaughter');
  const hasFemaleDesc = active('Daughter') || active('GrandDaughter');
  const siblingCount = SIBLINGS.reduce((s, h) => s + counts[h], 0); // blocked siblings still count (Rule 6)
  const spouse: HeirType | null = active('Husband') ? 'Husband' : active('Wife') ? 'Wife' : null;

  if (active('Husband')) prescribe('Husband', hasDesc ? F(1, 4) : F(1, 2), hasDesc ? '1b' : '1a');
  if (active('Wife')) prescribe('Wife', hasDesc ? F(1, 8) : F(1, 4), hasDesc ? '2b' : '2a');

  if (active('Daughter') && !active('Son')) {
    counts.Daughter === 1 ? prescribe('Daughter', F(1, 2), '3a') : prescribe('Daughter', F(2, 3), '3b');
  }
  if (active('GrandDaughter') && !active('GrandSon')) {
    if (!active('Daughter')) {
      counts.GrandDaughter === 1 ? prescribe('GrandDaughter', F(1, 2), '4a') : prescribe('GrandDaughter', F(2, 3), '4b');
    } else {
      prescribe('GrandDaughter', F(1, 6), '4c', 'withDaughter');
    }
  }

  if (active('Father') && hasDesc) prescribe('Father', F(1, 6), '5a');

  const umar = active('Mother') && active('Father') && spouse !== null && !hasDesc && siblingCount < 2;
  if (active('Mother') && !umar) {
    !hasDesc && siblingCount < 2 ? prescribe('Mother', F(1, 3), '6a') : prescribe('Mother', F(1, 6), '6b');
  }

  if (active('GrandFather') && hasDesc) prescribe('GrandFather', F(1, 6), '7a');

  const pgm = active('PaternalGrandMother');
  const mgm = active('MaternalGrandMother');
  if (pgm) prescribe('PaternalGrandMother', mgm ? F(1, 12) : F(1, 6), mgm ? '8b' : '8a');
  if (mgm) prescribe('MaternalGrandMother', pgm ? F(1, 12) : F(1, 6), pgm ? '9b' : '9a');

  const gfSpecial =
    active('GrandFather') &&
    !hasDesc &&
    (active('FullBrother') || active('FullSister') || active('PaternalBrother') || active('PaternalSister'));

  if (active('FullSister') && !active('FullBrother') && !hasFemaleDesc && !gfSpecial) {
    counts.FullSister === 1 ? prescribe('FullSister', F(1, 2), '10a') : prescribe('FullSister', F(2, 3), '10b');
  }
  if (active('PaternalSister') && !active('PaternalBrother') && !hasFemaleDesc && !gfSpecial) {
    if (!active('FullSister')) {
      counts.PaternalSister === 1
        ? prescribe('PaternalSister', F(1, 2), '11a')
        : prescribe('PaternalSister', F(2, 3), '11b');
    } else if (counts.FullSister === 1) {
      prescribe('PaternalSister', F(1, 6), '11c', 'withFullSister');
    } else {
      blocked.set('PaternalSister', { heir: 'PaternalSister', by: 'FullSister', rule: '30f' });
      step('30f', 'psExhausted', { heir: ref('PaternalSister') });
    }
  }

  const matHeads = (active('MaternalBrother') ? counts.MaternalBrother : 0) + (active('MaternalSister') ? counts.MaternalSister : 0);
  if (matHeads > 0) {
    const total = matHeads === 1 ? F(1, 6) : F(1, 3);
    const rule = matHeads === 1 ? '12a' : '12b';
    for (const h of ['MaternalBrother', 'MaternalSister'] as HeirType[]) {
      if (active(h)) share.set(h, total.mul(counts[h]).div(matHeads));
    }
    if (matHeads === 1) {
      step(rule, 'mat1', { heir: ref(active('MaternalBrother') ? 'MaternalBrother' : 'MaternalSister') });
    } else {
      step(rule, 'mat3');
      step('33', 'mat33');
    }
  }

  const total = () => Fraction.sum([...share.values()]);
  const split2to1 = (amount: Fraction, male: HeirType, female: HeirType) => {
    const m = active(male) ? counts[male] : 0;
    const f = active(female) ? counts[female] : 0;
    const units = 2 * m + f;
    if (units === 0) return;
    if (m) share.set(male, get(male).add(amount.mul(2 * m).div(units)));
    if (f) share.set(female, get(female).add(amount.mul(f).div(units)));
  };
  const describeSplit = (male: HeirType, female: HeirType, rule: string) => {
    step('44', 'joint', { male: ref(male), female: ref(female) });
    step('15', 'ratio', { male: ref(male), female: ref(female) });
    const part = (h: HeirType): SharePart => ({ heir: ref(h), share: get(h).toString(), each: get(h).div(counts[h]).toString() });
    step(rule, 'splitResult', { parts: [part(male), part(female)] });
  };

  // ------------------------------------------------------------ special cases
  if (umar) {
    // Rule 21: spouse + father + mother, no offspring, fewer than 2 siblings.
    flags.umar = true;
    const rest = Fraction.ONE.sub(get(spouse!));
    share.set('Mother', rest.div(3));
    share.set('Father', rest.sub(rest.div(3)));
    step('21', 'umar1');
    step('21', 'umar2', { mother: get('Mother').toString(), father: get('Father').toString() });
  } else if (gfSpecial) {
    // Rule 23: grandfather with full/paternal siblings, no father or offspring.
    flags.grandfatherSpecial = true;
    const R = Fraction.ONE.sub(total());
    const nFB = counts.FullBrother;
    const nFS = counts.FullSister;
    const nPB = counts.PaternalBrother; // paternal siblings are counted against the grandfather even if a full brother excludes them
    const nPS = counts.PaternalSister;
    const units = 2 + 2 * (nFB + nPB) + nFS + nPS;
    const A = F(1, 6);
    const B = R.div(3);
    const C = R.mul(2).div(units);
    let gf = Fraction.max(A, B, C);
    step('23', 'gf23');
    step('23d', 'gf23d', { B: B.toString(), C: C.toString(), gf: gf.toString() });
    if (gf.gt(R)) {
      gf = F(1, 6);
      step('23e', 'gf23e');
    }
    const left = R.sub(gf).isPositive() ? R.sub(gf) : Fraction.ZERO;
    const brothers = nFB + nPB;

    if (brothers === 0 && left.isZero() && (nFS > 0 || nPS > 0)) {
      // Akdariyya (Rules 18a, 24): sisters take their prescribed share, 'Awl, then grandfather & sisters pool and split 2:1.
      flags.akdariyya = true;
      share.set('GrandFather', F(1, 6));
      step('7a', 'prescribed', { heir: ref('GrandFather'), f: '1/6', extra: '' });
      if (nFS > 0) prescribe('FullSister', nFS === 1 ? F(1, 2) : F(2, 3), nFS === 1 ? '10a' : '10b');
      if (nPS > 0 && active('PaternalSister')) {
        if (nFS === 0) prescribe('PaternalSister', nPS === 1 ? F(1, 2) : F(2, 3), nPS === 1 ? '11a' : '11b');
        else if (nFS === 1) prescribe('PaternalSister', F(1, 6), '11c');
      }
      applyAwl();
      const sisters = (['FullSister', 'PaternalSister'] as HeirType[]).filter((h) => get(h).isPositive());
      const pool = get('GrandFather').add(Fraction.sum(sisters.map(get)));
      const u = 2 + sisters.reduce((s, h) => s + counts[h], 0);
      share.set('GrandFather', pool.mul(2).div(u));
      for (const h of sisters) share.set(h, pool.mul(counts[h]).div(u));
      step('18a', 'akd18a');
      step('24', 'akd24', {
        gf: get('GrandFather').toString(),
        parts: sisters.map((h) => ({ heir: ref(h), share: get(h).toString(), each: get(h).div(counts[h]).toString() })),
      });
    } else {
      share.set('GrandFather', gf);
      if (left.isPositive()) {
        if (nFB > 0) {
          split2to1(left, 'FullBrother', 'FullSister');
          step('23c', 'gf23cFull', { left: left.toString(), mixed: nFS > 0 });
        } else if (nFS > 0) {
          const cap = nFS === 1 ? F(1, 2) : F(2, 3);
          const fs = Fraction.min(left, cap);
          share.set('FullSister', fs);
          const rest = left.sub(fs);
          step('23g', 'gf23g', { heir: ref('FullSister'), cap: cap.toString(), left: left.toString(), fs: fs.toString() });
          if (rest.isPositive()) {
            if (active('PaternalBrother')) {
              split2to1(rest, 'PaternalBrother', 'PaternalSister');
              describeSplit('PaternalBrother', 'PaternalSister', '15');
            } else if (active('PaternalSister')) {
              share.set('PaternalSister', rest);
              step('23g', 'gf23gRest', { heir: ref('PaternalSister'), rest: rest.toString() });
            } else {
              share.set('FullSister', fs.add(rest));
            }
          }
        } else {
          split2to1(left, 'PaternalBrother', 'PaternalSister');
          step('23c', 'gf23cPaternal', { left: left.toString() });
        }
      }
      if (total().gt(Fraction.ONE)) applyAwl();
    }
  } else {
    // ---------------------------------------------------- residue or 'Awl
    if (total().gt(Fraction.ONE)) {
      applyAwl();
    } else {
      const residue = Fraction.ONE.sub(total());
      const group = findResiduaries();
      if (residue.isPositive()) {
        step('14', 'residue');
        if (group) {
          const [male, female] = group;
          const heir = male ?? female!;
          if ((heir === 'Father' || heir === 'GrandFather') && !hasDesc && residue.lt(F(1, 6))) {
            // Rule 17: a father or grandfather is never cut off.
            share.set(heir, F(1, 6));
            step('17', 'never17', { heir: ref(heir) });
            if (total().gt(Fraction.ONE)) applyAwl();
          } else if (male && female && active(female)) {
            split2to1(residue, male, female);
            describeSplit(male, female, '15');
          } else if (get(heir).isPositive()) {
            share.set(heir, get(heir).add(residue));
            step('16a', 'taseeb16a', { heir: ref(heir), residue: residue.toString(), total: get(heir).toString() });
          } else {
            share.set(heir, residue);
            step('14', 'onlyHeir', {
              heir: ref(heir),
              residue: residue.toString(),
              withFemale: heir === 'FullSister' || heir === 'PaternalSister',
            });
          }
        } else {
          applyRadd(residue);
        }
      }
    }
  }

  // Rule 22 (Mushtaraka): a full brother may not receive less than a maternal sibling.
  if (active('FullBrother') && matHeads > 0) {
    const perFB = get('FullBrother').div(counts.FullBrother);
    const matTotal = get('MaternalBrother').add(get('MaternalSister'));
    if (perFB.lt(matTotal.div(matHeads))) {
      flags.mushtaraka = true;
      const pool = matTotal.add(get('FullBrother')).add(get('FullSister'));
      const heads = matHeads + counts.FullBrother + (active('FullSister') ? counts.FullSister : 0);
      for (const h of ['FullBrother', 'FullSister', 'MaternalBrother', 'MaternalSister'] as HeirType[]) {
        if (active(h)) share.set(h, pool.mul(counts[h]).div(heads));
      }
      step('22', 'mush22');
      step('22a', 'mush22a', { pool: pool.toString(), heads, each: pool.div(heads).toString() });
    }
  }

  if (!spouse && share.size === 0 && !HEIR_TYPES.some(active)) {
    flags.stateTakesAll = true;
    if (HEIR_TYPES.some(present)) step('27', 'state27');
  }

  // ------------------------------------------------------------------ output
  const categories: CategoryShare[] = HEIR_TYPES.filter(present).map((h) => {
    const s = get(h);
    const b = blocked.get(h);
    return {
      heir: h,
      count: counts[h],
      share: s,
      perPerson: s.div(counts[h]),
      status: b ? 'blocked' : s.isPositive() ? 'share' : 'nothing-left',
      blocked: b,
    };
  });
  return { categories, blocked: [...blocked.values()], steps, flags };

  // ----------------------------------------------------------------- helpers
  function applyAwl() {
    const t = total();
    if (!t.gt(Fraction.ONE)) return;
    flags.awl = true;
    for (const [h, f] of share) share.set(h, f.div(t));
    step('18', 'awl', { t: t.toString() });
  }

  function applyRadd(residue: Fraction) {
    const holders = [...share.entries()].filter(([h, f]) => h !== spouse && f.isPositive());
    if (holders.length === 0) {
      if (spouse) {
        flags.spouseReturn = true;
        share.set(spouse, get(spouse).add(residue));
        step('26', 'spouse26', { heir: ref(spouse), residue: residue.toString() });
      }
      return;
    }
    flags.radd = true;
    const sum = Fraction.sum(holders.map(([, f]) => f));
    const factor = sum.add(residue).div(sum);
    for (const [h, f] of holders) share.set(h, f.mul(factor));
    step('19', 'radd', { residue: residue.toString() });
  }

  function findResiduaries(): [HeirType | null, HeirType | null] | null {
    if (active('Son')) return ['Son', 'Daughter'];
    if (active('GrandSon')) return ['GrandSon', 'GrandDaughter'];
    if (active('Father')) return ['Father', null];
    if (active('FullBrother')) return ['FullBrother', 'FullSister'];
    if (active('FullSister') && hasFemaleDesc) return [null, 'FullSister'];
    if (active('PaternalBrother')) return ['PaternalBrother', 'PaternalSister'];
    if (active('PaternalSister') && hasFemaleDesc) return [null, 'PaternalSister'];
    if (active('GrandFather')) return ['GrandFather', null];
    const agnate = DISTANT_AGNATES.find(active);
    return agnate ? [agnate, null] : null;
  }
}
