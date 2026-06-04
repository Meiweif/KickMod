/* global KickModApi */

const KickModApi = {
  profileCache: new Map(),
  channelCache: new Map(),

  normalizeSlug(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/^@+/, "");
  },

  isLatinSlug(value) {
    const slug = this.normalizeSlug(value);
    return slug.length >= 2 && slug.length <= 32 && /^[a-z0-9][a-z0-9_.-]*$/.test(slug);
  },

  async fetchJson(url, useCredentials = false) {
    try {
      const res = await fetch(url, { credentials: useCredentials ? "include" : "omit" });
      if (!res.ok) {
        return null;
      }
      return await res.json();
    } catch {
      return null;
    }
  },

  async fetchChannelBundle(slug) {
    const key = this.normalizeSlug(slug);
    const cached = this.channelCache.get(key);
    if (cached && Date.now() - cached.fetchedAt < KickModConstants.PROFILE_CACHE_TTL_MS) {
      return cached.data;
    }

    const encoded = encodeURIComponent(key);
    const v2 = await this.fetchJson(`https://kick.com/api/v2/channels/${encoded}`, true);
    const v1 = v2 ? null : await this.fetchJson(`https://kick.com/api/v1/channels/${encoded}`, true);

    const data = {
      slug: key,
      chatroomId: v2?.chatroom?.id || v1?.chatroom?.id || null,
      verified: this.pickVerified(v2) || this.pickVerified(v1),
      displayName: v2?.user?.username || v2?.slug || v1?.user?.username || key,
      livestream: v2?.livestream || v1?.livestream || null
    };

    this.channelCache.set(key, { fetchedAt: Date.now(), data });
    return data;
  },

  async fetchChatroomId(slug) {
    const bundle = await this.fetchChannelBundle(slug);
    return bundle?.chatroomId || null;
  },

  async validateChannel(slug) {
    if (!this.isLatinSlug(slug)) {
      return { ok: false, error: "invalid_format" };
    }
    const bundle = await this.fetchChannelBundle(slug);
    if (!bundle?.chatroomId) {
      return { ok: false, error: "not_found" };
    }
    return { ok: true, slug: bundle.slug, verified: bundle.verified };
  },

  pickCreatedAt(data) {
    if (!data || typeof data !== "object") {
      return null;
    }
    const paths = [
      data.created_at,
      data.createdAt,
      data.date_registered,
      data.registered_at,
      data.user?.created_at,
      data.user?.createdAt,
      data.user?.date_registered,
      data.channel?.created_at,
      data.profile?.created_at
    ];
    for (const raw of paths) {
      if (!raw) {
        continue;
      }
      const ts = Date.parse(raw);
      if (Number.isFinite(ts)) {
        return ts;
      }
    }
    return null;
  },

  pickViewerCount(livestream) {
    if (!livestream || typeof livestream !== "object") {
      return null;
    }
    const candidates = [
      livestream.viewer_count,
      livestream.viewers,
      livestream.viewerCount,
      livestream.live_viewers,
      livestream.active_viewers,
      livestream.stream_viewers,
      livestream.concurrent_viewers
    ];
    for (const raw of candidates) {
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0) {
        return Math.floor(n);
      }
    }
    return null;
  },

  async getChannelLiveInfo(slug) {
    const key = this.normalizeSlug(slug);
    const bundle = await this.fetchChannelBundle(key);
    if (!bundle?.chatroomId) {
      return { ok: false, error: "not_found" };
    }
    const ls = bundle.livestream;
    const live = await this.isChannelLive(key);
    return {
      ok: true,
      live,
      verified: Boolean(bundle.verified),
      viewerCount: this.pickViewerCount(ls)
    };
  },

  pickVerified(data) {
    if (!data || typeof data !== "object") {
      return false;
    }
    return Boolean(
      data.verified ||
      data.verified_at ||
      data.is_verified ||
      data.user?.verified ||
      data.user?.verified_at ||
      data.channel?.verified
    );
  },

  deepFindM3u8(value, depth = 0) {
    if (depth > 12 || value == null) {
      return null;
    }
    if (typeof value === "string") {
      const s = value.trim();
      if (s.includes(".m3u8")) {
        return s;
      }
      return null;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = this.deepFindM3u8(item, depth + 1);
        if (found) {
          return found;
        }
      }
      return null;
    }
    if (typeof value === "object") {
      for (const v of Object.values(value)) {
        const found = this.deepFindM3u8(v, depth + 1);
        if (found) {
          return found;
        }
      }
    }
    return null;
  },

  extractPlaybackUrl(bundle) {
    if (!bundle) {
      return null;
    }
    const ls = bundle.livestream;
    if (!ls) {
      return null;
    }
    const direct = [
      ls.session_video?.url,
      ls.session_video?.src,
      ls.session_video?.playback_url,
      ls.playback_url,
      ls.video_url,
      ls.source,
      ls.stream?.url,
      ls.video?.url,
      ls.recording?.url
    ];
    for (const url of direct) {
      if (typeof url === "string" && url.includes(".m3u8")) {
        return url;
      }
    }
    return this.deepFindM3u8(ls);
  },

  async fetchStreamPlayback(slug) {
    const key = this.normalizeSlug(slug);
    this.channelCache.delete(key);

    const encoded = encodeURIComponent(key);
    const headers = { Accept: "application/json" };
    const v2 = await this.fetchJson(`https://kick.com/api/v2/channels/${encoded}`, true);
    const v1 = await this.fetchJson(`https://kick.com/api/v1/channels/${encoded}`, true);

    const channelBundle = await this.fetchChannelBundle(key);
    const bundle = {
      slug: key,
      livestream: channelBundle?.livestream || v2?.livestream || v1?.livestream || null,
      verified: channelBundle?.verified
    };

    let url = this.extractPlaybackUrl(bundle);

    if (!url && bundle.livestream) {
      url = this.deepFindM3u8(v2) || this.deepFindM3u8(v1);
    }

    if (!url) {
      try {
        const res = await fetch(`https://kick.com/${encoded}`, { credentials: "omit" });
        if (res.ok) {
          const html = await res.text();
          const m = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i);
          if (m) {
            url = m[0].replace(/\\u002F/g, "/").replace(/\\/g, "");
          }
        }
      } catch {
        /* ignore */
      }
    }

    if (!bundle.livestream) {
      return { ok: false, error: "not_started" };
    }
    if (!url) {
      return { ok: false, error: "no_url" };
    }
    return {
      ok: true,
      url,
      channel: key,
      verified: Boolean(bundle.verified),
      viewerCount: this.pickViewerCount(bundle.livestream)
    };
  },

  async isChannelLive(slug) {
    const key = this.normalizeSlug(slug);
    this.channelCache.delete(key);
    const bundle = await this.fetchChannelBundle(key);
    const ls = bundle?.livestream;
    if (!ls || typeof ls !== "object") {
      return false;
    }
    if (ls.is_live === false || ls.is_live === 0) {
      return false;
    }
    return Boolean(this.extractPlaybackUrl(bundle) || ls.id || ls.session_title || ls.slug);
  },

  async fetchUserProfile(username) {
    const slug = this.normalizeSlug(username);
    if (!slug || !KickModModeration.isValidKickUsername(slug)) {
      return { username: slug, createdAt: null, verified: false };
    }

    const cached = this.profileCache.get(slug);
    if (cached && Date.now() - cached.fetchedAt < KickModConstants.PROFILE_CACHE_TTL_MS) {
      return cached.profile;
    }

    const encoded = encodeURIComponent(slug);
    const [v2, v1, user, userV2] = await Promise.all([
      this.fetchJson(`https://kick.com/api/v2/channels/${encoded}`, true),
      this.fetchJson(`https://kick.com/api/v1/channels/${encoded}`, true),
      this.fetchJson(`https://kick.com/api/v1/users/${encoded}`, true),
      this.fetchJson(`https://kick.com/api/v2/users/${encoded}`, true)
    ]);

    const profile = {
      username: slug,
      createdAt:
        this.pickCreatedAt(user) ||
        this.pickCreatedAt(userV2) ||
        this.pickCreatedAt(v2?.user) ||
        this.pickCreatedAt(v1?.user) ||
        this.pickCreatedAt(v2) ||
        this.pickCreatedAt(v1),
      verified:
        this.pickVerified(v2) ||
        this.pickVerified(v1) ||
        this.pickVerified(user) ||
        this.pickVerified(userV2) ||
        this.pickVerified(v2?.user) ||
        this.pickVerified(v1?.user)
    };

    this.profileCache.set(slug, { fetchedAt: Date.now(), profile });
    return profile;
  }
};
