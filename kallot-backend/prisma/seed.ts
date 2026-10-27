/* eslint-disable no-console */
import 'dotenv/config';
import { PrismaClient, type ArticleTopic } from '@prisma/client';
import bcrypt from 'bcryptjs';

// נתוני הדגמה מומצאים בלבד.
// בסביבת Production לא נוצרים חשבונות עם סיסמאות ידועות:
// שם צריך להגדיר SEED_ADMIN_EMAIL ו־SEED_ADMIN_PASSWORD במשתני הסביבה.

const prisma = new PrismaClient();
const isProd = process.env.NODE_ENV === 'production';

const day = (s: string) => new Date(`${s}T00:00:00.000Z`);
function addDays(base: Date, n: number) {
  return new Date(base.getTime() + n * 86_400_000);
}
const today = day(new Date().toISOString().slice(0, 10));

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || (isProd ? undefined : 'admin@example.com');
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || (isProd ? undefined : 'Admin1234');
  if (!adminEmail || !adminPassword) {
    console.log('Production: לא הוגדרו SEED_ADMIN_EMAIL ו־SEED_ADMIN_PASSWORD, ולכן לא נוצרו משתמשות.');
  }

  const existing = await prisma.yearbook.findFirst();
  if (existing) {
    console.log('כבר יש נתונים במסד. כדי להתחיל מחדש: npm run db:reset');
    return;
  }

  const yearbook = await prisma.yearbook.create({
    data: { name: 'סמינר לדוגמה · מחזור תשפ״ו', hebrewYear: 'תשפ״ו', joinCode: process.env.SEED_JOIN_CODE ?? 'KALLOT-5787' },
  });

  const classDefs: [string, number][] = [
    ['יב׳1', 32],
    ['יב׳2', 30],
    ['יב׳3', 31],
    ['יב׳4', 29],
  ];
  const classes = [];
  for (const [i, [name, size]] of classDefs.entries()) {
    classes.push(await prisma.classGroup.create({ data: { yearbookId: yearbook.id, name, size, order: i + 1 } }));
  }

  const specDefs: [string, number][] = [
    ['הוראה', 50],
    ['גרפיקה', 30],
    ['חשבונאות', 25],
    ['הנדסת תוכנה', 17],
  ];
  const specs = [];
  for (const [i, [name, size]] of specDefs.entries()) {
    specs.push(await prisma.specialization.create({ data: { yearbookId: yearbook.id, name, size, order: i + 1 } }));
  }

  const yeshivaNames = ['ישיבה לדוגמה א', 'ישיבה לדוגמה ב', 'ישיבה לדוגמה ג', 'ישיבה לדוגמה ד', 'ישיבה לדוגמה ה', 'ישיבה לדוגמה ו'];
  const yeshivot = [];
  for (const name of yeshivaNames) yeshivot.push(await prisma.yeshiva.create({ data: { name } }));
  // הצעה של נציגה שעוד לא אושרה
  await prisma.yeshiva.create({ data: { name: 'ישיבה מוצעת לדוגמה', isApproved: false } });

  const c1 = classes[0]!;
  const c2 = classes[1]!;

  let admin = null;
  let rep = null;
  let graduate = null;
  if (adminEmail && adminPassword) {
    admin = await prisma.user.create({
      data: {
        yearbookId: yearbook.id,
        name: 'רכזת המחזור',
        email: adminEmail.toLowerCase(),
        passwordHash: await bcrypt.hash(adminPassword, 10),
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
  }
  if (!isProd) {
    const pw = await bcrypt.hash('Test1234', 10);
    rep = await prisma.user.create({
      data: { yearbookId: yearbook.id, classId: c1.id, name: 'נציגה לדוגמה', email: 'rep@example.com', passwordHash: pw, role: 'REP', status: 'ACTIVE' },
    });
    await prisma.user.create({
      data: { yearbookId: yearbook.id, classId: c2.id, name: 'נציגה של יב׳2', email: 'rep2@example.com', passwordHash: pw, role: 'REP', status: 'ACTIVE' },
    });
    graduate = await prisma.user.create({
      data: {
        yearbookId: yearbook.id,
        classId: c1.id,
        name: 'בוגרת לדוגמה',
        email: 'student@example.com',
        passwordHash: pw,
        role: 'GRADUATE',
        status: 'ACTIVE',
        blessingEmailPref: 'EACH',
      },
    });
    await prisma.user.create({
      data: { yearbookId: yearbook.id, classId: c1.id, name: 'בוגרת ממתינה', email: 'pending@example.com', passwordHash: pw, status: 'PENDING' },
    });
  }

  const first = ['חיה', 'שרה', 'רבקה', 'מרים', 'אסתר', 'יהודית', 'נחמה', 'דבורה', 'חנה', 'ברכה', 'טובה', 'רחל', 'לאה', 'שושנה', 'מלכה', 'בתיה', 'הדסה', 'פנינה'];
  const last = ['כהן', 'לוי', 'פרידמן', 'שטרן', 'גולדברג', 'וייס', 'רוזנברג', 'קליין', 'הורוביץ', 'ברגר', 'שפירא', 'אדלר', 'פישר', 'גרוס'];
  const halls = [
    ['אולמי הדוגמה', 'בני ברק'],
    ['היכל לדוגמה', 'ירושלים'],
    ['אולם השמחות לדוגמה', 'אלעד'],
    ['גני האירועים לדוגמה', 'מודיעין עילית'],
  ];
  const perClass = [8, 6, 7, 5];
  let n = 0;
  const kallot = [];
  for (const [ci, cls] of classes.entries()) {
    for (let i = 0; i < (perClass[ci] ?? 0); i++) {
      n++;
      const engagedAt = addDays(today, -((n * 11) % 120) - 3);
      const hasWedding = n % 5 !== 0;
      const weddingAt = hasWedding ? addDays(today, ((n * 7) % 90) - 10) : null;
      const finalWedding = weddingAt && weddingAt.getTime() > engagedAt.getTime() ? weddingAt : hasWedding ? addDays(engagedAt, 80) : null;
      const hall = halls[n % halls.length]!;
      kallot.push(
        await prisma.kalla.create({
          data: {
            classId: cls.id,
            specializationId: specs[n % specs.length]!.id,
            yeshivaId: yeshivot[(n * n + ci) % yeshivot.length]!.id,
            name: `${first[(n * 3 + ci) % first.length]} ${last[(n * 5 + i) % last.length]}`,
            engagedAt,
            weddingAt: finalWedding,
            hallName: finalWedding && n % 3 !== 0 ? hall[0] : null,
            hallCity: finalWedding && n % 3 !== 0 ? hall[1] : null,
            hideWeddingDate: n === 4,
            createdById: admin?.id ?? null,
          },
        }),
      );
    }
  }

  if (graduate && rep) {
    // הבוגרת לדוגמה היא גם כלה, כדי שאפשר יהיה לבדוק אלבום והרשאות של ״כלה עצמה״
    const mine = kallot[0]!;
    await prisma.kalla.update({ where: { id: mine.id }, data: { userId: graduate.id } });
    await prisma.blessing.createMany({
      data: [
        { kallaId: mine.id, authorId: rep.id, text: 'מזל טוב! שתזכי להקים בית נאמן בישראל', color: 'gold', emailedAt: new Date() },
        { kallaId: kallot[1]!.id, authorId: graduate.id, text: 'מזל טוב מכל הכיתה! שמחות רבות', color: 'rose' },
      ],
    });
    const upcoming = kallot.find((k) => k.weddingAt && k.weddingAt.getTime() > today.getTime() && !k.hideWeddingDate);
    if (upcoming) await prisma.reminderSubscription.create({ data: { userId: graduate.id, kallaId: upcoming.id, timing: 'BOTH' } });
    await prisma.newsletterSubscription.create({ data: { userId: graduate.id, topics: ['PREPARATIONS', 'HOME', 'NEWS'] } });
    // דיווח שממתין לאישור, ממשתמשת שעוד לא כלה
    const reporter = await prisma.user.create({
      data: {
        yearbookId: yearbook.id,
        classId: c1.id,
        name: 'מדווחת לדוגמה',
        email: 'reporter@example.com',
        passwordHash: await bcrypt.hash('Test1234', 10),
        status: 'ACTIVE',
      },
    });
    await prisma.updateRequest.create({
      data: {
        userId: reporter.id,
        classId: c1.id,
        type: 'NEW',
        data: { name: 'מדווחת לדוגמה', specializationId: specs[1]!.id, yeshivaId: yeshivot[2]!.id, engagedAt: addDays(today, -2).toISOString().slice(0, 10) },
      },
    });
  }

  const articles: { title: string; slug: string; topic: ArticleTopic; body: string }[] = [
    { title: 'החודש שלפני החתונה', slug: 'month-before-wedding', topic: 'PREPARATIONS', body: 'לסגור רשימת מוזמנים שבועיים לפני. לאשר ספקים. להכין תיק קטן לערב החתונה.' },
    { title: 'ציוד בסיסי לבית ראשון', slug: 'first-home-basics', topic: 'HOME', body: 'כלים בסיסיים לבשרי ולחלבי, מצעים ומגבות, ארגז כלים קטן ופנס.' },
    { title: 'תקציב חודשי לזוג צעיר', slug: 'young-couple-budget', topic: 'FINANCE', body: 'לרשום את כל ההוצאות בחודש הראשון ולהפריד בין קבועות למשתנות.' },
  ];
  for (const a of articles) {
    await prisma.article.create({ data: { ...a, isPublished: true, publishedAt: new Date(), authorId: admin?.id ?? null } });
  }

  console.log('נתוני הדגמה נוצרו.');
  if (!isProd) {
    console.log('מנהלת: admin@example.com / Admin1234');
    console.log('נציגה (יב׳1): rep@example.com / Test1234');
    console.log('בוגרת (יב׳1, היא גם כלה): student@example.com / Test1234');
    console.log(`קוד הרשמה למחזור: ${yearbook.joinCode}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
