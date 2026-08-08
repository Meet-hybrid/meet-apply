/**
 * auth.js — login/logout.
 * Replaces the original OpenID staff authentication with a simple
 * username/password from the environment (.env → ADMIN_USERNAME/ADMIN_PASSWORD).
 */
const express = require('express');
const router = express.Router();
const { csrfProtect, csrfToken } = require('../middleware/csrf');

/** Only allow local redirect targets (no open redirect to external sites). */
function safeNext(raw) {
  if (typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//')) {
    return raw;
  }
  return '/calls';
}

router.get('/login', (req, res) => {
  if (req.session.username) return res.redirect(req.query.next || '/');
  res.render('login', { error: null, next: safeNext(req.query.next), csrfToken: csrfToken(req) });
});

router.post('/login', csrfProtect, (req, res) => {
  const { username, password } = req.body;
  const next = safeNext(req.body.next);
  const expectedUser = process.env.ADMIN_USERNAME || 'admin';
  const expectedPass = process.env.ADMIN_PASSWORD || 'meet';

  if (username === expectedUser && password === expectedPass) {
    req.session.username = username;
    return res.redirect(next);
  }
  res.status(401).render('login', {
    error: 'Invalid username or password',
    next,
    csrfToken: csrfToken(req),
  });
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
