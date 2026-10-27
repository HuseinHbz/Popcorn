// Code execution and unescaped markup (security review round 3 F8, round 4 G4).
import { createElement } from 'react';

export const run = (code: string): unknown => eval(code); // expect: no-eval
export const build = (): unknown => new Function('return 1'); // expect: no-new-func, @typescript-eslint/no-implied-eval
export const Html = ({ html }: { html: string }) => <div dangerouslySetInnerHTML={{ __html: html }} />; // expect: react/no-danger
export const Link = () => <a href="javascript:void(0)">{null}</a>; // expect: react/jsx-no-script-url, no-script-url
export const Created = ({ html }: { html: string }) => createElement('div', { dangerouslySetInnerHTML: { __html: html } }); // expect: no-restricted-syntax
export const Spread = ({ html }: { html: string }) => <div {...{ dangerouslySetInnerHTML: { __html: html } }} />; // expect: no-restricted-syntax
export const Frame = ({ html, title }: { html: string; title: string }) => <iframe title={title} srcDoc={html} />; // expect: no-restricted-syntax
