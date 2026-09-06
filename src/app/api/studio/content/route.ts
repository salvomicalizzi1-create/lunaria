import { NextResponse } from 'next/server';
import { DEV_ONLY, paths, readJson, writeJson, setPath } from '@/lib/studio/server';

/**
 * Saves edited text back into the two message files.
 *
 * It writes values into keys that already exist and refuses anything else. That
 * single rule is what keeps the two languages in step: the panel cannot create
 * a key in Italian without one existing in English, because it cannot create a
 * key at all.
 */
export async function POST(req: Request) {
  if (!DEV_ONLY) return NextResponse.json({ error: 'solo in sviluppo' }, { status: 404 });

  let body: { it?: Record<string, string>; en?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'richiesta illeggibile' }, { status: 400 });
  }

  const rejected: string[] = [];
  let saved = 0;

  for (const locale of ['it', 'en'] as const) {
    const edits = body[locale];
    if (!edits || Object.keys(edits).length === 0) continue;

    const file = await readJson<Record<string, unknown>>(paths.content(locale));
    for (const [key, value] of Object.entries(edits)) {
      if (typeof value !== 'string') { rejected.push(`${locale}: ${key} non è testo`); continue; }
      if (setPath(file, key, value)) saved += 1;
      else rejected.push(`${locale}: ${key} non esiste`);
    }
    await writeJson(paths.content(locale), file);
  }

  return NextResponse.json({ saved, rejected });
}
