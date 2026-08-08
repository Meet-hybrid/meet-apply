/**
 * calls.js — admin: list & edit calls for applications (original: calls_controller.rb).
 * All routes require login.
 */
const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middleware/auth');
const { csrfProtect, csrfToken } = require('../middleware/csrf');
const Call = require('../models/call');

router.use(requireLogin);

router.get('/', (req, res) => {
  res.render('calls/index', {
    calls: Call.all(),
    currentUser: req.session.username,
  });
});

router.get('/:id/edit', (req, res) => {
  const call = Call.find(req.params.id);
  if (!call) return res.status(404).send('Unknown call');
  res.render('calls/edit', { call, currentUser: req.session.username, csrfToken: csrfToken(req) });
});

router.post('/:id', csrfProtect, (req, res) => {
  const call = Call.find(req.params.id);
  if (!call) return res.status(404).send('Unknown call');
  const data = req.body;
  Call.update(call.id, {
    open: data.open === '1' || data.open === 'on',
    reviewable: data.reviewable === '1' || data.reviewable === 'on',
    title: data.title,
    description: data.description,
    deadline: data.deadline || null,
    identity_columns: data.identity_columns,
  });
  res.redirect('/calls');
});

module.exports = router;
