// כלים לתאריכים. תאריכי אירוסין וחתונה נשמרים כ־YYYY-MM-DD בשעה 00:00 UTC.

const HEB_ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const HEB_TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
const HEB_HUNDREDS = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];

/** מספר לאותיות עבריות עם גרשיים: 15 → ט״ו, 787 → תשפ״ז */
export function toGematria(n: number): string {
  if (!Number.isInteger(n) || n <= 0) return String(n);
  let s = HEB_HUNDREDS[Math.floor((n % 1000) / 100)] ?? '';
  const r = n % 100;
  if (r === 15) s += 'טו';
  else if (r === 16) s += 'טז';
  else s += (HEB_TENS[Math.floor(r / 10)] ?? '') + (HEB_ONES[r % 10] ?? '');
  if (s.length === 1) return `${s}׳`;
  return `${s.slice(0, -1)}״${s.slice(-1)}`;
}

/** מחרוזת YYYY-MM-DD לתאריך UTC בחצות */
export function parseDateOnly(value: string): Date {
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${value}`);
  return d;
}

/** תאריך לשדה YYYY-MM-DD */
export function formatDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface HebrewParts {
  day: number;
  month: string;
  year: number;
}

function hebrewParts(d: Date): HebrewParts {
  const parts = new Intl.DateTimeFormat('he-u-ca-hebrew', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return { day: parseInt(get('day'), 10), month: get('month'), year: parseInt(get('year'), 10) };
}

/** תאריך עברי: ט״ו שבט תשפ״ז */
export function toHebrewDate(d: Date): string {
  const p = hebrewParts(d);
  if (Number.isNaN(p.day) || Number.isNaN(p.year)) return formatDateOnly(d);
  return `${toGematria(p.day)} ${p.month} ${toGematria(p.year % 1000)}`;
}

/** שם החודש העברי והשנה: שבט תשפ״ז */
export function hebrewMonthLabel(d: Date): string {
  const p = hebrewParts(d);
  return `${p.month} ${toGematria(p.year % 1000)}`;
}

/** היום הנוכחי (תאריך בלבד) לפי אזור הזמן של השנתון */
export function todayInZone(timeZone: string, now = new Date()): Date {
  const s = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  return parseDateOnly(s);
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86_400_000);
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

/** כל ימי החודש העברי שבו נמצא התאריך */
export function hebrewMonthRange(d: Date): { start: Date; end: Date } {
  const key = (x: Date) => {
    const p = hebrewParts(x);
    return `${p.month}-${p.year}`;
  };
  const k = key(d);
  let start = d;
  while (key(addDays(start, -1)) === k) start = addDays(start, -1);
  let end = d;
  while (key(addDays(end, 1)) === k) end = addDays(end, 1);
  return { start, end };
}
