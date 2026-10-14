import { calculate } from './calculate';
import { Gender, HeirType, Heirs } from './heirs';

export interface Relevance {
  relevant: boolean;
  blockedBy?: HeirType;
  rule?: string;
}

/**
 * A heir group is relevant if adding 1 or 2 of them to the current selection would change
 * any share. Two are tried because blocked siblings can still reduce the mother's share (Rule 6).
 */
export function relevance(heirs: Heirs, gender: Gender, type: HeirType): Relevance {
  const base = calculate(heirs, gender);
  const baseShares = new Map(base.categories.map((c) => [c.heir, c.share]));
  let blockedBy: HeirType | undefined;
  let rule: string | undefined;
  for (const k of [1, 2]) {
    const trial = calculate({ ...heirs, [type]: (heirs[type] ?? 0) + k }, gender);
    for (const c of trial.categories) {
      if (c.heir === type) {
        if (c.share.isPositive()) return { relevant: true };
        if (c.blocked && !blockedBy) {
          blockedBy = c.blocked.by;
          rule = c.blocked.rule;
        }
      } else if (!c.share.eq(baseShares.get(c.heir)!)) {
        return { relevant: true };
      }
    }
  }
  return { relevant: false, blockedBy, rule };
}
