import { HEIR_INFO, HeirType } from '../engine/heirs';

export type Lang = 'en' | 'ar';

// Arabic heir names: [singular, dual, plural], definite forms so they read naturally in sentences.
const AR_NAMES: Record<HeirType, [string, string, string]> = {
  Husband: ['الزوج', 'الزوج', 'الزوج'],
  Wife: ['الزوجة', 'الزوجتان', 'الزوجات'],
  Son: ['الابن', 'الابنان', 'البنين'],
  Daughter: ['البنت', 'البنتان', 'البنات'],
  GrandSon: ['ابن الابن', 'ابنا الابن', 'أبناء الابن'],
  GrandDaughter: ['بنت الابن', 'بنتا الابن', 'بنات الابن'],
  Father: ['الأب', 'الأب', 'الأب'],
  Mother: ['الأم', 'الأم', 'الأم'],
  GrandFather: ['الجد', 'الجد', 'الجد'],
  PaternalGrandMother: ['الجدة لأب', 'الجدتان لأب', 'الجدات لأب'],
  MaternalGrandMother: ['الجدة لأم', 'الجدتان لأم', 'الجدات لأم'],
  FullBrother: ['الأخ الشقيق', 'الأخوان الشقيقان', 'الإخوة الأشقاء'],
  FullSister: ['الأخت الشقيقة', 'الأختان الشقيقتان', 'الأخوات الشقيقات'],
  PaternalBrother: ['الأخ لأب', 'الأخوان لأب', 'الإخوة لأب'],
  PaternalSister: ['الأخت لأب', 'الأختان لأب', 'الأخوات لأب'],
  MaternalBrother: ['الأخ لأم', 'الأخوان لأم', 'الإخوة لأم'],
  MaternalSister: ['الأخت لأم', 'الأختان لأم', 'الأخوات لأم'],
  FullNephew: ['ابن الأخ الشقيق', 'ابنا الأخ الشقيق', 'أبناء الأخ الشقيق'],
  PaternalNephew: ['ابن الأخ لأب', 'ابنا الأخ لأب', 'أبناء الأخ لأب'],
  FullNephewsSon: ['ابن ابن الأخ الشقيق', 'ابنا ابن الأخ الشقيق', 'أبناء ابن الأخ الشقيق'],
  PaternalNephewsSon: ['ابن ابن الأخ لأب', 'ابنا ابن الأخ لأب', 'أبناء ابن الأخ لأب'],
  FullUncle: ['العم الشقيق', 'العمان الشقيقان', 'الأعمام الأشقاء'],
  PaternalUncle: ['العم لأب', 'العمان لأب', 'الأعمام لأب'],
  FullCousin: ['ابن العم الشقيق', 'ابنا العم الشقيق', 'أبناء العم الشقيق'],
  PaternalCousin: ['ابن العم لأب', 'ابنا العم لأب', 'أبناء العم لأب'],
  FullCousinsSon: ['ابن ابن العم الشقيق', 'ابنا ابن العم الشقيق', 'أبناء ابن العم الشقيق'],
  PaternalCousinsSon: ['ابن ابن العم لأب', 'ابنا ابن العم لأب', 'أبناء ابن العم لأب'],
  FullCousinsGrandSon: ['ابن ابن ابن العم الشقيق', 'ابنا ابن ابن العم الشقيق', 'أبناء ابن ابن ابن العم الشقيق'],
  PaternalCousinsGrandSon: ['ابن ابن ابن العم لأب', 'ابنا ابن ابن ابن العم لأب', 'أبناء ابن ابن ابن العم لأب'],
};

const AR_NOTES: Record<HeirType, string> = {
  Husband: 'يشترط عقد زواج شرعي موثق. الزواج السري أو غير الموثق لا يُعتد به.',
  Wife: 'يجوز تعدد الزوجات. الزواج السري أو غير الموثق لا يُعتد به. المطلقة رجعيًا ترث ما دامت في العدة.',
  Son: 'الابن بالتبني أو ابن الزوج/الزوجة أو الابن غير الشرعي لا يرث.',
  Daughter: 'البنت بالتبني أو بنت الزوج/الزوجة أو البنت غير الشرعية لا ترث.',
  GrandSon: 'أبناء الابن فقط. أبناء البنت لا يرثون.',
  GrandDaughter: 'بنات الابن فقط. بنات البنت لا يرثن.',
  Father: 'الأب غير الشرعي أو زوج الأم لا يرث.',
  Mother: 'الأم غير الشرعية أو زوجة الأب لا ترث.',
  GrandFather: 'أبو الأب فقط. أبو الأم لا يرث.',
  PaternalGrandMother: 'أم الأب.',
  MaternalGrandMother: 'أم الأم.',
  FullBrother: 'الإخوة من الأب والأم معًا.',
  FullSister: 'الأخوات من الأب والأم معًا.',
  PaternalBrother: 'الإخوة من الأب فقط، والأم مختلفة.',
  PaternalSister: 'الأخوات من الأب فقط، والأم مختلفة.',
  MaternalBrother: 'الإخوة من الأم فقط، والأب مختلف.',
  MaternalSister: 'الأخوات من الأم فقط، والأب مختلف.',
  FullNephew: 'ابن الأخ الشقيق فقط. ابن الأخت لا يرث.',
  PaternalNephew: 'ابن الأخ لأب فقط. بنت الأخ لأب لا ترث.',
  FullNephewsSon: 'ابن ابن الأخ الشقيق.',
  PaternalNephewsSon: 'ابن ابن الأخ لأب.',
  FullUncle: 'أخو الأب الشقيق.',
  PaternalUncle: 'أخو الأب من الأب.',
  FullCousin: 'ابن أخي الأب الشقيق.',
  PaternalCousin: 'ابن أخي الأب من الأب.',
  FullCousinsSon: 'ابن ابن أخي الأب الشقيق.',
  PaternalCousinsSon: 'ابن ابن أخي الأب من الأب.',
  FullCousinsGrandSon: 'ابن ابن ابن أخي الأب الشقيق.',
  PaternalCousinsGrandSon: 'ابن ابن ابن أخي الأب من الأب.',
};

/** Arabic dual in the genitive/accusative case: الابنان → الابنين، ابنا الابن → ابني الابن. */
const dualGenitive = (name: string) =>
  name
    .split(' ')
    .map((w) => (w.endsWith('ان') ? w.slice(0, -2) + 'ين' : w === 'ابنا' ? 'ابني' : w === 'بنتا' ? 'بنتي' : w))
    .join(' ');

/**
 * Name of a heir type for a given count (singular / dual / plural).
 * `genitive` is for Arabic positions after a preposition or إضافة (بين، بوجود، على…).
 */
export function heirName(h: HeirType, count: number, lang: Lang, genitive = false): string {
  if (lang === 'ar') {
    const [one, two, many] = AR_NAMES[h];
    if (count === 2) return genitive ? dualGenitive(two) : two;
    return count >= 3 ? many : one;
  }
  return count > 1 ? HEIR_INFO[h].plural : HEIR_INFO[h].label;
}

/** «محجوب» agreeing with the heir's gender and number. */
export function arBlocked(h: HeirType, count = 1): string {
  const male = HEIR_INFO[h].male;
  if (count >= 3) return male ? 'محجوبون' : 'محجوبات';
  if (count === 2) return male ? 'محجوبان' : 'محجوبتان';
  return male ? 'محجوب' : 'محجوبة';
}

/** Group title shown above the circles. */
export function groupTitle(h: HeirType, lang: Lang): string {
  return heirName(h, HEIR_INFO[h].multi ? 3 : 1, lang);
}

export function heirNote(h: HeirType, lang: Lang): string {
  return lang === 'ar' ? AR_NOTES[h] : HEIR_INFO[h].note;
}

// Sub-rule letters: English a, b, c… map to the Arabic abjad order أ، ب، ج، د، هـ، و…
export const AR_LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي', 'ك', 'ل', 'م', 'ن', 'س', 'ع', 'ف', 'ص', 'ق', 'ر'];

export function ruleIdLabel(id: string, lang: Lang): string {
  if (lang === 'en') return id;
  const m = /^(\d+)([a-z])?$/.exec(id);
  if (!m) return id;
  return m[1] + (m[2] ? AR_LETTERS[m[2].charCodeAt(0) - 97] : '');
}

/** Wrap left-to-right content (fractions, amounts) so it isn't reordered inside Arabic text. */
export const ltr = (s: string | number) => `⁦${s}⁩`;

const UI = {
  en: {
    title: 'Islamic Inheritance Calculator',
    subtitle: 'Click a circle to mark a relative alive. Shares are calculated instantly in your browser.',
    estate: 'Estate',
    estateAmount: 'Estate amount',
    bequest: 'Bequest',
    bequestHint: (max: string) => `Optional. A bequest may not exceed one third of the estate: up to ${max}.`,
    bequestCapped: (max: string) =>
      `The bequest exceeds one third, so it is reduced to ${max}. Any excess needs the heirs' consent.`,
    bequestBanner: (b: string, net: string) => `The bequest (${b}) is paid first; the remaining ${net} is divided among the heirs.`,
    tileBequest: 'Bequest',
    bequestRelation: 'Bequest (up to one third)',
    tableNote: "Heirs' fractions are shares of the net estate after the bequest; percentages are of the whole estate.",
    tileNet: 'Net estate for the heirs',
    currency: 'Currency',
    showAll: 'Show all relatives',
    clearAll: 'Clear all',
    reset: 'Reset example',
    language: 'العربية',
    languageLabel: 'Switch to Arabic',
    deceased: 'Deceased',
    deceasedGender: 'Gender of the deceased',
    deceasedNameLabel: 'Name of the deceased',
    deceasedNamePlaceholder: 'Name of the deceased',
    male: 'Male',
    female: 'Female',
    familyTree: 'Family tree',
    notRelevant: 'Not relevant now:',
    blockedByGroup: (who: string, _allFemale: boolean) => `blocked by ${who}`,
    nothingLeftGroup: 'nothing would be left for them',
    showAllLink: 'Show all',
    add: (who: string) => `Add ${who}`,
    max: (n: number) => `Maximum ${n}`,
    remove: (who: string) => `Remove ${who}`,
    rename: 'Click to rename',
    name: 'Name',
    hintOff: (n: string) => `${n}: not marked alive. Click to mark alive.`,
    hintBlocked: (n: string, why: string) => `${n}: ${why}. Click to mark not alive.`,
    hintZero: (n: string) => `${n}: alive, but nothing is left over for this heir. Click to mark not alive.`,
    hintOn: (n: string, f: string, pct: string) => `${n}: ${f} (${pct}). Click to mark not alive.`,
    blockedBy: (who: string, _heir: HeirType) => `Blocked by ${who}`,
    blockedByRule: (who: string, rule: string, title: string, _heir: HeirType) =>
      `Blocked by ${who} (Rule ${rule}${title ? ` – ${title}` : ''})`,
    blockedBadge: (_heir: HeirType) => 'blocked',
    nothingLeft: '0 — nothing left over',
    nothingLeftShort: 'Nothing left over',
    results: 'Results',
    tileEstate: 'Estate',
    tileHeirs: 'Heirs receiving a share',
    tileBlocked: 'Blocked heirs',
    empty: "Click a relative's circle to mark them alive and see how the estate is divided.",
    distribution: 'Distribution',
    barLabel: 'Share of the estate per heir (details in the table below)',
    rulesApplied: 'Rules applied',
    noRules: 'No rules applied yet.',
    noRuleText: 'No text for this rule.',
    colName: 'Name',
    colRelation: 'Relation',
    colFraction: 'Fraction',
    colPct: '%',
    colAmount: 'Amount',
    total: 'Total',
    rule: (id: string) => `Rule ${id}`,
    exportPdf: 'Export PDF',
    printDate: 'Date',
    share: 'Share',
    shareNative: 'Share…',
    shareEmail: 'Email',
    shareCopy: 'Copy link',
    shareCopied: 'Link copied ✓',
    shareShort: 'I calculated an inheritance distribution according to Islamic law:',
    sharePrivacy: 'The link contains the relations and amounts only, never the names.',
    rights: 'Released under the MIT License.',
    footer:
      'For educational reference only. Not a fatwa. Verify your case with a qualified scholar. Rules based on the Inheritance Calculator by ilmsummit.org.',
    families: [
      'Spouse',
      'Children',
      'Grandchildren',
      'Parents',
      'Grandparents',
      'Full & paternal siblings',
      'Maternal siblings',
      'Nephews, uncles & cousins',
    ],
    banners: {
      umar: "Umar's case: the mother takes 1/3 of what remains after the spouse's share; the father takes the rest.",
      awl: "'Awl applied: the prescribed shares exceeded the estate, so every share was reduced proportionally.",
      radd: 'Radd applied: the remainder was returned proportionally to the heirs, excluding the spouse.',
      mushtaraka: "Mushtaraka: full siblings share the maternal siblings' portion equally, so they don't receive less than them.",
      grandfatherSpecial: 'Grandfather with siblings: he receives the best of 1/6 of the estate, 1/3 of the remainder, or sharing as a brother.',
      akdariyya: "Akdariyya: grandfather and sister pool their shares after 'Awl and divide them 2:1.",
      spouseReturn: 'No other heirs remain, so the remainder returns to the spouse.',
      stateTakesAll: 'No eligible heirs: the estate goes to the Islamic state treasury.',
    },
  },
  ar: {
    title: 'حاسبة المواريث الإسلامية',
    subtitle: 'اضغط على الدائرة لتحديد القريب الحي. تُحسب الأنصبة فورًا داخل متصفحك.',
    estate: 'التركة',
    estateAmount: 'قيمة التركة',
    bequest: 'الوصية',
    bequestHint: (max: string) => `اختيارية. لا تتجاوز الوصية ثلث التركة: بحد أقصى ${ltr(max)}.`,
    bequestCapped: (max: string) => `الوصية تتجاوز الثلث، فرُدّت إلى الثلث ${ltr(max)}. والزيادة تحتاج إلى إجازة الورثة.`,
    bequestBanner: (b: string, net: string) => `تُخرج الوصية (${ltr(b)}) أولًا، ثم يُقسم الباقي ${ltr(net)} على الورثة.`,
    tileBequest: 'الوصية',
    bequestRelation: 'وصية (في حدود الثلث)',
    tableNote: 'كسور الورثة من الصافي بعد إخراج الوصية، والنسب المئوية من إجمالي التركة.',
    tileNet: 'الصافي للورثة',
    currency: 'العملة',
    showAll: 'إظهار جميع الأقارب',
    clearAll: 'مسح الكل',
    reset: 'إعادة المثال',
    language: 'English',
    languageLabel: 'التبديل إلى الإنجليزية',
    deceased: 'المتوفى',
    deceasedGender: 'جنس المتوفى',
    deceasedNameLabel: 'اسم المتوفى',
    deceasedNamePlaceholder: 'اسم المتوفى',
    male: 'ذكر',
    female: 'أنثى',
    familyTree: 'شجرة العائلة',
    notRelevant: 'غير مؤثرين الآن:',
    blockedByGroup: (who: string, allFemale: boolean) => `${allFemale ? 'محجوبات' : 'محجوبون'} بوجود ${who}`,
    nothingLeftGroup: 'لن يبقى لهم شيء',
    showAllLink: 'إظهار الكل',
    add: (who: string) => `إضافة ${who}`,
    max: (n: number) => `الحد الأقصى ${n}`,
    remove: (who: string) => `حذف ${who}`,
    rename: 'اضغط لتغيير الاسم',
    name: 'الاسم',
    hintOff: (n: string) => `${n}: غير محدد كحي. اضغط لتحديده حيًا.`,
    hintBlocked: (n: string, why: string) => `${n}: ${why}. اضغط لإلغاء التحديد.`,
    hintZero: (n: string) => `${n}: حي، لكن لم يبقَ له شيء. اضغط لإلغاء التحديد.`,
    hintOn: (n: string, f: string, pct: string) => `${n}: ${ltr(f)} (${ltr(pct)}). اضغط لإلغاء التحديد.`,
    blockedBy: (who: string, heir: HeirType) => `${arBlocked(heir)} بوجود ${who}`,
    blockedByRule: (who: string, rule: string, title: string, heir: HeirType) =>
      `${arBlocked(heir)} بوجود ${who} (القاعدة ${rule}${title ? ` – ${title}` : ''})`,
    blockedBadge: (heir: HeirType) => arBlocked(heir),
    nothingLeft: '0 — لم يبقَ شيء',
    nothingLeftShort: 'لم يبقَ شيء',
    results: 'النتائج',
    tileEstate: 'قيمة التركة',
    tileHeirs: 'الورثة المستحقون',
    tileBlocked: 'الورثة المحجوبون',
    empty: 'اضغط على دائرة أحد الأقارب لتحديده حيًا ومعرفة كيفية تقسيم التركة.',
    distribution: 'التوزيع',
    barLabel: 'نصيب كل وارث من التركة (التفاصيل في الجدول أدناه)',
    rulesApplied: 'القواعد المطبقة',
    noRules: 'لم تُطبق أي قاعدة بعد.',
    noRuleText: 'لا يوجد نص لهذه القاعدة.',
    colName: 'الاسم',
    colRelation: 'صلة القرابة',
    colFraction: 'الكسر',
    colPct: '٪',
    colAmount: 'المبلغ',
    total: 'المجموع',
    rule: (id: string) => `القاعدة ${id}`,
    exportPdf: 'تصدير PDF',
    printDate: 'التاريخ',
    share: 'مشاركة',
    shareNative: 'مشاركة…',
    shareEmail: 'البريد الإلكتروني',
    shareCopy: 'نسخ الرابط',
    shareCopied: 'تم نسخ الرابط ✓',
    shareShort: 'حسبتُ توزيع تركة وفق أحكام المواريث الإسلامية:',
    sharePrivacy: 'يحتوي الرابط على صلات القرابة والمبالغ فقط، دون الأسماء.',
    rights: 'مرخّص بموجب رخصة MIT.',
    footer:
      'للاسترشاد التعليمي فقط، وليست فتوى. يُرجى التحقق من مسألتك لدى عالم مختص. القواعد مأخوذة من حاسبة المواريث في موقع ilmsummit.org.',
    families: [
      'الزوجان',
      'الأولاد',
      'أولاد الابن',
      'الوالدان',
      'الأجداد',
      'الإخوة الأشقاء ولأب',
      'الإخوة لأم',
      'أبناء الإخوة والأعمام وأبناؤهم',
    ],
    banners: {
      umar: 'العُمَريّتان: للأم ثلث الباقي بعد نصيب الزوج أو الزوجة، وللأب الباقي.',
      awl: 'طُبّق العَوْل: زادت الفروض على التركة، فنُقصت جميع الأنصبة بالتناسب.',
      radd: 'طُبّق الرد: رُدّ الباقي على الورثة بالتناسب، عدا الزوجين.',
      mushtaraka: 'المسألة المشتركة: يشارك الإخوة الأشقاء الإخوة لأم في ثلثهم بالتساوي حتى لا يأخذوا أقل منهم.',
      grandfatherSpecial: 'الجد مع الإخوة: يأخذ الأفضل من سدس التركة، أو ثلث الباقي، أو المقاسمة كأخ.',
      akdariyya: 'المسألة الأكدرية: يُجمع نصيبا الجد والأخت بعد العول ويُقسمان للذكر مثل حظ الأنثيين.',
      spouseReturn: 'لا يوجد ورثة آخرون، فيُرد الباقي على الزوج أو الزوجة.',
      stateTakesAll: 'لا يوجد ورثة مستحقون: تؤول التركة إلى بيت مال المسلمين.',
    },
  },
};

export type Strings = (typeof UI)['en'];
export const t = (lang: Lang): Strings => UI[lang];
