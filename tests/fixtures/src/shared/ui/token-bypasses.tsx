// Colour, spacing, radius and font values in the shapes the plain rules do not see (ADR 0015).
import type { CSSProperties } from 'react';

type Props = { size: number; ok: boolean };

export const quotedKey = { 'color': 'black' }; // expect: no-restricted-syntax
export const templated = { color: `red` }; // expect: no-restricted-syntax
export const border = { border: '1px solid red' }; // expect: no-restricted-syntax
export const shadow = { boxShadow: '0 0 2px Black' }; // expect: no-restricted-syntax
export const outline = { 'outline': `2px dashed tomato` }; // expect: no-restricted-syntax
export const Circle = () => <circle fill="red" />; // expect: no-restricted-syntax
export const Stop = () => <stop stopColor={'white'} />; // expect: no-restricted-syntax
export const arbitraryProperty = 'p-4 hover:[color:red]'; // expect: no-restricted-syntax
export const Padded = () => <div style={{ padding: 8, borderRadius: '4px', fontFamily: 'serif' }} />; // expect: no-restricted-syntax, no-restricted-syntax, no-restricted-syntax
export const Spaced = () => <p style={{ marginTop: `1rem`, 'letterSpacing': '0.1em' }} />; // expect: no-restricted-syntax, no-restricted-syntax
export const ConditionalColor = ({ ok }: Props) => ({ color: ok ? 'crimson' : 'gray' }); // expect: no-restricted-syntax, no-restricted-syntax
export const ConditionalBorder = ({ ok }: Props) => ({ border: ok ? '1px solid red' : 'none' }); // expect: no-restricted-syntax
export const TemplateFill = () => <path fill={`red`} />; // expect: no-restricted-syntax
export const Negative = () => <p style={{ marginTop: -8 }} />; // expect: no-restricted-syntax
export const ConditionalSpacing = ({ ok }: Props) => <p style={{ padding: ok ? 8 : 16 }} />; // expect: no-restricted-syntax, no-restricted-syntax

// Dynamic values, custom properties, non-colour keywords and non-style data: no findings.
export const Dynamic = ({ size }: Props) => <div style={{ width: size, padding: `${String(size)}px`, '--accent-size': size } as CSSProperties} />;
export const Gradient = () => <circle fill="url(#brand)" stroke="currentColor" />;
export const Unfilled = () => <path fill="none" />;
export const solidBorder = { border: '1px solid' };
export const tier = { status: 'gold', label: 'red carpet' };
export const tokenClass = 'text-shu bg-washi p-4';
export const DynamicBranch = ({ ok, size }: Props) => <p style={{ padding: ok ? size : size * 2 }} />;
