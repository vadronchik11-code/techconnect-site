# TechConnect — сайт объединения ЮУрГУ

Сайт технического объединения TechConnect: митапы, хакатоны, форумы, практика и помощь
с трудоустройством. Публичный сайт + админка для команды (админы и сммщики).

## Стек

- **Next.js 15** (App Router, TypeScript) — сайт, API и админка в одном проекте
- **Prisma** + **SQLite** (dev) / **PostgreSQL** (prod)
- **Tailwind CSS** — фирменная палитра TechConnect
- **GSAP** — прорисовка «дорожки мероприятий» при скролле
- **SVG + SMIL/CSS** — анимация лого (вращающаяся шестерёнка + летящая комета)
- Авторизация — собственная на JWT-cookie (`jose` + `bcryptjs`), роли `ADMIN` / `MODERATOR`

## Быстрый старт (локально)

```bash
npm install                 # установка зависимостей (+ prisma generate)
npm run db:push             # создать SQLite-базу по схеме
npm run db:seed             # демо-контент + учётки
npm run dev                 # http://localhost:3000
```

Учётные записи после сидинга (см. `.env`):

- Админ: `admin@techconnect.ru` / `techconnect`
- Модератор: `smm@techconnect.ru` / `techconnect`

Админка: **/admin** (ссылка также в футере).

## Структура

```
src/
  app/
    (site)/           публичные страницы: главная, новости, мероприятия, портфолио, партнёры, контакты
    admin/
      login/          вход
      (panel)/        защищённая панель: обзор + CRUD
    api/              auth, applications, upload
  components/         AnimatedLogo, Header, Footer, EventRoadmap, формы админки…
  lib/
    actions/          серверные экшены (CRUD)
    auth.ts prisma.ts utils.ts constants.ts
prisma/               schema.prisma, seed.ts
```

## Разделы сайта

- **Главная** — hero с анимированным лого, ценности, партнёры, афиша, новости, CTA
- **Новости** — лента + страница новости (Markdown)
- **Мероприятия** — «Карта мероприятий»: извилистая дорожка с остановками (GSAP-прорисовка)
- **Портфолио** — кейсы с цифрами
- **Партнёры** — кто помогает и чем
- **Контакты** — контакты, руководство, форма «стать частью»

## Полезные команды

```bash
npm run db:studio    # Prisma Studio (просмотр БД)
npm run db:reset     # пересоздать БД и засидить заново
npm run build        # прод-сборка
npm run lint         # линт
```

## Деплой на VPS (Docker + PostgreSQL)

1. Переключить `datasource db { provider = "postgresql" }` в `prisma/schema.prisma`.
2. Задать переменные окружения (можно через `.env` рядом с `docker-compose.yml`):
   `AUTH_SECRET` (случайная строка), `DB_PASSWORD`, `SITE_URL`.
3. Запустить:
   ```bash
   docker compose up -d --build
   docker compose exec web npx prisma db push
   docker compose exec web npx tsx prisma/seed.ts   # один раз, для первичного контента
   ```
4. Поставить перед контейнером nginx/Caddy для домена и HTTPS.

Загруженные картинки хранятся в volume `uploads` (`/app/public/uploads`).

## Дизайн

Палитра: `#FFFFFF`, `#000000`, `#A81313`, `#FF511C`, `#FFEBCF` (+ `#FFA009` для градиентов/кометы).
Токены — в `tailwind.config.ts`, глобальные стили и анимации лого — в `src/app/globals.css`.
