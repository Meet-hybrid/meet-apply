/**
 * review.js — application reviews (original: app/controllers/review_controller.rb).
 *
 *   GET  /review/:model                → list submitted applications
 *   GET  /review/:model/:app_id        → show app (+ review form if reviewable)
 *   POST /review/:model/:app_id        → create/update the reviewer's review
 *   GET  /review/:model/:app_id/download/:column → download an uploaded resume
 */
const express = require('express');
const path = require('node:path');
const fs = require('node:fs');
const router = express.Router();
const { requireLogin } = require('../middleware/auth');
const Call = require('../models/call');

router.use(requireLogin);

const uploadDir = path.join(__dirname, '..', 'uploads');

function loadCall(req, res, next) {
  const call = Call.find(req.params.model);
  if (!call) return res.status(404).send('Unknown application type');
  req.call = call;
  req.appClass = call.appClass();
  req.reviewClass = call.reviewClass();
  if (!req.appClass) return res.status(404).send('Unknown application type');
  next();
}

/** Deterministic shuffle for review order (original: srand on username bytes). */
function seededShuffle(arr, seedText) {
  let seed = 0x100;
  for (const ch of seedText) seed ^= ch.charCodeAt(0);
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

router.get('/:model', loadCall, (req, res) => {
  const { call, appClass, reviewClass } = req;
  let apps = appClass.list();
  if (call.reviewable && reviewClass) {
    apps = seededShuffle(apps, req.session.username);
  }
  const reviewsByApp =
    reviewClass &&
    Object.fromEntries(
      reviewClass.forAppByReviewer
        ? []
        : apps
            .map((app) => [
              app.id,
              reviewClass
                .forApp(app.id)
                .filter((r) => r.app_reviewer_id === req.session.username),
            ])
    );

  res.render('review/index', {
    call,
    appClass,
    apps,
    reviewsByApp,
    currentUser: req.session.username,
  });
});

router.get('/:model/:app_id', loadCall, (req, res) => {
  const { call, appClass, reviewClass } = req;
  const app = appClass.find(Number(req.params.app_id));
  if (!app) return res.status(404).send('Application not found');

  if (call.reviewable && reviewClass) {
    // Reviews open — show the review form
    const review = reviewClass.findOrInit(req.session.username, app.id);
    return res.render('review/edit', {
      call,
      appClass,
      app,
      review,
      reviewClass,
      errors: {},
      currentUser: req.session.username,
    });
  }

  if (reviewClass) {
    // Reviews closed — show summary
    const summary = reviewClass.summarize(app);
    return res.render('review/show', {
      call,
      appClass,
      app,
      summary,
      reviewClass,
      currentUser: req.session.username,
    });
  }

  // No review model — just show the app
  res.render('review/show', {
    call,
    appClass,
    app,
    summary: null,
    reviewClass: null,
    currentUser: req.session.username,
  });
});

router.post('/:model/:app_id', loadCall, (req, res) => {
  const { call, appClass, reviewClass } = req;
  const app = appClass.find(Number(req.params.app_id));
  if (!app) return res.status(404).send('Application not found');
  if (!call.reviewable || !reviewClass) {
    return res.status(403).render('review/noreview', { call });
  }

  const data = reviewClass.coerce({ ...req.body });
  data.app_reviewer_id = req.session.username;
  data.app_id = app.id;

  const errors = reviewClass.validate({ ...data });
  if (Object.keys(errors).length > 0) {
    return res.status(422).render('review/edit', {
      call,
      appClass,
      app,
      review: { ...data },
      reviewClass,
      errors,
      currentUser: req.session.username,
    });
  }

  reviewClass.save(data);
  res.redirect(`/review/${call.id}`);
});

router.get('/:model/:app_id/download/:column', loadCall, (req, res) => {
  const app = req.appClass.find(Number(req.params.app_id));
  if (!app) return res.status(404).send('Application not found');
  const column = req.params.column;
  const meta = req.appClass.columns.find((c) => c.field_name === column || c.name === `${column}_file_name`);
  const fileName = meta ? app[`${column}_file_name`] || app[column] : null;
  if (!fileName) return res.status(404).render('review/download_bad', { call: req.call });

  const filePath = path.join(uploadDir, path.basename(fileName));
  if (!fs.existsSync(filePath)) return res.status(404).render('review/download_bad', { call: req.call });
  res.download(filePath, fileName.replace(/^\d+-/, ''));
});

module.exports = router;
