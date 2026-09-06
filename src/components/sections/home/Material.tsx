import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

/**
 * The material, on a light island that stays light in both reading modes.
 *
 * Two hundred and forty grams is the number that answers "is this cheap
 * fabric", and it is the reason this section exists at all: a brand that will
 * not print its grammage is telling you something.
 */
export async function Material() {
  const t = await getTranslations('material');

  const spec: [string, string][] = [
    [t('kComposition'), t('vComposition')],
    [t('kWeight'), t('vWeight')],
    [t('kYarn'), t('vYarn')],
    [t('kYarnOrigin'), t('vYarnOrigin')],
    [t('kMadeIn'), t('vMadeIn')],
    [t('kShrinkage'), t('vShrinkage')],
    [t('kFit'), t('vFit')],
    [t('kCare'), t('vCare')],
  ];

  return (
    <section className="island island-day" id="materia" aria-labelledby="matT">
      <div className="wrap">
        <div className="mat">
          <div className="rise stack">
            <p className="eyebrow">{t('eyebrow')}</p>
            <h2 id="matT">{t('heading')}</h2>
            <p className="lede">{t('lede')}</p>

            <table className="spec">
              <caption className="vh">{t('caption')}</caption>
              <tbody>
                {spec.map(([k, v]) => (
                  <tr key={k}>
                    <th scope="row">{k}</th>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="legalnote">{t('legal')}</p>
          </div>

          <figure className="figure wipe">
            <Image
              src="/images/materia.jpg"
              alt={t('imageAlt')}
              width={1920}
              height={1080}
              sizes="(min-width: 1024px) 45vw, 100vw"
            />
          </figure>
        </div>
      </div>
    </section>
  );
}

export default Material;
