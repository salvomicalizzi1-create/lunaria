import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { APP } from './server';

const run = promisify(execFile);

/**
 * Dal pannello al sito online, in un gesto solo.
 *
 * Il pannello scrive sul disco e lì si ferma: git non lo sa, Vercel nemmeno.
 * Quel buco è una rete — si può provare e disfare senza che nessuno veda — ma
 * quando si è contenti va colmato, e colmarlo a mano voleva dire tre comandi
 * che chi non usa il terminale non ha motivo di conoscere.
 *
 * Qui la catena diventa una: deposita quello che è cambiato, lo manda su
 * GitHub, e Vercel compila e pubblica da sé.
 *
 * **E poi aspetta, e chiede a Vercel.** È la parte che conta, ed è la seconda
 * che scrivo. La prima guardava l'html del sito e aspettava che cambiasse un
 * identificativo dentro la pagina. Aveva due difetti, e nessuno dei due si
 * vedeva finché non l'ho provata: quell'identificativo apparteneva alla pagina
 * di login di Vercel e non al sito, e soprattutto — guardando UNA pagina non si
 * vede una modifica che ne tocca un'altra. Cambiare il nome di un capo non
 * cambia la home, e l'attesa sarebbe scaduta dicendo che qualcosa non va
 * mentre era andato tutto bene.
 *
 * Adesso si chiede a chi lo sa: si cerca la pubblicazione che porta ESATTAMENTE
 * il commit appena mandato. Così si sa quando è online, e si sa anche quando la
 * compilazione è **fallita** — che l'html non avrebbe mai potuto dire.
 */

/**
 * L'indirizzo del sito **pubblicato**, che non è quello su cui gira il pannello.
 *
 * Il primo tentativo leggeva `NEXT_PUBLIC_SITE_URL`, ed era sbagliato: in
 * sviluppo quella variabile vale `http://localhost:3000`, giustamente — serve
 * ai metadati della pagina che stai guardando. Il pannello però deve parlare
 * del sito vero, e con quella parlava di sé stesso.
 *
 * Si può scavalcare con `LUNARIA_SITO_ONLINE` nel `.env.local`, per esempio
 * quando arriverà un dominio proprio.
 */
export const SITO = process.env.LUNARIA_SITO_ONLINE ?? 'https://lunaria-varco-net.vercel.app';
const PROGETTO = process.env.LUNARIA_PROGETTO_VERCEL ?? 'lunaria';

const git = async (...args: string[]) => {
  const { stdout } = await run('git', args, { cwd: APP, windowsHide: true });
  return stdout.trim();
};

/** Da quali file sono cambiati, una frase che dica cosa si è toccato. */
function descrivi(file: string[]): string {
  const parti: string[] = [];
  const ha = (frammento: string) => file.some((f) => f.includes(frammento));

  if (ha('src/content/')) parti.push('testi');
  if (ha('src/data/products')) parti.push('capi e prezzi');
  if (ha('src/data/collections')) parti.push('collezioni');
  if (ha('src/data/moons')) parti.push('uscite');
  if (ha('src/data/oracle')) parti.push('oracolo');
  if (ha('src/design/tokens')) parti.push('colori e misure');
  if (ha('public/images/')) parti.push('immagini');

  if (!parti.length) return 'Modifiche dal pannello';
  return `Dal pannello: ${parti.join(', ')}`;
}

export type EsitoPubblica = {
  ok: boolean;
  messaggio: string;
  /** il commit mandato: è la chiave per riconoscere la sua pubblicazione */
  sha: string | null;
  file?: number;
  dettaglio?: string;
};

export async function pubblica(): Promise<EsitoPubblica> {
  let cambiati: string[] = [];
  try {
    const stato = await git('status', '--porcelain');
    cambiati = stato.split('\n').map((r) => r.slice(3).trim()).filter(Boolean);
  } catch (e) {
    return { ok: false, sha: null, messaggio: 'Non riesco a leggere lo stato del progetto.', dettaglio: String((e as Error).message) };
  }

  /* Può non esserci niente di nuovo sul disco e avere comunque roba da mandare:
     succede se un invio precedente si è interrotto a metà. */
  let daMandare = 0;
  try {
    daMandare = Number(await git('rev-list', '--count', 'origin/main..HEAD')) || 0;
  } catch { /* remoto non ancora conosciuto: si prova a mandare lo stesso */ }

  if (!cambiati.length && daMandare === 0) {
    return { ok: true, sha: null, file: 0, messaggio: 'Non c’è niente di nuovo da mandare: il sito online è già aggiornato.' };
  }

  if (cambiati.length) {
    try {
      await git('add', '-A');
      await git('commit', '-m', descrivi(cambiati));
    } catch (e) {
      return { ok: false, sha: null, messaggio: 'Non sono riuscito a depositare le modifiche.', dettaglio: String((e as Error).message).slice(0, 300) };
    }
  }

  const sha = await git('rev-parse', 'HEAD').catch(() => null);

  try {
    await git('push', 'origin', 'main');
  } catch (e) {
    const testo = String((e as Error).message);
    const accesso = /Authentication|could not read Username|403|denied/i.test(testo);
    return {
      ok: false,
      sha,
      messaggio: accesso
        ? 'Le modifiche sono depositate, ma GitHub non mi ha fatto entrare. Le manderò appena l’accesso torna valido.'
        : 'Le modifiche sono depositate, ma l’invio a GitHub non è riuscito.',
      dettaglio: testo.slice(0, 300),
    };
  }

  return {
    ok: true,
    sha,
    file: cambiati.length,
    messaggio: cambiati.length
      ? `${cambiati.length} file mandati su. Vercel sta compilando.`
      : 'Mandato su quello che era rimasto indietro. Vercel sta compilando.',
  };
}

/* --------------------------------------------------- e adesso, com'è andata */

export type StatoPubblicazione = {
  stato: 'in coda' | 'compila' | 'online' | 'fallita' | 'sconosciuto';
  url?: string;
  dettaglio?: string;
};

/**
 * Dove sta la pubblicazione di un certo commit.
 *
 * Si guarda solo fra quelle di produzione, e si cerca il commit per nome: se ne
 * fossero partite due ravvicinate, quella giusta è la sua e non «la più
 * recente».
 */
export async function statoPubblicazione(sha: string): Promise<StatoPubblicazione> {
  /* Il nome del progetto arriva da una variabile d'ambiente e finisce in una
     riga di comando: si controlla che sia un nome e nient'altro. Con la shell
     di mezzo, un nome con dentro un punto e virgola sarebbe un secondo comando. */
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(PROGETTO)) {
    return { stato: 'sconosciuto', dettaglio: 'nome del progetto Vercel non valido' };
  }

  let dati: { deployments?: { state?: string; target?: string; url?: string; meta?: Record<string, string> }[] };
  try {
    /* Serve la shell, e non per pigrizia: su Windows `npx` è `npx.cmd`, e da
       Node 20 eseguire un `.cmd` senza shell viene rifiutato con EINVAL — è una
       chiusura voluta, dopo che i `.cmd` si erano rivelati una via d'ingresso.
       Da qui la validazione qui sopra: con la shell, quello che si passa non è
       più un elenco di argomenti ma una riga che qualcuno potrebbe allungare. */
    const { stdout } = await run(
      `npx --yes vercel ls ${PROGETTO} --json`,
      [],
      { cwd: APP, windowsHide: true, maxBuffer: 8 * 1024 * 1024, shell: true },
    );
    /* la CLI antepone una riga di servizio al json: si parte dalla prima graffa */
    dati = JSON.parse(stdout.slice(stdout.indexOf('{')));
  } catch (e) {
    return { stato: 'sconosciuto', dettaglio: String((e as Error).message).slice(0, 200) };
  }

  const mia = (dati.deployments ?? []).find(
    (d) => d.target === 'production' && d.meta?.githubCommitSha === sha,
  );

  /* non ancora comparsa: GitHub deve prima avvisare Vercel */
  if (!mia) return { stato: 'in coda' };

  const url = mia.url ? `https://${mia.url}` : undefined;
  switch (mia.state) {
    case 'READY': return { stato: 'online', url };
    case 'ERROR':
    case 'CANCELED': return { stato: 'fallita', url };
    default: return { stato: 'compila', url };
  }
}
