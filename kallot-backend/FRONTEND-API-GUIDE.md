# מדריך API לצד ה־React

המסמך הזה מסביר איך האתר בריאקט מדבר עם השרת. הפירוט המלא של כל נתיב, כולל דוגמאות, נמצא ב־Swagger: `<כתובת השרת>/api-docs`.

## 1. כתובת בסיס (Base URL)

| סביבה | כתובת |
| --- | --- |
| במחשב | `http://localhost:4000` |
| בענן | `https://<השם שלך>.onrender.com` |

כל הנתיבים מתחילים ב־`/api`. מומלץ לשמור את הכתובת במשתנה סביבה של פרויקט הריאקט (למשל `VITE_API_URL`), כדי לא לכתוב אותה בכל מקום.
הכתובת של אתר הריאקט חייבת להופיע ב־`CORS_ORIGINS` בשרת.

## 2. התחברות (Authentication)

1. שולחים `POST /api/auth/login` עם `{ email, password }`.
2. מקבלים `{ token, user }`. שומרים את ה־token (למשל ב־localStorage) ואת ה־user ב־Context.
3. בכל בקשה אחרת שולחים כותרת:
   ```
   Authorization: Bearer <token>
   ```
4. התוקף של token הוא 7 ימים. כשמקבלים 401, מוחקים את ה־token ומעבירים למסך הכניסה.
5. אחרי רענון של הדף: קוראים ל־`GET /api/auth/me` כדי לטעון את המשתמשת מחדש.

דוגמה לבקשה עם fetch:
```js
fetch(`${API}/api/kallot?q=מרים`, { headers: { Authorization: `Bearer ${token}` } })
```
בבקשה עם גוף מוסיפים `'Content-Type': 'application/json'` ו־`body: JSON.stringify(data)`.

## 3. תפקידים והרשאות

`user.role` הוא `ADMIN` (מנהלת), `REP` (נציגה) או `GRADUATE` (בוגרת). לנציגה יש `user.classId` של הכיתה שלה.
השרת בודק הרשאות בעצמו, אבל כדאי להסתיר בממשק כפתורים שאין הרשאה אליהם.

| פעולה | מנהלת | נציגה | בוגרת |
| --- | --- | --- | --- |
| צפייה בסקירה, כיתות, התמחויות, ישיבות, לוח שנה, אלבומים | ✓ | ✓ | ✓ |
| הוספה, עריכה ומחיקה של כלה | כל כיתה | הכיתה שלה | ✗ |
| העברת כלה לכיתה אחרת | ✓ | ✗ | ✗ |
| עדכון תאריך חתונה ואולם | ✓ | הכיתה שלה | רק של עצמה |
| יצירה, שינוי שם ומחיקה של כיתה | ✓ | ✗ | ✗ |
| עדכון מספר הבנות בכיתה | ✓ | הכיתה שלה | ✗ |
| ניהול התמחויות | ✓ | ✗ | ✗ |
| הוספת ישיבה | מאושרת מיד | הצעה לאישור | ✗ |
| איחוד ישיבות | ✓ | ✗ | ✗ |
| דיווח ״התארסתי״ | ✓ | ✓ | ✓ |
| אישור דיווחים והרשמות | ✓ | הכיתה שלה | ✗ |
| מינוי והסרה של נציגות, ניהול משתמשות | ✓ | ✗ | ✗ |
| כתיבת ברכה | ✓ | ✓ | ✓ |
| עריכה ומחיקה של ברכה | תמיד | שלה, 24 שעות | שלה, 24 שעות |
| הסתרת ברכה | ✓ | אלבומים בכיתה שלה | רק באלבום שלה |
| כתיבת דפי מידע | ✓ | ✗ | ✗ |
| הודעה במייל | לכולן | לכיתה שלה | ✗ |
| ייצוא CSV | ✓ | הכיתה שלה | ✗ |

## 4. אילו נתיבים צריך בכל מסך

| מסך | נתיבים |
| --- | --- |
| כניסה | `POST /api/auth/login`, `POST /api/auth/forgot` |
| הרשמה | `GET /api/auth/classes?joinCode=...` (רשימת כיתות), `POST /api/auth/register` |
| איפוס סיסמה (מהקישור במייל) | `POST /api/auth/reset` |
| סקירה | `GET /api/overview` |
| כיתות | `GET /api/classes`. מנהלת: `POST /api/classes` |
| כיתה | `GET /api/classes/{classId}/kallot`, `POST /api/classes/{classId}/kallot`, `PATCH /api/kallot/{id}`, `DELETE /api/kallot/{id}`, `PATCH /api/classes/{id}` (מספר בנות). לטופס: `GET /api/specializations`, `GET /api/yeshivot?q=` |
| חיפוש כלות | `GET /api/kallot?q=&classId=&specializationId=&yeshivaId=&sort=&order=&page=` |
| התמחויות | `GET /api/specializations/stats?classId=`, `GET /api/specializations/{id}/kallot`. מנהלת: `POST/PATCH/DELETE /api/specializations` |
| ישיבות | `GET /api/yeshivot/stats?classId=&specializationId=` |
| לוח שנה | `GET /api/calendar?date=YYYY-MM-DD&classId=&specializationId=`, ולעדכון אולם: `PATCH /api/kallot/{id}/wedding` |
| חתונות קרובות | `GET /api/weddings?days=60` |
| תזכורות | `GET /api/weddings`, `GET /api/me/reminders`, `PUT /api/me/reminders`, `PATCH /api/auth/me` (מייל לתזכורות) |
| אלבומי איחולים | `GET /api/albums?q=&classId=` |
| אלבום של כלה | `GET /api/albums/{kallaId}`, `POST /api/albums/{kallaId}/blessings`, `PATCH /api/blessings/{id}`, `DELETE /api/blessings/{id}`, `PATCH /api/blessings/{id}/hide` |
| מידע לכלות | `GET /api/articles?topic=`, `GET /api/articles/{slug}`, `GET/PUT /api/me/newsletter` |
| הדיווח שלי | `GET /api/me/report`, `POST /api/me/report` |
| ניהול | `GET /api/admin/requests`, `PATCH /api/admin/requests/{id}`, `PATCH /api/admin/registrations/{userId}`, `GET /api/admin/users`, `PATCH /api/admin/users/{id}`, `GET/POST /api/admin/classes/{id}/reps`, `DELETE /api/admin/classes/{id}/reps/{userId}`, `GET/POST /api/admin/announcements`, `GET /api/admin/export?classId=` |
| הגדרות | `GET /api/auth/me`, `PATCH /api/auth/me` |

## 5. מבני הנתונים העיקריים

**User**
```json
{
  "id": "uuid", "name": "רבקה כהן", "email": "rivka@example.com",
  "role": "GRADUATE", "status": "ACTIVE", "classId": "uuid",
  "blessingEmailPref": "DAILY", "reminderEmails": true, "announcementEmails": true
}
```
ב־`GET /api/auth/me` מגיעים גם `className`, `yearbook` ו־`kallaId` (אם המשתמשת היא כלה).

**Kalla (כלה)**
```json
{
  "id": "uuid", "name": "מרים וייס",
  "classId": "uuid", "className": "יב׳1",
  "specializationId": "uuid", "specializationName": "הוראה",
  "yeshivaId": "uuid", "yeshivaName": "ישיבה לדוגמה א",
  "engagedAt": "2026-07-27", "engagedHebrew": "ב׳ אב תשפ״ו",
  "weddingAt": "2026-12-13", "weddingHebrew": "כ״ג כסלו תשפ״ז",
  "hallName": "אולמי הדוגמה", "hallCity": "בני ברק",
  "hideWeddingDate": false, "isMine": false
}
```
התאריכים העבריים מגיעים מוכנים מהשרת. אם הכלה ביקשה להסתיר את התאריך, `weddingAt`, `weddingHebrew`, `hallName` ו־`hallCity` יגיעו `null` לכל מי שאינה המנהלת או הכלה עצמה.

**רשימה עם עמודים** (`GET /api/kallot`): `{ "total": 35, "page": 1, "pageSize": 50, "items": [Kalla, ...] }`

**לוח שנה** (`GET /api/calendar`)
```json
{
  "month": "טבת תשפ״ז", "start": "2026-12-10", "end": "2027-01-08",
  "prevMonthDate": "2026-12-09", "nextMonthDate": "2027-01-09",
  "days": [
    { "date": "2026-12-13", "hebrewDate": "ג׳ טבת תשפ״ז", "weekday": 0,
      "weddings": [ { "kallaId": "uuid", "name": "מרים וייס", "className": "יב׳1",
                      "specializationName": "הוראה", "yeshivaName": "...",
                      "hallName": "אולמי הדוגמה", "hallCity": "בני ברק" } ] }
  ]
}
```
`weekday` הוא 0 לראשון ועד 6 לשבת. למעבר לחודש הבא או הקודם שולחים את `nextMonthDate` או `prevMonthDate` כ־`date`.

**Blessing (ברכה)**
```json
{ "id": "uuid", "kallaId": "uuid", "text": "מזל טוב!", "color": "gold",
  "author": { "id": "uuid", "name": "שרה לוי" }, "isHidden": false,
  "createdAt": "...", "editedAt": null, "canEdit": true }
```
`canEdit` אומר אם להציג כפתורי עריכה ומחיקה. באלבום, `canModerate` אומר אם להציג כפתור ״הסתרה״.

## 6. שדות חובה בטפסים

| טופס | שדות חובה | כללים |
| --- | --- | --- |
| כניסה | email, password | |
| הרשמה | joinCode, classId, name, email, password | שם 2-30 תווים. סיסמה: 8 תווים לפחות, אות וספרה |
| כלה חדשה | name, specializationId, yeshivaId, engagedAt | שם 2-40. אירוסין לא בעתיד. חתונה (לא חובה) אחרי האירוסין. אולם 2-60, עיר 2-30 |
| חתונה ואולם | לפחות שדה אחד | weddingAt יכול להיות null (מחיקת התאריך) |
| כיתה | name, size | שם עד 20 תווים. מספר בנות 1-80 |
| התמחות | name, size | שם 2-40. מספר בנות 1-300 |
| ישיבה | name | 2-60 תווים |
| דיווח | type (NEW / UPDATE), data | ב־NEW, data כמו טופס כלה חדשה. ב־UPDATE, רק השדות שמשתנים |
| ברכה | text | 2-500 תווים. color: gold, rose, sky, mint, lilac |
| תזכורות | items | רשימה של `{ kallaId, timing }`. timing: BEFORE, DAY, BOTH |
| דיוור | topics | PREPARATIONS, HOME, FINANCE, RECIPES, NEWS |
| הודעה | subject, body | נושא 2-80, תוכן 2-2000 |
| דף מידע | title, slug, topic, body | slug: אותיות באנגלית קטנות, ספרות ומקפים |

תאריכים נשלחים תמיד בפורמט `YYYY-MM-DD`.

## 7. מה מוחזר בהצלחה

| פעולה | קוד | גוף התשובה |
| --- | --- | --- |
| קריאה (GET) | 200 | האובייקט או הרשימה |
| יצירה (POST) | 201 | האובייקט שנוצר. בהוספת כלה גם `classPercent` |
| עדכון (PATCH / PUT) | 200 | האובייקט המעודכן |
| מחיקה (DELETE) | 204 | בלי גוף |
| ייצוא | 200 | קובץ CSV. להורדה: לקבל את התשובה כ־blob ולשמור כקובץ |

## 8. שגיאות

כל שגיאה חוזרת באותו מבנה:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "יש שדות חסרים או לא תקינים",
             "details": [ { "field": "engagedAt", "message": "תאריך בפורמט YYYY-MM-DD" } ] } }
```
אפשר להציג את `message` למשתמשת כמו שהוא, כי הוא בעברית. ב־400, `details` אומר ליד איזה שדה להציג שגיאה.

| קוד | code | מתי | מה עושים בממשק |
| --- | --- | --- | --- |
| 400 | VALIDATION_ERROR | שדה חסר או לא תקין | מציגים את השגיאה ליד השדה |
| 401 | UNAUTHORIZED | לא מחוברת, או שה־token פג | מעבירים למסך כניסה |
| 403 | FORBIDDEN | אין הרשאה | הודעה ״אין לך הרשאה״ |
| 403 | PENDING | החשבון ממתין לאישור | הודעה ״ההרשמה ממתינה לאישור נציגת הכיתה״ |
| 403 | BLOCKED | החשבון חסום | הודעה מתאימה |
| 404 | NOT_FOUND | לא נמצא | עמוד ״לא נמצא״ |
| 409 | CONFLICT | כפילות, כיתה מלאה, דיווח שכבר טופל | מציגים את `message` |
| 429 | TOO_MANY_REQUESTS | יותר מדי בקשות או ניסיונות כניסה | ״נסי שוב בעוד כמה דקות״ |
| 500 | INTERNAL_ERROR | תקלה בשרת | ״משהו השתבש, נסי שוב״ |
