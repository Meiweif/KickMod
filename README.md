# 🛡️ KickMod

A lightweight Chrome extension to track moderator bans, timeouts, and chat activity on [Kick.com](https://kick.com) in real time, with a live moderation log, session summary, activity charts, and a built-in HLS player.

---

## ✨ Features

* 🛡️ **Live moderation log** — tracks bans and timeouts as they appear in chat.
* 📊 **Session summary** — shows total actions, active moderators, average activity, top moderator, and live chat message count.
* 🔍 **Smart search & sorting** — search by nickname, moderator, or last message text; sort by newest or oldest.
* 📈 **Activity charts** — visualize moderation actions and chat messages per minute.
* 👤 **Moderator leaderboard** — see the most active moderators and compare their activity.
* 🎬 **Built-in HLS player** — watch the live stream directly inside the extension.
* 🌍 **Language support** — full interface in Russian (RU) and English (EN).

---

## 🛠️ Installation

### ✅ Method 1. Chrome Web Store
1. Open the extension page on the Chrome Web Store.
2. Click **Add to Chrome**.
3. Confirm installation.

> [!NOTE]
> This is the easiest method, but updates may appear with a slight delay depending on Chrome Web Store review.

### ⚡ Method 2. Manual install
1. Open `chrome://extensions/` in your browser.
2. Enable **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select the `KickMod` folder.

> [!IMPORTANT]
> This method is useful for testing and faster local updates.

---

## 💡 Usage

### Method 1. Via the popup
1. Click the extension icon in the browser toolbar.
2. Enter the streamer’s name using Latin characters only.
3. Open the statistics page — data collection starts immediately.

### Method 2. Direct link

```text
chrome-extension://<YOUR_EXTENSION_ID>/pages/kick-statistics.html?channel=STREAMER_NAME
```

> [!IMPORTANT]
> Replace `STREAMER_NAME` with the streamer’s channel name and `<YOUR_EXTENSION_ID>` with your extension’s unique ID from `chrome://extensions/`.

---

## 🔑 API Reference

> [!NOTE]
> KickMod uses public Kick endpoints and Kick’s public chat WebSocket. No API keys, registration, or Kick login are required.

---

## 🔒 Privacy

> [!IMPORTANT]
> KickMod does not send user data to developer servers. Session statistics are stored temporarily in browser memory and reset after browser restart. Only the UI language preference is saved locally in `chrome.storage`.

---

## 📦 Compatibility

* Chrome and Chromium-based browsers
* Kick.com channels
* Russian and English UI

---

## ⭐ Support

If you find KickMod useful, please leave a rating and review on the Chrome Web Store.
