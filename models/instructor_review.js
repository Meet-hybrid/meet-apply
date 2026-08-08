/**
 * instructor_review.js — Reviews of instructor applications
 * (original: app/models/instructor_review.rb + app/models/review.rb).
 *
 * Review scales (from the original):
 *   enthusiasm 1–5 · programming 1–5 or '?' · teaching 1–5 · teamwork 1–3 · overall 1–7
 *   y1 / y2 / y3 / interview are yes/no flags · comment is free text
 */
const { BaseModel } = require('./base');
const { db } = require('../config/db');

class InstructorReview extends BaseModel {
  constructor() {
    super('instructor_reviews', [
      { name: 'app_reviewer_id', type: 'string', label: 'Reviewer', required: true },
      { name: 'app_id', type: 'integer', label: 'Application', required: true },
      { name: 'enthusiasm', type: 'integer', label: 'Enthusiasm', options: [1, 2, 3, 4, 5] },
      { name: 'programming', type: 'string', label: 'Programming', options: ['1', '2', '3', '4', '5', '?'] },
      { name: 'teaching', type: 'integer', label: 'Teaching', options: [1, 2, 3, 4, 5] },
      { name: 'teamwork', type: 'integer', label: 'Teamwork', options: [1, 2, 3] },
      { name: 'overall', type: 'integer', label: 'Overall', options: [1, 2, 3, 4, 5, 6, 7] },
      { name: 'y1', type: 'boolean', label: 'Y1?' },
      { name: 'y2', type: 'boolean', label: 'Y2?' },
      { name: 'y3', type: 'boolean', label: 'Y3?' },
      { name: 'interview', type: 'boolean', label: 'Interview?' },
      { name: 'comment', type: 'text', label: 'Comment' },
      { name: 'created_at', type: 'text' },
    ]);
  }

  /** Find a reviewer's review of an app, or a blank object if none exists. */
  findOrInit(reviewer, appId) {
    return (
      db
        .prepare('SELECT * FROM instructor_reviews WHERE app_reviewer_id = ? AND app_id = ?')
        .get(reviewer, appId) || { app_reviewer_id: reviewer, app_id: appId }
    );
  }

  /** All reviews for an app. */
  forApp(appId) {
    return db.prepare('SELECT * FROM instructor_reviews WHERE app_id = ? ORDER BY app_reviewer_id').all(appId);
  }

  /** Save (insert or update) a review for reviewer+app. */
  save(review) {
    const existing = db
      .prepare('SELECT id FROM instructor_reviews WHERE app_reviewer_id = ? AND app_id = ?')
      .get(review.app_reviewer_id, review.app_id);
    const data = this.coerce(review);
    data.app_reviewer_id = review.app_reviewer_id;
    data.app_id = review.app_id;
    if (existing) {
      this.update(existing.id, data);
      return existing.id;
    }
    return this.create(data).id;
  }

  /**
   * Summary of all reviews for an app (original Review.summarize):
   *   integer column → average (0 reviews → 0)
   *   boolean column → percent true (0 reviews → 0)
   *   other column   → { reviewer: value } map
   * Returns null when there are no reviews.
   */
  summarize(app) {
    const reviews = this.forApp(app.id);
    if (reviews.length === 0) return null;

    const summary = { app };
    for (const c of this.formColumns()) {
      const nonempty = reviews.filter(
        (r) => r[c.name] !== null && r[c.name] !== undefined && r[c.name] !== ''
      );
      switch (c.type) {
        case 'integer':
          summary[c.name] =
            nonempty.length === 0
              ? 0
              : nonempty.reduce((s, r) => s + Number(r[c.name]), 0) / nonempty.length;
          break;
        case 'boolean':
          summary[c.name] =
            nonempty.length === 0
              ? 0
              : nonempty.filter((r) => r[c.name]).length / nonempty.length;
          break;
        default:
          summary[c.name] = Object.fromEntries(
            nonempty.map((r) => [r.app_reviewer_id, r[c.name]])
          );
      }
    }
    return summary;
  }

  /** Numeric columns that get summarized to a number (for visualizations). */
  numericSummaryColumns() {
    return this.formColumns().filter((c) => c.type === 'integer' || c.type === 'boolean');
  }

  /** True when all non-optional scale columns are answered. */
  isComplete(review) {
    for (const c of this.formColumns()) {
      if (c.type !== 'integer') continue;
      if (!c.options) continue;
      const allowsQuestion = c.options.map(String).includes('?');
      if (allowsQuestion) continue;
      const v = review[c.name];
      if (v === null || v === undefined || v === '') return false;
    }
    return true;
  }
}

module.exports = new InstructorReview();
