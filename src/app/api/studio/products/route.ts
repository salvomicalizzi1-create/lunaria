import { NextResponse } from 'next/server';
import { DEV_ONLY, paths, readJson, writeJson, validateProducts } from '@/lib/studio/server';

type Edit = {
  slug: string;
  priceCents?: number;
  name?: { it?: string; en?: string };
  sizes?: { variantId: string; size: string; state: string; left?: number }[];
};

/**
 * Saves prices and availability.
 *
 * The panel sends only what changed, by slug, and the file is patched rather
 * than replaced. Sending the whole catalogue back would mean a stale panel
 * could silently undo an edit made in the editor five minutes earlier.
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

  type Product = {
    slug: string;
    priceCents: number;
    name: { it: string; en: string };
    variants: { id: string; sizes: { size: string; availability: { state: string; left?: number } }[] }[];
  };
  const products = await readJson<Product[]>(paths.products);
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  const errors: string[] = [];
  let saved = 0;

  for (const edit of edits) {
    const p = bySlug.get(edit.slug);
    if (!p) { errors.push(`${edit.slug}: capo inesistente`); continue; }

    if (edit.priceCents != null) {
      if (!Number.isInteger(edit.priceCents) || edit.priceCents <= 0) {
        errors.push(`${edit.slug}: il prezzo va scritto in centesimi, come numero intero.`);
      } else { p.priceCents = edit.priceCents; saved += 1; }
    }
    if (edit.name?.it) { p.name.it = edit.name.it; saved += 1; }
    if (edit.name?.en) { p.name.en = edit.name.en; saved += 1; }

    for (const s of edit.sizes ?? []) {
      const variant = p.variants.find((v) => v.id === s.variantId);
      const size = variant?.sizes.find((z) => z.size === s.size);
      if (!size) { errors.push(`${edit.slug}: taglia ${s.size} non trovata`); continue; }
      size.availability = s.state === 'low-stock'
        ? { state: 'low-stock', left: Number(s.left) || 1 }
        : { state: s.state };
      saved += 1;
    }
  }

  /* checked before it touches the disk, not after: a catalogue that fails these
     rules stops the whole site from starting */
  const problems = validateProducts(products);
  if (problems.length) return NextResponse.json({ saved: 0, errors: problems }, { status: 400 });
  if (errors.length) return NextResponse.json({ saved: 0, errors }, { status: 400 });

  await writeJson(paths.products, products);
  return NextResponse.json({ saved, errors: [] });
}
