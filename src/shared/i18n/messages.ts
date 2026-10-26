import type fa from './messages/fa.json';
import type { AppLocale } from './routing';

export type Messages = typeof fa;

const loaders: Record<AppLocale, () => Promise<{ default: Messages }>> = {
  fa: () => import('./messages/fa.json'),
  en: () => import('./messages/en.json'),
};

/** Loads the message catalogue for a locale; `en` must match the `fa` shape. */
export async function loadMessages(locale: AppLocale): Promise<Messages> {
  const catalogue = await loaders[locale]();
  return catalogue.default;
}
