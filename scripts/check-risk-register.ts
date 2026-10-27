/**
 * Fails when an accepted risk in docs/security/risk-register.md is past its
 * "Review by" date: an expired acceptance must be re-justified or fixed.
 * Usage: node scripts/check-risk-register.ts
 */
import { readFileSync } from 'node:fs';

export type ExpiredRisk = { id: string; reviewBy: string };

/** Accepted-risk rows (`| R-… |`) whose last cell is a date before `today` (YYYY-MM-DD). */
export function expiredRisks(markdown: string, today: string): ExpiredRisk[] {
  return markdown
    .split('\n')
    .filter((line) => /^\|\s*R-\d+/.test(line))
    .map((line) => line.split('|').map((cell) => cell.trim()))
    .map((cells) => ({ id: cells[1] ?? '', reviewBy: cells[cells.length - 2] ?? '' }))
    .filter(({ reviewBy }) => !/^\d{4}-\d{2}-\d{2}$/.test(reviewBy) || reviewBy < today);
}

function main(): void {
  const today = new Date().toISOString().slice(0, 10);
  const expired = expiredRisks(readFileSync('docs/security/risk-register.md', 'utf8'), today);
  for (const { id, reviewBy } of expired) {
    console.error(`${id}: review-by date "${reviewBy}" has passed or is invalid`);
  }
  if (expired.length > 0) process.exit(1);
}

if (import.meta.filename === process.argv[1]) main();
