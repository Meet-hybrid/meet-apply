/**
 * call.js — a "call for applications" (original: app/models/call.rb).
 *
 * Each Call has an id matching an application model name ('student', 'fellow',
 * 'instructor', 'business') and knows how to resolve its application model.
 */
const { BaseModel } = require('./base');
const { db } = require('../config/db');
const student = require('./student');
const fellow = require('./fellow');
const instructor = require('./instructor');
const business = require('./business');
const instructorReview = require('./instructor_review');

const APPLICATION_MODELS = { student, fellow, instructor, business };

class Call extends BaseModel {
  constructor() {
    super('calls', [
      { name: 'id', type: 'string', label: 'ID', required: true },
      { name: 'open', type: 'boolean', label: 'Open' },
      { name: 'reviewable', type: 'boolean', label: 'Reviewable' },
      { name: 'title', type: 'string', label: 'Title' },
      { name: 'description', type: 'text', label: 'Description' },
      { name: 'deadline', type: 'date', label: 'Deadline' },
      { name: 'identity_columns', type: 'string', label: 'Identity columns' },
    ]);
  }

  static all() {
    return db.prepare('SELECT * FROM calls ORDER BY id').all();
  }

  static find(id) {
    return db.prepare('SELECT * FROM calls WHERE id = ?').get(id) || null;
  }

  static create(data) {
    const info = db
      .prepare(
        'INSERT INTO calls (id, open, reviewable, title, description, deadline, identity_columns) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .run(
        data.id,
        data.open ? 1 : 0,
        data.reviewable ? 1 : 0,
        data.title,
        data.description,
        data.deadline || null,
        data.identity_columns || null
      );
    return info.lastInsertRowid;
  }

  static update(id, data) {
    db.prepare(
      'UPDATE calls SET open = ?, reviewable = ?, title = ?, description = ?, deadline = ?, identity_columns = ? WHERE id = ?'
    ).run(
      data.open ? 1 : 0,
      data.reviewable ? 1 : 0,
      data.title,
      data.description,
      data.deadline || null,
      data.identity_columns || null,
      id
    );
  }

  /** The application model class for this call ('student' → Student). */
  appClass() {
    return APPLICATION_MODELS[this.id] || null;
  }

  /** The review model class for this call, if reviews exist. */
  reviewClass() {
    if (this.id === 'instructor') return instructorReview;
    return null;
  }

  /** Space-separated identity columns (original: identity_columns_a). */
  identityColumnsA() {
    const cols = this.identity_columns || this.appClass().columns.find((c) => c.type !== 'text' && c.type !== 'paperclip' && c.name !== 'created_at').name;
    return String(cols).split(/\s+/).filter(Boolean);
  }

  /** Identifying string for an application row (original: identify). */
  identify(app) {
    return this.identityColumnsA()
      .map((c) => (app[c] == null ? '' : String(app[c])))
      .join(' ');
  }
}

module.exports = Call;
