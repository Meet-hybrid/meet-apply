/**
 * export.js — CSV export of submitted applications (original: export_controller.rb).
 * Export columns exclude long-text blocks and resumes, like the original.
 */
const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middleware/auth');
const Call = require('../models/call');

router.use(requireLogin);

function csvCell(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

router.get('/:model', (req, res) => {
  const call = Call.find(req.params.model);
  if (!call) return res.status(404).send('Unknown application type');
  const appClass = call.appClass();
  if (!appClass) return res.status(404).send('Unknown application type');

  const cols = appClass.exportColumns();
  const apps = appClass.list();
  const header = cols.map((c) => appClass.labelOf(c));
  const rows = apps.map((app) => cols.map((c) => csvCell(app[c.name])));

  const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${call.id}-applications.csv"`);
  res.send('\uFEFF' + csv); // BOM so Excel opens UTF-8 correctly
});

module.exports = router;
