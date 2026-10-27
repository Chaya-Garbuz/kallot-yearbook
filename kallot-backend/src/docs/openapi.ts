// תיעוד OpenAPI 3 לכל ה־API. מוצג ב־/api-docs ונשמר גם ב־docs/openapi.json
/* eslint-disable @typescript-eslint/no-explicit-any */

type Schema = Record<string, any>;
type Who = 'public' | 'all' | 'admin' | 'manager' | 'special';

const ref = (name: string): Schema => ({ $ref: `#/components/schemas/${name}` });
const arr = (s: Schema): Schema => ({ type: 'array', items: s });
const uuid = { type: 'string', format: 'uuid', example: '3f1c2a8e-6b2d-4c1e-9a7b-2d4e5f6a7b8c' };
const date = { type: 'string', format: 'date', example: '2026-12-24' };
const str = (example?: string, extra: Schema = {}): Schema => ({ type: 'string', ...(example ? { example } : {}), ...extra });
const int = (example?: number): Schema => ({ type: 'integer', ...(example !== undefined ? { example } : {}) });
const bool = { type: 'boolean' };
const obj = (properties: Schema, required: string[] = []): Schema => ({ type: 'object', properties, ...(required.length ? { required } : {}) });

const WHO_TEXT: Record<Who, string> = {
  public: 'פתוח, בלי התחברות.',
  all: 'כל משתמשת מחוברת ופעילה (Bearer Token).',
  admin: 'מנהלת בלבד (ADMIN).',
  manager: 'מנהלת, או נציגה לכיתה שלה בלבד (ADMIN / REP).',
  special: 'ראו פירוט בתיאור.',
};

const ERR: Record<number, string> = {
  400: 'שדות חסרים או לא תקינים (VALIDATION_ERROR)',
  401: 'חסר Token, או שהוא לא תקין או פג (UNAUTHORIZED)',
  403: 'אין הרשאה, או שהחשבון ממתין לאישור או חסום (FORBIDDEN / PENDING / BLOCKED)',
  404: 'לא נמצא (NOT_FOUND)',
  409: 'התנגשות: כפילות, חריגה ממספר הבנות, או שכבר טופל (CONFLICT)',
  429: 'יותר מדי בקשות (TOO_MANY_REQUESTS)',
};

interface Op {
  tag: string;
  summary: string;
  description?: string;
  who: Who;
  params?: string[];
  query?: Record<string, Schema & { description?: string }>;
  body?: Schema;
  bodyExample?: unknown;
  ok?: { status?: number; schema?: Schema; example?: unknown; description?: string; csv?: boolean };
  errors?: number[];
}

function op(o: Op) {
  const parameters = [
    ...(o.params ?? []).map((name) => ({ name, in: 'path', required: true, schema: uuid })),
    ...Object.entries(o.query ?? {}).map(([name, s]) => {
      const { description, ...schema } = s;
      return { name, in: 'query', required: false, schema, description };
    }),
  ];
  const status = String(o.ok?.status ?? 200);
  const errors = new Set<number>(o.errors ?? []);
  if (o.who !== 'public') {
    errors.add(401);
    errors.add(403);
  }
  if (o.body) errors.add(400);
  const responses: Schema = {};
  if (status === '204') responses[status] = { description: o.ok?.description ?? 'בוצע בהצלחה, בלי תוכן' };
  else if (o.ok?.csv) responses[status] = { description: 'קובץ CSV', content: { 'text/csv': { schema: { type: 'string' } } } };
  else
    responses[status] = {
      description: o.ok?.description ?? 'הצלחה',
      content: { 'application/json': { schema: o.ok?.schema ?? { type: 'object' }, ...(o.ok?.example !== undefined ? { example: o.ok.example } : {}) } },
    };
  for (const e of [...errors].sort()) {
    responses[String(e)] = { description: ERR[e], content: { 'application/json': { schema: ref('Error') } } };
  }
  return {
    tags: [o.tag],
    summary: o.summary,
    description: `${o.description ? `${o.description}\n\n` : ''}**הרשאה:** ${WHO_TEXT[o.who]}`,
    ...(o.who === 'public' ? { security: [] } : {}),
    ...(parameters.length ? { parameters } : {}),
    ...(o.body
      ? {
          requestBody: {
            required: true,
            content: { 'application/json': { schema: o.body, ...(o.bodyExample !== undefined ? { example: o.bodyExample } : {}) } },
          },
        }
      : {}),
    responses,
  };
}

const schemas: Record<string, Schema> = {
  Error: obj(
    { error: obj({ code: str('FORBIDDEN'), message: str('אין לך הרשאה לפעולה הזו'), details: { description: 'פירוט שדות שגויים (בשגיאת 400)' } }, ['code', 'message']) },
    ['error'],
  ),
  User: obj({
    id: uuid,
    name: str('רבקה כהן'),
    email: str('rivka@example.com'),
    role: str('GRADUATE', { enum: ['ADMIN', 'REP', 'GRADUATE'] }),
    status: str('ACTIVE', { enum: ['PENDING', 'ACTIVE', 'BLOCKED'] }),
    classId: { ...uuid, nullable: true },
    blessingEmailPref: str('DAILY', { enum: ['EACH', 'DAILY', 'NONE'] }),
    reminderEmails: bool,
    announcementEmails: bool,
    createdAt: str(undefined, { format: 'date-time' }),
  }),
  LoginRequest: obj({ email: str('admin@example.com'), password: str('Admin1234') }, ['email', 'password']),
  LoginResponse: obj({ token: str('eyJhbGciOiJIUzI1NiIs...'), user: ref('User') }),
  RegisterRequest: obj(
    { joinCode: str('KALLOT-5787'), classId: uuid, name: str('שרה לוי'), email: str('sara@example.com'), password: str('Sara1234') },
    ['joinCode', 'classId', 'name', 'email', 'password'],
  ),
  UpdateMe: obj({
    name: str('שרה לוי'),
    currentPassword: str('Sara1234'),
    newPassword: str('NewPass99'),
    blessingEmailPref: str('EACH', { enum: ['EACH', 'DAILY', 'NONE'] }),
    reminderEmails: bool,
    announcementEmails: bool,
  }),
  Class: obj({ id: uuid, name: str('יב׳1'), size: int(32), order: int(1), kallotCount: int(8), percent: int(25), reps: arr(obj({ id: uuid, name: str() })) }),
  ClassInput: obj({ name: str('יב׳6'), size: int(30), order: int(6) }, ['name', 'size']),
  Specialization: obj({ id: uuid, name: str('הוראה'), size: int(60), order: int(1) }),
  SpecializationInput: obj({ name: str('גרפיקה'), size: int(40), order: int(2) }, ['name', 'size']),
  SpecializationStat: obj({
    id: uuid,
    name: str('הוראה'),
    size: int(60),
    kallotCount: int(14),
    percent: int(23),
    topYeshivot: arr(ref('YeshivaStatRow')),
  }),
  Yeshiva: obj({ id: uuid, name: str('ישיבה לדוגמה א'), aliases: arr(str()), isApproved: bool }),
  YeshivaInput: obj({ name: str('ישיבה לדוגמה ז'), aliases: arr(str()) }, ['name']),
  YeshivaStatRow: obj({ yeshivaId: uuid, yeshiva: str('ישיבה לדוגמה א'), count: int(6), percent: int(17) }),
  YeshivaStats: obj({
    totalKallot: int(35),
    yeshivot: arr({ allOf: [ref('YeshivaStatRow'), obj({ kallot: arr(obj({ id: uuid, name: str(), className: str() })) })] }),
  }),
  Kalla: obj({
    id: uuid,
    name: str('מרים וייס'),
    classId: uuid,
    className: str('יב׳1'),
    specializationId: uuid,
    specializationName: str('הוראה'),
    yeshivaId: uuid,
    yeshivaName: str('ישיבה לדוגמה א'),
    engagedAt: date,
    engagedHebrew: str('ב׳ אב תשפ״ו'),
    weddingAt: { ...date, nullable: true },
    weddingHebrew: str('ד׳ טבת תשפ״ז', { nullable: true }),
    hallName: str('אולמי הדוגמה', { nullable: true }),
    hallCity: str('בני ברק', { nullable: true }),
    hideWeddingDate: bool,
    isMine: bool,
  }),
  KallaInput: obj(
    {
      name: str('חנה פרידמן'),
      specializationId: uuid,
      yeshivaId: uuid,
      engagedAt: date,
      weddingAt: { ...date, nullable: true },
      hallName: str('אולמי הדוגמה', { nullable: true }),
      hallCity: str('ירושלים', { nullable: true }),
      hideWeddingDate: bool,
      userId: { ...uuid, nullable: true, description: 'קישור למשתמשת מהכיתה (לא חובה)' },
    },
    ['name', 'specializationId', 'yeshivaId', 'engagedAt'],
  ),
  WeddingInput: obj({
    weddingAt: { ...date, nullable: true },
    hallName: str('אולמי הדוגמה', { nullable: true }),
    hallCity: str('ירושלים', { nullable: true }),
    hideWeddingDate: bool,
  }),
  KallaList: obj({ total: int(35), page: int(1), pageSize: int(50), items: arr(ref('Kalla')) }),
  Wedding: { allOf: [ref('Kalla'), obj({ daysUntil: int(12) })] },
  Overview: obj({
    yearbook: obj({ name: str('סמינר לדוגמה · מחזור תשפ״ו'), hebrewYear: str('תשפ״ו') }),
    totals: obj({ kallot: int(35), girls: int(155), percent: int(23), classes: int(5), yeshivot: int(9) }),
    classes: arr(obj({ id: uuid, name: str(), size: int(), kallotCount: int(), percent: int() })),
    specializations: arr(obj({ id: uuid, name: str(), size: int(), kallotCount: int(), percent: int() })),
    topYeshivot: arr(ref('YeshivaStatRow')),
    upcomingWeddings: arr(ref('Wedding')),
    recentEngagements: arr(ref('Kalla')),
  }),
  Calendar: obj({
    month: str('טבת תשפ״ז'),
    start: date,
    end: date,
    prevMonthDate: date,
    nextMonthDate: date,
    days: arr(
      obj({
        date,
        hebrewDate: str('ד׳ טבת תשפ״ז'),
        weekday: int(4),
        weddings: arr(
          obj({ kallaId: uuid, name: str(), className: str(), specializationName: str(), yeshivaName: str(), hallName: str(), hallCity: str() }),
        ),
      }),
    ),
  }),
  ReportInput: {
    oneOf: [
      obj({ type: str('NEW', { enum: ['NEW'] }), data: ref('KallaInput') }, ['type', 'data']),
      obj({ type: str('UPDATE', { enum: ['UPDATE'] }), data: { type: 'object', description: 'חלק מהשדות של KallaInput' } }, ['type', 'data']),
    ],
  },
  Report: obj({
    id: uuid,
    type: str('NEW', { enum: ['NEW', 'UPDATE'] }),
    status: str('PENDING', { enum: ['PENDING', 'APPROVED', 'DECLINED'] }),
    data: { type: 'object' },
    note: str(undefined, { nullable: true }),
    createdAt: str(undefined, { format: 'date-time' }),
  }),
  ReviewInput: obj({ action: str('approve', { enum: ['approve', 'decline'] }), note: str('מזל טוב!') }, ['action']),
  PendingReview: obj({
    reports: arr(obj({ id: uuid, type: str(), data: { type: 'object' }, createdAt: str(), user: obj({ id: uuid, name: str() }), className: str() })),
    registrations: arr({ allOf: [ref('User'), obj({ className: str() })] }),
  }),
  RemindersInput: obj(
    { items: arr(obj({ kallaId: uuid, timing: str('BOTH', { enum: ['BEFORE', 'DAY', 'BOTH'] }) }, ['kallaId', 'timing'])) },
    ['items'],
  ),
  Reminder: obj({ id: uuid, timing: str('BOTH', { enum: ['BEFORE', 'DAY', 'BOTH'] }), kalla: ref('Kalla') }),
  AlbumSummary: obj({ kallaId: uuid, name: str('מרים וייס'), className: str('יב׳1'), blessingsCount: int(7), lastBlessingAt: str(undefined, { nullable: true }) }),
  Blessing: obj({
    id: uuid,
    kallaId: uuid,
    text: str('מזל טוב! שתזכי להקים בית נאמן בישראל'),
    color: str('gold', { enum: ['gold', 'rose', 'sky', 'mint', 'lilac'] }),
    author: obj({ id: uuid, name: str('שרה לוי') }),
    isHidden: bool,
    createdAt: str(undefined, { format: 'date-time' }),
    editedAt: str(undefined, { nullable: true }),
    canEdit: bool,
  }),
  BlessingInput: obj({ text: str('מזל טוב! שתזכי להקים בית נאמן בישראל'), color: str('rose', { enum: ['gold', 'rose', 'sky', 'mint', 'lilac'] }) }, ['text']),
  Album: obj({
    kalla: obj({ id: uuid, name: str(), className: str(), weddingHebrew: str(undefined, { nullable: true }) }),
    canModerate: bool,
    blessings: arr(ref('Blessing')),
  }),
  Article: obj({
    id: uuid,
    title: str('החודש שלפני החתונה'),
    slug: str('month-before-wedding'),
    topic: str('PREPARATIONS', { enum: ['PREPARATIONS', 'HOME', 'FINANCE', 'RECIPES', 'NEWS'] }),
    body: str('רשימת הכנות...'),
    isPublished: bool,
    publishedAt: str(undefined, { nullable: true }),
  }),
  ArticleInput: obj(
    {
      title: str('תקציב לזוג צעיר'),
      slug: str('young-couple-budget'),
      topic: str('FINANCE', { enum: ['PREPARATIONS', 'HOME', 'FINANCE', 'RECIPES', 'NEWS'] }),
      body: str('לרשום את כל ההוצאות בחודש הראשון...'),
      isPublished: bool,
    },
    ['title', 'slug', 'topic', 'body'],
  ),
  Newsletter: obj({ topics: arr(str('HOME', { enum: ['PREPARATIONS', 'HOME', 'FINANCE', 'RECIPES', 'NEWS'] })), isActive: bool }, ['topics']),
  AnnouncementInput: obj({ classId: { ...uuid, description: 'בלי classId: לכל השנתון (מנהלת בלבד)' }, subject: str('מפגש מחזור'), body: str('נפגשות ביום שלישי בשעה 20:00') }, ['subject', 'body']),
  Announcement: obj({ id: uuid, subject: str(), body: str(), classId: { ...uuid, nullable: true }, recipientsCount: int(31), sentAt: str() }),
  UserAdminUpdate: obj({ status: str('BLOCKED', { enum: ['ACTIVE', 'BLOCKED'] }), classId: uuid }),
};

const kallaExample = {
  id: '9a1b2c3d-1111-4a2b-8c3d-000000000001',
  name: 'מרים וייס',
  classId: '9a1b2c3d-2222-4a2b-8c3d-000000000001',
  className: 'יב׳1',
  specializationId: '9a1b2c3d-3333-4a2b-8c3d-000000000001',
  specializationName: 'הוראה',
  yeshivaId: '9a1b2c3d-4444-4a2b-8c3d-000000000001',
  yeshivaName: 'ישיבה לדוגמה א',
  engagedAt: '2026-07-27',
  engagedHebrew: 'ב׳ אב תשפ״ו',
  weddingAt: '2026-12-13',
  weddingHebrew: 'כ״ג כסלו תשפ״ז',
  hallName: 'אולמי הדוגמה',
  hallCity: 'בני ברק',
  hideWeddingDate: false,
  isMine: false,
};

export function buildOpenApi() {
  const paths: Record<string, Record<string, unknown>> = {
    '/api/health': {
      get: op({ tag: 'כללי', summary: 'בדיקת בריאות השרת ומסד הנתונים', who: 'public', ok: { example: { status: 'ok', database: 'ok', time: '2026-10-18T12:00:00.000Z' } } }),
    },
    '/api/auth/login': {
      post: op({
        tag: 'התחברות',
        summary: 'כניסה. מחזיר JWT להעתקה לכפתור Authorize',
        who: 'public',
        body: ref('LoginRequest'),
        bodyExample: { email: 'admin@example.com', password: 'Admin1234' },
        ok: { schema: ref('LoginResponse') },
        errors: [401, 403, 429],
      }),
    },
    '/api/auth/register': {
      post: op({
        tag: 'התחברות',
        summary: 'הרשמה עם קוד מחזור. החשבון פעיל מיד, ומחזיר token (מחוברת מיד)',
        who: 'public',
        body: ref('RegisterRequest'),
        ok: { status: 201, schema: obj({ message: str('נרשמת בהצלחה! ברוכה הבאה לשנתון'), token: str('eyJhbGciOiJIUzI1NiIs...'), user: ref('User') }) },
        errors: [409, 429],
      }),
    },
    '/api/auth/classes': {
      get: op({
        tag: 'התחברות',
        summary: 'רשימת הכיתות לטופס ההרשמה, לפי קוד מחזור',
        who: 'public',
        query: { joinCode: { type: 'string', example: 'KALLOT-5787', description: 'קוד המחזור' } },
        ok: { schema: obj({ yearbook: obj({ name: str(), hebrewYear: str() }), classes: arr(obj({ id: uuid, name: str() })) }) },
        errors: [400, 404],
      }),
    },
    '/api/auth/me': {
      get: op({ tag: 'התחברות', summary: 'הפרטים של המשתמשת המחוברת', who: 'all', ok: { schema: { allOf: [ref('User'), obj({ className: str(), kallaId: { ...uuid, nullable: true } })] } } }),
      patch: op({ tag: 'התחברות', summary: 'עדכון שם, סיסמה והעדפות מייל (כולל תדירות מייל על ברכות)', who: 'all', body: ref('UpdateMe'), ok: { schema: ref('User') } }),
    },
    '/api/auth/forgot': {
      post: op({ tag: 'התחברות', summary: 'שליחת מייל לאיפוס סיסמה', who: 'public', body: obj({ email: str('sara@example.com') }, ['email']), ok: { schema: obj({ message: str() }) }, errors: [429] }),
    },
    '/api/auth/reset': {
      post: op({ tag: 'התחברות', summary: 'קביעת סיסמה חדשה עם הקוד מהמייל', who: 'public', body: obj({ token: str(), newPassword: str('NewPass99') }, ['token', 'newPassword']), ok: { schema: obj({ message: str() }) }, errors: [404, 429] }),
    },
    '/api/overview': {
      get: op({ tag: 'סטטיסטיקה', summary: 'מסך הסקירה: אחוזים, ישיבות מובילות, חתונות קרובות ואחרונות', who: 'all', ok: { schema: ref('Overview') } }),
    },
    '/api/weddings': {
      get: op({
        tag: 'סטטיסטיקה',
        summary: 'חתונות קרובות',
        who: 'all',
        query: { days: { type: 'integer', default: 60, description: 'כמה ימים קדימה (1-365)' } },
        ok: { schema: arr(ref('Wedding')) },
        errors: [400],
      }),
    },
    '/api/calendar': {
      get: op({
        tag: 'סטטיסטיקה',
        summary: 'לוח שנה: כל ימי החודש העברי עם החתונות והאולמות',
        who: 'all',
        query: {
          date: { type: 'string', format: 'date', description: 'תאריך כלשהו בחודש הרצוי. ברירת מחדל: היום' },
          classId: { ...uuid, description: 'סינון לפי כיתה' },
          specializationId: { ...uuid, description: 'סינון לפי התמחות' },
        },
        ok: { schema: ref('Calendar') },
        errors: [400],
      }),
    },
    '/api/classes': {
      get: op({ tag: 'כיתות', summary: 'כל הכיתות עם מספר כלות ואחוז', who: 'all', ok: { schema: arr(ref('Class')) } }),
      post: op({ tag: 'כיתות', summary: 'הוספת כיתה', who: 'admin', body: ref('ClassInput'), ok: { status: 201, schema: ref('Class') }, errors: [409] }),
    },
    '/api/classes/{id}': {
      patch: op({
        tag: 'כיתות',
        summary: 'עדכון כיתה',
        description: 'נציגה יכולה לעדכן רק את size של הכיתה שלה. size לא יכול להיות קטן ממספר הכלות.',
        who: 'manager',
        params: ['id'],
        body: obj({ name: str('יב׳1'), size: int(33), order: int(1) }),
        ok: { schema: ref('Class') },
        errors: [404, 409],
      }),
      delete: op({ tag: 'כיתות', summary: 'מחיקת כיתה (רק אם אין בה כלות)', who: 'admin', params: ['id'], ok: { status: 204 }, errors: [404, 409] }),
    },
    '/api/classes/{classId}/kallot': {
      get: op({
        tag: 'כלות',
        summary: 'הכלות בכיתה',
        who: 'all',
        params: ['classId'],
        ok: { schema: obj({ class: obj({ id: uuid, name: str(), size: int(), kallotCount: int(), percent: int() }), kallot: arr(ref('Kalla')) }) },
        errors: [404],
      }),
      post: op({
        tag: 'כלות',
        summary: 'הוספת כלה לכיתה',
        description: 'בודק: אירוסין לא בעתיד, חתונה אחרי האירוסין, שם לא כפול בכיתה, ויש מקום בכיתה ובהתמחות.',
        who: 'manager',
        params: ['classId'],
        body: ref('KallaInput'),
        bodyExample: {
          name: 'חנה פרידמן',
          specializationId: '9a1b2c3d-3333-4a2b-8c3d-000000000001',
          yeshivaId: '9a1b2c3d-4444-4a2b-8c3d-000000000001',
          engagedAt: '2026-10-15',
          weddingAt: '2027-01-12',
          hallName: 'אולמי הדוגמה',
          hallCity: 'ירושלים',
        },
        ok: { status: 201, schema: { allOf: [ref('Kalla'), obj({ classPercent: int(28) })] } },
        errors: [404, 409],
      }),
    },
    '/api/kallot': {
      get: op({
        tag: 'כלות',
        summary: 'רשימת כלות עם חיפוש, סינון, מיון ועמודים',
        who: 'all',
        query: {
          q: { type: 'string', description: 'חיפוש בשם' },
          classId: { ...uuid, description: 'סינון לפי כיתה' },
          specializationId: { ...uuid, description: 'סינון לפי התמחות' },
          yeshivaId: { ...uuid, description: 'סינון לפי ישיבה' },
          hasWedding: { type: 'string', enum: ['true', 'false'], description: 'רק עם תאריך חתונה / רק בלי' },
          sort: { type: 'string', enum: ['name', 'engagedAt', 'weddingAt', 'className'], default: 'engagedAt' },
          order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          page: { type: 'integer', default: 1 },
          pageSize: { type: 'integer', default: 50, description: 'עד 200' },
        },
        ok: { schema: ref('KallaList') },
        errors: [400],
      }),
    },
    '/api/kallot/{id}': {
      get: op({ tag: 'כלות', summary: 'כלה אחת', who: 'all', params: ['id'], ok: { schema: ref('Kalla'), example: kallaExample }, errors: [404] }),
      patch: op({
        tag: 'כלות',
        summary: 'עדכון פרטי כלה',
        description: 'נציגה: רק בכיתה שלה. העברה לכיתה אחרת (classId): מנהלת בלבד. שינוי תאריך החתונה מאפס את התזכורות.',
        who: 'manager',
        params: ['id'],
        body: { allOf: [ref('KallaInput'), obj({ classId: uuid })], description: 'כל השדות לא חובה' },
        ok: { schema: ref('Kalla') },
        errors: [404, 409],
      }),
      delete: op({ tag: 'כלות', summary: 'מחיקת כלה (גם האלבום והתזכורות שלה נמחקים)', who: 'manager', params: ['id'], ok: { status: 204 }, errors: [404] }),
    },
    '/api/kallot/{id}/wedding': {
      patch: op({
        tag: 'כלות',
        summary: 'עדכון תאריך חתונה, אולם, עיר והסתרת התאריך',
        who: 'special',
        description: 'מותר למנהלת, לנציגת הכיתה, ולכלה עצמה.',
        params: ['id'],
        body: ref('WeddingInput'),
        bodyExample: { weddingAt: '2027-01-12', hallName: 'אולמי הדוגמה', hallCity: 'ירושלים' },
        ok: { schema: ref('Kalla') },
        errors: [404],
      }),
    },
    '/api/specializations': {
      get: op({ tag: 'התמחויות', summary: 'רשימת ההתמחויות', who: 'all', ok: { schema: arr(ref('Specialization')) } }),
      post: op({ tag: 'התמחויות', summary: 'הוספת התמחות', who: 'admin', body: ref('SpecializationInput'), ok: { status: 201, schema: ref('Specialization') }, errors: [409] }),
    },
    '/api/specializations/stats': {
      get: op({
        tag: 'התמחויות',
        summary: 'אחוז מאורסות בכל התמחות, וישיבות מובילות בכל אחת',
        who: 'all',
        query: { classId: { ...uuid, description: 'רק כלות מכיתה מסוימת' } },
        ok: { schema: arr(ref('SpecializationStat')) },
      }),
    },
    '/api/specializations/{id}': {
      patch: op({ tag: 'התמחויות', summary: 'עדכון התמחות', who: 'admin', params: ['id'], body: ref('SpecializationInput'), ok: { schema: ref('Specialization') }, errors: [404, 409] }),
      delete: op({ tag: 'התמחויות', summary: 'מחיקת התמחות (רק אם אין בה כלות)', who: 'admin', params: ['id'], ok: { status: 204 }, errors: [404, 409] }),
    },
    '/api/specializations/{id}/kallot': {
      get: op({ tag: 'התמחויות', summary: 'הכלות בהתמחות, מכל הכיתות', who: 'all', params: ['id'], ok: { schema: obj({ specialization: ref('Specialization'), kallot: arr(ref('Kalla')) }) }, errors: [404] }),
    },
    '/api/yeshivot': {
      get: op({
        tag: 'ישיבות',
        summary: 'חיפוש ישיבה (להשלמה אוטומטית)',
        who: 'all',
        query: {
          q: { type: 'string', description: 'חלק מהשם. מחפש גם בשמות הנוספים' },
          includePending: { type: 'string', enum: ['true', 'false'], description: 'מנהלת: כולל הצעות שממתינות לאישור' },
        },
        ok: { schema: arr(ref('Yeshiva')) },
      }),
      post: op({
        tag: 'ישיבות',
        summary: 'הוספת ישיבה. מנהלת: מאושרת מיד. נציגה: הצעה שממתינה לאישור',
        who: 'manager',
        body: ref('YeshivaInput'),
        ok: { status: 201, schema: ref('Yeshiva') },
        errors: [409],
      }),
    },
    '/api/yeshivot/{id}': {
      patch: op({ tag: 'ישיבות', summary: 'עריכה ואישור ישיבה', who: 'admin', params: ['id'], body: obj({ name: str(), aliases: arr(str()), isApproved: bool }), ok: { schema: ref('Yeshiva') }, errors: [404, 409] }),
    },
    '/api/yeshivot/merge': {
      post: op({
        tag: 'ישיבות',
        summary: 'איחוד ישיבות כפולות',
        description: 'כל הכלות עוברות לישיבה הראשית, והשמות הישנים נשמרים כשמות נוספים.',
        who: 'admin',
        body: obj({ targetId: uuid, sourceIds: arr(uuid) }, ['targetId', 'sourceIds']),
        ok: { schema: obj({ yeshiva: ref('Yeshiva'), movedKallot: int(3) }) },
        errors: [404],
      }),
    },
    '/api/yeshivot/stats': {
      get: op({
        tag: 'ישיבות',
        summary: 'כמה כלות מכל ישיבה: בשנתון, בכיתה או בהתמחות',
        who: 'all',
        query: { classId: { ...uuid, description: 'סינון לפי כיתה' }, specializationId: { ...uuid, description: 'סינון לפי התמחות' } },
        ok: { schema: ref('YeshivaStats') },
      }),
    },
    '/api/me/report': {
      get: op({ tag: 'דיווחים', summary: 'הדיווחים שלי', who: 'all', ok: { schema: arr(ref('Report')) } }),
      post: op({
        tag: 'דיווחים',
        summary: 'דיווח ״התארסתי״ (NEW) או עדכון הפרטים שלי (UPDATE)',
        who: 'all',
        body: ref('ReportInput'),
        bodyExample: {
          type: 'NEW',
          data: {
            name: 'שרה לוי',
            specializationId: '9a1b2c3d-3333-4a2b-8c3d-000000000001',
            yeshivaId: '9a1b2c3d-4444-4a2b-8c3d-000000000001',
            engagedAt: '2026-10-14',
          },
        },
        ok: { status: 201, schema: ref('Report') },
        errors: [409],
      }),
    },
    '/api/admin/requests': {
      get: op({ tag: 'ניהול', summary: 'דיווחים והרשמות שמחכים לאישור', who: 'manager', ok: { schema: ref('PendingReview') } }),
    },
    '/api/admin/requests/{id}': {
      patch: op({
        tag: 'ניהול',
        summary: 'אישור או דחייה של דיווח',
        description: 'אם שתי נציגות מאשרות יחד, השנייה מקבלת 409 עם שם מי שטיפלה.',
        who: 'manager',
        params: ['id'],
        body: ref('ReviewInput'),
        ok: { schema: obj({ status: str('APPROVED'), kalla: { type: 'object', nullable: true } }) },
        errors: [404, 409],
      }),
    },
    '/api/admin/registrations/{userId}': {
      patch: op({
        tag: 'ניהול',
        summary: 'אישור או דחייה של הרשמה (דחייה מוחקת את החשבון הממתין)',
        who: 'manager',
        params: ['userId'],
        body: ref('ReviewInput'),
        ok: { schema: obj({ status: str('ACTIVE'), user: ref('User') }) },
        errors: [404, 409],
      }),
    },
    '/api/me/reminders': {
      get: op({ tag: 'תזכורות', summary: 'התזכורות שלי', who: 'all', ok: { schema: arr(ref('Reminder')) } }),
      put: op({
        tag: 'תזכורות',
        summary: 'שמירת רשימת התזכורות (מחליף את כולה)',
        who: 'all',
        body: ref('RemindersInput'),
        bodyExample: { items: [{ kallaId: '9a1b2c3d-1111-4a2b-8c3d-000000000001', timing: 'BOTH' }] },
        ok: { schema: arr(ref('Reminder')) },
      }),
    },
    '/api/albums': {
      get: op({
        tag: 'אלבום איחולים',
        summary: 'כל האלבומים עם מספר הברכות',
        who: 'all',
        query: { q: { type: 'string', description: 'חיפוש בשם הכלה' }, classId: { ...uuid, description: 'סינון לפי כיתה' } },
        ok: { schema: arr(ref('AlbumSummary')) },
      }),
    },
    '/api/albums/{kallaId}': {
      get: op({
        tag: 'אלבום איחולים',
        summary: 'האלבום של כלה',
        who: 'all',
        params: ['kallaId'],
        query: { includeHidden: { type: 'string', enum: ['true', 'false'], description: 'הכלה, הנציגה והמנהלת: כולל ברכות מוסתרות' } },
        ok: { schema: ref('Album') },
        errors: [404],
      }),
    },
    '/api/albums/{kallaId}/blessings': {
      post: op({
        tag: 'אלבום איחולים',
        summary: 'כתיבת ברכה. כלה שבחרה EACH מקבלת מייל מיד',
        who: 'all',
        params: ['kallaId'],
        body: ref('BlessingInput'),
        ok: { status: 201, schema: ref('Blessing') },
        errors: [404],
      }),
    },
    '/api/blessings/{id}': {
      patch: op({
        tag: 'אלבום איחולים',
        summary: 'עריכת ברכה',
        description: 'הכותבת: רק ב־24 השעות הראשונות. מנהלת: תמיד.',
        who: 'special',
        params: ['id'],
        body: ref('BlessingInput'),
        ok: { schema: ref('Blessing') },
        errors: [404],
      }),
      delete: op({ tag: 'אלבום איחולים', summary: 'מחיקת ברכה (אותם כללים כמו עריכה)', who: 'special', params: ['id'], ok: { status: 204 }, errors: [404] }),
    },
    '/api/blessings/{id}/hide': {
      patch: op({
        tag: 'אלבום איחולים',
        summary: 'הסתרה או החזרה של ברכה',
        description: 'מותר לכלה עצמה, לנציגת הכיתה ולמנהלת.',
        who: 'special',
        params: ['id'],
        body: obj({ hidden: bool }, ['hidden']),
        ok: { schema: ref('Blessing') },
        errors: [404],
      }),
    },
    '/api/articles': {
      get: op({
        tag: 'מידע ודיוור',
        summary: 'דפי מידע (מנהלת רואה גם טיוטות)',
        who: 'all',
        query: {
          topic: { type: 'string', enum: ['PREPARATIONS', 'HOME', 'FINANCE', 'RECIPES', 'NEWS'], description: 'סינון לפי נושא' },
          q: { type: 'string', description: 'חיפוש בכותרת' },
        },
        ok: { schema: arr(ref('Article')) },
      }),
      post: op({ tag: 'מידע ודיוור', summary: 'כתיבת דף מידע', who: 'admin', body: ref('ArticleInput'), ok: { status: 201, schema: ref('Article') }, errors: [409] }),
    },
    '/api/articles/{slug}': {
      get: {
        ...op({ tag: 'מידע ודיוור', summary: 'דף מידע לפי כתובת', who: 'all', ok: { schema: ref('Article') }, errors: [404] }),
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string', example: 'month-before-wedding' } }],
      },
    },
    '/api/articles/{id}': {
      patch: op({ tag: 'מידע ודיוור', summary: 'עריכת דף מידע', who: 'admin', params: ['id'], body: ref('ArticleInput'), ok: { schema: ref('Article') }, errors: [404, 409] }),
      delete: op({ tag: 'מידע ודיוור', summary: 'מחיקת דף מידע', who: 'admin', params: ['id'], ok: { status: 204 }, errors: [404] }),
    },
    '/api/me/newsletter': {
      get: op({ tag: 'מידע ודיוור', summary: 'נושאי הדיוור שלי', who: 'all', ok: { schema: ref('Newsletter') } }),
      put: op({ tag: 'מידע ודיוור', summary: 'בחירת נושאי דיוור', who: 'all', body: ref('Newsletter'), bodyExample: { topics: ['PREPARATIONS', 'HOME'] }, ok: { schema: ref('Newsletter') } }),
    },
    '/api/unsubscribe/{token}': {
      get: op({ tag: 'מידע ודיוור', summary: 'הסרה מהדיוור מתוך קישור במייל', who: 'public', params: ['token'], ok: { schema: obj({ message: str() }) }, errors: [404] }),
    },
    '/api/admin/users': {
      get: op({
        tag: 'ניהול',
        summary: 'רשימת משתמשות עם חיפוש וסינון',
        who: 'admin',
        query: {
          q: { type: 'string', description: 'חיפוש בשם או במייל' },
          classId: { ...uuid, description: 'סינון לפי כיתה' },
          role: { type: 'string', enum: ['ADMIN', 'REP', 'GRADUATE'] },
          status: { type: 'string', enum: ['PENDING', 'ACTIVE', 'BLOCKED'] },
        },
        ok: { schema: arr(ref('User')) },
      }),
    },
    '/api/admin/users/{id}': {
      patch: op({ tag: 'ניהול', summary: 'חסימה, החזרה או העברת כיתה', who: 'admin', params: ['id'], body: ref('UserAdminUpdate'), ok: { schema: ref('User') }, errors: [404] }),
    },
    '/api/admin/classes/{id}/reps': {
      get: op({ tag: 'ניהול', summary: 'הנציגות של כיתה', who: 'admin', params: ['id'], ok: { schema: arr(ref('User')) }, errors: [404] }),
      post: op({
        tag: 'ניהול',
        summary: 'מינוי נציגה נוספת (אפשר כמה לכל כיתה)',
        who: 'admin',
        params: ['id'],
        body: obj({ userId: uuid }, ['userId']),
        ok: { status: 201, schema: ref('User') },
        errors: [404, 409],
      }),
    },
    '/api/admin/classes/{id}/reps/{userId}': {
      delete: op({ tag: 'ניהול', summary: 'הסרת נציגה (חוזרת להיות בוגרת)', who: 'admin', params: ['id', 'userId'], ok: { status: 204 }, errors: [404] }),
    },
    '/api/admin/announcements': {
      get: op({ tag: 'ניהול', summary: 'הודעות שנשלחו', who: 'manager', ok: { schema: arr(ref('Announcement')) } }),
      post: op({ tag: 'ניהול', summary: 'שליחת הודעה במייל לשנתון או לכיתה', who: 'manager', body: ref('AnnouncementInput'), ok: { status: 201, schema: ref('Announcement') }, errors: [404] }),
    },
    '/api/admin/export': {
      get: op({
        tag: 'ניהול',
        summary: 'ייצוא כלות לקובץ CSV (נפתח באקסל)',
        who: 'manager',
        query: { classId: { ...uuid, description: 'בלי: כל השנתון (מנהלת). נציגה מקבלת תמיד את הכיתה שלה' } },
        ok: { csv: true },
      }),
    },
    '/api/admin/jobs/{name}/run': {
      post: {
        ...op({ tag: 'ניהול', summary: 'הרצה ידנית של משימה מתוזמנת (לבדיקה)', who: 'admin', ok: { schema: obj({ job: str(), result: obj({ sent: int(0) }) }) } }),
        parameters: [
          {
            name: 'name',
            in: 'path',
            required: true,
            schema: { type: 'string', enum: ['remindersBefore', 'remindersDay', 'blessingsDigest', 'weeklyNewsletter', 'adminSummary', 'cleanup'] },
          },
        ],
      },
    },
  };

  return {
    openapi: '3.0.3',
    info: {
      title: 'שנתון הכלות API',
      version: '1.0.0',
      description:
        'שרת לשנתון של סמינר: כיתות, התמחויות, ישיבות, כלות, לוח שנה, תזכורות, אלבום איחולים ודיוור.\n\n' +
        '**איך מתחברים מכאן:** פתחי את `POST /api/auth/login`, לחצי Try it out, שלחי מייל וסיסמה מנתוני הדוגמה, ' +
        'העתיקי את ה־token מהתשובה, לחצי על הכפתור Authorize למעלה והדביקי אותו.\n\n' +
        'כל השגיאות חוזרות במבנה `{ "error": { "code", "message", "details" } }`.',
    },
    servers: [{ url: '/', description: 'השרת הנוכחי' }],
    security: [{ bearerAuth: [] }],
    tags: ['כללי', 'התחברות', 'סטטיסטיקה', 'כיתות', 'כלות', 'התמחויות', 'ישיבות', 'דיווחים', 'תזכורות', 'אלבום איחולים', 'מידע ודיוור', 'ניהול'].map(
      (name) => ({ name }),
    ),
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      schemas,
    },
    paths,
  };
}
