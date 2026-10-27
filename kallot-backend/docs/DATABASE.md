# מסד הנתונים

כל הטבלאות ב־PostgreSQL. המפתח הראשי (Primary Key) של כל טבלה הוא `id` מסוג UUID (טקסט).
ההגדרה המלאה: `prisma/schema.prisma`. ה־SQL: `prisma/migrations/20261018120000_init/migration.sql`.

## טבלאות

| טבלה | מטרה | שדות חובה | מפתחות זרים | אילוצים |
| --- | --- | --- | --- | --- |
| Yearbook | השנתון (מחזור) | name, hebrewYear, joinCode | — | joinCode ייחודי |
| ClassGroup | כיתה | yearbookId, name, size | yearbookId → Yearbook (מחיקה מוחקת) | (yearbookId, name) ייחודי. size ≥ מספר הכלות (נבדק בשרת) |
| Specialization | התמחות | yearbookId, name, size | yearbookId → Yearbook | (yearbookId, name) ייחודי |
| User | משתמשת | yearbookId, name, email, passwordHash, role, status | yearbookId → Yearbook, classId → ClassGroup (מחיקה מאפסת) | email ייחודי |
| Yeshiva | ישיבה | name | — | name ייחודי. aliases = שמות נוספים |
| Kalla | כלה (האובייקט המרכזי) | classId, specializationId, yeshivaId, name, engagedAt | classId, specializationId, yeshivaId (מחיקה חסומה), userId, createdById, updatedById → User | (classId, name) ייחודי. userId ייחודי. חתונה אחרי אירוסין (נבדק בשרת) |
| UpdateRequest | דיווח עצמי | userId, classId, type, data | userId, reviewedById → User, classId → ClassGroup | status: PENDING / APPROVED / DECLINED |
| ReminderSubscription | תזכורת לחתונה | userId, kallaId, timing | userId → User, kallaId → Kalla (מחיקה מוחקת) | (userId, kallaId) ייחודי |
| NewsletterSubscription | דיוור | userId, topics | userId → User | userId ו־unsubscribeToken ייחודיים |
| Blessing | ברכה באלבום | kallaId, authorId, text | kallaId → Kalla, authorId, hiddenById → User | text עד 500 תווים |
| Article | דף מידע | title, slug, topic, body | authorId → User | slug ייחודי |
| Announcement | הודעה שנשלחה | yearbookId, subject, body, sentById | yearbookId, classId, sentById | — |
| EmailLog | תיעוד מיילים | to, template, subject, status | — | — |

## ערכים קבועים (Enums)

| שם | ערכים |
| --- | --- |
| Role | ADMIN (מנהלת), REP (נציגה), GRADUATE (בוגרת) |
| UserStatus | PENDING, ACTIVE, BLOCKED |
| BlessingEmailPref | EACH (על כל ברכה), DAILY (פעם ביום), NONE |
| RequestType | NEW, UPDATE |
| RequestStatus | PENDING, APPROVED, DECLINED |
| ReminderTiming | BEFORE (יום לפני), DAY (ביום), BOTH |
| ArticleTopic | PREPARATIONS, HOME, FINANCE, RECIPES, NEWS |

## קשרים

- שנתון ← הרבה כיתות, התמחויות, משתמשות, הודעות.
- כיתה ← הרבה כלות ובוגרות, ונציגה אחת או יותר (משתמשות עם role=REP ו־classId של הכיתה).
- התמחות ← הרבה כלות מכמה כיתות.
- ישיבה ← הרבה כלות.
- כלה ← משתמשת אחת לכל היותר (אם היא רשומה), הרבה ברכות, הרבה תזכורות.
