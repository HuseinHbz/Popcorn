import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Baseline CSP. Next.js inlines bootstrap scripts, so `script-src` needs
 * 'unsafe-inline' until the nonce-based policy lands (plan §7, Phase 2) —
 * it must land before any staff-, CMS- or customer-supplied content renders.
 * Dev mode additionally needs 'unsafe-eval' for React's debugging tools.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Only TypeScript files are routed: a stray page.js would build and be served (security
  // review round 7, K4). tests/source-extensions.test.ts keeps such files out of src/.
  pageExtensions: ['tsx', 'ts'],
  // src/app/global-not-found.tsx answers every path no route matches with one localized,
  // server-rendered, uncached 404 (ADR 0018).
  experimental: { globalNotFound: true },
  headers: () => Promise.resolve([{ source: '/:path*', headers: securityHeaders }]),
};

const withNextIntl = createNextIntlPlugin('./src/shared/i18n/request.ts');

export default withNextIntl(nextConfig);
