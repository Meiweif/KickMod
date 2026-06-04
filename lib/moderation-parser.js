/* global KickModModeration */

const KickModModeration = (() => {
  function getByPath(obj, path) {
    if (!obj || typeof obj !== "object") {
      return null;
    }
    return path.split(".").reduce((acc, key) => {
      if (acc && typeof acc === "object" && key in acc) {
        return acc[key];
      }
      return null;
    }, obj);
  }

  function getFirstExistingValue(obj, paths) {
    for (const path of paths) {
      const value = getByPath(obj, path);
      if (value !== null && value !== undefined && value !== "") {
        return value;
      }
    }
    return null;
  }

  function pickUsername(source) {
    if (!source) {
      return null;
    }
    if (typeof source === "string") {
      const trimmed = source.trim().replace(/^@+/, "");
      return trimmed || null;
    }
    if (typeof source === "number") {
      return null;
    }
    if (typeof source.user === "object") {
      return pickUsername(source.user);
    }
    return (
      source.username ||
      source.name ||
      source.slug ||
      source.login ||
      source.displayname ||
      source.display_name ||
      null
    );
  }

  function normalizeUsernameKey(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/^@+/, "");
  }

  function isUnknownUsername(value) {
    const key = normalizeUsernameKey(value);
    return !key || key === "неизвестно" || key === "unknown" || key === "unknown_user";
  }

  function isValidKickUsername(value) {
    const name = String(value || "").trim().replace(/^@+/, "");
    if (!name || isUnknownUsername(name)) {
      return false;
    }
    if (name.length > 32) {
      return false;
    }
    return /^[\w.-]+$/.test(name);
  }

  function extractTargetUsername(input, moderatorName) {
    const modKey = normalizeUsernameKey(moderatorName);
    const tryValue = (value) => {
      const name = pickUsername(value) || (typeof value === "string" ? value : null);
      if (!isValidKickUsername(name)) {
        return null;
      }
      if (modKey && normalizeUsernameKey(name) === modKey) {
        return null;
      }
      return String(name).trim().replace(/^@+/, "");
    };

    const preferredObjects = [
      "timed_out_user",
      "banned_user",
      "target_user",
      "muted_user",
      "recipient",
      "subject",
      "victim",
      "affected_user",
      "chat_user",
      "user_timed_out",
      "user_banned",
      "metadata.timed_out_user",
      "metadata.banned_user",
      "metadata.target_user",
      "metadata.user",
      "data.timed_out_user",
      "data.banned_user",
      "data.target_user",
      "data.user"
    ];
    for (const path of preferredObjects) {
      const found = tryValue(getFirstExistingValue(input, [path]));
      if (found) {
        return found;
      }
    }

    const preferredNames = [
      "target_username",
      "timed_out_username",
      "banned_username",
      "muted_username",
      "recipient_username",
      "username",
      "login",
      "slug",
      "metadata.target_username",
      "metadata.username",
      "data.target_username",
      "data.username"
    ];
    for (const path of preferredNames) {
      const found = tryValue(getFirstExistingValue(input, [path]));
      if (found) {
        return found;
      }
    }

    const walkObject = (obj, depth) => {
      if (!obj || depth > 5 || typeof obj !== "object") {
        return null;
      }
      if (Array.isArray(obj)) {
        for (const item of obj) {
          const nested = walkObject(item, depth + 1);
          if (nested) {
            return nested;
          }
        }
        return null;
      }
      for (const [key, value] of Object.entries(obj)) {
        const keyLower = key.toLowerCase();
        if (/moderator|mod|actor|staff|sender|created_by|timed_out_by|banned_by/.test(keyLower)) {
          continue;
        }
        if (/user|target|banned|timed|muted|recipient|victim|subject|username|login|slug/.test(keyLower)) {
          const found = tryValue(value);
          if (found) {
            return found;
          }
        }
        if (value && typeof value === "object") {
          const nested = walkObject(value, depth + 1);
          if (nested) {
            return nested;
          }
        }
      }
      return null;
    };

    return walkObject(input, 0);
  }

  function collectModerationCandidates(parsedData) {
    const candidates = [];
    const seen = new Set();
    const walk = (obj, depth) => {
      if (!obj || depth > 6 || typeof obj !== "object") {
        return;
      }
      if (seen.has(obj)) {
        return;
      }
      seen.add(obj);
      candidates.push(obj);
      if (Array.isArray(obj)) {
        obj.forEach((item) => walk(item, depth + 1));
        return;
      }
      Object.values(obj).forEach((value) => walk(value, depth + 1));
    };
    walk(parsedData, 0);
    return candidates;
  }

  function parseDurationSeconds(input) {
    const sec = Number(
      getFirstExistingValue(input, [
        "duration_seconds",
        "timeout_seconds",
        "metadata.duration_seconds",
        "metadata.timeout_seconds",
        "data.duration_seconds",
        "data.timeout_seconds"
      ])
    );
    if (Number.isFinite(sec) && sec > 0) {
      return sec;
    }

    const ms = Number(
      getFirstExistingValue(input, [
        "duration_ms",
        "timeout_ms",
        "metadata.duration_ms",
        "data.duration_ms"
      ])
    );
    if (Number.isFinite(ms) && ms > 0) {
      return Math.round(ms / 1000);
    }

    const minutes = Number(
      getFirstExistingValue(input, [
        "duration_minutes",
        "timeout_minutes",
        "metadata.duration_minutes",
        "data.duration_minutes"
      ])
    );
    if (Number.isFinite(minutes) && minutes > 0) {
      return Math.round(minutes * 60);
    }

    const rawDuration = Number(
      getFirstExistingValue(input, ["duration", "metadata.duration", "data.duration"])
    );
    if (Number.isFinite(rawDuration) && rawDuration > 0) {
      return Math.round(rawDuration * 60);
    }

    const untilTs = Number(
      getFirstExistingValue(input, [
        "expires_at",
        "timeout_expires_at",
        "metadata.expires_at",
        "data.expires_at"
      ])
    );
    if (Number.isFinite(untilTs) && untilTs > 0) {
      const nowSec = Math.floor(Date.now() / 1000);
      const diff = untilTs - nowSec;
      if (diff > 0) {
        return diff;
      }
    }

    return null;
  }

  function isValidKickUsername(value) {
    const name = String(value || "").trim().replace(/^@+/, "");
    if (!name || isUnknownUsername(name)) {
      return false;
    }
    if (name.length > 32) {
      return false;
    }
    return /^[\w.-]+$/.test(name);
  }

  function isStructuredModEvent(eventName) {
    const ev = String(eventName || "").toLowerCase();
    if (!ev || ev.startsWith("pusher:")) {
      return false;
    }
    return /ban|timeout|timed|mute|unban|mod|staff|blocked|removed/.test(ev);
  }

  function scanModerationObject(input, eventName) {
    if (!input || typeof input !== "object") {
      return null;
    }

    const rawEvent = String(eventName || "").toLowerCase();
    const actionField = String(
      input.action || input.moderation_action || input.type || input.event || ""
    ).toLowerCase();

    if (!isStructuredModEvent(rawEvent) && !actionField) {
      return null;
    }

    let actionType = null;
    if (
      actionField.includes("unban") ||
      actionField.includes("unbanned") ||
      actionField.includes("unblocked") ||
      rawEvent.includes("unban")
    ) {
      actionType = "unban";
    } else if (
      actionField.includes("timeout") ||
      actionField.includes("timed") ||
      actionField.includes("mute") ||
      rawEvent.includes("timeout") ||
      rawEvent.includes("timed") ||
      rawEvent.includes("muted")
    ) {
      actionType = "timeout";
    } else if (actionField.includes("ban") || (rawEvent.includes("ban") && !rawEvent.includes("unban"))) {
      actionType = "ban";
    }

    if (!actionType) {
      return null;
    }

    const durationSeconds = parseDurationSeconds(input);
    if (
      actionType === "ban" &&
      Number.isFinite(durationSeconds) &&
      durationSeconds > 0 &&
      durationSeconds < KickModConstants.PERMANENT_BAN_THRESHOLD_SEC
    ) {
      actionType = "timeout";
    }

    const moderator =
      pickUsername(
        getFirstExistingValue(input, [
          "moderator",
          "mod",
          "actor",
          "staff",
          "sender",
          "created_by",
          "banned_by",
          "timed_out_by",
          "metadata.moderator",
          "metadata.actor",
          "metadata.created_by",
          "data.moderator",
          "data.actor",
          "data.created_by"
        ])
      ) ||
      getFirstExistingValue(input, [
        "moderator_username",
        "mod_username",
        "actor_username",
        "created_by_username",
        "banned_by_username",
        "timed_out_by_username",
        "metadata.moderator_username",
        "metadata.actor_username",
        "data.moderator_username"
      ]);

    const target = extractTargetUsername(input, moderator);

    if (!isValidKickUsername(target)) {
      return null;
    }
    if (moderator && !isUnknownUsername(moderator) && !isValidKickUsername(moderator)) {
      return null;
    }

    const lastMessage =
      input.last_message ||
      input.metadata?.last_message ||
      input.metadata?.message ||
      input.data?.last_message ||
      null;

    return {
      actionType,
      moderator: moderator || "unknown",
      target: target || "unknown",
      lastMessage: typeof lastMessage === "string" ? lastMessage : null,
      durationSeconds,
      sourceEvent: eventName || "unknown_event"
    };
  }

  function isChatEventName(eventName) {
    const ev = String(eventName || "").toLowerCase();
    if (!ev || ev.startsWith("pusher:")) {
      return false;
    }
    if (/ban|timeout|timed|mute|unban|mod|staff|blocked/.test(ev)) {
      return false;
    }
    return /chatmessage|chat\.message|message\.sent|new\.message|chat_message|messageevent|sent_message/.test(ev) ||
      (ev.includes("message") && ev.includes("chat"));
  }

  function scanChatMessageObject(input, eventName) {
    if (!input || typeof input !== "object") {
      return null;
    }
    const eventLower = String(eventName || "").toLowerCase();
    if (
      eventLower.includes("ban") ||
      eventLower.includes("timeout") ||
      eventLower.includes("mute") ||
      eventLower.includes("unban")
    ) {
      return null;
    }

    const content = getFirstExistingValue(input, [
      "content",
      "message",
      "text",
      "chat_message.content",
      "chat_message.message",
      "chat_message.text",
      "data.content",
      "data.message",
      "data.text",
      "data.chat_message.content",
      "metadata.content",
      "metadata.message"
    ]);
    const sender = pickUsername(
      getFirstExistingValue(input, [
        "sender",
        "user",
        "author",
        "chat_message.sender",
        "chat_message.user",
        "data.sender",
        "data.user",
        "data.author",
        "data.chat_message.sender",
        "metadata.sender"
      ])
    );
    if (typeof content !== "string" || !content.trim() || !sender) {
      return null;
    }
    if (!isValidKickUsername(sender)) {
      return null;
    }
    return { sender, content: String(content).trim() };
  }

  function parsePayload(data) {
    if (typeof data === "string") {
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    }
    return data;
  }

  function collectChatCandidates(parsedData) {
    const list = [];
    const seen = new Set();
    const walk = (obj, depth) => {
      if (!obj || depth > 5 || typeof obj !== "object") {
        return;
      }
      if (seen.has(obj)) {
        return;
      }
      seen.add(obj);
      list.push(obj);
      if (Array.isArray(obj)) {
        obj.forEach((item) => walk(item, depth + 1));
        return;
      }
      Object.values(obj).forEach((value) => walk(value, depth + 1));
    };
    walk(parsedData, 0);
    return list;
  }

  function extractFromWsMessage(msg) {
    const parsedData = parsePayload(msg?.data);
    const eventName = String(msg?.event || "");
    const eventLower = eventName.toLowerCase();
    const isModEvent = /ban|timeout|timed|mute|unban|mod|staff|blocked/.test(eventLower);
    const isChatEvent = isChatEventName(eventName);

    if (isModEvent && parsedData && typeof parsedData === "object") {
      const candidates = [parsedData];
      if (parsedData.data && typeof parsedData.data === "object") {
        candidates.push(parsedData.data);
      }
      if (Array.isArray(parsedData.events)) {
        parsedData.events.forEach((item) => candidates.push(item));
      }
      candidates.push(...collectModerationCandidates(parsedData));

      for (const candidate of candidates) {
        const action = scanModerationObject(candidate, eventName);
        if (action) {
          return { kind: "moderation", data: action };
        }
      }
    }

    if (parsedData && typeof parsedData === "object" && (isChatEvent || !isModEvent)) {
      const chatCandidates = collectChatCandidates(parsedData);
      for (const candidate of chatCandidates) {
        const chat = scanChatMessageObject(candidate, eventName);
        if (chat) {
          return { kind: "chat", data: chat };
        }
      }
    }

    return null;
  }

  return {
    extractFromWsMessage,
    normalizeUsernameKey,
    isUnknownUsername,
    isValidKickUsername
  };
})();
