import type { MetadataRoute } from 'next';
import { products } from '@/data/products';
import { collections, categories } from '@/data/collections';
import { routing } from '@/lib/i18n/routing';

/**
 * La mappa del sito: l'elenco delle pagine che vale la pena leggere.
 *
 * Non è una formalità. Un motore di ricerca arriva a una pagina solo se
 * qualcuno la collega o se qualcuno gliela indica, e ventiquattro schede
 * prodotto in fondo a due livelli di navigazione non le trova nessuno da solo.
 * Questo file le indica tutte, in tutte e due le lingue.
 *
 * **È generata, non scritta.** Nasce dagli stessi dati che fanno il sito, così
 * un capo aggiunto dal pannello entra nella mappa da solo. Una mappa scritta a
 * mano è una mappa che il giorno dopo mente, e una mappa che mente è peggio di
 * nessuna mappa: manda i motori su pagine che non ci sono.
 *
 * Ogni voce si porta dietro le sue lingue alternative. Serve a dire a Google
 * che `/it/prodotto/x` e `/en/prodotto/x` sono lo stesso capo detto in due
 * lingue, non due pagine che si copiano — che è come verrebbero trattate senza.
 */
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/** le due versioni di uno stesso indirizzo, per l'attributo hreflang */
function lingue(percorso: string) {
  return {
    languages: Object.fromEntries(
      routing.locales.map((l) => [l, `${BASE}/${l}${percorso}`]),
    ),
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const oggi = new Date();

  /* Le priorità non sono voti di bellezza: dicono a un motore da dove
     cominciare quando non ha tempo per tutto. La home apre il marchio, le
     schede prodotto sono quello che si cerca e quello che si compra, le pagine
     legali servono e non si cercano. */
  const pagine: { percorso: string; priorita: number; cadenza: 'daily' | 'weekly' | 'monthly' | 'yearly' }[] = [
    /* la home cambia ogni notte da sola: la luna che mostra è calcolata sul
       momento, e la prossima uscita si avvicina di un giorno al giorno */
    { percorso: '', priorita: 1, cadenza: 'daily' },
    { percorso: '/collezioni', priorita: 0.9, cadenza: 'weekly' },
    ...collections.map((c) => ({ percorso: `/collezioni/${c.id}`, priorita: 0.8, cadenza: 'weekly' as const })),
    ...categories.map((c) => ({ percorso: `/categoria/${c.id}`, priorita: 0.7, cadenza: 'weekly' as const })),
    ...products.map((p) => ({ percorso: `/prodotto/${p.slug}`, priorita: 0.8, cadenza: 'weekly' as const })),
    { percorso: '/aiuto', priorita: 0.5, cadenza: 'monthly' },
    ...['privacy', 'termini', 'recesso', 'cookie'].map((s) => ({
      percorso: `/legale/${s}`, priorita: 0.3, cadenza: 'yearly' as const,
    })),
  ];

  /* Carrello, cassa, account e ordini non ci sono, e non per dimenticanza:
     sono pagine che hanno senso solo per chi le sta già usando. Un risultato di
     ricerca che porta a un carrello vuoto è un risultato sprecato. */
  return routing.locales.flatMap((locale) =>
    pagine.map((p) => ({
      url: `${BASE}/${locale}${p.percorso}`,
      lastModified: oggi,
      changeFrequency: p.cadenza,
      priority: p.priorita,
      alternates: lingue(p.percorso),
    })),
  );
}
