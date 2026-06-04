importScripts(
  "../lib/constants.js",
  "../lib/kick-api.js",
  "../lib/moderation-parser.js",
  "./tracker.js"
);

const openingChannels = new Set();

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const type = message?.type;

  if (type === "KICKMOD_BEGIN_SESSION") {
    const channel = String(message.channel || "").trim();
    const begun = KickModTracker.beginPageSession(channel);
    KickModTracker.startTracking(channel).then((result) =>
      sendResponse({ ...result, startedAt: begun.startedAt })
    );
    return true;
  }

  if (type === "KICKMOD_START_TRACKING") {
    const channel = String(message.channel || "").trim();
    KickModTracker.startTracking(channel).then((result) => sendResponse(result));
    return true;
  }

  if (type === "KICKMOD_GET_CHANNEL_DATA") {
    const channel = String(message.channel || "").trim();
    sendResponse({ ok: true, data: KickModTracker.getChannelData(channel) });
    return false;
  }

  if (type === "KICKMOD_FETCH_PROFILE") {
    KickModApi.fetchUserProfile(message.username).then((profile) => sendResponse({ ok: true, profile }));
    return true;
  }

  if (type === "KICKMOD_VALIDATE_CHANNEL") {
    KickModApi.validateChannel(message.channel).then((result) => sendResponse(result));
    return true;
  }

  if (type === "KICKMOD_FETCH_STREAM") {
    KickModApi.fetchStreamPlayback(message.channel).then((result) => sendResponse(result));
    return true;
  }

  if (type === "KICKMOD_IS_LIVE") {
    KickModApi.isChannelLive(message.channel).then((live) => sendResponse({ ok: true, live }));
    return true;
  }

  if (type === "KICKMOD_GET_LIVE_INFO") {
    KickModApi.getChannelLiveInfo(message.channel).then((result) => sendResponse(result));
    return true;
  }

  if (type === "KICKMOD_OPEN_STATISTICS") {
    const channel = KickModApi.normalizeSlug(message.channel);
    const url = chrome.runtime.getURL(`pages/kick-statistics.html?channel=${encodeURIComponent(channel)}`);

    if (channel && openingChannels.has(channel)) {
      sendResponse({ opened: false });
      return false;
    }
    if (channel) {
      openingChannels.add(channel);
    }

    chrome.tabs.query({}, (tabs) => {
      const existing = tabs.find((tab) => {
        if (!tab?.url) {
          return false;
        }
        return (
          tab.url.startsWith(chrome.runtime.getURL("pages/kick-statistics.html")) &&
          tab.url.includes(`channel=${encodeURIComponent(channel)}`)
        );
      });

      if (existing?.id) {
        chrome.tabs.update(existing.id, { active: true });
        sendResponse({ opened: false, tabId: existing.id });
        if (channel) {
          openingChannels.delete(channel);
        }
        return;
      }

      chrome.tabs.create({ url }, (tab) => {
        sendResponse({ opened: true, tabId: tab?.id });
        if (channel) {
          openingChannels.delete(channel);
        }
      });
    });

    if (channel) {
      setTimeout(() => openingChannels.delete(channel), 2000);
    }
    return true;
  }

  return false;
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(KickModConstants.LANG_KEY, (data) => {
    if (!data[KickModConstants.LANG_KEY]) {
      const uiLang = chrome.i18n.getUILanguage().toLowerCase();
      const lang = uiLang.startsWith("ru") ? "ru" : "en";
      chrome.storage.local.set({ [KickModConstants.LANG_KEY]: lang });
    }
  });
});
