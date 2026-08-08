/**
 * base.js — generic model used by all application models.
 *
 * Each model is defined as *metadata* (column definitions + validation flags)
 * that mirror the original Rails models in meet/apply. This base class provides:
 *
 *   - CRUD against SQLite (node:sqlite, prepared statements)
 *   - formColumns() / exportColumns() so forms and CSV export render themselves
 *   - validate(data) replicating the original Rails validators:
 *       required   → validates_presence_of
 *       options    → validates_inclusion_of
 *       length     → validates_length_of(:is => n)
 *       unique     → validates_uniqueness_of
 *       email      → validates_format_of (email regex)
 *       accept     → validates_acceptance_of
 *       attachment → validates_attachment_presence (file required)
 *       suggest    → validates_presence_of with a suggestion list (+ '-Other-')
 */
const { db } = require('../config/db');

const EMAIL_RE = /^([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})$/i;

class BaseModel {
  constructor(table, columns) {
    this.table = table;
    this.columns = columns; // [{ name, type, label, section?, options?, suggest?, required?, length?, unique?, email?, accept?, attachment?, yearOnly? }]
  }

  /** Column metadata shown in forms (everything except created_at). */
  formColumns() {
    return this.columns.filter((c) => c.name !== 'created_at');
  }

  /** Column metadata included in CSV exports (no text blocks or resumes). */
  exportColumns() {
    return this.formColumns().filter((c) => c.type !== 'text' && c.type !== 'paperclip');
  }

  /** Human label for a column. */
  labelOf(c) {
    return c.label || c.name.replace(/_/g, ' ');
  }

  // ---- SQLite helpers -------------------------------------------------------

  list(orderBy = 'id') {
    return db.prepare(`SELECT * FROM ${this.table} ORDER BY ${orderBy}`).all();
  }

  find(id) {
    return db.prepare(`SELECT * FROM ${this.table} WHERE id = ?`).get(id);
  }

  count() {
    return db.prepare(`SELECT COUNT(*) AS n FROM ${this.table}`).get().n;
  }

  /** Coerce raw form params into DB-ready values for this model's columns. */
  coerce(data) {
    const out = {};
    for (const c of this.formColumns()) {
      if (c.name === 'resume_file_name') {
        // file uploads handled separately by the route
        if (data.resume_file_name) out.resume_file_name = data.resume_file_name;
        continue;
      }
      if (!(c.name in data)) continue;
      const raw = data[c.name];
      switch (c.type) {
        case 'integer':
          out[c.name] = raw === '' || raw == null ? null : Number(raw);
          break;
        case 'boolean':
          // checkbox: '1'/'on'/true when checked
          out[c.name] = raw === '1' || raw === 'on' || raw === true ? 1 : 0;
          break;
        case 'date':
          out[c.name] = raw === '' || raw == null ? null : raw;
          break;
        default:
          out[c.name] = raw;
      }
    }
    return out;
  }

  create(data) {
    const cols = Object.keys(data);
    const placeholders = cols.map(() => '?').join(', ');
    const values = cols.map((c) => (data[c] === undefined ? null : data[c]));
    const info = db
      .prepare(`INSERT INTO ${this.table} (${cols.join(', ')}) VALUES (${placeholders})`)
      .run(...values);
    return { id: Number(info.lastInsertRowid) };
  }

  update(id, data) {
    const cols = Object.keys(data);
    if (cols.length === 0) return;
    const sets = cols.map((c) => `${c} = ?`).join(', ');
    const values = cols.map((c) => (data[c] === undefined ? null : data[c]));
    db.prepare(`UPDATE ${this.table} SET ${sets} WHERE id = ?`).run(...values, id);
  }

  destroy(id) {
    db.prepare(`DELETE FROM ${this.table} WHERE id = ?`).run(id);
  }

  /** All rows' values for the given column names (used by export/visualize). */
  pluck(ids, column) {
    if (ids.length === 0) return [];
    const marks = ids.map(() => '?').join(', ');
    return db
      .prepare(`SELECT id, ${column} AS value FROM ${this.table} WHERE id IN (${marks})`)
      .all(...ids);
  }

  // ---- Validation (mirrors the original Rails models) ----------------------

  /**
   * Returns { fieldName: 'human message', ... } for invalid data, {} if valid.
   */
  validate(data) {
    const errors = {};
    for (const c of this.formColumns()) {
      if (c.name === 'resume_file_name') {
        if (c.attachment && !data.resume_file_name) {
          errors.resume_file_name = 'must be attached';
        }
        continue;
      }
      const label = this.labelOf(c);
      const val = data[c.name];

      // presence / acceptance
      if (c.accept) {
        if (!(val === '1' || val === 'on' || val === true || val === 1)) {
          errors[c.name] = `${label} must be given`;
        }
        continue;
      }
      const blank = val === undefined || val === null || val === '';
      if (c.required && blank) {
        errors[c.name] = `${label} can't be blank`;
        continue;
      }
      if (blank) continue;

      // inclusion (fixed option set)
      if (c.options && !c.options.map(String).includes(String(val))) {
        errors[c.name] = `${label} is not included in the list`;
        continue;
      }

      // suggestion list (must be one of the choices, or -Other-)
      if (c.suggest && !c.suggest.includes(String(val)) && String(val) !== '-Other-') {
        errors[c.name] = `${label} must be one of the choices, or -Other-`;
        continue;
      }

      // length
      if (c.length && String(val).length !== c.length) {
        errors[c.name] = `${label} should be ${c.length} digits long`;
        continue;
      }

      // email format
      if (c.email && !EMAIL_RE.test(String(val))) {
        errors[c.name] = `${label} is invalid`;
        continue;
      }

      // uniqueness
      if (c.unique && val !== '' && val != null) {
        const row = db
          .prepare(`SELECT id FROM ${this.table} WHERE ${c.name} = ?`)
          .get(val);
        if (row && (!data.id || Number(row.id) !== Number(data.id))) {
          errors[c.name] = `${label} has already been taken`;
        }
      }
    }
    return errors;
  }
}

module.exports = { BaseModel, EMAIL_RE };
