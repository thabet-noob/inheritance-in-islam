import { HeirType } from '../engine/heirs';

// Tree layout after img/standard-heirs.png: 6 lineage columns x 5 generations.
export interface Slot {
  key: string;
  area: string; // grid-area: row-start / col-start / row-end / col-end
  order: number; // order in the single-column mobile layout
  groups: HeirType[] | 'deceased';
  row?: boolean; // place the groups side by side instead of stacked
}

export const SLOTS: Slot[] = [
  { key: 'gf', area: '1 / 3 / 2 / 4', order: 9, groups: ['GrandFather'] },
  { key: 'pgm', area: '1 / 4 / 2 / 5', order: 10, groups: ['PaternalGrandMother'] },
  { key: 'mgm', area: '1 / 6 / 2 / 7', order: 11, groups: ['MaternalGrandMother'] },
  { key: 'puncle', area: '2 / 1 / 3 / 2', order: 22, groups: ['PaternalUncle'] },
  { key: 'uncle', area: '2 / 2 / 3 / 3', order: 21, groups: ['FullUncle'] },
  { key: 'father', area: '2 / 3 / 3 / 5', order: 7, groups: ['Father'] },
  { key: 'mother', area: '2 / 5 / 3 / 7', order: 8, groups: ['Mother'] },
  { key: 'pcousin', area: '3 / 1 / 4 / 2', order: 24, groups: ['PaternalCousin'] },
  { key: 'cousin', area: '3 / 2 / 4 / 3', order: 23, groups: ['FullCousin'] },
  { key: 'psib', area: '3 / 3 / 4 / 4', order: 14, groups: ['PaternalBrother', 'PaternalSister'] },
  { key: 'fsib', area: '3 / 4 / 4 / 5', order: 13, groups: ['FullBrother', 'FullSister'] },
  { key: 'deceased', area: '3 / 5 / 4 / 6', order: 1, groups: 'deceased' },
  { key: 'msib', area: '3 / 6 / 4 / 7', order: 15, groups: ['MaternalBrother', 'MaternalSister'] },
  { key: 'pcson', area: '4 / 1 / 5 / 2', order: 26, groups: ['PaternalCousinsSon'] },
  { key: 'cson', area: '4 / 2 / 5 / 3', order: 25, groups: ['FullCousinsSon'] },
  { key: 'pneph', area: '4 / 3 / 5 / 4', order: 18, groups: ['PaternalNephew'] },
  { key: 'neph', area: '4 / 4 / 5 / 5', order: 17, groups: ['FullNephew'] },
  { key: 'children', area: '4 / 5 / 5 / 7', order: 2, groups: ['Son', 'Daughter'], row: true },
  { key: 'pcgson', area: '5 / 1 / 6 / 2', order: 28, groups: ['PaternalCousinsGrandSon'] },
  { key: 'cgson', area: '5 / 2 / 6 / 3', order: 27, groups: ['FullCousinsGrandSon'] },
  { key: 'pnephson', area: '5 / 3 / 6 / 4', order: 20, groups: ['PaternalNephewsSon'] },
  { key: 'nephson', area: '5 / 4 / 6 / 5', order: 19, groups: ['FullNephewsSon'] },
  { key: 'grandchildren', area: '5 / 5 / 6 / 7', order: 3, groups: ['GrandSon', 'GrandDaughter'], row: true },
];

export const ALWAYS_VISIBLE = new Set<HeirType>(['Husband', 'Wife', 'Son', 'Daughter', 'Father', 'Mother']);

// Chart colour by relation family. Fixed mapping (colour follows the entity, never its rank),
// using the validated 8-slot categorical palette in fixed order.
export const FAMILIES = [
  { key: 'spouse', label: 'Spouse', types: ['Husband', 'Wife'] },
  { key: 'children', label: 'Children', types: ['Son', 'Daughter'] },
  { key: 'grandchildren', label: 'Grandchildren', types: ['GrandSon', 'GrandDaughter'] },
  { key: 'parents', label: 'Parents', types: ['Father', 'Mother'] },
  { key: 'grandparents', label: 'Grandparents', types: ['GrandFather', 'PaternalGrandMother', 'MaternalGrandMother'] },
  { key: 'siblings', label: 'Full & paternal siblings', types: ['FullBrother', 'FullSister', 'PaternalBrother', 'PaternalSister'] },
  { key: 'maternal', label: 'Maternal siblings', types: ['MaternalBrother', 'MaternalSister'] },
  { key: 'distant', label: 'Nephews, uncles & cousins', types: [] as string[] },
] as const;

export function familyIndex(type: HeirType): number {
  const i = FAMILIES.findIndex((f) => (f.types as readonly string[]).includes(type));
  return i < 0 ? FAMILIES.length - 1 : i;
}
