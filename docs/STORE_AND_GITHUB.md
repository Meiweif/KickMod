# KickMod — тексты для Chrome Web Store и GitHub

## Краткое описание (Chrome Web Store, до ~132 символов)

**RU:** Статистика банов, тайм-аутов и активности модераторов на Kick.com. Бесплатно, без входа в аккаунт.

**EN:** Moderator bans, timeouts and activity stats for Kick.com channels. Free, no login required.

---

## Подробное описание (Chrome Web Store)

### RU

**KickMod** — бесплатное расширение для Chrome, которое помогает отслеживать работу модераторов на каналах [Kick.com](https://kick.com). Регистрация, подписка и оплата **не требуются**. Вход в аккаунт Kick **не нужен**.

#### Как начать
1. Нажмите на иконку расширения.
2. Введите никнейм стримера (латиница).
3. Откройте страницу статистики — данные собираются с момента открытия страницы.

#### Журнал действий
- Баны и тайм-ауты в реальном времени через WebSocket чата Kick.
- Дата действия, никнейм пользователя (с галочкой верификации слева, если есть на платформе), модератор, последнее сообщение в чате, длительность, статус (забанен, отстранён, истёк, разбанен).
- Поиск по никнейму, модератору и тексту последнего сообщения с подсветкой совпадений.
- Сортировка: новые / старые.
- Копирование списка никнеймов (режим «Баны»).

#### Сводка за сессию
- Всего банов или тайм-аутов (переключатель «Баны» / «Тайм-ауты»).
- Число активных модераторов, среднее за сессию, лучший модератор.
- Счётчик сообщений в чате за текущую сессию.

#### Активность
- График действий и сообщений в минуту за время сессии.
- Опционально: топ часто упоминаемых слов в чате (от 2 упоминаний).

#### Модераторы
- Рейтинг самых активных модераторов с галочкой верификации.

#### Дополнительно
- Встроенный плеер прямого эфира (HLS).
- Переключение канала без закрытия расширения.
- Интерфейс **RU / EN**, даты в часовом поясе браузера.
- Подтверждение при открытии канала, который не в эфире.
- Сообщение «Канал не найден», если канала нет на Kick.

**Конфиденциальность:** статистика сессии хранится в памяти браузера и сбрасывается после перезапуска. На серверы разработчика данные не отправляются. Запросы идут только к Kick.com и Pusher для работы функций.

---

### EN

**KickMod** is a free Chrome extension to monitor moderator activity on [Kick.com](https://kick.com) channels. **No registration, subscription, or payment.** **No Kick login** is required.

#### Getting started
1. Click the extension icon.
2. Enter the streamer username (Latin characters).
3. Open the statistics page — data is collected from the moment the page is opened.

#### Action log
- Live bans and timeouts via Kick chat WebSocket.
- Action date, user nickname (verified badge when applicable), moderator, last chat message, duration, status.
- Search across nicknames, moderators, and last messages with highlight.
- Sort: newest / oldest.
- Copy nickname list (Bans mode).

#### Session summary
- Total bans or timeouts (toggle).
- Active moderators, session average, top moderator.
- Live chat message counter for the session.

#### Activity chart
- Actions and messages per minute for the session.
- Optional top mentioned words (2+ mentions).

#### Moderator leaderboard
- Most active moderators with verification badges.

#### More
- Built-in live stream player (HLS).
- Switch channel in-app.
- **RU / EN** UI, dates in the browser timezone.
- Offline channel confirmation.
- “Channel not found” in the popup when the channel does not exist.

**Privacy:** session stats live in browser memory and reset after restart. No data is sent to the developer’s servers. Requests go only to Kick.com and Pusher.

---

## README для GitHub (можно вставить в README.md)

См. разделы выше + блок:

```markdown
## License & cost
Free to use. No paid features. No account linking.

## Permissions
- **storage** — UI language preference only (`ru` / `en`)
- **tabs** — open/focus the statistics page
- **host** — Kick.com API, chat WebSocket (Pusher), HLS playback URLs

## Privacy
Session moderation stats are kept in memory only. No analytics SDK. No developer backend.
```

---

## Chrome Web Store — Developer Dashboard

### Описание цели (Purpose description)*

**RU (рекомендуется):**  
Расширение предоставляет владельцам и модераторам каналов Kick.com инструмент для просмотра статистики модерации (баны, тайм-ауты, разбаны) и активности чата в рамках текущей сессии браузера. Пользователь сам указывает канал; расширение подключается к публичному чату Kick и отображает журнал действий, сводку и графики. Оплата и авторизация не требуются.

**EN:**  
The extension lets Kick.com channel owners and moderators view moderation statistics (bans, timeouts, unbans) and chat activity for the current browser session. The user enters a channel name; the extension connects to Kick’s public chat and shows an action log, summary, and charts. No payment or login required.

---

### Обоснование (storage)*

**RU:**  
Разрешение `storage` используется только для сохранения выбранного языка интерфейса (русский или английский) в `chrome.storage.local` под ключом `kickmod:lang`. Данные модерации, никнеймы пользователей и сообщения чата в постоянное хранилище не записываются.

**EN:**  
`storage` is used only to save the UI language choice (Russian or English) in `chrome.storage.local` under `kickmod:lang`. Moderation data, usernames, and chat messages are not persisted to storage.

---

### Обоснование (tabs)*

**RU:**  
Разрешение `tabs` нужно, чтобы открыть страницу статистики расширения (`kick-statistics.html`) с параметром канала и при повторном открытии того же канала переключиться на уже открытую вкладку, а не создавать дубликаты.

**EN:**  
`tabs` is used to open the extension statistics page with the channel query parameter and to focus an existing tab when the same channel is opened again instead of creating duplicates.

---

### Обоснование (Разрешение на доступ к хостам / host_permissions)*

**RU:**  
- `https://kick.com/*` и `https://*.kick.com/*` — проверка существования канала, профили пользователей (верификация), данные эфира и HLS.  
- `wss://ws-*.pusher.com/*` — подключение к публичному WebSocket чата Kick для событий модерации и сообщений.  
- `https://*.playback.live-video.net/*` и `https://*.live-video.net/*` — воспроизведение потока во встроенном плеере.  
Данные отправляются только на указанные сервисы Kick/Pusher/CDN; сторонних серверов разработчика нет.

**EN:**  
- `kick.com` — channel validation, user profiles (verification), live stream metadata.  
- `wss://ws-*.pusher.com/*` — Kick public chat WebSocket for moderation and chat events.  
- `*.live-video.net` — HLS playback in the built-in player.  
Traffic goes only to Kick/Pusher/CDN; no developer-owned backend.

---

### «Вы используете удаленный код?» (Remote code)

**Выбирайте: Да / Yes.**

На странице статистики подключается **HLS.js** с CDN (`cdn.jsdelivr.net`) для воспроизведения потока во встроенном плеере. Это единственный удалённый исполняемый скрипт; остальной код — в пакете расширения (MV3 service worker, локальные JS/CSS).

**Обоснование (EN):** HLS.js is loaded from jsDelivr CDN only on the statistics page to play Kick live HLS streams in the embedded player. All other code is bundled locally.

---

### «Какие данные пользователей вы планируете собирать?»

Рекомендуемые ответы в форме (отметьте только то, что реально соответствует политике):

| Категория | Сейчас | Комментарий |
|-----------|--------|-------------|
| **Идентификация** | Нет | Нет аккаунта в расширении |
| **Персональные данные** | Нет | |
| **Активность пользователя** | Нет* | *Не отправляется разработчику; локально в RAM на время сессии |
| **Контент сайтов** | Да (если форма требует) | Публичные события чата/модерации выбранного канала Kick, только для отображения пользователю |
| **История веб-поиска** | Нет | |
| **История просмотров** | Нет | |

**Цель использования «контента сайтов» (если спросят):** функциональность расширения — показ журнала модерации и статистики выбранного канала.

**Передача третьим лицам:** нет (кроме запросов к Kick/Pusher как к операторам платформы, не к аналитике разработчика).

**Продаёте данные:** нет.

---

## Политика конфиденциальности

Полный текст (EN + RU): **[PRIVACY_POLICY.md](../PRIVACY_POLICY.md)**

Для Chrome Web Store укажите URL на этот файл в репозитории GitHub, например:  
`https://github.com/<username>/KickMod/blob/main/PRIVACY_POLICY.md`

---

*Версия документа: 1.0.0*
