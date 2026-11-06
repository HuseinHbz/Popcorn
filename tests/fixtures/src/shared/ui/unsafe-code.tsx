// Code execution and unescaped markup (security reviews round 3 F8, round 4 G4, round 5 H5).
import Script from 'next/script';
import NextScript from 'next/script'; // expect: no-restricted-syntax
import * as ScriptModule from 'next/script'; // expect: no-restricted-syntax
import { createElement } from 'react';
import { jsx } from 'react/jsx-runtime';

export const run = (code: string): unknown => eval(code); // expect: no-eval
export const build = (): unknown => new Function('return 1'); // expect: no-new-func, @typescript-eslint/no-implied-eval
export const Html = ({ html }: { html: string }) => <div dangerouslySetInnerHTML={{ __html: html }} />; // expect: react/no-danger, no-restricted-syntax
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
export const written = (html: string): void => { document.write(html); }; // expect: no-restricted-syntax, @typescript-eslint/no-deprecated
export const writtenLine = (html: string): void => { window.document.writeln(html); }; // expect: no-restricted-syntax, @typescript-eslint/no-deprecated
export const setSrcdoc = (frame: HTMLIFrameElement, html: string): void => { frame.srcdoc = html; }; // expect: no-restricted-syntax
export const setTemplateMember = (node: HTMLElement, html: string): void => { node[`innerHTML`] = html; }; // expect: no-restricted-syntax
export const assigned = (node: HTMLElement, html: string): HTMLElement => Object.assign(node, { innerHTML: html }); // expect: no-restricted-syntax
export const srcdocAttribute = (frame: HTMLIFrameElement, html: string): void => { frame.setAttribute('srcdoc', html); }; // expect: no-restricted-syntax
export const insertComputed = (node: HTMLElement, html: string): void => { node['insertAdjacentHTML']('beforeend', html); }; // expect: no-restricted-syntax
export const unsafeSet = (node: Element, html: string): void => { node.setHTMLUnsafe(html); }; // expect: no-restricted-syntax
export const unsafeParse = (html: string): Document => Document.parseHTMLUnsafe(html); // expect: no-restricted-syntax
export const parsed = (html: string): Document => new DOMParser().parseFromString(html, 'text/html'); // expect: no-restricted-syntax
export const handler = (node: HTMLElement, code: string): void => { node.setAttribute('onclick', code); }; // expect: no-restricted-syntax
export const reflected = (node: HTMLElement, html: string): boolean => Reflect.set(node, 'innerHTML', html); // expect: no-restricted-syntax
export const sinkKey = 'outerHTML'; // expect: no-restricted-syntax
export const castLeft = (node: HTMLElement, html: string): void => { (node.innerHTML as string) = html; }; // expect: no-restricted-syntax, @typescript-eslint/no-unnecessary-type-assertion
export const bangLeft = (node: HTMLElement, html: string): void => { node.innerHTML! = html; }; // expect: no-restricted-syntax, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unnecessary-type-assertion
export const frameWrite = (frame: HTMLIFrameElement, html: string): void => { frame.contentDocument?.write(html); }; // expect: no-restricted-syntax, @typescript-eslint/no-deprecated
export const computedWrite = (html: string): void => { document['write'](html); }; // expect: no-restricted-syntax, @typescript-eslint/no-deprecated
export const viaCall = (node: HTMLElement, html: string): void => { node.insertAdjacentHTML.call(node, 'beforeend', html); }; // expect: no-restricted-syntax
export const viaApply = (node: HTMLElement, html: string): void => { Element.prototype.insertAdjacentHTML.apply(node, ['beforeend', html]); }; // expect: no-restricted-syntax
export const viaBind = (range: Range) => range.createContextualFragment.bind(range); // expect: no-restricted-syntax
export const destructured = (node: Element): ((html: string) => void) => { const { setHTMLUnsafe } = node; return setHTMLUnsafe; }; // expect: no-restricted-syntax, @typescript-eslint/unbound-method
export const arrayWrite = (node: HTMLElement, html: string): void => { [node.innerHTML] = [html]; }; // expect: no-restricted-syntax
export const objectWrite = (node: HTMLElement, html: string): void => { ({ a: node.outerHTML } = { a: html }); }; // expect: no-restricted-syntax
export const defaultWrite = (node: HTMLElement, html: string): void => { [node.innerHTML = html] = []; }; // expect: no-restricted-syntax
export const loopWrite = (node: HTMLElement, html: string): void => { for (node.innerHTML of [html]) node.focus(); }; // expect: no-restricted-syntax
export const templateHandler = (node: HTMLElement, code: string): void => { node.setAttribute(`onclick`, code); }; // expect: no-restricted-syntax
export const namespacedHandler = (node: HTMLElement, code: string): void => { node.setAttributeNS(null, 'onclick', code); }; // expect: no-restricted-syntax
export const handlerAttribute = (): Attr => document.createAttribute('onclick'); // expect: no-restricted-syntax
export const editHtml = (html: string): boolean => document.execCommand('insertHTML', false, html); // expect: no-restricted-syntax, @typescript-eslint/no-deprecated
export const Inline = ({ code }: { code: string }) => <script>{code}</script>; // expect: no-restricted-syntax
export const scriptUrl = (code: string): void => { location.href = `javascript:${code}`; }; // expect: no-restricted-syntax
export const NextInline = ({ code }: { code: string }) => <Script id="inline">{code}</Script>; // expect: no-restricted-syntax
export const scriptElement = (code: string): HTMLScriptElement => { const element = document.createElement('script'); element.text = code; return element; }; // expect: no-restricted-syntax
export const scriptNode = (code: string) => createElement('script', null, code); // expect: no-restricted-syntax
export const computedExec = (html: string): boolean => document['execCommand']('insertHTML', false, html); // expect: no-restricted-syntax, @typescript-eslint/no-deprecated
export const NextDanger = ({ code }: { code: string }) => <Script id="danger" dangerouslySetInnerHTML={{ __html: code }} />; // expect: no-restricted-syntax
export const Renamed = ({ code }: { code: string }) => <NextScript id="renamed">{code}</NextScript>; // reported on its import
export const Namespaced = () => <ScriptModule.default src="/a.js" />; // reported on its import
export const scriptComponent = (code: string) => createElement(Script, { id: 'created' }, code); // expect: no-restricted-syntax
export const scriptRuntime = (code: string) => jsx(Script, { id: 'runtime', children: code }); // expect: no-restricted-syntax
export const templateTag = (): HTMLElement => document.createElement(`script`); // expect: no-restricted-syntax
export const tagName = 'script'; // expect: no-restricted-syntax
export const computedCreate = (): HTMLElement => document['createElement']('script'); // expect: no-restricted-syntax, @typescript-eslint/no-deprecated
export const calledCreate = (): HTMLElement => document.createElement.call(document, 'script'); // expect: no-restricted-syntax, @typescript-eslint/no-deprecated
export const runtimeTag = (code: string) => jsx('script', { children: code }); // expect: no-restricted-syntax

// Not raw HTML: a dynamic computed key, a stream write, reading innerHTML (also by
// destructuring and by iterating), other attributes and values, a sink name in a type, a
// template URL.
export const dynamicKey = (name: string, value: string) => ({ [`data-${name}`]: value });
export const writeChunk = (stream: { write: (chunk: string) => void }, chunk: string): void => { stream.write(chunk); };
export const readInner = (node: HTMLElement): string => node.innerHTML;
export const readOuter = ({ outerHTML }: HTMLElement): string => outerHTML;
export const titled = (frame: HTMLIFrameElement, title: string): void => { frame.setAttribute('title', title); };
export type WithoutInner = Omit<HTMLElement, 'innerHTML'>;
export const online = (node: HTMLElement): void => { node.setAttribute('data-state', 'online'); };
export const characters = (node: HTMLElement): string[] => { const out: string[] = []; for (const ch of node.innerHTML) out.push(ch); return out; };
export const pageUrl = (path: string): string => `https://example.com/${path}`;
export const division = (): HTMLDivElement => document.createElement('div');
export const templateDivision = (): HTMLElement => document.createElement(`div`);
export const ExternalScript = () => <Script src="/analytics.js" />;
export const describedScript = 'scripts'; // a longer word, not the element name
export type Tag = 'script'; // a type, not a value
