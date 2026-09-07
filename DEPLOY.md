# Развёртывание TechConnect на сервере

Инструкция от локальной машины до работающего сайта на `techconnect74.ru`
с админкой на `admin.techconnect74.ru`.

Все команды можно копировать целиком. Строки, начинающиеся с `#`, — комментарии,
их копировать не нужно.

---

## Что изменилось и почему это важно

| Было | Стало | Зачем |
|---|---|---|
| Схему надо было накатывать руками | Отдельная служба `migrate` | При каждом деплое схема применяется сама, до старта сайта |
| База лежала внутри образа | Отдельный том `dbdata` | Иначе всё содержимое стиралось бы при каждой пересборке |
| Порт 3000 наружу | Только `127.0.0.1:3000` | Иначе сайт открывался бы по `IP:3000` мимо домена и HTTPS |
| Админка на `/admin` | Отдельный домен | На основном домене `/admin` теперь отдаёт 404 |

**База — SQLite, один и тот же движок локально и на сервере.** Локально это
файл `prisma/dev.db`, на сервере — файл на docker-томе. Никакого Docker для
локальной разработки не нужно.

**Важно про пересборку.** Адрес сайта и хост админки вшиваются в сборку
(так работает Next.js). Поэтому при изменении `SITE_URL` или `ADMIN_HOST`
нужен именно `--build`, а не просто перезапуск.

---

## Шаг 0. Локально

Ничего устанавливать не нужно — база это обычный файл:

```bash
npm run db:push && npm run db:seed
```

```bash
npm run dev
```

В `.env` локально `ADMIN_HOST=""` — значит админка остаётся на `/admin`, как
привык. Разделение по доменам включается только там, где эта переменная задана.

---

## Шаг 1. Локально: залить код на GitHub

Проверь, что попадает в коммит:

```bash
git status --short
```

Добавь всё и закоммить:

```bash
git add -A && git commit -m "Газета, анимированный логотип, иконки, подготовка к деплою"
```

Создай **приватный** репозиторий на https://github.com/new — назови, например,
`techconnect-site`, **без** README и .gitignore (они уже есть).

Подключи его и запушь (подставь свой логин):

```bash
git remote add origin https://github.com/ТВОЙ_ЛОГИН/techconnect-site.git
```

```bash
git branch -M main && git push -u origin main
```

---

## Шаг 2. DNS в reg.ru

В разделе «DNS-серверы и управление зоной» у `techconnect74.ru` уже есть запись
`A @ → 93.88.203.230`. Добавь рядом вторую:

| Тип | Поддомен | Значение |
|---|---|---|
| A | `admin` | `93.88.203.230` |

Записи расходятся не по IP, а по имени — разделять их будет nginx.
Проверить, что запись разошлась (обычно 10–30 минут):

```bash
nslookup admin.techconnect74.ru
```

---

## Шаг 3. На сервере: разведка

Подключись:

```bash
ssh root@93.88.203.230
```

Посмотри, что уже стоит — на сервере есть другие проекты, ничего не ломаем:

```bash
docker --version; docker compose version; nginx -v 2>&1; echo "---"; ss -tlnp | grep -E ':(80|443|3000|5432)\s'
```

Что делать по результатам:

- **nginx не установлен** → `apt update && apt install -y nginx`
- **порт 80/443 занят не nginx** (например, другим контейнером) — напиши мне,
  какой процесс их держит, подберём схему без конфликта
- **порт 3000 занят** — поменяй в `docker-compose.yml` левую часть на
  `127.0.0.1:3001:3000` и дальше используй 3001 в конфиге nginx

---

## Шаг 4. На сервере: код и настройки

```bash
mkdir -p /opt && cd /opt && git clone https://github.com/ТВОЙ_ЛОГИН/techconnect-site.git techconnect && cd techconnect
```

Сгенерируй секрет для подписи сессий — скопируй вывод:

```bash
openssl rand -base64 32
```

Создай `.env` (вставь сгенерированное значение и придумай пароль администратора):

```bash
cat > /opt/techconnect/.env <<'EOF'
AUTH_SECRET="ВСТАВЬ_СЮДА_ВЫВОД_ПРЕДЫДУЩЕЙ_КОМАНДЫ"
SITE_URL="https://techconnect74.ru"
ADMIN_HOST="admin.techconnect74.ru"
SEED_ADMIN_EMAIL="admin@techconnect74.ru"
SEED_ADMIN_PASSWORD="ПРИДУМАЙ_ПАРОЛЬ"
EOF
chmod 600 /opt/techconnect/.env
```

---

## Шаг 5. Запуск

Собрать и поднять (первый раз это 3–5 минут):

```bash
cd /opt/techconnect && docker compose up -d --build
```

Проверить, что всё живо. У `web` должно быть `Up`, у `migrate` — `Exited (0)`:

```bash
docker compose ps
```

Наполнить пустую базу — **только один раз, при первом запуске**:

```bash
docker compose run --rm seed
```

Проверить, что сайт отвечает изнутри сервера:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -H "Host: techconnect74.ru" http://127.0.0.1:3000/
```

Должно быть `200`.

---

## Шаг 6. nginx на два домена

```bash
cat > /etc/nginx/sites-available/techconnect <<'EOF'
# --- публичный сайт ---
server {
    listen 80;
    listen [::]:80;
    server_name techconnect74.ru www.techconnect74.ru;

    # лимит на загрузку фото в админке (в приложении стоит 25 МБ)
    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # КРИТИЧНО: без этих заголовков приложение не узнает, на какой домен
        # пришёл запрос, и не сможет отделить админку от публичного сайта
        proxy_set_header Host              $host;
        proxy_set_header X-Forwarded-Host  $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;

        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
    }
}

# --- админка ---
server {
    listen 80;
    listen [::]:80;
    server_name admin.techconnect74.ru;

    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Forwarded-Host  $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
    }
}
EOF
ln -sf /etc/nginx/sites-available/techconnect /etc/nginx/sites-enabled/techconnect
nginx -t && systemctl reload nginx
```

`nginx -t` должен ответить `syntax is ok` и `test is successful`.

---

## Шаг 7. HTTPS

Без HTTPS **вход в админку не будет работать**: сессионная кука помечена как
`Secure` и по обычному http браузер её не сохранит.

```bash
apt install -y certbot python3-certbot-nginx
```

```bash
certbot --nginx -d techconnect74.ru -d www.techconnect74.ru -d admin.techconnect74.ru
```

На вопрос про редирект выбери **2** (перенаправлять http на https).
Certbot сам продлевает сертификаты, проверить можно так:

```bash
certbot renew --dry-run
```

---

## Шаг 8. Проверка

| Что открыть | Что должно быть |
|---|---|
| `https://techconnect74.ru` | сайт, замок в адресной строке |
| `https://techconnect74.ru/admin` | **404** — админки снаружи не видно |
| `https://admin.techconnect74.ru` | форма входа |
| вход по логину и паролю из `.env` | попадаешь в панель |
| загрузить фото в админке | сохраняется и видно на сайте |
| ссылку на страницу газеты кинуть в Telegram | показывается заголовок и картинка |

Быстрая проверка с самого сервера:

```bash
for h in techconnect74.ru admin.techconnect74.ru; do echo -n "$h/admin -> "; curl -s -o /dev/null -w "%{http_code}\n" "https://$h/admin"; done
```

Ожидается `404` для первого и `307` (редирект на вход) для второго.

---

## Обновление сайта в будущем

Локально:

```bash
git add -A && git commit -m "что изменил" && git push
```

На сервере:

```bash
cd /opt/techconnect && git pull && docker compose up -d --build
```

Схема базы применится сама службой `migrate`. **Команду `seed` больше не
запускай** — она перезаписывает демо-данные.

Если правил `prisma/seed.ts` и нужно прогнать его заново, сначала пересобери
образ, иначе запустится старая версия:

```bash
docker compose build seed && docker compose run --rm seed
```

---

## Бэкапы

Данные живут в двух томах: база (`dbdata`) и загруженные фото (`uploads`).
Оба надо сохранять. База — один файл, так что бэкап это просто копирование.

```bash
mkdir -p /opt/backups
docker run --rm -v techconnect_dbdata:/data -v /opt/backups:/backup alpine tar czf /backup/db-$(date +%F).tar.gz -C /data .
docker run --rm -v techconnect_uploads:/data -v /opt/backups:/backup alpine tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```

Автоматически раз в сутки в 4 утра, с хранением за две недели:

```bash
(crontab -l 2>/dev/null; echo '0 4 * * * docker run --rm -v techconnect_dbdata:/data -v /opt/backups:/backup alpine tar czf /backup/db-$(date +\%F).tar.gz -C /data . && docker run --rm -v techconnect_uploads:/data -v /opt/backups:/backup alpine tar czf /backup/uploads-$(date +\%F).tar.gz -C /data . && find /opt/backups -name "*.tar.gz" -mtime +14 -delete') | crontab -
```

Восстановление (подставь нужную дату):

```bash
cd /opt/techconnect && docker compose down
docker run --rm -v techconnect_dbdata:/data -v /opt/backups:/backup alpine sh -c "rm -rf /data/* && tar xzf /backup/db-2026-09-07.tar.gz -C /data"
docker compose up -d
```

---

## Если что-то пошло не так

**Смотреть логи:**

```bash
cd /opt/techconnect && docker compose logs -f web
```

**Сайт не открывается, `docker compose ps` показывает у web `Restarting`** —
почти всегда не сошлись переменные в `.env`. Проверь, что заполнены
`AUTH_SECRET` и `SITE_URL`.

**На `admin.` домене открывается публичный сайт, а не админка** — nginx не
передал имя домена. Проверь, что в конфиге есть строки `proxy_set_header Host`
и `X-Forwarded-Host`, затем `nginx -t && systemctl reload nginx`.

**Вход в админку не срабатывает: форма отправляется, но остаёшься на месте** —
почти наверняка сайт открыт по `http` вместо `https`. Кука сессии помечена
`Secure` и по http не сохраняется. Заверши шаг 7.

**Поменял `SITE_URL` или `ADMIN_HOST`, а ничего не изменилось** — эти значения
вшиваются в сборку. Нужно `docker compose up -d --build`, обычного
`restart` недостаточно.

**Загруженные фото пропали после пересборки** — проверь, что том на месте:
`docker volume ls | grep uploads`. Пересборка образа тома не трогает.
