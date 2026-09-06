import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Studio } from './Studio';

export const metadata: Metadata = {
  title: 'LUNARIA · studio',
  robots: { index: false, follow: false },
};

/* nothing here may be prepared ahead of time: it reads the project's own files */
export const dynamic = 'force-dynamic';

/**
 * The editing panel.
 *
 * It exists only while `npm run dev` is running. In a built site this page is a
 * 404 and so is every route behind it, which is the whole reason it is allowed
 * to write to the project's source files at all: the thing that makes it
 * powerful is the same thing that would make it a catastrophe in public.
 */
export default function StudioPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <Studio />;
}
