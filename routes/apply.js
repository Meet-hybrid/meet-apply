/**
 * apply.js — public application forms (original: app/controllers/apply_controller.rb).
 *
 *   GET  /:model            → render the application form (or "call closed")
 *   POST /:model            → validate & save (or preview without saving)
 *   GET  /:model?preview=1  → show the form (no save)
 *   GET  /:model?late=1     → requires login (original: staff-added late apps)
 *
 * Resume uploads are handled with multer and stored in uploads/ (original: S3).
 */
const express = require('express');
const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs');
const router = express.Router();
const Call = require('../models/call');
const { buildFields, yearOptions } = require('../lib/form_fields');

const uploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});
const upload = multer({ storage });

/** Load the call + app model for the :model param; 404s otherwise. */
function loadCall(req, res, next) {
  const model = req.params.model;
  const call = Call.find(model);
  if (!call) return res.status(404).render('apply/call_bad', { model });
  const appClass = call.appClass();
  if (!appClass) return res.status(404).render('apply/call_bad', { model });
  req.call = call;
  req.appClass = appClass;
  next();
}

router.get('/:model', loadCall, (req, res) => {
  const { call, appClass } = req;
  const late = req.query.late != null;
  const preview = req.query.preview != null;

  // Original: call must be open — unless late and authenticated.
  if (!(call.open || (late && req.session.username))) {
    return res.status(403).render('apply/call_closed', { call });
  }

  res.render('apply/new', {
    call,
    appClass,
    values: {},
    errors: {},
    preview,
    late,
    currentUser: req.session.username,
    fields: buildFields(appClass, {}, {}),
    years: yearOptions(),
  });
});

router.post('/:model', loadCall, upload.single('resume'), (req, res) => {
  const { call, appClass } = req;
  const preview = req.query.preview != null || req.body.preview === 'Preview!';

  const raw = { ...req.body };
  if (req.file) raw.resume_file_name = req.file.filename;

  const values = appClass.coerce(raw);
  values.id = raw.id;
  const errors = appClass.validate(values);

  const render = (status) =>
    res.status(status).render('apply/new', {
      call,
      appClass,
      values,
      errors,
      preview,
      late: req.query.late != null,
      currentUser: req.session.username,
      fields: buildFields(appClass, values, errors),
      years: yearOptions(),
    });

  if (Object.keys(errors).length > 0) {
    // discard the uploaded file so it isn't orphaned
    if (req.file) fs.unlink(req.file.path, () => {});
    return render(422);
  }

  if (preview) {
    // Original: preview validates but does NOT save.
    return render(200);
  }

  values.created_at = new Date().toISOString();
  const { id } = appClass.create(values);
  res.redirect(`/${call.id}/thanks?id=${id}`);
});

router.get('/:model/thanks', loadCall, (req, res) => {
  res.render('apply/thanks', { call: req.call });
});

module.exports = router;
