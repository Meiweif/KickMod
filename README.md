# KickMod

**EN:** Free Chrome extension for moderator statistics (bans, timeouts, unbans) and chat activity on [Kick.com](https://kick.com) channels. No payment or login required.

**RU:** Бесплатное расширение Chrome для статистики модераторов (баны, тайм-ауты, разбаны) и активности чата на каналах [Kick.com](https://kick.com). Без оплаты и без входа в аккаунт.

**Privacy / Конфиденциальность:** [PRIVACY_POLICY.md](./PRIVACY_POLICY.md)  
**Store listing texts / Тексты для магазина:** [docs/STORE_AND_GITHUB.md](./docs/STORE_AND_GITHUB.md)

## Features / Возможности

- Popup: enter streamer username → open statistics page
- Live action log (bans / timeouts) via Kick chat WebSocket (Pusher)
- Session summary, activity chart, top moderators, optional top words
- Built-in HLS live player, RU/EN UI, browser timezone for dates
- Search in the log (nickname, moderator, last message)

## Install (developer mode) / Установка

1. Open `chrome://extensions`
2. Enable **Developer mode** / **Режим разработчика**
3. **Load unpacked** / **Загрузить распакованное** → select this folder
4. Open the extension popup, enter a channel name, open statistics

## Project structure

```
KickMod/
  manifest.json
  PRIVACY_POLICY.md
  _locales/          # Chrome Web Store (en, ru)
  popup/
  background/        # Service worker + WebSocket tracker
  lib/               # Moderation parser, Kick API
  pages/             # kick-statistics.html (main UI)
  icons/
  docs/
```

## Permissions

| Permission | Why |
|------------|-----|
| `storage` | UI language only (`kickmod:lang`) |
| `tabs` | Open/focus statistics page |
| `host_permissions` | Kick.com API, Pusher chat, HLS CDN |

Session moderation data is kept **in memory** only (not persisted to `chrome.storage`).

## Remote code

HLS.js is loaded from `cdn.jsdelivr.net` on the statistics page for the embedded player (declared in Chrome Web Store as remote code).

## Chrome Web Store package

Include only extension files. Exclude from the ZIP: `.git`, `docs/` (optional), `scripts/`, `*.zip`, `.gitignore`, unused legacy files if removed.

Minimum required paths:

- `manifest.json`, `_locales/`, `popup/`, `background/`, `lib/`, `pages/kick-statistics.*`, `icons/icon*.png`, `icons/verify.png`, `icons/github.png`

## License

Specify your license in the repository before publishing (e.g. MIT). Add a `LICENSE` file if you choose one.
