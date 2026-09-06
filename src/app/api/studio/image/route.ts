import { NextResponse } from 'next/server';
import { writeFile, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { DEV_ONLY, safeImagePath } from '@/lib/studio/server';

const MAX = 8 * 1024 * 1024;

/**
 * Replaces one image, keeping its name.
 *
 * Keeping the name is the point: every reference in the code stays valid and
 * nothing else has to change. The one it replaced is copied next to it with a
 * `.precedente` suffix first, because "I have overwritten the only copy of that
 * photograph" is not a sentence this panel should be able to produce.
 */
export async function POST(req: Request) {
  if (!DEV_ONLY) return NextResponse.json({ error: 'solo in sviluppo' }, { status: 404 });

  const form = await req.formData();
  const file = form.get('file');
  const target = String(form.get('target') ?? '');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'nessun file ricevuto' }, { status: 400 });
  }
  if (file.size > MAX) {
    return NextResponse.json({
      error: `L'immagine pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. Il limite è 8 MB.`,
    }, { status: 400 });
  }

  const dest = safeImagePath(target);
  if (!dest) {
    return NextResponse.json({ error: 'destinazione non valida' }, { status: 400 });
  }

  if (existsSync(dest)) {
    await copyFile(dest, `${dest}.precedente`);
  }
  await writeFile(dest, Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({
    saved: target,
    bytes: file.size,
    backup: `${target}.precedente`,
  });
}
