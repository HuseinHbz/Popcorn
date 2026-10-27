import { notFound } from 'next/navigation';

/** Sends every unmatched path under a locale to the localized 404 (`../not-found.tsx`). */
export default function CatchAll(): never {
  notFound();
}
