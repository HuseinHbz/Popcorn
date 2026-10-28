// Code execution and unescaped markup (security reviews round 3 F8, round 4 G4, round 5 H5).
import { createElement } from 'react';

export const run = (code: string): unknown => eval(code); // expect: no-eval
export const build = (): unknown => new Function('return 1'); // expect: no-new-func, @typescript-eslint/no-implied-eval
export const Html = ({ html }: { html: string }) => <div dangerouslySetInnerHTML={{ __html: html }} />; // expect: react/no-danger
export const Link = () => <a href="javascript:void(0)">{null}</a>; // expect: react/jsx-no-script-url, no-script-url
export const Created = ({ html }: { html: string }) => createElement('div', { dangerouslySetInnerHTML: { __html: html } }); // expect: no-restricted-syntax
export const Spread = ({ html }: { html: string }) => <div {...{ dangerouslySetInnerHTML: { __html: html } }} />; // expect: no-restricted-syntax
export const Frame = ({ html, title }: { html: string; title: string }) => <iframe title={title} srcDoc={html} />; // expect: no-restricted-syntax
export const CreatedFrame = ({ html }: { html: string }) => createElement('iframe', { srcDoc: html }); // expect: no-restricted-syntax
export const TemplateKey = ({ html }: { html: string }) => createElement('div', { [`dangerouslySetInnerHTML`]: { __html: html } }); // expect: no-restricted-syntax
export const setInner = (node: HTMLElement, html: string): void => { node.innerHTML = html; }; // expect: no-restricted-syntax
export const setOuter = (node: HTMLElement, html: string): void => { node['outerHTML'] = html; }; // expect: no-restricted-syntax
export const insert = (node: HTMLElement, html: string): void => { node.insertAdjacentHTML('beforeend', html); }; // expect: no-restricted-syntax
export const fragment = (html: string): DocumentFragment => document.createRange().createContextualFragment(html); // expect: no-restricted-syntax

// Not raw HTML: a dynamic computed key, a stream write, reading innerHTML.
export const dynamicKey = (name: string, value: string) => ({ [`data-${name}`]: value });
export const writeChunk = (stream: { write: (chunk: string) => void }, chunk: string): void => { stream.write(chunk); };
export const readInner = (node: HTMLElement): string => node.innerHTML;
