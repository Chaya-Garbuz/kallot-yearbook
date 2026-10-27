# מתחילות כאן: איך מעלים את השרת לאינטרנט

המדריך הזה מיועד למי שמעולם לא העלתה שרת לאינטרנט. עברי עליו לפי הסדר.

**חשוב לדעת:** האתרים GitHub, Neon ו־Render משנים מדי פעם את המראה שלהם. שמות הכפתורים כאן נכונים לפי מה שהיה ידוע בזמן הכתיבה, ואי אפשר היה לבדוק את כולם על המסך. אם כפתור נקרא קצת אחרת, חפשי את הכפתור הכי דומה.

**מה נקבל בסוף:** שרת שרץ בכתובת כמו `https://kallot-backend.onrender.com`, עם Swagger בכתובת `/api-docs`.

---

## חלק א: GitHub

GitHub הוא המקום שבו נשמר הקוד. Render לוקח משם את הקוד ומריץ אותו.

1. **פתיחת חשבון:** נכנסים ל־https://github.com ולוחצים **Sign up**. ממלאים מייל, סיסמה ושם משתמש, ומאשרים את המייל.
2. **יצירת Repository (מאגר):** אחרי ההתחברות לוחצים על **+** בפינה העליונה ובוחרים **New repository**.
   - Repository name: `kallot-backend`
   - בוחרים **Private** (כדי שהקוד לא יהיה גלוי לכולם).
   - **לא** מסמנים "Add a README file".
   - לוחצים **Create repository**.
3. **חילוץ ה־ZIP:** במחשב, קליק ימני על קובץ ה־ZIP ← **חלץ הכל** (Extract All). תיווצר תיקייה בשם `kallot-backend`.
4. **העלאת הקבצים דרך הדפדפן:**
   - בדף ה־Repository החדש לוחצים על הקישור **uploading an existing file**.
   - פותחים את התיקייה `kallot-backend` במחשב, מסמנים את **כל מה שבתוכה** (Ctrl+A), וגוררים לחלון של GitHub.
   - חשוב: גוררים את התוכן של התיקייה, לא את התיקייה עצמה. הקובץ `package.json` צריך להיות בשורש המאגר.
   - קבצים שהשם שלהם מתחיל בנקודה (`.gitignore`, `.env.example`) לפעמים לא נבחרים בגרירה. אם הם חסרים אחרי ההעלאה, לוחצים **Add file** ← **Upload files** ומעלים אותם לבד.
   - למטה לוחצים **Commit changes**.
5. **בדיקה:** בדף המאגר צריך לראות את התיקיות `src`, `prisma`, `tests`, `docs` ואת הקבצים `package.json`, `render.yaml`, `README.md`. נכנסים ל־`prisma/migrations` ומוודאים שיש בפנים תיקייה עם קובץ `migration.sql`.

---

## חלק ב: מסד נתונים (PostgreSQL חינמי)

ההמלצה: **Neon** (https://neon.com). יש לו מסלול חינמי והוא עובד עם Prisma.
אפשר גם Supabase. ב־Render יש מסד חינמי, אבל הוא **נמחק אחרי 30 יום**, ולכן לא מומלץ לפרויקט שצריך להחזיק עד ההגשה.
לפני שמתחילות, בדקי באתר של הספק מה המגבלות של המסלול החינמי היום.

1. **פתיחת חשבון:** ב־neon.com לוחצים **Sign up**. אפשר להירשם עם חשבון ה־GitHub.
2. **יצירת Database:** יוצרים פרויקט חדש (**Create project**).
   - Project name: `kallot`
   - Region: בוחרים אזור באירופה (למשל Frankfurt), קרוב לישראל ולשרת.
   - יוצרים.
3. **קבלת Connection String:** בדף הפרויקט לוחצים **Connect**. נפתח חלון שבו מופיעה כתובת שמתחילה ב־`postgresql://`.
   - אם יש אפשרות **Connection pooling**, **מכבים** אותה. צריך את הכתובת הישירה, שאין בה את המילה `-pooler`. מיגרציות של Prisma צריכות חיבור ישיר.
   - מוודאים שבסוף הכתובת יש `sslmode=require`.
   - מעתיקים את הכתובת.
4. **שמירה בבטחה:** הכתובת כוללת סיסמה. אל תשלחי אותה לאף אחת ואל תעלי אותה ל־GitHub. שמרי אותה זמנית בקובץ במחשב שלך, ומחקי אחרי שתכניסי אותה ל־Render.
5. **חיבור השרת למסד:** הכתובת הזו נכנסת ל־Render במשתנה `DATABASE_URL` (בחלק ג, שלב 6). הטבלאות נוצרות לבד כשהשרת עולה בפעם הראשונה.

---

## חלק ג: Render (הרצת השרת)

1. **פתיחת חשבון:** ב־https://render.com לוחצים **Get Started** ונרשמים עם **GitHub**. כך Render מתחבר ל־GitHub מההתחלה.
2. **חיבור GitHub:** אם Render מבקש גישה למאגרים, בוחרים **Only select repositories**, מסמנים את `kallot-backend` ומאשרים.
3. **יצירת Web Service:** בלוח הבקרה לוחצים **New +** ← **Web Service**.
4. **בחירת המאגר:** בוחרים את `kallot-backend` ולוחצים **Connect**.
5. **הגדרות בנייה והפעלה:** ממלאים כך:

   | שדה | ערך |
   | --- | --- |
   | Name | `kallot-backend` |
   | Region | Frankfurt (EU Central), כמו המסד |
   | Branch | `main` |
   | Runtime / Language | Node |
   | Build Command | `npm install --include=dev && npm run build` |
   | Start Command | `npx prisma migrate deploy && npm start` |
   | Instance Type | **Free** |

6. **משתני סביבה:** באזור **Environment Variables** לוחצים **Add Environment Variable** ומוסיפים:

   | Key | Value |
   | --- | --- |
   | `DATABASE_URL` | הכתובת מ־Neon |
   | `JWT_SECRET` | מחרוזת אקראית ארוכה, 32 תווים לפחות. אם יש כפתור **Generate**, השתמשי בו |
   | `NODE_ENV` | `production` |
   | `NODE_VERSION` | `22` |
   | `CORS_ORIGINS` | הכתובת של האתר בריאקט, למשל `https://my-kallot-site.netlify.app`. כמה כתובות מפרידים בפסיק. לבדיקות בהתחלה אפשר `*` |
   | `PUBLIC_URL` | הכתובת ש־Render ייתן לשרת, למשל `https://kallot-backend.onrender.com` (אפשר לעדכן אחרי ה־Deploy הראשון) |
   | `FRONTEND_URL` | הכתובת של האתר בריאקט (לקישורים במיילים) |
   | `SEED_ADMIN_EMAIL` | המייל של המנהלת הראשונה |
   | `SEED_ADMIN_PASSWORD` | סיסמה חזקה למנהלת: 8 תווים לפחות, עם אות וספרה |

   לא חובה: `RESEND_API_KEY` (לשליחת מיילים אמיתיים, ראו README).

7. **Prisma Migrations:** לא צריך לעשות שום דבר מיוחד. ה־Start Command מריץ `prisma migrate deploy` בכל עלייה, וזה יוצר או מעדכן את הטבלאות.
8. **Deploy:** לוחצים **Create Web Service** (או **Deploy Web Service**). Render מתחיל לבנות. בלשונית **Logs** רואים את ההתקדמות. זה לוקח כמה דקות.
   כשמופיע `השרת פועל בכתובת...` ו־`Your service is live`, השרת באוויר.
9. **יצירת מנהלת ראשונה ונתוני הדגמה:** בשירות חינמי ב־Render אין גישה ל־Shell, ולכן מריצים את ה־seed מהמחשב שלך, מול אותו מסד:
   - מתקינים Node.js מ־https://nodejs.org (גרסת LTS).
   - פותחים את התיקייה `kallot-backend` שחילצת, קליק ימני ← **Open in Terminal** (או פותחים PowerShell ומנווטים אליה).
   - מריצים (ב־PowerShell, כל שורה בנפרד):
     ```powershell
     npm install
     $env:DATABASE_URL="הכתובת מ־Neon"
     $env:NODE_ENV="production"
     $env:SEED_ADMIN_EMAIL="המייל שלך"
     $env:SEED_ADMIN_PASSWORD="סיסמה חזקה"
     npm run db:seed
     ```
   - ב־Production נוצרות רק המנהלת, השנתון, הכיתות, ההתמחויות, הישיבות והכלות לדוגמה. לא נוצרות משתמשות עם סיסמאות ידועות.
   - אם את רוצה מסד ריק בלי כלות לדוגמה, אפשר למחוק אותן אחר כך מ־Swagger.
10. **בדיקה שהשרת פעיל:** פותחים בדפדפן `https://<השם שלך>.onrender.com/api/health`. צריך לראות `"status":"ok"`.

**שימי לב:** שירות חינמי ב־Render ״נרדם״ אחרי 15 דקות בלי שימוש, והבקשה הראשונה אחרי זה לוקחת בערך דקה. זה תקין. בזמן שהשרת ישן גם המשימות המתוזמנות (תזכורות במייל) לא רצות.

---

## חלק ד: בדיקה מלאה מתוך Swagger

1. **בריאות:** `https://<השרת>/api/health` מחזיר `status: ok`.
2. **Swagger:** פותחים `https://<השרת>/api-docs`. מופיעה רשימה של כל הנתיבים לפי נושאים.
3. **התחברות:** פותחים את `POST /api/auth/login` ← **Try it out**. בגוף הבקשה כותבים את המייל והסיסמה של המנהלת ולוחצים **Execute**.
4. **קבלת JWT:** בתשובה מופיע `"token": "eyJ..."`. מעתיקים את הערך בלי המירכאות.
5. **Authorize:** לוחצים על הכפתור **Authorize** למעלה, מדביקים את ה־token בשדה ולוחצים **Authorize** ואז **Close**.
6. **קריאה לנתיב מוגן:** פותחים `GET /api/auth/me` ← **Try it out** ← **Execute**. צריך לחזור 200 עם הפרטים שלך.
   - לבדיקת 401: לוחצים **Authorize** ← **Logout** ומריצים שוב. צריך לחזור 401.
   - לבדיקת 403: מתחברים כבוגרת (אחרי שתאשרי אחת), ומנסים `POST /api/classes`. צריך לחזור 403.
7. **הוספת רשומה:** מריצים `GET /api/classes` ומעתיקים `id` של כיתה. מריצים `GET /api/specializations` ו־`GET /api/yeshivot` ומעתיקים `id` של התמחות ושל ישיבה. אחר כך `POST /api/classes/{classId}/kallot` עם:
   ```json
   {
     "name": "כלה לבדיקה",
     "specializationId": "...",
     "yeshivaId": "...",
     "engagedAt": "2026-10-01",
     "weddingAt": "2027-01-10",
     "hallName": "אולם לדוגמה",
     "hallCity": "ירושלים"
   }
   ```
   צריך לחזור 201.
8. **שליפה מהמסד:** `GET /api/kallot?q=בדיקה` מחזיר את הכלה החדשה. אפשר לראות אותה גם ב־Neon, ב־**Tables** ← `Kalla`.

---

## חלק ה: פתרון תקלות

| מה רואים | מה כנראה הבעיה | מה עושים |
| --- | --- | --- |
| **Build failed** ב־Render | הקבצים לא בשורש המאגר, או ש־`package.json` חסר | ב־GitHub, `package.json` חייב להיות בדף הראשי של המאגר ולא בתוך תיקייה. אם הוא בתוך תיקייה, ב־Render מגדירים **Root Directory** לשם התיקייה |
| Build failed עם `tsc: not found` | חבילות הפיתוח לא הותקנו | ודאי שה־Build Command הוא בדיוק `npm install --include=dev && npm run build` |
| `DATABASE_URL חסר` או `Can't reach database server` | הכתובת חסרה או שגויה | בדקי ב־Render ← **Environment** שהערך הועתק במלואו, בלי רווחים ובלי מירכאות, ושיש בסוף `sslmode=require` |
| `P1001` / `P1000` (שגיאות Prisma) | אין חיבור למסד, או סיסמה שגויה | העתיקי שוב את הכתובת מ־Neon. במסלול חינמי המסד יכול ״להירדם״, ונסיון נוסף אחרי דקה בדרך כלל עובד |
| `migrate deploy` נכשל עם הודעה על pooler | השתמשת בכתובת עם `-pooler` | קחי מ־Neon את הכתובת הישירה (בלי pooling) |
| `JWT_SECRET חייב להיות באורך 32 תווים לפחות` | הסוד קצר או חסר | הכניסי מחרוזת ארוכה יותר ב־`JWT_SECRET` ועשי **Manual Deploy** |
| שגיאת **CORS** בדפדפן של אתר הריאקט | הכתובת של האתר לא מופיעה ב־`CORS_ORIGINS` | הוסיפי את הכתובת המדויקת (עם `https://`, בלי `/` בסוף) ועשי Deploy מחדש |
| **401** | לא התחברת, או שה־token פג (תוקף 7 ימים) | התחברי שוב ולחצי Authorize עם ה־token החדש. בלי המילה Bearer, Swagger מוסיף אותה לבד |
| **403** עם `PENDING` | החשבון עוד לא אושר | נציגת הכיתה או המנהלת מאשרת ב־`PATCH /api/admin/registrations/{userId}` |
| **403** רגיל | אין הרשאה לפעולה | בדקי בטבלת ההרשאות ב־`FRONTEND-API-GUIDE.md` מי מורשית |
| Swagger לא נפתח | השרת עוד לא עלה, או שהוא ״ישן״ | פתחי קודם את `/api/health`, חכי דקה, ואז את `/api-docs` |
| השרת לא עולה ב־Logs | חסר משתנה סביבה | חפשי בלוג את השורה `שגיאה בהגדרות הסביבה`, שם כתוב איזה משתנה חסר |
| אין מנהלת ואי אפשר להתחבר | לא הרצת את ה־seed | עשי את חלק ג, שלב 9 |
