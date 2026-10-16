import { ReactNode, useState } from 'react';
import { Flags, Step } from '../engine/calculate';
import { Fraction } from '../engine/fraction';
import { formatMoney, formatPercent } from '../engine/money';
import { track } from '../analytics';
import { formatStep } from '../i18n/messages';
import { heirName, Lang, ruleIdLabel, Strings, t } from '../i18n/strings';
import { PersonView } from './Circle';
import { familyIndex } from './layout';
import { ruleText } from './rules';

const BANNERS: { flag: keyof Flags & keyof Strings['banners']; rule: string }[] = [
  { flag: 'umar', rule: '21' },
  { flag: 'awl', rule: '18' },
  { flag: 'radd', rule: '19' },
  { flag: 'mushtaraka', rule: '22' },
  { flag: 'grandfatherSpecial', rule: '23' },
  { flag: 'akdariyya', rule: '24' },
  { flag: 'spouseReturn', rule: '26' },
  { flag: 'stateTakesAll', rule: '27' },
];

interface Props {
  lang: Lang;
  views: PersonView[];
  steps: Step[];
  flags: Flags;
  currency: string;
  estateCents: bigint;
  bequestCents: bigint;
  netCents: bigint;
  actions?: ReactNode;
}

export function Results({ lang, views, steps, flags, currency, estateCents, bequestCents, netCents, actions }: Props) {
  const s = t(lang);
  const alive = views.filter((v) => v.alive);
  const paid = alive.filter((v) => v.share?.isPositive());
  const totalCents = paid.reduce((s, v) => s + (v.cents ?? 0n), 0n);
  const totalShare = Fraction.sum(paid.map((v) => v.share!));
  const blockedCount = alive.filter((v) => v.status === 'blocked').length;

  // Heirs' shares are of the net estate (after the bequest), so they always total 100%.
  const segments: Segment[] = paid.map((v) => ({
    key: String(v.id),
    name: v.name,
    fill: `var(--series-${familyIndex(v.type) + 1})`,
    share: v.share!,
    cents: v.cents ?? 0n,
  }));
  const families = [...new Set(paid.map((v) => familyIndex(v.type)))].sort((a, b) => a - b);

  return (
    <section className="results" aria-label={s.results}>
      {actions && <div className="results__actions no-print">{actions}</div>}
      <div className="tiles" data-pdf-block>
        <div className="tile">
          <span className="tile__label">{s.tileEstate}</span>
          <bdi className="tile__value">{formatMoney(estateCents, currency)}</bdi>
        </div>
        {bequestCents > 0n && (
          <>
            <div className="tile">
              <span className="tile__label">{s.tileBequest}</span>
              <bdi className="tile__value tile__value--gold">{formatMoney(bequestCents, currency)}</bdi>
            </div>
            <div className="tile">
              <span className="tile__label">{s.tileNet}</span>
              <bdi className="tile__value">{formatMoney(netCents, currency)}</bdi>
            </div>
          </>
        )}
        <div className="tile">
          <span className="tile__label">{s.tileHeirs}</span>
          <span className="tile__value">{paid.length}</span>
        </div>
        <div className="tile">
          <span className="tile__label">{s.tileBlocked}</span>
          <span className="tile__value">{blockedCount}</span>
        </div>
      </div>
      {bequestCents > 0n && (
        <div className="banner banner--bequest" role="note" data-pdf-block>
          <span className="chip chip--static">{s.bequest}</span>
          {s.bequestBanner(formatMoney(bequestCents, currency), formatMoney(netCents, currency))}
        </div>
      )}
      {BANNERS.filter((b) => flags[b.flag]).map((b) => (
        <div className="banner" key={b.flag} role="note" data-pdf-block>
          <span className="chip chip--static">{s.rule(b.rule)}</span>
          {s.banners[b.flag]}
        </div>
      ))}

      {alive.length === 0 ? (
        <p className="empty">{s.empty}</p>
      ) : (
        <div className="results__grid">
          <div className="card" data-pdf-block>
            <h2>{s.distribution}</h2>
            <StackedBar segments={segments} families={families} currency={currency} s={s} />
            <ShareTable
              views={alive}
              hasBequest={bequestCents > 0n}
              currency={currency}
              totalCents={totalCents}
              totalShare={totalShare}
              lang={lang}
            />
          </div>
          <div className="card" data-pdf-block>
            <h2>{s.rulesApplied}</h2>
            <RulesList steps={steps} lang={lang} />
          </div>
        </div>
      )}
    </section>
  );
}

interface Segment {
  key: string;
  name: string;
  fill: string;
  share: Fraction; // share of the net estate (drives width and %)
  cents: bigint;
}

function StackedBar({ segments, families, currency, s }: {
  segments: Segment[];
  families: number[];
  currency: string;
  s: Strings;
}) {
  const [hover, setHover] = useState<{ seg: Segment; x: number } | null>(null);
  if (segments.length === 0) return null;

  return (
    <div className="bar-wrap">
      <div className="bar" role="img" aria-label={s.barLabel} onMouseLeave={() => setHover(null)}>
        {segments.map((seg) => {
          const pct = seg.share.toNumber() * 100;
          return (
            <div
              key={seg.key}
              className="bar__seg"
              style={{ flexGrow: pct, background: seg.fill }}
              onPointerMove={(e) => {
                const box = e.currentTarget.parentElement!.getBoundingClientRect();
                setHover({ seg, x: e.clientX - box.left });
              }}
              onPointerDown={(e) => {
                const box = e.currentTarget.parentElement!.getBoundingClientRect();
                setHover({ seg, x: e.clientX - box.left });
              }}
            >
              <span className="bar__label">{seg.name}</span>
            </div>
          );
        })}
        {hover && (
          <div className="tooltip" style={{ left: hover.x }}>
            <strong>{hover.seg.name}</strong>
            <bdi>
              {hover.seg.share.toString()} · {formatPercent(hover.seg.share)}
            </bdi>
            <bdi>{formatMoney(hover.seg.cents, currency)}</bdi>
          </div>
        )}
      </div>
      {families.length > 1 && (
        <ul className="legend">
          {families.map((i) => (
            <li key={i}>
              <span className="swatch" style={{ background: `var(--series-${i + 1})` }} />
              {s.families[i]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ShareTable(props: {
  views: PersonView[];
  hasBequest: boolean;
  currency: string;
  totalCents: bigint;
  totalShare: Fraction;
  lang: Lang;
}) {
  const { views, hasBequest, currency, totalCents, totalShare, lang } = props;
  const s = t(lang);
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>{s.colName}</th>
            <th className="col-relation">{s.colRelation}</th>
            <th className="num">{s.colFraction}</th>
            <th className="num">{s.colPct}</th>
            <th className="num">{s.colAmount}</th>
          </tr>
        </thead>
        <tbody>
          {views.map((v) => {
            const positive = v.share?.isPositive();
            return (
              <tr key={v.id} className={positive ? '' : 'muted'}>
                <td>
                  <span className="swatch" style={{ background: positive ? `var(--series-${familyIndex(v.type) + 1})` : 'transparent' }} />
                  {v.name}
                  <span className="relation-inline">{heirName(v.type, 1, lang)}</span>
                </td>
                <td className="col-relation">{heirName(v.type, 1, lang)}</td>
                <td className="num"><bdi>{positive ? v.share!.toString() : '0'}</bdi></td>
                <td className="num"><bdi>{positive ? formatPercent(v.share!) : '0%'}</bdi></td>
                <td className="num">
                  {positive ? (
                    <bdi>{formatMoney(v.cents ?? 0n, currency)}</bdi>
                  ) : v.status === 'blocked' ? (
                    s.blockedBy(heirName(v.blocked!.by, 1, lang), v.type)
                  ) : (
                    s.nothingLeftShort
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td>{s.total}</td>
            <td className="col-relation" />
            <td className="num"><bdi>{totalShare.toString()}</bdi></td>
            <td className="num"><bdi>100%</bdi></td>
            <td className="num"><bdi>{formatMoney(totalCents, currency)}</bdi></td>
          </tr>
        </tfoot>
      </table>
      {hasBequest && <p className="table-note">{s.tableNote}</p>}
    </div>
  );
}

function RulesList({ steps, lang }: { steps: Step[]; lang: Lang }) {
  const [open, setOpen] = useState<number | null>(null);
  const s = t(lang);
  if (steps.length === 0) return <p className="empty">{s.noRules}</p>;
  return (
    <ol className="steps">
      {steps.map((step, i) => (
        <li key={i}>
          <button
            className="chip"
            aria-expanded={open === i}
            title={ruleText(step.rule, lang)}
            onClick={() => {
              if (open !== i) track('rule-opened', { rule: step.rule });
              setOpen(open === i ? null : i);
            }}
          >
            {s.rule(ruleIdLabel(step.rule, lang))}
          </button>
          <span>{formatStep(step, lang)}</span>
          {open === i && <pre className="rule-text">{ruleText(step.rule, lang) || s.noRuleText}</pre>}
        </li>
      ))}
    </ol>
  );
}
