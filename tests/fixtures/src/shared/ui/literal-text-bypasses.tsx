// Literal user-facing text in the shapes the plain-literal rules do not see (story AC4).
type Props = { ok: boolean; name?: string; label: string; t: (key: string) => string };

export const Wrapped = () => <p>{'Hello world'}</p>; // expect: react/jsx-no-literals
export const InTemplate = () => <p>{`Hello world`}</p>; // expect: react/jsx-no-literals
export const Conditional = ({ ok }: Props) => <p aria-label={ok ? 'Yes' : 'No'} />; // expect: no-restricted-syntax, no-restricted-syntax
export const Fallback = ({ name }: Props) => <input type="image" alt={name ?? 'Photo'} />; // expect: no-restricted-syntax
export const Nested = ({ ok, name }: Props) => <p title={ok ? (name ?? 'Guest') : `Nobody`} />; // expect: no-restricted-syntax, no-restricted-syntax
export const Submit = () => <input type="submit" value="Send" />; // expect: no-restricted-syntax
export const Reset = () => <input type="reset" value={'Clear'} />; // expect: no-restricted-syntax
export const Partial = ({ ok }: Props) => <p aria-label={ok ? 'Yes' : undefined}>{''}</p>; // expect: no-restricted-syntax, react/jsx-no-literals
export const ChildBranch = ({ ok }: Props) => <p>{ok ? 'Yes' : 'No'}</p>; // expect: no-restricted-syntax, no-restricted-syntax
export const ChildFallback = ({ name }: Props) => <p>{name ?? 'Guest'}</p>; // expect: no-restricted-syntax
export const FragmentBranch = ({ ok, name }: Props) => <>{ok ? (name ?? 'Guest') : null}</>; // expect: no-restricted-syntax
export const ButtonBranch = ({ ok }: Props) => <input type="submit" value={ok ? 'Send' : 'Save'} />; // expect: no-restricted-syntax, no-restricted-syntax
export const AsConstLabel = () => <button aria-label={'Close' as const} />; // expect: no-restricted-syntax
export const AsConstChild = () => <p>{'Hello' as const}</p>; // expect: no-restricted-syntax

// Not user-facing text, or text that comes from next-intl: no findings.
export const Field = ({ label }: Props) => <input type="text" value={label} aria-label={label} />;
export const Checkbox = () => <input type="checkbox" value="on" />;
export const KeyChoice = ({ ok, t }: Props) => <p aria-label={t(ok ? 'yes' : 'no')}>{t('body')}</p>;
export const TranslatedBranch = ({ ok, t }: Props) => <p>{ok ? t('yes') : t('no')}</p>;
