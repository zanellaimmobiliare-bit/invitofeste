/**
 * Paste this into Extensions > Apps Script on the Google Sheet that should
 * collect submissions, then Deploy > New deployment > Web app
 * (execute as "Me", access "Anyone"). Copy the resulting /exec URL into
 * NEXT_PUBLIC_IG_ENDPOINT.
 *
 * This re-validates the same Instagram-username rules as the client
 * (see lib/instagram.ts) so a request sent straight to this endpoint,
 * bypassing the web page entirely, still can't write arbitrary data.
 */

var USERNAME_CHARSET_RE = /^[A-Za-z0-9._]{1,30}$/;
var RESERVED_PATHS = ['p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'direct', 'tv', 'about', 'developer', 'legal', 'privacy', 'terms'];

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

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var username = (data.username || '').toString().trim().toLowerCase();

    if (!isValidUsername_(username)) {
      return jsonResponse_({ ok: false, error: 'invalid_username' });
    }

    var profileUrl = 'https://instagram.com/' + username;
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Username', 'Profile URL']);
    }

    sheet.appendRow([new Date(), username, profileUrl]);

    return jsonResponse_({ ok: true });
  } catch (err) {
    return jsonResponse_({ ok: false, error: 'bad_request' });
  }
}

function doGet() {
  return jsonResponse_({ ok: true, info: 'Instagram intake endpoint is live. POST only.' });
}
