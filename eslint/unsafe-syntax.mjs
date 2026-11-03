/**
 * Raw HTML and script-execution selectors for no-restricted-syntax (ADR 0015), kept apart from
 * eslint.config.mjs so the list can grow without crowding the config. Each selector has a
 * fixture line in tests/fixtures/src/shared/ui/unsafe-code.tsx.
 */
const rules = (message, selectors) => selectors.map((selector) => ({ selector, message }));

// Raw HTML outside the forms react/no-danger sees: createElement props, spread objects,
// computed keys, <iframe srcDoc> and the DOM HTML sinks Trusted Types guards (security
// reviews round 4 G4, round 5 H5, round 6 J6; code review round 6). In both
// no-restricted-syntax lists, because a later list replaces an earlier one.
const HTML_SINK =
  'dangerouslySetInnerHTML|srcdoc|innerHTML|outerHTML|insertAdjacentHTML|createContextualFragment|parseFromString|setHTMLUnsafe|parseHTMLUnsafe';
const HTML_PROPERTY = '/^(?:dangerouslySetInnerHTML|srcdoc|innerHTML|outerHTML)$/i';
const HTML_CALL =
  '/^(?:insertAdjacentHTML|createContextualFragment|parseFromString|setHTMLUnsafe|parseHTMLUnsafe|execCommand)$/';
const HANDLER_NAME = ':matches(Literal[value=/^on/i], TemplateLiteral[quasis.0.value.raw=/^on/i])';
const TS_WRAPPER = ':matches(TSAsExpression, TSSatisfiesExpression, TSNonNullExpression)';
export const UNSAFE_SYNTAX = rules('No raw HTML: render React elements instead.', [
  // A string naming a sink, outside type positions: string keys, computed members
  // (node['outerHTML']), Reflect.set, setAttribute('srcdoc'), a key kept in a variable.
  `Literal:not(TSLiteralType > Literal)[value=/^(?:${HTML_SINK})$/i]`,
  `TemplateLiteral[expressions.length=0] > TemplateElement[value.raw=/^(?:${HTML_SINK})$/i]`,
  // A computed template key with a sink name in any static part.
  'Property[computed=true] > TemplateLiteral.key[expressions.length>0] > TemplateElement[value.raw=/dangerouslySetInnerHTML|srcdoc|innerHTML|outerHTML/i]',
  // An object key named after a sink: createElement props, spreads, Object.assign(node, {…}).
  // Destructuring (reading) is a pattern, not an object expression, and stays allowed.
  `ObjectExpression > Property[computed=false][key.name=${HTML_PROPERTY}]`,
  "JSXAttribute[name.name='srcDoc']",
  // Writing a sink (node.innerHTML, frame.srcdoc): by assignment, also through `as`,
  // `satisfies` or `!`, and as the target of a destructuring pattern or a for…of/in loop.
  `AssignmentExpression > MemberExpression.left[computed=false][property.name=${HTML_PROPERTY}]`,
  `AssignmentExpression > ${TS_WRAPPER}.left > MemberExpression[computed=false][property.name=${HTML_PROPERTY}]`,
  `:matches(ArrayPattern, RestElement, ObjectPattern > Property) > MemberExpression[computed=false][property.name=${HTML_PROPERTY}]`,
  `:matches(AssignmentPattern, ForOfStatement, ForInStatement) > MemberExpression.left[computed=false][property.name=${HTML_PROPERTY}]`,
  // Any reference to an API that parses an HTML string (called, .call/.apply/.bind,
  // destructured), and an event-handler attribute by name.
  `MemberExpression[computed=false][property.name=${HTML_CALL}]`,
  `ObjectPattern > Property[key.name=${HTML_CALL}]`,
  `CallExpression[callee.property.name=/^(?:setAttribute|createAttribute)$/] > ${HANDLER_NAME}.arguments:first-child`,
  `CallExpression[callee.property.name=/^(?:setAttributeNS|createAttributeNS)$/] > ${HANDLER_NAME}.arguments:nth-child(2)`,
  // Script and style bodies from an expression: React writes them out as they are.
  'JSXElement[openingElement.name.name=/^(?:script|style)$/] > JSXExpressionContainer',
  // A javascript: URL built from a template (no-script-url sees only plain strings).
  'TemplateLiteral[expressions.length>0] > TemplateElement:first-child[value.raw=/^\\s*javascript:/i]',
  // document.write and writeln, on this page's document or another one.
  "CallExpression > MemberExpression.callee:matches([object.name='document'], [object.property.name=/^(?:document|contentDocument)$/]):matches([property.name=/^write(?:ln)?$/], [property.value=/^write(?:ln)?$/])",
]);
