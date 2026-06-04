/* global KickModTracker, KickModModeration, KickModApi, KickModConstants */

const KickModTracker = (() => {
  const wsSessions = new Map();
  const pageSessions = new Map();

  function getWsSession(slug) {
    const key = KickModApi.normalizeSlug(slug);
    if (!wsSessions.has(key)) {
      wsSessions.set(key, {
        slug: key,
        ws: null,
        chatroomId: null,
        reconnectTimer: null,
        reconnectAttempts: 0,
        isManualClose: false,
        userLastMessages: {},
        loading: false
      });
    }
    return wsSessions.get(key);
  }

  function getPageSession(slug) {
    const key = KickModApi.normalizeSlug(slug);
    if (!pageSessions.has(key)) {
      pageSessions.set(key, createPageSession());
    }
    return pageSessions.get(key);
  }

  function createPageSession() {
    return {
      startedAt: Date.now(),
      actions: [],
      messageCount: 0,
      minuteBuckets: new Map(),
      wordMeta: new Map()
    };
  }

  function notifySessionUpdate(slug) {
    chrome.runtime.sendMessage({ type: "KICKMOD_SESSION_UPDATE", channel: slug }).catch(() => {});
  }

  function recordChatWords(page, sender, content) {
    const text = String(content || "");
    const senderKey = KickModModeration.normalizeUsernameKey(sender);
    if (!text.trim() || !senderKey) {
      return;
    }

    const seenInMessage = new Set();
    const re = /[\p{L}\p{N}]{2,}/gu;
    let match;
    while ((match = re.exec(text)) !== null) {
      const display = match[0];
      const key = display.toLowerCase();
      if (key.length < 2 || key.length > 32 || seenInMessage.has(key)) {
        continue;
      }
      seenInMessage.add(key);

      const meta = page.wordMeta.get(key) || { display, totalHits: 0 };
      meta.totalHits += 1;
      page.wordMeta.set(key, meta);
    }
  }

  function getTopWords(page, limit = 5) {
    return [...page.wordMeta.values()]
      .filter((item) => item.totalHits >= 2)
      .sort((a, b) => b.totalHits - a.totalHits)
      .slice(0, limit)
      .map((item) => ({ word: item.display, count: item.totalHits }));
  }

  function minuteKey(ts, startedAt) {
    const minute = Math.floor((ts - startedAt) / 60000);
    return String(Math.max(0, minute));
  }

  function bumpMinuteBucket(page, ts, field) {
    const key = minuteKey(ts, page.startedAt);
    if (!page.minuteBuckets.has(key)) {
      page.minuteBuckets.set(key, { bans: 0, timeouts: 0, messages: 0 });
    }
    page.minuteBuckets.get(key)[field] += 1;
  }

  function beginPageSession(slug) {
    const key = KickModApi.normalizeSlug(slug);
    pageSessions.set(key, createPageSession());
    return { ok: true, startedAt: pageSessions.get(key).startedAt };
  }

  function subscribeToChatroom(ws, chatroomId) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }
    [`chatrooms.${chatroomId}.v2`, `chatrooms.${chatroomId}`].forEach((channelName) => {
      ws.send(
        JSON.stringify({
          event: "pusher:subscribe",
          data: { channel: channelName }
        })
      );
    });
  }

  function addAction(page, action) {
    const normalizedTarget = KickModModeration.normalizeUsernameKey(action.target);
    if (!KickModModeration.isValidKickUsername(action.target)) {
      return false;
    }

    if (action.actionType === "unban") {
      const idx = [...page.actions]
        .map((item, index) => ({ item, index }))
        .reverse()
        .find(
          ({ item }) =>
            (item.actionType === "ban" || item.actionType === "timeout") &&
            KickModModeration.normalizeUsernameKey(item.target) === normalizedTarget
        )?.index;

      if (typeof idx === "number") {
        const existing = page.actions[idx];
        page.actions[idx] = {
          ...existing,
          actionType: "unban",
          unbannedAt: Date.now(),
          moderator:
            action.moderator && !KickModModeration.isUnknownUsername(action.moderator)
              ? action.moderator
              : existing.moderator,
          durationSeconds: null,
          lastMessage: action.lastMessage || existing.lastMessage || null
        };
        return true;
      }
      return false;
    }

    const existingIdx = [...page.actions]
      .map((item, index) => ({ item, index }))
      .reverse()
      .find(({ item }) => KickModModeration.normalizeUsernameKey(item.target) === normalizedTarget)?.index;

    if (typeof existingIdx === "number") {
      const existing = page.actions[existingIdx];
      page.actions[existingIdx] = {
        ...existing,
        actionType: action.actionType,
        moderator:
          action.moderator && !KickModModeration.isUnknownUsername(action.moderator)
            ? action.moderator
            : existing.moderator,
        durationSeconds: action.durationSeconds,
        lastMessage: action.lastMessage || existing.lastMessage || null,
        createdAt: Date.now()
      };
      if (action.actionType === "ban") {
        bumpMinuteBucket(page, Date.now(), "bans");
      } else if (action.actionType === "timeout") {
        bumpMinuteBucket(page, Date.now(), "timeouts");
      }
      return true;
    }

    const now = Date.now();
    const record = {
      id: `${now}-${Math.random().toString(16).slice(2)}`,
      createdAt: now,
      ...action
    };

    const exists = page.actions.some(
      (item) =>
        item.actionType === record.actionType &&
        item.moderator === record.moderator &&
        item.target === record.target &&
        Math.abs(item.createdAt - record.createdAt) < 5000
    );
    if (exists) {
      return false;
    }

    page.actions.push(record);
    if (action.actionType === "ban") {
      bumpMinuteBucket(page, now, "bans");
    } else if (action.actionType === "timeout") {
      bumpMinuteBucket(page, now, "timeouts");
    }

    const targetKey = KickModModeration.normalizeUsernameKey(record.target);
    KickModApi.fetchUserProfile(record.target).then((profile) => {
      const idx = page.actions.findIndex(
        (a) => KickModModeration.normalizeUsernameKey(a.target) === targetKey
      );
      if (idx >= 0) {
        page.actions[idx] = { ...page.actions[idx], profile };
      }
    });

    return true;
  }

  function scheduleReconnect(slug, chatroomId) {
    const session = getWsSession(slug);
    if (session.reconnectTimer) {
      clearTimeout(session.reconnectTimer);
    }
    session.reconnectAttempts += 1;
    const delay = Math.min(30000, 1000 * Math.pow(1.5, session.reconnectAttempts));
    session.reconnectTimer = setTimeout(() => {
      session.reconnectTimer = null;
      if (!session.isManualClose && chatroomId) {
        connectSocket(slug, chatroomId);
      }
    }, delay);
  }

  function connectSocket(slug, chatroomId) {
    const session = getWsSession(slug);
    session.isManualClose = false;
    session.chatroomId = chatroomId;

    if (session.ws) {
      session.ws.onopen = null;
      session.ws.onclose = null;
      session.ws.onmessage = null;
      session.ws.onerror = null;
      try {
        session.ws.close();
      } catch {
        /* ignore */
      }
      session.ws = null;
    }

    const ws = new WebSocket(KickModConstants.WS_URL);
    session.ws = ws;

    ws.onopen = () => {
      session.reconnectAttempts = 0;
      subscribeToChatroom(ws, chatroomId);
    };

    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === "pusher:ping") {
          ws.send(JSON.stringify({ event: "pusher:pong", data: {} }));
          return;
        }
        if (msg.event === "pusher:connection_established") {
          subscribeToChatroom(ws, chatroomId);
          return;
        }

        const parsed = KickModModeration.extractFromWsMessage(msg);
        if (!parsed) {
          return;
        }

        const page = pageSessions.get(slug);
        if (!page) {
          return;
        }

        if (parsed.kind === "chat") {
          const senderKey = KickModModeration.normalizeUsernameKey(parsed.data.sender);
          session.userLastMessages[senderKey] = parsed.data.content;
          page.messageCount += 1;
          bumpMinuteBucket(page, Date.now(), "messages");
          recordChatWords(page, parsed.data.sender, parsed.data.content);
          notifySessionUpdate(slug);
          return;
        }

        const moderation = parsed.data;
        const targetKey = KickModModeration.normalizeUsernameKey(moderation.target);
        if (targetKey && session.userLastMessages[targetKey]) {
          moderation.lastMessage = session.userLastMessages[targetKey];
        }

        if (addAction(page, moderation)) {
          notifySessionUpdate(slug);
        }
      } catch {
        /* ignore */
      }
    };

    ws.onclose = () => {
      session.ws = null;
      if (!session.isManualClose && session.chatroomId) {
        scheduleReconnect(slug, session.chatroomId);
      }
    };
  }

  async function startTracking(slug) {
    const normalized = KickModApi.normalizeSlug(slug);
    if (!normalized) {
      return { ok: false, error: "invalid_channel" };
    }

    const session = getWsSession(normalized);
    if (session.loading) {
      return { ok: true, slug: normalized };
    }
    session.loading = true;

    const bundle = await KickModApi.fetchChannelBundle(normalized);
    const chatroomId = bundle?.chatroomId;
    session.loading = false;

    if (!chatroomId) {
      return { ok: false, error: "channel_not_found", slug: normalized };
    }

    if (!session.ws || session.ws.readyState === WebSocket.CLOSED) {
      connectSocket(normalized, chatroomId);
    }

    return {
      ok: true,
      slug: normalized,
      chatroomId,
      verified: Boolean(bundle?.verified)
    };
  }

  function getChannelData(slug) {
    const page = pageSessions.get(KickModApi.normalizeSlug(slug));
    if (!page) {
      return {
        slug: KickModApi.normalizeSlug(slug),
        actions: [],
        messageCount: 0,
        startedAt: null,
        minuteBuckets: [],
        topWords: [],
        updatedAt: Date.now()
      };
    }

    const buckets = [...page.minuteBuckets.entries()]
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([minute, data]) => ({ minute: Number(minute), ...data }));

    return {
      slug: KickModApi.normalizeSlug(slug),
      actions: page.actions,
      messageCount: page.messageCount,
      startedAt: page.startedAt,
      minuteBuckets: buckets,
      topWords: getTopWords(page),
      updatedAt: Date.now()
    };
  }

  return {
    startTracking,
    beginPageSession,
    getChannelData,
    getPageSession
  };
})();
