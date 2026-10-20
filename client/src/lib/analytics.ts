const DAY = 86_400_000;

interface Dated {
  createdAt?: string;
}

export interface SeriesPoint {
  label: string;
  value: number;
}

function countBetween(items: Dated[], from: number, to: number) {
  return items.filter((item) => {
    if (!item.createdAt) return false;
    const time = new Date(item.createdAt).getTime();
    return time >= from && time < to;
  }).length;
}

/** % change between the last `days` days and the `days` before that. */
export function trendPct(items: Dated[], days: number): number {
  const now = Date.now();
  const current = countBetween(items, now - days * DAY, now + 1);
  const previous = countBetween(items, now - 2 * days * DAY, now - days * DAY);
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/** Splits the last `days` days into equal buckets and counts items in each. */
export function bucketCounts(
  items: Dated[],
  days: number,
  buckets: number,
): SeriesPoint[] {
  const now = Date.now();
  const size = (days * DAY) / buckets;
  const start = now - days * DAY;

  return Array.from({ length: buckets }, (_, index) => {
    const from = start + index * size;
    const to = index === buckets - 1 ? now + 1 : from + size;
    return {
      label: new Date(from).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      value: countBetween(items, from, to),
    };
  });
}
