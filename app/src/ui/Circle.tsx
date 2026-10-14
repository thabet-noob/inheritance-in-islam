import { useState } from 'react';
import { Blocked, ShareStatus } from '../engine/calculate';
import { Fraction } from '../engine/fraction';
import { HEIR_INFO, HeirType } from '../engine/heirs';
import { formatMoney, formatPercent } from '../engine/money';
import { heirName, Lang, ruleIdLabel, t } from '../i18n/strings';
import { ruleTitle } from './rules';

export interface PersonView {
  id: number;
  type: HeirType;
  name: string;
  alive: boolean;
  share?: Fraction;
  cents?: bigint;
  status?: ShareStatus;
  blocked?: Blocked;
}

const RING = 2 * Math.PI * 46;

export function blockedText(b: Blocked, lang: Lang) {
  return t(lang).blockedByRule(heirName(b.by, 1, lang), ruleIdLabel(b.rule, lang), ruleTitle(b.rule, lang), b.heir);
}

interface Props {
  view: PersonView;
  lang: Lang;
  currency: string;
  canRemove: boolean;
  onToggle: () => void;
  onRename: (name: string) => void;
  onRemove: () => void;
}

export function Circle({ view, lang, currency, canRemove, onToggle, onRename, onRemove }: Props) {
  const [editing, setEditing] = useState(false);
  const s = t(lang);
  const state = !view.alive
    ? 'off'
    : view.status === 'blocked'
      ? 'blocked'
      : view.share?.isPositive()
        ? 'on'
        : 'zero';
  const pct = state === 'on' && view.share ? view.share.toNumber() : 0;

  const hint =
    state === 'off'
      ? s.hintOff(view.name)
      : state === 'blocked'
        ? s.hintBlocked(view.name, blockedText(view.blocked!, lang))
        : state === 'zero'
          ? s.hintZero(view.name)
          : s.hintOn(view.name, view.share!.toString(), formatPercent(view.share!));

  return (
    <div className={`person person--${state}`}>
      <div className="person__disc-wrap">
        <svg className="person__ring" viewBox="0 0 100 100" aria-hidden="true">
          <circle className="ring-track" cx="50" cy="50" r="46" />
          {pct > 0 && (
            <circle
              className="ring-fill"
              cx="50"
              cy="50"
              r="46"
              strokeDasharray={`${Math.max(pct * RING, 2)} ${RING}`}
              transform="rotate(-90 50 50)"
            />
          )}
        </svg>
        <button className="person__disc" aria-pressed={view.alive} aria-label={hint} title={hint} onClick={onToggle}>
          {state === 'on' && (
            <>
              <span className="disc-frac">{view.share!.toString()}</span>
              <span className="disc-pct">{formatPercent(view.share!)}</span>
            </>
          )}
          {state === 'zero' && <span className="disc-frac">0</span>}
          {state === 'blocked' && <span className="disc-icon">⊘</span>}
          {state === 'off' && <span className="disc-initial">{HEIR_INFO[view.type].male ? '♂' : '♀'}</span>}
        </button>
        {state === 'blocked' && <span className="person__badge">{s.blockedBadge(view.type)}</span>}
        {canRemove && (
          <button className="person__remove" aria-label={s.remove(view.name)} title={s.remove(view.name)} onClick={onRemove}>
            ×
          </button>
        )}
      </div>

      {editing ? (
        <input
          className="person__name-input"
          autoFocus
          defaultValue={view.name}
          aria-label={s.name}
          onBlur={(e) => {
            onRename(e.currentTarget.value.trim());
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') setEditing(false);
          }}
        />
      ) : (
        <button className="person__name" title={s.rename} onClick={() => setEditing(true)}>
          {view.name}
        </button>
      )}

      <div className="person__amount" dir="auto">
        {state === 'on' && view.cents !== undefined && <bdi>{formatMoney(view.cents, currency)}</bdi>}
        {state === 'zero' && s.nothingLeft}
        {state === 'blocked' && s.blockedBy(heirName(view.blocked!.by, 1, lang), view.type)}
      </div>
    </div>
  );
}
