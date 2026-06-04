(function () {
  const LANG_KEY = "kickmod:lang";

  const I18N = {
    ru: {
      pageTitle: "KickMod — Статистика",
      channel: "Канал",
      connected: "Сбор данных активен",
      connecting: "Подключение…",
      channelNotFound: "Канал не найден",
      statTotalTimeouts: "Всего тайм-аутов",
      statTotalBans: "Всего банов",
      statForSession: "за сессию",
      statMods: "Активных модераторов",
      statModsHint: "выдавали тайм-ауты",
      statModsHintBans: "выдавали баны",
      statAvg: "Среднее за сессию",
      statAvgHint: "тайм-аутов",
      statAvgHintBans: "банов",
      statBest: "Лучший модератор",
      toggleBans: "Баны",
      toggleTimeouts: "Тайм-ауты",
      chartTitle: "Активность",
      legendActions: "Действия/мин",
      legendMessages: "Сообщений/мин",
      legendWords: "Чаще упомянутые слова",
      chartWordsTitle: "Чаще упомянутые слова",
      modsChartTitle: "Самые активные модераторы",
      modsLegend: "Количество тайм-аутов",
      modsLegendBans: "Количество банов",
      logTitle: "Журнал действий",
      searchPlaceholder: "Поиск…",
      playerOnline: "Онлайн",
      sortNew: "Новые",
      sortOld: "Старые",
      thDate: "Дата отстранения",
      thNickname: "Никнейм",
      playerNotStarted: "Стрим еще не начался!",
      playerNoUrl: "Не удалось получить поток",
      playerLive: "Прямой эфир",
      thModerator: "Модератор",
      thMessage: "Последнее сообщение",
      thDuration: "Длительность",
      thStatus: "Статус",
      statusBanned: "Забанен",
      statusSuspended: "Отстранен",
      statusExpired: "Истек",
      statusUnbanned: "Разбанен",
      noMessage: "—",
      durationBan: "перманентный бан",
      durationTimeout: "тайм-аут на {n} мин",
      empty: "Пока нет записей. Данные появятся при модерации в чате канала.",
      dash: "—",
      sessionMessages: "Сообщений в чате за сессию:",
      sessionTime: "Время сессии:",
      openPlayer: "Открыть плеер трансляции",
      switchChannel: "Переключить канал",
      switchTitle: "Переключить канал",
      switchConfirm: "Перейти",
      switchCancel: "Отмена",
      switchPlaceholder: "никнейм канала",
      switchInvalid: "Только латиница, цифры, _ и -",
      switchNotFound: "Канал не найден на Kick.com",
      leaveConfirm: "Вы уверены, что хотите покинуть страницу? Данные сессии будут потеряны.",
      copyNicknames: "Скопировать никнеймы",
      copyDone: "Скопировано"
    },
    en: {
      pageTitle: "KickMod — Statistics",
      channel: "Channel",
      connected: "Collecting data",
      connecting: "Connecting…",
      channelNotFound: "Channel not found",
      statTotalTimeouts: "Total timeouts",
      statTotalBans: "Total bans",
      statForSession: "per session",
      statMods: "Active moderators",
      statModsHint: "issued timeouts",
      statModsHintBans: "issued bans",
      statAvg: "Session average",
      statAvgHint: "timeouts",
      statAvgHintBans: "bans",
      statBest: "Top moderator",
      toggleBans: "Bans",
      toggleTimeouts: "Timeouts",
      chartTitle: "Activity",
      legendActions: "Actions/min",
      legendMessages: "Messages/min",
      legendWords: "Top mentioned words",
      chartWordsTitle: "Top mentioned words",
      modsChartTitle: "Most active moderators",
      modsLegend: "Number of timeouts",
      modsLegendBans: "Number of bans",
      logTitle: "Action log",
      searchPlaceholder: "Search…",
      playerOnline: "Online",
      sortNew: "Newest",
      sortOld: "Oldest",
      thDate: "Action date",
      thNickname: "Nickname",
      playerNotStarted: "Stream hasn't started yet!",
      playerNoUrl: "Could not load stream",
      playerLive: "Live",
      thModerator: "Moderator",
      thMessage: "Last message",
      thDuration: "Duration",
      thStatus: "Status",
      statusBanned: "Banned",
      statusSuspended: "Suspended",
      statusExpired: "Expired",
      statusUnbanned: "Unbanned",
      noMessage: "—",
      durationBan: "permanent ban",
      durationTimeout: "timeout for {n} min",
      empty: "No entries yet. Data appears when moderators act in the channel chat.",
      dash: "—",
      sessionMessages: "Chat messages this session:",
      sessionTime: "Session time:",
      openPlayer: "Open stream player",
      switchChannel: "Switch channel",
      switchTitle: "Switch channel",
      switchConfirm: "Go",
      switchCancel: "Cancel",
      switchPlaceholder: "channel username",
      switchInvalid: "Latin letters, digits, _ and - only",
      switchNotFound: "Channel not found on Kick.com",
      leaveConfirm: "Are you sure you want to leave? Session data will be lost.",
      copyNicknames: "Copy nicknames",
      copyDone: "Copied"
    }
  };

  const SORT_OPTIONS = [
    { value: "new", key: "sortNew" },
    { value: "old", key: "sortOld" }
  ];

  const state = {
    channel: "",
    channelVerified: false,
    lang: "en",
    actions: [],
    minuteBuckets: [],
    messageCount: 0,
    sessionStartedAt: Date.now(),
    statMode: "ban",
    search: "",
    sort: "new",
    connection: "connecting",
    chartPoints: [],
    topWords: [],
    chartShowActions: true,
    chartShowMessages: true,
    chartShowWords: false,
    playerHls: null,
    playerWatchTimer: null,
    playerToastTimer: null
  };

  const profileCache = new Map();
  const modProfileCache = new Map();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const ui = {
    pageTitle: document.getElementById("pageTitle"),
    channelLine: document.getElementById("channelLine"),
    connectionBadge: document.getElementById("connectionBadge"),
    statTotalLabel: document.getElementById("statTotalLabel"),
    statTotalValue: document.getElementById("statTotalValue"),
    statTotalHint: document.getElementById("statTotalHint"),
    statModsLabel: document.getElementById("statModsLabel"),
    statModsValue: document.getElementById("statModsValue"),
    statModsHint: document.getElementById("statModsHint"),
    statAvgLabel: document.getElementById("statAvgLabel"),
    statAvgValue: document.getElementById("statAvgValue"),
    statAvgHint: document.getElementById("statAvgHint"),
    statBestLabel: document.getElementById("statBestLabel"),
    statBestValue: document.getElementById("statBestValue"),
    statBestHint: document.getElementById("statBestHint"),
    toggleBans: document.getElementById("toggleBans"),
    toggleTimeouts: document.getElementById("toggleTimeouts"),
    chartTitle: document.getElementById("chartTitle"),
    chartLegend: document.getElementById("chartLegend"),
    activityChart: document.getElementById("activityChart"),
    modsChartTitle: document.getElementById("modsChartTitle"),
    modsChartLegend: document.getElementById("modsChartLegend"),
    modsBars: document.getElementById("modsBars"),
    logTitleText: document.getElementById("logTitleText"),
    searchInput: document.getElementById("searchInput"),
    sortDropdown: document.getElementById("sortDropdown"),
    logBody: document.getElementById("logBody"),
    emptyLog: document.getElementById("emptyLog"),
    copyNicknamesBtn: document.getElementById("copyNicknamesBtn"),
    langBtns: document.querySelectorAll(".lang-btn"),
    thDate: document.getElementById("thDate"),
    thNickname: document.getElementById("thNickname"),
    chartTooltip: document.getElementById("chartTooltip"),
    chartWordsBox: document.getElementById("chartWordsBox"),
    chartCanvasWrap: document.querySelector(".chart-canvas-wrap"),
    playerDock: document.getElementById("playerDock"),
    playerDockDrag: document.getElementById("playerDockDrag"),
    playerVideo: document.getElementById("playerVideo"),
    playerDockTitle: document.getElementById("playerDockTitle"),
    playerError: document.getElementById("playerError"),
    playerToast: document.getElementById("playerToast"),
    closePlayerBtn: document.getElementById("closePlayerBtn"),
    thModerator: document.getElementById("thModerator"),
    thMessage: document.getElementById("thMessage"),
    thDuration: document.getElementById("thDuration"),
    thStatus: document.getElementById("thStatus"),
    sessionMessagesLine: document.getElementById("sessionMessagesLine"),
    sessionTimeLine: document.getElementById("sessionTimeLine"),
    openPlayerBtn: document.getElementById("openPlayerBtn"),
    switchChannelBtn: document.getElementById("switchChannelBtn"),
    switchModal: document.getElementById("switchModal"),
    switchModalTitle: document.getElementById("switchModalTitle"),
    switchChannelInput: document.getElementById("switchChannelInput"),
    switchChannelError: document.getElementById("switchChannelError"),
    switchCancelBtn: document.getElementById("switchCancelBtn"),
    switchConfirmBtn: document.getElementById("switchConfirmBtn")
  };

  function t(key, vars) {
    let text = I18N[state.lang]?.[key] || I18N.en[key] || key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  }

  function formatViewerCount(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) {
      return null;
    }
    return Math.floor(n).toLocaleString(state.lang === "ru" ? "ru-RU" : "en-US");
  }

  function highlightSearchText(text, query) {
    const source = String(text || "");
    const q = String(query || "").trim();
    if (!q) {
      return escapeHtml(source);
    }
    const lower = source.toLowerCase();
    const needle = q.toLowerCase();
    let result = "";
    let from = 0;
    let at = lower.indexOf(needle, from);
    while (at !== -1) {
      result += escapeHtml(source.slice(from, at));
      result += `<mark class="search-hit">${escapeHtml(source.slice(at, at + needle.length))}</mark>`;
      from = at + needle.length;
      at = lower.indexOf(needle, from);
    }
    result += escapeHtml(source.slice(from));
    return result;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizeKey(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/^@+/, "");
  }

  function isLatinSlug(value) {
    const slug = normalizeKey(value);
    return slug.length >= 2 && slug.length <= 32 && /^[a-z0-9][a-z0-9_.-]*$/.test(slug);
  }

  function verifyBadgeHtml(className = "verify-icon") {
    return `<span class="${className}" role="img" aria-label="Verified"></span>`;
  }

  function formatDateTime(ts) {
    if (!ts) {
      return t("dash");
    }
    return new Intl.DateTimeFormat(state.lang === "ru" ? "ru-RU" : "en-GB", {
      timeZone: tz,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(new Date(ts));
  }

  function formatRegistration(ts) {
    if (!ts) {
      return t("dash");
    }
    return new Intl.DateTimeFormat(state.lang === "ru" ? "ru-RU" : "en-GB", {
      timeZone: tz,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(ts));
  }

  function formatSessionTime(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) {
      return `${h}ч ${m}м ${s}с`;
    }
    if (m > 0) {
      return `${m}м ${s}с`;
    }
    return `${s}с`;
  }

  function getActionStatus(action) {
    if (action.actionType === "unban") {
      return "unbanned";
    }
    if (action.actionType === "ban") {
      return "banned";
    }
    if (action.actionType === "timeout") {
      const duration = Number(action.durationSeconds);
      if (Number.isFinite(duration) && duration > 0) {
        if (Date.now() >= action.createdAt + duration * 1000) {
          return "expired";
        }
      }
      return "suspended";
    }
    return "expired";
  }

  function statusLabel(status) {
    const map = {
      banned: "statusBanned",
      suspended: "statusSuspended",
      expired: "statusExpired",
      unbanned: "statusUnbanned"
    };
    return t(map[status] || "statusExpired");
  }

  function statusClass(status) {
    const map = {
      banned: "status-banned",
      suspended: "status-suspended",
      expired: "status-expired",
      unbanned: "status-unbanned"
    };
    return map[status] || "status-expired";
  }

  function formatDuration(action) {
    if (action.actionType === "unban") {
      return t("dash");
    }
    if (action.actionType === "ban") {
      return t("durationBan");
    }
    const sec = Number(action.durationSeconds);
    if (!Number.isFinite(sec) || sec <= 0) {
      return t("dash");
    }
    return t("durationTimeout", { n: Math.max(1, Math.round(sec / 60)) });
  }

  function filterByStatMode(actions) {
    if (state.statMode === "ban") {
      return actions.filter((a) => a.actionType === "ban" || a.actionType === "unban");
    }
    return actions.filter((a) => a.actionType === "timeout");
  }

  function computeStats() {
    const relevant = filterByStatMode(state.actions);
    const mods = new Map();
    relevant.forEach((a) => {
      if (a.actionType === "unban") {
        return;
      }
      const mod = normalizeKey(a.moderator);
      if (!mod || mod === "unknown") {
        return;
      }
      mods.set(mod, (mods.get(mod) || 0) + 1);
    });

    const modList = [...mods.entries()].sort((a, b) => b[1] - a[1]);
    const best = modList[0];
    const sessionMin = Math.max(1, (Date.now() - state.sessionStartedAt) / 60000);
    const count = relevant.filter((a) => a.actionType !== "unban").length;

    return {
      total: count,
      modCount: mods.size,
      avg: (count / sessionMin).toFixed(2),
      bestName: best ? best[0] : "—",
      bestCount: best ? best[1] : 0,
      modList
    };
  }

  function getFilteredLogActions() {
    let list = filterByStatMode([...state.actions]);
    const q = state.search.trim().toLowerCase();

    if (q) {
      list = list.filter((a) => {
        const target = normalizeKey(a.target);
        const message = String(getActionMessage(a) || "").toLowerCase();
        const moderator = normalizeKey(a.moderator || "");
        return target.includes(q) || message.includes(q) || moderator.includes(q);
      });
    }

    if (state.sort === "old") {
      list.sort((a, b) => a.createdAt - b.createdAt);
    } else {
      list.sort((a, b) => b.createdAt - a.createdAt);
    }

    return list;
  }

  function getActionMessage(action) {
    const msg = action.lastMessage;
    if (typeof msg === "string" && msg.trim()) {
      return msg.trim();
    }
    return null;
  }

  function drawActivityChart() {
    const canvas = ui.activityChart;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(600, rect.width) * dpr;
    canvas.height = 300 * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    ctx.clearRect(0, 0, w, h);

    const elapsedMin = Math.max(1, Math.ceil((Date.now() - state.sessionStartedAt) / 60000));
    const labels = [];
    const actionsData = [];
    const messagesData = [];

    for (let i = 0; i < elapsedMin; i++) {
      labels.push(i);
      const bucket = state.minuteBuckets.find((b) => b.minute === i);
      if (state.statMode === "ban") {
        actionsData.push(bucket?.bans || 0);
      } else {
        actionsData.push(bucket?.timeouts || 0);
      }
      messagesData.push(bucket?.messages || 0);
    }

    const maxActions = Math.max(1, ...actionsData);
    const maxMsgs = Math.max(1, ...messagesData);
    const pad = { l: 48, r: 48, t: 20, b: 40 };
    const chartW = w - pad.l - pad.r;
    const chartH = h - pad.t - pad.b;
    const step = chartW / Math.max(1, labels.length - 1);

    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(w - pad.r, y);
      ctx.stroke();
    }

    if (state.chartShowActions) {
      labels.forEach((min, i) => {
        const x = pad.l + i * step;
        const barH = ((actionsData[i] || 0) / maxActions) * chartH * 0.85;
        ctx.fillStyle = "rgba(0, 230, 118, 0.35)";
        ctx.fillRect(x - 6, pad.t + chartH - barH, 12, barH);
      });
    }

    if (state.chartShowMessages) {
      ctx.beginPath();
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      labels.forEach((min, i) => {
        const x = pad.l + i * step;
        const y = pad.t + chartH - ((messagesData[i] || 0) / maxMsgs) * chartH * 0.85;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    ctx.fillStyle = "#71717a";
    ctx.font = "10px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    const tickEvery = Math.max(1, Math.floor(labels.length / 8));
    labels.forEach((min, i) => {
      if (i % tickEvery !== 0 && i !== labels.length - 1) {
        return;
      }
      const x = pad.l + i * step;
      const start = new Date(state.sessionStartedAt + min * 60000);
      const label = start.toLocaleTimeString(state.lang === "ru" ? "ru-RU" : "en-GB", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit"
      });
      ctx.fillText(label, x, h - 10);
    });

    renderChartWords();

    state.chartPoints = labels.map((min, i) => {
      const x = pad.l + i * step;
      const timeLabel = new Date(state.sessionStartedAt + min * 60000).toLocaleTimeString(
        state.lang === "ru" ? "ru-RU" : "en-GB",
        { timeZone: tz, hour: "2-digit", minute: "2-digit" }
      );
      return {
        x,
        y: pad.t,
        w: Math.max(12, step),
        h: chartH,
        timeLabel,
        actions: actionsData[i] || 0,
        messages: messagesData[i] || 0
      };
    });
  }

  function showChartTooltip(point, clientX, clientY) {
    const tip = ui.chartTooltip;
    const wrap = ui.chartCanvasWrap;
    if (!tip || !wrap || !point) {
      return;
    }
    const rect = wrap.getBoundingClientRect();
    const lines = [`<div><strong>${escapeHtml(point.timeLabel)}</strong></div>`];
    if (state.chartShowActions) {
      lines.push(`<div>${escapeHtml(t("legendActions"))}: ${point.actions}</div>`);
    }
    if (state.chartShowMessages) {
      lines.push(`<div>${escapeHtml(t("legendMessages"))}: ${point.messages}</div>`);
    }
    tip.innerHTML = lines.join("");
    tip.classList.remove("hidden");
    tip.style.left = `${clientX - rect.left}px`;
    tip.style.top = `${clientY - rect.top - 8}px`;
  }

  function hideChartTooltip() {
    ui.chartTooltip?.classList.add("hidden");
  }

  function bindChartHover() {
    const canvas = ui.activityChart;
    if (!canvas || canvas._kickmodHoverBound) {
      return;
    }
    canvas._kickmodHoverBound = true;
    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const point = state.chartPoints.find((p) => x >= p.x - p.w / 2 && x <= p.x + p.w / 2);
      if (point) {
        showChartTooltip(point, e.clientX, e.clientY);
      } else {
        hideChartTooltip();
      }
    });
    canvas.addEventListener("mouseleave", hideChartTooltip);
  }

  async function renderModeratorBars(modList) {
    const max = modList[0]?.[1] || 1;
    const rows = await Promise.all(
      modList.slice(0, 10).map(async ([name, count], idx) => {
        const profile = await ensureModeratorProfile(name);
        const verify = profile?.verified ? verifyBadgeHtml("verify-badge verify-badge--sm") : "";
        const pct = Math.round((count / max) * 100);
        return `<div class="mod-row"><span class="mod-rank">${idx + 1}</span><span class="mod-name"><span class="mod-pill-inner">${verify}${escapeHtml(name)}</span></span><div class="mod-bar-track"><div class="mod-bar-fill" style="width:${pct}%"></div></div><span class="mod-count">${count}</span></div>`;
      })
    );
    ui.modsBars.innerHTML = rows.join("");
  }

  function renderChartWords() {
    const box = ui.chartWordsBox;
    if (!box) {
      return;
    }
    if (!state.chartShowWords || !state.topWords.length) {
      box.classList.add("hidden");
      box.setAttribute("aria-hidden", "true");
      box.innerHTML = "";
      return;
    }
    box.classList.remove("hidden");
    box.setAttribute("aria-hidden", "false");
    const items = state.topWords
      .slice(0, 5)
      .map(
        (w) =>
          `<div class="chart-words-item"><span>${escapeHtml(w.word)}</span><b>${w.count}</b></div>`
      )
      .join("");
    box.innerHTML = `<div class="chart-words-title">${escapeHtml(t("chartWordsTitle"))}</div><div class="chart-words-list">${items}</div>`;
  }

  function buildChartLegend() {
    const root = ui.chartLegend;
    if (!root) {
      return;
    }
    const items = [
      { key: "actions", label: t("legendActions"), dotClass: "legend-dot--bar", active: state.chartShowActions },
      { key: "messages", label: t("legendMessages"), dotClass: "legend-dot--orange", active: state.chartShowMessages },
      { key: "words", label: t("legendWords"), dotClass: "legend-dot--words", active: state.chartShowWords }
    ];
    root.innerHTML = items
      .map(
        (item) =>
          `<button type="button" class="legend-toggle${item.active ? " active" : " is-off"}" data-series="${item.key}" aria-pressed="${item.active}"><span class="legend-dot ${item.dotClass}"></span>${escapeHtml(item.label)}</button>`
      )
      .join("");

    if (!root._kickmodLegendBound) {
      root._kickmodLegendBound = true;
      root.addEventListener("click", (e) => {
        const btn = e.target.closest(".legend-toggle");
        if (!btn) {
          return;
        }
        const series = btn.dataset.series;
        if (series === "actions") {
          state.chartShowActions = !state.chartShowActions;
        } else if (series === "messages") {
          state.chartShowMessages = !state.chartShowMessages;
        } else if (series === "words") {
          state.chartShowWords = !state.chartShowWords;
        }
        buildChartLegend();
        drawActivityChart();
      });
    }
  }

  async function ensureModeratorProfile(username) {
    const key = normalizeKey(username);
    if (!key || key === "unknown" || !/^[a-z0-9][a-z0-9_.-]*$/.test(key)) {
      return null;
    }
    if (modProfileCache.has(key)) {
      return modProfileCache.get(key);
    }
    const res = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "KICKMOD_FETCH_PROFILE", username: key }, resolve);
    });
    const profile = res?.profile || { username: key, verified: false };
    modProfileCache.set(key, profile);
    return profile;
  }

  async function ensureProfile(action) {
    const key = normalizeKey(action.target);
    if (!key || key === "unknown") {
      return null;
    }
    if (action.profile && (action.profile.createdAt || action.profile.verified)) {
      return action.profile;
    }
    if (profileCache.has(key)) {
      return profileCache.get(key);
    }
    const res = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "KICKMOD_FETCH_PROFILE", username: action.target }, resolve);
    });
    const profile = res?.profile || { username: key, createdAt: null, verified: false };
    action.profile = profile;
    profileCache.set(key, profile);
    return profile;
  }

  function buildCustomSelect() {
    const root = ui.sortDropdown;
    root.innerHTML = "";
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "custom-select-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    const label = document.createElement("span");
    const arrow = document.createElement("span");
    arrow.className = "custom-select-arrow";
    trigger.append(label, arrow);

    const menu = document.createElement("div");
    menu.className = "custom-select-menu";
    menu.setAttribute("role", "listbox");

    function getOptions() {
      return SORT_OPTIONS;
    }

    function renderOptions() {
      menu.innerHTML = "";
      getOptions().forEach((opt) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "custom-select-option";
        btn.dataset.value = opt.value;
        btn.textContent = t(opt.key);
        btn.classList.toggle("active", opt.value === state.sort);
        btn.addEventListener("click", () => {
          state.sort = opt.value;
          root.dataset.value = opt.value;
          label.textContent = t(opt.key);
          root.classList.remove("open");
          renderLog();
        });
        menu.appendChild(btn);
      });
      const current = getOptions().find((o) => o.value === state.sort) || getOptions()[0];
      label.textContent = t(current.key);
    }

    trigger.addEventListener("click", () => {
      root.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      if (!root.contains(e.target)) {
        root.classList.remove("open");
      }
    });

    root.append(trigger, menu);
    root.renderOptions = renderOptions;
    renderOptions();
  }

  async function renderLog() {
    const rows = getFilteredLogActions();
    ui.copyNicknamesBtn.classList.toggle("hidden", state.statMode !== "ban");

    if (!rows.length) {
      ui.logBody.innerHTML = "";
      ui.emptyLog.textContent = t("empty");
      ui.emptyLog.classList.remove("hidden");
      return;
    }
    ui.emptyLog.classList.add("hidden");

    const html = [];
    for (let i = 0; i < rows.length; i++) {
      const action = rows[i];
      const profile = (await ensureProfile(action)) || {};
      const status = getActionStatus(action);
      const targetVerify = profile.verified ? verifyBadgeHtml("verify-badge verify-badge--sm") : "";
      const modProfile = (await ensureModeratorProfile(action.moderator)) || {};
      const modName = action.moderator || t("dash");
      const modVerify = modProfile.verified ? verifyBadgeHtml("verify-badge verify-badge--sm") : "";
      const messageText = getActionMessage(action) || t("noMessage");
      const messageHtml = highlightSearchText(messageText, state.search);
      const nickHtml = highlightSearchText(action.target, state.search);
      html.push(`<tr>
        <td class="col-index">${i + 1}</td>
        <td class="col-date">${escapeHtml(formatDateTime(action.createdAt))}</td>
        <td class="col-nick"><span class="mod-pill"><span class="mod-pill-inner">${targetVerify}${nickHtml}</span></span></td>
        <td><span class="mod-pill"><span class="mod-pill-inner">${modVerify}${escapeHtml(modName)}</span></span></td>
        <td class="col-message" title="${escapeHtml(messageText)}">${messageHtml}</td>
        <td>${escapeHtml(formatDuration(action))}</td>
        <td><span class="status-pill ${statusClass(status)}">${escapeHtml(statusLabel(status))}</span></td>
      </tr>`);
    }
    ui.logBody.innerHTML = html.join("");
  }

  function renderChannelLine() {
    const verify = state.channelVerified
      ? `<span class="channel-verify" role="img" aria-label="Verified"></span>`
      : "";
    ui.channelLine.innerHTML = `${escapeHtml(t("channel"))}: ${verify}<strong>${escapeHtml(state.channel)}</strong>`;
  }

  function applyI18n() {
    document.documentElement.lang = state.lang;
    ui.pageTitle.textContent = t("pageTitle");
    renderChannelLine();
    ui.statTotalLabel.textContent = state.statMode === "ban" ? t("statTotalBans") : t("statTotalTimeouts");
    ui.statTotalHint.textContent = t("statForSession");
    ui.statModsLabel.textContent = t("statMods");
    ui.statModsHint.textContent = state.statMode === "ban" ? t("statModsHintBans") : t("statModsHint");
    ui.statAvgLabel.textContent = t("statAvg");
    ui.statAvgHint.textContent = state.statMode === "ban" ? t("statAvgHintBans") : t("statAvgHint");
    ui.statBestLabel.textContent = t("statBest");
    ui.toggleBans.textContent = t("toggleBans");
    ui.toggleTimeouts.textContent = t("toggleTimeouts");
    ui.chartTitle.textContent = t("chartTitle");
    buildChartLegend();
    ui.modsChartTitle.textContent = t("modsChartTitle");
    ui.modsChartLegend.textContent = state.statMode === "ban" ? t("modsLegendBans") : t("modsLegend");
    ui.logTitleText.textContent = t("logTitle");
    ui.searchInput.placeholder = t("searchPlaceholder");
    ui.copyNicknamesBtn.textContent = t("copyNicknames");
    ui.thDate.textContent = t("thDate");
    ui.thNickname.textContent = t("thNickname");
    ui.thModerator.textContent = t("thModerator");
    ui.thMessage.textContent = t("thMessage");
    ui.thDuration.textContent = t("thDuration");
    ui.thStatus.textContent = t("thStatus");
    ui.sessionMessagesLine.innerHTML = `${escapeHtml(t("sessionMessages"))} <strong id="msgCount">${state.messageCount}</strong>`;
    ui.openPlayerBtn.textContent = t("openPlayer");
    ui.switchChannelBtn.textContent = t("switchChannel");
    ui.switchModalTitle.textContent = t("switchTitle");
    ui.switchCancelBtn.textContent = t("switchCancel");
    ui.switchConfirmBtn.textContent = t("switchConfirm");
    ui.switchChannelInput.placeholder = t("switchPlaceholder");
    ui.langBtns.forEach((btn) => btn.classList.toggle("active", btn.dataset.lang === state.lang));
    ui.toggleBans.classList.toggle("active", state.statMode === "ban");
    ui.toggleTimeouts.classList.toggle("active", state.statMode === "timeout");
    if (ui.sortDropdown.renderOptions) {
      ui.sortDropdown.renderOptions();
    }
  }

  function updateSessionFooter() {
    const elapsed = Date.now() - state.sessionStartedAt;
    ui.sessionTimeLine.innerHTML = `${escapeHtml(t("sessionTime"))} <strong>${escapeHtml(formatSessionTime(elapsed))}</strong>`;
    const msgEl = document.getElementById("msgCount");
    if (msgEl) {
      msgEl.textContent = String(state.messageCount);
    }
  }

  function updateConnectionBadge() {
    const map = {
      connected: ["badge-ok", t("connected")],
      connecting: ["badge-warn", t("connecting")],
      channel_not_found: ["badge-warn", t("channelNotFound")]
    };
    const [cls, label] = map[state.connection] || map.connecting;
    ui.connectionBadge.className = `badge ${cls}`;
    ui.connectionBadge.textContent = label;
  }

  function render() {
    applyI18n();
    updateConnectionBadge();
    updateSessionFooter();

    const stats = computeStats();
    ui.statTotalValue.textContent = String(stats.total);
    ui.statModsValue.textContent = String(stats.modCount);
    ui.statAvgValue.textContent = stats.avg;
    ui.statBestValue.textContent = String(stats.bestCount);
    ui.statBestHint.textContent = stats.bestName;

    drawActivityChart();
    renderModeratorBars(stats.modList);
    renderLog();
  }

  function applyData(data) {
    if (!data) {
      return;
    }
    state.actions = data.actions || [];
    state.messageCount = data.messageCount || 0;
    state.minuteBuckets = data.minuteBuckets || [];
    state.topWords = data.topWords || [];
    if (data.startedAt) {
      state.sessionStartedAt = data.startedAt;
    }
  }

  function applyLiveData(data, options = {}) {
    const prevActionLen = state.actions.length;
    applyData(data);
    updateSessionFooter();

    const stats = computeStats();
    ui.statTotalValue.textContent = String(stats.total);
    ui.statModsValue.textContent = String(stats.modCount);
    ui.statAvgValue.textContent = stats.avg;
    ui.statBestValue.textContent = String(stats.bestCount);
    ui.statBestHint.textContent = stats.bestName;

    drawActivityChart();
    renderModeratorBars(stats.modList);

    if (options.full || (data.actions?.length || 0) !== prevActionLen) {
      renderLog();
    }
  }

  async function refreshData(full = false) {
    const res = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "KICKMOD_GET_CHANNEL_DATA", channel: state.channel }, resolve);
    });
    if (res?.ok && res.data) {
      if (full) {
        applyData(res.data);
        render();
      } else {
        applyLiveData(res.data);
      }
    }
  }

  function resetPlayerToDefault() {
    const dock = ui.playerDock;
    if (!dock) {
      return;
    }
    dock.style.left = "";
    dock.style.top = "";
    dock.style.right = "20px";
    dock.style.bottom = "88px";
    dock.classList.remove("is-positioned");
  }

  function showPlayerToast(text) {
    const toast = ui.playerToast;
    if (!toast) {
      return;
    }
    toast.textContent = text;
    toast.classList.remove("hidden");
    if (state.playerToastTimer) {
      clearTimeout(state.playerToastTimer);
    }
    state.playerToastTimer = setTimeout(() => {
      toast.classList.add("hidden");
      state.playerToastTimer = null;
    }, 3500);
  }

  function isPlayerOpen() {
    return ui.playerDock && !ui.playerDock.classList.contains("hidden");
  }

  function stopStreamWatch() {
    if (state.playerWatchTimer) {
      clearInterval(state.playerWatchTimer);
      state.playerWatchTimer = null;
    }
  }

  function updatePlayerTitle(viewerCount) {
    const title = ui.playerDockTitle;
    if (!title) {
      return;
    }
    const verify = state.channelVerified
      ? `<span class="channel-verify verify-badge--sm" role="img" aria-label="Verified"></span>`
      : "";
    const viewers =
      viewerCount != null ? ` | ${escapeHtml(t("playerOnline"))}: ${escapeHtml(formatViewerCount(viewerCount))}` : "";
    title.innerHTML = `${verify}<span>${escapeHtml(t("playerLive"))} -- ${escapeHtml(state.channel)}${viewers}</span>`;
  }

  function startStreamWatch() {
    stopStreamWatch();
    const pollLive = async () => {
      if (!isPlayerOpen()) {
        stopStreamWatch();
        return;
      }
      const res = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "KICKMOD_GET_LIVE_INFO", channel: state.channel }, resolve);
      });
      if (!res?.ok || !res.live) {
        closePlayer();
        return;
      }
      if (typeof res.verified === "boolean") {
        state.channelVerified = res.verified;
      }
      updatePlayerTitle(res.viewerCount);
    };

    pollLive();
    state.playerWatchTimer = setInterval(pollLive, 10000);
  }

  function destroyPlayer() {
    if (state.playerHls) {
      state.playerHls.destroy();
      state.playerHls = null;
    }
    if (ui.playerVideo) {
      ui.playerVideo.pause();
      ui.playerVideo.removeAttribute("src");
      ui.playerVideo.load();
    }
  }

  function closePlayer() {
    const dock = ui.playerDock;
    if (!dock) {
      return;
    }
    stopStreamWatch();
    dock.classList.add("hidden");
    dock.setAttribute("aria-hidden", "true");
    dock.classList.remove("is-dragging");
    destroyPlayer();
    resetPlayerToDefault();
  }

  function startPlayback(url) {
    destroyPlayer();
    const video = ui.playerVideo;
    ui.playerError.classList.add("hidden");
    ui.playerError.textContent = "";

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.play().catch(() => {});
      startStreamWatch();
      return;
    }

    if (window.Hls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      state.playerHls = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data?.fatal) {
          closePlayer();
        }
      });
      startStreamWatch();
    }
  }

  async function openPlayer() {
    const dock = ui.playerDock;
    if (!dock) {
      return;
    }

    const res = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "KICKMOD_FETCH_STREAM", channel: state.channel }, resolve);
    });

    if (!res?.ok || !res.url) {
      if (res?.error === "not_started") {
        showPlayerToast(t("playerNotStarted"));
      } else {
        showPlayerToast(t("playerNoUrl"));
      }
      return;
    }

    if (typeof res.verified === "boolean") {
      state.channelVerified = res.verified;
    }
    resetPlayerToDefault();
    dock.classList.remove("hidden");
    dock.setAttribute("aria-hidden", "false");
    updatePlayerTitle(res.viewerCount);
    startPlayback(res.url);
  }

  function initPlayerDrag() {
    const dock = ui.playerDock;
    const handle = ui.playerDockDrag;
    if (!dock || !handle || handle._kickmodDragBound) {
      return;
    }
    handle._kickmodDragBound = true;

    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const onMove = (clientX, clientY) => {
      const w = dock.offsetWidth;
      const h = dock.offsetHeight;
      const left = Math.max(8, Math.min(window.innerWidth - w - 8, clientX - offsetX));
      const top = Math.max(8, Math.min(window.innerHeight - h - 8, clientY - offsetY));
      dock.style.left = `${left}px`;
      dock.style.top = `${top}px`;
      dock.style.right = "auto";
      dock.style.bottom = "auto";
      dock.classList.add("is-positioned");
    };

    const endDrag = () => {
      if (!dragging) {
        return;
      }
      dragging = false;
      dock.classList.remove("is-dragging");
    };

    handle.addEventListener("mousedown", (e) => {
      if (e.button !== 0 || e.target.closest(".player-close")) {
        return;
      }
      dragging = true;
      dock.classList.add("is-dragging");
      const rect = dock.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!dragging) {
        return;
      }
      onMove(e.clientX, e.clientY);
    });

    document.addEventListener("mouseup", endDrag);

    handle.addEventListener(
      "touchstart",
      (e) => {
        if (e.target.closest(".player-close")) {
          return;
        }
        const touch = e.touches[0];
        dragging = true;
        dock.classList.add("is-dragging");
        const rect = dock.getBoundingClientRect();
        offsetX = touch.clientX - rect.left;
        offsetY = touch.clientY - rect.top;
      },
      { passive: true }
    );

    document.addEventListener(
      "touchmove",
      (e) => {
        if (!dragging) {
          return;
        }
        const touch = e.touches[0];
        onMove(touch.clientX, touch.clientY);
      },
      { passive: true }
    );

    document.addEventListener("touchend", endDrag);
  }

  async function togglePlayer() {
    if (isPlayerOpen()) {
      closePlayer();
      return;
    }
    await openPlayer();
  }

  function copyNicknames() {
    const names = [
      ...new Set(
        getFilteredLogActions()
          .filter((a) => a.actionType === "ban")
          .map((a) => a.target)
          .filter(Boolean)
      )
    ];
    navigator.clipboard.writeText(names.join(", ")).then(() => {
      const prev = ui.copyNicknamesBtn.textContent;
      ui.copyNicknamesBtn.textContent = t("copyDone");
      setTimeout(() => {
        ui.copyNicknamesBtn.textContent = prev;
      }, 1500);
    });
  }

  async function switchToChannel(raw) {
    const slug = normalizeKey(raw);
    if (!isLatinSlug(slug)) {
      ui.switchChannelError.textContent = t("switchInvalid");
      ui.switchChannelError.classList.remove("hidden");
      return;
    }
    const valid = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "KICKMOD_VALIDATE_CHANNEL", channel: slug }, resolve);
    });
    if (!valid?.ok) {
      ui.switchChannelError.textContent = t("switchNotFound");
      ui.switchChannelError.classList.remove("hidden");
      return;
    }
    location.href = `${chrome.runtime.getURL("pages/kick-statistics.html")}?channel=${encodeURIComponent(slug)}`;
  }

  async function init() {
    buildCustomSelect();

    const params = new URLSearchParams(location.search);
    state.channel = normalizeKey(params.get("channel"));

    const langData = await chrome.storage.local.get(LANG_KEY);
    state.lang = langData[LANG_KEY] === "ru" ? "ru" : langData[LANG_KEY] === "en" ? "en" : chrome.i18n.getUILanguage().toLowerCase().startsWith("ru") ? "ru" : "en";

    window.addEventListener("beforeunload", (e) => {
      e.preventDefault();
      e.returnValue = t("leaveConfirm");
      return e.returnValue;
    });

    if (!state.channel) {
      state.connection = "channel_not_found";
      render();
      return;
    }

    const track = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "KICKMOD_BEGIN_SESSION", channel: state.channel }, resolve);
    });

    if (track?.ok) {
      state.connection = "connected";
      state.channelVerified = Boolean(track.verified);
      if (track.startedAt) {
        state.sessionStartedAt = track.startedAt;
      }
    } else if (track?.error === "channel_not_found") {
      state.connection = "channel_not_found";
    }

    await refreshData(true);
    bindChartHover();
    initPlayerDrag();

    chrome.runtime.onMessage.addListener((msg) => {
      if (msg?.type !== "KICKMOD_SESSION_UPDATE") {
        return;
      }
      if (normalizeKey(msg.channel) !== state.channel) {
        return;
      }
      refreshData(false);
    });

    setInterval(() => refreshData(false), 2500);
    setInterval(() => {
      updateSessionFooter();
      if (!state.chartPoints.length) {
        drawActivityChart();
      }
    }, 1000);
  }

  ui.toggleBans.addEventListener("click", () => {
    state.statMode = "ban";
    render();
  });
  ui.toggleTimeouts.addEventListener("click", () => {
    state.statMode = "timeout";
    render();
  });
  ui.searchInput.addEventListener("input", () => {
    state.search = ui.searchInput.value;
    renderLog();
  });
  ui.copyNicknamesBtn.addEventListener("click", copyNicknames);
  ui.openPlayerBtn.addEventListener("click", togglePlayer);
  ui.closePlayerBtn?.addEventListener("click", () => closePlayer());
  ui.switchChannelBtn.addEventListener("click", () => {
    ui.switchModal.classList.remove("hidden");
    ui.switchChannelError.classList.add("hidden");
    ui.switchChannelInput.value = "";
    ui.switchChannelInput.focus();
  });
  ui.switchCancelBtn.addEventListener("click", () => ui.switchModal.classList.add("hidden"));
  ui.switchModal.querySelector("[data-close]").addEventListener("click", () => ui.switchModal.classList.add("hidden"));
  ui.switchChannelInput.addEventListener("input", () => {
    ui.switchChannelInput.value = ui.switchChannelInput.value.replace(/[^a-zA-Z0-9_.-]/g, "");
    ui.switchChannelError.classList.add("hidden");
  });
  ui.switchConfirmBtn.addEventListener("click", () => switchToChannel(ui.switchChannelInput.value));
  ui.switchChannelInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      switchToChannel(ui.switchChannelInput.value);
    }
  });
  ui.langBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      state.lang = btn.dataset.lang;
      await chrome.storage.local.set({ [LANG_KEY]: state.lang });
      render();
    });
  });

  window.addEventListener("resize", () => {
    drawActivityChart();
    hideChartTooltip();
  });
  init();
})();
