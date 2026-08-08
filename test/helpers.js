/**
 * test/helpers.js — shared test setup.
 *
 * Each test file runs in its own node:test process. We point DB_PATH at a
 * throwaway database file, require the app fresh, and clean up on exit.
 *
 * NOTE: DB_PATH must be set BEFORE requiring config/db (which opens the DB
 * at require time), so call setupTestDb() at the very top of a test file.
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

/** Point DB_PATH at a fresh temp file and return its path. Call before requires. */
function setupTestDb() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'meet-apply-test-'));
  const dbPath = path.join(dir, 'test.db');
  process.env.DB_PATH = dbPath;
  return { dir, dbPath };
}

/** Remove the temp dir at the end of the test file. */
function teardownTestDb(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

/**
 * Simple cookie jar for fetch() — captures Set-Cookie headers and replays
 * them on subsequent requests (enough for express-session in tests).
 */
function createCookieJar() {
  let cookies = new Map();
  return {
    /** Apply stored cookies to a fetch() options object. */
    withCookies(opts = {}) {
      const headers = { ...(opts.headers || {}) };
      if (cookies.size > 0) {
        headers.Cookie = [...cookies.entries()]
          .map(([k, v]) => `${k}=${v}`)
          .join('; ');
      }
      return { ...opts, headers };
    },
    /** Capture set-cookie headers from a fetch() response. */
    store(res) {
      const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
      for (const line of setCookies) {
        const [pair] = line.split(';');
        const eq = pair.indexOf('=');
        if (eq > 0) {
          const key = pair.slice(0, eq).trim();
          const value = pair.slice(eq + 1).trim();
          if (value === '') cookies.delete(key);
          else cookies.set(key, value);
        }
      }
      return res;
    },
  };
}

/** Convenience: GET a URL through the cookie jar. */
function get(base, jar, urlPath, opts) {
  return fetch(base + urlPath, jar.withCookies(opts)).then((r) => jar.store(r));
}

/** Convenience: POST a URL-encoded form through the cookie jar. */
function postForm(base, jar, urlPath, fields, opts) {
  const body = new URLSearchParams(fields).toString();
  return fetch(base + urlPath, jar.withCookies({ method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, ...opts })).then((r) => jar.store(r));
}

/** Extract the CSRF token from a rendered page (hidden input _csrf). */
function csrfFromHtml(html) {
  const m = html.match(/name="_csrf" value="([^"]+)"/);
  return m ? m[1] : null;
}

module.exports = { setupTestDb, teardownTestDb, createCookieJar, get, postForm, csrfFromHtml };
