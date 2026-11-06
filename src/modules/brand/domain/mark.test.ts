import { describe, expect, it } from 'vitest';

import { parseMark } from './mark';

const SVG_OPEN =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" fill="currentColor" fill-rule="evenodd">';
const PATH = '<path d="M10 2L20 2L20 38Z"/>';
const mark = (body: string, open = SVG_OPEN): string => `${open}${body}</svg>`;
const svgWith = (attributes: string): string => mark(PATH, `<svg ${attributes}>`);
const BASE =
  'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" fill="currentColor" fill-rule="evenodd"';

describe('parseMark accepts the owner’s path-only shape', () => {
  it('reads the viewBox and every path', () => {
    const result = parseMark(mark(`${PATH}<path d="m1 1h2v2z" fill-rule="evenodd"/>`));
    expect(result).toEqual({
      ok: true,
      mark: {
        viewBox: '0 0 120 40',
        paths: [
          { d: 'M10 2L20 2L20 38Z', evenOdd: false },
          { d: 'm1 1h2v2z', evenOdd: true },
        ],
      },
    });
  });

  it.each([
    ['a trailing newline', `${mark(PATH)}\n`],
    ['whitespace between tags', `${SVG_OPEN}\n  ${PATH}\n</svg>`],
    ['an empty closing tag pair', mark('<path d="M0 0L1 1Z"></path>')],
    ['decimals, negatives and exponents', mark('<path d="M-1.5 2e-3C1,2 3,4 5,6Z"/>')],
  ])('with %s', (_case, svg) => {
    expect(parseMark(svg).ok).toBe(true);
  });
});

describe('parseMark rejects everything else, one case at a time', () => {
  it.each([
    ['transform on <svg>', svgWith(`${BASE} transform="scale(2)"`), 'attribute "transform"'],
    ['width on <svg>', svgWith(`${BASE} width="120"`), 'attribute "width"'],
    ['height on <svg>', svgWith(`${BASE} height="40"`), 'attribute "height"'],
    ['style on <svg>', svgWith(`${BASE} style="color:red"`), 'attribute "style"'],
    ['class on <svg>', svgWith(`${BASE} class="logo"`), 'attribute "class"'],
    ['id on <svg>', svgWith(`${BASE} id="logo"`), 'attribute "id"'],
    ['an event handler on <svg>', svgWith(`${BASE} onload="go()"`), 'attribute "onload"'],
    ['xlink:href on <svg>', svgWith(`${BASE} xlink:href="#a"`), 'attribute "xlink:href"'],
    ['another fill on <svg>', svgWith(BASE.replace('currentColor', 'none')), 'fill="currentColor"'],
    ['another fill-rule on <svg>', svgWith(BASE.replace('evenodd', 'nonzero')), 'evenodd'],
    ['no fill-rule on <svg>', svgWith(BASE.replace(' fill-rule="evenodd"', '')), 'fill-rule'],
    ['no fill on <svg>', svgWith(BASE.replace(' fill="currentColor"', '')), 'fill='],
    ['no viewBox', svgWith(BASE.replace(' viewBox="0 0 120 40"', '')), 'viewBox'],
    ['a malformed viewBox', svgWith(BASE.replace('0 0 120 40', '0 0 120')), 'viewBox'],
    ['no xmlns', svgWith(BASE.replace('xmlns="http://www.w3.org/2000/svg" ', '')), 'xmlns'],
    ['another xmlns', svgWith(BASE.replace('2000/svg', '2000/svgx')), 'xmlns'],
    ['a duplicated attribute', svgWith(`${BASE} fill="currentColor"`), 'twice'],
  ])('%s', (_case, svg, reason) => {
    const result = parseMark(svg);
    expect(result.ok).toBe(false);
    expect(result.ok ? '' : result.reason).toContain(reason);
  });

  it.each([
    [
      'transform on <path>',
      mark('<path d="M0 0Z" transform="scale(2)"/>'),
      'attribute "transform"',
    ],
    ['style on <path>', mark('<path d="M0 0Z" style="fill:red"/>'), 'attribute "style"'],
    ['class on <path>', mark('<path d="M0 0Z" class="a"/>'), 'attribute "class"'],
    ['id on <path>', mark('<path id="a" d="M0 0Z"/>'), 'attribute "id"'],
    ['fill on <path>', mark('<path d="M0 0Z" fill="currentColor"/>'), 'attribute "fill"'],
    ['another fill-rule on <path>', mark('<path d="M0 0Z" fill-rule="nonzero"/>'), 'evenodd'],
    ['no d on <path>', mark('<path fill-rule="evenodd"/>'), '"d"'],
    ['text in d', mark('<path d="M0 0 token=abc"/>'), 'path data'],
    ['d not starting with a move', mark('<path d="L0 0Z"/>'), 'path data'],
    ['a duplicated d', mark('<path d="M0 0Z" d="M1 1Z"/>'), 'twice'],
    ['a <path> with content', mark('<path d="M0 0Z">x</path>'), 'unexpected text'],
  ])('%s', (_case, svg, reason) => {
    const result = parseMark(svg);
    expect(result.ok).toBe(false);
    expect(result.ok ? '' : result.reason).toContain(reason);
  });

  it.each([
    ['a <g>', mark(`<g>${PATH}</g>`), 'element <g>'],
    ['a <metadata>', mark(`<metadata>x</metadata>${PATH}`), 'element <metadata>'],
    ['a <title>', mark(`<title>Nakaya</title>${PATH}`), 'element <title>'],
    ['a <script>', mark(`${PATH}<script>alert(1)</script>`), 'element <script>'],
    ['a <rect>', mark(`${PATH}<rect width="1" height="1"/>`), 'element <rect>'],
    ['a second <svg>', `${mark(PATH)}${mark(PATH)}`, 'element <svg>'],
    ['a comment', mark(`<!-- traced -->${PATH}`), 'comment'],
    ['text between paths', mark(`${PATH}stray${PATH}`), 'unexpected text'],
    ['no path at all', mark(''), 'at least one <path>'],
    ['a malformed <path>', mark("<path d='M0 0Z'/>"), 'malformed <path>'],
    ['an XML declaration first', `<?xml version="1.0"?>${mark(PATH)}`, 'one <svg>'],
    ['a comment first', `<!-- x -->${mark(PATH)}`, 'one <svg>'],
    ['single-quoted attributes', mark(PATH, SVG_OPEN.replaceAll('"', "'")), 'one <svg>'],
    ['an entity in an attribute', svgWith(BASE.replace('evenodd', 'even&amp;odd')), 'one <svg>'],
    ['no closing tag', SVG_OPEN + PATH, 'one <svg>'],
    ['an empty file', '', 'one <svg>'],
  ])('%s', (_case, svg, reason) => {
    const result = parseMark(svg);
    expect(result.ok).toBe(false);
    expect(result.ok ? '' : result.reason).toContain(reason);
  });
});
