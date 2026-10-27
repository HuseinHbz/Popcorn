export async function StatusBadge(): Promise<string> {
  const response = await fetch('/api/status'); // expect: no-restricted-globals
  return response.statusText;
}
