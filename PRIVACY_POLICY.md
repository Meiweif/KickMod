# KickMod — Privacy Policy / Политика конфиденциальности

**Last updated / Дата обновления:** June 5, 2026  
**Extension version / Версия расширения:** 1.0.0

---

## English

### Overview

KickMod (“the Extension”) is a free Chrome extension that displays moderation statistics (bans, timeouts, unbans) and chat activity for a **Kick.com channel you choose**. The Extension does **not** require payment, subscription, or login to Kick or any third-party account operated by the developer.

### Data controller

There is **no developer-operated server** that collects or stores your data. The Extension runs entirely in your browser. Network requests go only to **Kick.com**, **Pusher** (Kick chat WebSocket), and **video CDN hosts** used for live playback.

### What we store on your device

| Data | Where | Purpose | Retention |
|------|--------|---------|-----------|
| UI language (`ru` or `en`) | `chrome.storage.local` under key `kickmod:lang` | Remember your language choice | Until you clear extension data or uninstall |
| Session statistics (bans, timeouts, message counts, charts) | In-memory in the Extension service worker | Show stats for the current browser session | Cleared when the browser restarts or the service worker stops |
| Temporary API cache (channel info, public profiles) | In-memory only | Reduce duplicate requests to Kick | Cleared with the service worker |

We **do not** persist moderation logs, chat messages, or channel statistics to disk beyond the language preference above.

### What we do not collect

- No accounts, passwords, or payment information  
- No analytics or advertising SDKs  
- No data sold to third parties  
- No upload of your statistics to the developer  

### Network access

The Extension may contact:

- `https://kick.com` and subdomains — channel validation, public user/channel metadata, stream URLs  
- `wss://*.pusher.com` — public Kick chat events (moderation and messages)  
- `https://*.live-video.net` and related CDNs — HLS playback in the built-in player  
- `https://cdn.jsdelivr.net` — **HLS.js** library loaded on the statistics page for the player only  

Some Kick API requests use `credentials: "include"`, which may send **cookies already stored in your browser for kick.com** if you are logged in on Kick. The Extension does not read or store those cookies separately; they remain under Kick’s control.

### Permissions

- **storage** — save UI language only  
- **tabs** — open or focus the statistics page  
- **host permissions** — connect to Kick, Pusher, and stream CDNs as described above  

### Children

The Extension is not directed at children under 13. We do not knowingly collect personal information from children.

### Changes

We may update this policy when the Extension changes. The “Last updated” date at the top will be revised accordingly.

### Contact

For privacy questions about KickMod, open an issue on the project’s GitHub repository or contact the publisher listed on the Chrome Web Store listing.

---

## Русский

### Обзор

**KickMod** («Расширение») — бесплатное расширение для Chrome, которое показывает статистику модерации (баны, тайм-ауты, разбаны) и активность чата для **канала Kick.com, который вы указываете сами**. Расширение **не требует** оплаты, подписки или входа в аккаунт Kick или любой сторонний аккаунт разработчика.

### Кто обрабатывает данные

**Серверов разработчика нет** — данные не собираются и не хранятся на стороне автора. Расширение работает в вашем браузере. Сетевые запросы идут только к **Kick.com**, **Pusher** (WebSocket чата Kick) и **CDN видеопотока** для воспроизведения эфира.

### Что сохраняется на устройстве

| Данные | Где | Зачем | Срок |
|--------|-----|-------|------|
| Язык интерфейса (`ru` или `en`) | `chrome.storage.local`, ключ `kickmod:lang` | Запомнить выбор языка | Пока не очистите данные расширения или не удалите его |
| Статистика сессии (баны, тайм-ауты, счётчики, графики) | В оперативной памяти service worker | Показать статистику за текущую сессию браузера | Сбрасывается при перезапуске браузера или остановке service worker |
| Временный кэш API (канал, публичные профили) | Только в памяти | Меньше повторных запросов к Kick | Сбрасывается вместе с service worker |

Журнал модерации, сообщения чата и статистика канала **на диск не записываются** (кроме языка интерфейса).

### Чего мы не собираем

- Нет аккаунтов, паролей и платёжных данных  
- Нет аналитики и рекламных SDK  
- Данные не продаются третьим лицам  
- Статистика не отправляется разработчику  

### Сетевой доступ

Расширение может обращаться к:

- `https://kick.com` и поддоменам — проверка канала, публичные данные пользователей/каналов, ссылки на поток  
- `wss://*.pusher.com` — публичные события чата Kick (модерация и сообщения)  
- `https://*.live-video.net` и связанным CDN — воспроизведение HLS во встроенном плеере  
- `https://cdn.jsdelivr.net` — библиотека **HLS.js** только на странице статистики для плеера  

Часть запросов к Kick использует `credentials: "include"` — в браузере могут отправляться **cookies kick.com**, если вы уже вошли на Kick. Расширение отдельно не читает и не сохраняет эти cookies; ими управляет Kick.

### Разрешения

- **storage** — только язык интерфейса  
- **tabs** — открытие и фокус страницы статистики  
- **host_permissions** — доступ к Kick, Pusher и CDN потока, как описано выше  

### Дети

Расширение не предназначено для детей младше 13 лет. Мы сознательно не собираем персональные данные детей.

### Изменения

Политика может обновляться при изменении Расширения. Дата «Дата обновления» в начале документа будет меняться соответственно.

### Контакты

По вопросам конфиденциальности KickMod создайте issue в репозитории GitHub проекта или свяжитесь с издателем, указанным в карточке Chrome Web Store.
