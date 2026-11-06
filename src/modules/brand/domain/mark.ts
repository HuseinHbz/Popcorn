/**
 * The only shape a brand mark may have (owner's allowlist, 2026-11-05; ADR 0019): one `<svg>`
 * with exactly `xmlns`, `viewBox`, `fill="currentColor"` and `fill-rule="evenodd"`, holding one
 * or more `<path>` elements with `d` and, optionally, `fill-rule="evenodd"`. Nothing else: no
 * other element, attribute or value, no text, comment or declaration, attributes in double
 * quotes and no entities. `fill-rule="evenodd"` keeps the counters of a, e and A open.
 *
 * One implementation, used by the CI scan-coverage check (gitleaks skips `.svg` by name, so a
 * mark must hold only path data) and by the logo pipeline, so the two can never disagree.
 */

/** One path of a mark: its path data, and whether it sets `fill-rule="evenodd"` itself. */
export type MarkPath = { readonly d: string; readonly evenOdd: boolean };

/** A mark that passed: its viewBox as written, and its paths in order. */
export type Mark = { readonly viewBox: string; readonly paths: readonly MarkPath[] };

export type MarkCheck =
  { readonly ok: true; readonly mark: Mark } | { readonly ok: false; readonly reason: string };

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const SVG_ATTRIBUTES = ['xmlns', 'viewBox', 'fill', 'fill-rule'];
const PATH_ATTRIBUTES = ['d', 'fill-rule'];

/** Double-quoted attributes with no entity or markup in their values. */
const ATTRIBUTES = String.raw`(?:\s+[^\s=<>"'/]+="[^"<>&]*")*`;
const ATTRIBUTE = /\s+([^\s=<>"'/]+)="([^"<>&]*)"/g;
const ROOT = new RegExp(String.raw`^\s*<svg(${ATTRIBUTES})\s*>([\s\S]*)</svg>\s*$`);
const PATH_OPEN = String.raw`\s*<path(${ATTRIBUTES})\s*(/?)>`;
const PATH_CLOSE = String.raw`\s*</path>`;
const VIEW_BOX = /^-?\d+(?:\.\d+)?(?:[ ,]+-?\d+(?:\.\d+)?){3}$/;
/** SVG path data: a move first, then only commands, numbers, separators and exponents. */
const PATH_DATA = /^\s*[Mm][\s\d.,+\-eEMmZzLlHhVvCcSsQqTtAa]*$/;

const reject = (reason: string): MarkCheck => ({ ok: false, reason });

/** Each attribute once, or the reason it is not. */
function parseAttributes(text: string, element: string): Map<string, string> | string {
  const attributes = new Map<string, string>();
  for (const [, name, value] of text.matchAll(ATTRIBUTE)) {
    if (attributes.has(String(name))) return `attribute "${String(name)}" twice on <${element}>`;
    attributes.set(String(name), String(value));
  }
  return attributes;
}

function unexpectedAttribute(
  attributes: Map<string, string>,
  allowed: readonly string[],
  element: string,
): string | undefined {
  const extra = [...attributes.keys()].find((name) => !allowed.includes(name));
  return extra === undefined ? undefined : `unexpected attribute "${extra}" on <${element}>`;
}

function svgProblem(attributes: Map<string, string>): string | undefined {
  const extra = unexpectedAttribute(attributes, SVG_ATTRIBUTES, 'svg');
  if (extra !== undefined) return extra;
  if (attributes.get('xmlns') !== SVG_NAMESPACE) return `<svg> needs xmlns="${SVG_NAMESPACE}"`;
  if (!VIEW_BOX.test(attributes.get('viewBox') ?? '')) {
    return '<svg> needs a viewBox of four numbers';
  }
  if (attributes.get('fill') !== 'currentColor') return '<svg> needs fill="currentColor"';
  if (attributes.get('fill-rule') !== 'evenodd') return '<svg> needs fill-rule="evenodd"';
  return undefined;
}

function pathFrom(text: string): MarkPath | string {
  const attributes = parseAttributes(text, 'path');
  if (typeof attributes === 'string') return attributes;
  const extra = unexpectedAttribute(attributes, PATH_ATTRIBUTES, 'path');
  if (extra !== undefined) return extra;
  const d = attributes.get('d');
  if (d === undefined) return '<path> needs a "d"';
  if (!PATH_DATA.test(d)) return '<path> "d" is not path data';
  const rule = attributes.get('fill-rule');
  if (rule !== undefined && rule !== 'evenodd') return '<path> fill-rule must be "evenodd"';
  return { d, evenOdd: rule === 'evenodd' };
}

/** Names what follows the last path, which is never allowed. */
function unexpected(rest: string): string {
  const content = rest.trimStart();
  if (content.startsWith('<!--')) return 'unexpected comment in <svg>';
  if (content.startsWith('<path')) {
    return 'a malformed <path> (double-quoted d and fill-rule only, no entities)';
  }
  const element = /^<\/?([A-Za-z][\w:.-]*)/.exec(content);
  if (element) return `unexpected element <${String(element[1])}> in <svg>`;
  return 'unexpected text in <svg>';
}

/** Reads `<path>` after `<path>`; anything else in the body is the reason it fails. */
function parsePaths(body: string): MarkPath[] | string {
  const open = new RegExp(PATH_OPEN, 'y');
  const close = new RegExp(PATH_CLOSE, 'y');
  const paths: MarkPath[] = [];
  // A failed sticky match resets lastIndex to 0, so the position is kept here.
  let index = 0;
  for (let found = open.exec(body); found; open.lastIndex = index, found = open.exec(body)) {
    index = open.lastIndex;
    if (found[2] !== '/') {
      close.lastIndex = index;
      if (!close.test(body)) return 'unexpected text or elements inside <path>';
      index = close.lastIndex;
    }
    const path = pathFrom(String(found[1]));
    if (typeof path === 'string') return path;
    paths.push(path);
  }
  const rest = body.slice(index);
  if (rest.trim() !== '') return unexpected(rest);
  return paths.length > 0 ? paths : 'a mark needs at least one <path>';
}

/** Checks a mark against the allowlist and, if it passes, returns its viewBox and paths. */
export function parseMark(svg: string): MarkCheck {
  const root = ROOT.exec(svg);
  if (!root) {
    return reject(
      'not exactly one <svg> element, with double-quoted attributes and nothing around it',
    );
  }
  const attributes = parseAttributes(String(root[1]), 'svg');
  if (typeof attributes === 'string') return reject(attributes);
  const problem = svgProblem(attributes);
  if (problem !== undefined) return reject(problem);
  const paths = parsePaths(String(root[2]));
  if (typeof paths === 'string') return reject(paths);
  return { ok: true, mark: { viewBox: String(attributes.get('viewBox')), paths } };
}
