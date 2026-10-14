import { HeirRef, Param, SharePart, Step } from '../engine/calculate';
import { HEIR_INFO } from '../engine/heirs';
import { arBlocked, heirName, Lang, ltr } from './strings';

type Ctx = {
  p: Record<string, Param>;
  n: (key: string) => string; // heir name for a HeirRef param
  g: (key: string) => string; // same, in the Arabic genitive (after بين، بوجود، على…)
  v: (key: string) => string; // plain value (fractions), direction-isolated in Arabic
  many: (key: string) => boolean;
  parts: (key: string) => SharePart[];
};

const EN: Record<Step['key'], (c: Ctx) => string> = {
  block: (c) => `${c.n('by')} ${c.many('by') ? 'block' : 'blocks'} ${c.n('heir')} from receiving any share.`,
  prescribed: (c) =>
    `${c.n('heir')} ${c.many('heir') ? 'share' : 'gets'} the prescribed share of ${c.v('f')}` +
    (c.p.extra === 'withDaughter' ? ', completing the 2/3 with the daughter' : c.p.extra === 'withFullSister' ? ', completing the 2/3 with the full sister' : '') +
    '.',
  psExhausted: (c) => `Full Sisters have taken the whole 2/3, so ${c.n('heir')} receive nothing.`,
  mat1: (c) => `${c.n('heir')} gets the prescribed share of 1/6.`,
  mat3: () => 'Maternal siblings share the prescribed share of 1/3.',
  mat33: () => 'Maternal siblings divide their share equally per head, with no 2:1 ratio between males and females.',
  joint: (c) => `Joint Ta'seeb of ${c.n('male')} and ${c.n('female')}.`,
  ratio: (c) => `${c.n('male')} and ${c.n('female')} share in the ratio of 2:1.`,
  splitResult: (c) =>
    c
      .parts('parts')
      .map((x) => {
        const name = heirName(x.heir.heir, x.heir.count, 'en');
        return x.heir.count > 1 ? `${name} get ${x.share} in total (${x.each} each)` : `${name} gets ${x.share}`;
      })
      .join('; ') + '.',
  umar1: () => "Umar's case: the deceased left a spouse and both parents, with no offspring and fewer than 2 siblings.",
  umar2: (c) => `After the spouse's share, Mother gets 1/3 of the remainder (${c.v('mother')}) and Father gets the rest (${c.v('father')}), in the ratio 2:1.`,
  gf23: () => 'Grandfather & siblings: the grandfather receives the best of three options.',
  gf23d: (c) => `Options: 1/6 of the estate = 1/6; 1/3 of the remainder = ${c.v('B')}; sharing as a brother = ${c.v('C')}. Grandfather takes ${c.v('gf')}.`,
  gf23e: () => 'The best option would exceed the remainder, so the grandfather takes his regular 1/6.',
  akd18a: () => "Sisters' share is more than the grandfather's. They pool their shares and divide them 2:1.",
  akd24: (c) =>
    `Grandfather's share is now ${c.v('gf')}; ` +
    c
      .parts('parts')
      .map((x) => `${heirName(x.heir.heir, x.heir.count, 'en')} ${x.share}`)
      .join(', ') +
    '.',
  gf23cFull: (c) => `Full siblings take the remaining ${c.v('left')}${c.p.mixed ? ', brothers and sisters 2:1' : ''}.`,
  gf23g: (c) => `${c.n('heir')} take${c.many('heir') ? '' : 's'} up to ${c.v('cap')} from the remaining ${c.v('left')}: ${c.v('fs')}.`,
  gf23gRest: (c) => `${c.n('heir')} receive${c.many('heir') ? '' : 's'} the rest: ${c.v('rest')}.`,
  gf23cPaternal: (c) => `Paternal siblings take the remaining ${c.v('left')}.`,
  residue: () => 'Distribute the remaining shares according to relative priority.',
  never17: (c) => `${c.n('heir')} can never be cut off: he takes 1/6.`,
  taseeb16a: (c) => `${c.n('heir')} also takes the remaining ${c.v('residue')} as residuary heir, for a total of ${c.v('total')}.`,
  onlyHeir: (c) =>
    `${c.n('heir')} ${c.many('heir') ? 'are the only heirs remaining, sharing' : 'is the only heir remaining, receiving'} ${c.v('residue')}` +
    (c.p.withFemale ? ' as residuary alongside the female descendants' : '') +
    '.',
  mush22: () => 'Full brothers would receive less than the maternal siblings.',
  mush22a: (c) => `Full siblings join the maternal siblings and the ${c.v('pool')} is shared equally among ${c.v('heads')} people: ${c.v('each')} each.`,
  state27: () => 'No eligible heirs: the estate goes to the Islamic state treasury.',
  awl: (c) => `Total shares (${c.v('t')}) have exceeded 100%. All shares are reduced proportionally ('Awl).`,
  spouse26: (c) => `No other heirs remain, so the remaining ${c.v('residue')} returns to the ${c.n('heir')}.`,
  radd: (c) => `Shares remain undistributed (${c.v('residue')}). They are returned proportionally to all heirs except the spouse (Radd).`,
};

const AR: Record<Step['key'], (c: Ctx) => string> = {
  block: (c) => {
    const h = c.p.heir as HeirRef;
    return `${c.n('heir')}: ${arBlocked(h.heir, h.count)} حجبًا كاملًا بوجود ${c.g('by')}.`;
  },
  prescribed: (c) =>
    `${c.n('heir')}: الفرض ${c.v('f')}` +
    (c.p.extra === 'withDaughter' ? ' تكملةً للثلثين مع البنت' : c.p.extra === 'withFullSister' ? ' تكملةً للثلثين مع الأخت الشقيقة' : '') +
    '.',
  psExhausted: (c) => `${c.n('heir')}: لا شيء، لأن الأخوات الشقيقات استوفين الثلثين.`,
  mat1: (c) => `${c.n('heir')}: الفرض ${ltr('1/6')}.`,
  mat3: () => `الإخوة لأم: الفرض ${ltr('1/3')} يُقسم بينهم.`,
  mat33: () => 'يقتسم الإخوة لأم نصيبهم بالتساوي بين الذكور والإناث، دون قاعدة «للذكر مثل حظ الأنثيين».',
  joint: (c) => `تعصيب مشترك بين ${c.g('male')} و${c.g('female')}.`,
  ratio: (c) => `${c.n('male')} و${c.n('female')}: للذكر مثل حظ الأنثيين.`,
  splitResult: (c) =>
    c
      .parts('parts')
      .map((x) => {
        const name = heirName(x.heir.heir, x.heir.count, 'ar');
        const each = HEIR_INFO[x.heir.heir].male ? 'لكل واحد' : 'لكل واحدة';
        return x.heir.count > 1 ? `${name}: ${ltr(x.share)} إجمالًا (${ltr(x.each)} ${each})` : `${name}: ${ltr(x.share)}`;
      })
      .join('؛ ') + '.',
  umar1: () => 'العُمَريّتان: ترك المتوفى زوجًا أو زوجة مع الأبوين، دون فرع وارث وبأقل من أخوين.',
  umar2: (c) => `بعد نصيب الزوج أو الزوجة، للأم ثلث الباقي (${c.v('mother')}) وللأب الباقي (${c.v('father')})، بنسبة 2:1.`,
  gf23: () => 'الجد مع الإخوة: يأخذ الجد الأفضل من ثلاثة خيارات.',
  gf23d: (c) => `الخيارات: سدس التركة = ${ltr('1/6')}؛ ثلث الباقي = ${c.v('B')}؛ المقاسمة كأخ = ${c.v('C')}. نصيب الجد ${c.v('gf')}.`,
  gf23e: () => `أفضل الخيارات يتجاوز الباقي، فيأخذ الجد السدس ${ltr('1/6')}.`,
  akd18a: () => 'نصيب الأخت أكثر من نصيب الجد، فيُجمع نصيباهما ويُقسمان للذكر مثل حظ الأنثيين.',
  akd24: (c) =>
    `نصيب الجد الآن ${c.v('gf')}؛ ` +
    c
      .parts('parts')
      .map((x) => `${heirName(x.heir.heir, x.heir.count, 'ar')} ${ltr(x.share)}`)
      .join('، ') +
    '.',
  gf23cFull: (c) => `يأخذ الإخوة الأشقاء الباقي ${c.v('left')}${c.p.mixed ? '، للذكر مثل حظ الأنثيين' : ''}.`,
  gf23g: (c) => `${c.n('heir')}: حتى ${c.v('cap')} من الباقي ${c.v('left')}، أي ${c.v('fs')}.`,
  gf23gRest: (c) => `${c.n('heir')}: الباقي ${c.v('rest')}.`,
  gf23cPaternal: (c) => `يأخذ الإخوة لأب الباقي ${c.v('left')}.`,
  residue: () => 'يُوزَّع الباقي على العصبة حسب ترتيب الأولوية.',
  never17: (c) => `${c.n('heir')} لا يُحرم أبدًا: يأخذ السدس ${ltr('1/6')}.`,
  taseeb16a: (c) => `${c.n('heir')}: يأخذ أيضًا الباقي ${c.v('residue')} تعصيبًا، فيصبح مجموع نصيبه ${c.v('total')}.`,
  onlyHeir: (c) =>
    `${c.n('heir')}: ${c.many('heir') ? 'هم العصبة الوحيدون الباقون، ويقتسمون' : 'العاصب الوحيد الباقي، ويأخذ'} ${c.v('residue')}` +
    (c.p.withFemale ? ' (عصبة مع الغير مع البنات)' : '') +
    '.',
  mush22: () => 'سيأخذ الإخوة الأشقاء أقل من الإخوة لأم (المسألة المشتركة).',
  mush22a: (c) => `يشترك الأشقاء مع الإخوة لأم في ${c.v('pool')} بالتساوي بين ${c.v('heads')} أشخاص: ${c.v('each')} لكل واحد.`,
  state27: () => 'لا يوجد ورثة مستحقون: تؤول التركة إلى بيت مال المسلمين.',
  awl: (c) => `مجموع الفروض (${c.v('t')}) تجاوز 100٪. تُنقص جميع الأنصبة بالتناسب (العَوْل).`,
  spouse26: (c) => `لا يوجد ورثة آخرون، فيُرد الباقي ${c.v('residue')} على ${c.g('heir')}.`,
  radd: (c) => `بقي جزء غير موزع (${c.v('residue')}). يُرد بالتناسب على جميع الورثة عدا الزوجين (الرد).`,
};

export function formatStep(step: Step, lang: Lang): string {
  const ref = (k: string) => step.p[k] as HeirRef;
  const ctx: Ctx = {
    p: step.p,
    n: (k) => heirName(ref(k).heir, ref(k).count, lang),
    g: (k) => heirName(ref(k).heir, ref(k).count, lang, true),
    v: (k) => (lang === 'ar' ? ltr(String(step.p[k])) : String(step.p[k])),
    many: (k) => ref(k).count > 1,
    parts: (k) => step.p[k] as SharePart[],
  };
  return (lang === 'ar' ? AR : EN)[step.key](ctx);
}
