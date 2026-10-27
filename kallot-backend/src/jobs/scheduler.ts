import { env } from '../config/env';
import { jobs, type JobName } from './jobs';

// לוח הזמנים לפי שעון ישראל. weekday: 0 = ראשון, null = כל יום
const SCHEDULE: { name: JobName; time: string; weekday: number | null }[] = [
  { name: 'remindersDay', time: '08:00', weekday: null },
  { name: 'remindersBefore', time: '18:00', weekday: null },
  { name: 'blessingsDigest', time: '20:00', weekday: null },
  { name: 'weeklyNewsletter', time: '10:00', weekday: 0 },
  { name: 'adminSummary', time: '12:00', weekday: 4 },
  { name: 'cleanup', time: '03:00', weekday: null },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function nowInZone(now: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: env.TIMEZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
    weekday: WEEKDAYS.indexOf(get('weekday')),
  };
}

const lastRun = new Map<JobName, string>();

/** בודק כל דקה אם הגיע זמן של משימה. כל משימה רצה פעם אחת ביום שלה */
export function startScheduler(): NodeJS.Timeout {
  const tick = async () => {
    const z = nowInZone(new Date());
    for (const j of SCHEDULE) {
      if (j.time !== z.time) continue;
      if (j.weekday !== null && j.weekday !== z.weekday) continue;
      if (lastRun.get(j.name) === z.date) continue;
      lastRun.set(j.name, z.date);
      try {
        const result = await jobs[j.name]();
        // eslint-disable-next-line no-console
        console.log(`[job] ${j.name}`, result);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[job] ${j.name} failed`, err);
      }
    }
  };
  const timer = setInterval(() => void tick(), 60_000);
  timer.unref();
  return timer;
}
