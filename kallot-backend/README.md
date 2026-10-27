# שנתון הכלות: שרת (Backend)

שרת לשנתון של סמינר: כיתות, התמחויות, ישיבות, כלות, סטטיסטיקה, לוח שנה של חתונות, תזכורות במייל, אלבום איחולים, דפי מידע ודיוור.

**אם זו הפעם הראשונה שלך, התחילי בקובץ `START-HERE.md`.**
לכתיבת צד ה־React: `FRONTEND-API-GUIDE.md`.

## טכנולוגיות

| מה | גרסה |
| --- | --- |
| Node.js | 20 ומעלה (מומלץ 22 LTS) |
| Express | 4.21 |
| TypeScript | 5.6, מצב strict |
| PostgreSQL + Prisma ORM | Prisma 5.22 |
| Zod (בדיקת קלט) | 3.23 |
| JWT + bcrypt (bcryptjs) | התחברות והצפנת סיסמאות |
| Swagger UI (OpenAPI 3) | בכתובת `/api-docs` |
| Vitest + Supertest | בדיקות |

## הרצה במחשב

צריך Node.js ו־PostgreSQL (מקומי או בענן).

```bash
npm install
cp .env.example .env          # ולמלא DATABASE_URL ו־JWT_SECRET
npx prisma migrate dev        # יוצר את הטבלאות
npm run db:seed               # נתוני הדגמה
npm run dev                   # השרת עולה בכתובת http://localhost:4000
```

- בדיקת בריאות: http://localhost:4000/api/health
- Swagger: http://localhost:4000/api-docs

## משתמשות לדוגמה (רק בסביבת פיתוח)

| תפקיד | מייל | סיסמה |
| --- | --- | --- |
| מנהלת | admin@example.com | Admin1234 |
| נציגה של יב׳1 | rep@example.com | Test1234 |
| נציגה של יב׳2 | rep2@example.com | Test1234 |
| בוגרת ביב׳1 (היא גם כלה) | student@example.com | Test1234 |
| בוגרת עם דיווח ממתין | reporter@example.com | Test1234 |
| בוגרת שממתינה לאישור | pending@example.com | Test1234 |

קוד הרשמה למחזור: `KALLOT-5787`.
ב־Production לא נוצרות סיסמאות קבועות. אפשר להגדיר `SEED_ADMIN_EMAIL` ו־`SEED_ADMIN_PASSWORD` ליצירת מנהלת ראשונה.

## פקודות

| פקודה | מה היא עושה |
| --- | --- |
| `npm run dev` | הרצה בפיתוח עם טעינה מחדש |
| `npm run build` | Prisma generate + קומפילציה לתיקיית `dist` |
| `npm start` | הרצת הגרסה המקומפלת |
| `npm run typecheck` | בדיקת TypeScript |
| `npm test` | בדיקות אוטומטיות (צריך `TEST_DATABASE_URL`, ראו למטה) |
| `npm run db:deploy` | הרצת מיגרציות ב־Production |
| `npm run db:seed` | נתוני הדגמה |
| `npm run db:reset` | מחיקת המסד ויצירה מחדש עם נתוני הדגמה |
| `npm run openapi` | יצירת `docs/openapi.json` מחדש |

## בדיקות

הבדיקות רצות מול PostgreSQL אמיתי, במסד נפרד. **הן מוחקות את המסד הזה בכל הרצה**, אז אל תשתמשי במסד האמיתי.

```bash
# יוצרים מסד ריק בשם kallot_test, ואז:
TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kallot_test?schema=public" npm test
```

ב־Windows (PowerShell):
```powershell
$env:TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kallot_test?schema=public"; npm test
```

מה נבדק: כניסה תקינה ושגויה, token חסר, לא תקין ושפג תוקפו, הרשאות של שלושת התפקידים, CRUD של כלות וכיתות, ולידציה, חיפוש, סינון ומיון, פרטיות של תאריך חתונה מוסתר, דיווח ואישור כפול, אלבום איחולים, לוח שנה, תזכורת שלא נשלחת פעמיים, ושכל נתיב בשרת מתועד ב־Swagger.

## מה נבדק בפועל לפני המסירה

ראו `docs/VERIFICATION.md`. חשוב לקרוא אותו: בסביבה שבה הפרויקט נכתב לא הייתה גישה ל־npm, ולכן לא כל הבדיקות הורצו שם.

## מבנה התיקיות

```
src/
  app.ts, server.ts      יצירת השרת והפעלתו
  config/env.ts          משתני סביבה (נבדקים בעלייה)
  db/prisma.ts           חיבור למסד הנתונים
  auth/                  JWT, הצפנת סיסמאות, כללי הרשאות
  middleware/            התחברות, תפקידים, בדיקת קלט, הגבלת קצב, טיפול בשגיאות
  modules/<נושא>/        לכל נושא: routes, controller, service, schemas
  jobs/                  משימות מתוזמנות (תזכורות, דיוור, סיכום ברכות)
  services/email.ts      שליחת מיילים
  docs/openapi.ts        תיעוד Swagger
  utils/                 תאריכים עבריים, חישובי אחוזים
prisma/
  schema.prisma          מבנה מסד הנתונים
  migrations/            מיגרציות
  seed.ts                נתוני הדגמה
tests/                   בדיקות
docs/                    openapi.json, תיעוד מסד הנתונים, דוח בדיקה
```

## מיילים

בלי `RESEND_API_KEY` המיילים לא נשלחים באמת: הם נרשמים בטבלת `EmailLog` ובלוג של השרת. כך הכול עובד גם בלי שירות מיילים.
כדי לשלוח באמת: פותחים חשבון ב־Resend (יש מסלול חינמי עם מגבלות), יוצרים API Key ושמים אותו ב־`RESEND_API_KEY`.

## משימות מתוזמנות (שעון ישראל)

| משימה | מתי |
| --- | --- |
| תזכורת ביום החתונה | כל יום 08:00 |
| תזכורת יום לפני | כל יום 18:00 |
| סיכום ברכות (לכלות שבחרו ״פעם ביום״) | כל יום 20:00 |
| דיוור שבועי | ראשון 10:00 |
| סיכום למנהלת | חמישי 12:00 |
| ניקוי | כל יום 03:00 |

מנהלת יכולה להריץ כל משימה ידנית מ־Swagger: `POST /api/admin/jobs/{name}/run`.
שימי לב: בשירות חינמי שהשרת ״נרדם״ בו כשאין גישה, משימה לא תרוץ אם השרת ישן בשעה שלה.
