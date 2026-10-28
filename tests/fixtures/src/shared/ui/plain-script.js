// A JavaScript file under src/ gets the project rules too (security review round 7, K4).
export const setInner = (node, html) => { node.innerHTML = html; }; // expect: no-restricted-syntax
export const colour = { color: 'red' }; // expect: no-restricted-syntax
