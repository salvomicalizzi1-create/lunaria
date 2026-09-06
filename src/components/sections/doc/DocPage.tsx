import { Link } from '@/lib/i18n/navigation';

export type DocSection = { h: string; p: string; tag?: boolean };

/**
 * A page of prose: help, or one of the legal notes.
 *
 * The tag is not decoration. Wherever the text is a placeholder that a real shop
 * would have to have written by a lawyer, the section says so in the section
 * itself rather than in a disclaimer at the bottom that nobody reaches. Somebody
 * skimming for the returns rule should not be able to mistake an example for a
 * commitment.
 */
export function DocPage({
  eyebrow, title, lede, sections, tagLabel, backHref, backLabel,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  sections: DocSection[];
  tagLabel: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="wrap doc" style={{ paddingBlock: 'var(--spacing-9)' }}>
      <p className="eyebrow">{eyebrow}</p>
      <h1 style={{ fontSize: 'var(--text-h1)', marginBlock: 'var(--spacing-3)' }}>{title}</h1>
      <p className="lede">{lede}</p>

      {sections.map((s, i) => (
        <section className="doc__s" key={i}>
          <h2>{s.h}</h2>
          {s.tag && <p><span className="tag">{tagLabel}</span></p>}
          <p>{s.p}</p>
        </section>
      ))}

      <p style={{ marginTop: 'var(--spacing-8)' }}>
        <Link className="btn btn--ghost" href={backHref}>{backLabel}</Link>
      </p>
    </div>
  );
}

export default DocPage;
