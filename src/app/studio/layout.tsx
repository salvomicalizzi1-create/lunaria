import type { ReactNode } from 'react';

/**
 * The panel needs its own document.
 *
 * The root layout deliberately carries nothing — `<html>` and `<body>` are
 * created under [locale], because that is where the language is known. The
 * studio lives outside the language routing on purpose (it is not a page of the
 * shop and should not be translated, prefixed or indexed), so it has to open
 * the document itself.
 *
 * It is also the reason this file exists rather than a comment saying it works
 * anyway: without it the page still rendered, and Next threw a runtime error
 * over the top of it that no console check would have caught.
 */
export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it">
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body style={{ margin: 0, background: '#0B1020' }}>{children}</body>
    </html>
  );
}
