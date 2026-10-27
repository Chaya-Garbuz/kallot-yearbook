// פונקציות חישוב טהורות (בלי מסד נתונים), כדי שקל לבדוק אותן

export function percent(part: number, whole: number): number {
  if (!whole || whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export interface KallaLike {
  yeshivaId: string;
  yeshivaName: string;
}

export interface YeshivaStat {
  yeshivaId: string;
  yeshiva: string;
  count: number;
  percent: number;
}

/** כמה כלות מכל ישיבה, ממוין לפי מספר יורד ואז לפי שם */
export function yeshivaStats(list: KallaLike[]): YeshivaStat[] {
  const map = new Map<string, { name: string; count: number }>();
  for (const k of list) {
    const cur = map.get(k.yeshivaId) ?? { name: k.yeshivaName, count: 0 };
    cur.count += 1;
    map.set(k.yeshivaId, cur);
  }
  return [...map.entries()]
    .map(([yeshivaId, v]) => ({ yeshivaId, yeshiva: v.name, count: v.count, percent: percent(v.count, list.length) }))
    .sort((a, b) => b.count - a.count || a.yeshiva.localeCompare(b.yeshiva, 'he'));
}

/** מנרמל שם לחיפוש: בלי רווחים כפולים, גרש וגרשיים אחידים */
export function normalizeName(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[׳'`]/g, "'")
    .replace(/[״"]/g, '"')
    .toLowerCase();
}
