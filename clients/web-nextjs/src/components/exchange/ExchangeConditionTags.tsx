'use client';

import {
  EXCHANGE_CONDITION_TAG_OPTIONS,
  type ExchangeCondition
} from '@terravision/shared';

type Props = {
  value: ExchangeCondition;
  onChange: (value: ExchangeCondition) => void;
  disabled?: boolean;
  idPrefix?: string;
};

export function ExchangeConditionTags({
  value,
  onChange,
  disabled = false,
  idPrefix = 'exchange-tag'
}: Props) {
  return (
    <fieldset className="tv-exchange-tag-fieldset">
      <legend className="tv-exchange-tag-legend">Bitki durumu etiketi</legend>
      <div className="tv-exchange-tag-group" role="group" aria-label="Durum etiketi seçin">
        {EXCHANGE_CONDITION_TAG_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              id={`${idPrefix}-${opt.value}`}
              className={`tv-exchange-tag-chip${selected ? ' tv-exchange-tag-chip--active' : ''}`}
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onChange(opt.value)}
            >
              <span className="tv-exchange-tag-chip-label">{opt.label}</span>
              <span className="tv-exchange-tag-chip-hint">{opt.hint}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
