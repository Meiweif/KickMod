/* global KickModConstants */
const KickModConstants = {
  WS_URL: "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=7.6.0&flash=false",
  PUSHER_KEY: "32cbd69e4b950bf97679",
  LANG_KEY: "kickmod:lang",
  PERMANENT_BAN_THRESHOLD_SEC: 10 * 365 * 24 * 3600,
  PROFILE_CACHE_TTL_MS: 10 * 60 * 1000
};

if (typeof module !== "undefined") {
  module.exports = KickModConstants;
}
