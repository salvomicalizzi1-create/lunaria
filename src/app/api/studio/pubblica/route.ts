import { NextResponse } from 'next/server';
import { DEV_ONLY } from '@/lib/studio/server';
import { pubblica, statoPubblicazione, SITO } from '@/lib/studio/pubblica';

/**
 * POST manda tutto online. GET dice a che punto è.
 *
 * Sono due chiamate e non una perché la compilazione dura una trentina di
 * secondi, e una richiesta appesa mezzo minuto è una richiesta che il browser
 * può chiudere per conto suo — e allora chi ha premuto non sa com'è finita.
 *
 * Così il POST torna subito dicendo cosa è partito, e il pannello poi bussa
 * ogni pochi secondi chiedendo «a che punto siamo». Chi guarda vede una cosa
 * che avanza invece di una rotella che gira.
 */

export async function POST() {
  if (!DEV_ONLY) return NextResponse.json({ error: 'solo in sviluppo' }, { status: 404 });
  const esito = await pubblica();
  return NextResponse.json({ ...esito, sito: SITO }, { status: esito.ok ? 200 : 400 });
}

export async function GET(req: Request) {
  if (!DEV_ONLY) return NextResponse.json({ error: 'solo in sviluppo' }, { status: 404 });

  const sha = new URL(req.url).searchParams.get('sha');
  if (!sha) return NextResponse.json({ error: 'manca il commit da seguire' }, { status: 400 });

  const stato = await statoPubblicazione(sha);
  return NextResponse.json({ ...stato, sito: SITO });
}
