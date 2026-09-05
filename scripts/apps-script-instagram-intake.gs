/**
 * Paste this into Extensions > Apps Script on the Google Sheet that should
 * collect submissions, then Deploy > New deployment > Web app
 * (execute as "Me", access "Anyone"). Copy the resulting /exec URL into
 * NEXT_PUBLIC_IG_ENDPOINT.
 *
 * This re-validates the same Instagram-username rules as the client
 * (see lib/instagram.ts) so a request sent straight to this endpoint,
 * bypassing the web page entirely, still can't write arbitrary data.
 *
 * Two independent throttles guard against someone hammering this public
 * endpoint directly: a global per-minute cap (GLOBAL_RATE_LIMIT_PER_MINUTE)
 * blunts a flood of distinct fake usernames, and a per-username dedup
 * window (DUPLICATE_WINDOW_MS) stops the same handle being written
 * repeatedly. Neither can see the caller's IP — Apps Script Web Apps don't
 * expose it — so this is a soft cap on damage, not real abuse-proofing.
 */

var USERNAME_CHARSET_RE = /^[A-Za-z0-9._]{1,30}$/;
var RESERVED_PATHS = ['p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'direct', 'tv', 'about', 'developer', 'legal', 'privacy', 'terms'];

var GLOBAL_RATE_LIMIT_PER_MINUTE = 20;
var DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

function isValidUsername_(candidate) {
  if (typeof candidate !== 'string') return false;
  if (!USERNAME_CHARSET_RE.test(candidate)) return false;
  if (candidate.indexOf('.') === 0 || candidate.lastIndexOf('.') === candidate.length - 1) return false;
  if (candidate.indexOf('..') !== -1) return false;
  if (RESERVED_PATHS.indexOf(candidate.toLowerCase()) !== -1) return false;
  return true;
}

function jsonResponse_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

// Coarse per-minute bucket in the script cache; not perfectly precise
// (a burst can straddle two buckets) but cheap and dependency-free.
function isGlobalRateLimited_() {
  var cache = CacheService.getScriptCache();
  var bucket = 'rl_' + Math.floor(Date.now() / 60000);
  var current = parseInt(cache.get(bucket) || '0', 10);
  if (current >= GLOBAL_RATE_LIMIT_PER_MINUTE) return true;
  cache.put(bucket, String(current + 1), 90);
  return false;
}

// Scans backwards from the last row since only the most recent occurrence
// of a username matters for "was this submitted recently".
function wasRecentlySubmitted_(sheet, username) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  var numRows = lastRow - 1;
  var values = sheet.getRange(2, 1, numRows, 2).getValues(); // [Timestamp, Username]
  var cutoff = Date.now() - DUPLICATE_WINDOW_MS;

  for (var i = values.length - 1; i >= 0; i--) {
    if (values[i][1] === username) {
      var ts = values[i][0];
      var tsMs = ts instanceof Date ? ts.getTime() : new Date(ts).getTime();
      return tsMs >= cutoff;
    }
  }
  return false;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
  } catch (err) {
    return jsonResponse_({ ok: false, error: 'busy' });
  }

  try {
    var data = JSON.parse(e.postData.contents);
    var username = (data.username || '').toString().trim().toLowerCase();

    if (!isValidUsername_(username)) {
      return jsonResponse_({ ok: false, error: 'invalid_username' });
    }

    if (isGlobalRateLimited_()) {
      return jsonResponse_({ ok: false, error: 'rate_limited' });
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Username', 'Profile URL']);
    }

    if (wasRecentlySubmitted_(sheet, username)) {
      return jsonResponse_({ ok: false, error: 'duplicate' });
    }

    var profileUrl = 'https://instagram.com/' + username;
    sheet.appendRow([new Date(), username, profileUrl]);

    return jsonResponse_({ ok: true });
  } catch (err) {
    return jsonResponse_({ ok: false, error: 'bad_request' });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return jsonResponse_({ ok: true, info: 'Instagram intake endpoint is live. POST only.' });
}
