import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { calculate } from './engine/calculate';
import { Gender, HEIR_INFO, HEIR_TYPES, HeirType, Heirs } from './engine/heirs';
import { allocateCents, applyBequest, formatMoney, toCents } from './engine/money';
import { relevance, Relevance } from './engine/relevance';
import { groupTitle, heirName, heirNote, Lang, t } from './i18n/strings';
import { Circle, PersonView } from './ui/Circle';
import { ALWAYS_VISIBLE, SLOTS } from './ui/layout';
import { Results } from './ui/Results';
import { ShareMenu } from './ui/ShareMenu';
import { decodeScenario, scenarioUrl, summaryText } from './ui/share';
import { buildPdf, exportPdf, isExportMode, readExportState } from './ui/pdf';

type Bilingual = Record<Lang, string>;

interface Person {
  id: number;
  name: string; // typed by the user; empty = use `example` or the generic default
  example?: Bilingual; // name from the default example, shown in the current language
  alive: boolean;
}
type People = Record<HeirType, Person[]>;

let nextId = 1;
const person = (alive: boolean, example?: Bilingual): Person => ({ id: nextId++, name: '', example, alive });

const DEFAULT_ESTATE = '1,000,000';
const DEFAULT_BEQUEST = '100,000';
const DEFAULT_CURRENCY = 'AED';
const DEFAULT_DECEASED_NAME: Bilingual = { ar: 'سالم راشد الظاهري', en: 'Salem Rashid Al Dhaheri' };

// Default example: a deceased man survived by his wife, a son, two daughters, his mother and
// paternal grandfather; his father has died and his uncle is blocked by the son.
function initialPeople(): People {
  const p = {} as People;
  for (const h of HEIR_TYPES) p[h] = [person(false)];
  p.Wife = [person(true, { ar: 'عائشة خليفة الكعبي', en: 'Aisha Khalifa Al Kaabi' })];
  p.Son = [person(true, { ar: 'حمدان سالم الظاهري', en: 'Hamdan Salem Al Dhaheri' })];
  p.Daughter = [
    person(true, { ar: 'مريم سالم الظاهري', en: 'Maryam Salem Al Dhaheri' }),
    person(true, { ar: 'شمّا سالم الظاهري', en: 'Shamma Salem Al Dhaheri' }),
  ];
  p.Mother = [person(true, { ar: 'موزة عبيد الشامسي', en: 'Moza Obaid Al Shamsi' })];
  p.Father = [person(false, { ar: 'راشد سعيد الظاهري', en: 'Rashid Saeed Al Dhaheri' })];
  p.GrandFather = [person(true, { ar: 'سعيد حمد الظاهري', en: 'Saeed Hamad Al Dhaheri' })];
  p.FullUncle = [person(true, { ar: 'محمد سعيد الظاهري', en: 'Mohammed Saeed Al Dhaheri' })];
  return p;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'QAR', 'KWD', 'EGP', 'MAD', 'TND', 'PKR', 'INR', 'MYR', 'IDR', 'TRY'];

function defaultName(type: HeirType, index: number, groupSize: number, lang: Lang) {
  const base = heirName(type, 1, lang);
  return HEIR_INFO[type].multi && groupSize > 1 ? `${base} ${index + 1}` : base;
}

function initialLang(): Lang {
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  if (fromUrl === 'ar' || fromUrl === 'en') return fromUrl;
  const sharedLang = decodeScenario(window.location.hash)?.l;
  if (sharedLang) return sharedLang;
  // Arabic by default; only a language the user picked explicitly is remembered.
  const saved = localStorage.getItem('preferredLang');
  return saved === 'en' ? 'en' : 'ar';
}

// A shared link (#s=…) opens that calculation instead of the default example.
const shared = decodeScenario(window.location.hash);

// Inside the hidden PDF export frame, the full state (names included) comes from the parent page.
interface ExportState {
  gender: Gender;
  people: People;
  estate: string;
  bequest: string;
  currency: string;
  deceased: string | Bilingual;
  lang: Lang;
  showAll: boolean;
}
const exportMode = isExportMode();
const exported = exportMode ? readExportState<ExportState>() : null;

function peopleFromScenario(h: Heirs): People {
  const p = {} as People;
  for (const t of HEIR_TYPES) p[t] = h[t] ? Array.from({ length: h[t]! }, () => person(true)) : [person(false)];
  return p;
}

const COPYRIGHT_URL = 'https://www.linkedin.com/in/thabet-chelligue-6119b217';

export default function App() {
  const [gender, setGender] = useState<Gender>(exported?.gender ?? shared?.g ?? 'male');
  const [people, setPeople] = useState<People>(
    () => exported?.people ?? (shared ? peopleFromScenario(shared.h) : initialPeople()),
  );
  const [estate, setEstate] = useState(exported?.estate ?? shared?.e ?? DEFAULT_ESTATE);
  const [bequest, setBequest] = useState(exported?.bequest ?? shared?.b ?? DEFAULT_BEQUEST);
  const [currency, setCurrency] = useState(exported?.currency ?? shared?.c ?? DEFAULT_CURRENCY);
  const [showAll, setShowAll] = useState(exported?.showAll ?? false);
  const [exporting, setExporting] = useState(false);
  const [editingDeceased, setEditingDeceased] = useState(false);
  const [lang, setLang] = useState<Lang>(() => exported?.lang ?? initialLang());
  const s = t(lang);
  // A string is a name the user typed; a Bilingual is the example name, shown in the current language.
  const [deceased, setDeceasedName] = useState<string | Bilingual>(
    exported ? exported.deceased : shared ? '' : DEFAULT_DECEASED_NAME,
  );

  // Export frame: once rendered, build the PDF and hand it to the parent page.
  useEffect(() => {
    if (!exportMode) return;
    buildPdf()
      .then((buffer) => window.parent.postMessage({ type: 'pdf', buffer }, window.location.origin, [buffer]))
      .catch((err) => window.parent.postMessage({ type: 'pdf-error', message: String(err) }, window.location.origin));
  }, []);
  const deceasedName = typeof deceased === 'string' ? deceased : deceased[lang];
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  // Fit the tree to its card: measure its natural width after each render and on resize, then
  // scale it with CSS zoom (screen) and to the A4 page width (print).
  const treeRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const fitTree = useCallback(() => {
    const tree = treeRef.current;
    const card = tree?.parentElement;
    if (!tree || !card) return;
    // Leave the layout alone while printing; the print scale is set by preparePrint.
    if (rootRef.current?.classList.contains('print-mode') || window.matchMedia('print').matches) return;
    const current = parseFloat(tree.style.getPropertyValue('--fit-scale')) || 1;
    const rects = [...tree.children].map((c) => c.getBoundingClientRect()).filter((r) => r.width > 0);
    if (!rects.length) return;
    const natural = (Math.max(...rects.map((r) => r.right)) - Math.min(...rects.map((r) => r.left))) / current;
    const cs = getComputedStyle(card);
    const available = card.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const isGrid = getComputedStyle(tree).display === 'grid';
    const next = isGrid ? Math.max(0.55, Math.min(1, available / natural)) : 1;
    if (Math.abs(next - current) > 0.005) tree.style.setProperty('--fit-scale', next.toFixed(3));
    const PRINT_WIDTH = 640; // A4 (794px) minus page margins and card padding
    if (isGrid) tree.style.setProperty('--print-scale', Math.min(1, PRINT_WIDTH / natural).toFixed(3));
  }, []);

  // Exporting from a phone: switch to the laptop layout just for printing, measure the full tree
  // and scale it to the A4 width, then switch back. Runs for the Export button and the browser's
  // own print command alike.
  const preparePrint = useCallback(() => {
    const root = rootRef.current;
    const tree = treeRef.current;
    if (!root || !tree) return;
    root.classList.add('print-mode');
    const rects = [...tree.children].map((c) => c.getBoundingClientRect()).filter((r) => r.width > 0);
    if (!rects.length) return;
    const natural = Math.max(...rects.map((r) => r.right)) - Math.min(...rects.map((r) => r.left));
    tree.style.setProperty('--print-scale', Math.min(1, 640 / natural).toFixed(3));
  }, []);
  useEffect(() => {
    const end = () => rootRef.current?.classList.remove('print-mode');
    window.addEventListener('beforeprint', preparePrint);
    window.addEventListener('afterprint', end);
    return () => {
      window.removeEventListener('beforeprint', preparePrint);
      window.removeEventListener('afterprint', end);
    };
  }, [preparePrint]);
  useLayoutEffect(fitTree);
  useEffect(() => {
    const card = treeRef.current?.parentElement;
    if (!card) return;
    const ro = new ResizeObserver(() => fitTree());
    ro.observe(card);
    return () => ro.disconnect();
  }, [fitTree]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.title = s.title;
  }, [lang, dir, s.title]);

  const enabled = (t: HeirType) => t !== (gender === 'male' ? 'Husband' : 'Wife');

  const heirs = useMemo(() => {
    const h: Heirs = {};
    for (const t of HEIR_TYPES) {
      if (t === (gender === 'male' ? 'Husband' : 'Wife')) continue;
      const n = people[t].filter((p) => p.alive).length;
      if (n) h[t] = n;
    }
    return h;
  }, [people, gender]);

  const result = useMemo(() => calculate(heirs, gender), [heirs, gender]);

  const rel = useMemo(() => {
    const r = {} as Record<HeirType, Relevance>;
    for (const t of HEIR_TYPES) if (!ALWAYS_VISIBLE.has(t)) r[t] = relevance(heirs, gender, t);
    return r;
  }, [heirs, gender]);

  const parseAmount = (v: string) => parseFloat(v.replace(/[^\d.]/g, '')) || 0;
  const formatAmount = (v: string) => parseAmount(v).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const estateCents = toCents(parseAmount(estate));
  const {
    bequestCents,
    maxCents: bequestMaxCents,
    capped: bequestCapped,
    netCents,
  } = applyBequest(estateCents, toCents(parseAmount(bequest)));

  const views = useMemo(() => {
    const list: PersonView[] = [];
    for (const t of HEIR_TYPES) {
      if (t === (gender === 'male' ? 'Husband' : 'Wife')) continue;
      const cat = result.categories.find((c) => c.heir === t);
      people[t].forEach((p, i) =>
        list.push({
          id: p.id,
          type: t,
          name: p.name || p.example?.[lang] || defaultName(t, i, people[t].length, lang),
          alive: p.alive,
          share: p.alive && cat ? cat.perPerson : undefined,
          status: p.alive ? cat?.status : undefined,
          blocked: p.alive ? cat?.blocked : undefined,
        }),
      );
    }
    const paid = list.filter((v) => v.alive && v.share?.isPositive());
    allocateCents(netCents, paid.map((v) => v.share!)).forEach((c, i) => (paid[i].cents = c));
    return list;
  }, [people, gender, result, netCents, lang]);

  const viewById = new Map(views.map((v) => [v.id, v]));

  const update = (t: HeirType, fn: (list: Person[]) => Person[]) => setPeople((p) => ({ ...p, [t]: fn(p[t]) }));
  const toggle = (t: HeirType, id: number) => update(t, (l) => l.map((p) => (p.id === id ? { ...p, alive: !p.alive } : p)));
  const rename = (t: HeirType, id: number, name: string) => update(t, (l) => l.map((p) => (p.id === id ? { ...p, name } : p)));
  const add = (t: HeirType) => update(t, (l) => [...l, person(true)]);
  const remove = (t: HeirType, id: number) => update(t, (l) => (l.length > 1 ? l.filter((p) => p.id !== id) : l));
  const reset = () => {
    setPeople(initialPeople());
    setGender('male');
    setEstate(DEFAULT_ESTATE);
    setBequest(DEFAULT_BEQUEST);
    setCurrency(DEFAULT_CURRENCY);
    setDeceasedName(DEFAULT_DECEASED_NAME);
  };
  const clearAll = () => {
    setPeople(Object.fromEntries(HEIR_TYPES.map((t) => [t, [person(false)]])) as unknown as People);
    setDeceasedName('');
  };

  const onExportPdf = async () => {
    setExporting(true);
    const date = new Date().toISOString().slice(0, 10);
    const base = (deceasedName || (lang === 'ar' ? 'المواريث' : 'inheritance')).replace(/[\\/:*?"<>|]+/g, '').trim();
    try {
      const state: ExportState = { gender, people, estate, bequest, currency, deceased, lang, showAll };
      await exportPdf(state, `${base.replace(/\s+/g, '-')}-${date}.pdf`);
    } catch {
      // fall back to the browser's print dialog
      preparePrint();
      window.print();
    } finally {
      setExporting(false);
    }
  };

  const visible = (t: HeirType) => showAll || ALWAYS_VISIBLE.has(t) || people[t].some((p) => p.alive) || rel[t]?.relevant;

  const hidden = HEIR_TYPES.filter((t) => enabled(t) && !visible(t));
  const hiddenByBlocker = new Map<string, HeirType[]>();
  for (const t of hidden) {
    const key = rel[t]?.blockedBy ?? '';
    hiddenByBlocker.set(key, [...(hiddenByBlocker.get(key) ?? []), t]);
  }
  const hiddenReason = (by: string, types: HeirType[]) =>
    by ? s.blockedByGroup(heirName(by as HeirType, 1, lang), types.every((h) => !HEIR_INFO[h].male)) : s.nothingLeftGroup;

  const renderGroup = (t: HeirType) => {
    const info = HEIR_INFO[t];
    const list = people[t];
    const note = heirNote(t, lang);
    const one = heirName(t, 1, lang);
    return (
      <div className={`group${info.multi ? '' : ' group--single'}`} key={t}>
        <div className="group__title" title={note}>
          {groupTitle(t, lang)}
        </div>
        <div className="group__people">
          {list.map((p) => (
            <Circle
              key={p.id}
              view={viewById.get(p.id)!}
              lang={lang}
              currency={currency}
              canRemove={list.length > 1}
              onToggle={() => toggle(t, p.id)}
              onRename={(name) => rename(t, p.id, name)}
              onRemove={() => remove(t, p.id)}
            />
          ))}
          {info.multi && (
            <button
              className="add"
              onClick={() => add(t)}
              disabled={info.max !== undefined && list.length >= info.max}
              aria-label={s.add(one)}
              title={info.max !== undefined && list.length >= info.max ? s.max(info.max) : s.add(one)}
            >
              +
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`viz-root app${exportMode ? ' export-mode' : ''}`} dir={dir} lang={lang} ref={rootRef}>
      <header className="hero">
        <div className="hero__top">
          <div className="brand">
            <svg className="brand__mark" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M24 3l5.3 8.1 9.5-1.9-1.9 9.5L45 24l-8.1 5.3 1.9 9.5-9.5-1.9L24 45l-5.3-8.1-9.5 1.9 1.9-9.5L3 24l8.1-5.3-1.9-9.5 9.5 1.9z" />
              <circle cx="24" cy="24" r="7.5" />
            </svg>
            <div>
              <h1>{s.title}</h1>
              <p className="subtitle">{s.subtitle}</p>
            </div>
          </div>
          <button
            className="lang-toggle"
            onClick={() => {
              const next = lang === 'ar' ? 'en' : 'ar';
              localStorage.setItem('preferredLang', next);
              setLang(next);
            }}
            aria-label={s.languageLabel}
            lang={lang === 'ar' ? 'en' : 'ar'}
          >
            {s.language}
          </button>
        </div>
        <div className="toolbar">
          <div className="money">
            <label className="money__row money__row--estate">
              <span className="money__label">{s.estate}</span>
              <span className="money__field">
                <input
                  inputMode="decimal"
                  enterKeyHint="done"
                  autoComplete="off"
                  value={estate}
                  onChange={(e) => setEstate(e.target.value)}
                  onBlur={() => setEstate(formatAmount(estate))}
                  aria-label={s.estateAmount}
                  dir="ltr"
                />
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} aria-label={s.currency}>
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </span>
            </label>
            <label className="money__row money__row--bequest">
              <span className="money__label">{s.bequest}</span>
              <span className={`money__field${bequestCapped ? ' money__field--warn' : ''}`}>
                <input
                  inputMode="decimal"
                  enterKeyHint="done"
                  autoComplete="off"
                  value={bequest}
                  onChange={(e) => setBequest(e.target.value)}
                  onBlur={() => setBequest(formatAmount(bequest))}
                  aria-label={s.bequest}
                  aria-describedby="bequest-hint"
                  dir="ltr"
                />
                <span className="money__currency">{currency}</span>
              </span>
            </label>
            <p id="bequest-hint" className={`money__hint${bequestCapped ? ' money__hint--warn' : ''}`}>
              {bequestCapped
                ? s.bequestCapped(formatMoney(bequestMaxCents, currency))
                : s.bequestHint(formatMoney(bequestMaxCents, currency))}
            </p>
          </div>
          <div className="toolbar__actions">
            <label className="switch">
              <input type="checkbox" role="switch" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
              <span>{s.showAll}</span>
            </label>
            <button className="ghost" onClick={clearAll}>
              {s.clearAll}
            </button>
            <button className="ghost" onClick={reset}>
              {s.reset}
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="print-only print-header" aria-hidden="true" data-pdf-block>
          <h1>{s.title}</h1>
          <dl>
            {deceasedName && (
              <>
                <dt>{lang === 'ar' && gender === 'female' ? 'المتوفاة' : s.deceased}</dt>
                <dd>{deceasedName}</dd>
              </>
            )}
            <dt>{s.printDate}</dt>
            <dd>
              <bdi>{new Date().toLocaleDateString(lang === 'ar' ? 'ar-AE' : 'en-GB', { dateStyle: 'long' })}</bdi>
            </dd>
          </dl>
        </section>
        <section className="tree-card" aria-label={s.familyTree} data-pdf-block>
          <div className="tree" ref={treeRef}>
            {SLOTS.map((slot) => {
              if (slot.groups === 'deceased') {
                const spouse: HeirType = gender === 'male' ? 'Wife' : 'Husband';
                return (
                  <div className="slot slot--deceased" key={slot.key} style={{ gridArea: slot.area, order: slot.order }}>
                    <div className="deceased">
                      <div className="deceased__disc" aria-hidden="true">
                        {gender === 'male' ? '♂' : '♀'}
                      </div>
                      {editingDeceased ? (
                        <input
                          className="person__name-input deceased__input"
                          autoFocus
                          defaultValue={deceasedName}
                          placeholder={s.deceasedNamePlaceholder}
                          aria-label={s.deceasedNameLabel}
                          onBlur={(e) => {
                            setDeceasedName(e.currentTarget.value.trim());
                            setEditingDeceased(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                            if (e.key === 'Escape') setEditingDeceased(false);
                          }}
                        />
                      ) : (
                        <button className="deceased__label" title={s.rename} onClick={() => setEditingDeceased(true)}>
                          {deceasedName || (lang === 'ar' && gender === 'female' ? 'المتوفاة' : s.deceased)}
                          {!deceasedName && <span className="deceased__edit" aria-hidden="true">✎</span>}
                        </button>
                      )}
                      {deceasedName && (
                        <div className="deceased__caption">{lang === 'ar' && gender === 'female' ? 'المتوفاة' : s.deceased}</div>
                      )}
                      <div className="segmented" role="group" aria-label={s.deceasedGender}>
                        {(['male', 'female'] as Gender[]).map((g) => (
                          <button key={g} aria-pressed={gender === g} onClick={() => setGender(g)}>
                            {g === 'male' ? s.male : s.female}
                          </button>
                        ))}
                      </div>
                    </div>
                    {renderGroup(spouse)}
                  </div>
                );
              }
              const groups = slot.groups.filter(visible);
              if (groups.length === 0) return null;
              return (
                <div className={`slot${slot.row ? ' slot--row' : ''}`} key={slot.key} style={{ gridArea: slot.area, order: slot.order }}>
                  {groups.map(renderGroup)}
                </div>
              );
            })}
          </div>

          {hidden.length > 0 && (
            <div className="hidden-note">
              <strong>{s.notRelevant}</strong>{' '}
              {[...hiddenByBlocker.entries()].map(([by, types], i) => (
                <span key={by}>
                  {i > 0 && (lang === 'ar' ? '؛ ' : '; ')}
                  {types.map((t) => groupTitle(t, lang)).join(lang === 'ar' ? '، ' : ', ')} ({hiddenReason(by, types)})
                </span>
              ))}
              .{' '}
              <button className="link" onClick={() => setShowAll(true)}>
                {s.showAllLink}
              </button>
            </div>
          )}
        </section>

        <Results
          lang={lang}
          views={views}
          steps={result.steps}
          flags={result.flags}
          currency={currency}
          estateCents={estateCents}
          bequestCents={bequestCents}
          netCents={netCents}
          actions={
            <>
              <button className="action action--primary" onClick={onExportPdf} disabled={exporting} aria-busy={exporting}>
                <span aria-hidden="true">{exporting ? '⏳' : '⤓'}</span> {exporting ? s.exporting : s.exportPdf}
              </button>
              <ShareMenu
                s={s}
                url={scenarioUrl({ g: gender, e: estate, c: currency, b: bequest, h: heirs, l: lang })}
                text={summaryText({ lang, views, currency, estateCents, bequestCents })}
              />
            </>
          }
        />
      </main>

      <footer className="footer" data-pdf-block>
        <p>{s.footer}</p>
        <p className="copyright">
          © {new Date().getFullYear()}{' '}
          <a href={COPYRIGHT_URL} target="_blank" rel="author noopener noreferrer" lang="en" dir="ltr">
            Thabet Chelligue
          </a>
        </p>
      </footer>
    </div>
  );
}
