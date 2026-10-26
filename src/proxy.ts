import createMiddleware from 'next-intl/middleware';

import { routing } from './shared/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Locale routing for every page except API routes, Next internals, the table-QR
  // route and static files. Static files are matched by extension, not by "contains
  // a dot", so slugs such as `/fa/menu/em.cafe` still get locale handling.
  matcher: [
    '/((?!api(?:/|$)|_next/|_vercel/|t/|.*\\.(?:avif|css|gif|ico|jpe?g|js|map|png|svg|txt|webmanifest|webp|woff2?|xml)$).*)',
  ],
};
