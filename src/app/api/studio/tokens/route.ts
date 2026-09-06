import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'node:fs/promises';
import { DEV_ONLY, paths, replaceInBlock, isHex, checkContrastOn, regenerateAndCheck } from '@/lib/studio/server';

type Edit = { block: 'colour' | 'type'; key: string; value: string };

/**
 * Saves colours and text sizes, and refuses the ones that would hurt.
 *
 * The sequence matters. The file is patched, the theme is regenerated, and the
 * contrast gate runs — and if the gate says a pair fell below the readable
 * minimum, the original file is put back and the panel is told which pair and
 * by how much. So the worst outcome of a bad colour is a message, never a page
 * somebody cannot read.
 */
export async function POST(req: Request) {
  if (!DEV_ONLY) return NextResponse.json({ error: 'solo in sviluppo' }, { status: 404 });

  let edits: Edit[];
  try {
    const body = await req.json();
    edits = Array.isArray(body?.edits) ? body.edits : [];
  } catch {
    return NextResponse.json({ error: 'richiesta illeggibile' }, { status: 400 });
  }
  if (edits.length === 0) return NextResponse.json({ saved: 0, errors: [] });

  const original = await readFile(paths.tokens, 'utf8');
  let source = original;
  const errors: string[] = [];

  for (const edit of edits) {
    if (edit.block !== 'colour' && edit.block !== 'type') {
      errors.push(`blocco "${edit.block}" non modificabile da qui`);
      continue;
    }
    if (edit.block === 'colour' && !isHex(edit.value)) {
      errors.push(`${edit.key}: "${edit.value}" non è un colore in formato #RRGGBB.`);
      continue;
    }
    if (edit.block === 'type' && !/^[\w\s.,()%-]+$/.test(edit.value)) {
      errors.push(`${edit.key}: valore non ammesso.`);
      continue;
    }
    const res = replaceInBlock(source, edit.block, edit.key, edit.value);
    if (!res.ok) { errors.push(res.error); continue; }
    source = res.source;
  }

  if (errors.length) return NextResponse.json({ saved: 0, errors }, { status: 400 });

  /* Il controllo viene PRIMA della scrittura, e questo è il punto.
     Scrivere e poi disfare sembrava equivalente e non lo era: salvando, lo
     sviluppo ricarica la pagina, il browser annulla la richiesta in corso, e il
     gestore moriva fra la scrittura e il controllo lasciando il colore cattivo
     sul disco. Una versione proposta che non passa non viene scritta affatto,
     quindi non c'è nessun momento in cui si possa essere interrotti. */
  const gate = checkContrastOn(source);
  if (!gate.ok) {
    return NextResponse.json({
      saved: 0,
      errors: [
        'Questo colore rende illeggibile del testo, quindi non l\'ho salvato. Il sito è rimasto com\'era.',
        ...gate.failures.slice(0, 6),
      ],
    }, { status: 400 });
  }

  await writeFile(paths.tokens, source, 'utf8');
  const gen = await regenerateAndCheck();
  if (!gen.ok) {
    // la versione proposta era buona: se la generazione fallisce è un guasto
    // vero, e il file di partenza torna al suo posto
    await writeFile(paths.tokens, original, 'utf8');
    await regenerateAndCheck();
    return NextResponse.json({
      saved: 0,
      errors: ['Non sono riuscito a rigenerare il tema, quindi ho rimesso il file com\'era.', gen.output.slice(0, 400)],
    }, { status: 500 });
  }

  return NextResponse.json({
    saved: edits.length,
    errors: [],
    checked: gate.checked,
    output: gen.output,
  });
}
