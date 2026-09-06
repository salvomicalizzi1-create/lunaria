'use client';

import { useId, useRef, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { MONTHS_LONG } from '@/lib/moon';
import { nextMoonAt, moons, moonName } from '@/data/moons';

/**
 * The Circle: one email per new moon, thirteen a year, and a note under the form
 * saying exactly where the address goes — which today is nowhere. A newsletter
 * box that pretends to subscribe you is worse than no box at all.
 */
export function Circle() {
  const t = useTranslations('circle');
  const locale = useLocale() as 'it' | 'en';
  const emailId = useId();
  const consentId = useId();
  const msgId = useId();
  const noteId = useId();

  const emailRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ tone: 'err' | 'ok'; text: string } | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = emailRef.current?.value.trim() ?? '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setMsg({ tone: 'err', text: t('errEmail') });
      emailRef.current?.focus();
      return;
    }
    if (!consentRef.current?.checked) {
      setMsg({ tone: 'err', text: t('errConsent') });
      consentRef.current?.focus();
      return;
    }

    const drop = nextMoonAt(Date.now()) ?? moons[0];
    const when = new Date(drop.at);
    setMsg({
      tone: 'ok',
      text: t('done', {
        moon: moonName(drop, locale).toUpperCase(),
        day: String(when.getUTCDate()),
        month: MONTHS_LONG[locale][when.getUTCMonth()],
      }),
    });
    e.currentTarget.reset();
  }

  return (
    <section className="sec" id="cerchio" aria-labelledby="cerT">
      <div className="wrap">
        <div className="circle">
          <Image src="/images/cerchio.jpg" alt="" aria-hidden="true" width={1920} height={1080} sizes="100vw" />
          <div className="circle__in rise">
            <p className="eyebrow" style={{ color: 'rgb(242 240 234 / 0.7)' }}>{t('eyebrow')}</p>
            <h2 id="cerT">{t('heading')}</h2>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', maxWidth: '26ch' }}>
              {t('promise')}
            </p>
            <p style={{ maxWidth: '44ch', color: 'rgb(242 240 234 / 0.82)' }}>{t('terms')}</p>

            <form className="circle__form" onSubmit={onSubmit} noValidate>
              <div className="field">
                <label htmlFor={emailId}>{t('email')}</label>
                <input
                  type="email" id={emailId} name="email" ref={emailRef}
                  inputMode="email" autoComplete="email"
                  placeholder="nome@dominio.it"
                  aria-describedby={`${msgId} ${noteId}`}
                  required
                />
                <i className="field__line" aria-hidden="true" />
              </div>

              <label className="consent" htmlFor={consentId}>
                <input type="checkbox" id={consentId} name="consent" ref={consentRef} />
                <span>{t('consent')}</span>
              </label>

              <p className="formmsg" id={msgId} role="status" data-tone={msg?.tone}>
                {msg?.text}
              </p>

              <button className="btn btn--primary" type="submit">{t('submit')}</button>

              <p className="formnote" id={noteId}>{t('note')}</p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Circle;
