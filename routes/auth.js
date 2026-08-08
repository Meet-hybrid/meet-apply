/**
 * auth.js — login/logout.
 * Replaces the original OpenID staff authentication with a simple
 * username/password from the environment (.env → ADMIN_USERNAME/ADMIN_PASSWORD).
 */
const express = require('express');
const router = express.Router();

router.get('/login', (req, res) => {
  if (req.session.username) return res.redirect(req.query.next || '/');
  res.render('login', { error: null, next: req.query.next || '/calls' });
});

router.post('/login', (req, res) => {
  const { username, password, next } = req.body;
  const expectedUser = process.env.ADMIN_USERNAME || 'admin';
  const expectedPass = process.env.ADMIN_PASSWORD || 'meet';

  if (username === expectedUser && password === expectedPass) {
    req.session.username = username;
    return res.redirect(next || '/calls');
  }
  res.status(401).render('login', {
    error: 'Invalid username or password',
    next: next || '/calls',
  });
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
