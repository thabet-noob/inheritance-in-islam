// The 29 standard heirs (img/standard-heirs.png), in the order of the original input form.

export const HEIR_TYPES = [
  'Husband',
  'Wife',
  'Son',
  'Daughter',
  'GrandSon',
  'GrandDaughter',
  'Father',
  'Mother',
  'GrandFather',
  'PaternalGrandMother',
  'MaternalGrandMother',
  'FullBrother',
  'FullSister',
  'PaternalBrother',
  'PaternalSister',
  'MaternalBrother',
  'MaternalSister',
  'FullNephew',
  'PaternalNephew',
  'FullNephewsSon',
  'PaternalNephewsSon',
  'FullUncle',
  'PaternalUncle',
  'FullCousin',
  'PaternalCousin',
  'FullCousinsSon',
  'PaternalCousinsSon',
  'FullCousinsGrandSon',
  'PaternalCousinsGrandSon',
] as const;

export type HeirType = (typeof HEIR_TYPES)[number];
export type Heirs = Partial<Record<HeirType, number>>;
export type Gender = 'male' | 'female';

export interface HeirInfo {
  label: string; // singular display name
  plural: string;
  number: number; // number in the standard-heirs diagram / input form
  male: boolean;
  multi: boolean; // can have more than one person
  max?: number;
  note: string; // eligibility note from the original input form
}

export const HEIR_INFO: Record<HeirType, HeirInfo> = {
  Husband: { label: 'Husband', plural: 'Husband', number: 1, male: true, multi: false, note: 'Must be legally married. Secret or undocumented marriages are not eligible.' },
  Wife: { label: 'Wife', plural: 'Wives', number: 2, male: false, multi: true, max: 4, note: 'Multiple wives are eligible. Secret or undocumented marriages are not eligible. A divorced wife is eligible if the iddah period has not yet completed.' },
  Son: { label: 'Son', plural: 'Sons', number: 3, male: true, multi: true, note: 'Adopted son, step-son, or illegitimate son is not eligible.' },
  Daughter: { label: 'Daughter', plural: 'Daughters', number: 4, male: false, multi: true, note: 'Adopted daughter, step-daughter, or illegitimate daughter is not eligible.' },
  GrandSon: { label: 'Grandson', plural: 'Grandsons', number: 5, male: true, multi: true, note: "Only son's sons are eligible. Daughter's sons are not eligible." },
  GrandDaughter: { label: 'Granddaughter', plural: 'Granddaughters', number: 6, male: false, multi: true, note: "Only son's daughters are eligible. Daughter's daughters are not eligible." },
  Father: { label: 'Father', plural: 'Father', number: 7, male: true, multi: false, note: 'Illegitimate father, or step-father is not eligible.' },
  Mother: { label: 'Mother', plural: 'Mother', number: 8, male: false, multi: false, note: 'Illegitimate mother, or step-mother is not eligible.' },
  GrandFather: { label: 'Grandfather', plural: 'Grandfather', number: 9, male: true, multi: false, note: "Only father's father is eligible. Mother's father is not eligible." },
  PaternalGrandMother: { label: 'Paternal Grandmother', plural: 'Paternal Grandmother', number: 10, male: false, multi: false, note: "Father's mother is eligible." },
  MaternalGrandMother: { label: 'Maternal Grandmother', plural: 'Maternal Grandmother', number: 11, male: false, multi: false, note: "Mother's mother is eligible." },
  FullBrother: { label: 'Full Brother', plural: 'Full Brothers', number: 12, male: true, multi: true, note: 'Brothers who share the same father and the mother with the deceased.' },
  FullSister: { label: 'Full Sister', plural: 'Full Sisters', number: 13, male: false, multi: true, note: 'Sisters who share the same father and the mother with the deceased.' },
  PaternalBrother: { label: 'Paternal Brother', plural: 'Paternal Brothers', number: 14, male: true, multi: true, note: 'Brothers who share the same father, but a different mother.' },
  PaternalSister: { label: 'Paternal Sister', plural: 'Paternal Sisters', number: 15, male: false, multi: true, note: 'Sisters who share the same father, but a different mother.' },
  MaternalBrother: { label: 'Maternal Brother', plural: 'Maternal Brothers', number: 16, male: true, multi: true, note: 'Brothers who share the same mother, but a different father.' },
  MaternalSister: { label: 'Maternal Sister', plural: 'Maternal Sisters', number: 17, male: false, multi: true, note: 'Sisters who share the same mother, but a different father.' },
  FullNephew: { label: 'Nephew', plural: 'Nephews', number: 18, male: true, multi: true, note: "Only full brother's son is eligible. Sister's son is not eligible." },
  PaternalNephew: { label: 'Paternal Nephew', plural: 'Paternal Nephews', number: 19, male: true, multi: true, note: "Only paternal brother's son is eligible. Paternal brother's daughter is not eligible." },
  FullNephewsSon: { label: "Nephew's Son", plural: "Nephew's Sons", number: 20, male: true, multi: true, note: "Full brother's son's son." },
  PaternalNephewsSon: { label: "Paternal Nephew's Son", plural: "Paternal Nephew's Sons", number: 21, male: true, multi: true, note: "Paternal brother's son's son." },
  FullUncle: { label: 'Uncle', plural: 'Uncles', number: 22, male: true, multi: true, note: "Father's full brother." },
  PaternalUncle: { label: 'Paternal Uncle', plural: 'Paternal Uncles', number: 23, male: true, multi: true, note: "Father's paternal brother." },
  FullCousin: { label: 'Cousin', plural: 'Cousins', number: 24, male: true, multi: true, note: "Father's full brother's son." },
  PaternalCousin: { label: 'Paternal Cousin', plural: 'Paternal Cousins', number: 25, male: true, multi: true, note: "Father's paternal brother's son." },
  FullCousinsSon: { label: "Cousin's Son", plural: "Cousin's Sons", number: 26, male: true, multi: true, note: "Father's full brother's son's son." },
  PaternalCousinsSon: { label: "Paternal Cousin's Son", plural: "Paternal Cousin's Sons", number: 27, male: true, multi: true, note: "Father's paternal brother's son's son." },
  FullCousinsGrandSon: { label: "Cousin's Grandson", plural: "Cousin's Grandsons", number: 28, male: true, multi: true, note: "Father's full brother's son's son's son." },
  PaternalCousinsGrandSon: { label: "Paternal Cousin's Grandson", plural: "Paternal Cousin's Grandsons", number: 29, male: true, multi: true, note: "Father's paternal brother's son's son's son." },
};

/** Distant male agnates, in residuary rank order (Rule 14, ranks 7-18). Each blocks all after it (Rule 13j-t). */
export const DISTANT_AGNATES: HeirType[] = [
  'FullNephew',
  'PaternalNephew',
  'FullNephewsSon',
  'PaternalNephewsSon',
  'FullUncle',
  'PaternalUncle',
  'FullCousin',
  'PaternalCousin',
  'FullCousinsSon',
  'PaternalCousinsSon',
  'FullCousinsGrandSon',
  'PaternalCousinsGrandSon',
];

export const SIBLINGS: HeirType[] = [
  'FullBrother',
  'FullSister',
  'PaternalBrother',
  'PaternalSister',
  'MaternalBrother',
  'MaternalSister',
];
