/**
 * visualize.js — review summaries (original: app/controllers/visualize_controller.rb).
 *
 *   /visualize/:model/table    → table of applications with review summaries
 *   /visualize/:model/scatter  → scatterplot of review averages
 *   /visualize/:model/splom    → scatterplot matrix (all numeric column pairs)
 */
const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middleware/auth');
const Call = require('../models/call');

router.use(requireLogin);

function loadCall(req, res, next) {
  const call = Call.find(req.params.model);
  if (!call) return res.status(404).send('Unknown application type');
  req.call = call;
  req.appClass = call.appClass();
  req.reviewClass = call.reviewClass();
  if (!req.appClass) return res.status(404).send('Unknown application type');
  next();
}

/** Apps + summaries + numeric columns, or null when not reviewable/has reviews. */
function gather(req) {
  const { call, appClass, reviewClass } = req;
  if (!reviewClass) return null;
  const apps = appClass.list();
  const summaries = apps.map((app) => ({ app, summary: reviewClass.summarize(app) }));
  const numericCols = reviewClass.numericSummaryColumns();
  if (numericCols.length === 0) return null;
  return { apps, summaries, numericCols };
}

router.get('/:model/table', loadCall, (req, res) => {
  const data = gather(req);
  if (!data) return res.render('visualize/none', { call: req.call, currentUser: req.session.username });
  res.render('visualize/table', {
    call: req.call,
    appClass: req.appClass,
    reviewClass: req.reviewClass,
    ...data,
    currentUser: req.session.username,
  });
});

router.get('/:model/scatter', loadCall, (req, res) => {
  const data = gather(req);
  if (!data) return res.render('visualize/none', { call: req.call, currentUser: req.session.username });
  res.render('visualize/scatter', {
    call: req.call,
    appClass: req.appClass,
    reviewClass: req.reviewClass,
    ...data,
    currentUser: req.session.username,
  });
});

router.get('/:model/splom', loadCall, (req, res) => {
  const data = gather(req);
  if (!data) return res.render('visualize/none', { call: req.call, currentUser: req.session.username });
  res.render('visualize/splom', {
    call: req.call,
    appClass: req.appClass,
    reviewClass: req.reviewClass,
    ...data,
    currentUser: req.session.username,
  });
});

module.exports = router;
