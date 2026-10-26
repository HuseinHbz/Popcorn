import createMiddleware from 'next-intl/middleware';

import { routing } from './shared/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next internals, the table-QR route and static files.
  matcher: ['/((?!api|_next|_vercel|t/|.*\\..*).*)'],
};
