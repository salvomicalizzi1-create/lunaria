import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/lib/i18n/routing';

/**
 * In Next.js 16 this file is called `proxy.ts`; it is what earlier versions
 * called `middleware.ts`. It runs before every request and puts the visitor on
 * the right language path.
 */
const intl = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const response = intl(request);

  /* The reading mode is gone, but the cookie it wrote is still sitting in the
     browser of everybody who ever used the switch, and the cookie page now says
     this site sets none. Rather than let that sentence be false for returning
     visitors, the cookie is expired the next time they arrive. It will stop
     being needed once nobody has it; until then it costs one header. */
  if (request.cookies.has('lunaria-mode')) {
    response.cookies.set('lunaria-mode', '', { path: '/', maxAge: 0 });
  }

  return response;
}

export const config = {
  // everything except Next's own files, the API routes, the development-only
  // editing panel, and anything with a dot in it (images, fonts, robots.txt)
  matcher: '/((?!api|studio|_next|_vercel|.*\\..*).*)',
};
