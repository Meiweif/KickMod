const LANG_KEY = "kickmod:lang";

const I18N = {
  ru: {
    subtitle: "Статистика модераторов на канале",
    channelLabel: "Никнейм стримера",
    open: "Открыть статистику",
    invalid: "Введите корректный никнейм",
    notFound: "Канал не найден",
    opening: "Открываем…",
    offlineConfirm:
      "Вы уверены, что хотите открыть этого стримера? Он сейчас не находится в эфире"
  },
  en: {
    subtitle: "Moderator stats for a channel",
    channelLabel: "Streamer username",
    open: "Open statistics",
    invalid: "Enter a valid username",
    notFound: "Channel not found",
    opening: "Opening…",
    offlineConfirm:
      "Are you sure you want to open this streamer? They are not live right now"
  }
};

const ui = {
  title: document.getElementById("popupTitle"),
  subtitle: document.getElementById("popupSubtitle"),
  channelLabel: document.getElementById("channelLabel"),
  channelInput: document.getElementById("channelInput"),
  openBtn: document.getElementById("openBtn"),
  errorText: document.getElementById("errorText"),
  langBtns: document.querySelectorAll(".lang-btn")
};

let lang = "en";

function t(key) {
  return I18N[lang]?.[key] || I18N.en[key] || key;
}

function isValidChannel(value) {
  const name = String(value || "").trim().replace(/^@+/, "");
  return name.length >= 2 && name.length <= 32 && /^[\w.-]+$/.test(name);
}

function applyLang() {
  ui.subtitle.textContent = t("subtitle");
  ui.channelLabel.textContent = t("channelLabel");
  ui.openBtn.textContent = t("open");
  ui.langBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
}

function showError(text) {
  ui.errorText.textContent = text;
  ui.errorText.classList.remove("hidden");
}

function hideError() {
  ui.errorText.classList.add("hidden");
}

async function loadLang() {
  const data = await chrome.storage.local.get(LANG_KEY);
  const stored = data[LANG_KEY];
  if (stored === "ru" || stored === "en") {
    lang = stored;
  } else {
    const uiLang = chrome.i18n.getUILanguage().toLowerCase();
    lang = uiLang.startsWith("ru") ? "ru" : "en";
  }
  applyLang();
}

async function saveLang(next) {
  lang = next;
  await chrome.storage.local.set({ [LANG_KEY]: lang });
  applyLang();
}

ui.langBtns.forEach((btn) => {
  btn.addEventListener("click", () => saveLang(btn.dataset.lang));
});

ui.openBtn.addEventListener("click", async () => {
  hideError();
  const channel = ui.channelInput.value.trim().replace(/^@+/, "").toLowerCase();
  if (!isValidChannel(channel)) {
    showError(t("invalid"));
    return;
  }

  ui.openBtn.disabled = true;
  ui.openBtn.textContent = t("opening");

  const valid = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "KICKMOD_VALIDATE_CHANNEL", channel }, resolve);
  });

  if (!valid?.ok) {
    showError(t("notFound"));
    ui.openBtn.disabled = false;
    ui.openBtn.textContent = t("open");
    return;
  }

  const liveRes = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "KICKMOD_IS_LIVE", channel }, resolve);
  });

  if (!liveRes?.live && !window.confirm(t("offlineConfirm"))) {
    ui.openBtn.disabled = false;
    ui.openBtn.textContent = t("open");
    return;
  }

  chrome.runtime.sendMessage({ type: "KICKMOD_START_TRACKING", channel }, () => {
    chrome.runtime.sendMessage({ type: "KICKMOD_OPEN_STATISTICS", channel }, () => {
      ui.openBtn.disabled = false;
      ui.openBtn.textContent = t("open");
      window.close();
    });
  });
});

ui.channelInput.addEventListener("input", () => {
  ui.channelInput.value = ui.channelInput.value.replace(/[^a-zA-Z0-9_.-]/g, "");
  hideError();
});

ui.channelInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    ui.openBtn.click();
  }
});

loadLang();
