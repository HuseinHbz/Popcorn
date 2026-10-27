import { NotFoundContent } from '@/shared/ui/not-found';

/** Localized 404 for every unknown path under a locale segment (`/fa/…`, `/en/…`, `/t/…`). */
export default function NotFound() {
  return <NotFoundContent />;
}
