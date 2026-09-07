import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { TEMPLATES, PAGE_W, PAGE_H, type TemplateId } from '../src/lib/gazetteTemplates';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@techconnect.ru';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'techconnect';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Администратор',
      passwordHash,
      role: 'ADMIN',
    },
  });
  console.log(`✓ admin: ${admin.email} / ${adminPassword}`);

  // Moderator (сммщик)
  await prisma.user.upsert({
    where: { email: 'smm@techconnect.ru' },
    update: {},
    create: {
      email: 'smm@techconnect.ru',
      name: 'СММ-менеджер',
      passwordHash: await bcrypt.hash('techconnect', 10),
      role: 'MODERATOR',
    },
  });

  // --- Partners ---
  await prisma.partner.deleteMany();
  const partners = [
    { name: 'ЮУрГУ', description: 'Южно-Уральский государственный университет.', help: 'Площадки, лаборатории и поддержка студенческих инициатив.', order: 1 },
    { name: 'T2', description: 'Федеральный оператор мобильной связи.', help: 'Поддержка мероприятий и карьерные возможности для участников.', order: 2 },
    { name: 'Т-Банк', description: 'Один из крупнейших онлайн-банков и IT-работодателей страны.', help: 'Менторы, стажировки и офферы для участников.', order: 3 },
  ];
  for (const p of partners) await prisma.partner.create({ data: p });
  console.log(`✓ partners: ${partners.length}`);

  // --- Events (roadmap) ---
  await prisma.event.deleteMany();
  const events = [
    { title: 'Митап «Frontend сегодня»', type: 'MEETUP', status: 'PAST', location: 'ЮУрГУ, ауд. 1001', description: 'Открытие сезона: доклады о React 19, Server Components и карьере во фронтенде.', date: new Date('2025-09-20T17:00:00'), order: 1 },
    { title: 'Хакатон TechConnect Autumn', type: 'HACKATHON', status: 'PAST', location: 'Технопарк ЮУрГУ', description: '48 часов, 24 команды, задачи от партнёров. Призовой фонд и офферы победителям.', date: new Date('2025-10-25T10:00:00'), order: 2 },
    { title: 'Форум «Путь в IT»', type: 'FORUM', status: 'PAST', location: 'Актовый зал ЮУрГУ', description: 'Карьерный форум: резюме, собеседования, стажировки и живое общение с HR партнёров.', date: new Date('2025-11-22T11:00:00'), order: 3 },
    { title: 'Митап «Backend & DevOps»', type: 'MEETUP', status: 'UPCOMING', location: 'ЮУрГУ, ауд. 1001', description: 'Микросервисы, Docker, CI/CD и как это спрашивают на собеседованиях.', date: new Date('2026-08-15T17:00:00'), registrationUrl: 'https://t.me/techconnect', order: 4 },
    { title: 'Зимний хакатон TechConnect', type: 'HACKATHON', status: 'UPCOMING', location: 'Технопарк ЮУрГУ', description: 'Главное событие зимы: командная разработка, менторы и реальные кейсы бизнеса.', date: new Date('2026-12-06T10:00:00'), registrationUrl: 'https://t.me/techconnect', order: 5 },
  ];
  for (const e of events) await prisma.event.create({ data: e });
  console.log(`✓ events: ${events.length}`);

  // --- Portfolio ---
  await prisma.portfolioItem.deleteMany();
  const portfolio = [
    { title: 'Хакатон TechConnect Autumn 2025', description: 'Двухдневный марафон разработки с задачами от партнёров. Команды представили рабочие прототипы.', participants: 120, partnersCount: 4, resultText: '5 участников получили офферы', date: new Date('2025-10-25'), order: 1 },
    { title: 'Форум «Путь в IT»', description: 'Карьерный форум с HR ведущих компаний региона, разбором резюме и мок-собеседованиями.', participants: 200, partnersCount: 6, resultText: '30+ приглашений на стажировку', date: new Date('2025-11-22'), order: 2 },
    { title: 'Серия митапов, сезон 2025', description: 'Регулярные технические встречи по frontend, backend и Data Science.', participants: 350, partnersCount: 5, resultText: '8 митапов за семестр', date: new Date('2025-12-01'), order: 3 },
  ];
  for (const item of portfolio) await prisma.portfolioItem.create({ data: item });
  console.log(`✓ portfolio: ${portfolio.length}`);

  // --- Gazette (multi-page "Новости") ---
  // Built from the SAME layout templates the admin offers, so seeded demo pages
  // and hand-authored pages share one column grid and one set of margins.
  await prisma.newspaperBlock.deleteMany();
  await prisma.gazettePage.deleteMany();

  const issues: { issueNumber: number; issueDate: Date; templates: TemplateId[] }[] = [
    { issueNumber: 1, issueDate: new Date('2026-08-07'), templates: ['cover', 'standard'] },
    { issueNumber: 2, issueDate: new Date('2026-08-11'), templates: ['cover', 'photo', 'text'] },
  ];

  let blockCount = 0;
  let order = 0;
  for (const issue of issues) {
    for (const template of issue.templates) {
      const seeds = TEMPLATES[template];
      await prisma.gazettePage.create({
        data: {
          issueNumber: issue.issueNumber,
          issueDate: issue.issueDate,
          order: order++,
          width: PAGE_W,
          height: PAGE_H,
          published: true,
          blocks: {
            create: seeds.map((b, i) => ({
              x: b.x,
              y: b.y,
              width: b.width,
              height: b.height,
              zIndex: i + 1,
              tone: b.tone ?? 'light',
              kind: b.kind ?? 'content',
              number: b.number ?? '',
              kicker: b.kicker ?? '',
              title: b.title ?? '',
              contentMd: b.contentMd ?? '',
              imageUrl: b.imageUrl ?? null,
              imageFit: b.imageFit ?? 'cover',
              imageScale: b.imageScale ?? 1,
              imagePosX: b.imagePosX ?? 50,
              imagePosY: b.imagePosY ?? 50,
              imageW: b.imageW ?? null,
              imageH: b.imageH ?? null,
              imageLayout: b.imageLayout ?? 'top',
              imageSpan: b.imageSpan ?? 55,
              imageAlt: b.imageAlt ?? '',
              images: JSON.stringify(b.images ?? []),
            })),
          },
        },
      });
      blockCount += seeds.length;
    }
  }
  console.log(`✓ gazette: ${order} pages across ${issues.length} issues, ${blockCount} blocks`);

  console.log('\nSeed complete ✨');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
