/**
 * mentor.js — MEET Mentor applications.
 *
 * A brand-new application type added as a learning example.
 * Models are pure metadata: each column's { type, label, validation flags }
 * drives the form, DB writes, review view, and CSV export automatically.
 */
const { BaseModel } = require('./base');

const AVAILABILITY = [
  '1-2 hours/week',
  '3-5 hours/week',
  '10+ hours/week',
  'Full summer',
];

class Mentor extends BaseModel {
  constructor() {
    super('mentors', [
      { name: 'first_name', type: 'string', label: 'First name', required: true },
      { name: 'last_name', type: 'string', label: 'Last name', required: true },
      { name: 'email', type: 'string', label: 'Email address', required: true, email: true },
      { name: 'current_role', type: 'string', label: 'Current role' },
      { name: 'organization', type: 'string', label: 'Organization / company' },
      { name: 'years_experience', type: 'integer', label: 'Years of experience' },
      { name: 'expertise_areas', type: 'text', label: 'Areas of expertise (e.g. web development, data science, product)' },
      { name: 'why_mentor', type: 'text', label: 'Why do you want to mentor MEET students?', required: true },
      { name: 'availability', type: 'string', label: 'Availability', options: AVAILABILITY },
      { name: 'linkedin', type: 'string', label: 'LinkedIn profile URL' },
      { name: 'created_at', type: 'text' },
    ]);
  }
}

module.exports = new Mentor();
