/**
 * csrf.js — minimal CSRF protection for state-changing routes
 * (the equivalent of the original Rails `protect_from_forgery`).
 *
 * Usage:
 *   - On GET requests, call csrfToken(req) to get (and mint) a token for forms.
 *   - On POST/PUT routes, wrap with csrfProtect to reject missing/mismatched
 *     tokens with 403.
 *
 * The public application forms (routes/apply.js) intentionally do NOT require a
 * token — like the original ApplyController, which skipped verify_authenticity_token.
 */
const crypto = require('node:crypto');

/** Return (and lazily mint) the CSRF token stored in this session. */
function csrfToken(req) {
  if (!req.session) return '';
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString('hex');
  }
  return req.session.csrfToken;
}

/** Reject state-changing requests without a valid token. */
function csrfProtect(req, res, next) {
  const expected = req.session && req.session.csrfToken;
  const received = req.body && req.body._csrf;
  if (expected && received && received === expected) return next();
  res.status(403).send('Invalid CSRF token (refresh the page and try again)');
}

/** Attach the token to res.locals so every view can render it as a hidden input. */
function csrfLocals(req, res, next) {
  res.locals.csrfToken = csrfToken(req);
  next();
}

module.exports = { csrfToken, csrfProtect, csrfLocals };
