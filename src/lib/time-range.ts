export type TimeRange = '4w' | '3m' | '6m' | '1y' | 'all';

export interface DateWindow {
  start: Date;
  end: Date;
}

export function resolveRange(range: TimeRange, now: Date = new Date()): DateWindow {
  const end = new Date(now);
  if (range === 'all') return { start: new Date(0), end };

  const start = new Date(now);
  switch (range) {
    case '4w':
      start.setDate(start.getDate() - 28);
      break;
    case '3m':
      start.setMonth(start.getMonth() - 3);
      break;
    case '6m':
      start.setMonth(start.getMonth() - 6);
      break;
    case '1y':
      start.setFullYear(start.getFullYear() - 1);
      break;
  }
  return { start, end };
}

/** ISO week (Mon 00:00 → Sun 23:59:59.999) containing `date`. */
export function isoWeekOf(date: Date): DateWindow {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const start = new Date(d);
  start.setDate(start.getDate() - daysSinceMonday);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  end.setMilliseconds(end.getMilliseconds() - 1);
  return { start, end };
}
