export function Swatch() {
  return (
    <span style={{ color: 'red', backgroundColor: 'white' }} className="w-[13px] text-[red]" /> // expect: no-restricted-syntax, no-restricted-syntax, no-restricted-syntax
  );
}
