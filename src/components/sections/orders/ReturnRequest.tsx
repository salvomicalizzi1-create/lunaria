'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';

type Line = { key: string; label: string };

const REASONS = ['size', 'expectation', 'quality', 'wrong', 'changed'] as const;
type Reason = (typeof REASONS)[number];

/**
 * The return request.
 *
 * It is honest about what it is: this shop has no service that could register a
 * return, so the form does not pretend to file one. It builds the complete
 * message — order number, the exact items, the reason, the reference — and hands
 * it to the customer's own mail client, addressed to a person. That is what a
 * small shop actually does, and it is the version that cannot fail silently: the
 * customer can see the message leave, and they keep a copy of it.
 *
 * The reference is derived from the order number so it is stable: asking twice
 * about the same return does not create a second one.
 */
export function ReturnRequest({
  orderNumber, email, lines,
}: {
  orderNumber: string;
  email: string;
  lines: Line[];
}) {
  const t = useTranslations('returns');
  const detailsId = useId();
  const reasonId = useId();
  const noteId = useId();

  const [picked, setPicked] = useState<string[]>([]);
  const [reason, setReason] = useState<Reason>('size');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reference = `${orderNumber}-R`;
  const chosen = lines.filter((l) => picked.includes(l.key));

  const body = [
    t('mailIntro'),
    '',
    `${t('mailOrder')}: ${orderNumber}`,
    `${t('mailReference')}: ${reference}`,
    `${t('mailEmail')}: ${email}`,
    '',
    `${t('mailItems')}:`,
    ...chosen.map((l) => `- ${l.label}`),
    '',
    `${t('mailReason')}: ${t(`reason_${reason}` as 'reason_size')}`,
    ...(note.trim() ? ['', `${t('mailNote')}:`, note.trim()] : []),
    '',
    t('mailClose'),
  ].join('\n');

  const href =
    `mailto:resi@lunaria.example?subject=${encodeURIComponent(`${t('mailSubject')} ${reference}`)}` +
    `&body=${encodeURIComponent(body)}`;

  function guard(e: React.MouseEvent) {
    if (chosen.length === 0) {
      e.preventDefault();
      setError(t('pickSomething'));
    }
  }

  return (
    <section className="ret" aria-labelledby={detailsId}>
      <h2 id={detailsId} className="ret__t">{t('title')}</h2>
      <p className="lede">{t('lede')}</p>

      <fieldset className="ret__items">
        <legend className="eyebrow">{t('whichItems')}</legend>
        {lines.map((l) => (
          <label className="ret__item" key={l.key}>
            <input
              type="checkbox"
              checked={picked.includes(l.key)}
              onChange={(e) => {
                setError(null);
                setPicked((prev) =>
                  e.target.checked ? [...prev, l.key] : prev.filter((k) => k !== l.key));
              }}
            />
            <span>{l.label}</span>
          </label>
        ))}
      </fieldset>

      <div className="fld">
        <label className="fld__label" htmlFor={reasonId}>{t('why')}</label>
        <select
          id={reasonId} className="fld__input"
          value={reason} onChange={(e) => setReason(e.target.value as Reason)}
        >
          {REASONS.map((r) => (
            <option key={r} value={r}>{t(`reason_${r}` as 'reason_size')}</option>
          ))}
        </select>
        <i className="fld__line" aria-hidden="true" />
      </div>

      <div className="fld">
        <label className="fld__label" htmlFor={noteId}>{t('anythingElse')}</label>
        <textarea
          id={noteId} className="fld__input" rows={3} maxLength={600}
          value={note} onChange={(e) => setNote(e.target.value)}
        />
        <i className="fld__line" aria-hidden="true" />
      </div>

      {error && <p className="fld__err" role="alert">{error}</p>}

      <a className="btn btn--primary" href={href} onClick={guard}>{t('send')}</a>

      <p className="ret__note">{t('note', { reference })}</p>
    </section>
  );
}

export default ReturnRequest;
