/**
 * models.test.js — unit tests for the model layer.
 *
 * Covers:
 *   - Student validations (required fields, ID length/uniqueness, email,
 *     gender inclusion, city/school suggestions, parental permission)
 *   - Fellow / Instructor / Business validations (incl. graduation_year
 *     required-unless-Grad-student)
 *   - base model CRUD (create/find/update/count/destroy)
 *   - InstructorReview summarize() math and numeric summary columns
 *   - Call model methods (appClass, reviewClass, identify)
 */
const test = require('node:test');
const assert = require('node:assert/strict');

const { setupTestDb, teardownTestDb } = require('./helpers');
const { dir } = setupTestDb(); // must run before requiring config/db

const { seedAll } = require('../db/seed');
const student = require('../models/student');
const fellow = require('../models/fellow');
const instructor = require('../models/instructor');
const business = require('../models/business');
const review = require('../models/instructor_review');
const Call = require('../models/call');

test.after(() => teardownTestDb(dir));

// ---------------------------------------------------------------------------
// Student validations
// ---------------------------------------------------------------------------

test('student: rejects a blank application', () => {
  const errors = student.validate({});
  assert.ok(errors._student_first_name, 'first name required');
  assert.ok(errors._student_last_name, 'last name required');
  assert.ok(errors._student_id_number, 'id number required');
  assert.ok(errors._student_email, 'email required');
  assert.ok(errors._parent_full_name, 'parent name required');
  assert.ok(errors._permission_to_apply, 'permission must be given');
});

test('student: ID number must be exactly 9 digits', () => {
  const errors = student.validate({
    _student_first_name: 'A', _student_last_name: 'B',
    _student_id_number: '12345', _student_email: 'a@b.com',
    _parent_full_name: 'P', _permission_to_apply: '1',
  });
  assert.ok(errors._student_id_number.includes('9 digits'), 'short id rejected');
});

test('student: invalid email is rejected', () => {
  const errors = student.validate({
    _student_first_name: 'A', _student_last_name: 'B',
    _student_id_number: '123456789', _student_email: 'not-an-email',
    _parent_full_name: 'P', _permission_to_apply: '1',
  });
  assert.ok(errors._student_email, 'bad email rejected');
});

test('student: gender must be Male or Female', () => {
  const base = {
    _student_first_name: 'A', _student_last_name: 'B',
    _student_id_number: '123456789', _student_email: 'a@b.com',
    _parent_full_name: 'P', _permission_to_apply: '1',
  };
  assert.ok(student.validate({ ...base, _student_gender: 'Other' })._student_gender);
  assert.equal(student.validate({ ...base, _student_gender: 'Female' })._student_gender, undefined);
});

test('student: city and school must be from suggestions or -Other-', () => {
  const base = {
    _student_first_name: 'A', _student_last_name: 'B',
    _student_id_number: '123456789', _student_email: 'a@b.com',
    _parent_full_name: 'P', _permission_to_apply: '1',
  };
  assert.ok(student.validate({ ...base, _student_city: 'Atlantis' })._student_city);
  assert.ok(student.validate({ ...base, _student_city: 'Jerusalem' })._student_city === undefined);
  assert.ok(student.validate({ ...base, _student_city: '-Other-' })._student_city === undefined);
  assert.ok(student.validate({ ...base, _student_school: 'Leyada' })._student_school === undefined);
});

test('student: duplicate ID number is rejected', () => {
  const { id } = student.create({
    _student_first_name: 'One', _student_last_name: 'Two',
    _student_id_number: '111222333', _student_gender: 'Male',
    _student_email: 'one@b.com', _parent_full_name: 'P',
    _permission_to_apply: 1, created_at: new Date().toISOString(),
  });
  assert.ok(id > 0);
  const errors = student.validate({
    _student_first_name: 'Another', _student_last_name: 'Person',
    _student_id_number: '111222333', _student_email: 'two@b.com',
    _parent_full_name: 'P', _permission_to_apply: '1',
  });
  assert.ok(errors._student_id_number.includes('already been taken'));
});

test('student: fully valid application has no errors', () => {
  const errors = student.validate({
    _student_first_name: 'Yara', _student_last_name: 'Haddad',
    _student_id_number: '309182771', _student_gender: 'Female',
    _student_city: 'Jerusalem', _student_school: 'Schmidt for girls',
    _student_email: 'yara@example.com', _parent_full_name: 'Leila Haddad',
    _parent_email: 'leila@example.com', _permission_to_apply: '1',
  });
  assert.deepEqual(errors, {});
});

// ---------------------------------------------------------------------------
// Fellow / Instructor / Business
// ---------------------------------------------------------------------------

test('fellow: requires core fields and email format', () => {
  const errors = fellow.validate({ first_name: '', email: 'nope' });
  assert.ok(errors.first_name);
  assert.ok(errors.last_name);
  assert.ok(errors.major);
  assert.ok(errors.affiliation);
  assert.ok(errors.why_fellow);
  assert.ok(errors.email);
});

test('instructor: graduation_year required unless Grad student', () => {
  const base = {
    first_name: 'S', last_name: 'L', email: 's@b.com', major: 'CS',
    status: 'Undergraduate', why_meet: 'reason', resume_file_name: 'r.pdf',
  };
  assert.ok(instructor.validate(base).graduation_year, 'undergrad needs grad year');
  assert.equal(
    instructor.validate({ ...base, status: 'Grad student' }).graduation_year,
    undefined,
    'grad student exempt'
  );
});

test('instructor: status must be from the allowed list', () => {
  const base = {
    first_name: 'S', last_name: 'L', email: 's@b.com', major: 'CS',
    status: 'Undergraduate', why_meet: 'reason', resume_file_name: 'r.pdf',
  };
  assert.ok(instructor.validate({ ...base, status: 'Something else' }).status);
});

test('business: requires core fields', () => {
  const errors = business.validate({});
  assert.ok(errors.first_name);
  assert.ok(errors.last_name);
  assert.ok(errors.major);
  assert.ok(errors.graduation_year);
  assert.ok(errors.why_meet);
});

// ---------------------------------------------------------------------------
// Base model CRUD
// ---------------------------------------------------------------------------

test('base: create, find, count, update, destroy', () => {
  const before = fellow.count();
  const { id } = fellow.create({
    first_name: 'Test', last_name: 'Fellow', email: 'tf@b.com',
    major: 'X', affiliation: 'Y', why_fellow: 'w', resume_file_name: 'r.pdf',
    created_at: new Date().toISOString(),
  });
  assert.equal(fellow.count(), before + 1);
  const row = fellow.find(id);
  assert.equal(row.first_name, 'Test');
  fellow.update(id, { first_name: 'Updated' });
  assert.equal(fellow.find(id).first_name, 'Updated');
  fellow.destroy(id);
  assert.equal(fellow.find(id), undefined);
});

// ---------------------------------------------------------------------------
// InstructorReview summarize
// ---------------------------------------------------------------------------

test('review: summarize averages integers and percentages booleans', () => {
  const app = instructor.create({
    first_name: 'R', last_name: 'V', email: 'rv@b.com', major: 'CS',
    status: 'Undergraduate', why_meet: 'w', resume_file_name: 'r.pdf',
    created_at: new Date().toISOString(),
  });
  review.save({ app_reviewer_id: 'alice', app_id: app.id, enthusiasm: 2, programming: '4', teaching: 3, teamwork: 1, overall: 4, y1: 1, y2: 0 });
  review.save({ app_reviewer_id: 'bob', app_id: app.id, enthusiasm: 4, programming: '5', teaching: 5, teamwork: 2, overall: 6, y1: 1, y2: 1 });

  const s = review.summarize(instructor.find(app.id));
  assert.ok(s, 'summary exists');
  assert.equal(s.enthusiasm, 3, 'average of 2 and 4');
  assert.equal(s.teaching, 4, 'average of 3 and 5');
  assert.equal(s.y1, 1, '100% true');
  assert.equal(s.y2, 0.5, '50% true');
  assert.deepEqual(s.programming, { alice: '4', bob: '5' }, 'text-ish values map to reviewers');
});

test('review: summarize returns null with no reviews', () => {
  const app = instructor.create({
    first_name: 'N', last_name: 'R', email: 'nr@b.com', major: 'CS',
    status: 'Undergraduate', why_meet: 'w', resume_file_name: 'r.pdf',
    created_at: new Date().toISOString(),
  });
  assert.equal(review.summarize(instructor.find(app.id)), null);
});

test('review: numeric summary columns exclude app_id / app_reviewer_id', () => {
  const names = review.numericSummaryColumns().map((c) => c.name);
  assert.ok(names.includes('enthusiasm'));
  assert.ok(names.includes('overall'));
  assert.ok(!names.includes('app_id'));
  assert.ok(!names.includes('app_reviewer_id'));
});

test('review: save() updates instead of duplicating for same reviewer+app', () => {
  const app = instructor.create({
    first_name: 'U', last_name: 'P', email: 'up@b.com', major: 'CS',
    status: 'Undergraduate', why_meet: 'w', resume_file_name: 'r.pdf',
    created_at: new Date().toISOString(),
  });
  review.save({ app_reviewer_id: 'carol', app_id: app.id, enthusiasm: 1 });
  review.save({ app_reviewer_id: 'carol', app_id: app.id, enthusiasm: 5 });
  assert.equal(review.forApp(app.id).length, 1, 'only one review row');
  assert.equal(review.forApp(app.id)[0].enthusiasm, 5);
});

// ---------------------------------------------------------------------------
// Call model
// ---------------------------------------------------------------------------

test('call: resolves app and review classes, identifies applications', () => {
  seedAll();
  const call = Call.find('student');
  assert.equal(call.appClass().table, 'students');
  assert.equal(call.identityColumnsA().join(' '), '_student_first_name _student_last_name');
  assert.equal(call.identify({ _student_first_name: 'Yara', _student_last_name: 'Haddad' }), 'Yara Haddad');

  const instCall = Call.find('instructor');
  assert.equal(instCall.reviewClass().table, 'instructor_reviews');
  assert.equal(Call.find('student').reviewClass(), null);
});
