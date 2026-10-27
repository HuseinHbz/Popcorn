export async function StatusBadge(): Promise<string> {
  const response = await fetch('/api/status');
  return response.statusText;
}
