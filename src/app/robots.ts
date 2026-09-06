import type { MetadataRoute } from 'next';

/**
 * Il file che i motori di ricerca leggono per primo.
 *
 * Senza, un sito non è bloccato: è semplicemente muto. I motori entrano
 * comunque, ma nessuno ha detto loro dove guardare, quindi setacciano tutto,
 * comprese le pagine che non hanno senso in un risultato di ricerca.
 *
 * Qui si dicono due cose sole. La prima: si può entrare. La seconda: dove sta
 * la mappa, che è l'elenco esatto delle pagine che vale la pena leggere.
 *
 * Quello che resta fuori non è un segreto — le pagine di carrello, cassa,
 * account e ordini portano già `noindex` nei loro metadati. Escluderle anche
 * qui serve a un'altra cosa: un motore ha un tempo limitato da dedicare a un
 * sito, e ogni pagina inutile che apre è una pagina di catalogo che non apre.
 *
 * `/studio` e `/api` non esistono nemmeno, nel sito pubblicato: rispondono 404.
 * Sono elencati lo stesso perché un elenco che dice la verità sul sito è più
 * utile di uno che si fida.
 */
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  /* le zone che non portano da nessuna parte, in tutte e due le lingue */
  const private_ = ['carrello', 'checkout', 'account', 'ordini'];
  const escluse = ['it', 'en'].flatMap((l) => private_.map((p) => `/${l}/${p}`));

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...escluse, '/api/', '/studio'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
